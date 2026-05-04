import { CLASSIFICATIONS, FINDING_CATEGORIES_V1, OPERATIONAL_SUBTYPE } from './types.js';
import {
  getOperationalTemplate,
  containsForbiddenWord,
  containsSafeActionPhrase,
} from './operationalTemplates.js';

/**
 * Build the final v1-compatible finding list from classified items + LLM
 * annotations. Enforces the hard invariants:
 *   - Every finding's itemId must come from the deterministic Stage-1 set.
 *   - Every finding's evidence_quote === source span text (no LLM drift).
 *   - The LLM cannot promote a non-candidate item; only annotate.
 *   - Confidence < 0.75 always demotes to review_only (or marks suspected_uncertain).
 *
 * @param {Object} args
 * @param {import('./types.js').ClassifiedItem[]} args.classified
 * @param {Map<string, import('./llmEnrich.js').EnrichmentAnnotation>} args.annotations
 * @returns {{
 *   findings: import('./types.js').EnrichedFinding[],
 *   reviewOnly: import('./types.js').EnrichedFinding[],
 *   suspectedUncertain: import('./types.js').EnrichedFinding[],
 *   suppressions: Array<{ itemId: string, stage: string, reason: string }>
 * }}
 */
export function buildValidatedFindings({ classified, annotations }) {
  const findings = [];
  const reviewOnly = [];
  const suspectedUncertain = [];
  const suppressions = [];

  let findingIndex = 0;

  for (const item of classified) {
    const cls = item.classification;
    const isOperational = item.subtype === OPERATIONAL_SUBTYPE;
    const alwaysEmitFinding = !isOperational && (item.emitAsFinding === true || isTradelineLike(item));
    const isCandidate =
      alwaysEmitFinding ||
      cls === CLASSIFICATIONS.ACTIONABLE ||
      cls === CLASSIFICATIONS.HIGH_PRIORITY ||
      cls === CLASSIFICATIONS.SUSPECTED_UNCERTAIN ||
      cls === CLASSIFICATIONS.REVIEW_ONLY;
    if (!isCandidate) continue;

    const annotation = annotations.get(item.itemId);
    const enrichConfidence = annotation?.confidence ?? null;
    const finalConfidence = pickConfidence(item.classifierConfidence, enrichConfidence);

    const issue = annotation?.issue || defaultIssueForRule(item);
    const reason = annotation?.reason || item.classifierReason;
    const recommendation = annotation?.recommendation || defaultRecommendation(item);
    const statute = annotation?.statute || '';

    let category;
    let suspectedFlag = false;
    let severity;

    if (isOperational) {
      // Hard invariant: operational blockers can never be promoted to
      // potential/high_priority regardless of LLM-returned confidence.
      // They are review_only, full stop. The validator suppresses any
      // attempt to elevate them.
      if (cls !== CLASSIFICATIONS.REVIEW_ONLY) {
        suppressions.push({
          itemId: item.itemId,
          stage: 'validate',
          reason: 'operational_promotion_blocked',
        });
      }
      category = FINDING_CATEGORIES_V1.REVIEW_ONLY;
      severity = 'low';
    } else if (cls === CLASSIFICATIONS.HIGH_PRIORITY && finalConfidence >= 0.75) {
      category = FINDING_CATEGORIES_V1.HIGH_PRIORITY_ISSUE;
      severity = 'high';
    } else if (cls === CLASSIFICATIONS.ACTIONABLE && finalConfidence >= 0.75) {
      category = FINDING_CATEGORIES_V1.POTENTIAL_ISSUE;
      severity = 'medium';
    } else if (alwaysEmitFinding) {
      category = FINDING_CATEGORIES_V1.INFORMATIONAL;
      severity = 'low';
    } else if (cls === CLASSIFICATIONS.SUSPECTED_UNCERTAIN ||
      (cls !== CLASSIFICATIONS.REVIEW_ONLY && finalConfidence < 0.75)) {
      category = FINDING_CATEGORIES_V1.REVIEW_ONLY;
      suspectedFlag = true;
      severity = 'low';
    } else {
      category = FINDING_CATEGORIES_V1.REVIEW_ONLY;
      severity = 'low';
    }

    findingIndex += 1;
    const accountContext = accountContextForItem(item);
    const displayTitle = displayTitleForItem(item, accountContext);
    const displaySubtitle = displaySubtitleForItem(item, accountContext);
    const template = recommendedTemplateForItem(item, { issue, statute, accountContext, displayTitle });
    const enriched = {
      id: `finding-${findingIndex}`,
      accountId: item.itemId,
      itemId: item.itemId,
      type: typeForItem(item),
      issueType: issueTypeForItem(item),
      category,
      suspectedUncertain: suspectedFlag,
      severity,
      confidence: finalConfidence,
      bureau: item.bureau || '',
      source: item.source || item.bureau || '',
      account: displayTitle,
      accountName: accountContext.accountName || displayTitle,
      accountMask: accountContext.accountNumberMasked || '',
      creditorName: accountContext.creditorName ||
        accountContext.furnisherName ||
        accountContext.companyName ||
        accountContext.collectorName ||
        accountContext.inquiryBy ||
        '',
      accountContext,
      displayTitle,
      displaySubtitle,
      issue,
      evidence_quote: item.span?.text || '',
      statute,
      recommendation,
      recommendedTemplateId: template.templateId,
      recommendedTemplateReason: template.reason,
      recommendedTemplate: template.recommendedTemplate,
      reason,
      reasoning: reason,
      successLikelihood: successLikelihoodFor(category, suspectedFlag),
    };
    const creditor = creditorForItem(item);
    if (creditor) enriched.creditor = creditor;
    const balance = parseMoney(item.balance || item.pastDue || item.amountOwed);
    if (balance > 0) enriched.balance = balance;
    if (item.subtype) enriched.subtype = item.subtype;

    if (isOperational) {
      enriched.subtype = OPERATIONAL_SUBTYPE;
      const tmpl = getOperationalTemplate(item.type);
      if (tmpl) {
        // Validate LLM-authored contextLine. It must satisfy ALL three:
        //   1. non-empty string ≤ 200 chars
        //   2. no OPERATIONAL_FORBIDDEN_WORDS (remove / delete / permanent)
        //   3. contain at least one type-appropriate safe-action phrase
        //      (e.g. "temporarily lift" for freeze, "extra verification" for
        //      fraud_alert). Otherwise we fall back to the template default.
        const llmContext = annotation?.contextLine;
        let rejectionReason = null;
        if (typeof llmContext !== 'string' || llmContext.trim().length === 0) {
          rejectionReason = null; // absent input — silently use default
        } else if (llmContext.length > 200) {
          rejectionReason = 'operational_context_line_too_long';
        } else if (containsForbiddenWord(llmContext)) {
          rejectionReason = 'operational_context_line_forbidden_word';
        } else if (!containsSafeActionPhrase(llmContext, item.type)) {
          rejectionReason = 'operational_context_line_missing_safe_phrase';
        }
        const llmContextOk = typeof llmContext === 'string' && rejectionReason === null && llmContext.trim().length > 0;
        const contextLine = llmContextOk ? llmContext.trim() : tmpl.defaultContextLine;
        if (rejectionReason) {
          suppressions.push({
            itemId: item.itemId,
            stage: 'validate',
            reason: rejectionReason,
          });
        }
        enriched.operationalGuidance = {
          title: tmpl.title,
          message: tmpl.message,
          contextLine,
          bureauInstructions: tmpl.bureauInstructions,
        };
        // Override issue / recommendation with template-derived copy so the
        // user-facing strings cannot include LLM-authored language.
        enriched.issue = tmpl.title;
        enriched.recommendation = contextLine;
        enriched.reason = item.classifierReason;
        enriched.reasoning = item.classifierReason;
        enriched.statute = '';
        enriched.severity = tmpl.severity;
        enriched.confidence = Math.max(enriched.confidence ?? 0, tmpl.confidence);
      }
    }

    if (!enriched.evidence_quote || enriched.evidence_quote.length < 3) {
      suppressions.push({ itemId: item.itemId, stage: 'validate', reason: 'empty_source_span' });
      continue;
    }
    if (!enriched.bureau && !enriched.source) {
      suppressions.push({ itemId: item.itemId, stage: 'validate', reason: 'missing_bureau_and_source' });
      continue;
    }
    if (isGarbageFinding(enriched, item)) {
      suppressions.push({ itemId: item.itemId, stage: 'validate', reason: 'garbage_fragment' });
      continue;
    }

    if (category === FINDING_CATEGORIES_V1.REVIEW_ONLY) {
      if (suspectedFlag) suspectedUncertain.push(enriched);
      else reviewOnly.push(enriched);
    } else {
      findings.push(enriched);
    }
  }

  // Validator: any LLM annotation pointing to an unknown itemId is suppressed.
  const knownIds = new Set(classified.map((c) => c.itemId));
  for (const annotation of annotations.values()) {
    if (!knownIds.has(annotation.itemId)) {
      suppressions.push({
        itemId: annotation.itemId,
        stage: 'validate',
        reason: 'llm_introduced_unknown_item',
      });
    }
  }

  return { findings, reviewOnly, suspectedUncertain, suppressions };
}

