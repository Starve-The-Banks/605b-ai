import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata = {
  title: '605b.ai - Credit Repair for Identity Theft Victims',
  description: 'Professional-grade tools to dispute fraudulent accounts, track bureau deadlines, and build an audit trail for potential litigation. Powered by FCRA Section 605B.',
  keywords: 'credit repair, identity theft, FCRA, 605B, dispute letters, credit bureau, TransUnion, Experian, Equifax',
  openGraph: {
    title: '605b.ai - Credit Repair for Identity Theft Victims',
    description: 'Professional-grade tools to dispute fraudulent accounts using federal consumer protection law.',
    type: 'website',
  },
};

const clerkAppearance = {
  baseTheme: undefined,
  variables: {
    colorPrimary: '#f7d047',
    colorBackground: '#09090b',
    colorText: '#fafafa',
    colorTextSecondary: '#a1a1aa',
    colorInputBackground: '#18181b',
    colorInputText: '#fafafa',
  },
  elements: {
    formButtonPrimary: {
      backgroundColor: '#f7d047',
      color: '#09090b',
      '&:hover': {
        backgroundColor: '#d4b840',
      },
    },
    socialButtonsBlockButton: {
      backgroundColor: '#27272a',
      color: '#fafafa',
      borderColor: '#3f3f46',
      '&:hover': {
        backgroundColor: '#3f3f46',
      },
    },
    socialButtonsBlockButtonText: {
      color: '#fafafa',
    },
    card: {
      backgroundColor: '#09090b',
      borderColor: '#27272a',
    },
    headerTitle: {
      color: '#fafafa',
    },
    headerSubtitle: {
      color: '#a1a1aa',
    },
    dividerLine: {
      backgroundColor: '#27272a',
    },
    dividerText: {
      color: '#71717a',
    },
    formFieldLabel: {
      color: '#a1a1aa',
    },
    formFieldInput: {
      backgroundColor: '#18181b',
      borderColor: '#27272a',
      color: '#fafafa',
    },
    footerActionLink: {
      color: '#f7d047',
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
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
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
