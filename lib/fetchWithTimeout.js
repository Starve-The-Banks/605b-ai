/**
 * Browser-safe fetch with AbortController timeout (dashboard + client utilities).
 */
export const DEFAULT_API_TIMEOUT_MS = 12_000;

export function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_API_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const { signal: externalSignal, ...rest } = options;
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(id);
      const e = new Error('Aborted');
      e.name = 'AbortError';
      return Promise.reject(e);
    }
    externalSignal.addEventListener('abort', () => {
      clearTimeout(id);
      controller.abort();
    });
  }
  return fetch(url, { ...rest, signal: controller.signal }).finally(() => clearTimeout(id));
}
