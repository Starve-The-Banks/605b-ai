"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function IdentityTheftPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    dob: '',
    ssnLast4: '',
    bureaus: {
      equifax: false,
      experian: false,
      transunion: false,
    },
    creditors: [''],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBureauChange = (bureau) => {
    setFormData((prev) => ({
      ...prev,
      bureaus: { ...prev.bureaus, [bureau]: !prev.bureaus[bureau] },
    }));
  };

  const handleCreditorChange = (index, value) => {
    const newCreditors = [...formData.creditors];
    newCreditors[index] = value;
    setFormData((prev) => ({ ...prev, creditors: newCreditors }));
  };

  const addCreditor = () => {
    setFormData((prev) => ({ ...prev, creditors: [...prev.creditors, ''] }));
  };

  const removeCreditor = (index) => {
    if (formData.creditors.length > 1) {
      const newCreditors = formData.creditors.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, creditors: newCreditors }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate at least one bureau is selected
    const selectedBureaus = Object.values(formData.bureaus).some((v) => v);
    if (!selectedBureaus) {
      setError('Please select at least one credit bureau.');
      setIsLoading(false);
      return;
    }

    // Validate at least one creditor
    const validCreditors = formData.creditors.filter((c) => c.trim() !== '');
    if (validCreditors.length === 0) {
      setError('Please enter at least one fraudulent creditor.');
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Create intake token with form data
      const intakeResponse = await fetch('/api/identity-theft/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          creditors: validCreditors,
        }),
      });

      const intakeData = await intakeResponse.json();

      if (!intakeResponse.ok || !intakeData.token) {
        setError(intakeData.error || 'Failed to process your information. Please try again.');
        setIsLoading(false);
        return;
      }

      // Step 2: Create checkout session with intake token
      const checkoutResponse = await fetch('/api/identity-theft/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeToken: intakeData.token,
        }),
      });

      const checkoutData = await checkoutResponse.json();

      if (checkoutData.url) {
        window.location.href = checkoutData.url;
      } else {
        setError(checkoutData.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        .idt-page {
          font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #0c0c0c;
          color: #f5f5f5;
          min-height: 100vh;
        }

        .idt-header {
          padding: 20px 32px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .idt-logo {
          font-size: 20px;
          font-weight: 600;
          color: #f5f5f5;
          text-decoration: none;
        }

        .idt-logo span {
          color: #ff6b35;
        }

        .idt-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 60px 24px 80px;
        }

        .idt-hero {
          text-align: center;
          margin-bottom: 64px;
        }

        .idt-hero h1 {
          font-size: clamp(28px, 5vw, 42px);
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 20px;
          letter-spacing: -0.02em;
        }

        .idt-hero h1 .highlight {
          color: #ff6b35;
        }

        .idt-hero-sub {
          font-size: 18px;
          color: #a0a0a0;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto 32px;
        }

        .idt-cta-btn {
          display: inline-block;
          background: #ff6b35;
          color: white;
          font-size: 18px;
          font-weight: 600;
          padding: 16px 32px;
          border-radius: 8px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .idt-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(255, 107, 53, 0.3);
        }

        .idt-cta-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .idt-section {
          margin-bottom: 56px;
        }

        .idt-section-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 24px;
          color: #f5f5f5;
        }

        .idt-card {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 32px;
        }

        .idt-checklist {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .idt-checklist li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 16px;
          color: #d0d0d0;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .idt-checklist li:last-child {
          margin-bottom: 0;
        }

        .idt-check {
          color: #22c55e;
          font-size: 18px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .idt-steps {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .idt-steps li {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }

        .idt-steps li:last-child {
          margin-bottom: 0;
        }

        .idt-step-num {
          width: 32px;
          height: 32px;
          background: #ff6b35;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          flex-shrink: 0;
        }

        .idt-step-text {
          font-size: 16px;
          color: #d0d0d0;
          line-height: 1.5;
          padding-top: 4px;
        }

        .idt-pricing {
          text-align: center;
          padding: 40px;
        }

        .idt-price {
          font-size: 48px;
          font-weight: 700;
          color: #f5f5f5;
          margin-bottom: 8px;
        }

        .idt-price-note {
          font-size: 16px;
          color: #808080;
          margin-bottom: 24px;
        }

        .idt-disclosure {
          background: #141414;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 20px;
          font-size: 14px;
          color: #808080;
          line-height: 1.7;
          margin-bottom: 56px;
        }

        .idt-refund {
          text-align: center;
          font-size: 14px;
          color: #606060;
          margin-top: 24px;
        }

        /* Form Styles */
        .idt-form {
          margin-top: 40px;
        }

        .idt-form-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 24px;
          text-align: center;
        }

        .idt-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .idt-form-group {
          margin-bottom: 16px;
        }

        .idt-form-group.full {
          grid-column: 1 / -1;
        }

        .idt-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #a0a0a0;
          margin-bottom: 8px;
        }

        .idt-input {
          width: 100%;
          background: #0c0c0c;
          border: 1px solid #2a2a2a;
          border-radius: 6px;
          padding: 12px 14px;
          font-size: 16px;
          color: #f5f5f5;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .idt-input:focus {
          outline: none;
          border-color: #ff6b35;
        }

        .idt-input::placeholder {
          color: #505050;
        }

        .idt-checkbox-group {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }

        .idt-checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 15px;
          color: #d0d0d0;
        }

        .idt-checkbox {
          width: 20px;
          height: 20px;
          accent-color: #ff6b35;
          cursor: pointer;
        }

        .idt-creditor-row {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .idt-creditor-row .idt-input {
          flex: 1;
        }

        .idt-btn-secondary {
          background: transparent;
          border: 1px solid #2a2a2a;
          color: #a0a0a0;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }

        .idt-btn-secondary:hover {
          border-color: #ff6b35;
          color: #ff6b35;
        }

        .idt-btn-remove {
          background: transparent;
          border: 1px solid #3a2a2a;
          color: #a06060;
          padding: 12px 14px;
          border-radius: 6px;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }

        .idt-btn-remove:hover {
          border-color: #ff4444;
          color: #ff4444;
        }

        .idt-error {
          background: #2a1a1a;
          border: 1px solid #4a2a2a;
          color: #ff6b6b;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .idt-submit-section {
          text-align: center;
          margin-top: 32px;
        }

        .idt-footer {
          text-align: center;
          padding: 40px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 13px;
          color: #606060;
        }

        .idt-footer a {
          color: #808080;
          text-decoration: none;
        }

        .idt-footer a:hover {
          color: #ff6b35;
        }

        @media (max-width: 640px) {
          .idt-container {
            padding: 40px 20px 60px;
          }

          .idt-form-row {
            grid-template-columns: 1fr;
          }

          .idt-card {
            padding: 24px;
          }

          .idt-pricing {
            padding: 32px 24px;
          }

          .idt-price {
            font-size: 40px;
          }
        }
      `}</style>

      <div className="idt-page">
        <header className="idt-header">
          <Link href="/" className="idt-logo">
            605b<span>.ai</span>
          </Link>
        </header>

        <main className="idt-container">
          {/* Hero Section */}
          <section className="idt-hero">
            <h1>
              Remove Fraudulent Accounts From Your Credit Reports<br />
              <span className="highlight">Using the Federal Process — No Credit Repair Company Required</span>
            </h1>
            <p className="idt-hero-sub">
              Generate a complete identity theft dispute packet in minutes.
              You review it. You send it. You stay in control.
            </p>
            <a href="#form" className="idt-cta-btn">
              Get My Identity Theft Packet — $49
            </a>
          </section>

          {/* What You Get Section */}
          <section className="idt-section">
            <h2 className="idt-section-title">What You Get</h2>
            <div className="idt-card">
              <ul className="idt-checklist">
                <li>
                  <span className="idt-check">&#10003;</span>
                  <span>FTC Identity Theft Affidavit (prefilled)</span>
                </li>
                <li>
                  <span className="idt-check">&#10003;</span>
                  <span>FCRA &sect;605B Removal Letters (Equifax, Experian, TransUnion)</span>
                </li>
                <li>
                  <span className="idt-check">&#10003;</span>
                  <span>Creditor Dispute Letters</span>
                </li>
                <li>
                  <span className="idt-check">&#10003;</span>
                  <span>Certified Mail Checklist</span>
                </li>
                <li>
                  <span className="idt-check">&#10003;</span>
                  <span>USPS Mailing Instructions</span>
                </li>
                <li>
                  <span className="idt-check">&#10003;</span>
                  <span>Deadline &amp; Follow-Up Timeline</span>
                </li>
              </ul>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="idt-section">
            <h2 className="idt-section-title">How It Works</h2>
            <div className="idt-card">
              <ol className="idt-steps">
                <li>
                  <span className="idt-step-num">1</span>
                  <span className="idt-step-text">Answer a few questions about the fraudulent accounts</span>
                </li>
                <li>
                  <span className="idt-step-num">2</span>
                  <span className="idt-step-text">Download your completed dispute packet</span>
                </li>
                <li>
                  <span className="idt-step-num">3</span>
                  <span className="idt-step-text">Mail it certified (instructions included)</span>
                </li>
                <li>
                  <span className="idt-step-num">4</span>
                  <span className="idt-step-text">Wait for the legally required reinvestigation</span>
                </li>
              </ol>
            </div>
          </section>

          {/* Disclosure */}
          <div className="idt-disclosure">
            605b.ai provides self-service software and educational tools only.
            We do not contact credit bureaus or creditors on your behalf.
            We do not guarantee outcomes.
            You generate, review, and send all materials yourself.
          </div>

          {/* Pricing Section */}
          <section className="idt-section">
            <div className="idt-card idt-pricing">
              <div className="idt-price">$49</div>
              <div className="idt-price-note">One-Time Purchase — No subscriptions. No recurring charges.</div>
              <a href="#form" className="idt-cta-btn">Generate My Packet</a>
            </div>
          </section>

          {/* Form Section */}
          <section className="idt-section" id="form">
            <div className="idt-card">
              <h2 className="idt-form-title">Enter Your Information</h2>

              <form className="idt-form" onSubmit={handleSubmit}>
                {error && <div className="idt-error">{error}</div>}

                <div className="idt-form-group">
                  <label className="idt-label">Full Legal Name</label>
                  <input
                    type="text"
                    name="fullName"
                    className="idt-input"
                    placeholder="John Michael Smith"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="idt-form-group">
                  <label className="idt-label">Mailing Address</label>
                  <input
                    type="text"
                    name="address"
                    className="idt-input"
                    placeholder="123 Main Street, Apt 4B"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="idt-form-row">
                  <div className="idt-form-group">
                    <label className="idt-label">City</label>
                    <input
                      type="text"
                      name="city"
                      className="idt-input"
                      placeholder="New York"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="idt-form-group">
                    <label className="idt-label">State</label>
                    <input
                      type="text"
                      name="state"
                      className="idt-input"
                      placeholder="NY"
                      maxLength={2}
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="idt-form-row">
                  <div className="idt-form-group">
                    <label className="idt-label">ZIP Code</label>
                    <input
                      type="text"
                      name="zip"
                      className="idt-input"
                      placeholder="10001"
                      maxLength={10}
                      value={formData.zip}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="idt-form-group">
                    <label className="idt-label">Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      className="idt-input"
                      value={formData.dob}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="idt-form-group">
                  <label className="idt-label">Last 4 Digits of SSN</label>
                  <input
                    type="text"
                    name="ssnLast4"
                    className="idt-input"
                    placeholder="1234"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    value={formData.ssnLast4}
                    onChange={handleInputChange}
                    required
                    style={{ maxWidth: '120px' }}
                  />
                </div>

                <div className="idt-form-group">
                  <label className="idt-label">Which credit bureaus are affected?</label>
                  <div className="idt-checkbox-group">
                    <label className="idt-checkbox-label">
                      <input
                        type="checkbox"
                        className="idt-checkbox"
                        checked={formData.bureaus.equifax}
                        onChange={() => handleBureauChange('equifax')}
                      />
                      Equifax
                    </label>
                    <label className="idt-checkbox-label">
                      <input
                        type="checkbox"
                        className="idt-checkbox"
                        checked={formData.bureaus.experian}
                        onChange={() => handleBureauChange('experian')}
                      />
                      Experian
                    </label>
                    <label className="idt-checkbox-label">
                      <input
                        type="checkbox"
                        className="idt-checkbox"
                        checked={formData.bureaus.transunion}
                        onChange={() => handleBureauChange('transunion')}
                      />
                      TransUnion
                    </label>
                  </div>
                </div>

                <div className="idt-form-group">
                  <label className="idt-label">Names of Fraudulent Creditors</label>
                  {formData.creditors.map((creditor, index) => (
                    <div key={index} className="idt-creditor-row">
                      <input
                        type="text"
                        className="idt-input"
                        placeholder="e.g., Capital One, Midland Credit"
                        value={creditor}
                        onChange={(e) => handleCreditorChange(index, e.target.value)}
                      />
                      {formData.creditors.length > 1 && (
                        <button
                          type="button"
                          className="idt-btn-remove"
                          onClick={() => removeCreditor(index)}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="idt-btn-secondary"
                    onClick={addCreditor}
                  >
                    + Add Another Creditor
                  </button>
                </div>

                <div className="idt-submit-section">
                  <button
                    type="submit"
                    className="idt-cta-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Get My Identity Theft Packet — $49'}
                  </button>
                  <p className="idt-refund">
                    All sales are final. Due to the immediate-access nature of digital
                    software licenses, refunds are not offered.
                  </p>
                </div>
              </form>
            </div>
          </section>
        </main>

        <footer className="idt-footer">
          <p>&copy; {new Date().getFullYear()} Ninth Wave Analytics LLC. Software tools only.</p>
          <p style={{ marginTop: '8px' }}>
            <Link href="/privacy">Privacy</Link> &middot; <Link href="/terms">Terms</Link>
          </p>
        </footer>
      </div>
    </>
  );
}
