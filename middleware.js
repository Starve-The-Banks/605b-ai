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
  const { userId, redirectToSignIn } = await auth();
  const { pathname } = req.nextUrl;

  // Protect all dashboard and API routes
  if (isProtectedRoute(req) && !userId) {
    // For API routes, return JSON error instead of redirecting
    if (isApiRoute(req)) {
      const authCode = isAnalyzeApiRoute(req) ? 'AUTH_EXPIRED' : 'AUTH_REQUIRED';
      return NextResponse.json(
        { 
          success: false, 
          error: { code: authCode, message: 'Authentication required' } 
        },
        { status: 401 }
      );
    }
    // Redirect unauthenticated users to sign-in, preserving intended destination
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // Prevent authenticated users from accessing auth pages (avoids loop)
  if (userId && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
