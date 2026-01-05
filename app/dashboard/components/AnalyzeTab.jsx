"use client";

import { useState, useRef } from 'react';
import { 
  Upload, File, X, Search, Loader2, AlertCircle, Flag, 
  ExternalLink, FileText, Shield, Clock, CheckCircle2,
  ChevronDown, ChevronRight, Building2, Scale, AlertTriangle,
  HelpCircle, Zap, Brain
} from 'lucide-react';
import { SEVERITY_COLORS } from '@/lib/constants';

// Resource links organized by category
const RESOURCES = {
  reports: {
    title: "Get Your Credit Reports",
    description: "You're entitled to free reports from each bureau every week",
    links: [
      { name: "AnnualCreditReport.com", url: "https://www.annualcreditreport.com", description: "Official free reports (all 3 bureaus)", primary: true },
      { name: "Experian", url: "https://www.experian.com/consumer-products/free-credit-report.html", description: "Direct from Experian" },
      { name: "Equifax", url: "https://www.equifax.com/personal/credit-report-services/free-credit-reports/", description: "Direct from Equifax" },
      { name: "TransUnion", url: "https://www.transunion.com/credit-reports/free-credit-reports", description: "Direct from TransUnion" },
    ]
  },
  specialty: {
    title: "Specialty Consumer Agencies",
    description: "These agencies track banking, insurance, and other data",
    links: [
      { name: "ChexSystems", url: "https://www.chexsystems.com/web/chexsystems/consumerdebit/page/requestreports/freereport", description: "Banking history report" },
      { name: "Early Warning (EWS)", url: "https://www.earlywarning.com/consumer-information", description: "Bank account screening" },
      { name: "LexisNexis", url: "https://consumer.risk.lexisnexis.com/request", description: "Insurance & background data" },
      { name: "NCTUE", url: "https://www.nctue.com/consumers", description: "Utility payment history" },
    ]
  },
  government: {
    title: "Government Resources",
    description: "Official agencies for complaints and identity theft",
    links: [
      { name: "IdentityTheft.gov", url: "https://www.identitytheft.gov", description: "FTC identity theft recovery", important: true },
      { name: "CFPB Complaint Portal", url: "https://www.consumerfinance.gov/complaint/", description: "File federal complaints" },
      { name: "FTC Consumer", url: "https://consumer.ftc.gov", description: "Consumer protection resources" },
      { name: "State AG Directory", url: "https://www.naag.org/find-my-ag/", description: "Find your state attorney general" },
    ]
  }
};

// What the analysis covers
const ANALYSIS_CAPABILITIES = [
  { icon: Search, title: "Account Verification", desc: "Identifies accounts you may not recognize" },
  { icon: AlertTriangle, title: "Inconsistency Detection", desc: "Flags discrepancies across bureaus" },
  { icon: Clock, title: "Age Analysis", desc: "Spots accounts past 7-year reporting limit" },
  { icon: Scale, title: "Statute Matching", desc: "Maps issues to FCRA/FDCPA sections" },
  { icon: Zap, title: "Priority Scoring", desc: "Ranks items by dispute success likelihood" },
  { icon: Shield, title: "Identity Theft Markers", desc: "Detects fraud patterns and red flags" },
];

