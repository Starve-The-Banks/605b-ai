import { detectConsumerReportType } from '@/lib/creditReportAnalysis';
import { extractCreditBureauReport } from './extractors/creditBureau.js';
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
  } else if (reportType === 'early_warning_services') {
    body = extractEwsReport(safeText);
  } else {
    body = extractCreditBureauReport(safeText);
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

  return {
    reportType,
    reportSource,
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
