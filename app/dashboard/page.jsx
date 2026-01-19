"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Upload, ExternalLink, AlertCircle, ChevronDown, ChevronUp,
  BookOpen, Shield, Scale, TrendingUp, AlertTriangle, CheckCircle, Clock,
  FileText, RefreshCw, Flag, Lock, Loader2, RotateCcw
} from 'lucide-react';
import { useFlaggedItems } from '@/lib/useUserData';
import { useUserTier } from '@/lib/useUserTier';
import { UsageLimitWarning } from './components/UpgradePrompt';
import Link from 'next/link';

export default function AnalyzePage() {
  const router = useRouter();
  const { flaggedItems, saveFindings, loading: flaggedLoading } = useFlaggedItems();
  const { tier, hasFeature, getUsageStats, recordUsage, loading: tierLoading } = useUserTier();
  const [resourcesExpanded, setResourcesExpanded] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check for existing analysis - prioritize server-synced flaggedItems
  const [hasExistingAnalysis, setHasExistingAnalysis] = useState(false);
  const [existingAnalysisMeta, setExistingAnalysisMeta] = useState(null);

  // Load localStorage metadata for fast initial display (UX convenience only)
  useEffect(() => {
    const savedMeta = localStorage.getItem('605b_analysis_meta');
    if (savedMeta) {
      try {
        const meta = JSON.parse(savedMeta);
        // Only use as initial state - will be updated by server data
        setExistingAnalysisMeta(meta);
        setHasExistingAnalysis(true);
      } catch (e) {
        console.error('Failed to parse analysis metadata:', e);
      }
    }
  }, []);

  // Server-synced flaggedItems are the authoritative source
  // Update stats when server data loads (overrides localStorage)
  useEffect(() => {
    if (!flaggedLoading) {
      if (flaggedItems.length > 0) {
        // Server has flagged items - this is authoritative
        const pendingItems = flaggedItems.filter(i => i.status === 'pending').length;
        const disputedItems = flaggedItems.filter(i => i.status === 'disputed').length;
        const serverMeta = {
          totalFindings: flaggedItems.length,
          pendingItems,
          disputedItems,
          analyzedAt: flaggedItems[0]?.createdAt || new Date().toISOString(),
        };
        setExistingAnalysisMeta(serverMeta);
        setHasExistingAnalysis(true);
        // Sync to localStorage for faster load next time
        localStorage.setItem('605b_analysis_meta', JSON.stringify(serverMeta));
      } else if (!localStorage.getItem('605b_analysis_meta')) {
        // No server data and no localStorage - no analysis exists
        setHasExistingAnalysis(false);
        setExistingAnalysisMeta(null);
      }
    }
  }, [flaggedItems, flaggedLoading]);

  // Get usage stats for PDF analyses
  const usageStats = getUsageStats();
  const pdfAnalysesRemaining = usageStats.pdfAnalyses?.remaining ?? 1;
  const canAnalyze = usageStats.pdfAnalyses?.isUnlimited || pdfAnalysesRemaining > 0;
  const canExport = hasFeature('analysisExport');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check if user can analyze
    if (!canAnalyze) {
      setError('You have reached your PDF analysis limit. Please upgrade to analyze more reports.');
      return;
    }
    
    setIsUploading(true);
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysisResult(data);

      // Record usage
      await recordUsage('analyze_pdf');

      // Save findings to flagged items if there are any
      if (data.analysis?.findings && data.analysis.findings.length > 0) {
        await saveFindings(data.analysis.findings);
      }

      // Persist analysis metadata for navigation persistence
      const analysisMeta = {
        totalFindings: data.analysis?.findings?.length || 0,
        pendingItems: data.analysis?.findings?.length || 0,
        disputedItems: 0,
        summary: data.analysis?.summary || {},
        filesProcessed: data.filesProcessed?.length || 0,
        analyzedAt: new Date().toISOString(),
      };
      localStorage.setItem('605b_analysis_meta', JSON.stringify(analysisMeta));
      setExistingAnalysisMeta(analysisMeta);
      setHasExistingAnalysis(true);

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message);
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
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
        <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 600, marginBottom: '4px' }}>Analyze Reports</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>AI-powered analysis identifies disputes, fraud, and violations</p>
      </div>

      {/* Analysis Result */}
      {analysisResult && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid #22c55e',
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CheckCircle size={20} style={{ color: '#22c55e' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Analysis Complete</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {analysisResult.filesProcessed?.length || 0} file(s) processed
              </p>
            </div>
          </div>

          {/* Summary */}
          {analysisResult.analysis?.summary && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: '12px',
              marginBottom: '16px',
            }}>
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Accounts</div>
                <div style={{ fontSize: '20px', fontWeight: 600 }}>{analysisResult.analysis.summary.totalAccounts || 0}</div>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Potential Issues</div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--orange)' }}>{analysisResult.analysis.summary.potentialIssues || 0}</div>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>High Priority</div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#ef4444' }}>{analysisResult.analysis.summary.highPriorityItems || 0}</div>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Assessment</div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{analysisResult.analysis.summary.overallAssessment || 'N/A'}</div>
              </div>
            </div>
          )}

          {/* Action Button */}
          {analysisResult.analysis?.findings?.length > 0 && (
            <button
              onClick={() => router.push('/dashboard/flagged')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'var(--orange)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Flag size={18} />
              View {analysisResult.analysis.findings.length} Flagged Items
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#ef4444' }}>Analysis Failed</div>
            <div style={{ fontSize: '13px', color: '#a1a1aa' }}>{error}</div>
          </div>
        </div>
      )}

      {/* Existing Analysis - Show when user has existing flagged items */}
      {hasExistingAnalysis && !analysisResult && existingAnalysisMeta && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid #3b82f6',
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FileText size={20} style={{ color: '#3b82f6' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Previous Analysis Available</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Analyzed {existingAnalysisMeta.analyzedAt ? new Date(existingAnalysisMeta.analyzedAt).toLocaleDateString() : 'recently'}
              </p>
            </div>
          </div>

          {/* Summary stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '16px',
          }}>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Flagged</div>
              <div style={{ fontSize: '20px', fontWeight: 600 }}>{existingAnalysisMeta.totalFindings || flaggedItems.length}</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Pending</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--orange)' }}>
                {existingAnalysisMeta.pendingItems ?? flaggedItems.filter(i => i.status === 'pending').length}
              </div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Disputed</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#22c55e' }}>
                {existingAnalysisMeta.disputedItems ?? flaggedItems.filter(i => i.status === 'disputed').length}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/dashboard/flagged')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'var(--orange)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Flag size={18} />
              View Flagged Items
            </button>
            <button
              onClick={() => {
                setHasExistingAnalysis(false);
                setExistingAnalysisMeta(null);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={16} />
              New Analysis
            </button>
          </div>
        </div>
      )}

      {/* Comprehensive Credit Analysis */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'var(--orange-dim)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--orange)',
            flexShrink: 0
          }}>
            <Shield size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Comprehensive Credit Analysis</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Upload your credit reports and our AI will scan for inaccuracies, identity theft markers,
              outdated accounts, and FCRA violations. Each finding is mapped to the relevant statute
              and prioritized by likelihood of successful dispute.
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
          {analysisFeatures.map((feature, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '10px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'var(--orange-dim)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--orange)',
                flexShrink: 0
              }}>
                <feature.icon size={16} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>{feature.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{feature.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Section */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Upload Credit Reports</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Usage indicator */}
            {!usageStats.pdfAnalyses?.isUnlimited && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: pdfAnalysesRemaining > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${pdfAnalysesRemaining > 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                borderRadius: '100px',
                fontSize: '12px',
                color: pdfAnalysesRemaining > 0 ? '#22c55e' : '#ef4444'
              }}>
                {pdfAnalysesRemaining > 0 ? (
                  <>{pdfAnalysesRemaining} analysis{pdfAnalysesRemaining !== 1 ? 'es' : ''} remaining</>
                ) : (
                  <>No analyses remaining</>
                )}
              </div>
            )}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'var(--orange-dim)',
              border: '1px solid rgba(255, 107, 53, 0.2)',
              borderRadius: '100px',
              fontSize: '12px',
              color: 'var(--orange)'
            }}>
              <CheckCircle size={14} />
              Best results with all 3 bureaus
            </div>
          </div>
        </div>

        {canAnalyze ? (
          <label style={{
            display: 'block',
            border: isAnalyzing ? '2px solid var(--orange)' : '2px dashed var(--border)',
            borderRadius: '12px',
            padding: isMobile ? '32px 16px' : '48px 24px',
            textAlign: 'center',
            cursor: isAnalyzing ? 'not-allowed' : 'pointer',
            opacity: isAnalyzing ? 0.7 : 1,
            transition: 'all 0.2s',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--orange)'
            }}>
              {isAnalyzing ? (
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Upload size={24} />
              )}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>
              {isAnalyzing ? 'Analyzing your reports...' : 'Tap to upload credit reports'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {isAnalyzing ? 'This may take a minute' : 'PDF files from Experian, Equifax, TransUnion'}
            </div>
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileUpload}
              disabled={isAnalyzing}
              style={{ display: 'none' }}
            />
          </label>
        ) : (
          <div style={{
            border: '2px dashed var(--border)',
            borderRadius: '12px',
            padding: isMobile ? '32px 16px' : '48px 24px',
            textAlign: 'center',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'rgba(113, 113, 122, 0.1)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--text-muted)'
            }}>
              <Lock size={24} />
            </div>
            <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>
              Analysis Limit Reached
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Upgrade your plan to analyze more credit reports
            </div>
            <Link
              href="/pricing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'var(--orange)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Upgrade Plan
            </Link>
          </div>
        )}
      </div>

      {/* Don't have reports */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px 24px', textAlign: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>Don't have your reports yet?</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>You're entitled to free credit reports from each bureau every week.</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="https://www.annualcreditreport.com" target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            textDecoration: 'none',
            background: 'var(--orange-dim)',
            border: '1px solid rgba(255, 107, 53, 0.3)',
            color: 'var(--orange)'
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
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            color: 'var(--text)'
          }}>
            <Shield size={16} />
            Report Identity Theft
          </a>
        </div>
      </div>

      {/* Resources Section */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div
          onClick={() => setResourcesExpanded(!resourcesExpanded)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={18} style={{ color: 'var(--orange)' }} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Resources & Links</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {resourcesExpanded ? 'Hide' : 'Show'}
            {resourcesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {resourcesExpanded && (
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Get Your Credit Reports</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>You're entitled to free reports from each bureau every week.</p>
              {creditReportLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  textDecoration: 'none',
                  color: 'inherit'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--orange)', marginBottom: '2px' }}>{link.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{link.desc}</div>
                  </div>
                  <ExternalLink size={16} style={{ color: 'var(--text-muted)' }} />
                </a>
              ))}
            </div>

            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Specialty Consumer Agencies</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>These agencies track banking, insurance, and other data.</p>
              {specialtyAgencies.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  textDecoration: 'none',
                  color: 'inherit'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--orange)', marginBottom: '2px' }}>{link.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{link.desc}</div>
                  </div>
                  <ExternalLink size={16} style={{ color: 'var(--text-muted)' }} />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
