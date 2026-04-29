import { extractCreditBureauReport } from './creditBureau.js';

export function matchesTransUnionReport(text) {
  return /\b(transunion|trans union)\b/i.test(text || '');
}

export function extractTransUnionReport(text) {
  const out = extractCreditBureauReport(text, { parserType: 'transunion' });
  return {
    ...out,
    parserType: 'transunion',
    bureauSource: 'TransUnion',
  };
}
