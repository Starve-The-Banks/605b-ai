// Creative variation engine
// Produces hook × visual × voice combinations ≥ 20 unique ads

const VISUAL_SEGMENTS = [
  {
    key: 'scan_flow',
    label: 'Upload → Scan → Results',
    clips: ['screen_scan.mp4', 'screen_report.mp4', 'screen_results.mp4'],
  },
  {
    key: 'report_deep',
    label: 'Report Deep-Dive',
    clips: ['screen_report.mp4', 'screen_results.mp4', 'screen_scan.mp4'],
  },
  {
    key: 'results_first',
    label: 'Results-First Reveal',
    clips: ['screen_results.mp4', 'screen_scan.mp4', 'screen_report.mp4'],
  },
];

const VOICE_KEYS = ['professional_female', 'calm_male'];

export function buildVariationMatrix(hooks, { maxAds = 20 } = {}) {
  const variations = [];

  for (const hook of hooks) {
    for (const visual of VISUAL_SEGMENTS) {
      for (const voice of VOICE_KEYS) {
        variations.push({ hook, visual, voice });
      }
    }
  }

  // Deterministic shuffle so the same input hooks always produce the same set
  const shuffled = variations
    .map((v, i) => ({ ...v, _sort: hashCode(`${v.hook}-${v.visual.key}-${v.voice}-${i}`) }))
    .sort((a, b) => a._sort - b._sort);

  return shuffled.slice(0, maxAds).map((v, i) => ({
    id: `ad_${String(i + 1).padStart(2, '0')}`,
    hook: v.hook,
    visual: v.visual,
    voice: v.voice,
  }));
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

export { VISUAL_SEGMENTS, VOICE_KEYS };