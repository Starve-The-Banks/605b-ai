// Hook generation engine — 50 scroll-stopping hooks for 605b.ai
// All hooks: <12 words, curiosity-driven, Meta-compliant

import { validateCompliance } from './compliance.mjs';

// Static seed hooks — hand-tuned for maximum scroll-stop rate
const SEED_HOOKS = [
  // Curiosity hooks
  "Most people never check this section of their credit report.",
  "There's a page in your credit report nobody talks about.",
  "One upload showed me accounts I never opened.",
  "Three bureaus. Three different versions of your credit.",
  "Your credit report might have items that aren't yours.",
  "I checked my credit report and something didn't add up.",
  "Not all accounts on your credit report are accurate.",
  "Your credit file may contain information that's outdated.",
  "Something on your credit report looks different than expected.",
  "A quick scan found accounts I didn't recognize.",

  // Discovery hooks
  "I uploaded my credit report and found something unusual.",
  "This software flagged items I missed for years.",
  "I ran my credit report through a scanner in 60 seconds.",
  "Uploaded three reports. Found discrepancies on each one.",
  "I tested a tool that scans credit reports automatically.",
  "First scan found questionable accounts across all three bureaus.",
  "After one upload, I finally saw what didn't belong.",
  "My credit report had more issues than I expected.",
  "A single scan surfaced items worth disputing.",
  "Most people don't realize their report has potential errors.",

  // Education hooks
  "Here's something most people don't know about credit reports.",
  "Credit bureaus can have different information about you.",
  "You're allowed to dispute anything inaccurate on your credit.",
  "Under FCRA, you have the right to dispute errors.",
  "Credit reports aren't always accurate. Here's what to do.",
  "Bureaus are required to investigate your disputes by law.",
  "Your credit report should only contain verified information.",
  "Most people don't know they can generate dispute letters.",
  "There's a legal process for challenging credit report errors.",
  "You have 30 days after noticing errors to take action.",

  // Demonstration hooks
  "Watch what happens when I upload a credit report.",
  "I tested a tool that scans credit reports in seconds.",
  "Here's what 60 seconds of analysis looks like.",
  "This is what a credit report scan actually finds.",
  "I uploaded my report and the results were revealing.",
  "Let me show you what this software flags automatically.",
  "Watch this credit report go through an automated scan.",
  "60 seconds from upload to a full analysis. Here's how.",
  "This is how you scan three credit reports at once.",
  "I'll show you exactly what the analysis looks like.",

  // Urgency / empowerment hooks
  "Stop guessing what's wrong with your credit report.",
  "Tired of paying someone else to read your credit report?",
  "Why pay monthly when software does this in minutes?",
  "Professional dispute tools shouldn't cost $89 a month.",
  "You shouldn't need a lawyer to write a dispute letter.",
  "Take two minutes and scan your own credit report.",
  "This is how people handle credit disputes on their own.",
  "Upload your report. See what's actually on it.",
  "Your credit report data belongs to you. Review it.",
  "Every item on your report should be verifiable. Check yours.",
];

export function getHooks() {
  return SEED_HOOKS.filter(hook => {
    const check = validateCompliance(hook);
    return check.compliant && hook.split(/\s+/).length <= 12;
  });
}

export async function generateHooksWithAI(apiKey, count = 10) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You write scroll-stopping hooks for Meta video ads for 605b.ai, a credit report analysis tool. Rules:
- Each hook MUST be under 12 words
- Trigger curiosity, NOT fear
- NEVER say: fix credit, increase score, guaranteed removal, credit repair
- ALLOWED: analyze, identify, review, scan, flag, dispute documentation
- One hook per line, no numbering, no quotes
Output exactly ${count} hooks, one per line.`,
        },
        {
          role: 'user',
          content: `Generate ${count} unique, scroll-stopping hooks for 605b.ai Meta ads. Each under 12 words. One per line.`,
        },
      ],
      max_tokens: 600,
      temperature: 0.9,
    }),
  });

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || '';

  return raw
    .split('\n')
    .map(line => line.replace(/^\d+[\.\)]\s*/, '').replace(/^["']|["']$/g, '').trim())
    .filter(line => {
      if (!line || line.length < 10) return false;
      const check = validateCompliance(line);
      return check.compliant && line.split(/\s+/).length <= 12;
    });
}

export { SEED_HOOKS };