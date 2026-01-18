"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setError('No session ID provided.');
      return;
    }

    // Short delay to allow Stripe to process
    const timer = setTimeout(() => {
      setStatus('ready');
    }, 1500);

    return () => clearTimeout(timer);
  }, [sessionId]);

  const handleDownload = async () => {
    if (!sessionId) return;

    setStatus('downloading');
    setError('');

    try {
      const response = await fetch(`/api/identity-theft/download?session_id=${sessionId}`);

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 402) {
          setError('Payment is still processing. Please wait a moment and try again.');
        } else if (response.status === 410) {
          setError('Your download link has expired. Please contact support.');
        } else {
          setError(data.error || 'Failed to generate packet. Please try again.');
        }
        setStatus('ready');
        return;
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'identity-theft-dispute-packet.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus('downloaded');
    } catch (err) {
      setError('Network error. Please try again.');
      setStatus('ready');
    }
  };

  if (status === 'error' && !sessionId) {
    return (
      <div className="success-card">
        <div className="success-icon" style={{ background: 'rgba(255, 107, 107, 0.15)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="success-title">Something Went Wrong</h1>
        <p className="success-text">{error}</p>
        <Link href="/identity-theft" className="success-btn">
          Try Again
        </Link>
      </div>
    );
  }

  return (
    <div className="success-card">
      <div className="success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h1 className="success-title">Payment Successful!</h1>
      <p className="success-text">
        Your Identity Theft Dispute Packet is ready for download.
        Click the button below to get your documents.
      </p>

      {error && <div className="success-error">{error}</div>}

      {status === 'loading' && (
        <div className="success-loading">
          <div className="success-spinner"></div>
          <span>Preparing your packet...</span>
        </div>
      )}

      <button
        className="success-btn"
        onClick={handleDownload}
        disabled={status === 'loading' || status === 'downloading'}
      >
        {status === 'downloading' ? 'Generating...' : status === 'downloaded' ? 'Download Again' : 'Download My Packet'}
      </button>

      {status === 'downloaded' && (
        <div className="success-checklist">
          <div className="success-checklist-title">Next Steps:</div>
          <div className="success-checklist-item">Review all documents carefully</div>
          <div className="success-checklist-item">Sign the FTC Affidavit where indicated</div>
          <div className="success-checklist-item">Attach copies of your ID and proof of address</div>
          <div className="success-checklist-item">Make copies of everything for your records</div>
          <div className="success-checklist-item">Send via Certified Mail with Return Receipt</div>
          <div className="success-checklist-item">Keep all tracking numbers</div>
        </div>
      )}

      <p className="success-note">
        Your download link will remain active for 7 days. Save your packet to a secure location.
      </p>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <>
      <style jsx global>{`
        .success-page {
          font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #0c0c0c;
          color: #f5f5f5;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .success-header {
          padding: 20px 32px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .success-logo {
          font-size: 20px;
          font-weight: 600;
          color: #f5f5f5;
          text-decoration: none;
        }

        .success-logo span {
          color: #ff6b35;
        }

        .success-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
        }

        .success-card {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 16px;
          padding: 48px;
          max-width: 500px;
          width: 100%;
          text-align: center;
        }

        .success-icon {
          width: 64px;
          height: 64px;
          background: rgba(34, 197, 94, 0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }

        .success-icon svg {
          width: 32px;
          height: 32px;
          color: #22c55e;
        }

        .success-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .success-text {
          font-size: 16px;
          color: #a0a0a0;
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .success-btn {
          display: inline-block;
          background: #ff6b35;
          color: white;
          font-size: 18px;
          font-weight: 600;
          padding: 16px 32px;
          border-radius: 8px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          width: 100%;
        }

        .success-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(255, 107, 53, 0.3);
        }

        .success-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .success-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #a0a0a0;
          margin-bottom: 24px;
        }

        .success-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #2a2a2a;
          border-top-color: #ff6b35;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .success-error {
          background: #2a1a1a;
          border: 1px solid #4a2a2a;
          color: #ff6b6b;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .success-note {
          font-size: 13px;
          color: #606060;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #2a2a2a;
        }

        .success-checklist {
          text-align: left;
          background: #141414;
          border-radius: 8px;
          padding: 20px;
          margin-top: 24px;
        }

        .success-checklist-title {
          font-size: 14px;
          font-weight: 600;
          color: #f5f5f5;
          margin-bottom: 12px;
        }

        .success-checklist-item {
          font-size: 13px;
          color: #a0a0a0;
          margin-bottom: 8px;
          padding-left: 24px;
          position: relative;
        }

        .success-checklist-item::before {
          content: '\\2610';
          position: absolute;
          left: 0;
        }

        @media (max-width: 640px) {
          .success-card {
            padding: 32px 24px;
          }

          .success-title {
            font-size: 24px;
          }
        }
      `}</style>

      <div className="success-page">
        <header className="success-header">
          <Link href="/" className="success-logo">
            605b<span>.ai</span>
          </Link>
        </header>

        <main className="success-container">
          <Suspense fallback={
            <div className="success-card">
              <div className="success-loading">
                <div className="success-spinner"></div>
                <span>Loading...</span>
              </div>
            </div>
          }>
            <SuccessContent />
          </Suspense>
        </main>
      </div>
    </>
  );
}
