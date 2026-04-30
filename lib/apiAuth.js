import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export function getAuthHeaderDebug(request) {
  const authorization = request?.headers?.get?.('authorization') || '';
  const host = request?.headers?.get?.('host') || null;
  const forwardedHost = request?.headers?.get?.('x-forwarded-host') || null;
  const origin = request?.headers?.get?.('origin') || null;
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  const secretKey = process.env.CLERK_SECRET_KEY || '';

  return {
    hasAuthHeader: Boolean(authorization),
    authHeaderFormat: authorization
      ? authorization.toLowerCase().startsWith('bearer ')
        ? 'bearer'
        : 'other'
      : 'missing',
    host,
    forwardedHost,
    origin,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
    clerkPublishablePrefix: publishableKey.startsWith('pk_live_')
      ? 'pk_live'
      : publishableKey.startsWith('pk_test_')
        ? 'pk_test'
        : publishableKey
          ? 'unknown'
          : 'missing',
    clerkSecretPrefix: secretKey.startsWith('sk_live_')
      ? 'sk_live'
      : secretKey.startsWith('sk_test_')
        ? 'sk_test'
        : secretKey
          ? 'unknown'
          : 'missing',
  };
}

export function logApiAuth(route, request, authResult, error = null) {
  const headerDebug = getAuthHeaderDebug(request);
  console.warn('[API AUTH DEBUG]', {
    route,
    ...headerDebug,
    userId: authResult?.userId || null,
    authErrorType: error?.name || null,
    authErrorMessage: error?.message || null,
  });
}

export async function resolveApiAuth(request, route) {
  try {
    const authResult = await auth();
    logApiAuth(route, request, authResult, null);
    return { userId: authResult?.userId || null, authResult, error: null };
  } catch (error) {
    logApiAuth(route, request, null, error);
    return { userId: null, authResult: null, error };
  }
}

export function authExpiredResponse(code = 'AUTH_EXPIRED') {
  return NextResponse.json(
    { success: false, error: { code, message: 'Authentication expired. Please reconnect.' } },
    { status: 401 }
  );
}
