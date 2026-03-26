// Compliance validator for Meta financial ad policies

const BANNED_PHRASES = [
  'fix your credit',
  'increase your score',
  'guaranteed removal',
  'instant credit repair',
  'credit repair',
  'boost your credit',
  'raise your score',
  'remove negative items',
  'guaranteed results',
  'instant results',
  'delete bad credit',
  'clean your credit',
  'wipe your credit',
  'erase bad accounts',
  'improve your score',
  'higher credit score',
  'fix your score',
  'guaranteed dispute',
  'we will fix',
  'we fix',
  'score increase',
  'points higher',
  'credit repair service',
  'repair your credit',
];

const ALLOWED_PHRASES = [
  'analyze your credit report',
  'identify potential inaccuracies',
  'generate dispute documentation',
  'review suspicious accounts',
  'credit dispute documentation',
  'credit report analysis',
  'dispute documentation software',
  'self-service dispute tools',
  'review your credit report',
  'flag questionable items',
  'scan your credit file',
  'organize dispute documentation',
];

export function validateCompliance(text) {
  const lower = text.toLowerCase();
  const violations = [];

  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) {
      violations.push({ phrase, severity: 'block' });
    }
  }

  return {
    compliant: violations.length === 0,
    violations,
  };
}

export function validateScript(script) {
  const fullText = [
    script.hook,
    script.problem,
    script.demo,
    script.cta,
  ].join(' ');

  const result = validateCompliance(fullText);

  if (script.hook && script.hook.split(/\s+/).length > 15) {
    result.violations.push({ phrase: `Hook too long (${script.hook.split(/\s+/).length} words, max 12)`, severity: 'warn' });
  }

  if (!script.cta || !script.cta.toLowerCase().includes('605b.ai')) {
    result.violations.push({ phrase: 'CTA missing 605b.ai URL', severity: 'warn' });
  }

  result.compliant = result.violations.filter(v => v.severity === 'block').length === 0;
  return result;
}

export { BANNED_PHRASES, ALLOWED_PHRASES };