"use client";

import { useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import {
  Check, X, Shield, Zap, Crown, ArrowRight, FileText,
  MessageSquare, Clock, Download, Scale, AlertTriangle,
  ChevronDown, ChevronUp, HelpCircle, Eye, Sparkles,
  FileSearch, Lock, Plus, Menu
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
    color: '#FF6B35',
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
    q: 'Do you offer refunds?',
    a: 'No. All purchases are final. Because 605b.ai provides immediate access to digital software tools and documentation, refunds are not available once access is granted. We encourage users to review each tier carefully and use the free tier before purchasing.',
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
    a: 'Yes. We do not store your uploaded credit report PDFs as retrievable files. They are processed for analysis and not retained as documents; only the analysis results you choose to save are stored to your account. Your dispute data is encrypted and only accessible to you.',
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <style jsx global>{`
        .pricing-page {
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

        .nav {
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

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--text);
        }

        .logo-mark {
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

        .logo-text {
          font-size: 16px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .nav-links {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .nav-link {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          font-size: 14px;
          text-decoration: none;
          transition: all 0.2s;
        }

        .nav-link:hover {
          border-color: var(--border-hover);
          background: rgba(255, 255, 255, 0.02);
        }

        .nav-link-primary {
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

        .nav-link-primary:hover {
          background: #E55A2B;
        }

        .hero {
          padding: 140px 24px 60px;
          text-align: center;
          position: relative;
          z-index: 10;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--orange-dim);
          border: 1px solid rgba(255, 107, 53, 0.2);
          border-radius: 100px;
          font-size: 13px;
          color: var(--orange);
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
          color: var(--text-secondary);
          max-width: 500px;
          margin: 0 auto 16px;
          line-height: 1.6;
        }

        .hero-note {
          font-size: 14px;
          color: var(--text-muted);
        }

        .pricing-section {
          padding: 0 24px 40px;
          position: relative;
          z-index: 10;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .pricing-card {
          background: var(--bg-card);
          border: 2px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          position: relative;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
        }

        .pricing-card:hover {
          border-color: var(--border-hover);
          transform: translateY(-2px);
        }

        .pricing-card.recommended {
          border-color: var(--orange);
          background: linear-gradient(180deg, var(--orange-dim) 0%, var(--bg-card) 100%);
        }

        .pricing-card.free {
          border-style: dashed;
          background: linear-gradient(180deg, rgba(107, 114, 128, 0.05) 0%, var(--bg-card) 100%);
        }

        .recommended-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          padding: 6px 16px;
          background: var(--orange);
          color: white;
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
          background: var(--border);
          color: var(--text-secondary);
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
          color: var(--text-muted);
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
          color: var(--text-muted);
          vertical-align: top;
        }

        .price-label {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .tier-best-for {
          padding: 10px 14px;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }

        .tier-best-for strong {
          color: var(--text);
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
          color: var(--text-muted);
        }

        .feature-text {
          color: var(--text-secondary);
        }

        .feature-text.excluded {
          color: var(--text-muted);
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
          background: var(--orange);
          color: white;
        }

        .buy-button.primary:hover {
          background: #E55A2B;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px var(--orange-glow);
        }

        .buy-button.secondary {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text);
        }

        .buy-button.secondary:hover {
          background: rgba(255,255,255,0.05);
          border-color: var(--border-hover);
        }

        .buy-button.free-btn {
          background: transparent;
          border: 1px solid var(--border-hover);
          color: var(--text-secondary);
        }

        .buy-button.free-btn:hover {
          background: rgba(255,255,255,0.03);
          color: var(--text);
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
          position: relative;
          z-index: 10;
        }

        .disclaimer-box {
          background: var(--bg-card);
          border: 2px solid var(--border);
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
          color: var(--orange);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .disclaimer-text {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: 16px;
        }

        .disclaimer-checkbox {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          background: var(--orange-dim);
          border: 1px solid rgba(255, 107, 53, 0.2);
          border-radius: 8px;
          cursor: pointer;
        }

        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text);
          cursor: pointer;
          padding: 8px;
        }

        .mobile-menu {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--bg);
          z-index: 200;
          padding: 20px;
          flex-direction: column;
        }

        .mobile-menu.open {
          display: flex;
        }

        .mobile-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }

        .mobile-menu-links {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .mobile-menu-link {
          display: block;
          padding: 14px 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
          text-decoration: none;
          border-bottom: 1px solid var(--border);
        }

        .mobile-menu-buttons {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mobile-menu-btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 24px;
          background: var(--orange);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
        }

        .mobile-menu-btn-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 24px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          font-size: 16px;
          font-weight: 500;
          text-decoration: none;
        }

        .disclaimer-checkbox:hover {
          background: rgba(255, 107, 53, 0.08);
        }

        .disclaimer-checkbox input {
          width: 20px;
          height: 20px;
          margin-top: 2px;
          accent-color: var(--orange);
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
          position: relative;
          z-index: 10;
        }

        .addons-title {
          font-size: 20px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 8px;
        }

        .addons-subtitle {
          font-size: 14px;
          color: var(--text-muted);
          text-align: center;
          margin-bottom: 24px;
        }

        .addons-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }

        .addon-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
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
          color: var(--text-muted);
        }

        .addon-price {
          font-size: 18px;
          font-weight: 700;
          color: var(--orange);
          white-space: nowrap;
        }

        .addon-button {
          padding: 8px 12px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-secondary);
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }

        .addon-button:hover {
          background: rgba(255,255,255,0.05);
          color: var(--text);
        }

        /* Comparison Section */
        .comparison-section {
          max-width: 1100px;
          margin: 0 auto 60px;
          padding: 0 24px;
          position: relative;
          z-index: 10;
        }

        .comparison-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-secondary);
          font-size: 14px;
          cursor: pointer;
          margin: 0 auto 24px;
          transition: all 0.2s;
        }

        .comparison-toggle:hover {
          border-color: var(--border-hover);
          color: var(--text);
        }

        .comparison-table {
          width: 100%;
          border-collapse: collapse;
          background: var(--bg-card);
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--border);
        }

        .comparison-table th,
        .comparison-table td {
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }

        .comparison-table th {
          background: var(--bg-secondary);
          font-weight: 600;
          font-size: 13px;
        }

        .comparison-table td {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .comparison-table td:first-child {
          color: var(--text);
        }

        /* Legal Section */
        .legal-section {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 24px;
          border-top: 1px solid var(--border);
          position: relative;
          z-index: 10;
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
          color: var(--text-muted);
          line-height: 1.7;
        }

        /* FAQ Section */
        .faq-section {
          max-width: 700px;
          margin: 0 auto;
          padding: 60px 24px;
          position: relative;
          z-index: 10;
        }

        .faq-title {
          font-size: 24px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 32px;
        }

        .faq-item {
          border: 1px solid var(--border);
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
          background: var(--bg-card);
          border: none;
          color: var(--text);
          font-size: 15px;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
        }

        .faq-answer {
          padding: 0 20px 18px;
          background: var(--bg-card);
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.7;
        }

        /* CTA Section */
        .cta-section {
          text-align: center;
          padding: 60px 24px 80px;
          background: var(--bg-secondary);
          position: relative;
          z-index: 10;
        }

        .cta-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .cta-text {
          font-size: 16px;
          color: var(--text-muted);
          margin-bottom: 24px;
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: var(--orange);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cta-button:hover {
          background: #E55A2B;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px var(--orange-glow);
        }

        @media (max-width: 768px) {
          .nav { padding: 12px 16px; }
          .nav-links { display: none; }
          .mobile-menu-btn { display: block; }
          .pricing-grid { grid-template-columns: 1fr; padding: 0; }
          .hero { padding: 100px 16px 32px; }
          .hero-badge { font-size: 12px; padding: 6px 12px; }
          .hero-title { font-size: 26px; }
          .hero-subtitle { font-size: 14px; }
          .hero-note { font-size: 13px; }
          .pricing-section { padding: 0 16px 32px; }
          .disclaimer-section { padding: 0 16px; margin-bottom: 32px !important; }
          .disclaimer-box { padding: 16px; }
          .disclaimer-title { font-size: 14px; }
          .disclaimer-text { font-size: 12px; }
          .disclaimer-checkbox { padding: 10px 12px; }
          .disclaimer-checkbox input { width: 18px; height: 18px; }
          .disclaimer-checkbox-text { font-size: 13px; }
          .pricing-card { padding: 20px; }
          .tier-header { gap: 12px; }
          .tier-icon { width: 40px; height: 40px; }
          .tier-name { font-size: 16px; }
          .tier-desc { font-size: 12px; }
          .price-amount { font-size: 36px; }
          .price-free { font-size: 28px; }
          .price-label { font-size: 12px; }
          .tier-best-for { font-size: 11px; padding: 8px 12px; }
          .feature-item { font-size: 12px; padding: 5px 0; }
          .feature-icon { width: 16px; height: 16px; }
          .buy-button { padding: 14px 20px; font-size: 14px; min-height: 48px; }
          .comparison-section { padding: 0 16px; overflow-x: auto; }
          .comparison-table { font-size: 10px; min-width: 500px; }
          .comparison-table th,
          .comparison-table td { padding: 8px 6px; white-space: nowrap; }
          .comparison-toggle { font-size: 13px; padding: 10px 16px; }
          .addons-section { padding: 0 16px; }
          .addons-grid { grid-template-columns: 1fr; }
          .addon-card { flex-direction: column; align-items: flex-start; gap: 12px; }
          .addon-card > div:last-child { width: 100%; justify-content: space-between; }
          .addon-button { flex: 1; justify-content: center; min-height: 44px; }
          .legal-section { padding: 32px 16px; }
          .legal-title { font-size: 18px; }
          .legal-text { font-size: 13px; }
          .faq-section { padding: 40px 16px; }
          .faq-title { font-size: 20px; margin-bottom: 24px; }
          .faq-question { padding: 14px 16px; font-size: 14px; }
          .faq-answer { padding: 0 16px 14px; font-size: 13px; }
          .cta-section { padding: 40px 16px 60px; }
          .cta-title { font-size: 22px; }
          .cta-text { font-size: 14px; }
          .cta-button { padding: 14px 24px; font-size: 15px; width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="pricing-page">
        <div className="bg-grid"></div>

        {/* Nav */}
        <nav className="nav">
          <Link href="/" className="logo">
            <div className="logo-mark">605B</div>
            <span className="logo-text">605b.ai</span>
          </Link>
          <div className="nav-links">
            <Link href="/about" className="nav-link" style={{ border: 'none', padding: '8px 12px' }}>About</Link>
            {isSignedIn ? (
              <Link href="/dashboard" className="nav-link">Dashboard</Link>
            ) : (
              <>
                <Link href="/sign-in" className="nav-link">Log In</Link>
                <Link href="/sign-up" className="nav-link-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
        </nav>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-header">
            <span className="logo">
              <div className="logo-mark">605B</div>
              <span className="logo-text">605b.ai</span>
            </span>
            <button className="mobile-menu-btn" style={{ display: 'block' }} onClick={() => setMobileMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <div className="mobile-menu-links">
            <Link href="/" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/about" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <a href="#checkout-disclaimer" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
          </div>
          <div className="mobile-menu-buttons">
            {isSignedIn ? (
              <Link href="/dashboard" className="mobile-menu-btn-primary" onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/sign-up" className="mobile-menu-btn-primary" onClick={() => setMobileMenuOpen(false)}>
                  Get Started
                </Link>
                <Link href="/sign-in" className="mobile-menu-btn-secondary" onClick={() => setMobileMenuOpen(false)}>
                  Log In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Hero */}
        <section className="hero">
          <div>
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
          </div>
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
            <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '13px', color: '#fca5a5' }}>
              <strong>All sales are final.</strong> Access to digital software tools is granted immediately upon purchase.
            </div>
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
                  <div className="free-badge">Free Analyzer (Read-Only)</div>
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
                      Start Report Analysis
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
            Start Report Analysis
            <ArrowRight size={18} />
          </Link>
        </section>
      </div>
    </>
  );
}
