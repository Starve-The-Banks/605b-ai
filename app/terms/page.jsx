"use client";

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { SUPPORT_EMAIL } from '@/lib/constants';

export default function TermsOfService() {
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
            <Link href="/privacy" className="legal-nav-link">Privacy</Link>
            <Link href="/sign-in" className="legal-nav-link">Sign In</Link>
          </div>
        </nav>

        <main className="legal-main">
          <div className="legal-header">
            <h1>Terms of Service</h1>
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
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>1. Agreement to Terms</h2>
            <p style={{ marginBottom: '16px' }}>
              These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and <strong>Ninth Wave Analytics LLC</strong>, a Delaware limited liability company ("Company," "we," "us," or "our"), governing your access to and use of the 605b.ai website, application, and related services (collectively, the "Service").
            </p>
            <p style={{ marginBottom: '16px' }}>
              BY ACCESSING OR USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST NOT ACCESS OR USE THE SERVICE.
            </p>
            <p>
              We reserve the right to modify these Terms at any time. Your continued use of the Service following any changes constitutes acceptance of those changes.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>2. Nature of Service — Important Disclaimers</h2>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>2.1 Educational Software Platform</h3>
            <p style={{ marginBottom: '16px' }}>
              The Service is an <strong>educational software platform</strong> that provides tools, templates, and information to help consumers understand and exercise their rights under federal consumer protection laws, including but not limited to the Fair Credit Reporting Act (FCRA), Fair Debt Collection Practices Act (FDCPA), and Fair Credit Billing Act (FCBA).
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>2.2 Not a Credit Repair Organization</h3>
            <p style={{ marginBottom: '16px' }}>
              <strong>NINTH WAVE ANALYTICS LLC IS NOT A "CREDIT REPAIR ORGANIZATION" AS DEFINED BY THE CREDIT REPAIR ORGANIZATIONS ACT (CROA), 15 U.S.C. § 1679 et seq.</strong> We do not:
            </p>
            <ul style={{ marginBottom: '16px', paddingLeft: '24px' }}>
              <li style={{ marginBottom: '8px' }}>Offer or provide services for the purpose of improving your credit record, credit history, or credit rating</li>
              <li style={{ marginBottom: '8px' }}>Make any representations that we can remove accurate negative information from your credit report</li>
              <li style={{ marginBottom: '8px' }}>Charge fees for credit repair services</li>
              <li style={{ marginBottom: '8px' }}>Act as an intermediary between you and credit bureaus or creditors</li>
            </ul>
            <p style={{ marginBottom: '16px' }}>
              The Service provides <strong>self-help tools and educational resources</strong> that you use at your own discretion to communicate directly with credit bureaus, creditors, and debt collectors on your own behalf.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>2.3 Not Legal Advice</h3>
            <p style={{ marginBottom: '16px' }}>
              <strong>THE SERVICE DOES NOT PROVIDE LEGAL ADVICE.</strong> The information, templates, and tools provided through the Service are for general informational and educational purposes only and do not constitute legal advice. No attorney-client relationship is created by your use of the Service.
            </p>
            <p style={{ marginBottom: '16px' }}>
              We strongly recommend that you consult with a licensed attorney in your jurisdiction before taking any legal action, particularly in matters involving identity theft, credit disputes, or debt collection.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>2.4 AI-Generated Content</h3>
            <p style={{ marginBottom: '16px' }}>
              The Service utilizes artificial intelligence ("AI") to analyze documents, generate suggestions, and provide information. <strong>AI-generated content may contain errors, inaccuracies, or omissions.</strong> You are solely responsible for reviewing, verifying, and editing any AI-generated content before use. We make no warranties regarding the accuracy, completeness, or suitability of AI-generated content for any particular purpose.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>2.5 Credit Report Processing — No File Storage</h3>
            <p style={{ marginBottom: '16px' }}>
              <strong>WE DO NOT STORE YOUR UPLOADED CREDIT REPORT PDFS AS RETRIEVABLE FILES.</strong> They are processed for analysis and not retained as documents; only the analysis results you choose to save are stored to your account. We retain only the analysis results (flagged items, identified issues) in your account—never the original credit report content or PDF files. See our Privacy Policy for complete details on data handling.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>2.6 No Guarantee of Results</h3>
            <p>
              <strong>WE DO NOT GUARANTEE ANY SPECIFIC OUTCOMES OR RESULTS.</strong> The effectiveness of dispute letters, the response of credit bureaus or creditors, and any changes to your credit report depend on many factors outside our control, including the accuracy of information you provide and the policies of third parties.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>3. User Responsibilities</h2>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>3.1 Accurate Information</h3>
            <p style={{ marginBottom: '16px' }}>
              You agree to provide accurate, current, and complete information when using the Service. You are solely responsible for the accuracy of all information you submit, including personal information, credit report data, and dispute details.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>3.2 Lawful Use</h3>
            <p style={{ marginBottom: '16px' }}>
              You agree to use the Service only for lawful purposes and in accordance with these Terms. You shall not:
            </p>
            <ul style={{ marginBottom: '16px', paddingLeft: '24px' }}>
              <li style={{ marginBottom: '8px' }}>Use the Service to dispute information you know to be accurate</li>
              <li style={{ marginBottom: '8px' }}>Submit false or fraudulent identity theft claims</li>
              <li style={{ marginBottom: '8px' }}>Use the Service to harass, abuse, or threaten any person or entity</li>
              <li style={{ marginBottom: '8px' }}>Violate any applicable federal, state, or local law or regulation</li>
              <li style={{ marginBottom: '8px' }}>Attempt to gain unauthorized access to the Service or its systems</li>
              <li style={{ marginBottom: '8px' }}>Use the Service on behalf of others without proper authorization</li>
            </ul>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>3.3 Account Security</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>4. Intellectual Property</h2>
            <p style={{ marginBottom: '16px' }}>
              The Service and its original content, features, and functionality are owned by Ninth Wave Analytics LLC and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p>
              Letter templates, educational content, and other materials provided through the Service are licensed for your personal, non-commercial use only. You may not reproduce, distribute, modify, or create derivative works from our materials without express written consent.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>5. Payments and Refund Policy</h2>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>5.1 Pricing and Payment</h3>
            <p style={{ marginBottom: '16px' }}>
              The Service offers both free and paid tiers. Paid tiers require a one-time payment for a perpetual software license. All prices are listed in U.S. dollars and are subject to change without notice.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>5.2 Refund Policy</h3>
            <p style={{ marginBottom: '16px' }}>
              <strong>ALL SALES ARE FINAL.</strong>
            </p>
            <p style={{ marginBottom: '16px' }}>
              605b.ai provides immediate access to digital software tools, workflows, and downloadable content upon purchase. Because access is granted instantly and the software license is delivered immediately, we do not offer refunds.
            </p>
            <p style={{ marginBottom: '16px' }}>
              Please review the features of each tier carefully before purchasing. A free tier is available to allow users to evaluate the platform prior to upgrading.
            </p>
            <p>
              If you believe you were charged in error or experienced a technical billing issue, please contact {SUPPORT_EMAIL}.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>6. Limitation of Liability</h2>
            <p style={{ marginBottom: '16px' }}>
              <strong>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, NINTH WAVE ANALYTICS LLC, ITS OFFICERS, DIRECTORS, MEMBERS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:</strong>
            </p>
            <ul style={{ marginBottom: '16px', paddingLeft: '24px' }}>
              <li style={{ marginBottom: '8px' }}>Loss of profits, revenue, or data</li>
              <li style={{ marginBottom: '8px' }}>Damage to credit score or credit history</li>
              <li style={{ marginBottom: '8px' }}>Denial of credit, employment, housing, or insurance</li>
              <li style={{ marginBottom: '8px' }}>Actions taken by credit bureaus, creditors, or debt collectors</li>
              <li style={{ marginBottom: '8px' }}>Errors or omissions in AI-generated content</li>
              <li style={{ marginBottom: '8px' }}>Any other damages arising from your use of the Service</li>
            </ul>
            <p style={{ marginBottom: '16px' }}>
              <strong>IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THE SERVICE EXCEED THE AMOUNT YOU PAID TO US, IF ANY, IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.</strong>
            </p>
            <p>
              Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>7. Disclaimer of Warranties</h2>
            <p style={{ marginBottom: '16px' }}>
              <strong>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.</strong>
            </p>
            <p>
              We do not warrant that the Service will be uninterrupted, secure, or error-free, that defects will be corrected, or that the Service or the servers that make it available are free of viruses or other harmful components.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>8. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless Ninth Wave Analytics LLC, its officers, directors, members, employees, agents, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any third-party rights, including intellectual property rights; (d) any dispute between you and a credit bureau, creditor, or debt collector; or (e) any false or misleading information you provide through the Service.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>9. Dispute Resolution and Arbitration</h2>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>9.1 Binding Arbitration</h3>
            <p style={{ marginBottom: '16px' }}>
              Any dispute, controversy, or claim arising out of or relating to these Terms or the Service shall be resolved by binding arbitration administered by the American Arbitration Association ("AAA") in accordance with its Consumer Arbitration Rules. The arbitration shall take place in Delaware or, at your election, may be conducted remotely.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>9.2 Class Action Waiver</h3>
            <p style={{ marginBottom: '16px' }}>
              <strong>YOU AGREE THAT ANY ARBITRATION OR PROCEEDING SHALL BE LIMITED TO THE DISPUTE BETWEEN US AND YOU INDIVIDUALLY. YOU WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION.</strong>
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--orange)', marginBottom: '12px' }}>9.3 Small Claims Exception</h3>
            <p>
              Notwithstanding the foregoing, either party may bring an individual action in small claims court for disputes within the court's jurisdictional limits.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>10. Governing Law</h2>
            <p style={{ marginBottom: '16px' }}>
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions. Any legal action or proceeding not subject to arbitration shall be brought exclusively in the state or federal courts located in Delaware.
            </p>
            <p>
              Notwithstanding the foregoing, if you are a California resident, you retain all rights afforded to you under the California Consumer Privacy Act (CCPA), California Privacy Rights Act (CPRA), and other applicable California consumer protection laws.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>11. Termination</h2>
            <p style={{ marginBottom: '16px' }}>
              We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason, including breach of these Terms.
            </p>
            <p>
              Upon termination, your right to use the Service will cease immediately. Provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnification, and limitations of liability.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>12. Severability</h2>
            <p>
              If any provision of these Terms is held to be unenforceable or invalid, such provision will be modified to the minimum extent necessary to make it enforceable, and the remaining provisions will continue in full force and effect.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>13. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Ninth Wave Analytics LLC regarding the Service and supersede all prior agreements and understandings.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>14. Contact Information</h2>
            <p style={{ marginBottom: '16px' }}>
              If you have any questions about these Terms, please contact us at:
            </p>
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
            }}>
              <p style={{ marginBottom: '4px' }}><strong>Ninth Wave Analytics LLC</strong></p>
              <p style={{ marginBottom: '4px' }}>Email: legal@9thwave.io</p>
            </div>
          </section>
        </div>
        </main>

        <footer className="legal-footer">
          <div className="legal-footer-inner">
            <div className="legal-footer-links">
              <Link href="/">Home</Link>
              <Link href="/privacy">Privacy</Link>
              <a href="mailto:legal@605b.ai">Contact</a>
            </div>
            <div className="legal-footer-copy">© {new Date().getFullYear()} Ninth Wave Analytics LLC</div>
          </div>
        </footer>
      </div>
    </>
  );
}
