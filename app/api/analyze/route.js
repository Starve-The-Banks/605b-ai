import Anthropic from "@anthropic-ai/sdk";
import { auth } from '@clerk/nextjs/server';
import { rateLimit, LIMITS } from '@/lib/rateLimit';

export async function POST(req) {
  try {
    // Require authentication
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Please sign in to analyze reports' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check rate limit
    const { allowed, remaining, resetIn } = await rateLimit(userId, 'analyze', LIMITS.analyze);
    if (!allowed) {
      const hours = Math.ceil(resetIn / 3600);
      return new Response(JSON.stringify({
        error: `Daily limit reached (${LIMITS.analyze} analyses/day). Resets in ${hours} hour${hours > 1 ? 's' : ''}.`
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(resetIn)
        }
      });
    }

    const formData = await req.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: 'No files uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract text from PDFs
    const pdfTexts = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Dynamic import pdf-parse to avoid build issues
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
      const pdfData = await pdfParse(buffer);

      pdfTexts.push({
        filename: file.name,
        text: pdfData.text,
        pages: pdfData.numpages
      });
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const analysisPrompt = `You are an expert credit report analyst specializing in helping identity theft victims and consumers exercise their rights under federal law. Analyze the following credit report(s) carefully.

═══════════════════════════════════════════════════════════════════════════════
CRITICAL: UNDERSTANDING ACCOUNT STATUS
═══════════════════════════════════════════════════════════════════════════════

CLOSED ACCOUNTS - IMPORTANT DISTINCTIONS:

1. **CLOSED IN GOOD STANDING** - DO NOT FLAG THESE AS ISSUES
   - Account shows "Closed" status
   - Balance is $0
   - Payment history shows no late payments (or very old minor lates)
   - May show "Closed at consumer's request" or "Closed by creditor - paid as agreed"
   - These are POSITIVE items that help credit history length
   - It is NORMAL for closed accounts to show no recent payment activity
   - These can stay on reports for up to 10 years and that's GOOD for the consumer

2. **CLOSED WITH PROBLEMS** - FLAG THESE
   - Closed with remaining balance (charge-off)
   - Shows "Closed - not paid as agreed" or similar
   - Collection accounts
   - Settlements for less than full balance

3. **POTENTIALLY FRAUDULENT** - FLAG FOR REVIEW
   - Consumer doesn't recognize the account at all
   - Account opened at suspicious time/location
   - Addresses don't match consumer's history

═══════════════════════════════════════════════════════════════════════════════
WHAT TO LOOK FOR (ACTUAL ISSUES ONLY)
═══════════════════════════════════════════════════════════════════════════════

1. **POTENTIAL ERRORS** - Accounts with genuinely inaccurate information:
   - Wrong balance amounts
   - Incorrect payment history
   - Wrong account numbers
   - Accounts showing open when they were closed
   - Wrong original creditor information

2. **IDENTITY THEFT INDICATORS** - Truly suspicious items:
   - Accounts the consumer may not recognize
   - Addresses in states the consumer never lived
   - Employers the consumer never worked for
   - Inquiries from companies the consumer never applied to
   - New accounts opened during suspicious timeframes

3. **FCRA VIOLATIONS** - Items violating the Fair Credit Reporting Act:
   - Negative items older than 7 years from date of first delinquency
   - Bankruptcies older than 10 years
   - Paid tax liens still showing (should be removed)
   - Medical debt under $500 (new rules)
   - Medical debt paid by insurance still showing
   - Duplicate accounts (same debt reported twice)
   - Re-aged accounts (date manipulation to extend reporting period)

4. **INCONSISTENCIES** - Conflicting information:
   - Same account showing different balances across bureaus
   - Same account showing different payment histories
   - Account showing as open at one bureau, closed at another

5. **LEGITIMATE DISPUTE OPPORTUNITIES**:
   - Accounts lacking proper documentation
   - Unverifiable information
   - Outdated information still being reported

═══════════════════════════════════════════════════════════════════════════════
DO NOT FLAG AS ISSUES:
═══════════════════════════════════════════════════════════════════════════════

- Closed accounts in good standing with no recent payments (this is NORMAL)
- Old accounts that help credit history length
- Paid accounts showing $0 balance
- Hard inquiries less than 2 years old that the consumer authorized
- Accounts that are simply old but accurate
- Low credit utilization (that's good!)
- Multiple credit cards if all in good standing

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

For each GENUINE finding, provide:
- The specific item/account
- The actual problem identified (not just "old" or "closed")
- Which statute applies (§605B for fraud, §611 for disputes, §605 for outdated info)
- Recommended action
- Realistic dispute success likelihood

Format your response as JSON with this structure:
{
  "summary": {
    "totalAccounts": number,
    "openAccounts": number,
    "closedAccountsGoodStanding": number,
    "potentialIssues": number,
    "highPriorityItems": number,
    "overallAssessment": "Clean report with minor issues" | "Some concerns to address" | "Multiple issues requiring attention" | "Significant problems detected"
  },
  "findings": [
    {
      "id": "unique_id",
      "type": "error|inconsistency|fraud_indicator|fcra_violation|dispute_opportunity",
      "severity": "high|medium|low",
      "account": "Account name or description",
      "issue": "Specific description of the problem",
      "statute": "§605B|§611|§623|§605|etc",
      "recommendation": "Specific action to take",
      "successLikelihood": "High|Medium|Low",
      "reasoning": "Why this is flagged and why the success likelihood"
    }
  ],
  "positiveFactors": [
    "List of good things about this credit report"
  ],
  "crossBureauInconsistencies": [
    {
      "item": "What's inconsistent",
      "details": "How it differs between bureaus"
    }
  ],
  "personalInfo": {
    "namesFound": ["list of names on report"],
    "addressesFound": ["list of addresses"],
    "employersFound": ["list of employers"],
    "potentiallyUnfamiliar": []
  }
}

If the credit report looks clean with no real issues, say so! Don't manufacture problems. A clean report should have few or zero findings.

═══════════════════════════════════════════════════════════════════════════════
CREDIT REPORT(S) TO ANALYZE:
═══════════════════════════════════════════════════════════════════════════════

${pdfTexts.map((p, i) => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE: ${p.filename} (${p.pages} pages)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${p.text.substring(0, 50000)}
`).join('\n\n')}

Analyze thoroughly and return ONLY valid JSON, no other text.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [{ role: "user", content: analysisPrompt }]
    });

    let analysisText = response.content[0]?.text || "{}";

    // Clean up the response - remove markdown code blocks if present
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (e) {
      // If JSON parsing fails, return the raw text for debugging
      return new Response(JSON.stringify({
        error: 'Failed to parse analysis',
        rawResponse: analysisText
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      filesProcessed: pdfTexts.map(p => ({ name: p.filename, pages: p.pages })),
      analysis,
      remaining // Let frontend know remaining analyses
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(remaining)
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
