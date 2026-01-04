import Link from 'next/link';

export default function TermsPage() {
  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <Link href="/" style={styles.logo}>
          605b<span style={{ color: '#d4a574' }}>.ai</span>
        </Link>
        <Link href="/" style={styles.backLink}>← Back to Home</Link>
      </nav>

      <main style={styles.main}>
        <h1 style={styles.title}>Terms of Service</h1>
        <p style={styles.updated}>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div style={styles.content}>
          <section style={styles.section}>
            <h2 style={styles.heading}>1. Agreement to Terms</h2>
            <p style={styles.paragraph}>
              By accessing or using 605b.ai ("Service"), operated by Ninth Wave LLC ("Company," "we," "us," or "our"), 
              you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>2. Description of Service</h2>
            <p style={styles.paragraph}>
              605b.ai is document management and educational software that provides:
            </p>
            <ul style={styles.list}>
              <li>Tools to organize credit report documentation</li>
              <li>Letter templates based on federal consumer protection statutes</li>
              <li>Workflow tracking features</li>
              <li>Educational information about consumer rights</li>
              <li>AI-assisted guidance for educational purposes</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>3. Important Disclaimers</h2>
            <div style={styles.disclaimer}>
              <p style={styles.paragraph}>
                <strong>NOT LEGAL ADVICE:</strong> The Service provides software tools and educational information only. 
                We are NOT a law firm, and nothing on this Service constitutes legal advice. We do not provide 
                attorney-client relationships.
              </p>
              <p style={styles.paragraph}>
                <strong>NOT A CREDIT REPAIR ORGANIZATION:</strong> We are NOT a credit repair organization as defined 
                by the Credit Repair Organizations Act (CROA), 15 U.S.C. § 1679. We do not perform credit repair services, 
                negotiate with creditors or bureaus on your behalf, or guarantee any outcomes.
              </p>
              <p style={styles.paragraph}>
                <strong>NO GUARANTEES:</strong> We make no representations or warranties regarding the outcomes of 
                using our software. Results depend entirely on individual circumstances, the accuracy of information 
                you provide, and decisions made by credit bureaus, creditors, and other third parties.
              </p>
              <p style={styles.paragraph}>
                <strong>EDUCATIONAL PURPOSES:</strong> All information provided through the Service, including AI 
                responses, is for educational purposes only. You should consult with a qualified attorney for legal 
                advice specific to your situation.
              </p>
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>4. User Responsibilities</h2>
            <p style={styles.paragraph}>You agree to:</p>
            <ul style={styles.list}>
              <li>Provide accurate information when using the Service</li>
              <li>Use the Service only for lawful purposes</li>
              <li>Not misrepresent your identity or circumstances</li>
              <li>Not use the Service to harass, defraud, or harm others</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Take responsibility for all activities under your account</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>5. Intellectual Property</h2>
            <p style={styles.paragraph}>
              The Service and its original content, features, and functionality are owned by Ninth Wave LLC and 
              are protected by copyright, trademark, and other intellectual property laws. Letter templates are 
              provided for your personal use and may be customized for your individual disputes.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>6. Limitation of Liability</h2>
            <p style={styles.paragraph}>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, NINTH WAVE LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, 
              WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE 
              LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>7. Indemnification</h2>
            <p style={styles.paragraph}>
              You agree to indemnify and hold harmless Ninth Wave LLC, its officers, directors, employees, and 
              agents from any claims, damages, losses, liabilities, and expenses arising out of your use of the 
              Service or violation of these Terms.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>8. Modifications</h2>
            <p style={styles.paragraph}>
              We reserve the right to modify these Terms at any time. We will notify users of material changes 
              by posting the updated Terms on the Service. Your continued use after changes constitutes acceptance 
              of the modified Terms.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>9. Governing Law</h2>
            <p style={styles.paragraph}>
              These Terms shall be governed by the laws of the State of Delaware, without regard to its conflict 
              of law provisions.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>10. Contact</h2>
            <p style={styles.paragraph}>
              For questions about these Terms, contact us at: <a href="mailto:admin@9thwave.io" style={styles.link}>admin@9thwave.io</a>
            </p>
            <p style={styles.paragraph}>
              Ninth Wave LLC<br />
              Delaware, USA
            </p>
          </section>
        </div>
      </main>

      <footer style={styles.footer}>
        <div>© {new Date().getFullYear()} Ninth Wave LLC · Delaware, USA</div>
        <div style={styles.footerLinks}>
          <Link href="/privacy" style={styles.footerLink}>Privacy Policy</Link>
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
  nav: {
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #1c1c1f',
  },
  logo: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#fafafa',
    textDecoration: 'none',
  },
  backLink: {
    fontSize: '14px',
    color: '#71717a',
    textDecoration: 'none',
  },
  main: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '60px 40px',
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  updated: {
    fontSize: '14px',
    color: '#71717a',
    marginBottom: '48px',
  },
  content: {},
  section: {
    marginBottom: '40px',
  },
  heading: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#fafafa',
  },
  paragraph: {
    fontSize: '15px',
    lineHeight: '1.7',
    color: '#a1a1aa',
    marginBottom: '16px',
  },
  list: {
    fontSize: '15px',
    lineHeight: '1.7',
    color: '#a1a1aa',
    paddingLeft: '24px',
    marginBottom: '16px',
  },
  disclaimer: {
    padding: '24px',
    background: '#0f0f11',
    border: '1px solid #27272a',
    borderRadius: '12px',
  },
  link: {
    color: '#d4a574',
    textDecoration: 'none',
  },
  footer: {
    padding: '24px 40px',
    borderTop: '1px solid #1c1c1f',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    color: '#52525b',
  },
  footerLinks: {
    display: 'flex',
    gap: '24px',
  },
  footerLink: {
    color: '#52525b',
    textDecoration: 'none',
  },
};
