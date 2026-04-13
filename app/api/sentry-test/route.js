/**
 * Safe Sentry test endpoint — only available in non-production or when
 * SENTRY_TEST_ENABLED=1. Hit GET /api/sentry-test to trigger a test error.
 */
export const runtime = 'nodejs';

export function GET() {
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_TEST_ENABLED !== '1') {
    return Response.json({ error: 'Not available in production' }, { status: 403 });
  }
  throw new Error('[Sentry Test] 605b.ai server-side error monitoring is working ✓');
}
