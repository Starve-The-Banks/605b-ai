"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import { 
  Shield, Menu, X, ArrowRight, Eye, Lock, Send, 
  FileText, Users, Target, Zap, Scale, CheckCircle2
} from 'lucide-react';
import { useState } from 'react';


export default function AboutPage() {
  const { isSignedIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <style jsx global>{`
        * { box-sizing: border-box; }

        .about-page {
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
          gap: 10px;
          text-decoration: none;
          color: var(--text);
          transition: opacity 0.2s;
        }

        .logo:hover {
          opacity: 0.85;
        }

        .logo-icon {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .logo:hover .logo-icon {
          transform: scale(1.05) rotate(-3deg);
        }

        .logo-text {
          display: flex;
          align-items: baseline;
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .logo-text-main {
          font-size: 24px;
          font-weight: 600;
          color: var(--text);
        }

        .logo-text-ext {
          font-size: 24px;
          font-weight: 600;
          color: var(--orange);
          margin-left: 0;
        }

        .nav-links {
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-link:hover { color: var(--text); }

        .nav-button {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
        }

        .nav-button:hover {
          border-color: var(--border-hover);
          background: rgba(255, 255, 255, 0.02);
        }

        .nav-button-primary {
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

        .nav-button-primary:hover {
          background: #E55A2B;
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
          padding: 24px;
          flex-direction: column;
        }

        .mobile-menu.open { display: flex; }

        .mobile-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 48px;
        }

        .mobile-menu-links {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .mobile-menu-link {
          color: var(--text);
          text-decoration: none;
          font-size: 24px;
          font-weight: 600;
        }

        .mobile-menu-buttons {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 28px;
          background: var(--orange);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #E55A2B;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px var(--orange-glow);
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 28px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          font-size: 16px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--border-hover);
        }

        /* Hero Header */
        .page-header {
          position: relative;
          padding: 140px 24px 80px;
          text-align: center;
          overflow: hidden;
          z-index: 10;
        }

        .page-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: var(--orange-dim);
          border: 1px solid rgba(255, 107, 53, 0.15);
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          color: var(--orange);
          margin-bottom: 24px;
          letter-spacing: 0.02em;
        }

        .page-title {
          font-size: clamp(36px, 8vw, 56px);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.035em;
          margin-bottom: 20px;
        }

        .page-subtitle {
          font-size: clamp(17px, 2.5vw, 20px);
          line-height: 1.6;
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto;
        }

        /* Why Section */
        .why-section {
          padding: 80px 24px 100px;
          background: var(--bg);
          position: relative;
          z-index: 10;
        }

        .why-container {
          max-width: 760px;
          margin: 0 auto;
        }

        .why-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--orange);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .why-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(255, 107, 53, 0.3), transparent);
        }

        .why-title {
          font-size: clamp(32px, 5vw, 44px);
          font-weight: 700;
          letter-spacing: -0.025em;
          margin-bottom: 40px;
          line-height: 1.15;
        }

        .why-content {
          font-size: 18px;
          line-height: 1.85;
          color: var(--text-secondary);
        }

        .why-content p {
          margin-bottom: 28px;
        }

        .why-content strong {
          color: var(--text);
          font-weight: 600;
        }

        .why-highlight {
          position: relative;
          padding: 28px 32px;
          background: linear-gradient(135deg, var(--orange-dim) 0%, rgba(255, 107, 53, 0.03) 100%);
          border-left: 3px solid var(--orange);
          border-radius: 0 16px 16px 0;
          margin: 40px 0;
          font-size: 17px;
          color: #e5e5e5;
          font-style: italic;
          line-height: 1.7;
        }

        .why-closing {
          font-size: 20px;
          color: var(--text);
          font-weight: 600;
          padding-top: 24px;
          border-top: 1px solid var(--border);
          margin-top: 40px;
          letter-spacing: -0.01em;
        }

        /* Principles Section */
        .principles-section {
          padding: 100px 24px;
          background: var(--bg-secondary);
          position: relative;
          z-index: 10;
        }

        .principles-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .section-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .section-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--orange);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: clamp(28px, 5vw, 36px);
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
        }

        .section-subtitle {
          font-size: 17px;
          color: var(--text-muted);
          max-width: 500px;
          margin: 0 auto;
        }

        .principles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .principle-card {
          padding: 32px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .principle-card:hover {
          border-color: rgba(255, 107, 53, 0.2);
          transform: translateY(-4px);
        }

        .principle-icon {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--orange-dim);
          border-radius: 12px;
          color: var(--orange);
          margin-bottom: 20px;
        }

        .principle-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
          color: var(--text);
        }

        .principle-desc {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.7;
        }

        /* What We Are / Aren't */
        .contrast-section {
          padding: 100px 24px;
          background: var(--bg);
          position: relative;
          z-index: 10;
        }

        .contrast-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .contrast-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-top: 48px;
        }

        .contrast-card {
          padding: 32px;
          border-radius: 16px;
        }

        .contrast-card.negative {
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.15);
        }

        .contrast-card.positive {
          background: rgba(34, 197, 94, 0.05);
          border: 1px solid rgba(34, 197, 94, 0.15);
        }

        .contrast-header {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .contrast-card.negative .contrast-header { color: #ef4444; }
        .contrast-card.positive .contrast-header { color: #22c55e; }

        .contrast-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .contrast-list li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 0;
          font-size: 15px;
          color: var(--text-secondary);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .contrast-list li:last-child { border-bottom: none; }

        .contrast-card.negative .contrast-list li svg {
          color: #ef4444;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .contrast-card.positive .contrast-list li svg {
          color: #22c55e;
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* Company Section */
        .company-section {
          padding: 100px 24px;
          background: var(--bg-secondary);
          position: relative;
          z-index: 10;
        }

        .company-container {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .company-logo {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, var(--orange-dim) 0%, rgba(255, 107, 53, 0.05) 100%);
          border: 1px solid rgba(255, 107, 53, 0.2);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 28px;
          font-weight: 700;
          color: var(--orange);
        }

        .company-name {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .company-tagline {
          font-size: 16px;
          color: var(--text-muted);
          margin-bottom: 32px;
        }

        .company-details {
          display: flex;
          justify-content: center;
          gap: 48px;
          flex-wrap: wrap;
          padding: 32px 0;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }

        .company-detail { text-align: center; }

        .company-detail-label {
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 6px;
        }

        .company-detail-value {
          font-size: 15px;
          color: var(--text-secondary);
        }

        .company-contact { margin-top: 32px; }

        .company-contact p {
          font-size: 15px;
          color: var(--text-muted);
          margin-bottom: 12px;
        }

        .company-contact a {
          color: var(--orange);
          text-decoration: none;
          font-weight: 500;
        }

        .company-contact a:hover { text-decoration: underline; }

        /* CTA Section */
        .cta-section {
          padding: 100px 24px;
          text-align: center;
          background: var(--bg);
          position: relative;
          z-index: 10;
        }

        .cta-title {
          font-size: clamp(28px, 5vw, 40px);
          font-weight: 700;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }

        .cta-subtitle {
          font-size: 17px;
          color: var(--text-secondary);
          margin-bottom: 32px;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }

        .cta-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* Footer */
        .footer {
          border-top: 1px solid var(--border);
          padding: 48px 24px 24px;
          background: var(--bg-secondary);
          position: relative;
          z-index: 10;
        }

        .footer-content {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .footer-main {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 48px;
        }

        .footer-brand { max-width: 300px; }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          text-decoration: none;
          color: var(--text);
        }

        .footer-tagline {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.6;
        }

        .footer-links {
          display: flex;
          gap: 48px;
          flex-wrap: wrap;
        }

        .footer-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-column-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 4px;
        }

        .footer-link {
          font-size: 14px;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-link:hover { color: var(--orange); }

        .footer-disclaimer {
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }

        .disclaimer-text {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.7;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 24px;
          border-top: 1px solid var(--border);
          font-size: 13px;
          color: var(--text-muted);
          flex-wrap: wrap;
          gap: 16px;
        }

        .footer-bottom-links {
          display: flex;
          gap: 24px;
        }

        .footer-bottom-link {
          font-size: 13px;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-bottom-link:hover { color: var(--orange); }

        /* Mobile */
        @media (max-width: 768px) {
          .nav { padding: 0 20px; }
          .nav-links { display: none; }
          .mobile-menu-btn { display: block; }

          .page-header { padding: 100px 20px 60px; }

          .why-section { padding: 60px 20px 80px; }
          .why-content { font-size: 16px; }
          .why-highlight { padding: 24px; font-size: 15px; }
          .why-closing { font-size: 18px; }

          .principles-section,
          .contrast-section,
          .company-section { padding: 60px 20px; }

          .principles-grid { grid-template-columns: 1fr; }
          .principle-card { padding: 24px; }

          .contrast-grid { grid-template-columns: 1fr; }
          .contrast-card { padding: 24px; }

          .company-details { gap: 24px; }

          .cta-section { padding: 60px 20px; }

          .btn-primary, .btn-secondary {
            padding: 14px 24px;
            font-size: 15px;
            width: 100%;
            justify-content: center;
            min-height: 48px;
          }

          .footer-main { flex-direction: column; }
          .footer-links { gap: 32px; }
          .footer-bottom { flex-direction: column; text-align: center; }
        }
      `}</style>

      <div className="about-page">
        <div className="bg-grid"></div>

        {/* Navigation */}
        <nav className="nav">
          <Link href="/" className="logo">
            <Image src="/logos/favicons/favicon.svg" alt="605b.ai" width={44} height={44} className="logo-icon" />
            <span className="logo-text">
              <span className="logo-text-main">605b</span><span className="logo-text-ext">.ai</span>
            </span>
          </Link>
          <div className="nav-links">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/pricing" className="nav-link">Pricing</Link>
            {isSignedIn ? (
              <Link href="/dashboard" className="nav-button-primary">Dashboard</Link>
            ) : (
              <>
                <Link href="/sign-in" className="nav-button">Log In</Link>
                <Link href="/sign-up" className="nav-button-primary">Get Started</Link>
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
              <Image src="/logos/favicons/favicon.svg" alt="605b.ai" width={44} height={44} className="logo-icon" />
              <span className="logo-text">
                <span className="logo-text-main">605b</span><span className="logo-text-ext">.ai</span>
              </span>
            </span>
            <button className="mobile-menu-btn" style={{ display: 'block' }} onClick={() => setMobileMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <div className="mobile-menu-links">
            <Link href="/" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/pricing" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
          </div>
          <div className="mobile-menu-buttons">
            {isSignedIn ? (
              <Link href="/dashboard" className="btn-primary" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            ) : (
              <>
                <Link href="/sign-up" className="btn-primary" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                <Link href="/sign-in" className="btn-secondary" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
              </>
            )}
          </div>
        </div>

        {/* Page Header */}
        <header className="page-header">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="page-badge">
              <Shield size={14} />
              About Us
            </div>
            <h1 className="page-title">Built Different</h1>
            <p className="page-subtitle">
              We're not a credit repair company. We build software that puts 
              the process in your hands.
            </p>
          </div>
        </header>

        {/* Why 605b.ai Exists - NEW CONTENT */}
        <section className="why-section">
          <div className="why-container">
            <div className="why-label">Our Philosophy</div>
            <h2 className="why-title">Why 605b.ai Exists</h2>
            <div className="why-content">
              <p>
                <strong>Fixing credit report errors isn't a secret process — it's just fragmented and confusing.</strong>
              </p>
              <p>
                Over time, that confusion created an industry that sits between people and their own rights. Many services work behind the scenes, charge ongoing fees, reuse generic letters, and don't clearly explain what they're doing.
              </p>
              <p>
                <strong>We chose a different approach.</strong>
              </p>
              <p>
                605b.ai compiles and organizes the real credit dispute process into simple, self-service software. Everything is transparent and under your control. Nothing is sent on your behalf. Nothing is hidden.
              </p>
              <p>
                You generate the documents, review them, and send them yourself.
              </p>
              <div className="why-highlight">
                In practical terms, this removes the middleman and puts the process back in your hands.
              </div>
              <p className="why-closing">
                If you can follow directions and go to the post office, you can use this.
              </p>
            </div>
          </div>
        </section>

        {/* Principles */}
        <section className="principles-section">
          <div className="principles-container">
            <div className="section-header">
              <div className="section-label">Our Principles</div>
              <h2 className="section-title">What Guides Us</h2>
              <p className="section-subtitle">
                The principles that shape how we build and operate.
              </p>
            </div>
            <div className="principles-grid">
              <div className="principle-card">
                <div className="principle-icon"><Eye size={26} /></div>
                <h3 className="principle-title">Radical Transparency</h3>
                <p className="principle-desc">
                  Every template, every workflow, every piece of guidance is visible to you. 
                  We don't hide the process behind a service layer.
                </p>
              </div>
              <div className="principle-card">
                <div className="principle-icon"><Lock size={26} /></div>
                <h3 className="principle-title">User Control</h3>
                <p className="principle-desc">
                  You generate the documents. You review them. You send them. We never act on 
                  your behalf or contact anyone for you.
                </p>
              </div>
              <div className="principle-card">
                <div className="principle-icon"><Target size={26} /></div>
                <h3 className="principle-title">No False Promises</h3>
                <p className="principle-desc">
                  We don't guarantee outcomes. Results depend on your specific situation and 
                  your follow-through.
                </p>
              </div>
              <div className="principle-card">
                <div className="principle-icon"><Zap size={26} /></div>
                <h3 className="principle-title">One-Time Pricing</h3>
                <p className="principle-desc">
                  No subscriptions. No monthly fees. Pay once, use until you're done. The 
                  dispute process has an endpoint.
                </p>
              </div>
              <div className="principle-card">
                <div className="principle-icon"><Scale size={26} /></div>
                <h3 className="principle-title">Statute-Driven Design</h3>
                <p className="principle-desc">
                  Every template references real federal law. FCRA §605B, §611, FDCPA §809. 
                  Built around the actual legal framework.
                </p>
              </div>
              <div className="principle-card">
                <div className="principle-icon"><Shield size={26} /></div>
                <h3 className="principle-title">Privacy First</h3>
                <p className="principle-desc">
                  We do not store your uploaded credit report PDFs as retrievable files. They are
                  processed for analysis and not retained as documents.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What We Are / Aren't */}
        <section className="contrast-section">
          <div className="contrast-container">
            <div className="section-header">
              <div className="section-label">Clear Positioning</div>
              <h2 className="section-title">What We Are (and Aren't)</h2>
              <p className="section-subtitle">Understanding the difference matters.</p>
            </div>
            <div className="contrast-grid">
              <div className="contrast-card negative">
                <div className="contrast-header"><X size={18} /> We Are Not</div>
                <ul className="contrast-list">
                  <li><X size={16} /><span>A credit repair organization</span></li>
                  <li><X size={16} /><span>A law firm or legal service</span></li>
                  <li><X size={16} /><span>A service that acts on your behalf</span></li>
                  <li><X size={16} /><span>A subscription-based monthly fee</span></li>
                  <li><X size={16} /><span>A guarantee of any specific outcome</span></li>
                </ul>
              </div>
              <div className="contrast-card positive">
                <div className="contrast-header"><CheckCircle2 size={18} /> We Are</div>
                <ul className="contrast-list">
                  <li><CheckCircle2 size={16} /><span>Self-service document software</span></li>
                  <li><CheckCircle2 size={16} /><span>Educational guidance on your rights</span></li>
                  <li><CheckCircle2 size={16} /><span>Tools you control completely</span></li>
                  <li><CheckCircle2 size={16} /><span>One-time purchase, use until done</span></li>
                  <li><CheckCircle2 size={16} /><span>A transparent workflow organizer</span></li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Company */}
        <section className="company-section">
          <div className="company-container">
            <div className="company-logo">9</div>
            <h2 className="company-name">Ninth Wave Analytics LLC</h2>
            <p className="company-tagline">Building tools for consumer empowerment</p>
            <div className="company-details">
              <div className="company-detail">
                <div className="company-detail-label">Incorporated</div>
                <div className="company-detail-value">Delaware, USA</div>
              </div>
              <div className="company-detail">
                <div className="company-detail-label">Headquarters</div>
                <div className="company-detail-value">California</div>
              </div>
              <div className="company-detail">
                <div className="company-detail-label">Product</div>
                <div className="company-detail-value">605b.ai</div>
              </div>
            </div>
            <div className="company-contact">
              <p>Questions? Reach out.</p>
              <a href="mailto:support@9thwave.io">support@9thwave.io</a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <h2 className="cta-title">Ready to take control?</h2>
          <p className="cta-subtitle">
            Start organizing your credit dispute process. Free to analyze. 
            Upgrade when you're ready to act.
          </p>
          <div className="cta-buttons">
            <Link href="/sign-up" className="btn-primary">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link href="/pricing" className="btn-secondary">
              View Pricing
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-main">
              <div className="footer-brand">
                <Link href="/" className="footer-logo">
                  <Image src="/logos/favicons/favicon.svg" alt="605b.ai" width={44} height={44} className="logo-icon" />
                  <span className="logo-text">
                    <span className="logo-text-main">605b</span><span className="logo-text-ext">.ai</span>
                  </span>
                </Link>
                <p className="footer-tagline">Self-service software for credit dispute organization.</p>
              </div>
              <div className="footer-links">
                <div className="footer-column">
                  <div className="footer-column-title">Product</div>
                  <Link href="/sign-up" className="footer-link">Get Started</Link>
                  <Link href="/#features" className="footer-link">Features</Link>
                  <Link href="/pricing" className="footer-link">Pricing</Link>
                </div>
                <div className="footer-column">
                  <div className="footer-column-title">Company</div>
                  <Link href="/about" className="footer-link">About</Link>
                  <Link href="/terms" className="footer-link">Terms of Service</Link>
                  <Link href="/privacy" className="footer-link">Privacy Policy</Link>
                </div>
                <div className="footer-column">
                  <div className="footer-column-title">Contact</div>
                  <a href="mailto:support@9thwave.io" className="footer-link">support@9thwave.io</a>
                </div>
              </div>
            </div>
            
            <div className="footer-disclaimer">
              <p className="disclaimer-text">
                <strong>Important Disclaimer:</strong> 605b.ai provides software tools and educational guidance only. 
                We are not a law firm, credit repair organization, or credit counseling service. We do not provide 
                legal advice, credit repair services, or guarantees of any outcomes.
              </p>
            </div>

            <div className="footer-bottom">
              <div>© {new Date().getFullYear()} Ninth Wave Analytics LLC · Delaware, USA</div>
              <div className="footer-bottom-links">
                <Link href="/terms" className="footer-bottom-link">Terms</Link>
                <Link href="/privacy" className="footer-bottom-link">Privacy</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
