import { extractCreditBureauReport } from './creditBureau.js';

export function matchesEquifaxReport(text) {
  return /\b(equifax|equifax credit report)\b/i.test(text || '');
}

export function extractEquifaxReport(text) {
  const out = extractCreditBureauReport(text, { parserType: 'equifax' });
  return {
    ...out,
    parserType: 'equifax',
    bureauSource: 'Equifax',
  };
}
