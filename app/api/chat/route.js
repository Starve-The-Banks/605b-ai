import Anthropic from "@anthropic-ai/sdk";
import { auth } from '@clerk/nextjs/server';
import { rateLimit, LIMITS } from '@/lib/rateLimit';

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

    // Check rate limit
    const { allowed, remaining, resetIn } = await rateLimit(userId, 'chat', LIMITS.chat);
    if (!allowed) {
      const hours = Math.ceil(resetIn / 3600);
      return new Response(JSON.stringify({
        error: `Daily limit reached (${LIMITS.chat} messages/day). Resets in ${hours} hour${hours > 1 ? 's' : ''}.`
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { messages, systemPrompt } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages required' }), {
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
