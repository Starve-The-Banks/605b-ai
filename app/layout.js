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

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
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
