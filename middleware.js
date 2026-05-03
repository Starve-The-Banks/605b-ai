import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/about(.*)',
  '/pricing(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/contact(.*)',
  '/support(.*)',
  '/delete-account(.*)',
  '/api/stripe/webhook(.*)',
]);

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/account(.*)',
  '/api/account(.*)',
  '/api/analyze(.*)',
  '/api/user-data(.*)',
  '/api/identity-theft(.*)',
  '/api/debug(.*)',
  '/api/notifications(.*)',
]);

const isApiRoute = createRouteMatcher(['/api(.*)']);
const isAnalyzeApiRoute = createRouteMatcher(['/api/analyze(.*)']);

export default clerkMiddleware(async (auth, req) => {
  try {
    const { pathname } = req.nextUrl;
    const authorization = req.headers.get('authorization') || '';
    const hasAuthHeader = Boolean(authorization);
    const authHeaderFormat = authorization
      ? authorization.toLowerCase().startsWith('bearer ')
        ? 'bearer'
        : 'other'
      : 'missing';

    // Public web pages must never depend on Clerk auth resolution. This keeps
    // Vercel screenshots/thumbnails and unauthenticated landing pages from
    // failing if Clerk middleware auth is temporarily unavailable.
    if (isPublicRoute(req)) {
      return NextResponse.next();
    }

    // Mobile sends Clerk session JWTs as Authorization: Bearer <token>.
    // Let Node route handlers validate Bearer requests so middleware does not
    // falsely reject valid mobile tokens before route-level diagnostics.
    if (isApiRoute(req) && authHeaderFormat === 'bearer') {
      console.warn('[API AUTH DEBUG]', {
        route: `middleware ${pathname}`,
        action: 'pass_bearer_to_route',
        hasAuthHeader: true,
        authHeaderFormat,
        userId: null,
      });
      return NextResponse.next();
    }

    let userId = null;
    let redirectToSignIn;
    let authError = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
      redirectToSignIn = authResult.redirectToSignIn;
    } catch (error) {
      authError = error;
    }

    if (isProtectedRoute(req)) {
      console.warn('[API AUTH DEBUG]', {
        route: `middleware ${pathname}`,
        hasAuthHeader,
        authHeaderFormat,
        userId,
        authErrorType: authError?.name || null,
        host: req.headers.get('host') || null,
        forwardedHost: req.headers.get('x-forwarded-host') || null,
        origin: req.headers.get('origin') || null,
      });
    }

    // Protect all dashboard and API routes
    if (isProtectedRoute(req) && !userId) {
      // For API routes, return JSON error instead of redirecting
      if (isApiRoute(req)) {
        const authCode = isAnalyzeApiRoute(req) ? 'AUTH_EXPIRED' : 'AUTH_REQUIRED';
        return NextResponse.json(
          {
            success: false,
            error: { code: authCode, message: 'Authentication required' },
          },
          { status: 401 }
        );
      }
      // Redirect unauthenticated users to sign-in, preserving intended destination
      if (redirectToSignIn) {
        return redirectToSignIn({ returnBackUrl: req.url });
      }
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    // Prevent authenticated users from accessing auth pages (avoids loop)
    if (userId && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('[Middleware] safe fallback after middleware error:', error?.message || error);
    if (isApiRoute(req)) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
