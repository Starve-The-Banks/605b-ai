"use client";

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { ArrowRight, Shield, Clock, FileText, Scale, Upload, Flag, BarChart3, Menu, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        
        .landing-page {
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
          display: flex;
          align-items: center;
          font-size: 20px;
          font-weight: 700;
          color: #fafafa;
          text-decoration: none;
          letter-spacing: -0.03em;
        }
        
        .logo-accent {
          background: linear-gradient(135deg, #d4a574 0%, #e8c4a0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
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
          background: #d4a574;
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
        
        /* Hero */
        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 120px 24px 80px;
          position: relative;
        }
        
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(212, 165, 116, 0.1);
          border: 1px solid rgba(212, 165, 116, 0.2);
          border-radius: 100px;
          font-size: 13px;
          color: #d4a574;
          margin-bottom: 24px;
        }
        
        .hero-title {
          font-size: clamp(32px, 8vw, 64px);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin-bottom: 20px;
        }
        
        .hero-title-accent {
          color: #d4a574;
        }
        
        .hero-subtitle {
          font-size: 16px;
          line-height: 1.7;
          color: #a1a1aa;
          max-width: 520px;
          margin-bottom: 32px;
        }
        
        .hero-cta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 32px;
        }
        
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 24px;
          background: #d4a574;
          border: none;
          border-radius: 8px;
          color: #09090b;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
        }
        
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 24px;
          background: transparent;
          border: 1px solid #27272a;
          border-radius: 8px;
          color: #fafafa;
          font-size: 15px;
          font-weight: 500;
          text-decoration: none;
        }
        
        .disclaimer-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 20px;
          background: rgba(113, 113, 122, 0.1);
          border: 1px solid rgba(113, 113, 122, 0.2);
          border-radius: 12px;
          font-size: 14px;
          color: #a1a1aa;
          max-width: 600px;
          text-align: left;
        }
        
        .scroll-indicator {
          position: absolute;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #52525b;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          transition: color 0.2s;
        }
        
        .scroll-indicator:hover {
          color: #d4a574;
        }
        
        .scroll-indicator svg {
          animation: bounceDown 2s ease-in-out infinite;
        }
        
        @keyframes bounceDown {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(8px);
          }
          60% {
            transform: translateY(4px);
          }
        }
        
        /* Sections */
        .section {
          padding: 80px 24px;
        }
        
        .section-dark {
          background: #0c0c0e;
        }
        
        .container {
          max-width: 1100px;
          margin: 0 auto;
        }
        
        .section-label {
          font-size: 13px;
          font-weight: 600;
          color: #d4a574;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 12px;
        }
        
        .section-title {
          font-size: clamp(24px, 5vw, 32px);
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }
        
        .section-subtitle {
          font-size: 15px;
          color: #a1a1aa;
          margin-bottom: 40px;
          max-width: 500px;
        }
        
        /* Steps */
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }
        
        .step-card {
          padding: 24px;
          background: #111113;
          border: 1px solid #1c1c1f;
          border-radius: 12px;
        }
        
        .step-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(212, 165, 116, 0.1);
          border-radius: 10px;
          color: #d4a574;
          margin-bottom: 16px;
        }
        
        .step-number {
          font-size: 13px;
          font-weight: 600;
          color: #52525b;
          margin-bottom: 8px;
        }
        
        .step-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #fafafa;
        }
        
        .step-desc {
          font-size: 14px;
          color: #a1a1aa;
          line-height: 1.6;
        }
        
        /* Features */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }
        
        .feature-card {
          padding: 24px;
          background: #0f0f11;
          border: 1px solid #1c1c1f;
          border-radius: 12px;
        }
        
        .feature-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(212, 165, 116, 0.1);
          border-radius: 10px;
          margin-bottom: 16px;
          color: #d4a574;
        }
        
        .feature-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #fafafa;
        }
        
        .feature-desc {
          font-size: 14px;
          line-height: 1.6;
          color: #a1a1aa;
        }
        
        /* Statutes */
        .statute-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }
        
        .statute-card {
          padding: 28px;
          background: #111113;
          border: 1px solid #1c1c1f;
          border-radius: 12px;
        }
        
        .statute-number {
          font-size: 28px;
          font-weight: 700;
          color: #d4a574;
          margin-bottom: 8px;
        }
        
        .statute-name {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #fafafa;
        }
        
        .statute-desc {
          font-size: 14px;
          color: #a1a1aa;
          line-height: 1.6;
        }
        
        /* CTA */
        .cta-section {
          padding: 80px 24px;
          text-align: center;
        }
        
        .cta-title {
          font-size: clamp(28px, 5vw, 36px);
          font-weight: 700;
          margin-bottom: 16px;
        }
        
        .cta-subtitle {
          font-size: 16px;
          color: #a1a1aa;
          margin-bottom: 32px;
        }
        
        .cta-disclaimer {
          font-size: 13px;
          color: #52525b;
          margin-top: 16px;
        }
        
        /* Footer */
        .footer {
          border-top: 1px solid #1c1c1f;
          padding: 0 24px;
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
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 12px;
          color: #fafafa;
          letter-spacing: -0.03em;
        }
        
        .footer-logo .logo-accent {
          background: linear-gradient(135deg, #d4a574 0%, #e8c4a0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
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
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }
          
          .mobile-menu-btn {
            display: block;
          }
          
          .hero {
            padding: 100px 20px 60px;
            min-height: auto;
          }
          
          .hero-badge {
            font-size: 12px;
            padding: 6px 12px;
          }
          
          .hero-subtitle {
            font-size: 15px;
          }
          
          .btn-primary, .btn-secondary {
            padding: 12px 20px;
            font-size: 14px;
            width: 100%;
            justify-content: center;
          }
          
          .disclaimer-banner {
            flex-direction: column;
            gap: 8px;
            font-size: 13px;
          }
          
          .section {
            padding: 60px 20px;
          }
          
          .section-subtitle {
            margin-bottom: 32px;
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

      <div className="landing-page">
        {/* Navigation */}
        <nav className="nav">
          <Link href="/" className="logo">
            605b<span className="logo-accent">.ai</span>
          </Link>
          <div className="nav-links">
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <a href="#features" className="nav-link">Features</a>
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
            <a href="#how-it-works" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#features" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Features</a>
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

        {/* Hero */}
        <section className="hero">
          <div className="hero-badge">
            <Shield size={14} />
            Document Management Software
          </div>
          <h1 className="hero-title">
            Organize your credit<br />
            <span className="hero-title-accent">dispute process.</span>
          </h1>
          <p className="hero-subtitle">
            Software tools to help you understand your rights under the Fair Credit Reporting Act, 
            organize documentation, and track your dispute workflow. Results depend on individual circumstances.
          </p>
          <div className="hero-cta">
            {isSignedIn ? (
              <Link href="/dashboard" className="btn-primary">
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link href="/sign-up" className="btn-primary">
                  Get Started Free <ArrowRight size={18} />
                </Link>
                <Link href="/sign-in" className="btn-secondary">
                  I have an account
                </Link>
              </>
            )}
          </div>
          <div className="disclaimer-banner">
            <Scale size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              605b.ai provides software tools and educational guidance. We do not provide legal advice, 
              credit repair services, or guarantees of outcomes.
            </span>
          </div>
          <a href="#how-it-works" className="scroll-indicator">
            <span>Learn more</span>
            <ChevronDown size={20} />
          </a>
        </section>

        {/* How It Works */}
        <section className="section section-dark" id="how-it-works">
          <div className="container">
            <div className="section-label">How It Works</div>
            <h2 className="section-title">A systematic workflow</h2>
            <p className="section-subtitle">
              Organize your dispute process with software tools designed around FCRA procedures.
            </p>
            <div className="steps-grid">
              {[
                { icon: Upload, num: '01', title: 'Upload & Identify', desc: 'Upload your credit reports. Our software helps you identify items you may want to review or dispute.' },
                { icon: FileText, num: '02', title: 'Organize Documentation', desc: 'Generate letter templates based on FCRA sections. Customize with your specific information.' },
                { icon: Flag, num: '03', title: 'Track Your Workflow', desc: 'Log sent correspondence, track statutory response windows, and maintain an organized timeline.' },
                { icon: BarChart3, num: '04', title: 'Document Everything', desc: 'Maintain an audit trail of all actions. Export records for your personal documentation.' },
              ].map((step, i) => (
                <div key={i} className="step-card">
                  <div className="step-icon"><step.icon size={24} /></div>
                  <div className="step-number">{step.num}</div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="section" id="features">
          <div className="container">
            <div className="section-label">Features</div>
            <h2 className="section-title">Software tools for organization</h2>
            <p className="section-subtitle">
              Everything you need to manage your dispute documentation workflow.
            </p>
            <div className="features-grid">
              {[
                { icon: Upload, title: 'Report Analysis', desc: 'Upload credit report PDFs. Software identifies items and provides educational context about relevant FCRA sections.' },
                { icon: Clock, title: 'Deadline Tracking', desc: 'Track statutory response windows. The software calculates timeframes based on FCRA requirements.' },
                { icon: FileText, title: 'Letter Templates', desc: 'Access template library for common dispute correspondence. Customize templates with your information.' },
                { icon: Shield, title: 'Educational Guidance', desc: 'AI assistant trained on consumer protection statutes provides educational information about your rights.' },
                { icon: Flag, title: 'Item Flagging', desc: 'Flag items you want to address. Organize your workflow by priority and status.' },
                { icon: Scale, title: 'Audit Trail', desc: 'Automatic logging of all actions. Export your complete documentation history.' },
              ].map((feature, i) => (
                <div key={i} className="feature-card">
                  <div className="feature-icon"><feature.icon size={24} /></div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-desc">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Statutes */}
        <section className="section section-dark">
          <div className="container">
            <div className="section-label">Reference</div>
            <h2 className="section-title">Built around FCRA procedures</h2>
            <p className="section-subtitle">
              Our templates and workflows reference these federal consumer protection provisions.
            </p>
            <div className="statute-grid">
              {[
                { num: '§605B', name: 'Identity Theft Blocks', desc: 'Allows identity theft victims to request blocking of fraudulent information. Bureaus must respond within 4 business days.' },
                { num: '§611', name: 'Dispute Procedures', desc: 'Establishes the right to dispute inaccurate information. Bureaus must investigate within 30 days.' },
                { num: '§809', name: 'Debt Validation', desc: 'FDCPA provision requiring collectors to validate debts upon request within 30 days of initial contact.' },
              ].map((statute, i) => (
                <div key={i} className="statute-card">
                  <div className="statute-number">{statute.num}</div>
                  <div className="statute-name">{statute.name}</div>
                  <p className="statute-desc">{statute.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <h2 className="cta-title">Ready to get organized?</h2>
          <p className="cta-subtitle">
            Start using software tools to manage your credit dispute documentation.
          </p>
          <Link href="/sign-up" className="btn-primary">
            Get Started Free <ArrowRight size={18} />
          </Link>
          <p className="cta-disclaimer">
            No credit card required. Results vary based on individual circumstances.
          </p>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">605b<span className="logo-accent">.ai</span></div>
              <p className="footer-tagline">Document management software for credit dispute workflows.</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <div className="footer-column-title">Product</div>
                <Link href="/sign-up" className="footer-link">Get Started</Link>
                <a href="#features" className="footer-link">Features</a>
                <a href="#how-it-works" className="footer-link">How It Works</a>
              </div>
              <div className="footer-column">
                <div className="footer-column-title">Legal</div>
                <Link href="/terms" className="footer-link">Terms of Service</Link>
                <Link href="/privacy" className="footer-link">Privacy Policy</Link>
              </div>
              <div className="footer-column">
                <div className="footer-column-title">Contact</div>
                <a href="mailto:admin@9thwave.io" className="footer-link">admin@9thwave.io</a>
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
            <div>© {new Date().getFullYear()} Ninth Wave LLC · Delaware, USA</div>
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
