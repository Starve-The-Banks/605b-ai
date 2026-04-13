import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Security headers
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    const cspDirectives = [
      "default-src 'self'",
      // Note: unsafe-inline/unsafe-eval needed for Next.js dynamic features
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.clerk.com https://clerk.605b.ai https://clerk.accounts.dev https://*.clerk.accounts.dev https://challenges.cloudflare.com https://js.stripe.com https://connect.facebook.net https://www.facebook.com",
      "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://js.clerk.com https://clerk.605b.ai https://clerk.accounts.dev https://*.clerk.accounts.dev https://challenges.cloudflare.com https://js.stripe.com https://connect.facebook.net https://www.facebook.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.clerk.com https://img.clerk.com https://www.facebook.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://clerk.605b.ai https://api.clerk.dev https://clerk.accounts.dev https://*.clerk.accounts.dev https://*.clerk.com https://accounts.google.com https://api.stripe.com https://api.elevenlabs.io https://api.anthropic.com wss://*.clerk.accounts.dev https://connect.facebook.net https://www.facebook.com https://o4511209856499712.ingest.us.sentry.io",
      "frame-src 'self' https://accounts.google.com https://clerk.accounts.dev https://*.clerk.accounts.dev https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
      "frame-ancestors 'self'",
    ];
    if (!isDev) {
      cspDirectives.push("upgrade-insecure-requests");
    }

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            // Restrict powerful features - only allow what's needed
            value: 'camera=(), microphone=(self), geolocation=(), payment=(self), usb=(), bluetooth=(), serial=(), hid=()'
          },
          {
            // Strict Transport Security - enforce HTTPS
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectives.join('; ')
          },
        ],
      },
      {
        // Additional security for API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, max-age=0, must-revalidate'
          },
          {
            // Prevent API responses from being embedded
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
        ],
      },
      {
        // Security headers for PDF downloads
        source: '/api/identity-theft/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate'
          },
          {
            // Prevent caching of sensitive documents
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          },
        ],
      },
    ];
  },
}

export default withSentryConfig(nextConfig, {
  org: '605bai',
  project: '605b-web',
  // Silence non-error output in CI; show in local dev
  silent: !process.env.CI,
  // Upload source maps for readable stack traces in Sentry
  widenClientFileUpload: true,
  // Annotate React components for better error context
  reactComponentAnnotation: { enabled: true },
  // Tunnel Sentry traffic through our own domain — satisfies CSP, avoids blockers
  tunnelRoute: '/monitoring',
  // Don't expose source maps in the deployed bundle
  hideSourceMaps: true,
  // Tree-shake Sentry logger statements from the client bundle
  disableLogger: true,
});
