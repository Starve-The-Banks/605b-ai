"use client";

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Meta Pixel + Google Ads tracking.
 * Meta Pixel: loads only in production.
 * Uses official Meta bootstrap; fires PageView on load.
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
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;
      n.push=n;
      n.loaded=!0;
      n.version='2.0';
      n.queue=[];
      t=b.createElement(e);
      t.async=!0;
      t.src=v;
      s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s);
      }(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');

      fbq('init', '${META_PIXEL_ID}');
      fbq('track', 'PageView');
    `}
        </Script>
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
