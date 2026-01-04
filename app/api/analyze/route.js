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

    const analysisPrompt = `You are an expert credit report analyst. Analyze the following credit report(s) and identify:

1. **POTENTIAL ERRORS** - Accounts that may be inaccurate, outdated, or unverifiable
2. **INCONSISTENCIES** - Information that conflicts between sections or bureaus
3. **IDENTITY THEFT INDICATORS** - Accounts, addresses, or employers the consumer may not recognize
4. **FCRA VIOLATIONS** - Items that may violate the Fair Credit Reporting Act (e.g., outdated negative info >7 years, duplicate accounts, re-aged accounts)
5. **DISPUTE OPPORTUNITIES** - Items that have high success potential for disputes

For each finding, provide:
- The specific item/account
- The problem identified
- Which statute applies (§605B for fraud, §611 for disputes, etc.)
- Recommended action
- Dispute success likelihood (High/Medium/Low)

Format your response as JSON with this structure:
{
  "summary": {
    "totalAccounts": number,
    "potentialIssues": number,
    "highPriorityItems": number
  },
  "findings": [
    {
      "id": "unique_id",
      "type": "error|inconsistency|fraud_indicator|fcra_violation|dispute_opportunity",
      "severity": "high|medium|low",
      "account": "Account name or description",
      "issue": "Description of the problem",
      "statute": "§605B|§611|§623|etc",
      "recommendation": "What to do",
      "successLikelihood": "High|Medium|Low"
    }
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
    "flaggedAsUnfamiliar": []
  }
}

CREDIT REPORT(S):
${pdfTexts.map((p, i) => `
--- ${p.filename} (${p.pages} pages) ---
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
