"use client";

import Link from 'next/link';
import Image from 'next/image';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/constants';

export const COMPANY_NAME = 'Ninth Wave Analytics LLC';
export const COMPANY_LOCATION = 'Oceanside, CA';
export const COMPANY_PHONE = '(760) 666-4106';
export const COMPANY_PHONE_TEL = 'tel:+17606664106';

export default function SiteFooter({ variant = 'full' }) {
  const year = new Date().getFullYear();

  if (variant === 'minimal') {
    return (
      <footer style={{
        position: 'relative',
        zIndex: 10,
        padding: '32px',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
        }}>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            lineHeight: 1.7,
            marginBottom: '16px',
          }}>
            <strong>Disclaimer:</strong> 605b.ai is software that helps users generate and organize dispute documentation.
            It is not a credit repair organization and does not provide legal advice.
            We are not a law firm or credit counseling service. No guarantees of any outcomes.
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <Link href="/" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
              <Link href="/privacy" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</Link>
              <Link href="/terms" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</Link>
              <Link href="/contact" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>Contact</Link>
              <a href={SUPPORT_MAILTO} style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>{SUPPORT_EMAIL}</a>
              <a href={COMPANY_PHONE_TEL} style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>{COMPANY_PHONE}</a>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              © {year} {COMPANY_NAME} · 605b.ai is operated by Ninth Wave Analytics LLC.
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '48px 24px 24px',
      background: 'var(--bg-secondary)',
      position: 'relative',
      zIndex: 10,
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
      }}>
        {/* Main footer content */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '48px',
        }}>
          {/* Brand column */}
          <div style={{ maxWidth: '300px' }}>
            <Link href="/" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
              textDecoration: 'none',
              color: 'var(--text)',
            }}>
              <Image src="/logos/favicons/favicon.svg" alt="605b.ai" width={44} height={44} />
              <span style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1, letterSpacing: '-0.02em' }}>
                <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text)' }}>605b</span>
                <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--orange)' }}>.ai</span>
              </span>
            </Link>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
              Self-service software for credit dispute documentation.
            </p>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <div>{COMPANY_NAME}</div>
              <div>{COMPANY_LOCATION}</div>
              <div>
                <a href={COMPANY_PHONE_TEL} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{COMPANY_PHONE}</a>
              </div>
              <div>
                <a href={SUPPORT_MAILTO} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{SUPPORT_EMAIL}</a>
              </div>
            </div>
          </div>

          {/* Link columns */}
          <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>Product</div>
              <Link href="/sign-up" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Get Started</Link>
              <Link href="/#features" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Features</Link>
              <Link href="/pricing" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Pricing</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>Company</div>
              <Link href="/about" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>About</Link>
              <Link href="/contact" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Contact</Link>
              <Link href="/terms" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Service</Link>
              <Link href="/privacy" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>Resources</div>
              <a href="https://www.annualcreditreport.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Annual Credit Report</a>
              <a href="https://www.cfpb.gov" target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>CFPB</a>
              <a href="https://www.ftc.gov" target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>FTC</a>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            <strong>Important Disclaimer:</strong> 605b.ai is software that helps users generate and organize
            dispute documentation. It is not a credit repair organization and does not provide legal advice.
            We are not a law firm or credit counseling service. We do not guarantee any outcomes.
            Results depend on individual circumstances.
          </p>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '24px',
          borderTop: '1px solid var(--border)',
          fontSize: '13px',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>© {year} {COMPANY_NAME} · 605b.ai is operated by Ninth Wave Analytics LLC.</div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link href="/terms" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</Link>
            <Link href="/privacy" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</Link>
            <Link href="/contact" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
