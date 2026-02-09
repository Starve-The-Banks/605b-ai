"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

export default function SignUpPage() {
  return (
    <>
      <style jsx global>{`
        .auth-page {
          min-height: 100dvh;
          background: var(--bg);
          display: flex;
          flex-direction: column;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          padding-top: env(safe-area-inset-top, 0px);
          padding-bottom: env(safe-area-inset-bottom, 0px);
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
          position: relative;
          z-index: 100;
          padding: 0 32px;
          height: 64px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
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

        .auth-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          position: relative;
          z-index: 10;
          min-height: 0;
        }

        .auth-container {
          width: 100%;
          max-width: 420px;
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

        .disclaimer-box {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .disclaimer-box p {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.6;
          margin: 0;
        }

        .disclaimer-box strong {
          color: var(--text-secondary);
        }

        .auth-footer {
          position: relative;
          z-index: 10;
          padding: 20px 32px;
          flex-shrink: 0;
          border-top: 1px solid var(--border);
          text-align: center;
        }

        .auth-footer-copy {
          font-size: 12px;
          color: var(--text-muted);
        }

        @media (max-width: 480px) {
          .auth-nav {
            padding: 0 20px;
          }
          .auth-main {
            padding: 24px 20px;
          }
        }
      `}</style>

      <div className="auth-page">
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
          <Link href="/sign-in" className="auth-nav-link">Sign In</Link>
        </nav>

        <main className="auth-main">
          <div className="auth-container">
            <div className="auth-header">
              <h1>Create your account</h1>
              <p>Start documenting disputes under federal law</p>
            </div>

            <div className="disclaimer-box">
              <p><strong>Important:</strong> 605B.ai provides software tools for generating dispute documentation. This is not a credit repair service. We do not provide legal advice. No outcomes are guaranteed. You are responsible for reviewing all generated documents before use.</p>
            </div>

            <SignUp
              afterSignUpUrl="/dashboard"
              signInUrl="/sign-in"
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
        </main>

        <footer className="auth-footer">
          <div className="auth-footer-copy">© {new Date().getFullYear()} Ninth Wave Analytics LLC. Software tools only.</div>
        </footer>
      </div>
    </>
  );
}
