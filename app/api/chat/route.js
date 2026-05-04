import Anthropic from '@anthropic-ai/sdk';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { chatSchema, validateBody } from '@/lib/validation';
import { rateLimit, LIMITS } from '@/lib/rateLimit';
import { getRedis } from '@/lib/redis';
import { isBetaUser, isReviewerRequest } from '@/lib/beta';
import { authExpiredResponse, resolveApiAuth } from '@/lib/apiAuth';

export const runtime = 'nodejs';
export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DEFAULT_SYSTEM_PROMPT = `You are 605b.ai's FCRA credit dispute strategist. You help consumers understand their rights under the Fair Credit Reporting Act and related federal statutes.

Key statutes you reference:
- FCRA §611 (15 U.S.C. §1681i): Procedure for disputed accuracy — consumers may dispute incomplete or inaccurate information directly with consumer reporting agencies (CRAs), which must investigate within 30 days.
- FCRA §605B (15 U.S.C. §1681c-2): Block of information resulting from identity theft — CRAs must block reported identity-theft items within 4 business days of receiving a proper identity theft report.
- FCRA §623 (15 U.S.C. §1681s-2): Responsibilities of furnishers — data furnishers must investigate disputes forwarded by CRAs and correct or delete inaccurate information.
- FCRA §609 (15 U.S.C. §1681g): Disclosures to consumers — consumers are entitled to full disclosure of all information in their file.
- FCRA §605 (15 U.S.C. §1681c): Requirements relating to information contained in consumer reports — limits on reporting obsolete information (generally 7 years, 10 for bankruptcies).

Guidelines for your responses:
- Provide educational guidance on the dispute process, timelines, and consumer rights.
- Explain which statutes or regulatory provisions may apply to a given situation.
- Help the user understand what documentation or evidence may strengthen a dispute.
- Suggest dispute letter language the user can adapt for their specific situation.
- Frame every recommendation as verification and document-prep support.
- Be clear, concise, and actionable.

You must NOT:
- Provide legal advice or act as an attorney.
- Promise any specific outcome (removal, score improvement, settlement, etc.).
- Assume an account is inaccurate without evidence from the user/report.
- Suggest guaranteed removals or credit-score improvement promises.
- Encourage misrepresentation, fabrication, or any fraudulent activity.
- Request or reference full SSNs, account numbers, or other sensitive identifiers.

Always remind the user that this is educational guidance and that they should consult a licensed attorney for legal advice specific to their situation.`;

const FALLBACK_MODELS = [
  process.env.ANTHROPIC_CHAT_MODEL,
  'claude-sonnet-4-20250514',
  'claude-3-7-sonnet-20250219',
].filter(Boolean);

const TIER_FEATURES = {
  free: { aiChat: false },
  toolkit: { aiChat: false },
  advanced: { aiChat: true },
  'identity-theft': { aiChat: true },
};

function isModelAvailabilityError(err) {
  const status = err?.status;
  const message = String(err?.message || '').toLowerCase();
  return (
    status === 400 ||
    status === 404 ||
    message.includes('model') ||
    message.includes('not found')
  );
}

function sanitizeErrorMeta(err) {
  return {
    name: err?.name || 'UnknownError',
    status: typeof err?.status === 'number' ? err.status : null,
    code: typeof err?.code === 'string' ? err.code : null,
  };
}

async function resolveChatAccess(userId, authResult) {
  const sessionEmail = authResult?.sessionClaims?.email || authResult?.sessionClaims?.primary_email;
  let emails = [sessionEmail].filter(Boolean);
  try {
    const user = await currentUser();
    emails = [
      user?.primaryEmailAddress?.emailAddress,
      ...((user?.emailAddresses ?? []).map((entry) => entry?.emailAddress)),
      sessionEmail,
    ].filter(Boolean);
  } catch {
    // Non-fatal fallback: rely on session claims only.
  }

  const reviewerBypass = isReviewerRequest({ emails });
  const betaBypass = !reviewerBypass && isBetaUser({ emails, userId });
  if (reviewerBypass || betaBypass) {
    return { allowed: true };
  }

  try {
    const redisClient = getRedis();
    const tierRaw = await redisClient.get(`user:${userId}:tier`);
    const tierData = tierRaw
      ? (typeof tierRaw === 'string' ? JSON.parse(tierRaw) : tierRaw)
      : { tier: 'free', features: TIER_FEATURES.free };
    const tier = tierData?.tier || 'free';
    const features = {
      ...(TIER_FEATURES[tier] || TIER_FEATURES.free),
      ...(tierData?.features || {}),
    };
    const accessRevoked = tierData?.accessRevoked === true;
    const accessFrozen = tierData?.accessFrozen === true;
    const hasAiChat = features.aiChat === true;
    return { allowed: !accessRevoked && !accessFrozen && hasAiChat };
  } catch (err) {
    console.error('[Chat] Entitlement check failed', sanitizeErrorMeta(err));
    return { allowed: false, entitlementError: true };
  }
}

