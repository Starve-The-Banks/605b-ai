// This endpoint previously exposed the full beta allowlist (emails + user IDs) to any
// authenticated user. It has been removed as a security fix — internal allowlist data
// must never be returned to clients.
export async function GET() {
  return new Response('Not found', { status: 404 });
}
