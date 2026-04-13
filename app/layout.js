import { ClerkProvider } from '@clerk/nextjs';
import { IBM_Plex_Sans, Inter, JetBrains_Mono } from 'next/font/google';
import { Suspense } from 'react';
import TrackingPixels from './components/TrackingPixels';
import './globals.css';

export const metadata = {
  title: '605b.ai | Statute-Driven Credit Reinvestigation Platform',
  description: 'Generate compliant documentation, track statutory timelines, and maintain a complete audit trail. Self-service software for credit disputes and identity theft remediation.',
  keywords: 'credit dispute software, identity theft documentation, FCRA 605B, dispute letters, credit bureau dispute, TransUnion, Experian, Equifax, dispute tracking, reinvestigation',
  openGraph: {
    title: '605b.ai | Statute-Driven Credit Reinvestigation Platform',
    description: 'Generate compliant documentation, track statutory timelines, and maintain a complete audit trail.',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/logos/favicons/favicon.svg', type: 'image/svg+xml' },
      { url: '/logos/favicons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/logos/favicons/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/logos/favicons/favicon.svg',
  },
  manifest: '/site.webmanifest',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-ibm-plex-sans',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

const clerkAppearance = {
  baseTheme: undefined,
  variables: {
    colorPrimary: '#FF6B35',
    colorBackground: '#0C0C0C',
    colorText: '#FAFAFA',
    colorTextSecondary: '#A0A0A0',
    colorNeutral: '#A0A0A0',
    colorInputBackground: '#141414',
    colorInputText: '#FAFAFA',
    borderRadius: '8px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  elements: {
    formButtonPrimary: {
      backgroundColor: '#FF6B35',
      color: '#FFFFFF',
      fontWeight: 600,
      '&:hover': { backgroundColor: '#E55A2B' },
      '&:focus': { boxShadow: '0 0 0 3px rgba(255, 107, 53, 0.25)' },
    },
    socialButtonsBlockButton: {
      backgroundColor: '#1E1E1E',
      color: '#FAFAFA',
      borderColor: '#333333',
      fontWeight: 500,
      minHeight: '44px',
      '&:hover': { backgroundColor: '#2A2A2A', borderColor: '#444444' },
    },
    socialButtonsBlockButtonText: {
      color: '#FAFAFA',
      fontWeight: 500,
    },
    socialButtonsIconBox: {
      width: '20px',
      height: '20px',
      opacity: 1,
    },
    socialButtonsProviderIcon: {
      filter: 'none',
      opacity: 1,
    },
    socialButtonsProviderIcon__apple: {
      filter: 'invert(1)',
    },
    card: {
      backgroundColor: '#141414',
      borderColor: '#2A2A2A',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    },
    headerTitle: { color: '#FAFAFA' },
    headerSubtitle: { color: '#A0A0A0' },
    dividerLine: { backgroundColor: '#2A2A2A' },
    dividerText: { color: '#555555', fontSize: '12px' },
    formFieldLabel: { color: '#A0A0A0', fontSize: '13px' },
    formFieldInput: {
      backgroundColor: '#1A1A1A',
      borderColor: '#2A2A2A',
      color: '#FAFAFA',
      minHeight: '44px',
    },
    footerActionLink: { color: '#FF6B35' },
    alertTextDanger: { color: '#ef4444' },
    identityPreviewEditButton: { color: '#FF6B35' },
    formResendCodeLink: { color: '#FF6B35' },
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <html lang="en">
        <body className={`${inter.variable} ${ibmPlexSans.variable} ${jetBrainsMono.variable}`}>
          <Suspense fallback={null}>
            <TrackingPixels />
          </Suspense>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
