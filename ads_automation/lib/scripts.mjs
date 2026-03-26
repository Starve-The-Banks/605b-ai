// Script generator — produces timed, compliant ad scripts for 605b.ai

import { validateScript } from './compliance.mjs';

const SYSTEM_PROMPT = `You are a direct-response Meta ads copywriter. You write short-form video ad scripts for 605b.ai — a SaaS tool that lets users upload credit reports, scan for potential inaccuracies or suspicious accounts, and generate dispute documentation.

OUTPUT FORMAT — Return ONLY a valid JSON object:
{
  "hook": "...",
  "problem": "...",
  "demo": "...",
  "cta": "..."
}

TIMING RULES:
- hook: 0–2s. Under 12 words. Scroll-stopping.
- problem: 2–6s. Explain why credit reports can contain errors or fraudulent accounts.
- demo: 6–18s. Walk the viewer through: uploading a report → system scanning → flagging items → generating documentation.
- cta: 18–25s. Clear instruction ending with "605b.ai".

COMPLIANCE (STRICT):
NEVER say: fix your credit, increase score, guaranteed removal, credit repair, clean credit, remove items.
ALWAYS use: analyze, scan, identify, review, dispute documentation, flag, credit report analysis.

TONE: Calm, trustworthy, informational. Not salesy. Like a smart friend explaining a tool.`;

export async function generateScript(apiKey, hook) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Write a 25-second ad script. Use this exact hook as the opening line:\n"${hook}"\n\nReturn ONLY valid JSON with keys: hook, problem, demo, cta`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || '';

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No valid JSON in OpenAI response');

  const script = JSON.parse(jsonMatch[0]);
  script.hook = hook; // enforce the exact hook we asked for

  const check = validateScript(script);
  if (!check.compliant) {
    const blockViolations = check.violations.filter(v => v.severity === 'block');
    throw new Error(`Compliance failure: ${blockViolations.map(v => v.phrase).join(', ')}`);
  }

  return { ...script, compliance: check };
}

export async function generateScriptsForHooks(apiKey, hooks, { concurrency = 2 } = {}) {
  const results = [];
  const errors = [];

  for (let i = 0; i < hooks.length; i += concurrency) {
    const batch = hooks.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(hook => generateScript(apiKey, hook))
    );

    for (let j = 0; j < batchResults.length; j++) {
      const hookIndex = i + j;
      if (batchResults[j].status === 'fulfilled') {
        results.push({
          id: `ad_${String(hookIndex + 1).padStart(2, '0')}`,
          ...batchResults[j].value,
        });
      } else {
        errors.push({ hook: batch[j], error: batchResults[j].reason?.message });
      }
    }

    // rate-limit pause between batches
    if (i + concurrency < hooks.length) {
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  return { results, errors };
}