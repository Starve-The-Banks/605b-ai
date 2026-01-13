"use client";

import { useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import {
  Check, X, Shield, Zap, Crown, ArrowRight, FileText,
  MessageSquare, Clock, Download, Scale, AlertTriangle,
  ChevronDown, ChevronUp, HelpCircle, Eye, Sparkles,
  FileSearch, Lock, Plus
} from 'lucide-react';

const TIERS = [
  {
    id: 'free',
    name: 'Credit Report Analyzer',
    price: 0,
    description: 'Understand your credit report',
    icon: FileSearch,
    color: '#6b7280',
    recommended: false,
    isFree: true,
    features: [
      { text: 'Upload 1 credit report (PDF)', included: true },
      { text: 'Read-only analysis summary', included: true },
      { text: 'Issue categorization', included: true },
      { text: 'Educational process walkthrough', included: true },
      { text: '"What you can do" checklist', included: true },
      { text: 'Letter downloads', included: false },
      { text: 'Exports', included: false },
      { text: 'Dispute tracking', included: false },
    ],
    bestFor: 'Learning about your credit situation before committing',
    note: 'Educational access only',
  },
  {
    id: 'toolkit',
    name: 'Dispute Toolkit',
    price: 39,
    description: 'Core dispute documentation',
    icon: FileText,
    color: '#3b82f6',
    recommended: false,
    features: [
      { text: 'Full analysis export (PDF)', included: true },
      { text: 'Core bureau dispute templates', included: true },
      { text: 'Dispute tracker (manual status)', included: true },
      { text: 'Certified mail checklist', included: true },
      { text: 'Educational guidance', included: true },
      { text: 'Full template library (62 letters)', included: false },
      { text: 'AI Strategist', included: false },
      { text: 'Creditor dispute templates', included: false },
      { text: 'Escalation templates', included: false },
    ],
    bestFor: 'Simple disputes with 1-5 items at a single bureau',
  },
  {
    id: 'advanced',
    name: 'Advanced Dispute Suite',
    price: 89,
    description: 'Full dispute capabilities',
    icon: Zap,
    color: '#f7d047',
    recommended: true,
    features: [
      { text: 'Everything in Dispute Toolkit', included: true },
      { text: 'Full template library (62 letters)', included: true },
      { text: 'Creditor dispute templates', included: true },
      { text: 'CFPB + FTC complaint generators', included: true },
      { text: 'Multi-round dispute organization', included: true },
      { text: 'Escalation documentation', included: true },
      { text: 'AI Strategist (educational)', included: true },
      { text: '605B identity theft workflow', included: false },
      { text: 'Attorney-ready compilation', included: false },
    ],
    bestFor: 'Multi-bureau disputes, collections, creditor issues',
  },
  {
    id: 'identity-theft',
    name: '605B Identity Theft Toolkit',
    price: 179,
    description: 'Complete fraud documentation',
    icon: Shield,
    color: '#22c55e',
    recommended: false,
    features: [
      { text: 'Everything in Advanced Suite', included: true },
      { text: '605B-specific workflows', included: true },
      { text: 'FTC Identity Theft Report integration', included: true },
      { text: 'Identity theft affidavits', included: true },
      { text: 'Police report templates', included: true },
      { text: 'Evidence packet builder', included: true },
      { text: 'Audit log export', included: true },
      { text: 'Attorney-ready document compilation', included: true },
    ],
    bestFor: 'Identity theft victims, fraudulent accounts, potential litigation',
  },
];

const ADDONS = [
  {
    id: 'extra-analysis',
    name: 'Additional Report Analysis',
    price: 7,
    description: 'Analyze another credit report PDF',
  },
  {
    id: 'ai-credits',
    name: 'AI Strategist Credits',
    price: 10,
    description: 'Additional AI guidance sessions',
  },
  {
    id: 'attorney-export',
    name: 'Attorney Export Pack',
    price: 39,
    description: 'Formatted documentation for legal counsel',
  },
];

const FAQS = [
  {
    q: 'Is this a subscription?',
    a: 'No. This is a one-time software license purchase. Pay once, use until your disputes are resolved. No recurring charges, no monthly fees.',
  },
  {
    q: 'What if I need more than my tier includes?',
    a: 'You can upgrade anytime by paying the difference between tiers. Additional PDF analyses are available as add-ons.',
  },
  {
    q: 'Do you send letters on my behalf?',
    a: 'No. This is self-service software. You generate your own dispute correspondence, customize it with your information, and send it yourself. This keeps you in control.',
  },
  {
    q: 'Do you guarantee results?',
    a: 'No. Results depend entirely on your individual circumstances, the accuracy of information on your reports, and your follow-through. We provide tools and education—you do the work.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. Uploaded PDFs are processed in-memory and immediately discarded—never stored on our servers. Your dispute data is encrypted and only accessible to you.',
  },
  {
    q: 'What\'s the difference between this and a credit repair company?',
    a: 'Credit repair companies act on your behalf and are regulated under CROA. We provide software tools for you to act on your own behalf—like TurboTax for taxes. You maintain full control and responsibility.',
  },
  {
    q: 'Why is the Identity Theft tier more expensive?',
    a: 'Identity theft cases involve complex documentation requirements: FTC reports, police reports, fraud affidavits, 605B blocking requests, and potential litigation preparation. The toolkit includes specialized workflows for all of these.',
  },
];

export default function PricingPage() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [loading, setLoading] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showComparison, setShowComparison] = useState(true);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showDisclaimerError, setShowDisclaimerError] = useState(false);

  const handleCheckout = async (tier) => {
    // Free tier goes straight to signup
    if (tier.isFree) {
      window.location.href = `/sign-up?tier=${tier.id}`;
      return;
    }

    // Paid tiers require disclaimer acceptance
    if (!disclaimerAccepted) {
      setShowDisclaimerError(true);
      // Scroll to disclaimer
      document.getElementById('checkout-disclaimer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!isSignedIn) {
      window.location.href = `/sign-up?tier=${tier.id}`;
      return;
    }

    setLoading(tier.id);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: tier.id,
          disclaimerAccepted: true,
          disclaimerTimestamp: new Date().toISOString(),
        }),
      });

      const { url, error } = await response.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleAddonCheckout = async (addon) => {
    if (!isSignedIn) {
      window.location.href = `/sign-up?addon=${addon.id}`;
      return;
    }

    setLoading(addon.id);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addonId: addon.id,
          disclaimerAccepted: true,
        }),
      });

      const { url, error } = await response.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <style jsx>{`
        .pricing-page {
          min-height: 100vh;
          background: #09090b;
          color: #fafafa;
        }

        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(9, 9, 11, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .logo {
          font-size: 22px;
          font-weight: 700;
          color: #fafafa;
          text-decoration: none;
        }

        .logo-accent { color: #f7d047; }

        .nav-links {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .nav-link {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid #27272a;
          border-radius: 8px;
          color: #fafafa;
          font-size: 14px;
          text-decoration: none;
        }

        .hero {
          padding: 140px 24px 60px;
          text-align: center;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(247, 208, 71, 0.1);
          border: 1px solid rgba(247, 208, 71, 0.2);
          border-radius: 100px;
          font-size: 13px;
          color: #f7d047;
          margin-bottom: 24px;
        }

        .hero-title {
          font-size: clamp(28px, 6vw, 44px);
          font-weight: 700;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-size: 16px;
          color: #a1a1aa;
          max-width: 500px;
          margin: 0 auto 16px;
          line-height: 1.6;
        }

        .hero-note {
          font-size: 14px;
          color: #52525b;
        }

        .pricing-section {
          padding: 0 24px 40px;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .pricing-card {
          background: #111113;
          border: 2px solid #1c1c1f;
          border-radius: 16px;
          padding: 24px;
          position: relative;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
        }

        .pricing-card:hover {
          border-color: #27272a;
          transform: translateY(-2px);
        }

        .pricing-card.recommended {
          border-color: #f7d047;
          background: linear-gradient(180deg, rgba(247, 208, 71, 0.08) 0%, #111113 100%);
        }

        .pricing-card.free {
          border-style: dashed;
          background: linear-gradient(180deg, rgba(107, 114, 128, 0.05) 0%, #111113 100%);
        }

        .recommended-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          padding: 6px 16px;
          background: #f7d047;
          color: #09090b;
          font-size: 12px;
          font-weight: 700;
          border-radius: 100px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .free-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          padding: 6px 16px;
          background: #27272a;
          color: #a1a1aa;
          font-size: 12px;
          font-weight: 600;
          border-radius: 100px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .tier-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 16px;
        }

        .tier-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .tier-name {
          font-size: 17px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .tier-desc {
          font-size: 13px;
          color: #71717a;
        }

        .tier-price {
          margin-bottom: 16px;
        }

        .price-amount {
          font-size: 40px;
          font-weight: 700;
        }

        .price-free {
          font-size: 32px;
          font-weight: 700;
          color: #6b7280;
        }

        .price-currency {
          font-size: 20px;
          color: #71717a;
          vertical-align: top;
        }

        .price-label {
          font-size: 13px;
          color: #52525b;
          margin-top: 4px;
        }

        .tier-best-for {
          padding: 10px 14px;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          font-size: 12px;
          color: #a1a1aa;
          margin-bottom: 16px;
        }

        .tier-best-for strong {
          color: #fafafa;
        }

        .tier-note {
          padding: 8px 12px;
          background: rgba(107, 114, 128, 0.1);
          border-radius: 6px;
          font-size: 11px;
          color: #9ca3af;
          margin-bottom: 16px;
          text-align: center;
        }

        .features-list {
          margin-bottom: 20px;
          flex: 1;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 6px 0;
          font-size: 13px;
        }

        .feature-icon {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .feature-icon.included {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .feature-icon.excluded {
          background: rgba(113, 113, 122, 0.15);
          color: #52525b;
        }

        .feature-text {
          color: #a1a1aa;
        }

        .feature-text.excluded {
          color: #52525b;
        }

        .buy-button {
          width: 100%;
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .buy-button.primary {
          background: #f7d047;
          color: #09090b;
        }

        .buy-button.primary:hover {
          background: #e5c33f;
          transform: translateY(-1px);
        }

        .buy-button.secondary {
          background: transparent;
          border: 1px solid #27272a;
          color: #fafafa;
        }

        .buy-button.secondary:hover {
          background: rgba(255,255,255,0.05);
          border-color: #3f3f46;
        }

        .buy-button.free-btn {
          background: transparent;
          border: 1px solid #3f3f46;
          color: #a1a1aa;
        }

        .buy-button.free-btn:hover {
          background: rgba(255,255,255,0.03);
          color: #fafafa;
        }

        .buy-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Disclaimer Section */
        .disclaimer-section {
          max-width: 800px;
          margin: 0 auto 40px;
          padding: 0 24px;
        }

        .disclaimer-box {
          background: #111113;
          border: 2px solid #1c1c1f;
          border-radius: 12px;
          padding: 24px;
        }

        .disclaimer-box.error {
          border-color: #ef4444;
          animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .disclaimer-title {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 12px;
          color: #f7d047;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .disclaimer-text {
          font-size: 13px;
          color: #a1a1aa;
          line-height: 1.7;
          margin-bottom: 16px;
        }

        .disclaimer-checkbox {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(247, 208, 71, 0.05);
          border: 1px solid rgba(247, 208, 71, 0.2);
          border-radius: 8px;
          cursor: pointer;
        }

        .disclaimer-checkbox:hover {
          background: rgba(247, 208, 71, 0.08);
        }

        .disclaimer-checkbox input {
          width: 20px;
          height: 20px;
          margin-top: 2px;
          accent-color: #f7d047;
          cursor: pointer;
        }

        .disclaimer-checkbox-text {
          font-size: 14px;
          color: #e5e5e5;
          font-weight: 500;
        }

        .disclaimer-error {
          color: #ef4444;
          font-size: 13px;
          margin-top: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Add-ons Section */
        .addons-section {
          max-width: 800px;
          margin: 0 auto 60px;
          padding: 0 24px;
        }

        .addons-title {
          font-size: 20px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 8px;
        }

        .addons-subtitle {
          font-size: 14px;
          color: #71717a;
          text-align: center;
          margin-bottom: 24px;
        }

        .addons-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }

        .addon-card {
          background: #111113;
          border: 1px solid #1c1c1f;
          border-radius: 10px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .addon-info h4 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .addon-info p {
          font-size: 12px;
          color: #71717a;
        }

        .addon-price {
          font-size: 18px;
          font-weight: 700;
          color: #f7d047;
          white-space: nowrap;
        }

        .addon-button {
          padding: 8px 12px;
          background: transparent;
          border: 1px solid #27272a;
          border-radius: 6px;
          color: #a1a1aa;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .addon-button:hover {
          background: rgba(255,255,255,0.05);
          color: #fafafa;
        }

        /* Comparison Section */
        .comparison-section {
          max-width: 1100px;
          margin: 0 auto 60px;
          padding: 0 24px;
        }

        .comparison-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          background: transparent;
          border: 1px solid #27272a;
          border-radius: 10px;
          color: #a1a1aa;
          font-size: 14px;
          cursor: pointer;
          margin: 0 auto 24px;
        }

        .comparison-table {
          width: 100%;
          border-collapse: collapse;
          background: #111113;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #1c1c1f;
        }

        .comparison-table th,
        .comparison-table td {
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid #1c1c1f;
        }

        .comparison-table th {
          background: #0c0c0e;
          font-weight: 600;
          font-size: 13px;
        }

        .comparison-table td {
          font-size: 13px;
          color: #a1a1aa;
        }

        .comparison-table td:first-child {
          color: #fafafa;
        }

        /* Legal Section */
        .legal-section {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 24px;
          border-top: 1px solid #1c1c1f;
        }

        .legal-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 10px;
          font-size: 13px;
          color: #22c55e;
          margin-bottom: 20px;
        }

        .legal-title {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .legal-text {
          font-size: 14px;
          color: #71717a;
          line-height: 1.7;
        }

        /* FAQ Section */
        .faq-section {
          max-width: 700px;
          margin: 0 auto;
          padding: 60px 24px;
        }

        .faq-title {
          font-size: 24px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 32px;
        }

        .faq-item {
          border: 1px solid #1c1c1f;
          border-radius: 12px;
          margin-bottom: 12px;
          overflow: hidden;
        }

        .faq-question {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          background: #111113;
          border: none;
          color: #fafafa;
          font-size: 15px;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
        }

        .faq-answer {
          padding: 0 20px 18px;
          background: #111113;
          font-size: 14px;
          color: #a1a1aa;
          line-height: 1.7;
        }

        /* CTA Section */
        .cta-section {
          text-align: center;
          padding: 60px 24px 80px;
          background: #0c0c0e;
        }

        .cta-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .cta-text {
          font-size: 16px;
          color: #71717a;
          margin-bottom: 24px;
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: #f7d047;
          border: none;
          border-radius: 10px;
          color: #09090b;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .nav-links { display: none; }
          .pricing-grid { grid-template-columns: 1fr; }
          .hero { padding: 120px 20px 40px; }
          .comparison-table { font-size: 11px; }
          .comparison-table th,
          .comparison-table td { padding: 10px 8px; }
          .addons-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="pricing-page">
        {/* Nav */}
        <nav className="nav">
          <Link href="/" className="logo">
            605b<span className="logo-accent">.ai</span>
          </Link>
          <div className="nav-links">
            {isSignedIn ? (
              <Link href="/dashboard" className="nav-link">Dashboard</Link>
            ) : (
              <>
                <Link href="/sign-in" className="nav-link">Log In</Link>
                <Link href="/sign-up" className="nav-link" style={{ background: '#f7d047', color: '#09090b', border: 'none' }}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Hero */}
        <section className="hero">
          <div className="hero-badge">
            <Scale size={14} />
            Software License · One-Time Purchase
          </div>
          <h1 className="hero-title">Simple, transparent pricing</h1>
          <p className="hero-subtitle">
            One payment. Use until you're done. No subscriptions, no recurring fees, no surprises.
          </p>
          <p className="hero-note">
            Start free to see your analysis. Upgrade when you're ready to act.
          </p>
        </section>

        {/* Important Disclosure - MOVED UP */}
        <section className="disclaimer-section" id="checkout-disclaimer" style={{ marginTop: '0', marginBottom: '40px' }}>
          <div className={`disclaimer-box ${showDisclaimerError && !disclaimerAccepted ? 'error' : ''}`}>
            <div className="disclaimer-title">
              <AlertTriangle size={18} />
              Important: Please Read Before Purchasing
            </div>
            <div className="disclaimer-text">
              605b.ai is <strong>self-service dispute documentation software</strong>.
              <br /><br />
              • We do <strong>not</strong> send letters on your behalf<br />
              • We do <strong>not</strong> contact creditors or credit bureaus for you<br />
              • We do <strong>not</strong> guarantee any outcome<br />
              <br />
              You are responsible for reviewing, printing, and sending all correspondence you generate. This platform is an educational and organizational tool designed to help you exercise your rights under federal consumer protection law.
            </div>
            <label className="disclaimer-checkbox">
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={(e) => {
                  setDisclaimerAccepted(e.target.checked);
                  if (e.target.checked) setShowDisclaimerError(false);
                }}
              />
              <span className="disclaimer-checkbox-text">
                I understand this is self-service software, not a credit repair service.
              </span>
            </label>
            {showDisclaimerError && !disclaimerAccepted && (
              <div className="disclaimer-error">
                <AlertTriangle size={14} />
                Please acknowledge the disclaimer to continue with purchase
              </div>
            )}
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pricing-section">
          <div className="pricing-grid">
            {TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`pricing-card ${tier.recommended ? 'recommended' : ''} ${tier.isFree ? 'free' : ''}`}
              >
                {tier.recommended && (
                  <div className="recommended-badge">Most Popular</div>
                )}
                {tier.isFree && (
                  <div className="free-badge">Free Forever</div>
                )}

                <div className="tier-header">
                  <div
                    className="tier-icon"
                    style={{ background: `${tier.color}20`, color: tier.color }}
                  >
                    <tier.icon size={22} />
                  </div>
                  <div>
                    <div className="tier-name">{tier.name}</div>
                    <div className="tier-desc">{tier.description}</div>
                  </div>
                </div>

                <div className="tier-price">
                  {tier.isFree ? (
                    <span className="price-free">Free</span>
                  ) : (
                    <>
                      <span className="price-currency">$</span>
                      <span className="price-amount">{tier.price}</span>
                    </>
                  )}
                  <div className="price-label">
                    {tier.isFree ? 'No credit card required' : 'One-time purchase'}
                  </div>
                </div>

                {tier.note && (
                  <div className="tier-note">{tier.note}</div>
                )}

                <div className="tier-best-for">
                  <strong>Best for:</strong> {tier.bestFor}
                </div>

                <div className="features-list">
                  {tier.features.map((feature, i) => (
                    <div key={i} className="feature-item">
                      <div className={`feature-icon ${feature.included ? 'included' : 'excluded'}`}>
                        {feature.included ? <Check size={10} /> : <X size={10} />}
                      </div>
                      <span className={`feature-text ${feature.included ? '' : 'excluded'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  className={`buy-button ${tier.recommended ? 'primary' : tier.isFree ? 'free-btn' : 'secondary'}`}
                  onClick={() => handleCheckout(tier)}
                  disabled={loading === tier.id}
                >
                  {loading === tier.id ? (
                    'Processing...'
                  ) : tier.isFree ? (
                    <>
                      Start Free Analysis
                      <ArrowRight size={16} />
                    </>
                  ) : (
                    <>
                      Buy {tier.name} — ${tier.price}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Add-ons */}
        <section className="addons-section">
          <h2 className="addons-title">Optional Add-ons</h2>
          <p className="addons-subtitle">Available for existing customers</p>
          <div className="addons-grid">
            {ADDONS.map((addon) => (
              <div key={addon.id} className="addon-card">
                <div className="addon-info">
                  <h4>{addon.name}</h4>
                  <p>{addon.description}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="addon-price">${addon.price}</span>
                  {isSignedIn && (
                    <button
                      className="addon-button"
                      onClick={() => handleAddonCheckout(addon)}
                      disabled={loading === addon.id}
                    >
                      <Plus size={12} />
                      Add
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison Table Toggle */}
        <section className="comparison-section">
          <button
            className="comparison-toggle"
            onClick={() => setShowComparison(!showComparison)}
          >
            {showComparison ? 'Hide' : 'Show'} detailed comparison
            {showComparison ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showComparison && (
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Free</th>
                  <th>Toolkit ($39)</th>
                  <th>Advanced ($89)</th>
                  <th>605B ($179)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>PDF Analysis</td>
                  <td>1 (read-only)</td>
                  <td>1 + export</td>
                  <td>3 + export</td>
                  <td>Unlimited</td>
                </tr>
                <tr>
                  <td>Letter Templates</td>
                  <td>—</td>
                  <td>Core bureau letters</td>
                  <td>All 62 templates</td>
                  <td>All 62 templates</td>
                </tr>
                <tr>
                  <td>Dispute Tracker</td>
                  <td>—</td>
                  <td>✓</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>AI Strategist</td>
                  <td>—</td>
                  <td>—</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>Creditor Disputes</td>
                  <td>—</td>
                  <td>—</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>CFPB/FTC Complaints</td>
                  <td>—</td>
                  <td>—</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>Escalation Templates</td>
                  <td>—</td>
                  <td>—</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>605B Workflow</td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>FTC Report Integration</td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>Identity Theft Affidavits</td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>Audit Log Export</td>
                  <td>—</td>
                  <td>—</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>Attorney-Ready Docs</td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                  <td>✓</td>
                </tr>
              </tbody>
            </table>
          )}
        </section>

        {/* Legal Positioning */}
        <section className="legal-section">
          <div className="legal-badge">
            <Shield size={14} />
            Software, Not Services
          </div>
          <h3 className="legal-title">Why one-time pricing works</h3>
          <p className="legal-text">
            605b.ai is self-service software—like TurboTax for credit disputes. You generate your own dispute correspondence, customize it, and send it yourself. We provide the tools and education; you do the work.
            <br /><br />
            Unlike credit repair services that charge monthly fees and act on your behalf, our one-time software license means you're not paying for something that should take 30-90 days as if it's a forever subscription. Pay once, use the tools, move on.
          </p>
        </section>

        {/* FAQ */}
        <section className="faq-section">
          <h2 className="faq-title">Frequently Asked Questions</h2>
          {FAQS.map((faq, i) => (
            <div key={i} className="faq-item">
              <button
                className="faq-question"
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
              >
                {faq.q}
                {expandedFaq === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {expandedFaq === i && (
                <div className="faq-answer">{faq.a}</div>
              )}
            </div>
          ))}
        </section>

        {/* Bottom CTA */}
        <section className="cta-section">
          <h2 className="cta-title">Not sure where to start?</h2>
          <p className="cta-text">
            Start free. Analyze your report. See what's possible.
          </p>
          <Link href="/sign-up" className="cta-button">
            Start Free Analysis
            <ArrowRight size={18} />
          </Link>
        </section>
      </div>
    </>
  );
}
