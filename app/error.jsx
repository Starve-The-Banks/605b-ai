"use client";

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[605b] Application error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0C0C0C',
      color: '#FAFAFA',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        fontSize: '28px',
      }}>
        ⚠
      </div>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.02em' }}>
        We hit an unexpected problem
      </h1>
      <p style={{ fontSize: '14px', color: '#888', marginBottom: '32px', maxWidth: '340px', lineHeight: 1.6 }}>
        An unexpected error occurred. Please try again.
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => reset()}
          style={{
            padding: '10px 24px',
            background: '#FF6B35',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 600,
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <Link href="/dashboard" style={{
          padding: '10px 24px',
          background: 'transparent',
          border: '1px solid #2A2A2A',
          borderRadius: '8px',
          color: '#A0A0A0',
          fontWeight: 600,
          fontSize: '14px',
          textDecoration: 'none',
        }}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
