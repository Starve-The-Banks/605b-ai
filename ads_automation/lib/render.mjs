const VISUAL_VIDEO_MAP = {
  scan_flow: [
    'https://cdn.creatomate.com/demo/video1.mp4',
    'https://cdn.creatomate.com/demo/video2.mp4',
    'https://cdn.creatomate.com/demo/video3.mp4',
  ],
  report_deep: [
    'https://cdn.creatomate.com/demo/5-second-video.mp4',
    'https://cdn.creatomate.com/demo/video3.mp4',
    'https://cdn.creatomate.com/demo/video2.mp4',
  ],
  results_first: [
    'https://cdn.creatomate.com/demo/video2.mp4',
    'https://cdn.creatomate.com/demo/5-second-video.mp4',
    'https://cdn.creatomate.com/demo/video1.mp4',
  ],
};

const FALLBACK_AUDIO_URL = 'https://cdn.creatomate.com/demo/music1.mp3';
const VIDEO_SEGMENTS = [
  { time: 0, duration: 8.34 },
  { time: 8.34, duration: 8.33 },
  { time: 16.67, duration: 8.33 },
];

function getVisualKey(variation) {
  if (typeof variation.visual === 'string') return variation.visual;
  return variation.visual?.key || 'scan_flow';
}

function buildCreatomateSource(script, variation, voiceUrl) {
  const visualKey = getVisualKey(variation);
  const videos = VISUAL_VIDEO_MAP[visualKey] || VISUAL_VIDEO_MAP.scan_flow;
  const audioUrl = voiceUrl || FALLBACK_AUDIO_URL;

  const textTimeline = [
    { time: 0, duration: 3.5, text: script.hook, size: 66, weight: '800', y: '22%', color: '#FFFFFF' },
    { time: 3, duration: 6, text: script.problem, size: 42, weight: '600', y: '64%', color: '#E2E8F0' },
    { time: 9, duration: 10, text: script.demo, size: 38, weight: '600', y: '72%', color: '#FFFFFF' },
    { time: 18, duration: 7, text: script.cta, size: 44, weight: '800', y: '84%', color: '#FFFFFF' },
  ];

  return {
    output_format: 'mp4',
    width: 1080,
    height: 1920,
    duration: 25,
    frame_rate: 30,
    elements: [
      ...VIDEO_SEGMENTS.map((segment, index) => ({
        type: 'video',
        track: 1,
        source: videos[index],
        x: '50%',
        y: '50%',
        width: '100%',
        height: '100%',
        time: segment.time,
        duration: segment.duration,
        loop: true,
        animations: index === 0
          ? []
          : [{ time: 0, duration: 0.8, transition: true, type: 'fade' }],
      })),
      {
        type: 'shape',
        track: 2,
        fill_color: 'rgba(7, 10, 20, 0.48)',
        x: '50%',
        y: '50%',
        width: '100%',
        height: '100%',
        time: 0,
        duration: 25,
      },
      {
        type: 'shape',
        track: 3,
        fill_color: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.58) 100%)',
        x: '50%',
        y: '50%',
        width: '100%',
        height: '100%',
        time: 0,
        duration: 25,
      },
      {
        type: 'text',
        track: 4,
        text: '605b.ai',
        font_family: 'Inter',
        font_weight: '800',
        font_size: 54,
        fill_color: '#FF6B35',
        stroke_color: 'rgba(0,0,0,0.15)',
        stroke_width: '2 px',
        x: '10%',
        y: '8%',
        x_anchor: '0%',
        y_anchor: '50%',
        time: 0,
        duration: 25,
      },
      {
        type: 'text',
        track: 4,
        text: 'Credit report analysis software',
        font_family: 'Inter',
        font_weight: '500',
        font_size: 24,
        fill_color: '#FFFFFF',
        x: '10%',
        y: '11.5%',
        x_anchor: '0%',
        y_anchor: '50%',
        time: 0,
        duration: 25,
      },
      ...textTimeline.map((item, index) => ({
        type: 'text',
        track: 5 + index,
        text: item.text,
        font_family: 'Inter',
        font_weight: item.weight,
        font_size: item.size,
        fill_color: item.color,
        stroke_color: '#000000',
        stroke_width: '3 px',
        background_color: index === 2 ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.25)',
        background_x_padding: '6%',
        background_y_padding: '5%',
        background_border_radius: '4%',
        x: '50%',
        y: item.y,
        width: '88%',
        text_align: 'center',
        line_height: '125%',
        time: item.time,
        duration: item.duration,
        animations: [
          { time: 0, duration: 0.6, type: 'fade', transition: true },
        ],
      })),
      {
        type: 'shape',
        track: 10,
        fill_color: 'rgba(255, 107, 53, 0.92)',
        x: '50%',
        y: '84%',
        width: '88%',
        height: '10%',
        border_radius: '40 px',
        time: 18,
        duration: 7,
        animations: [
          { time: 0, duration: 0.4, type: 'scale', transition: true },
        ],
      },
      {
        type: 'audio',
        track: 11,
        source: audioUrl,
        time: 0,
        duration: null,
        volume: voiceUrl ? 1 : 0.35,
        audio_fade_out: 1.5,
      },
      {
        type: 'text',
        track: 12,
        text: 'Software provides tools only. No guaranteed results.',
        font_family: 'Inter',
        font_weight: '500',
        font_size: 18,
        fill_color: '#F8FAFC',
        x: '50%',
        y: '96%',
        width: '92%',
        text_align: 'center',
        time: 0,
        duration: 25,
      },
    ],
  };
}

