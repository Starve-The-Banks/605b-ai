"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <>
      <style jsx global>{`
        .signin-page {
          min-height: 100vh;
          background: #09090b;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .signin-logo {
          position: absolute;
          top: 32px;
          left: 40px;
          font-size: 24px;
          font-weight: 700;
          color: #fafafa;
          text-decoration: none;
          letter-spacing: -0.03em;
          z-index: 10;
        }
        
        .signin-logo-accent {
          color: #f7d047;
        }
        
        .signin-container {
          min-height: 100vh;
          display: flex;
        }
        
        .signin-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px;
          padding-top: 100px;
        }
        
        .signin-right {
          flex: 1;
          background: linear-gradient(135deg, #18181b 0%, #09090b 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 80px;
          border-left: 1px solid #27272a;
        }
        
        .signin-title {
          font-size: 40px;
          font-weight: 700;
          color: #fafafa;
          letter-spacing: -0.03em;
          margin-bottom: 16px;
        }
        
        .signin-subtitle {
          font-size: 18px;
          color: #a1a1aa;
          line-height: 1.6;
          max-width: 400px;
        }
        
        .signin-stats {
          margin-top: 48px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .signin-stat {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .signin-stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: rgba(247, 208, 71, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f7d047;
          font-weight: 700;
          flex-shrink: 0;
        }
        
        .signin-stat-text {
          font-size: 14px;
          color: #a1a1aa;
        }
        
        /* Clerk component overrides */
        .cl-rootBox {
          width: 100%;
          max-width: 400px;
        }
        
        .cl-card {
          background: #18181b !important;
          border: 1px solid #27272a !important;
          box-shadow: none !important;
        }
        
        .cl-headerTitle, .cl-headerSubtitle {
          color: #fafafa !important;
        }
        
        .cl-socialButtonsBlockButton {
          background: #27272a !important;
          border: 1px solid #3f3f46 !important;
          color: #fafafa !important;
        }
        
        .cl-formButtonPrimary {
          background: #f7d047 !important;
          color: #09090b !important;
        }
        
        .cl-formFieldInput {
          background: #27272a !important;
          border-color: #3f3f46 !important;
          color: #fafafa !important;
        }
        
        .cl-footerActionLink {
          color: #f7d047 !important;
        }
        
        @media (max-width: 900px) {
          .signin-container {
            flex-direction: column;
          }
          
          .signin-left {
            padding: 120px 24px 40px;
          }
          
          .signin-right {
            border-left: none;
            border-top: 1px solid #27272a;
            padding: 40px 24px;
          }
          
          .signin-title {
            font-size: 28px;
          }
          
          .signin-subtitle {
            font-size: 16px;
          }
        }
      `}</style>

      <div className="signin-page">
        <Link href="/" className="signin-logo">
          605b<span className="signin-logo-accent">.ai</span>
        </Link>

        <div className="signin-container">
          <div className="signin-left">
            <SignIn 
              afterSignInUrl="/dashboard"
              signUpUrl="/sign-up"
              appearance={{
                variables: {
                  colorPrimary: '#f7d047',
                  colorBackground: '#18181b',
                  colorInputBackground: '#27272a',
                  colorInputText: '#fafafa',
                  colorText: '#fafafa',
                  colorTextSecondary: '#a1a1aa',
                },
                elements: {
                  rootBox: {
                    width: '100%',
                    maxWidth: '400px',
                  },
                  card: { 
                    backgroundColor: '#18181b', 
                    border: '1px solid #27272a',
                    boxShadow: 'none',
                  },
                  headerTitle: {
                    color: '#fafafa',
                  },
                  headerSubtitle: {
                    color: '#a1a1aa',
                  },
                  formButtonPrimary: {
                    backgroundColor: '#f7d047',
                    color: '#09090b',
                    '&:hover': {
                      backgroundColor: '#e5c33f',
                    },
                  },
                  formFieldInput: {
                    backgroundColor: '#27272a',
                    borderColor: '#3f3f46',
                    color: '#fafafa',
                  },
                  footerActionLink: {
                    color: '#f7d047',
                  },
                  socialButtonsBlockButton: {
                    backgroundColor: '#27272a',
                    borderColor: '#3f3f46',
                    color: '#fafafa',
                  },
                  dividerLine: {
                    backgroundColor: '#27272a',
                  },
                  dividerText: {
                    color: '#71717a',
                  },
                }
              }}
            />
          </div>

          <div className="signin-right">
            <h1 className="signin-title">Welcome back</h1>
            <p className="signin-subtitle">
              Continue where you left off. Your disputes, deadlines, 
              and audit trail are waiting.
            </p>
            <div className="signin-stats">
              <div className="signin-stat">
                <div className="signin-stat-icon">4</div>
                <div className="signin-stat-text">Days for bureaus to respond to §605B</div>
              </div>
              <div className="signin-stat">
                <div className="signin-stat-icon">§</div>
                <div className="signin-stat-text">Statute-grounded dispute letters</div>
              </div>
              <div className="signin-stat">
                <div className="signin-stat-icon">✓</div>
                <div className="signin-stat-text">Complete audit trail for litigation</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
