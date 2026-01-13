"use client";

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { 
  Shield, Menu, X, ArrowRight, Eye, Lock, Send, 
  FileText, Users, Target, Zap, Scale, CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useState } from 'react';

export default function AboutPage() {
  const { isSignedIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        
        .about-page {
          min-height: 100vh;
          background: #09090b;
          color: #fafafa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        /* Navigation */
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
        
        .logo-accent {
          color: #f7d047;
        }
        
        .nav-links {
          display: flex;
          gap: 24px;
          align-items: center;
        }
        
        .nav-link {
          color: #a1a1aa;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
        }
        
        .nav-link:hover {
          color: #fafafa;
        }
        
        .nav-button {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid #27272a;
          border-radius: 8px;
          color: #fafafa;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
        }
        
        .nav-button-primary {
          padding: 8px 16px;
          background: #f7d047;
          border: none;
          border-radius: 8px;
          color: #09090b;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
        }
        
        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: #fafafa;
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
          background: #09090b;
          z-index: 200;
          padding: 24px;
          flex-direction: column;
        }
        
        .mobile-menu.open {
          display: flex;
        }
        
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
          color: #fafafa;
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
          background: #f7d047;
          border: none;
          border-radius: 10px;
          color: #09090b;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        
        .btn-primary:hover {
          background: #e5c33f;
          transform: translateY(-2px);
        }
        
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 28px;
          background: transparent;
          border: 1px solid #27272a;
          border-radius: 10px;
          color: #fafafa;
          font-size: 16px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
        }
        
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: #3f3f46;
        }
        
        /* Page Header */
        .page-header {
          padding: 140px 24px 60px;
          text-align: center;
          background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(247, 208, 71, 0.06), transparent);
        }
        
        .page-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: rgba(247, 208, 71, 0.08);
          border: 1px solid rgba(247, 208, 71, 0.15);
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          color: #f7d047;
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
          color: #a1a1aa;
          max-width: 600px;
          margin: 0 auto;
        }
        
        /* Why Section - Primary */
        .why-section {
          padding: 80px 24px 100px;
          background: #09090b;
        }
        
        .why-container {
          max-width: 760px;
          margin: 0 auto;
        }
        
        .why-label {
          font-size: 12px;
          font-weight: 600;
          color: #f7d047;
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
          background: linear-gradient(90deg, rgba(247, 208, 71, 0.3), transparent);
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
          color: #a1a1aa;
        }
        
        .why-content p {
          margin-bottom: 28px;
        }
        
        .why-content strong {
          color: #fafafa;
          font-weight: 600;
        }
        
        .why-highlight {
          position: relative;
          padding: 28px 32px;
          background: linear-gradient(135deg, rgba(247, 208, 71, 0.08) 0%, rgba(247, 208, 71, 0.03) 100%);
          border-left: 3px solid #f7d047;
          border-radius: 0 16px 16px 0;
          margin: 40px 0;
          font-size: 17px;
          color: #e5e5e5;
          font-style: italic;
          line-height: 1.7;
        }
        
        .why-closing {
          font-size: 20px;
          color: #fafafa;
          font-weight: 600;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          margin-top: 40px;
          letter-spacing: -0.01em;
        }
        
        /* Principles Section */
        .principles-section {
          padding: 100px 24px;
          background: #0c0c0e;
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
          color: #f7d047;
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
          color: #71717a;
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
          background: #111113;
          border: 1px solid #1c1c1f;
          border-radius: 16px;
          transition: all 0.3s ease;
        }
        
        .principle-card:hover {
          border-color: rgba(247, 208, 71, 0.2);
          transform: translateY(-4px);
        }
        
        .principle-icon {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(247, 208, 71, 0.1);
          border-radius: 12px;
          color: #f7d047;
          margin-bottom: 20px;
        }
        
        .principle-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #fafafa;
        }
        
        .principle-desc {
          font-size: 15px;
          color: #a1a1aa;
          line-height: 1.7;
        }
        
        /* What We're Not Section */
        .contrast-section {
          padding: 100px 24px;
          background: #09090b;
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
        
        .contrast-card.negative .contrast-header {
          color: #ef4444;
        }
        
        .contrast-card.positive .contrast-header {
          color: #22c55e;
        }
        
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
          color: #a1a1aa;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .contrast-list li:last-child {
          border-bottom: none;
        }
        
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
          background: #0c0c0e;
        }
        
        .company-container {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }
        
        .company-logo {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, rgba(247, 208, 71, 0.15) 0%, rgba(247, 208, 71, 0.05) 100%);
          border: 1px solid rgba(247, 208, 71, 0.2);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 28px;
          font-weight: 700;
          color: #f7d047;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        
        .company-tagline {
          font-size: 16px;
          color: #71717a;
          margin-bottom: 32px;
        }
        
        .company-details {
          display: flex;
          justify-content: center;
          gap: 48px;
          flex-wrap: wrap;
          padding: 32px 0;
          border-top: 1px solid #1c1c1f;
          border-bottom: 1px solid #1c1c1f;
        }
        
        .company-detail {
          text-align: center;
        }
        
        .company-detail-label {
          font-size: 12px;
          color: #52525b;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 6px;
        }
        
        .company-detail-value {
          font-size: 15px;
          color: #a1a1aa;
        }
        
        .company-contact {
          margin-top: 32px;
        }
        
        .company-contact p {
          font-size: 15px;
          color: #71717a;
          margin-bottom: 12px;
        }
        
        .company-contact a {
          color: #f7d047;
          text-decoration: none;
          font-weight: 500;
        }
        
        .company-contact a:hover {
          text-decoration: underline;
        }
        
        /* CTA Section */
        .cta-section {
          padding: 100px 24px;
          text-align: center;
          background: linear-gradient(180deg, #09090b 0%, #0c0c0e 100%);
        }
        
        .cta-title {
          font-size: clamp(28px, 5vw, 40px);
          font-weight: 700;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }
        
        .cta-subtitle {
          font-size: 17px;
          color: #a1a1aa;
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
          border-top: 1px solid #1c1c1f;
          padding: 0 24px;
          background: #0c0c0e;
        }
        
        .footer-main {
          display: flex;
          flex-direction: column;
          gap: 32px;
          padding: 48px 0;
          border-bottom: 1px solid #1c1c1f;
        }
        
        .footer-brand {
          max-width: 300px;
        }
        
        .footer-logo {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 12px;
          color: #fafafa;
        }
        
        .footer-tagline {
          font-size: 14px;
          color: #71717a;
          line-height: 1.6;
        }
        
        .footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 48px;
        }
        
        .footer-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .footer-column-title {
          font-size: 13px;
          font-weight: 600;
          color: #fafafa;
          margin-bottom: 4px;
        }
        
        .footer-link {
          font-size: 14px;
          color: #71717a;
          text-decoration: none;
        }
        
        .footer-link:hover {
          color: #f7d047;
        }
        
        .footer-disclaimer {
          padding: 24px 0;
          border-bottom: 1px solid #1c1c1f;
        }
        
        .disclaimer-text {
          font-size: 12px;
          color: #52525b;
          line-height: 1.7;
        }
        
        .footer-bottom {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 24px 0;
          font-size: 13px;
          color: #52525b;
        }
        
        .footer-bottom-links {
          display: flex;
          gap: 24px;
        }
        
        .footer-bottom-link {
          font-size: 13px;
          color: #52525b;
          text-decoration: none;
        }
        
        .footer-bottom-link:hover {
          color: #f7d047;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }
          
          .mobile-menu-btn {
            display: block;
          }
          
          .page-header {
            padding: 100px 20px 40px;
          }
          
          .why-section {
            padding: 60px 20px 80px;
          }
          
          .why-content {
            font-size: 16px;
          }
          
          .why-highlight {
            padding: 24px;
            font-size: 15px;
          }
          
          .why-closing {
            font-size: 18px;
          }
          
          .principles-section,
          .contrast-section,
          .company-section {
            padding: 60px 20px;
          }
          
          .principles-grid {
            grid-template-columns: 1fr;
          }
          
          .principle-card {
            padding: 24px;
          }
          
          .contrast-grid {
            grid-template-columns: 1fr;
          }
          
          .contrast-card {
            padding: 24px;
          }
          
          .company-details {
            gap: 24px;
          }
          
          .cta-section {
            padding: 60px 20px;
          }
          
          .btn-primary, .btn-secondary {
            padding: 14px 24px;
            font-size: 15px;
            width: 100%;
            justify-content: center;
            min-height: 48px;
          }
          
          .footer-main {
            flex-direction: column;
          }
          
          .footer-links {
            gap: 32px;
          }
        }
        
        @media (min-width: 769px) {
          .footer-main {
            flex-direction: row;
            justify-content: space-between;
          }
          
          .footer-bottom {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
      `}</style>

      <div className="about-page">
        {/* Navigation */}
        <nav className="nav">
          <Link href="/" className="logo">
            605b<span className="logo-accent">.ai</span>
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
            <span className="logo">605b<span className="logo-accent">.ai</span></span>
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(false)}>
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
          <div className="page-badge">
            <Shield size={14} />
            About Us
          </div>
          <h1 className="page-title">Built Different</h1>
          <p className="page-subtitle">
            We're not a credit repair company. We build software that puts 
            the process in your hands.
          </p>
        </header>

        {/* Why 605b.ai Exists - Primary Asset */}
        <section className="why-section">
          <div className="why-container">
            <div className="why-label">Our Philosophy</div>
            <h2 className="why-title">Why 605b.ai Exists</h2>
            <div className="why-content">
              <p>
                <strong>The lawful credit dispute process isn't secret — it's fragmented.</strong>
              </p>
              <p>
                Over time, that fragmentation gave rise to an industry built around acting as an 
                intermediary between people and their own rights. Most services operate behind 
                the scenes, charge ongoing fees, reuse generic templates, and keep the mechanics opaque.
              </p>
              <p>
                <strong>We took the opposite approach.</strong>
              </p>
              <p>
                605b.ai compiles and structures the real dispute process into self-service software 
                that keeps everything transparent and user-controlled. Nothing is sent on your behalf. 
                Nothing is hidden. You generate the documents, review them, and send them yourself.
              </p>
              <div className="why-highlight">
                In practice, this is a decentralization of a service model that depends on opacity and dependency.
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
                <div className="principle-icon">
                  <Eye size={26} />
                </div>
                <h3 className="principle-title">Radical Transparency</h3>
                <p className="principle-desc">
                  Every template, every workflow, every piece of guidance is visible to you. 
                  We don't hide the process behind a service layer. You see exactly what gets sent.
                </p>
              </div>
              <div className="principle-card">
                <div className="principle-icon">
                  <Lock size={26} />
                </div>
                <h3 className="principle-title">User Control</h3>
                <p className="principle-desc">
                  You generate the documents. You review them. You send them. We never act on 
                  your behalf or contact anyone for you. Your data stays yours.
                </p>
              </div>
              <div className="principle-card">
                <div className="principle-icon">
                  <Target size={26} />
                </div>
                <h3 className="principle-title">No False Promises</h3>
                <p className="principle-desc">
                  We don't guarantee outcomes. Results depend on your specific situation, the 
                  accuracy of information on your reports, and your follow-through.
                </p>
              </div>
              <div className="principle-card">
                <div className="principle-icon">
                  <Zap size={26} />
                </div>
                <h3 className="principle-title">One-Time Pricing</h3>
                <p className="principle-desc">
                  No subscriptions. No monthly fees. Pay once, use until you're done. The 
                  dispute process has an endpoint — your pricing should too.
                </p>
              </div>
              <div className="principle-card">
                <div className="principle-icon">
                  <Scale size={26} />
                </div>
                <h3 className="principle-title">Statute-Driven Design</h3>
                <p className="principle-desc">
                  Every template references real federal law. FCRA §605B, §611, FDCPA §809. 
                  The workflows are built around the actual legal framework.
                </p>
              </div>
              <div className="principle-card">
                <div className="principle-icon">
                  <Shield size={26} />
                </div>
                <h3 className="principle-title">Privacy First</h3>
                <p className="principle-desc">
                  Uploaded PDFs are processed in-memory and immediately discarded. We don't 
                  store your credit reports. Your sensitive data never touches our servers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What We Are vs Aren't */}
        <section className="contrast-section">
          <div className="contrast-container">
            <div className="section-header">
              <div className="section-label">Clear Positioning</div>
              <h2 className="section-title">What We Are (and Aren't)</h2>
              <p className="section-subtitle">
                Understanding the difference matters.
              </p>
            </div>
            <div className="contrast-grid">
              <div className="contrast-card negative">
                <div className="contrast-header">
                  <X size={18} />
                  We Are Not
                </div>
                <ul className="contrast-list">
                  <li>
                    <X size={16} />
                    <span>A credit repair organization</span>
                  </li>
                  <li>
                    <X size={16} />
                    <span>A law firm or legal service</span>
                  </li>
                  <li>
                    <X size={16} />
                    <span>A service that acts on your behalf</span>
                  </li>
                  <li>
                    <X size={16} />
                    <span>A subscription-based monthly fee</span>
                  </li>
                  <li>
                    <X size={16} />
                    <span>A guarantee of any specific outcome</span>
                  </li>
                </ul>
              </div>
              <div className="contrast-card positive">
                <div className="contrast-header">
                  <CheckCircle2 size={18} />
                  We Are
                </div>
                <ul className="contrast-list">
                  <li>
                    <CheckCircle2 size={16} />
                    <span>Self-service document software</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} />
                    <span>Educational guidance on your rights</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} />
                    <span>Tools you control completely</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} />
                    <span>One-time purchase, use until done</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} />
                    <span>A transparent workflow organizer</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Company Info */}
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
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">605b<span className="logo-accent">.ai</span></div>
              <p className="footer-tagline">Self-service software for credit dispute organization.</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <div className="footer-column-title">Product</div>
                <Link href="/sign-up" className="footer-link">Get Started</Link>
                <Link href="/#features" className="footer-link">Features</Link>
                <Link href="/#how-it-works" className="footer-link">How It Works</Link>
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
              legal advice, credit repair services, or guarantees of any outcomes. The information provided is 
              for educational purposes and should not be construed as legal advice. Results depend entirely on 
              individual circumstances. Consult with a qualified attorney for legal advice specific to your situation.
            </p>
          </div>

          <div className="footer-bottom">
            <div>© {new Date().getFullYear()} Ninth Wave Analytics LLC · Delaware, USA</div>
            <div className="footer-bottom-links">
              <Link href="/terms" className="footer-bottom-link">Terms</Link>
              <Link href="/privacy" className="footer-bottom-link">Privacy</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
