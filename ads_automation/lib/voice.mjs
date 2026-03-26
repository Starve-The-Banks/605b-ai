// ElevenLabs voice generation with multiple voice styles

import fs from 'fs/promises';
import path from 'path';

const VOICE_PROFILES = {
  professional_female: {
    id: '21m00Tcm4TlvDq8ikWAM', // Rachel
    label: 'Rachel (Professional Female)',
    settings: { stability: 0.75, similarity_boost: 0.85, style: 0.15 },
  },
  calm_male: {
    id: 'pNInz6obpgDQGcFmaJgB', // Adam
    label: 'Adam (Calm Male)',
    settings: { stability: 0.80, similarity_boost: 0.80, style: 0.10 },
  },
};

function buildVoiceText(script) {
  return [script.hook, script.problem, script.demo, script.cta].join(' ... ');
}

export async function synthesize(apiKey, script, voiceKey, outDir) {
  const profile = VOICE_PROFILES[voiceKey];
  if (!profile) throw new Error(`Unknown voice profile: ${voiceKey}`);

  const text = buildVoiceText(script);

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${profile.id}`,
    {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          ...profile.settings,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${body.slice(0, 200)}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const filename = `${script.id}_${voiceKey}.mp3`;
  const filepath = path.join(outDir, filename);
  await fs.writeFile(filepath, buf);

  return { filename, filepath, voice: profile.label, bytes: buf.length };
}

export { VOICE_PROFILES };