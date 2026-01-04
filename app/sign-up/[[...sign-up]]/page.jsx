"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div style={styles.page}>
      <Link href="/" style={styles.logo}>
        605b<span style={{ color: '#d4a574' }}>.ai</span>
      </Link>

      <div style={styles.container}>
        <div style={styles.left}>
          <SignUp 
            afterSignUpUrl="/dashboard"
            signInUrl="/sign-in"
            appearance={{
              variables: {
                colorPrimary: '#d4a574',
                colorBackground: '#18181b',
                colorInputBackground: '#27272a',
                colorInputText: '#fafafa',
                colorText: '#fafafa',
              },
              elements: {
                formButtonPrimary: {
                  backgroundColor: '#d4a574',
                  color: '#09090b',
                },
                card: { 
                  backgroundColor: '#18181b', 
                  border: '1px solid #27272a' 
                },
              }
            }}
          />
        </div>

        <div style={styles.right}>
          <h1 style={styles.title}>Take back control</h1>
          <p style={styles.subtitle}>
            Identity theft shouldn't define your financial future. 
            We give you the tools to fight back—legally.
          </p>
          <div style={styles.features}>
            <div style={styles.feature}>
              <div style={styles.check}>✓</div>
              <div style={styles.featureText}>
                <strong style={{ color: '#fafafa' }}>§605B Identity Theft Blocks</strong><br />
                Force bureaus to respond in 4 days, not 30
              </div>
            </div>
            <div style={styles.feature}>
              <div style={styles.check}>✓</div>
              <div style={styles.featureText}>
                <strong style={{ color: '#fafafa' }}>All the agencies</strong><br />
                Credit bureaus + ChexSystems + Early Warning + more
              </div>
            </div>
            <div style={styles.feature}>
              <div style={styles.check}>✓</div>
              <div style={styles.featureText}>
                <strong style={{ color: '#fafafa' }}>Litigation-ready audit trail</strong><br />
                Every action timestamped for CFPB complaints or court
              </div>
            </div>
            <div style={styles.feature}>
              <div style={styles.check}>✓</div>
              <div style={styles.featureText}>
                <strong style={{ color: '#fafafa' }}>AI guidance</strong><br />
                Answers grounded in actual consumer protection statutes
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#09090b',
  },
  logo: {
    position: 'absolute',
    top: '32px',
    left: '40px',
    fontSize: '24px',
    fontWeight: '700',
    color: '#fafafa',
    textDecoration: 'none',
    letterSpacing: '-0.03em',
  },
  container: {
    minHeight: '100vh',
    display: 'flex',
  },
  left: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
  },
  right: {
    flex: 1,
    background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '80px',
    borderLeft: '1px solid #27272a',
  },
  title: {
    fontSize: '40px',
    fontWeight: '700',
    color: '#fafafa',
    letterSpacing: '-0.03em',
    marginBottom: '16px',
  },
  subtitle: {
    fontSize: '18px',
    color: '#a1a1aa',
    lineHeight: '1.6',
    maxWidth: '420px',
  },
  features: {
    marginTop: '48px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  feature: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
  },
  check: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'rgba(212, 165, 116, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#d4a574',
    flexShrink: 0,
    marginTop: '2px',
    fontSize: '12px',
  },
  featureText: {
    fontSize: '15px',
    color: '#a1a1aa',
    lineHeight: '1.5',
  },
};