function pickConfidence(classifier, enrichment) {
  if (typeof enrichment === 'number' && Number.isFinite(enrichment)) {
    return Math.min(1, (classifier + enrichment) / 2);
  }
  return classifier;
}

function parseMoney(value) {
  if (!value) return 0;
  const normalized = String(value).replace(/[$,\s]/g, '');
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

function isTradelineLike(item) {
  return item.itemKind === 'account' || item.itemKind === 'collection' || item.itemKind === 'inquiry';
}

function creditorForItem(item) {
  const context = accountContextForItem(item);
  return context.creditorName ||
    context.furnisherName ||
    context.companyName ||
    context.accountName ||
    context.collectorName ||
    context.inquiryBy ||
    '';
}

function isGarbageFinding(finding, item) {
  if (item.itemKind !== 'account' && item.itemKind !== 'collection') return false;
  const account = String(finding.account || '').trim();
  const creditor = String(finding.creditor || '').trim();
  const label = account || creditor;
  if (!creditorForItem(item)) {
    const context = accountContextForItem(item);
    const hasEnoughContext = Boolean(context.accountType || context.status || context.accountNumberMasked || context.balance);
    return !hasEnoughContext && !isRawParserLabel(label);
  }
  if (label.length < 5) return true;
  const normalized = label.toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (/^(PO BOX|IA|ATTN)$/.test(normalized)) return true;
  if (/\b(PO BOX|ATTN)\b/.test(normalized)) return true;
  return false;
}

function defaultIssueForRule(item) {
  switch (item.classifierRule) {
    case 'collection.is_collection':
      return 'Account is reporting as a collection account.';
    case 'account.charge_off':
      return 'Account is reporting as a charge-off.';
    case 'account.late_payment':
      return 'Payment history shows a late payment.';
    case 'banking.account_abuse':
      return 'Banking item is reported for account abuse.';
    case 'banking.involuntary_closure':
      return 'Banking account was closed by the financial institution.';
    case 'public_record.present':
      return 'A public record is reported on the file.';
    case 'fraud.present':
      return 'A fraud or identity-theft marker is present.';
    case 'inquiry.fraud':
      return 'Inquiry contains fraud language and should be reviewed.';
    case 'inquiry.normal':
      return 'Inquiry on file — review for accuracy.';
    case 'account.uncertain_negative':
    case 'banking.uncertain_negative':
    case 'remark.negative':
      return 'Negative language detected; please verify manually.';
    default:
      return 'Item flagged for review.';
  }
}

function defaultRecommendation(item) {
  if (item.classification === CLASSIFICATIONS.HIGH_PRIORITY) {
    return 'Verify the reported details against your records before taking next steps.';
  }
  if (item.classification === CLASSIFICATIONS.ACTIONABLE) {
    return 'Review this item against your records and consider documenting your position.';
  }
  return 'Review this item for accuracy. No action required if it is correct.';
}

function typeForItem(item) {
  switch (item.itemKind) {
    case 'collection': return 'collection';
    case 'inquiry': return 'inquiry';
    case 'public_record': return 'public-record';
    case 'banking': return 'banking-history';
    case 'fraud': return 'identity';
    case 'remark': return 'other';
    case 'account': return 'accuracy';
    case 'personal_info': return 'personal-info';
    default: return 'other';
  }
}

function accountLabelForItem(item) {
  const context = accountContextForItem(item);
  return displayTitleForItem(item, context);
}

function displayTitleForItem(item, context = accountContextForItem(item)) {
  if (item.subtype === OPERATIONAL_SUBTYPE) {
    if (item.type === 'freeze') return 'Credit freeze detected';
    if (item.type === 'lock') return 'Credit lock detected';
    if (item.type === 'fraud_alert') return 'Fraud alert detected';
    if (item.type === 'extended_alert') return 'Extended fraud alert detected';
    if (item.type === 'active_duty_alert') return 'Active duty alert detected';
    if (item.type === 'consumer_statement') return 'Consumer statement on file';
  }
  const resolved = resolveAccountIdentity(item, context);
  if (resolved.isIdentified && !isRawParserLabel(resolved.displayTitle)) {
    return resolved.displayTitle;
  }
  if (/^Type[A-Z]/.test(resolved.displayTitle)) {
    return item.subtype === 'collection' ? 'Collection account' : humanCategoryForItem(item);
  }
  return resolved.displayTitle;
}

function displaySubtitleForItem(item, context = accountContextForItem(item)) {
  const resolved = resolveAccountIdentity(item, context);
  if (!resolved.isIdentified) {
    return resolved.displaySubtitle;
  }
  if (item.subtype === 'collection' || /collection/.test(String(item.classifierRule || ''))) {
    const acctPart = context.accountNumberMasked ? `acct ${context.accountNumberMasked}` : '';
    return acctPart ? `Collection account · ${acctPart}` : 'Collection account';
  }
  const parts = [
    context.accountType || humanCategoryForItem(item),
    context.accountNumberMasked ? `acct ${context.accountNumberMasked}` : '',
    context.status,
  ].filter(Boolean);
  if (parts.length > 0) return parts.join(' · ');
  return 'Specific account could not be identified from the report text';
}

function issueTypeForItem(item) {
  if (item.subtype === OPERATIONAL_SUBTYPE) return item.type || 'protective_setting';
  if (item.subtype === 'collection' || /collection/.test(String(item.classifierRule || ''))) {
    return 'collection.account_reported';
  }
  if (item.subtype) return item.subtype;
  if (item.classifierRule) return item.classifierRule;
  return typeForItem(item);
}

function recommendedTemplateForItem(item, { issue, statute, accountContext, displayTitle }) {
  const templateId = templateIdForItem(item, { issue, statute });
  const templateName = cleanTemplateName(templateNameForId(templateId));
  const appliesToDisplayName = displayTitle || 'Account needing review';
  const appliesToMaskedAccount = accountContext.accountNumberMasked || '';
  const reason = templateReasonForItem(item, templateName);
  return {
    templateId,
    reason,
    recommendedTemplate: {
      id: templateId,
      name: templateName,
      reason,
      appliesToAccountId: item.itemId,
      appliesToDisplayName,
      appliesToMaskedAccount,
    },
  };
}

function templateIdForItem(item, { issue = '', statute = '' } = {}) {
  const haystack = `${item.classifierRule || ''} ${item.subtype || ''} ${item.type || ''} ${issue} ${statute}`.toLowerCase();
  if (item.subtype === OPERATIONAL_SUBTYPE) {
    if (/freeze|lock/.test(haystack)) return 'id-theft-credit-freeze';
    if (/fraud_alert|extended_alert|active_duty_alert|consumer_statement/.test(haystack)) return 'id-theft-fraud-alert';
  }
  if (/balance/.test(haystack)) return '611-balance-dispute';
  if (/late/.test(haystack)) return '611-late-payment';
  if (/charge[_-\s]?off/.test(haystack)) return '611-charge-off';
  if (/collection/.test(haystack)) return 'fdcpa-809';
  if (/inquiry/.test(haystack)) return '611-inquiry-dispute';
  if (/public_record|public-record/.test(haystack)) return '611-public-record';
  if (/date/.test(haystack)) return '611-incorrect-date';
  if (/not.mine|account_not_mine|unknown/.test(haystack)) return '611-account-not-mine';
  return '611-standard';
}

function templateNameForId(templateId) {
  const names = {
    '605b-block': 'Identity Theft Block Request',
    'id-theft-credit-freeze': 'Credit Freeze Guidance',
    'id-theft-fraud-alert': 'Fraud Alert Guidance',
    '611-standard': 'Standard Dispute',
    '611-late-payment': 'Late Payment Dispute',
    '611-balance-dispute': 'Incorrect Balance Dispute',
    '611-account-not-mine': 'Account Not Mine Dispute',
    '611-duplicate-entry': 'Duplicate Entry Dispute',
    '611-closed-account': 'Closed Account Status Dispute',
    '611-incorrect-date': 'Incorrect Date Dispute',
    '611-personal-info': 'Personal Information Dispute',
    '611-inquiry-dispute': 'Unauthorized Inquiry Dispute',
    '611-public-record': 'Public Record Dispute',
    '611-charge-off': 'Charge-Off Dispute',
    '623-furnisher': 'Furnisher Direct Dispute',
    'fdcpa-809': 'Debt Validation Request',
  };
  return names[templateId] || 'Dispute Template';
}

function cleanTemplateName(value) {
  return String(value || '').replace(/^611\s+/i, '').trim();
}

function templateReasonForItem(item, templateName) {
  if (item.subtype === OPERATIONAL_SUBTYPE) return `${templateName} applies to this protective setting.`;
  return `${templateName} applies to this reported item.`;
}

function accountContextForItem(item) {
  const fields = item.fields || {};
  const accountNumberMasked = maskAccountNumber(
    item.accountNumber ||
    item.accountNumberMasked ||
    fields['Account Number'] ||
    fields['Account #'] ||
    fields['Acct #'] ||
    (item.accountNumberSuffix ? `****${item.accountNumberSuffix}` : ''),
  );
  const accountType = cleanContextValue(
    item.accountType ||
    item.loanType ||
    fields['Account Type'] ||
    fields.Type ||
    fields['Loan Type'],
    { allowParserLabel: true },
  );
  const balance = cleanContextValue(
    item.balance ||
    item.pastDue ||
    item.amountOwed ||
    item.unpaidBalance ||
    fields.Balance ||
    fields['Amount Owed'] ||
    fields['Unpaid Balance'] ||
    fields['Past Due'],
    { allowParserLabel: true },
  );

  return pruneEmpty({
    creditorName: cleanEntityName(item.originalCreditor),
    furnisherName: cleanEntityName(item.furnisher),
    companyName: cleanEntityName(item.creditor || fields.Company || fields['Source of Information'] || fields['Financial Institution']),
    accountName: cleanEntityName(item.accountName),
    collectorName: item.itemKind === 'collection' ? cleanEntityName(item.accountName || item.furnisher) : '',
    inquiryBy: item.itemKind === 'inquiry' ? cleanEntityName(item.creditor) : '',
    accountNumberMasked,
    accountType,
    status: cleanContextValue(item.status || item.paymentStatus || item.accountStatus || item.reportedFor || fields.Status || fields['Pay Status'] || fields['Reported For'], { allowParserLabel: true }),
    balance,
    openedDate: cleanContextValue(item.dateOpened || fields['Date Opened'] || fields.Opened, { allowParserLabel: true }),
    reportedDate: cleanContextValue(item.dateReported || item.dateAssigned || item.inquiryDate || fields['Date Reported'] || fields.Reported, { allowParserLabel: true }),
    sourceSection: cleanContextValue(item.source || item.bureau || item.itemKind, { allowParserLabel: true }),
    evidenceSnippet: normalizeEvidenceSnippet(item.sourceSpanNormalized || item.span?.text),
  });
}

function resolveAccountIdentity(item, context) {
  const fromEvidence = inferNameFromEvidence(context.evidenceSnippet || '');
  const name =
    context.creditorName ||
    context.furnisherName ||
    context.companyName ||
    context.collectorName ||
    fromEvidence;

  if (name && !isRawParserLabel(name)) {
    const subtitleParts = [
      context.accountType,
      context.accountNumberMasked ? `acct ${context.accountNumberMasked}` : '',
    ].filter(Boolean);
    return {
      displayTitle: name,
      displaySubtitle: subtitleParts.length > 0 ? subtitleParts.join(' · ') : 'Account identified from report',
      isIdentified: true,
    };
  }

  const fallbackTitle = item.subtype === 'collection' || /collection/.test(String(item.classifierRule || ''))
    ? 'Collection account'
    : humanCategoryForItem(item);

  return {
    displayTitle: fallbackTitle,
    displaySubtitle: 'Creditor could not be identified',
    isIdentified: false,
  };
}

function inferNameFromEvidence(text) {
  const match = String(text || '').match(
    /\b(?:Original Creditor|Creditor|Furnisher|Company|Account Name)\s*:\s*([A-Za-z0-9&.'/ -]{3,80})/i,
  );
  const candidate = String(match?.[1] || '').trim();
  if (!candidate || isRawParserLabel(candidate)) return '';
  return candidate;
}

function normalizeEvidenceSnippet(value) {
  return String(value || '')
    .replace(/\r/g, '\n')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .replace(/(\d)([A-Za-z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .replace(/\b(Account Type|Responsibility|Date Opened|Date Reported|Date Assigned|Status|Balance|Account Number|Payment Status|Remarks|Comments|Original Creditor)\b\s*:?\s*/gi, '\n$1: ')
    .replace(/\n+/g, '\n')
    .replace(/\n\s+/g, '\n')
    .trim()
    .slice(0, 600);
}

function pruneEmpty(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => typeof value === 'string' && value.trim().length > 0),
  );
}

function cleanEntityName(value) {
  const cleaned = cleanContextValue(value);
  if (!cleaned) return '';
  if (isRawParserLabel(cleaned)) return '';
  return cleaned;
}

function cleanContextValue(value, options = {}) {
  const maxLength = options.maxLength ?? 120;
  const cleaned = String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
  if (!cleaned) return '';
  if (!options.allowParserLabel && isRawParserLabel(cleaned)) return '';
  return cleaned;
}

function isRawParserLabel(value) {
  const normalized = String(value || '').replace(/[^A-Za-z]/g, '');
  if (!normalized) return true;
  if (/^(Type|AccountType|LoanType|PayStatus|PaymentStatus|AccountStatus|Status|Balance|DateOpened|DateReported)$/i.test(normalized)) {
    return true;
  }
  if (/^Type[A-Z]/.test(String(value || '').trim())) return true;
  if (/^(Type|Status|Balance|Account|Date|Pay)\b/i.test(String(value || '').trim()) && !/\s/.test(String(value || '').trim())) return true;
  return false;
}

function maskAccountNumber(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.includes('*')) return raw.replace(/\s+/g, ' ');
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 4) return `****${digits.slice(-4)}`;
  return '';
}

function humanCategoryForItem(item) {
  switch (item.itemKind) {
    case 'collection':
      return 'Collection account';
    case 'inquiry':
      return 'Inquiry needing review';
    case 'public_record':
      return 'Public record';
    case 'banking':
      return 'Banking item';
    case 'account':
      return 'Account needing review';
    default:
      return 'Unidentified account needing review';
  }
}

function successLikelihoodFor(category, suspectedFlag) {
  if (suspectedFlag) return 'Review only';
  if (category === FINDING_CATEGORIES_V1.INFORMATIONAL) return 'Informational';
  if (category === FINDING_CATEGORIES_V1.HIGH_PRIORITY_ISSUE) return 'Strong';
  if (category === FINDING_CATEGORIES_V1.POTENTIAL_ISSUE) return 'Moderate';
  return 'Review only';
}
