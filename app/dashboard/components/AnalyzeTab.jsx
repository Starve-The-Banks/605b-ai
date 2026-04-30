"use client";

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Upload, FileText, AlertTriangle, CheckCircle, Loader2, X, ExternalLink } from 'lucide-react';
import {
  pickNewerSnapshot,
  loadServerAnalyzeSnapshot,
  saveServerAnalyzeSnapshot,
  clearServerAnalyzeSnapshot,
} from '@/lib/analyzeSnapshotSync';

const analyzeStorageKey = (userId) => (userId ? `605b_analyze_snapshot_${userId}` : '605b_analyze_snapshot_guest');

export default function AnalyzeTab({ logAction, addFlaggedItem }) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [files, setFiles] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [flaggedIssueId, setFlaggedIssueId] = useState(null);
  const [restoredNotice, setRestoredNotice] = useState(false);
  /** 'browser' | 'account' — where the winning summary came from */
  const [restoreSource, setRestoreSource] = useState(null);

  const storageKey = useMemo(() => analyzeStorageKey(user?.id), [user?.id]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    let cancelled = false;

    (async () => {
      let localParsed = null;
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) localParsed = JSON.parse(raw);
      } catch {
        /* ignore */
      }

      let serverSnap = null;
      if (user?.id) {
        serverSnap = await loadServerAnalyzeSnapshot();
      }
      if (cancelled) return;

      const picked = pickNewerSnapshot(localParsed, serverSnap);
      if (!picked?.results) return;

      const { _source, results: r, filesMeta, savedAt } = picked;
      setResults(r);
      setRestoredNotice(true);
      setRestoreSource(_source === 'server' ? 'account' : 'browser');

      const normalized = { results: r, filesMeta: filesMeta || [], savedAt: savedAt || new Date().toISOString() };
      try {
        localStorage.setItem(storageKey, JSON.stringify(normalized));
      } catch {
        /* quota */
      }

      if (user?.id && _source === 'local') {
        void saveServerAnalyzeSnapshot(normalized);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, storageKey, user?.id]);

  const persistSnapshot = useCallback(
    (nextResults, nextFiles) => {
      if (typeof window === 'undefined') return;
      const payload = {
        results: nextResults,
        filesMeta: (nextFiles || []).map((f) => ({
          name: f.name,
          size: f.size,
          lastModified: f.lastModified,
        })),
        savedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch {
        /* quota */
      }
      if (user?.id) {
        void saveServerAnalyzeSnapshot(payload);
      }
    },
    [storageKey, user?.id]
  );

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      f => f.type === 'application/pdf' || f.name.endsWith('.pdf')
    );
    
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toSeverity = (category = '') => {
    if (category === 'high_priority_issue') return 'high';
    if (category === 'potential_issue') return 'medium';
    return 'low';
  };

  const mapAnalysisToDashboard = (analysis) => {
    const extracted = analysis?.extracted || {};
    const findings = Array.isArray(analysis?.findings) ? analysis.findings : [];
    const issues = findings.map((finding, index) => ({
      id: finding.id || `finding-${index}`,
      severity: toSeverity(finding.category),
      title: finding.issue || finding.account || finding?.operationalGuidance?.title || 'Potential issue',
      description: finding.reason || finding.reasoning || finding.evidence_quote || 'Review this item for accuracy.',
      bureau: finding.bureau || finding.source || 'Report',
      recommendation:
        finding.recommendation ||
        finding?.operationalGuidance?.message ||
        'Review details and prepare a dispute draft if this information is inaccurate.',
    }));

    return {
      summary: {
        totalAccounts: Array.isArray(extracted.accounts) ? extracted.accounts.length : 0,
        negativeItems: issues.filter((issue) => issue.severity === 'high' || issue.severity === 'medium').length,
        inquiries: Array.isArray(extracted.inquiries) ? extracted.inquiries.length : 0,
        collections: Array.isArray(extracted.collections) ? extracted.collections.length : 0,
      },
      issues,
    };
  };

  const analyzeReports = async () => {
    if (files.length === 0) return;

    setAnalyzing(true);
    logAction?.('ANALYZE_STARTED', { fileCount: files.length });

    try {
      const formData = new FormData();
      // Current backend contract accepts one file under `files`.
      formData.append('files', files[0]);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        const message =
          payload?.error?.message ||
          payload?.error ||
          'Analysis could not be completed. Please try again.';
        throw new Error(message);
      }

      const mappedResults = mapAnalysisToDashboard(payload.analysis);
      setResults(mappedResults);
      logAction?.('ANALYZE_COMPLETED', {
        issuesFound: mappedResults.issues.length,
        analysisId: payload.analysisId || null,
      });
      persistSnapshot(mappedResults, files);
    } catch (err) {
      console.error('[AnalyzeTab] analysis failed:', err);
      logAction?.('ANALYZE_FAILED', { message: err?.message || 'Unknown error' });
      if (typeof window !== 'undefined') {
        window.alert(err?.message || 'Analysis could not be completed. Please try again.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const flagItem = (issue) => {
    addFlaggedItem?.({
      type: 'credit_issue',
      severity: issue.severity,
      title: issue.title,
      description: issue.description,
      bureau: issue.bureau,
      recommendation: issue.recommendation
    });
    setFlaggedIssueId(issue.id);
    window.setTimeout(() => setFlaggedIssueId((id) => (id === issue.id ? null : id)), 4000);
  };

  const clearSnapshot = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    if (user?.id) {
      void clearServerAnalyzeSnapshot();
    }
    setRestoredNotice(false);
    setRestoreSource(null);
  }, [storageKey, user?.id]);

  return (
    <>
      <style jsx>{`
        .analyze-container {
          padding: 28px;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .section {
          margin-bottom: 32px;
        }
        
        .section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        
        .section-title {
          font-size: 11px;
          font-weight: 700;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }
        
        .section-title::before {
          content: '';
          display: inline-block;
          width: 8px;
          height: 8px;
          background: var(--accent);
          border-radius: 2px;
          margin-right: 10px;
          box-shadow: 0 0 12px var(--accent-glow);
        }
        
        .upload-zone {
          border: 2px dashed var(--border-default);
          border-radius: 16px;
          padding: 48px 32px;
          text-align: center;
          background: var(--bg-card);
          transition: all 0.2s;
          cursor: pointer;
        }
        
        .upload-zone:hover,
        .upload-zone.drag-active {
          border-color: var(--accent);
          background: var(--accent-subtle);
        }
        
        .upload-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 20px;
          background: linear-gradient(135deg, var(--accent-dim) 0%, var(--accent-subtle) 100%);
          border: 1px solid var(--border-accent);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
        }
        
        .upload-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        
        .upload-desc {
          font-size: 14px;
          color: var(--text-muted);
          margin-bottom: 20px;
        }
        
        .upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, var(--accent) 0%, #E55A2B 100%);
          color: var(--bg-deep);
          font-weight: 600;
          border-radius: 10px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
        }
        
        .upload-btn:hover {
          box-shadow: 0 4px 20px var(--accent-glow);
          transform: translateY(-2px);
        }
        
        .file-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 20px;
        }
        
        .file-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
        }
        
        .file-icon {
          width: 40px;
          height: 40px;
          background: var(--accent-dim);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
        }
        
        .file-info {
          flex: 1;
          min-width: 0;
        }
        
        .file-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .file-size {
          font-size: 12px;
          color: var(--text-muted);
        }
        
        .file-remove {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }

        .file-remove:hover, .file-remove:active {
          background: rgba(248, 113, 113, 0.1);
          color: var(--danger);
        }
        
        .analyze-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, var(--accent) 0%, #E55A2B 100%);
          color: var(--bg-deep);
          font-weight: 600;
          font-size: 15px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s;
          margin-top: 20px;
        }
        
        .analyze-btn:hover:not(:disabled) {
          box-shadow: 0 4px 24px var(--accent-glow);
          transform: translateY(-2px);
        }
        
        .analyze-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .results-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        
        .summary-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }
        
        .summary-value {
          font-size: 32px;
          font-weight: 700;
          color: var(--text-primary);
          font-family: 'JetBrains Mono', monospace;
          margin-bottom: 4px;
        }
        
        .summary-value.warning {
          color: var(--warning);
        }
        
        .summary-value.danger {
          color: var(--danger);
        }
        
        .summary-label {
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .issues-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .issue-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          padding: 20px;
          transition: all 0.15s;
        }
        
        .issue-card:hover {
          border-color: var(--border-default);
        }
        
        .issue-card.high {
          border-left: 3px solid var(--danger);
        }
        
        .issue-card.medium {
          border-left: 3px solid var(--warning);
        }
        
        .issue-card.low {
          border-left: 3px solid var(--info);
        }
        
        .issue-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .issue-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .issue-card.high .issue-icon {
          background: rgba(248, 113, 113, 0.15);
          color: var(--danger);
        }
        
        .issue-card.medium .issue-icon {
          background: rgba(251, 146, 60, 0.15);
          color: var(--warning);
        }
        
        .issue-card.low .issue-icon {
          background: rgba(96, 165, 250, 0.15);
          color: var(--info);
        }
        
        .issue-meta {
          flex: 1;
        }
        
        .issue-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        
        .issue-bureau {
          font-size: 12px;
          color: var(--text-muted);
        }
        
        .issue-severity {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .issue-card.high .issue-severity {
          background: rgba(248, 113, 113, 0.15);
          color: var(--danger);
        }
        
        .issue-card.medium .issue-severity {
          background: rgba(251, 146, 60, 0.15);
          color: var(--warning);
        }
        
        .issue-card.low .issue-severity {
          background: rgba(96, 165, 250, 0.15);
          color: var(--info);
        }
        
        .issue-desc {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 12px;
        }
        
        .issue-recommendation {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: var(--bg-elevated);
          border-radius: 8px;
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }
        
        .issue-recommendation strong {
          color: var(--accent);
        }
        
        .issue-actions {
          display: flex;
          gap: 10px;
        }
        
        .issue-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
        }
        
        .issue-btn.primary {
          background: linear-gradient(135deg, var(--accent-dim) 0%, var(--accent-subtle) 100%);
          border: 1px solid var(--accent);
          color: var(--accent);
        }
        
        .issue-btn.primary:hover {
          background: var(--accent);
          color: var(--bg-deep);
        }
        
        .issue-btn.secondary {
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
        }
        
        .issue-btn.secondary:hover {
          border-color: var(--border-default);
          color: var(--text-primary);
        }
        
        .help-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 0.15s;
        }
        
        .help-link:hover {
          border-color: var(--accent);
          color: var(--text-primary);
        }
        
        .help-link-icon {
          width: 44px;
          height: 44px;
          background: var(--accent-dim);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
        }
        
        .help-link-content {
          flex: 1;
        }
        
        .help-link-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        
        .help-link-desc {
          font-size: 13px;
          color: var(--text-muted);
        }
        
        @media (max-width: 768px) {
          .analyze-container {
            padding: 20px 16px;
          }

          .results-summary {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .upload-zone {
            padding: 32px 20px;
          }

          .issue-actions {
            flex-direction: column;
          }

          .issue-btn {
            width: 100%;
            justify-content: center;
            min-height: 44px;
          }

          .summary-value {
            font-size: 24px;
          }

          .section-title {
            font-size: 10px;
          }
        }

        @media (max-width: 480px) {
          .results-summary {
            grid-template-columns: 1fr;
          }

          .issue-header {
            flex-wrap: wrap;
          }

          .issue-severity {
            margin-top: 8px;
          }
        }
      `}</style>

      <div className="analyze-container">
        {restoredNotice && results && (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 14px',
              borderRadius: 10,
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              fontSize: 13,
              color: 'var(--text-secondary, #a1a1aa)',
            }}
          >
            {restoreSource === 'account'
              ? 'Restored your last analysis summary from your account. Original PDF files are never uploaded to our servers—you only have the issue list here. Upload PDFs again to run a new analysis.'
              : 'Restored your last analysis summary from this browser. PDFs are not stored on our servers; only the issue summary is saved (and synced to your account when signed in). Upload PDFs again to re-run analysis.'}{' '}
            <button
              type="button"
              onClick={() => {
                clearSnapshot();
                setResults(null);
                setFiles([]);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--orange, #FF6B35)',
                cursor: 'pointer',
                fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              Clear saved analysis
            </button>
          </div>
        )}
        {!results ? (
          <>
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">Upload Credit Reports</h2>
              </div>
              
              <div 
                className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    document.getElementById('file-input')?.click();
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="upload-icon">
                  <Upload size={28} />
                </div>
                <h3 className="upload-title">Drop your credit reports here</h3>
                <p className="upload-desc">
                  Upload PDF reports from Experian, TransUnion, or Equifax
                </p>
                <button
                  type="button"
                  className="upload-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById('file-input')?.click();
                  }}
                >
                  <Upload size={18} />
                  Choose Files
                </button>
                <input 
                  id="file-input"
                  type="file" 
                  accept=".pdf"
                  multiple
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
              </div>
              
              {files.length > 0 && (
                <div className="file-list">
                  {files.map((file, i) => (
                    <div key={i} className="file-item">
                      <div className="file-icon">
                        <FileText size={20} />
                      </div>
                      <div className="file-info">
                        <div className="file-name">{file.name}</div>
                        <div className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                      <button type="button" className="file-remove" onClick={() => removeFile(i)}>
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                  
                  <button 
                    type="button"
                    className="analyze-btn"
                    onClick={analyzeReports}
                    disabled={analyzing}
                  >
                    {analyzing ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Analyzing Reports...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        Analyze {files.length} Report{files.length > 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              )}
            </section>
            
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">Need Your Reports?</h2>
              </div>
              
              <a 
                href="https://www.annualcreditreport.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="help-link"
              >
                <div className="help-link-icon">
                  <ExternalLink size={20} />
                </div>
                <div className="help-link-content">
                  <div className="help-link-title">Get Free Reports from AnnualCreditReport.com</div>
                  <div className="help-link-desc">The only official source for free weekly credit reports from all 3 bureaus</div>
                </div>
              </a>
            </section>
          </>
        ) : (
          <>
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">Analysis Summary</h2>
              </div>
              
              <div className="results-summary">
                <div className="summary-card">
                  <div className="summary-value">{results.summary.totalAccounts}</div>
                  <div className="summary-label">Total Accounts</div>
                </div>
                <div className="summary-card">
                  <div className="summary-value danger">{results.summary.negativeItems}</div>
                  <div className="summary-label">Negative Items</div>
                </div>
                <div className="summary-card">
                  <div className="summary-value warning">{results.summary.collections}</div>
                  <div className="summary-label">Collections</div>
                </div>
                <div className="summary-card">
                  <div className="summary-value">{results.summary.inquiries}</div>
                  <div className="summary-label">Inquiries</div>
                </div>
              </div>
            </section>
            
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">Issues Found ({results.issues.length})</h2>
              </div>
              
              <div className="issues-list">
                {results.issues.map(issue => (
                  <div key={issue.id} className={`issue-card ${issue.severity}`}>
                    <div className="issue-header">
                      <div className="issue-icon">
                        <AlertTriangle size={18} />
                      </div>
                      <div className="issue-meta">
                        <div className="issue-title">{issue.title}</div>
                        <div className="issue-bureau">{issue.bureau}</div>
                      </div>
                      <span className="issue-severity">{issue.severity}</span>
                    </div>
                    
                    <p className="issue-desc">{issue.description}</p>
                    
                    <div className="issue-recommendation">
                      <strong>Recommendation:</strong> {issue.recommendation}
                    </div>
                    
                    <div className="issue-actions">
                      <button
                        type="button"
                        className="issue-btn primary"
                        onClick={() => flagItem(issue)}
                      >
                        Flag for Action
                      </button>
                      <button
                        type="button"
                        className="issue-btn secondary"
                        onClick={() => {
                          logAction?.('GENERATE_LETTER_CLICK', { issueId: issue.id, title: issue.title });
                          router.push('/dashboard/templates');
                        }}
                      >
                        Generate Letter
                      </button>
                    </div>
                    {flaggedIssueId === issue.id && (
                      <p style={{ marginTop: 10, fontSize: 13, color: '#22c55e' }}>
                        Saved to Flagged —{' '}
                        <Link href="/dashboard/flagged" style={{ color: 'var(--orange, #FF6B35)', fontWeight: 600 }}>
                          open Flagged
                        </Link>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
            
            <button 
              type="button"
              className="analyze-btn"
              onClick={() => {
                setResults(null);
                setFiles([]);
                clearSnapshot();
              }}
              style={{ marginTop: 0 }}
            >
              Analyze More Reports
            </button>
          </>
        )}
      </div>
    </>
  );
}
