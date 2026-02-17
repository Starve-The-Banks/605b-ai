"use client";

import Link from 'next/link';
import { Trash2 } from 'lucide-react';

export default function DeleteAccountPage() {
  return (
    <>
      <style jsx global>{`
        .legal-page {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
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
        .legal-nav {
          position: relative;
          z-index: 100;
          padding: 0 32px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
        }
        .legal-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--text);
        }
        .legal-logo-mark {
          width: 32px;
          height: 32px;
          background: var(--orange);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          color: white;
        }
        .legal-logo-text {
          font-size: 16px;
          font-weight: 600;
        }
        .legal-nav-links {
          display: flex;
          gap: 24px;
        }
        .legal-nav-link {
          font-size: 14px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s;
        }
        .legal-nav-link:hover {
          color: var(--text);
        }
        .legal-main {
          position: relative;
          z-index: 10;
          max-width: 800px;
          margin: 0 auto;
          padding: 80px 32px 120px;
        }
        .legal-header {
          margin-bottom: 48px;
          padding-bottom: 32px;
          border-bottom: 1px solid var(--border);
        }
        .legal-header h1 {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }
        .legal-header .meta {
          font-size: 14px;
          color: var(--text-muted);
        }
        .legal-footer {
          position: relative;
          z-index: 10;
          padding: 32px;
          border-top: 1px solid var(--border);
        }
        .legal-footer-inner {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .legal-footer-links {
          display: flex;
          gap: 24px;
        }
        .legal-footer-links a {
          font-size: 13px;
          color: var(--text-muted);
          text-decoration: none;
        }
        .legal-footer-links a:hover {
          color: var(--orange);
        }
        .legal-footer-copy {
          font-size: 12px;
          color: var(--text-muted);
        }
        @media (max-width: 640px) {
          .legal-nav, .legal-main {
            padding-left: 20px;
            padding-right: 20px;
          }
          .legal-footer-inner {
            flex-direction: column;
            gap: 16px;
          }
        }
      `}</style>

      <div className="legal-page">
        <div className="bg-grid"></div>

        <nav className="legal-nav">
          <Link href="/" className="legal-logo">
            <div className="legal-logo-mark">605B</div>
            <span className="legal-logo-text">605b.ai</span>
          </Link>
          <div className="legal-nav-links">
            <Link href="/privacy" className="legal-nav-link">Privacy</Link>
            <Link href="/terms" className="legal-nav-link">Terms</Link>
            <Link href="/sign-in" className="legal-nav-link">Sign In</Link>
          </div>
        </nav>

        <main className="legal-main">
          <div className="legal-header">
            <h1>Delete Your Account</h1>
            <p className="meta">Account and data deletion for 605b.ai</p>
          </div>

          {/* Deletion Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '32px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
              color: '#ef4444',
              fontWeight: 700,
              fontSize: '16px',
            }}>
              <Trash2 size={24} />
              PERMANENT ACCOUNT DELETION
            </div>
            <p style={{ fontSize: '15px', color: 'var(--text)', lineHeight: 1.6, marginBottom: '0' }}>
              Account deletion is permanent and cannot be undone. All data associated with your account will be permanently removed from our systems.
            </p>
          </div>

          <div style={{
            fontSize: '15px',
            lineHeight: 1.8,
            color: 'var(--text-secondary)',
          }}>

            {/* How to Delete */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>
                How to Delete Your Account
              </h2>

              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '8px' }}>
                Option 1: In-App Deletion (Recommended)
              </h3>
              <ol style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>Open the 605b.ai app on your device</li>
                <li style={{ marginBottom: '8px' }}>Go to <strong style={{ color: 'var(--text)' }}>Settings</strong></li>
                <li style={{ marginBottom: '8px' }}>Tap <strong style={{ color: 'var(--text)' }}>Delete Account</strong></li>
                <li style={{ marginBottom: '8px' }}>Confirm by typing &quot;delete&quot; when prompted</li>
                <li style={{ marginBottom: '8px' }}>Your account and all data will be permanently removed</li>
              </ol>

              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '8px' }}>
                Option 2: Contact Support
              </h3>
              <p>
                If you are unable to access the app, you can request account deletion by emailing{' '}
                <a href="mailto:support@605b.ai" style={{ color: 'var(--orange)', textDecoration: 'none' }}>
                  support@605b.ai
                </a>{' '}
                from the email address associated with your account. We will process your request within 5 business days.
              </p>
            </div>

            {/* What Gets Deleted */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>
                What Data Is Deleted
              </h2>
              <p style={{ marginBottom: '12px' }}>
                When you delete your account, the following data is permanently removed:
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li style={{ marginBottom: '8px' }}>Your account profile and email address</li>
                <li style={{ marginBottom: '8px' }}>Credit report analysis results</li>
                <li style={{ marginBottom: '8px' }}>Generated dispute letters and document packets</li>
                <li style={{ marginBottom: '8px' }}>AI Strategist conversation history</li>
                <li style={{ marginBottom: '8px' }}>Dispute tracking records and audit log</li>
                <li style={{ marginBottom: '8px' }}>Identity theft intake form data</li>
                <li style={{ marginBottom: '8px' }}>Purchase history and entitlement records</li>
                <li style={{ marginBottom: '8px' }}>All saved settings and preferences</li>
              </ul>
            </div>

            {/* What Is Not Recoverable */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>
                Important Notes
              </h2>
              <ul style={{ paddingLeft: '20px' }}>
                <li style={{ marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--text)' }}>Deletion is permanent.</strong> We cannot restore your account or any associated data after deletion.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--text)' }}>Purchases are not refunded.</strong> All purchases are one-time and non-refundable. Deleting your account does not entitle you to a refund.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--text)' }}>Uploaded PDFs are not stored.</strong> Credit report PDFs are processed in memory and are not retained as files, so there is nothing additional to delete.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--text)' }}>Sessions are terminated.</strong> You will be signed out of all devices immediately upon deletion.
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px 24px',
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
                Questions?
              </h2>
              <p style={{ marginBottom: '0' }}>
                If you have questions about account deletion or your data, contact us at{' '}
                <a href="mailto:support@605b.ai" style={{ color: 'var(--orange)', textDecoration: 'none' }}>
                  support@605b.ai
                </a>
                . For details on how we handle your data, see our{' '}
                <Link href="/privacy" style={{ color: 'var(--orange)', textDecoration: 'none' }}>
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

          </div>
        </main>

        <footer className="legal-footer">
          <div className="legal-footer-inner">
            <div className="legal-footer-links">
              <Link href="/">Home</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <a href="mailto:support@605b.ai">Contact</a>
            </div>
            <div className="legal-footer-copy">&copy; {new Date().getFullYear()} Ninth Wave Analytics LLC</div>
          </div>
        </footer>
      </div>
    </>
  );
}
