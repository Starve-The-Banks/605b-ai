import Anthropic from "@anthropic-ai/sdk";
import { auth, currentUser } from '@clerk/nextjs/server';
import { rateLimit, LIMITS } from '@/lib/rateLimit';
import { chatSchema, validateBody } from '@/lib/validation';
import { isBetaWhitelisted } from '@/lib/beta';

export async function POST(req) {
  try {
    // Require authentication
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Please sign in to use chat' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for beta whitelist - bypass rate limiting
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    const isBeta = isBetaWhitelisted(userEmail);

    // Check rate limit (skip for beta users)
    let remaining = Infinity;
    if (!isBeta) {
      const rateLimitResult = await rateLimit(userId, 'chat', LIMITS.chat);
      if (!rateLimitResult.allowed) {
        const hours = Math.ceil(rateLimitResult.resetIn / 3600);
        return new Response(JSON.stringify({
          error: `Daily limit reached (${LIMITS.chat} messages/day). Resets in ${hours} hour${hours > 1 ? 's' : ''}.`
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      remaining = rateLimitResult.remaining;
    }

    // Validate request body with Zod
    const body = await req.json();
    const { data, error: validationError } = validateBody(chatSchema, body);
    if (validationError) {
      return new Response(JSON.stringify({ error: validationError }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { messages, systemPrompt } = data;

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt || "You are a helpful assistant.",
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    });

    const text = response.content[0]?.text || "No response generated.";

    return new Response(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-RateLimit-Remaining': String(remaining)
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    // Don't expose internal error details to clients
    return new Response(JSON.stringify({ error: 'Chat service temporarily unavailable. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
