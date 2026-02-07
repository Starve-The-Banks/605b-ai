"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

export default function SignInPage() {
  return (
    <>
      <style jsx global>{`
        .auth-root {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .bg-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255, 107, 53, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 107, 53, 0.03) 1px, transparent 1px);
          background-size: 80px 80px;
          pointer-events: none;
          z-index: 0;
        }

        .auth-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 0 32px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
          background: var(--bg);
        }

        .auth-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--text);
        }

        .auth-nav-link {
          font-size: 14px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s;
        }

        .auth-nav-link:hover {
          color: var(--text);
        }

        .auth-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          padding: 0 20px;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .auth-header h1 {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
          color: var(--text);
        }

        .auth-header p {
          font-size: 15px;
          color: var(--text-secondary);
        }

        .auth-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 20px 32px;
          border-top: 1px solid var(--border);
          text-align: center;
          background: var(--bg);
        }

        .auth-footer-copy {
          font-size: 12px;
          color: var(--text-muted);
        }

        @media (max-width: 480px) {
          .auth-nav {
            padding: 0 20px;
          }
        }
      `}</style>

      <div className="auth-root">
        <div className="bg-grid"></div>

        <nav className="auth-nav">
          <Link href="/" className="auth-logo">
            <Image
              src="/logos/primary/605b-bracket-box.svg"
              alt="605b.ai"
              width={120}
              height={32}
              priority
            />
          </Link>
          <Link href="/sign-up" className="auth-nav-link">Sign Up</Link>
        </nav>

        <div className="auth-container">
          <div className="auth-header">
            <h1>Welcome back</h1>
            <p>Sign in to continue</p>
          </div>

          <SignIn
            afterSignInUrl="/dashboard"
            signUpUrl="/sign-up"
            appearance={{
              variables: {
                colorPrimary: '#FF6B35',
                colorBackground: '#141414',
                colorInputBackground: '#1A1A1A',
                colorInputText: '#FAFAFA',
                colorText: '#FAFAFA',
                colorTextSecondary: '#A0A0A0',
              },
              elements: {
                formButtonPrimary: {
                  backgroundColor: '#FF6B35',
                  color: '#FFFFFF',
                  minHeight: '44px',
                  '&:hover': {
                    backgroundColor: '#E55A2B',
                  },
                },
                card: {
                  backgroundColor: '#141414',
                  border: '1px solid #2A2A2A',
                  borderRadius: '12px',
                  width: '100%',
                  maxWidth: '420px',
                },
                formFieldInput: {
                  minHeight: '44px',
                  backgroundColor: '#1A1A1A',
                  borderColor: '#2A2A2A',
                  '&:focus': {
                    borderColor: '#FF6B35',
                    boxShadow: '0 0 0 3px rgba(255, 107, 53, 0.1)',
                  },
                },
                socialButtonsBlockButton: {
                  minHeight: '44px',
                  backgroundColor: '#1A1A1A',
                  borderColor: '#2A2A2A',
                  '&:hover': {
                    backgroundColor: '#2A2A2A',
                  },
                },
                footerActionLink: {
                  color: '#FF6B35',
                },
              }
            }}
          />
        </div>

        <footer className="auth-footer">
          <div className="auth-footer-copy">© {new Date().getFullYear()} Ninth Wave Analytics LLC. Software tools only.</div>
        </footer>
      </div>
    </>
  );
}
