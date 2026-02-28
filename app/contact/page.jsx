"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import { Mail, Phone, MapPin, Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/constants';
import SiteFooter, { COMPANY_NAME, COMPANY_LOCATION, COMPANY_PHONE, COMPANY_PHONE_TEL } from '@/app/components/SiteFooter';

export default function ContactPage() {
  const { isSignedIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <style jsx global>{`
        .contact-page {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
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
        .contact-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 0 32px;
          height: 64px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(12, 12, 12, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .contact-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--text);
        }
        .contact-logo-icon { width: 44px; height: 44px; flex-shrink: 0; }
        .contact-logo-text { display: flex; align-items: baseline; line-height: 1; letter-spacing: -0.02em; }
        .contact-logo-main { font-size: 24px; font-weight: 600; color: var(--text); }
        .contact-logo-ext { font-size: 24px; font-weight: 600; color: var(--orange); }
        .contact-nav-links { display: flex; gap: 24px; align-items: center; }
        .contact-nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;
        }
        .contact-nav-link:hover { color: var(--text); }
        .contact-nav-btn {
          padding: 8px 16px;
          background: var(--orange);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .contact-nav-btn:hover { background: #E55A2B; }
        .contact-mobile-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text);
          cursor: pointer;
          padding: 8px;
        }
        .contact-mobile-menu {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: var(--bg);
          z-index: 200;
          padding: 24px;
          flex-direction: column;
        }
        .contact-mobile-menu.open { display: flex; }
        .contact-hero {
          position: relative;
          z-index: 10;
          padding: 140px 24px 60px;
          text-align: center;
        }
        .contact-hero h1 {
          font-size: clamp(32px, 6vw, 48px);
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
        }
        .contact-hero p {
          font-size: 17px;
          color: var(--text-secondary);
          max-width: 500px;
          margin: 0 auto;
          line-height: 1.6;
        }
        .contact-content {
          position: relative;
          z-index: 10;
          max-width: 800px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }
        .contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 48px;
        }
        .contact-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 28px;
          transition: all 0.2s;
        }
        .contact-card:hover {
          border-color: rgba(255, 107, 53, 0.2);
          transform: translateY(-2px);
        }
        .contact-card-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--orange-dim);
          border-radius: 12px;
          color: var(--orange);
          margin-bottom: 16px;
        }
        .contact-card h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .contact-card p {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .contact-card a {
          color: var(--orange);
          text-decoration: none;
          font-weight: 500;
        }
        .contact-card a:hover { text-decoration: underline; }
        .contact-notice {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 24px;
        }
        .contact-notice-header {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          font-weight: 600;
          color: var(--orange);
          margin-bottom: 12px;
        }
        .contact-notice p {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.7;
        }
        @media (max-width: 768px) {
          .contact-nav { padding: 0 20px; }
          .contact-nav-links { display: none; }
          .contact-mobile-btn { display: block; }
          .contact-hero { padding: 100px 20px 40px; }
          .contact-content { padding: 0 20px 60px; }
          .contact-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="contact-page">
        <div className="bg-grid"></div>

        <nav className="contact-nav">
          <Link href="/" className="contact-logo">
            <Image src="/logos/favicons/favicon.svg" alt="605b.ai" width={44} height={44} className="contact-logo-icon" />
            <span className="contact-logo-text">
              <span className="contact-logo-main">605b</span><span className="contact-logo-ext">.ai</span>
            </span>
          </Link>
          <div className="contact-nav-links">
            <Link href="/" className="contact-nav-link">Home</Link>
            <Link href="/about" className="contact-nav-link">About</Link>
            <Link href="/pricing" className="contact-nav-link">Pricing</Link>
            {isSignedIn ? (
              <Link href="/dashboard" className="contact-nav-btn">Dashboard</Link>
            ) : (
              <Link href="/sign-up" className="contact-nav-btn">Get Started</Link>
            )}
          </div>
          <button className="contact-mobile-btn" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
        </nav>

        <div className={`contact-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
            <span className="contact-logo">
              <Image src="/logos/favicons/favicon.svg" alt="605b.ai" width={44} height={44} className="contact-logo-icon" />
              <span className="contact-logo-text">
                <span className="contact-logo-main">605b</span><span className="contact-logo-ext">.ai</span>
              </span>
            </span>
            <button className="contact-mobile-btn" style={{ display: 'block' }} onClick={() => setMobileMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Link href="/" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '24px', fontWeight: 600 }} onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/about" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '24px', fontWeight: 600 }} onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link href="/pricing" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '24px', fontWeight: 600 }} onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
          </div>
        </div>

        <section className="contact-hero">
          <h1>Contact Us</h1>
          <p>Questions about 605b.ai? We provide software tools only. We do not act on your behalf.</p>
        </section>

        <div className="contact-content">
          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-card-icon"><Mail size={22} /></div>
              <h3>Email</h3>
              <p><a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a></p>
              <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                General inquiries and support
              </p>
            </div>
            <div className="contact-card">
              <div className="contact-card-icon"><Phone size={22} /></div>
              <h3>Phone</h3>
              <p><a href={COMPANY_PHONE_TEL}>{COMPANY_PHONE}</a></p>
              <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Monday – Friday, 9am – 5pm PT
              </p>
            </div>
            <div className="contact-card">
              <div className="contact-card-icon"><MapPin size={22} /></div>
              <h3>Company</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                {COMPANY_NAME}<br />
                {COMPANY_LOCATION}
              </p>
            </div>
          </div>

          <div className="contact-notice">
            <div className="contact-notice-header">
              <Shield size={18} />
              Important Notice
            </div>
            <p>
              605b.ai is <strong>self-service dispute documentation software</strong>.
              We do not send letters on your behalf. We do not contact creditors or credit bureaus for you.
              We do not guarantee any outcomes. We are not a credit repair organization, law firm, or
              financial advisor.
            </p>
            <p style={{ marginTop: '12px' }}>
              For legal questions regarding your specific situation, please consult a licensed attorney.
            </p>
          </div>
        </div>

        <SiteFooter variant="full" />
      </div>
    </>
  );
}
