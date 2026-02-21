"use client";

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { pageview } from '@/lib/metaPixel';

/**
 * Meta Pixel + Google Ads tracking.
 * Meta Pixel: loads only in production.
 * Fires PageView on load and on route changes.
 */

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const META_PIXEL_ENABLED = META_PIXEL_ID && process.env.NODE_ENV === 'production';

function MetaPixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const routeKey = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    pageview(routeKey);
  }, [pathname, searchParams]);

  return null;
}

function GoogleAdsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', GOOGLE_ADS_ID, { page_path: pathname });
    }
  }, [pathname, searchParams]);

  return null;
}

export default function TrackingPixels() {
  if (!META_PIXEL_ENABLED && !GOOGLE_ADS_ID) return null;

  return (
    <>
      {META_PIXEL_ENABLED && (
        <>
          <Script
            src="https://connect.facebook.net/en_US/fbevents.js"
            strategy="afterInteractive"
            onLoad={() => {
              const fbqExists = typeof window !== 'undefined' && typeof window.fbq === 'function';
              console.log('[MetaPixel] fbevents loaded, pixelId=', META_PIXEL_ID, ', typeof fbq=', typeof window?.fbq);
              if (!fbqExists || !META_PIXEL_ID) return;
              if (window.__fb_inited) return;
              window.__fb_inited = true;
              window.fbq('init', META_PIXEL_ID);
              window.fbq('track', 'PageView');
            }}
            onError={(e) => {
              console.error('[MetaPixel] fbevents failed to load', e);
            }}
          />
          <MetaPixelPageView />
        </>
      )}
      {GOOGLE_ADS_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="afterInteractive" />
          <Script id="google-ads" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GOOGLE_ADS_ID}');`}
          </Script>
          <GoogleAdsPageView />
        </>
      )}
    </>
  );
}
