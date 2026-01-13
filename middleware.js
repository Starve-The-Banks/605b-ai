import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes - no auth required
const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/privacy',
  '/terms',
  '/how-it-works',
  '/fcra-605b',
  '/identity-theft',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/stripe/webhook',
]);

export default clerkMiddleware(async (auth, req) => {
  // If it's a public route, don't require auth
  if (isPublicRoute(req)) {
    return;
  }
  
  // All other routes require authentication
  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
