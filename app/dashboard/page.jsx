"use client";

import { useState } from 'react';
import { 
  Search, Upload, ExternalLink, AlertCircle, ChevronDown, ChevronUp,
  BookOpen, Shield, Scale, TrendingUp, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';

export default function AnalyzePage() {
  const [resourcesExpanded, setResourcesExpanded] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsUploading(true);
    setTimeout(() => setIsUploading(false), 2000);
  };

  const analysisFeatures = [
    { icon: Search, title: 'Account Verification', desc: 'Identifies accounts you may not recognize' },
    { icon: AlertCircle, title: 'Inconsistency Detection', desc: 'Flags discrepancies across bureaus' },
    { icon: Clock, title: 'Age Analysis', desc: 'Spots accounts past 7-year reporting limit' },
    { icon: Scale, title: 'Statute Matching', desc: 'Maps issues to FCRA/FDCPA sections' },
    { icon: TrendingUp, title: 'Priority Scoring', desc: 'Ranks items by dispute success likelihood' },
    { icon: AlertTriangle, title: 'Identity Theft Markers', desc: 'Detects fraud patterns and red flags' },
  ];

  const creditReportLinks = [
    { name: 'AnnualCreditReport.com', desc: 'Official free reports (all 3 bureaus)', url: 'https://www.annualcreditreport.com' },
    { name: 'Experian', desc: 'Direct from Experian', url: 'https://www.experian.com' },
    { name: 'Equifax', desc: 'Direct from Equifax', url: 'https://www.equifax.com' },
    { name: 'TransUnion', desc: 'Direct from TransUnion', url: 'https://www.transunion.com' },
  ];

  const specialtyAgencies = [
    { name: 'ChexSystems', desc: 'Banking history', url: 'https://www.chexsystems.com' },
    { name: 'LexisNexis', desc: 'Insurance reports', url: 'https://consumer.risk.lexisnexis.com' },
    { name: 'Early Warning Services', desc: 'Bank account screening', url: 'https://www.earlywarning.com' },
    { name: 'NCTUE', desc: 'Utility payment history', url: 'https://www.nctue.com' },
  ];

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>Analyze Reports</h1>
        <p style={{ fontSize: '14px', color: '#737373' }}>AI-powered analysis identifies disputes, fraud, and violations</p>
      </div>

      {/* Comprehensive Credit Analysis */}
      <div style={{ background: '#121214', border: '1px solid #1f1f23', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'rgba(247, 208, 71, 0.1)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f7d047',
            flexShrink: 0
          }}>
            <Shield size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Comprehensive Credit Analysis</h2>
            <p style={{ fontSize: '13px', color: '#737373', lineHeight: 1.5 }}>
              Upload your credit reports and our AI will scan for inaccuracies, identity theft markers, 
              outdated accounts, and FCRA violations. Each finding is mapped to the relevant statute 
              and prioritized by likelihood of successful dispute.
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {analysisFeatures.map((feature, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              background: '#1a1a1c',
              border: '1px solid #262629',
              borderRadius: '10px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'rgba(247, 208, 71, 0.1)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f7d047',
                flexShrink: 0
              }}>
                <feature.icon size={16} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>{feature.title}</div>
                <div style={{ fontSize: '11px', color: '#737373' }}>{feature.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Section */}
      <div style={{ background: '#121214', border: '1px solid #1f1f23', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Upload Credit Reports</h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: 'rgba(247, 208, 71, 0.1)',
            border: '1px solid rgba(247, 208, 71, 0.2)',
            borderRadius: '100px',
            fontSize: '12px',
            color: '#f7d047'
          }}>
            <CheckCircle size={14} />
            Best results with all 3 bureaus
          </div>
        </div>
        <label style={{
          display: 'block',
          border: '2px dashed #262629',
          borderRadius: '12px',
          padding: '48px 24px',
          textAlign: 'center',
          cursor: 'pointer'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: '#1a1a1c',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#f7d047'
          }}>
            <Upload size={24} />
          </div>
          <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>Tap to upload credit reports</div>
          <div style={{ fontSize: '13px', color: '#737373' }}>PDF files from Experian, Equifax, TransUnion</div>
          <input type="file" accept=".pdf" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>
      </div>

      {/* Don't have reports */}
      <div style={{ background: '#121214', border: '1px solid #1f1f23', borderRadius: '12px', padding: '32px 24px', textAlign: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>Don't have your reports yet?</h3>
        <p style={{ fontSize: '13px', color: '#737373', marginBottom: '20px' }}>You're entitled to free credit reports from each bureau every week.</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <a href="https://www.annualcreditreport.com" target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            textDecoration: 'none',
            background: 'rgba(247, 208, 71, 0.1)',
            border: '1px solid rgba(247, 208, 71, 0.3)',
            color: '#f7d047'
          }}>
            <ExternalLink size={16} />
            Get Free Reports
          </a>
          <a href="https://www.identitytheft.gov" target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            textDecoration: 'none',
            background: '#1a1a1c',
            border: '1px solid #262629',
            color: '#e5e5e5'
          }}>
            <Shield size={16} />
            Report Identity Theft
          </a>
        </div>
      </div>

      {/* Resources Section */}
      <div style={{ background: '#121214', border: '1px solid #1f1f23', borderRadius: '12px', overflow: 'hidden' }}>
        <div 
          onClick={() => setResourcesExpanded(!resourcesExpanded)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={18} style={{ color: '#f7d047' }} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Resources & Links</span>
          </div>
          <div style={{ fontSize: '13px', color: '#737373', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {resourcesExpanded ? 'Hide' : 'Show'}
            {resourcesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
        
        {resourcesExpanded && (
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Get Your Credit Reports</h4>
              <p style={{ fontSize: '12px', color: '#737373', marginBottom: '12px' }}>You're entitled to free reports from each bureau every week.</p>
              {creditReportLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#1a1a1c',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  textDecoration: 'none',
                  color: 'inherit'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#f7d047', marginBottom: '2px' }}>{link.name}</div>
                    <div style={{ fontSize: '12px', color: '#737373' }}>{link.desc}</div>
                  </div>
                  <ExternalLink size={16} style={{ color: '#525252' }} />
                </a>
              ))}
            </div>

            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Specialty Consumer Agencies</h4>
              <p style={{ fontSize: '12px', color: '#737373', marginBottom: '12px' }}>These agencies track banking, insurance, and other data.</p>
              {specialtyAgencies.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#1a1a1c',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  textDecoration: 'none',
                  color: 'inherit'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#f7d047', marginBottom: '2px' }}>{link.name}</div>
                    <div style={{ fontSize: '12px', color: '#737373' }}>{link.desc}</div>
                  </div>
                  <ExternalLink size={16} style={{ color: '#525252' }} />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
