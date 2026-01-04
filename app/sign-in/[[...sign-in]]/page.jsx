"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div style={styles.page}>
      <Link href="/" style={styles.logo}>
        605b<span style={{ color: '#d4a574' }}>.ai</span>
      </Link>

      <div style={styles.container}>
        <div style={styles.left}>
          <SignIn 
            afterSignInUrl="/dashboard"
            signUpUrl="/sign-up"
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
          <h1 style={styles.title}>Welcome back</h1>
          <p style={styles.subtitle}>
            Continue where you left off. Your disputes, deadlines, 
            and audit trail are waiting.
          </p>
          <div style={styles.stats}>
            <div style={styles.stat}>
              <div style={styles.statIcon}>4</div>
              <div style={styles.statText}>Days for bureaus to respond to §605B</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statIcon}>§</div>
              <div style={styles.statText}>Statute-grounded dispute letters</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statIcon}>✓</div>
              <div style={styles.statText}>Complete audit trail for litigation</div>
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
    maxWidth: '400px',
  },
  stats: {
    marginTop: '48px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: 'rgba(212, 165, 116, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#d4a574',
    fontWeight: '700',
  },
  statText: {
    fontSize: '14px',
    color: '#a1a1aa',
  },
};
