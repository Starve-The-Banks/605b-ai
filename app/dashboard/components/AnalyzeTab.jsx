"use client";

import { useState, useRef } from 'react';
import { Upload, File, X, Search, Loader2, AlertCircle, Flag } from 'lucide-react';
import { SEVERITY_COLORS } from '@/lib/constants';

export default function AnalyzeTab({ flaggedItems, setFlaggedItems, logAction }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const pdfFiles = files.filter(f => f.type === 'application/pdf');
    if (pdfFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...pdfFiles]);
      setAnalysisError(null);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
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

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analyze Reports</h1>
          <p className="page-subtitle">Upload credit reports to identify dispute opportunities</p>
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

      {analysisError && <div className="error-box"><AlertCircle size={18} />{analysisError}</div>}

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
        </div>
      )}
    </div>
  );
}
