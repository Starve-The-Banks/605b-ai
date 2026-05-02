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
    const isCandidate =
      cls === CLASSIFICATIONS.ACTIONABLE ||
      cls === CLASSIFICATIONS.HIGH_PRIORITY ||
      cls === CLASSIFICATIONS.SUSPECTED_UNCERTAIN ||
      cls === CLASSIFICATIONS.REVIEW_ONLY;
    if (!isCandidate) continue; // positive / neutral are dropped from output

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
    const enriched = {
      id: `finding-${findingIndex}`,
      itemId: item.itemId,
      type: typeForItem(item),
      category,
      suspectedUncertain: suspectedFlag,
      severity,
      confidence: finalConfidence,
      bureau: item.bureau || '',
      source: item.source || item.bureau || '',
      account: accountLabelForItem(item),
      accountContext: accountContextForItem(item),
      issue,
      evidence_quote: item.span?.text || '',
      statute,
      recommendation,
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
  return context.creditorName ||
    context.furnisherName ||
    context.companyName ||
    context.accountName ||
    context.collectorName ||
    context.inquiryBy ||
    context.accountNumberMasked ||
    humanCategoryForItem(item) ||
    'Unidentified account needing review';
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
    evidenceSnippet: cleanContextValue(item.span?.text, { allowParserLabel: true, maxLength: 500 }),
  });
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
  if (category === FINDING_CATEGORIES_V1.HIGH_PRIORITY_ISSUE) return 'Strong';
  if (category === FINDING_CATEGORIES_V1.POTENTIAL_ISSUE) return 'Moderate';
  return 'Review only';
}
