"use client";

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Meta Pixel + Google Ads tracking.
 * Meta Pixel: loads only in production.
 * Two-step setup: stub fbq, then load fbevents.js and init/track on load.
 */

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const META_PIXEL_ENABLED = META_PIXEL_ID && process.env.NODE_ENV === 'production';

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
            id="fbq-stub"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: "window.fbq = window.fbq || function(){ (window.fbq.q = window.fbq.q || []).push(arguments); }; window._fbq = window.fbq;"
            }}
          />
          <Script
            src="https://connect.facebook.net/en_US/fbevents.js"
            strategy="afterInteractive"
            onLoad={() => {
              if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
                window.fbq('init', process.env.NEXT_PUBLIC_META_PIXEL_ID);
                window.fbq('track', 'PageView');
              }
            }}
          />
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
