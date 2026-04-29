import { detectConsumerReportType } from '@/lib/creditReportAnalysis';
import { extractCreditBureauReport } from './extractors/creditBureau.js';
import { extractExperianReport, matchesExperianReport } from './extractors/experian.js';
import { extractEquifaxReport, matchesEquifaxReport } from './extractors/equifax.js';
import { extractTransUnionReport, matchesTransUnionReport } from './extractors/transunion.js';
import { extractMergedCreditReport, matchesMergedCreditReport } from './extractors/mergedCredit.js';
import { extractChexReport } from './extractors/chex.js';
import { extractEwsReport } from './extractors/ews.js';

/**
 * Top-level extractor. Detects the report type, dispatches to a specific
 * extractor, and returns a uniform ExtractedReport. When the report type is
 * unknown we still try the credit-bureau extractor (most generic shape) and
 * mark the result as unknown so downstream stages stay conservative.
 *
 * @param {string} text  Verbatim PDF-extracted text.
 * @returns {import('./types.js').ExtractedReport}
 */
export function extractReport(text) {
  const safeText = typeof text === 'string' ? text : '';
  const { reportType, reportSource } = detectConsumerReportType(safeText);

  let body;
  if (reportType === 'chexsystems') {
    body = extractChexReport(safeText);
    body.parserType = 'chexsystems';
  } else if (reportType === 'early_warning_services') {
    body = extractEwsReport(safeText);
    body.parserType = 'ews';
  } else if (matchesMergedCreditReport(safeText)) {
    body = extractMergedCreditReport(safeText);
  } else if (reportSource === 'Experian') {
    body = extractExperianReport(safeText);
  } else if (reportSource === 'Equifax') {
    body = extractEquifaxReport(safeText);
  } else if (reportSource === 'TransUnion') {
    body = extractTransUnionReport(safeText);
  } else if (matchesExperianReport(safeText)) {
    body = extractExperianReport(safeText);
  } else if (matchesEquifaxReport(safeText)) {
    body = extractEquifaxReport(safeText);
  } else if (matchesTransUnionReport(safeText)) {
    body = extractTransUnionReport(safeText);
  } else {
    body = extractCreditBureauReport(safeText);
    body.parserType = 'generic_credit';
  }

  // Backfill bureau / source on items that the per-extractor didn't populate
  // (inquiries on credit-bureau reports often only know the line; we want
  // them tagged with the report's bureau so the validator doesn't drop them).
  const allLists = [body.accounts, body.collections, body.inquiries, body.publicRecords, body.bankingItems, body.remarks, body.fraudMarkers];
  for (const list of allLists) {
    for (const item of list) {
      if (!item.bureau && reportSource) item.bureau = reportSource;
      if (!item.source && reportSource) item.source = reportSource;
    }
  }

  const totalItems =
    body.accounts.length +
    body.collections.length +
    body.inquiries.length +
    body.publicRecords.length +
    body.bankingItems.length +
    body.remarks.length +
    body.fraudMarkers.length;
  const tradelineCount = body.accounts.length + body.collections.length + body.bankingItems.length;
  const accountConfidenceValues = [...body.accounts, ...body.collections, ...body.bankingItems]
    .map((item) => item.extractionConfidence)
    .filter((value) => typeof value === 'number' && Number.isFinite(value));
  const avgItemConfidence = accountConfidenceValues.length
    ? accountConfidenceValues.reduce((sum, value) => sum + value, 0) / accountConfidenceValues.length
    : 0;
  const hasReportText = /\b(account|credit|balance|payment|status|tradeline|furnisher|creditor|chexsystems|early warning services)\b/i.test(safeText);
  const hasSufficientText = safeText.trim().length >= 50;
  const needsManualReview = !hasSufficientText || (hasReportText && tradelineCount === 0);
  const extractionConfidence = needsManualReview
    ? 0.35
    : tradelineCount > 0
      ? Math.max(0.5, Math.min(0.98, avgItemConfidence || 0.75))
      : 0.8;

  return {
    reportType,
    reportSource: body.bureauSource || reportSource,
    parserType: body.parserType || 'generic_credit',
    extractionConfidence,
    needsManualReview,
    reportDate: body.reportDate,
    consumerId: body.consumerId,
    personalInfo: body.personalInfo,
    accounts: body.accounts,
    collections: body.collections,
    inquiries: body.inquiries,
    publicRecords: body.publicRecords,
    bankingItems: body.bankingItems,
    remarks: body.remarks,
    fraudMarkers: body.fraudMarkers,
    rawTextLength: safeText.length,
    summary: {
      totalItems,
      sectionsFound: body.sectionsFound || [],
    },
  };
}
