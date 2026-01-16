import { ClerkProvider } from '@clerk/nextjs';
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
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

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
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
