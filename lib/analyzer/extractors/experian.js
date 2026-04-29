import { extractCreditBureauReport } from './creditBureau.js';

export function matchesExperianReport(text) {
  return /\b(experian|experian information solutions)\b/i.test(text || '');
}

export function extractExperianReport(text) {
  const out = extractCreditBureauReport(text, { parserType: 'experian' });
  return {
    ...out,
    parserType: 'experian',
    bureauSource: 'Experian',
  };
}
