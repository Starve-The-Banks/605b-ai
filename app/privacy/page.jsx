import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <Link href="/" style={styles.logo}>
          605b<span style={{ color: '#d4a574' }}>.ai</span>
        </Link>
        <Link href="/" style={styles.backLink}>← Back to Home</Link>
      </nav>

      <main style={styles.main}>
        <h1 style={styles.title}>Privacy Policy</h1>
        <p style={styles.updated}>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div style={styles.content}>
          <section style={styles.section}>
            <h2 style={styles.heading}>1. Introduction</h2>
            <p style={styles.paragraph}>
              Ninth Wave LLC ("Company," "we," "us," or "our") operates 605b.ai (the "Service"). This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our Service.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>2. Information We Collect</h2>
            
            <h3 style={styles.subheading}>Information You Provide</h3>
            <ul style={styles.list}>
              <li><strong>Account Information:</strong> Email address and authentication credentials when you create an account</li>
              <li><strong>Uploaded Documents:</strong> Credit reports and other documents you choose to upload for analysis</li>
              <li><strong>User Content:</strong> Information you enter into letter templates, dispute tracking, and chat interactions</li>
            </ul>

            <h3 style={styles.subheading}>Automatically Collected Information</h3>
            <ul style={styles.list}>
              <li><strong>Usage Data:</strong> Information about how you interact with the Service</li>
              <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers</li>
              <li><strong>Log Data:</strong> IP address, access times, and pages viewed</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>3. How We Use Your Information</h2>
            <p style={styles.paragraph}>We use collected information to:</p>
            <ul style={styles.list}>
              <li>Provide, maintain, and improve the Service</li>
              <li>Process and analyze your uploaded documents</li>
              <li>Generate personalized letter templates</li>
              <li>Provide AI-assisted educational guidance</li>
              <li>Communicate with you about the Service</li>
              <li>Ensure security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>4. Data Storage and Security</h2>
            <div style={styles.highlight}>
              <p style={styles.paragraph}>
                <strong>Document Processing:</strong> Uploaded credit reports are processed to extract text for analysis. 
                We implement industry-standard security measures to protect your data during transmission and storage.
              </p>
              <p style={styles.paragraph}>
                <strong>Local Storage:</strong> Some data (such as dispute tracking and audit logs) may be stored locally 
                in your browser for convenience. This data remains on your device unless you explicitly export it.
              </p>
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>5. Third-Party Services</h2>
            <p style={styles.paragraph}>We use the following third-party services:</p>
            <ul style={styles.list}>
              <li><strong>Clerk:</strong> For authentication and user management</li>
              <li><strong>Anthropic:</strong> For AI-powered analysis and chat functionality</li>
              <li><strong>Vercel:</strong> For hosting and infrastructure</li>
            </ul>
            <p style={styles.paragraph}>
              These services have their own privacy policies governing their use of your data. We encourage you to 
              review their policies.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>6. Data Sharing</h2>
            <p style={styles.paragraph}>We do not sell your personal information. We may share information:</p>
            <ul style={styles.list}>
              <li>With service providers who assist in operating the Service</li>
              <li>To comply with legal obligations or valid legal processes</li>
              <li>To protect our rights, privacy, safety, or property</li>
              <li>In connection with a merger, acquisition, or sale of assets (with notice to you)</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>7. Your Rights</h2>
            <p style={styles.paragraph}>Depending on your location, you may have the right to:</p>
            <ul style={styles.list}>
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of certain data processing activities</li>
            </ul>
            <p style={styles.paragraph}>
              To exercise these rights, contact us at <a href="mailto:admin@9thwave.io" style={styles.link}>admin@9thwave.io</a>.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>8. Data Retention</h2>
            <p style={styles.paragraph}>
              We retain your information for as long as your account is active or as needed to provide the Service. 
              You may request deletion of your account and associated data at any time.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>9. Children's Privacy</h2>
            <p style={styles.paragraph}>
              The Service is not intended for individuals under 18 years of age. We do not knowingly collect 
              personal information from children under 18.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>10. Changes to This Policy</h2>
            <p style={styles.paragraph}>
              We may update this Privacy Policy from time to time. We will notify you of material changes by 
              posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>11. Contact Us</h2>
            <p style={styles.paragraph}>
              For questions about this Privacy Policy, contact us at:
            </p>
            <p style={styles.paragraph}>
              <a href="mailto:admin@9thwave.io" style={styles.link}>admin@9thwave.io</a><br />
              Ninth Wave LLC<br />
              Delaware, USA
            </p>
          </section>
        </div>
      </main>

      <footer style={styles.footer}>
        <div>© {new Date().getFullYear()} Ninth Wave LLC · Delaware, USA</div>
        <div style={styles.footerLinks}>
          <Link href="/terms" style={styles.footerLink}>Terms of Service</Link>
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
  subheading: {
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '20px',
    marginBottom: '12px',
    color: '#e4e4e7',
  },
  paragraph: {
    fontSize: '15px',
    lineHeight: '1.7',
    color: '#a1a1aa',
    marginBottom: '16px',
  },
  list: {
    fontSize: '15px',
    lineHeight: '1.8',
    color: '#a1a1aa',
    paddingLeft: '24px',
    marginBottom: '16px',
  },
  highlight: {
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
