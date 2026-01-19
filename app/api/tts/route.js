import { auth } from '@clerk/nextjs/server';
import { rateLimit, rateLimitChars, LIMITS } from '@/lib/rateLimit';
import { ttsSchema, validateBody } from '@/lib/validation';

export async function POST(req) {
  try {
    // Require authentication
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Please sign in' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate request body with Zod
    const body = await req.json();
    const { data, error: validationError } = validateBody(ttsSchema, body);
    if (validationError) {
      return new Response(JSON.stringify({ error: validationError }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { text, voice = 'Rachel' } = data;
    const truncatedText = text;
    const charCount = truncatedText.length;

    // Check daily TTS request limit (15/day)
    const { allowed: dailyAllowed, remaining: dailyRemaining } = await rateLimit(
      userId, 
      'tts', 
      LIMITS.tts
    );
    
    if (!dailyAllowed) {
      return new Response(JSON.stringify({ 
        error: 'Daily voice limit reached. Resets tomorrow.',
        useBrowserTTS: true,
        text: truncatedText
      }), {
        status: 200, // Return 200 so frontend falls back gracefully
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check monthly character limit (40k/month)
    const { allowed: monthlyAllowed, remaining: charsRemaining } = await rateLimitChars(
      userId,
      charCount,
      LIMITS.ttsChars
    );

    if (!monthlyAllowed) {
      return new Response(JSON.stringify({ 
        error: 'Monthly voice quota exceeded. Using browser voice.',
        useBrowserTTS: true,
        text: truncatedText
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return new Response(JSON.stringify({ 
        useBrowserTTS: true,
        text: truncatedText 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ElevenLabs voice IDs
    const voiceIds = {
      'Rachel': '21m00Tcm4TlvDq8ikWAM',    // Calm, professional female
      'Domi': 'AZnzlk1XvdvUeBnXmlld',       // Strong, confident female
      'Bella': 'EXAVITQu4vr4xnSDxMaL',      // Soft, warm female
      'Antoni': 'ErXwobaYiN019PkySvjV',     // Calm, professional male
      'Josh': 'TxGEqnHWrfWFTfGW9XjX',       // Deep, authoritative male
      'Arnold': 'VR6AewLTigWG4xSOukaG',     // Strong, confident male
      'Sam': 'yoZ06aMxZJJ28mfd3POQ',        // Warm, friendly male
    };

    const voiceId = voiceIds[voice] || voiceIds['Rachel'];

    // Use ElevenLabs TTS API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: truncatedText,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs TTS error:', error);
      return new Response(JSON.stringify({ 
        useBrowserTTS: true,
        text: truncatedText 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.byteLength),
        'X-TTS-Daily-Remaining': String(dailyRemaining),
        'X-TTS-Chars-Remaining': String(charsRemaining),
      }
    });

  } catch (error) {
    console.error('TTS API error:', error);
    // Don't expose internal error details - fallback to browser TTS
    return new Response(JSON.stringify({
      useBrowserTTS: true,
      error: 'Voice service temporarily unavailable'
    }), {
      status: 200, // Return 200 so frontend falls back gracefully
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
