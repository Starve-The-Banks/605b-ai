import { fetchWithTimeout, DEFAULT_API_TIMEOUT_MS } from '@/lib/fetchWithTimeout';

/**
 * Credit report ANALYZE tab persistence — NOT raw PDF storage.
 *
 * - The dashboard analyzer does not upload PDF bytes to the server.
 * - We persist a JSON snapshot of the *mock/summary results* only:
 *   - Browser: localStorage (per Clerk user id when signed in)
 *   - Server (optional): merged into GET/POST /api/user-data/profile as `profile.analyzeSnapshot`
 *
 * Raw PDF files remain on the client only; re-run analysis requires choosing files again.
 */

export function pickNewerSnapshot(localSnap, serverSnap) {
  const hasLocal = localSnap?.results && typeof localSnap === 'object';
  const hasServer = serverSnap?.results && typeof serverSnap === 'object';
  if (!hasLocal && !hasServer) return null;
  if (!hasServer) return { ...localSnap, _source: 'local' };
  if (!hasLocal) return { ...serverSnap, _source: 'server' };

  const tLocal = new Date(localSnap.savedAt || 0).getTime();
  const tServer = new Date(serverSnap.savedAt || 0).getTime();
  if (tServer >= tLocal) {
    return { ...serverSnap, _source: 'server' };
  }
  return { ...localSnap, _source: 'local' };
}

export async function loadServerAnalyzeSnapshot() {
  try {
    const res = await fetchWithTimeout(
      '/api/user-data/profile',
      { cache: 'no-store' },
      DEFAULT_API_TIMEOUT_MS
    );
    if (!res.ok) return null;
    const { profile } = await res.json();
    const snap = profile?.analyzeSnapshot;
    if (!snap?.results) return null;
    return snap;
  } catch {
    return null;
  }
}

export async function saveServerAnalyzeSnapshot(payload) {
  try {
    const res = await fetchWithTimeout(
      '/api/user-data/profile',
      { cache: 'no-store' },
      DEFAULT_API_TIMEOUT_MS
    );
    if (!res.ok) return false;
    const { profile } = await res.json();
    const merged = {
      ...(profile && typeof profile === 'object' ? profile : {}),
      analyzeSnapshot: {
        results: payload.results,
        filesMeta: payload.filesMeta || [],
        savedAt: payload.savedAt || new Date().toISOString(),
      },
    };
    const post = await fetchWithTimeout(
      '/api/user-data/profile',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: merged }),
      },
      DEFAULT_API_TIMEOUT_MS
    );
    return post.ok;
  } catch {
    return false;
  }
}

export async function clearServerAnalyzeSnapshot() {
  try {
    const res = await fetchWithTimeout(
      '/api/user-data/profile',
      { cache: 'no-store' },
      DEFAULT_API_TIMEOUT_MS
    );
    if (!res.ok) return false;
    const { profile } = await res.json();
    const base = profile && typeof profile === 'object' ? { ...profile } : {};
    delete base.analyzeSnapshot;
    const post = await fetchWithTimeout(
      '/api/user-data/profile',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: base }),
      },
      DEFAULT_API_TIMEOUT_MS
    );
    return post.ok;
  } catch {
    return false;
  }
}
