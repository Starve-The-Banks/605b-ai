"use client";

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPolicy() {
  const effectiveDate = "January 9, 2026";

  return (
    <>
      <style jsx global>{`
        .legal-page {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
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
        .legal-nav {
          position: relative;
          z-index: 100;
          padding: 0 32px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
        }
        .legal-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--text);
        }
        .legal-logo-mark {
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
        .legal-logo-text {
          font-size: 16px;
          font-weight: 600;
        }
        .legal-nav-links {
          display: flex;
          gap: 24px;
        }
        .legal-nav-link {
          font-size: 14px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s;
        }
        .legal-nav-link:hover {
          color: var(--text);
        }
        .legal-main {
          position: relative;
          z-index: 10;
          max-width: 800px;
          margin: 0 auto;
          padding: 80px 32px 120px;
        }
        .legal-header {
          margin-bottom: 48px;
          padding-bottom: 32px;
          border-bottom: 1px solid var(--border);
        }
        .legal-header h1 {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }
        .legal-header .meta {
          font-size: 14px;
          color: var(--text-muted);
        }
        .legal-footer {
          position: relative;
          z-index: 10;
          padding: 32px;
          border-top: 1px solid var(--border);
        }
        .legal-footer-inner {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .legal-footer-links {
          display: flex;
          gap: 24px;
        }
        .legal-footer-links a {
          font-size: 13px;
          color: var(--text-muted);
          text-decoration: none;
        }
        .legal-footer-links a:hover {
          color: var(--orange);
        }
        .legal-footer-copy {
          font-size: 12px;
          color: var(--text-muted);
        }
        @media (max-width: 640px) {
          .legal-nav, .legal-main {
            padding-left: 20px;
            padding-right: 20px;
          }
          .legal-footer-inner {
            flex-direction: column;
            gap: 16px;
          }
        }
      `}</style>

      <div className="legal-page">
        <div className="bg-grid"></div>

        <nav className="legal-nav">
          <Link href="/" className="legal-logo">
            <div className="legal-logo-mark">605B</div>
            <span className="legal-logo-text">605b.ai</span>
          </Link>
          <div className="legal-nav-links">
            <Link href="/terms" className="legal-nav-link">Terms</Link>
            <Link href="/sign-in" className="legal-nav-link">Sign In</Link>
          </div>
        </nav>

        <main className="legal-main">
          <div className="legal-header">
            <h1>Privacy Policy</h1>
            <p className="meta">Effective Date: {effectiveDate}</p>
          </div>

        {/* Trust Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(39, 201, 63, 0.15) 0%, rgba(39, 201, 63, 0.05) 100%)',
          border: '2px solid rgba(39, 201, 63, 0.4)',
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '32px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            color: 'var(--green)',
            fontWeight: 700,
            fontSize: '16px',
          }}>
            <ShieldCheck size={24} />
            YOUR PRIVACY IS PROTECTED
          </div>
          <p style={{ fontSize: '15px', color: 'var(--text)', lineHeight: 1.6, marginBottom: '0' }}>
            <strong>We do not store your uploaded credit report PDFs as retrievable files.</strong> They are processed for analysis and not retained as documents; only the analysis results you choose to save are stored to your account. You can delete your saved analysis results anytime.
          </p>
        </div>

        <div style={{
          fontSize: '15px',
          lineHeight: 1.8,
          color: 'var(--text-secondary)',
        }}>
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>1. Introduction</h2>
            <p style={{ marginBottom: '16px' }}>
              <strong>Ninth Wave Analytics LLC</strong> ("Company," "we," "us," or "our") respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 605b.ai website and application (the "Service").
            </p>
            <p style={{ marginBottom: '16px' }}>
              <strong>PLEASE READ THIS PRIVACY POLICY CAREFULLY.</strong> By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree with the terms of this Privacy Policy, please do not access the Service.
            </p>
            <p>
              We reserve the right to make changes to this Privacy Policy at any time. We will notify you of any changes by updating the "Effective Date" at the top of this Privacy Policy. Your continued use of the Service after any changes constitutes acceptance of those changes.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>2. Information We Collect</h2>
            
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>2.1 Information You Provide Directly</h3>
            <p style={{ marginBottom: '16px' }}>We may collect the following information that you voluntarily provide:</p>
            <ul style={{ marginBottom: '16px', paddingLeft: '24px' }}>
              <li style={{ marginBottom: '8px' }}><strong>Account Information:</strong> Name, email address, and password when you create an account</li>
              <li style={{ marginBottom: '8px' }}><strong>Profile Information:</strong> Information you provide during onboarding, including your situation, goals, and timeline preferences</li>
              <li style={{ marginBottom: '8px' }}><strong>Credit Report Data:</strong> Information contained in credit reports you upload for analysis, which may include personally identifiable information, account details, payment history, and other financial information</li>
              <li style={{ marginBottom: '8px' }}><strong>Dispute Information:</strong> Details about disputes you track, including creditor names, account information, dispute types, and correspondence</li>
              <li style={{ marginBottom: '8px' }}><strong>Communications:</strong> Information you provide when you contact us for support or feedback</li>
            </ul>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>2.2 Information Collected Automatically</h3>
            <p style={{ marginBottom: '16px' }}>When you access the Service, we may automatically collect:</p>
            <ul style={{ marginBottom: '16px', paddingLeft: '24px' }}>
              <li style={{ marginBottom: '8px' }}><strong>Device Information:</strong> Device type, operating system, browser type, and unique device identifiers</li>
              <li style={{ marginBottom: '8px' }}><strong>Log Data:</strong> IP address, access times, pages viewed, and referring URL</li>
              <li style={{ marginBottom: '8px' }}><strong>Usage Data:</strong> Features used, actions taken, and time spent on the Service</li>
              <li style={{ marginBottom: '8px' }}><strong>Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies to maintain your session and preferences</li>
            </ul>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>2.3 Sensitive Information</h3>
            <p style={{ 
              marginBottom: '16px', 
              padding: '16px', 
              background: 'var(--orange-dim)', 
              border: '1px solid rgba(255, 107, 53, 0.2)',
              borderRadius: '8px',
            }}>
              <strong>Important:</strong> Credit reports may contain sensitive personal information including Social Security numbers, dates of birth, addresses, and detailed financial information. We process this information solely to provide the Service and implement strong security measures to protect it. You should only upload credit reports if you are comfortable with our handling of this data as described in this Privacy Policy.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>3. How We Use Your Information</h2>
            <p style={{ marginBottom: '16px' }}>We use the information we collect for the following purposes:</p>
            <ul style={{ marginBottom: '16px', paddingLeft: '24px' }}>
              <li style={{ marginBottom: '8px' }}><strong>Provide the Service:</strong> To operate, maintain, and improve the Service, including analyzing credit reports, generating dispute letters, and tracking disputes</li>
              <li style={{ marginBottom: '8px' }}><strong>Account Management:</strong> To create and manage your account, authenticate your identity, and provide customer support</li>
              <li style={{ marginBottom: '8px' }}><strong>Communications:</strong> To send you service-related notifications, deadline reminders, and respond to your inquiries</li>
              <li style={{ marginBottom: '8px' }}><strong>AI Processing:</strong> To process your credit reports and provide AI-powered analysis and recommendations</li>
              <li style={{ marginBottom: '8px' }}><strong>Security:</strong> To detect, prevent, and address technical issues, fraud, and security threats</li>
              <li style={{ marginBottom: '8px' }}><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes</li>
              <li style={{ marginBottom: '8px' }}><strong>Improvement:</strong> To analyze usage patterns and improve the Service</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>4. How We Share Your Information</h2>
            <p style={{ marginBottom: '16px' }}>
              <strong>We do not sell your personal information.</strong> We may share your information in the following circumstances:
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>4.1 Service Providers</h3>
            <p style={{ marginBottom: '16px' }}>We share information with third-party service providers who perform services on our behalf:</p>
            <ul style={{ marginBottom: '16px', paddingLeft: '24px' }}>
              <li style={{ marginBottom: '8px' }}><strong>Clerk:</strong> Authentication and user management</li>
              <li style={{ marginBottom: '8px' }}><strong>Anthropic:</strong> AI processing for credit report analysis (credit report content is processed but not stored by Anthropic)</li>
              <li style={{ marginBottom: '8px' }}><strong>Upstash:</strong> Database services for storing your disputes, settings, and audit logs</li>
              <li style={{ marginBottom: '8px' }}><strong>Resend:</strong> Email delivery for notifications and reminders</li>
              <li style={{ marginBottom: '8px' }}><strong>Vercel:</strong> Website hosting and infrastructure</li>
            </ul>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>4.2 Legal Requirements</h3>
            <p style={{ marginBottom: '16px' }}>
              We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>4.3 Business Transfers</h3>
            <p style={{ marginBottom: '16px' }}>
              If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>4.4 With Your Consent</h3>
            <p>
              We may share your information with third parties when you have given us your consent to do so.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>5. Data Storage and Security</h2>
            
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>5.1 Data Storage</h3>
            <p style={{ marginBottom: '16px' }}>
              Your data is stored on secure servers provided by our service providers. We use industry-standard encryption for data in transit (TLS/SSL) and at rest.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>5.2 Credit Report Processing — NO PDF STORAGE</h3>
            <p style={{
              marginBottom: '16px',
              padding: '16px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px',
            }}>
              <strong>Important Privacy Protection:</strong> We do not store your uploaded credit report PDFs as retrievable files. They are processed for analysis and not retained as documents; only the analysis results you choose to save are stored to your account.
            </p>
            <p style={{ marginBottom: '16px' }}>
              When you upload a credit report for analysis:
            </p>
            <ul style={{ marginBottom: '16px', paddingLeft: '24px' }}>
              <li style={{ marginBottom: '8px' }}><strong>PDF files are not retained</strong> — We do not store your uploaded credit report PDFs as retrievable files</li>
              <li style={{ marginBottom: '8px' }}><strong>Text is extracted temporarily</strong> — Report content is extracted, sent to our AI for analysis, then not retained as a document</li>
              <li style={{ marginBottom: '8px' }}><strong>Only findings are saved</strong> — We store only the analysis results (flagged items, issues found) you choose to save in your account</li>
              <li style={{ marginBottom: '8px' }}><strong>AI provider does not retain data</strong> — Our AI provider (Anthropic) processes your data in real-time and does not store it after the request completes</li>
              <li style={{ marginBottom: '8px' }}><strong>You control your data</strong> — You can delete your flagged items and analysis results at any time</li>
            </ul>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>5.3 Security Measures</h3>
            <p style={{ marginBottom: '16px' }}>
              We implement appropriate technical and organizational security measures to protect your personal information, including:
            </p>
            <ul style={{ marginBottom: '16px', paddingLeft: '24px' }}>
              <li style={{ marginBottom: '8px' }}>Encryption of data in transit and at rest</li>
              <li style={{ marginBottom: '8px' }}>Secure authentication through our identity provider</li>
              <li style={{ marginBottom: '8px' }}>Regular security assessments</li>
              <li style={{ marginBottom: '8px' }}>Access controls limiting employee access to personal data</li>
            </ul>
            <p>
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>6. Data Retention</h2>
            <p style={{ marginBottom: '16px' }}>
              We retain your personal information for as long as your account is active or as needed to provide you the Service. We may also retain certain information as required by law or for legitimate business purposes, such as:
            </p>
            <ul style={{ marginBottom: '16px', paddingLeft: '24px' }}>
              <li style={{ marginBottom: '8px' }}>Audit logs are retained for potential litigation support</li>
              <li style={{ marginBottom: '8px' }}>Account information is retained until you request deletion</li>
              <li style={{ marginBottom: '8px' }}>Aggregated, anonymized data may be retained indefinitely for analytics</li>
            </ul>
            <p>
              You may request deletion of your account and associated data at any time by contacting us.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>7. Your Rights and Choices</h2>
            
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>7.1 Access and Portability</h3>
            <p style={{ marginBottom: '16px' }}>
              You may access your personal information through your account dashboard. You may export your dispute history and audit log at any time.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>7.2 Correction</h3>
            <p style={{ marginBottom: '16px' }}>
              You may update or correct your account information at any time through your account settings.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>7.3 Deletion</h3>
            <p style={{ marginBottom: '16px' }}>
              You may request deletion of your account and personal information by contacting us. We will delete or anonymize your information within 30 days, except where we are required to retain it by law.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>7.4 Email Communications</h3>
            <p style={{ marginBottom: '16px' }}>
              You may opt out of non-essential email communications through your account settings. You cannot opt out of transactional emails related to your account.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>7.5 Cookies</h3>
            <p>
              Most web browsers are set to accept cookies by default. You can usually modify your browser settings to remove or reject cookies. Note that removing or rejecting cookies may affect the availability and functionality of the Service.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>8. State-Specific Rights</h2>
            
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>8.1 California Residents (CCPA/CPRA)</h3>
            <p style={{ marginBottom: '16px' }}>
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):
            </p>
            <ul style={{ marginBottom: '16px', paddingLeft: '24px' }}>
              <li style={{ marginBottom: '8px' }}><strong>Right to Know:</strong> You may request information about the categories and specific pieces of personal information we have collected about you</li>
              <li style={{ marginBottom: '8px' }}><strong>Right to Delete:</strong> You may request deletion of your personal information, subject to certain exceptions</li>
              <li style={{ marginBottom: '8px' }}><strong>Right to Correct:</strong> You may request correction of inaccurate personal information</li>
              <li style={{ marginBottom: '8px' }}><strong>Right to Opt-Out:</strong> We do not sell personal information, so this right does not apply</li>
              <li style={{ marginBottom: '8px' }}><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights</li>
            </ul>
            <p style={{ marginBottom: '16px' }}>
              To exercise these rights, please contact us using the information provided below.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>8.2 Other State Laws</h3>
            <p>
              If you are a resident of Virginia, Colorado, Connecticut, Utah, or other states with comprehensive privacy laws, you may have similar rights. Please contact us to exercise your rights under applicable state law.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>9. Children's Privacy</h2>
            <p>
              The Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. If we become aware that we have collected personal information from a child under 18, we will take steps to delete that information.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence, including the United States. These countries may have data protection laws that are different from the laws of your country. By using the Service, you consent to the transfer of your information to the United States and other countries.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>11. Third-Party Links</h2>
            <p>
              The Service may contain links to third-party websites (such as AnnualCreditReport.com, IdentityTheft.gov, and credit bureau websites). We are not responsible for the privacy practices of these third-party sites. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>12. Do Not Track</h2>
            <p>
              Some browsers have a "Do Not Track" feature that signals to websites that you do not want to have your online activity tracked. The Service does not currently respond to "Do Not Track" signals.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>13. Contact Us</h2>
            <p style={{ marginBottom: '16px' }}>
              If you have any questions about this Privacy Policy or our privacy practices, or if you wish to exercise your privacy rights, please contact us at:
            </p>
            <div style={{ 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border)', 
              borderRadius: '8px', 
              padding: '16px',
              marginBottom: '16px',
            }}>
              <p style={{ marginBottom: '4px' }}><strong>Ninth Wave Analytics LLC</strong></p>
              <p style={{ marginBottom: '4px' }}>Email: privacy@9thwave.io</p>
            </div>
            <p>
              We will respond to your request within 30 days (or sooner if required by applicable law).
            </p>
          </section>

        </div>
        </main>

        <footer className="legal-footer">
          <div className="legal-footer-inner">
            <div className="legal-footer-links">
              <Link href="/">Home</Link>
              <Link href="/terms">Terms</Link>
              <a href="mailto:privacy@605b.ai">Contact</a>
            </div>
            <div className="legal-footer-copy">© {new Date().getFullYear()} Ninth Wave Analytics LLC</div>
          </div>
        </footer>
      </div>
    </>
  );
}