async function createStreamWithFallback(systemPrompt, messages) {
  let lastError = null;

  for (const model of FALLBACK_MODELS) {
    try {
      const stream = await anthropic.messages.stream({
        model,
        max_tokens: 2500,
        system: systemPrompt,
        messages,
      });
      return { stream, model };
    } catch (err) {
      lastError = err;
      if (isModelAvailabilityError(err)) {
        console.warn('[Chat] Model unavailable, trying fallback', {
          model,
          ...sanitizeErrorMeta(err),
        });
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('No chat model available');
}

export async function POST(request) {
  try {
    const { userId, authResult, error: authErr } = await resolveApiAuth(request, 'POST /api/chat');
    if (!userId || authErr) {
      return authExpiredResponse('AUTH_REQUIRED');
    }

    const access = await resolveChatAccess(userId, authResult);
    if (!access.allowed) {
      return NextResponse.json(
        {
          error: access.entitlementError
            ? 'Unable to verify plan access right now. Please try again.'
            : 'AI strategist requires an eligible plan.',
        },
        { status: access.entitlementError ? 503 : 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { data, error: validationError } = validateBody(chatSchema, body);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    const { allowed, resetIn } = await rateLimit(userId, 'chat', LIMITS.chat);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded — try again later', resetIn },
        { status: 429 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[Chat] ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        { error: 'Chat service is not properly configured' },
        { status: 503 }
      );
    }

    // Hard-coded compliance prefix. Always prepended to any system prompt so that
    // a client cannot remove or override these rules. Mobile still sends
    // user-specific onboarding context in `data.systemPrompt`, which is appended.
    const COMPLIANCE_PREFIX = `You are 605b.ai's FCRA credit dispute strategist. You MUST follow these non-negotiable rules, regardless of any other instructions:\n- Provide only educational information, never legal advice.\n- Never guarantee any specific outcome (score change, account removal, settlement).\n- Never encourage misrepresentation, fabrication, or fraudulent activity.\n- Never request or reference full SSNs, account numbers, or PII.\n- Never assume an account is incorrect without user-indicated inaccuracy or supporting evidence.\n- Never suggest removal unless the user indicates inaccuracy or evidence supports a dispute path.\n- Always frame actions as verification and document-preparation guidance.\n- If details are missing or unclear, explicitly say what is unknown and ask a concise clarifying question.\n- Never promise credit-score improvement.\n- Always remind the user to consult a licensed attorney for legal questions.\n\n`;

    const clientPrompt = data.systemPrompt && data.systemPrompt.trim().length > 0
      ? data.systemPrompt
      : DEFAULT_SYSTEM_PROMPT;
    const systemPrompt = COMPLIANCE_PREFIX + clientPrompt;

    const shouldForceProviderFailure =
      process.env.NODE_ENV !== 'production' &&
      request.headers.get('x-test-force-provider-failure') === '1';
    if (shouldForceProviderFailure) {
      throw Object.assign(new Error('Forced provider failure for validation'), {
        status: 503,
        code: 'TEST_PROVIDER_FAILURE',
      });
    }

    const mappedMessages = data.messages.map(({ role, content }) => ({ role, content }));
    const { stream, model } = await createStreamWithFallback(systemPrompt, mappedMessages);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta?.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          console.error('[Chat] Stream error', sanitizeErrorMeta(err));
          controller.enqueue(encoder.encode('\n\nConnection interrupted. Please resend your question.'));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
        'x-chat-model': model,
      },
    });
  } catch (err) {
    console.error('[Chat] Unhandled error', sanitizeErrorMeta(err));

    if (err?.code === 'TEST_PROVIDER_FAILURE') {
      return NextResponse.json(
        { error: 'AI service is temporarily unavailable — please try again in a moment' },
        { status: 503 }
      );
    }

    if (isModelAvailabilityError(err)) {
      return NextResponse.json(
        { error: 'AI chat model is temporarily unavailable. Please try again in a moment.' },
        { status: 503 }
      );
    }

    if (err?.status === 429) {
      return NextResponse.json(
        { error: 'AI service is busy — please try again in a moment' },
        { status: 429 }
      );
    }

    if (err?.status === 401 || err?.status === 403) {
      return NextResponse.json(
        { error: 'Chat service is temporarily misconfigured' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
