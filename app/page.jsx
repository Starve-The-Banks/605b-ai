"use client";

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { ArrowRight, Shield, Clock, FileText, Scale, CheckCircle, AlertTriangle, Upload, Flag, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div style={styles.page}>
      {/* Navigation */}
      <nav style={styles.nav}>
        <Link href="/" style={styles.logo}>
          605b<span style={{ color: '#d4a574' }}>.ai</span>
        </Link>
        <div style={styles.navLinks}>
          <a href="#how-it-works" style={styles.navLink}>How It Works</a>
          <a href="#features" style={styles.navLink}>Features</a>
          {isSignedIn ? (
            <Link href="/dashboard" style={styles.navButtonPrimary}>Dashboard</Link>
          ) : (
            <>
              <Link href="/sign-in" style={styles.navButton}>Log In</Link>
              <Link href="/sign-up" style={styles.navButtonPrimary}>Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroBadge}>
          <Shield size={14} />
          Document Management Software
        </div>
        <h1 style={styles.heroTitle}>
          Organize your credit<br />
          <span style={{ color: '#d4a574' }}>dispute process.</span>
        </h1>
        <p style={styles.heroSubtitle}>
          Software tools to help you understand your rights under the Fair Credit Reporting Act, 
          organize documentation, and track your dispute workflow. Results depend on individual circumstances.
        </p>
        <div style={styles.heroCta}>
          {isSignedIn ? (
            <Link href="/dashboard" style={styles.btnPrimary}>
              Go to Dashboard <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link href="/sign-up" style={styles.btnPrimary}>
                Get Started Free <ArrowRight size={18} />
              </Link>
              <Link href="/sign-in" style={styles.btnSecondary}>
                I have an account
              </Link>
            </>
          )}
        </div>
        
        {/* Disclaimer Banner */}
        <div style={styles.disclaimerBanner}>
          <Scale size={16} />
          <span>
            605b.ai provides software tools and educational guidance. We do not provide legal advice, 
            credit repair services, or guarantees of outcomes.
          </span>
        </div>
      </section>

      {/* How It Works - Software-focused */}
      <section style={styles.howItWorks} id="how-it-works">
        <div style={styles.container}>
          <div style={styles.sectionLabel}>How It Works</div>
          <h2 style={styles.sectionTitle}>A systematic workflow</h2>
          <p style={styles.sectionSubtitle}>
            Organize your dispute process with software tools designed around FCRA procedures.
          </p>
          <div style={styles.steps}>
            <div style={styles.step}>
              <div style={styles.stepIcon}><Upload size={24} /></div>
              <div style={styles.stepNumber}>01</div>
              <h3 style={styles.stepTitle}>Upload & Identify</h3>
              <p style={styles.stepDesc}>
                Upload your credit reports. Our software helps you identify items you may want to review or dispute.
              </p>
            </div>
            <div style={styles.step}>
              <div style={styles.stepIcon}><FileText size={24} /></div>
              <div style={styles.stepNumber}>02</div>
              <h3 style={styles.stepTitle}>Organize Documentation</h3>
              <p style={styles.stepDesc}>
                Generate letter templates based on FCRA sections. Customize with your specific information.
              </p>
            </div>
            <div style={styles.step}>
              <div style={styles.stepIcon}><Flag size={24} /></div>
              <div style={styles.stepNumber}>03</div>
              <h3 style={styles.stepTitle}>Track Your Workflow</h3>
              <p style={styles.stepDesc}>
                Log sent correspondence, track statutory response windows, and maintain an organized timeline.
              </p>
            </div>
            <div style={styles.step}>
              <div style={styles.stepIcon}><BarChart3 size={24} /></div>
              <div style={styles.stepNumber}>04</div>
              <h3 style={styles.stepTitle}>Document Everything</h3>
              <p style={styles.stepDesc}>
                Maintain an audit trail of all actions. Export records for your personal documentation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={styles.features} id="features">
        <div style={styles.container}>
          <div style={styles.sectionLabel}>Features</div>
          <h2 style={styles.sectionTitle}>Software tools for organization</h2>
          <p style={styles.sectionSubtitle}>
            Everything you need to manage your dispute documentation workflow.
          </p>
          <div style={styles.featuresGrid}>
            {[
              {
                icon: Upload,
                title: "Report Analysis",
                desc: "Upload credit report PDFs. Software identifies items and provides educational context about relevant FCRA sections."
              },
              {
                icon: Clock,
                title: "Deadline Tracking",
                desc: "Track statutory response windows. The software calculates timeframes based on FCRA requirements."
              },
              {
                icon: FileText,
                title: "Letter Templates",
                desc: "Access template library for common dispute correspondence. Customize templates with your information."
              },
              {
                icon: Shield,
                title: "Educational Guidance",
                desc: "AI assistant trained on consumer protection statutes provides educational information about your rights."
              },
              {
                icon: Flag,
                title: "Item Flagging",
                desc: "Flag items you want to address. Organize your workflow by priority and status."
              },
              {
                icon: Scale,
                title: "Audit Trail",
                desc: "Automatic logging of all actions. Export your complete documentation history."
              }
            ].map((feature, i) => (
              <div key={i} style={styles.featureCard}>
                <div style={styles.featureIcon}>
                  <feature.icon size={24} />
                </div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDesc}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statutes Reference */}
      <section style={styles.statutes}>
        <div style={styles.container}>
          <div style={styles.sectionLabel}>Reference</div>
          <h2 style={styles.sectionTitle}>Built around FCRA procedures</h2>
          <p style={styles.sectionSubtitle}>
            Our templates and workflows reference these federal consumer protection provisions.
          </p>
          <div style={styles.statuteGrid}>
            <div style={styles.statuteCard}>
              <div style={styles.statuteNumber}>§605B</div>
              <div style={styles.statuteName}>Identity Theft Blocks</div>
              <div style={styles.statuteDesc}>
                Allows identity theft victims to request blocking of fraudulent information. 
                Bureaus must respond within 4 business days.
              </div>
            </div>
            <div style={styles.statuteCard}>
              <div style={styles.statuteNumber}>§611</div>
              <div style={styles.statuteName}>Dispute Procedures</div>
              <div style={styles.statuteDesc}>
                Establishes the right to dispute inaccurate information. 
                Bureaus must investigate within 30 days.
              </div>
            </div>
            <div style={styles.statuteCard}>
              <div style={styles.statuteNumber}>§809</div>
              <div style={styles.statuteName}>Debt Validation</div>
              <div style={styles.statuteDesc}>
                FDCPA provision requiring collectors to validate debts upon request 
                within 30 days of initial contact.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={styles.cta}>
        <h2 style={styles.ctaTitle}>Ready to get organized?</h2>
        <p style={styles.ctaSubtitle}>
          Start using software tools to manage your credit dispute documentation.
        </p>
        <Link href="/sign-up" style={styles.btnPrimary}>
          Get Started Free <ArrowRight size={18} />
        </Link>
        <p style={styles.ctaDisclaimer}>
          No credit card required. Results vary based on individual circumstances.
        </p>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerMain}>
          <div style={styles.footerBrand}>
            <div style={styles.footerLogo}>605b<span style={{ color: '#d4a574' }}>.ai</span></div>
            <p style={styles.footerTagline}>Document management software for credit dispute workflows.</p>
          </div>
          <div style={styles.footerLinks}>
            <div style={styles.footerColumn}>
              <div style={styles.footerColumnTitle}>Product</div>
              <Link href="/sign-up" style={styles.footerLink}>Get Started</Link>
              <a href="#features" style={styles.footerLink}>Features</a>
              <a href="#how-it-works" style={styles.footerLink}>How It Works</a>
            </div>
            <div style={styles.footerColumn}>
              <div style={styles.footerColumnTitle}>Legal</div>
              <Link href="/terms" style={styles.footerLink}>Terms of Service</Link>
              <Link href="/privacy" style={styles.footerLink}>Privacy Policy</Link>
            </div>
            <div style={styles.footerColumn}>
              <div style={styles.footerColumnTitle}>Contact</div>
              <a href="mailto:admin@9thwave.io" style={styles.footerLink}>admin@9thwave.io</a>
            </div>
          </div>
        </div>
        
        <div style={styles.footerDisclaimer}>
          <p style={styles.disclaimerText}>
            <strong>Important Disclaimer:</strong> 605b.ai provides software tools and educational guidance only. 
            We are not a law firm, credit repair organization, or credit counseling service. We do not provide 
            legal advice, credit repair services, or guarantees of any outcomes. The information provided is 
            for educational purposes and should not be construed as legal advice. Results depend entirely on 
            individual circumstances. Consult with a qualified attorney for legal advice specific to your situation.
          </p>
        </div>

        <div style={styles.footerBottom}>
          <div style={styles.footerCopyright}>
            © {new Date().getFullYear()} Ninth Wave LLC · Delaware, USA
          </div>
          <div style={styles.footerBottomLinks}>
            <Link href="/terms" style={styles.footerBottomLink}>Terms</Link>
            <Link href="/privacy" style={styles.footerBottomLink}>Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#09090b',
    color: '#fafafa',
  },

  // Nav
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: '16px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(9, 9, 11, 0.9)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  logo: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#fafafa',
    textDecoration: 'none',
    letterSpacing: '-0.03em',
  },
  navLinks: {
    display: 'flex',
    gap: '32px',
    alignItems: 'center',
  },
  navLink: {
    color: '#a1a1aa',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
  },
  navButton: {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid #27272a',
    borderRadius: '8px',
    color: '#fafafa',
    fontSize: '14px',
    fontWeight: '500',
    textDecoration: 'none',
  },
  navButtonPrimary: {
    padding: '8px 16px',
    background: '#d4a574',
    border: '1px solid #d4a574',
    borderRadius: '8px',
    color: '#09090b',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
  },

  // Hero
  hero: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: '120px 40px 80px',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(212, 165, 116, 0.1)',
    border: '1px solid rgba(212, 165, 116, 0.2)',
    borderRadius: '100px',
    fontSize: '13px',
    color: '#d4a574',
    marginBottom: '32px',
  },
  heroTitle: {
    fontSize: 'clamp(36px, 6vw, 64px)',
    fontWeight: '700',
    lineHeight: '1.1',
    letterSpacing: '-0.04em',
    marginBottom: '24px',
  },
  heroSubtitle: {
    fontSize: '17px',
    lineHeight: '1.7',
    color: '#a1a1aa',
    maxWidth: '580px',
    marginBottom: '40px',
  },
  heroCta: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: '40px',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 28px',
    background: '#d4a574',
    border: 'none',
    borderRadius: '8px',
    color: '#09090b',
    fontSize: '15px',
    fontWeight: '600',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 28px',
    background: 'transparent',
    border: '1px solid #27272a',
    borderRadius: '8px',
    color: '#fafafa',
    fontSize: '15px',
    fontWeight: '500',
    textDecoration: 'none',
  },
  disclaimerBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 24px',
    background: 'rgba(113, 113, 122, 0.1)',
    border: '1px solid rgba(113, 113, 122, 0.2)',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#a1a1aa',
    maxWidth: '700px',
    textAlign: 'left',
  },

  // How It Works
  howItWorks: {
    padding: '120px 40px',
    background: '#0c0c0e',
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
  },
  sectionLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#d4a574',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '32px',
    fontWeight: '700',
    letterSpacing: '-0.03em',
    marginBottom: '12px',
  },
  sectionSubtitle: {
    fontSize: '16px',
    color: '#a1a1aa',
    marginBottom: '48px',
    maxWidth: '600px',
  },
  steps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '24px',
  },
  step: {
    padding: '24px',
    background: '#111113',
    border: '1px solid #1c1c1f',
    borderRadius: '12px',
  },
  stepIcon: {
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(212, 165, 116, 0.1)',
    borderRadius: '10px',
    color: '#d4a574',
    marginBottom: '16px',
  },
  stepNumber: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#52525b',
    marginBottom: '8px',
  },
  stepTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  stepDesc: {
    fontSize: '14px',
    color: '#a1a1aa',
    lineHeight: '1.6',
  },

  // Features
  features: {
    padding: '120px 40px',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  featureCard: {
    padding: '28px',
    background: '#0f0f11',
    border: '1px solid #1c1c1f',
    borderRadius: '12px',
  },
  featureIcon: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(212, 165, 116, 0.1)',
    borderRadius: '10px',
    marginBottom: '16px',
    color: '#d4a574',
  },
  featureTitle: {
    fontSize: '17px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  featureDesc: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#a1a1aa',
  },

  // Statutes
  statutes: {
    padding: '120px 40px',
    background: '#0c0c0e',
  },
  statuteGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
  },
  statuteCard: {
    padding: '32px',
    background: '#111113',
    border: '1px solid #1c1c1f',
    borderRadius: '12px',
  },
  statuteNumber: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#d4a574',
    marginBottom: '8px',
  },
  statuteName: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  statuteDesc: {
    fontSize: '14px',
    color: '#a1a1aa',
    lineHeight: '1.6',
  },

  // CTA
  cta: {
    padding: '100px 40px',
    textAlign: 'center',
  },
  ctaTitle: {
    fontSize: '36px',
    fontWeight: '700',
    letterSpacing: '-0.03em',
    marginBottom: '16px',
  },
  ctaSubtitle: {
    fontSize: '17px',
    color: '#a1a1aa',
    marginBottom: '32px',
  },
  ctaDisclaimer: {
    fontSize: '13px',
    color: '#52525b',
    marginTop: '16px',
  },

  // Footer
  footer: {
    borderTop: '1px solid #1c1c1f',
    padding: '0 40px',
  },
  footerMain: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '48px 0',
    borderBottom: '1px solid #1c1c1f',
  },
  footerBrand: {
    maxWidth: '300px',
  },
  footerLogo: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '12px',
  },
  footerTagline: {
    fontSize: '14px',
    color: '#71717a',
    lineHeight: '1.6',
  },
  footerLinks: {
    display: 'flex',
    gap: '64px',
  },
  footerColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  footerColumnTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#fafafa',
    marginBottom: '4px',
  },
  footerLink: {
    fontSize: '14px',
    color: '#71717a',
    textDecoration: 'none',
  },
  footerDisclaimer: {
    padding: '24px 0',
    borderBottom: '1px solid #1c1c1f',
  },
  disclaimerText: {
    fontSize: '12px',
    color: '#52525b',
    lineHeight: '1.7',
    maxWidth: '900px',
  },
  footerBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 0',
  },
  footerCopyright: {
    fontSize: '13px',
    color: '#52525b',
  },
  footerBottomLinks: {
    display: 'flex',
    gap: '24px',
  },
  footerBottomLink: {
    fontSize: '13px',
    color: '#52525b',
    textDecoration: 'none',
  },
};
