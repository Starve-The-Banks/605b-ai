"use client";

import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function TermsOfService() {
  const effectiveDate = "January 9, 2026";
  
  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090b',
      color: '#fafafa',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link 
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#f7d047',
            textDecoration: 'none',
            fontSize: '14px',
            marginBottom: '32px',
          }}
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>Terms of Service</h1>
        <p style={{ color: '#71717a', marginBottom: '24px' }}>Effective Date: {effectiveDate}</p>

        {/* Trust Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)',
          border: '2px solid rgba(34, 197, 94, 0.4)',
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '32px',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '12px',
            color: '#22c55e',
            fontWeight: 700,
            fontSize: '16px',
          }}>
            <ShieldCheck size={24} />
            YOUR PRIVACY IS PROTECTED
          </div>
          <p style={{ fontSize: '15px', color: '#fafafa', lineHeight: 1.6, marginBottom: '0' }}>
            <strong>We do NOT store your credit report PDF files.</strong> Your uploaded documents are processed in-memory, analyzed, and immediately discarded. We never retain copies of your actual credit report files on our servers. Only the analysis results (flagged items) are saved to your account—and you can delete those anytime.
          </p>
        </div>

        <div style={{ 
          fontSize: '15px', 
          lineHeight: 1.8, 
          color: '#d4d4d4',
        }}>
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fafafa', marginBottom: '16px' }}>1. Agreement to Terms</h2>
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
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fafafa', marginBottom: '16px' }}>2. Nature of Service — Important Disclaimers</h2>
            
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f7d047', marginBottom: '12px' }}>2.1 Educational Software Platform</h3>
            <p style={{ marginBottom: '16px' }}>
              The Service is an <strong>educational software platform</strong> that provides tools, templates, and information to help consumers understand and exercise their rights under federal consumer protection laws, including but not limited to the Fair Credit Reporting Act (FCRA), Fair Debt Collection Practices Act (FDCPA), and Fair Credit Billing Act (FCBA).
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f7d047', marginBottom: '12px' }}>2.2 Not a Credit Repair Organization</h3>
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

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f7d047', marginBottom: '12px' }}>2.3 Not Legal Advice</h3>
            <p style={{ marginBottom: '16px' }}>
              <strong>THE SERVICE DOES NOT PROVIDE LEGAL ADVICE.</strong> The information, templates, and tools provided through the Service are for general informational and educational purposes only and do not constitute legal advice. No attorney-client relationship is created by your use of the Service.
            </p>
            <p style={{ marginBottom: '16px' }}>
              We strongly recommend that you consult with a licensed attorney in your jurisdiction before taking any legal action, particularly in matters involving identity theft, credit disputes, or debt collection.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f7d047', marginBottom: '12px' }}>2.4 AI-Generated Content</h3>
            <p style={{ marginBottom: '16px' }}>
              The Service utilizes artificial intelligence ("AI") to analyze documents, generate suggestions, and provide information. <strong>AI-generated content may contain errors, inaccuracies, or omissions.</strong> You are solely responsible for reviewing, verifying, and editing any AI-generated content before use. We make no warranties regarding the accuracy, completeness, or suitability of AI-generated content for any particular purpose.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f7d047', marginBottom: '12px' }}>2.5 Credit Report Processing — No File Storage</h3>
            <p style={{ marginBottom: '16px' }}>
              <strong>WE DO NOT STORE YOUR CREDIT REPORT PDF FILES.</strong> When you upload a credit report for analysis, the file is processed in-memory, analyzed by our AI system, and immediately discarded. We retain only the analysis results (flagged items, identified issues) in your account—never the original credit report content or PDF files. See our Privacy Policy for complete details on data handling.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f7d047', marginBottom: '12px' }}>2.6 No Guarantee of Results</h3>
            <p>
              <strong>WE DO NOT GUARANTEE ANY SPECIFIC OUTCOMES OR RESULTS.</strong> The effectiveness of dispute letters, the response of credit bureaus or creditors, and any changes to your credit report depend on many factors outside our control, including the accuracy of information you provide and the policies of third parties.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fafafa', marginBottom: '16px' }}>3. User Responsibilities</h2>
            
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f7d047', marginBottom: '12px' }}>3.1 Accurate Information</h3>
            <p style={{ marginBottom: '16px' }}>
              You agree to provide accurate, current, and complete information when using the Service. You are solely responsible for the accuracy of all information you submit, including personal information, credit report data, and dispute details.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f7d047', marginBottom: '12px' }}>3.2 Lawful Use</h3>
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

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f7d047', marginBottom: '12px' }}>3.3 Account Security</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fafafa', marginBottom: '16px' }}>4. Intellectual Property</h2>
            <p style={{ marginBottom: '16px' }}>
              The Service and its original content, features, and functionality are owned by Ninth Wave Analytics LLC and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p>
              Letter templates, educational content, and other materials provided through the Service are licensed for your personal, non-commercial use only. You may not reproduce, distribute, modify, or create derivative works from our materials without express written consent.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fafafa', marginBottom: '16px' }}>5. Limitation of Liability</h2>
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
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fafafa', marginBottom: '16px' }}>6. Disclaimer of Warranties</h2>
            <p style={{ marginBottom: '16px' }}>
              <strong>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.</strong>
            </p>
            <p>
              We do not warrant that the Service will be uninterrupted, secure, or error-free, that defects will be corrected, or that the Service or the servers that make it available are free of viruses or other harmful components.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fafafa', marginBottom: '16px' }}>7. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless Ninth Wave Analytics LLC, its officers, directors, members, employees, agents, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any third-party rights, including intellectual property rights; (d) any dispute between you and a credit bureau, creditor, or debt collector; or (e) any false or misleading information you provide through the Service.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fafafa', marginBottom: '16px' }}>8. Dispute Resolution and Arbitration</h2>
            
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f7d047', marginBottom: '12px' }}>8.1 Binding Arbitration</h3>
            <p style={{ marginBottom: '16px' }}>
              Any dispute, controversy, or claim arising out of or relating to these Terms or the Service shall be resolved by binding arbitration administered by the American Arbitration Association ("AAA") in accordance with its Consumer Arbitration Rules. The arbitration shall take place in Delaware or, at your election, may be conducted remotely.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f7d047', marginBottom: '12px' }}>8.2 Class Action Waiver</h3>
            <p style={{ marginBottom: '16px' }}>
              <strong>YOU AGREE THAT ANY ARBITRATION OR PROCEEDING SHALL BE LIMITED TO THE DISPUTE BETWEEN US AND YOU INDIVIDUALLY. YOU WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION.</strong>
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f7d047', marginBottom: '12px' }}>8.3 Small Claims Exception</h3>
            <p>
              Notwithstanding the foregoing, either party may bring an individual action in small claims court for disputes within the court's jurisdictional limits.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fafafa', marginBottom: '16px' }}>9. Governing Law</h2>
            <p style={{ marginBottom: '16px' }}>
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions. Any legal action or proceeding not subject to arbitration shall be brought exclusively in the state or federal courts located in Delaware.
            </p>
            <p>
              Notwithstanding the foregoing, if you are a California resident, you retain all rights afforded to you under the California Consumer Privacy Act (CCPA), California Privacy Rights Act (CPRA), and other applicable California consumer protection laws.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fafafa', marginBottom: '16px' }}>10. Termination</h2>
            <p style={{ marginBottom: '16px' }}>
              We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason, including breach of these Terms.
            </p>
            <p>
              Upon termination, your right to use the Service will cease immediately. Provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnification, and limitations of liability.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fafafa', marginBottom: '16px' }}>11. Severability</h2>
            <p>
              If any provision of these Terms is held to be unenforceable or invalid, such provision will be modified to the minimum extent necessary to make it enforceable, and the remaining provisions will continue in full force and effect.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fafafa', marginBottom: '16px' }}>12. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Ninth Wave Analytics LLC regarding the Service and supersede all prior agreements and understandings.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fafafa', marginBottom: '16px' }}>13. Contact Information</h2>
            <p style={{ marginBottom: '16px' }}>
              If you have any questions about these Terms, please contact us at:
            </p>
            <div style={{ 
              background: '#121214', 
              border: '1px solid #27272a', 
              borderRadius: '8px', 
              padding: '16px',
              marginBottom: '16px',
            }}>
              <p style={{ marginBottom: '4px' }}><strong>Ninth Wave Analytics LLC</strong></p>
              <p style={{ marginBottom: '4px' }}>Email: legal@9thwave.io</p>
            </div>
          </section>

          <div style={{ 
            borderTop: '1px solid #27272a', 
            paddingTop: '24px', 
            marginTop: '40px',
            textAlign: 'center',
            color: '#71717a',
            fontSize: '13px',
          }}>
            <p>© {new Date().getFullYear()} Ninth Wave Analytics LLC. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
