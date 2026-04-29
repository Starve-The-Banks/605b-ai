import { extractCreditBureauReport } from './creditBureau.js';

export function matchesMergedCreditReport(text) {
  const value = text || '';
  if (/\b(merged|tri[-\s]?merge|three[-\s]?bureau|3[-\s]?bureau|triple\s+bureau)\b/i.test(value)) return true;
  return /\bexperian\b[\s\S]{0,500}\bequifax\b[\s\S]{0,500}\b(transunion|trans union)\b/i.test(value);
}

export function extractMergedCreditReport(text) {
  const out = extractCreditBureauReport(text, { parserType: 'merged_credit' });
  return {
    ...out,
    parserType: 'merged_credit',
    bureauSource: 'Merged 3-bureau',
  };
}
