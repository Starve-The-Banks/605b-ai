"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Mail, Clock, HelpCircle, Shield, Menu, X } from 'lucide-react';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/constants';
import SiteFooter from '@/app/components/SiteFooter';

export default function SupportPage() {

  return (
    <>
      <style jsx global>{`
        .support-page {
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
        .support-nav {
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
        .support-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--text);
        }
        .support-logo-icon { width: 44px; height: 44px; flex-shrink: 0; }
        .support-logo-text { display: flex; align-items: baseline; line-height: 1; letter-spacing: -0.02em; }
        .support-logo-main { font-size: 24px; font-weight: 600; color: var(--text); }
        .support-logo-ext { font-size: 24px; font-weight: 600; color: var(--orange); }
        .support-nav-links { display: flex; gap: 24px; align-items: center; }
        .support-nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;
        }
        .support-nav-link:hover { color: var(--text); }
        .support-nav-btn {
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
        .support-nav-btn:hover { background: #E55A2B; }
        .support-mobile-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text);
          cursor: pointer;
          padding: 8px;
        }
        .support-mobile-menu {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: var(--bg);
          z-index: 200;
          padding: 24px;
          flex-direction: column;
        }
        .support-mobile-menu.open { display: flex; }
        .support-hero {
          position: relative;
          z-index: 10;
          padding: 140px 24px 60px;
          text-align: center;
        }
        .support-hero h1 {
          font-size: clamp(32px, 6vw, 48px);
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
        }
        .support-hero p {
          font-size: 17px;
          color: var(--text-secondary);
          max-width: 500px;
          margin: 0 auto;
          line-height: 1.6;
        }
        .support-content {
          position: relative;
          z-index: 10;
          max-width: 900px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }
        .support-contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 64px;
        }
        .support-contact-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 28px;
          transition: all 0.2s;
        }
        .support-contact-card:hover {
          border-color: rgba(255, 107, 53, 0.2);
          transform: translateY(-2px);
        }
        .support-contact-icon {
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
        .support-contact-card h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .support-contact-card p {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .support-contact-card a {
          color: var(--orange);
          text-decoration: none;
          font-weight: 500;
        }
        .support-contact-card a:hover { text-decoration: underline; }
        .support-faq {
          margin-bottom: 48px;
        }
        .support-faq h2 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 32px;
          color: var(--text);
          text-align: center;
        }
        .faq-item {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 16px;
          transition: all 0.2s;
        }
        .faq-item:hover {
          border-color: rgba(255, 107, 53, 0.2);
        }
        .faq-question {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 12px;
        }
        .faq-question-icon {
          color: var(--orange);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .faq-answer {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.7;
          margin-left: 32px;
        }
        .support-notice {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 28px;
          margin-bottom: 48px;
        }
        .support-notice-header {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 16px;
          font-weight: 600;
          color: var(--orange);
          margin-bottom: 16px;
        }
        .support-notice p {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: 12px;
        }
        .support-notice p:last-child {
          margin-bottom: 0;
        }
        @media (max-width: 768px) {
          .support-nav { padding: 0 20px; }
          .support-nav-links { display: none; }
          .support-mobile-btn { display: block; }
          .support-hero { padding: 100px 20px 40px; }
          .support-content { padding: 0 20px 60px; }
          .support-contact-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="support-page">
        <div className="bg-grid"></div>

        <nav className="support-nav">
          <Link href="/" className="support-logo">
            <Image src="/logos/favicons/favicon.svg" alt="605b.ai" width={44} height={44} className="support-logo-icon" />
            <span className="support-logo-text">
              <span className="support-logo-main">605b</span><span className="support-logo-ext">.ai</span>
            </span>
          </Link>
          <div className="support-nav-links">
            <Link href="/" className="support-nav-link">Home</Link>
            <Link href="/about" className="support-nav-link">About</Link>
            <Link href="/pricing" className="support-nav-link">Pricing</Link>
            <Link href="/sign-up" className="support-nav-btn">Get Started</Link>
          </div>
        </nav>

        <section className="support-hero">
          <h1>Support</h1>
          <p>Get help with your 605b.ai account and credit dispute documentation.</p>
        </section>

        <div className="support-content">
          <div className="support-contact-grid">
            <div className="support-contact-card">
              <div className="support-contact-icon"><Mail size={22} /></div>
              <h3>Email Support</h3>
              <p><a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a></p>
              <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                General inquiries and technical support
              </p>
            </div>
            <div className="support-contact-card">
              <div className="support-contact-icon"><Clock size={22} /></div>
              <h3>Response Time</h3>
              <p>We typically respond within 24-48 hours during business days.</p>
              <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Monday – Friday, 9am – 5pm PT
              </p>
            </div>
          </div>

          <div className="support-faq">
            <h2>Frequently Asked Questions</h2>
            <div className="faq-item">
              <div className="faq-question">
                <HelpCircle size={18} className="faq-question-icon" />
                <span>How do I access my account?</span>
              </div>
              <div className="faq-answer">
                Sign in using the same email address you used to register. If you're having trouble, use the 'Forgot Password' link on the sign-in page, or contact us for assistance.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-question">
                <HelpCircle size={18} className="faq-question-icon" />
                <span>What are the different subscription tiers?</span>
              </div>
              <div className="faq-answer">
                We offer Free (basic document review), Plus (enhanced analysis and templates), and Pro (comprehensive dispute toolkit with priority support). View detailed pricing on our pricing page.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-question">
                <HelpCircle size={18} className="faq-question-icon" />
                <span>How do I use the dispute toolkit?</span>
              </div>
              <div className="faq-answer">
                Upload your credit reports, review flagged items identified by our analysis, customize the generated dispute letters, and download your documentation. Our dashboard provides step-by-step guidance.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-question">
                <HelpCircle size={18} className="faq-question-icon" />
                <span>I'm having technical issues with the platform</span>
              </div>
              <div className="faq-answer">
                First, try refreshing your browser or clearing your browser cache. If issues persist, contact our support team with details about your browser, device, and the specific error you're encountering.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-question">
                <HelpCircle size={18} className="faq-question-icon" />
                <span>Is my personal information secure?</span>
              </div>
              <div className="faq-answer">
                Yes. We use industry-standard encryption and security practices. We do not store sensitive information like full SSNs or account numbers. Review our Privacy Policy for complete details.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-question">
                <HelpCircle size={18} className="faq-question-icon" />
                <span>What happens after I generate dispute letters?</span>
              </div>
              <div className="faq-answer">
                605b.ai generates documentation for your review. You are responsible for sending letters yourself. We provide guidance on mailing addresses and follow-up timelines, but do not send correspondence on your behalf.
              </div>
            </div>
          </div>

          <div className="support-notice">
            <div className="support-notice-header">
              <Shield size={20} />
              Important Notice
            </div>
            <p>
              605b.ai is <strong>self-service dispute documentation software</strong>.
              We provide tools to help you generate and organize documentation for credit disputes.
              We do not send letters on your behalf, contact creditors or credit bureaus for you,
              or guarantee any outcomes.
            </p>
            <p>
              We are not a credit repair organization, law firm, or financial advisor.
              For legal questions regarding your specific situation, please consult a licensed attorney.
            </p>
            <p>
              All support is provided for software usage only. We cannot provide legal advice
              or specific guidance on your credit situation.
            </p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link href="/" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'var(--orange)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}>
              Return to Homepage
            </Link>
          </div>
        </div>

        <SiteFooter variant="full" />
      </div>
    </>
  );
}