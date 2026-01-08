"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Shield } from 'lucide-react';

export default function SignUpPage() {
  return (
    <>
      <style jsx global>{`
        .signup-page {
          min-height: 100vh;
          background: #09090b;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .signup-logo {
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
        
        .signup-logo-accent {
          color: #f7d047;
        }
        
        .signup-container {
          min-height: 100vh;
          display: flex;
        }
        
        .signup-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px;
          padding-top: 100px;
        }
        
        .signup-right {
          flex: 1;
          background: linear-gradient(135deg, #18181b 0%, #09090b 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 80px;
          border-left: 1px solid #27272a;
        }
        
        .signup-title {
          font-size: 40px;
          font-weight: 700;
          color: #fafafa;
          letter-spacing: -0.03em;
          margin-bottom: 16px;
        }
        
        .signup-subtitle {
          font-size: 18px;
          color: #a1a1aa;
          line-height: 1.6;
          max-width: 420px;
        }
        
        .signup-features {
          margin-top: 48px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .signup-feature {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        
        .signup-check {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(247, 208, 71, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f7d047;
          flex-shrink: 0;
          margin-top: 2px;
          font-size: 12px;
        }
        
        .signup-feature-text {
          font-size: 15px;
          color: #a1a1aa;
          line-height: 1.5;
        }
        
        .signup-feature-text strong {
          color: #fafafa;
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
          .signup-container {
            flex-direction: column;
          }
          
          .signup-left {
            padding: 120px 24px 40px;
          }
          
          .signup-right {
            border-left: none;
            border-top: 1px solid #27272a;
            padding: 40px 24px;
          }
          
          .signup-title {
            font-size: 28px;
          }
          
          .signup-subtitle {
            font-size: 16px;
          }
        }
      `}</style>

      <div className="signup-page">
        <Link href="/" className="signup-logo">
          605b<span className="signup-logo-accent">.ai</span>
        </Link>

        <div className="signup-container">
          <div className="signup-left">
            <SignUp 
              afterSignUpUrl="/dashboard"
              signInUrl="/sign-in"
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

          <div className="signup-right">
            <h1 className="signup-title">Take back control</h1>
            <p className="signup-subtitle">
              Identity theft shouldn't define your financial future. 
              We give you the tools to fight back—legally.
            </p>
            <div className="signup-features">
              <div className="signup-feature">
                <div className="signup-check">✓</div>
                <div className="signup-feature-text">
                  <strong>§605B Identity Theft Blocks</strong><br />
                  Force bureaus to respond in 4 days, not 30
                </div>
              </div>
              <div className="signup-feature">
                <div className="signup-check">✓</div>
                <div className="signup-feature-text">
                  <strong>All the agencies</strong><br />
                  Credit bureaus + ChexSystems + Early Warning + more
                </div>
              </div>
              <div className="signup-feature">
                <div className="signup-check">✓</div>
                <div className="signup-feature-text">
                  <strong>Litigation-ready audit trail</strong><br />
                  Every action timestamped for CFPB complaints or court
                </div>
              </div>
              <div className="signup-feature">
                <div className="signup-check">✓</div>
                <div className="signup-feature-text">
                  <strong>AI guidance</strong><br />
                  Answers grounded in actual consumer protection statutes
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
