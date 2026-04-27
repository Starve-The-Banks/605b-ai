import { CLASSIFICATIONS, FINDING_CATEGORIES_V1 } from './types.js';

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

    if (cls === CLASSIFICATIONS.HIGH_PRIORITY && finalConfidence >= 0.75) {
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
      issue,
      evidence_quote: item.span?.text || '',
      statute,
      recommendation,
      reason,
      reasoning: reason,
      successLikelihood: successLikelihoodFor(category, suspectedFlag),
    };

    if (!enriched.evidence_quote || enriched.evidence_quote.length < 3) {
      suppressions.push({ itemId: item.itemId, stage: 'validate', reason: 'empty_source_span' });
      continue;
    }
    if (!enriched.bureau && !enriched.source) {
      suppressions.push({ itemId: item.itemId, stage: 'validate', reason: 'missing_bureau_and_source' });
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
  return item.accountName || item.creditor || item.recordType || item.furnisher || item.source || 'Report item';
}

function successLikelihoodFor(category, suspectedFlag) {
  if (suspectedFlag) return 'Review only';
  if (category === FINDING_CATEGORIES_V1.HIGH_PRIORITY_ISSUE) return 'Strong';
  if (category === FINDING_CATEGORIES_V1.POTENTIAL_ISSUE) return 'Moderate';
  return 'Review only';
}