function normalizeRenderResponse(data) {
  return Array.isArray(data) ? data[0] : data;
}

export async function renderAd(apiKey, script, variation, voiceUrl) {
  const source = buildCreatomateSource(script, variation, voiceUrl);
  const payload = {
    output_format: 'mp4',
    source,
  };

  console.log('CREATOMATE_REQUEST_PAYLOAD');
  console.log(JSON.stringify(payload, null, 2));

  const res = await fetch('https://api.creatomate.com/v1/renders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const rawBody = await res.text();
  console.log('CREATOMATE_CREATE_RESPONSE');
  console.log(rawBody);

  if (!res.ok) {
    throw new Error(`Creatomate ${res.status}: ${rawBody.slice(0, 500)}`);
  }

  const data = JSON.parse(rawBody);
  const render = normalizeRenderResponse(data);

  if (render.output_format && render.output_format !== 'mp4') {
    throw new Error(`Unexpected create output format: ${render.output_format}`);
  }

  return {
    render_id: render.id,
    status: render.status,
    url: render.url,
    output_format: render.output_format,
  };
}

export async function checkRenderStatus(apiKey, renderId) {
  const res = await fetch(`https://api.creatomate.com/v2/renders/${renderId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const rawBody = await res.text();
  console.log('CREATOMATE_STATUS_RESPONSE');
  console.log(rawBody);

  if (!res.ok) {
    throw new Error(`Creatomate status check ${res.status}: ${rawBody.slice(0, 500)}`);
  }

  const data = JSON.parse(rawBody);

  if (data.status === 'succeeded') {
    console.log('CREATOMATE_FINAL_RENDER_URL');
    console.log(data.url);
  }

  return data;
}

export function validateRender(renderResult, downloadedFile = null) {
  const issues = [];
  const finalUrl = downloadedFile?.url || renderResult.url;

  if (renderResult.status !== 'succeeded') {
    issues.push(`Status: ${renderResult.status}`);
  }

  if (renderResult.output_format !== 'mp4') {
    issues.push(`Output format: ${renderResult.output_format}`);
  }

  if (!finalUrl || !finalUrl.toLowerCase().endsWith('.mp4')) {
    issues.push(`Final URL is not an mp4: ${finalUrl || 'missing'}`);
  }

  if (typeof renderResult.file_size === 'number' && renderResult.file_size < 1024 * 1024) {
    issues.push(`Rendered file too small: ${Math.round(renderResult.file_size / 1024)}KB`);
  }

  if (typeof renderResult.duration === 'number' && renderResult.duration < 15) {
    issues.push(`Rendered duration too short: ${renderResult.duration}s`);
  }

  if (downloadedFile) {
    if (downloadedFile.size < 1024 * 1024) {
      issues.push(`Downloaded file too small: ${Math.round(downloadedFile.size / 1024)}KB`);
    }

    if (downloadedFile.duration && downloadedFile.duration < 15) {
      issues.push(`Downloaded duration too short: ${downloadedFile.duration}s`);
    }

    if (downloadedFile.fileType && !downloadedFile.fileType.toLowerCase().includes('mp4')) {
      issues.push(`Downloaded file type invalid: ${downloadedFile.fileType}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}