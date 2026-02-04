import { ClerkProvider } from '@clerk/nextjs';
import { IBM_Plex_Sans, Inter, JetBrains_Mono } from 'next/font/google';
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
    colorInputBackground: '#141414',
    colorInputText: '#FAFAFA',
  },
  elements: {
    formButtonPrimary: {
      backgroundColor: '#FF6B35',
      color: '#FFFFFF',
      '&:hover': {
        backgroundColor: '#E55A2B',
      },
    },
    socialButtonsBlockButton: {
      backgroundColor: '#1A1A1A',
      color: '#FAFAFA',
      borderColor: '#2A2A2A',
      '&:hover': {
        backgroundColor: '#2A2A2A',
      },
    },
    socialButtonsBlockButtonText: {
      color: '#FAFAFA',
    },
    card: {
      backgroundColor: '#141414',
      borderColor: '#2A2A2A',
    },
    headerTitle: {
      color: '#FAFAFA',
    },
    headerSubtitle: {
      color: '#A0A0A0',
    },
    dividerLine: {
      backgroundColor: '#2A2A2A',
    },
    dividerText: {
      color: '#666666',
    },
    formFieldLabel: {
      color: '#A0A0A0',
    },
    formFieldInput: {
      backgroundColor: '#1A1A1A',
      borderColor: '#2A2A2A',
      color: '#FAFAFA',
    },
    footerActionLink: {
      color: '#FF6B35',
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en">
        <body className={`${inter.variable} ${ibmPlexSans.variable} ${jetBrainsMono.variable}`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