export default function AnalyzeTab({ flaggedItems, setFlaggedItems, logAction }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({ reports: true, specialty: false, government: false });
  const [showResources, setShowResources] = useState(true);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const pdfFiles = files.filter(f => f.type === 'application/pdf');
    if (pdfFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...pdfFiles]);
      setAnalysisError(null);
      setShowResources(false);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    if (uploadedFiles.length <= 1) setShowResources(true);
  };

  const analyzeReports = async () => {
    if (uploadedFiles.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      uploadedFiles.forEach(file => formData.append('files', file));

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysisResult(data.analysis);
      logAction('REPORTS_ANALYZED', { filesCount: uploadedFiles.length, issuesFound: data.analysis?.findings?.length || 0 });
    } catch (err) {
      setAnalysisError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleFlag = (finding) => {
    const exists = flaggedItems.find(f => f.id === finding.id);
    if (exists) {
      setFlaggedItems(prev => prev.filter(f => f.id !== finding.id));
    } else {
      setFlaggedItems(prev => [...prev, { ...finding, flaggedAt: new Date().toISOString() }]);
      logAction('ITEM_FLAGGED', { account: finding.account });
    }
  };

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="content-area">
      <style jsx>{`
        .intro-banner {
          background: linear-gradient(135deg, rgba(212, 165, 116, 0.1) 0%, rgba(212, 165, 116, 0.05) 100%);
          border: 1px solid rgba(212, 165, 116, 0.2);
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 24px;
        }
        .intro-banner h2 {
          font-size: 18px;
          font-weight: 600;
          color: #fafafa;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .intro-banner p {
          font-size: 14px;
          color: #a1a1aa;
          line-height: 1.6;
        }
        .capabilities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }
        .capability-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px;
          background: rgba(39, 39, 42, 0.5);
          border-radius: 8px;
        }
        .capability-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(212, 165, 116, 0.15);
          border-radius: 6px;
          color: #d4a574;
          flex-shrink: 0;
        }
        .capability-text h4 {
          font-size: 13px;
          font-weight: 600;
          color: #fafafa;
          margin-bottom: 2px;
        }
        .capability-text p {
          font-size: 12px;
          color: #71717a;
        }
        .resources-section {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 12px;
          margin-bottom: 24px;
          overflow: hidden;
        }
        .resources-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: rgba(39, 39, 42, 0.3);
          border-bottom: 1px solid #27272a;
          cursor: pointer;
        }
        .resources-header:hover {
          background: rgba(39, 39, 42, 0.5);
        }
        .resources-header h3 {
          font-size: 15px;
          font-weight: 600;
          color: #fafafa;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .resources-header span {
          font-size: 13px;
          color: #71717a;
        }
        .resource-category {
          border-bottom: 1px solid #27272a;
        }
        .resource-category:last-child {
          border-bottom: none;
        }
        .category-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .category-header:hover {
          background: rgba(39, 39, 42, 0.3);
        }
        .category-title {
          font-size: 14px;
          font-weight: 600;
          color: #fafafa;
        }
        .category-desc {
          font-size: 12px;
          color: #71717a;
          margin-top: 2px;
        }
        .category-links {
          padding: 0 20px 16px;
          display: grid;
          gap: 8px;
        }
        .resource-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: rgba(39, 39, 42, 0.4);
          border: 1px solid #27272a;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.15s;
        }
        .resource-link:hover {
          background: rgba(39, 39, 42, 0.7);
          border-color: rgba(212, 165, 116, 0.3);
        }
        .resource-link.primary {
          background: rgba(212, 165, 116, 0.1);
          border-color: rgba(212, 165, 116, 0.25);
        }
        .resource-link.primary:hover {
          background: rgba(212, 165, 116, 0.15);
          border-color: rgba(212, 165, 116, 0.4);
        }
        .resource-link.important {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.2);
        }
        .resource-link.important:hover {
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.3);
        }
        .resource-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .resource-name {
          font-size: 14px;
          font-weight: 500;
          color: #fafafa;
        }
        .resource-link.primary .resource-name { color: #d4a574; }
        .resource-link.important .resource-name { color: #f87171; }
        .resource-desc {
          font-size: 12px;
          color: #71717a;
        }
        .resource-arrow {
          color: #52525b;
        }
        .upload-section {
          margin-bottom: 24px;
        }
        .upload-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .upload-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #fafafa;
        }
        .tip-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 6px;
          font-size: 12px;
          color: #60a5fa;
        }
        .no-reports-cta {
          text-align: center;
          padding: 32px 20px;
          background: rgba(39, 39, 42, 0.3);
          border: 1px dashed #3f3f46;
          border-radius: 12px;
          margin-top: 16px;
        }
        .no-reports-cta h4 {
          font-size: 15px;
          font-weight: 600;
          color: #fafafa;
          margin-bottom: 8px;
        }
        .no-reports-cta p {
          font-size: 13px;
          color: #71717a;
          margin-bottom: 16px;
        }
        .quick-links {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .quick-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: rgba(212, 165, 116, 0.1);
          border: 1px solid rgba(212, 165, 116, 0.25);
          border-radius: 6px;
          color: #d4a574;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.15s;
        }
        .quick-link:hover {
          background: rgba(212, 165, 116, 0.2);
          border-color: rgba(212, 165, 116, 0.4);
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">Analyze Reports</h1>
          <p className="page-subtitle">AI-powered analysis identifies disputes, fraud, and violations</p>
        </div>
      </div>

      {/* Intro Banner - What this tool does */}
      <div className="intro-banner">
        <h2><Brain size={20} /> Comprehensive Credit Analysis</h2>
        <p>
          Upload your credit reports and our AI will scan for inaccuracies, identity theft markers, 
          outdated accounts, and FCRA violations. Each finding is mapped to the relevant statute 
          and prioritized by likelihood of successful dispute.
        </p>
        <div className="capabilities-grid">
          {ANALYSIS_CAPABILITIES.map((cap, i) => (
            <div key={i} className="capability-item">
              <div className="capability-icon"><cap.icon size={16} /></div>
              <div className="capability-text">
                <h4>{cap.title}</h4>
                <p>{cap.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <div className="upload-header">
          <h3>Upload Credit Reports</h3>
          <div className="tip-badge">
            <HelpCircle size={14} />
            Best results with all 3 bureaus
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={handleFileUpload} style={{ display: 'none' }} />

        <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
          <div className="upload-icon"><Upload size={28} /></div>
          <div style={{ fontSize: '15px', marginBottom: '8px' }}>Tap to upload credit reports</div>
          <div style={{ fontSize: '13px', color: '#71717a' }}>PDF files from Experian, Equifax, TransUnion</div>
        </div>

        {uploadedFiles.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            {uploadedFiles.map((file, i) => (
              <div key={i} className="file-item">
                <File size={18} style={{ color: '#d4a574' }} />
                <span className="file-name">{file.name}</span>
                <span className="file-size">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                <button className="file-remove" onClick={() => removeFile(i)}><X size={16} /></button>
              </div>
            ))}
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} onClick={analyzeReports} disabled={isAnalyzing}>
              {isAnalyzing ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</> : <><Search size={16} /> Analyze {uploadedFiles.length} Report{uploadedFiles.length > 1 ? 's' : ''}</>}
            </button>
          </div>
        )}

        {uploadedFiles.length === 0 && (
          <div className="no-reports-cta">
            <h4>Don't have your reports yet?</h4>
            <p>You're entitled to free credit reports from each bureau every week.</p>
            <div className="quick-links">
              <a href="https://www.annualcreditreport.com" target="_blank" rel="noopener noreferrer" className="quick-link">
                <FileText size={14} /> Get Free Reports <ExternalLink size={12} />
              </a>
              <a href="https://www.identitytheft.gov" target="_blank" rel="noopener noreferrer" className="quick-link">
                <Shield size={14} /> Report Identity Theft <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}
      </div>

      {analysisError && <div className="error-box"><AlertCircle size={18} />{analysisError}</div>}

      {/* Analysis Results */}
      {analysisResult && (
        <div style={{ marginTop: '24px' }}>
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-value">{analysisResult.summary?.totalAccounts || 0}</div>
              <div className="summary-label">Accounts</div>
            </div>
            <div className="summary-card">
              <div className="summary-value" style={{ color: '#f59e0b' }}>{analysisResult.summary?.potentialIssues || 0}</div>
              <div className="summary-label">Issues</div>
            </div>
            <div className="summary-card">
              <div className="summary-value" style={{ color: '#ef4444' }}>{analysisResult.summary?.highPriorityItems || 0}</div>
              <div className="summary-label">High Priority</div>
            </div>
          </div>

          {analysisResult.findings?.length > 0 && (
            <>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Findings</h3>
              {analysisResult.findings.map((finding, i) => {
                const isFlagged = flaggedItems.some(f => f.id === finding.id);
                return (
                  <div key={finding.id || i} className="finding-card" style={{ borderLeftColor: SEVERITY_COLORS[finding.severity] || '#71717a' }}>
                    <div className="finding-header">
                      <div>
                        <span className="severity-badge" style={{ background: `${SEVERITY_COLORS[finding.severity]}20`, color: SEVERITY_COLORS[finding.severity] }}>{finding.severity?.toUpperCase()}</span>
                        <span className="statute-tag" style={{ marginLeft: '8px' }}>{finding.statute}</span>
                      </div>
                      <button className={`flag-btn ${isFlagged ? 'flagged' : ''}`} onClick={() => toggleFlag(finding)}>
                        <Flag size={16} fill={isFlagged ? '#d4a574' : 'none'} />
                      </button>
                    </div>
                    <div className="finding-account">{finding.account}</div>
                    <div className="finding-issue">{finding.issue}</div>
                    <div style={{ fontSize: '13px', color: '#71717a' }}>Success: {finding.successLikelihood}</div>
                  </div>
                );
              })}
            </>
          )}

          {analysisResult.positiveFactors?.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#22c55e' }}>
                <CheckCircle2 size={18} style={{ display: 'inline', marginRight: '8px' }} />
                Positive Factors
              </h3>
              <div style={{ padding: '16px', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '8px' }}>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#a1a1aa', fontSize: '14px', lineHeight: '1.8' }}>
                  {analysisResult.positiveFactors.map((factor, i) => (
                    <li key={i}>{factor}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resources Section - Show when no files uploaded or after results */}
      {(showResources || analysisResult) && (
        <div className="resources-section" style={{ marginTop: analysisResult ? '32px' : '0' }}>
          <div className="resources-header" onClick={() => setShowResources(!showResources)}>
            <h3>
              <Building2 size={18} />
              Resources & Links
            </h3>
            <span>{showResources ? 'Hide' : 'Show'}</span>
          </div>

          {showResources && Object.entries(RESOURCES).map(([key, section]) => (
            <div key={key} className="resource-category">
              <div className="category-header" onClick={() => toggleSection(key)}>
                <div>
                  <div className="category-title">{section.title}</div>
                  <div className="category-desc">{section.description}</div>
                </div>
                {expandedSections[key] ? <ChevronDown size={18} color="#71717a" /> : <ChevronRight size={18} color="#71717a" />}
              </div>
              {expandedSections[key] && (
                <div className="category-links">
                  {section.links.map((link, i) => (
                    <a 
                      key={i} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={`resource-link ${link.primary ? 'primary' : ''} ${link.important ? 'important' : ''}`}
                    >
                      <div className="resource-info">
                        <span className="resource-name">{link.name}</span>
                        <span className="resource-desc">{link.description}</span>
                      </div>
                      <ExternalLink size={14} className="resource-arrow" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
