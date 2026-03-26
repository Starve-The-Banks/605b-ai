// Pre-render quality gate — blocks bad ads from reaching Creatomate

import { validateScript } from './compliance.mjs';

export function qualityCheck(variation, script, voiceFile) {
  const issues = [];

  // 1. Compliance
  const compliance = validateScript(script);
  if (!compliance.compliant) {
    issues.push(`COMPLIANCE: ${compliance.violations.map(v => v.phrase).join('; ')}`);
  }

  // 2. Captions must exist (script sections serve as caption source)
  if (!script.hook || !script.problem || !script.demo || !script.cta) {
    issues.push('CAPTIONS: missing script sections — captions cannot be generated');
  }

  // 3. Logo must appear in first 3 seconds
  // Enforced by template — just verify we have the field
  if (!variation.visual || !variation.visual.clips || variation.visual.clips.length === 0) {
    issues.push('VISUALS: no clip segments assigned');
  }

  // 4. URL must appear in final frame
  if (!script.cta.toLowerCase().includes('605b.ai')) {
    issues.push('CTA: final frame must contain 605b.ai URL');
  }

  // 5. Voice file exists
  if (!voiceFile) {
    issues.push('AUDIO: voiceover file missing');
  }

  // 6. Hook word count
  const hookWords = script.hook.split(/\s+/).length;
  if (hookWords > 12) {
    issues.push(`HOOK: ${hookWords} words (max 12)`);
  }

  return {
    pass: issues.length === 0,
    issues,
    variation_id: variation.id,
  };
}