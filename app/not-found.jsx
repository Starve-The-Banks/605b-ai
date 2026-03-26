"use client";

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NotFound() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      router.replace(isSignedIn ? '/dashboard' : '/');
    }, 3000);
    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn, router]);

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg, #0C0C0C)',
      color: 'var(--text, #FAFAFA)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        background: 'rgba(255, 107, 53, 0.1)',
        border: '1px solid rgba(255, 107, 53, 0.2)',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        fontSize: '28px',
      }}>
        404
      </div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.02em' }}>
        Page not found
      </h1>
      <p style={{ fontSize: '15px', color: 'var(--text-muted, #666)', marginBottom: '32px', maxWidth: '360px', lineHeight: 1.6 }}>
        {isLoaded
          ? `Redirecting you ${isSignedIn ? 'to your dashboard' : 'home'} in a moment…`
          : 'Loading…'}
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {isLoaded && isSignedIn ? (
          <Link href="/dashboard" style={{
            padding: '10px 24px',
            background: '#FF6B35',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 600,
            fontSize: '14px',
            textDecoration: 'none',
          }}>
            Go to Dashboard
          </Link>
        ) : (
          <Link href="/" style={{
            padding: '10px 24px',
            background: '#FF6B35',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 600,
            fontSize: '14px',
            textDecoration: 'none',
          }}>
            Go Home
          </Link>
        )}
      </div>
    </div>
  );
}
