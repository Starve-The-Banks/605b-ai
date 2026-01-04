"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  MessageSquare, 
  Calendar, 
  FileText, 
  ChevronRight,
  ChevronDown,
  Send,
  Plus,
  Download,
  ExternalLink,
  Clock,
  AlertCircle,
  CheckCircle2,
  Scale,
  Building2,
  Shield,
  FileWarning,
  ArrowUpRight,
  X,
  Copy,
  Loader2,
  Upload,
  File,
  AlertTriangle,
  Check,
  Flag,
  Search,
  Trash2
} from 'lucide-react';

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are 605b.ai, an expert credit repair assistant specializing in identity theft recovery and consumer protection law.

CORE EXPERTISE:
- FCRA §605B: Identity theft block demands (4 business day response required)
- FCRA §611: Standard dispute process (30 day investigation window)  
- FCRA §609: Disclosure requests (method of verification)
- FDCPA §809: Debt validation requests (30 days to request)
- FCRA §623: Furnisher responsibilities and direct disputes
- State consumer protection laws

CREDIT BUREAUS:
- Experian: PO Box 4500, Allen, TX 75013 | 888-397-3742
- Equifax: PO Box 740256, Atlanta, GA 30374 | 800-846-5279
- TransUnion: PO Box 2000, Chester, PA 19016 | 800-916-8800

SPECIALTY AGENCIES:
- ChexSystems: 7805 Hudson Rd, Woodbury, MN 55125 | 800-428-9623
- Early Warning Services: 16552 N 90th St, Scottsdale, AZ 85260 | 800-325-7775
- LexisNexis: PO Box 105108, Atlanta, GA 30348 | 888-497-0011

STYLE: Be direct and professional. Cite specific statutes. Give concrete next steps.`;

// ============================================================================
// TEMPLATE DATA
// ============================================================================

const TEMPLATES = {
  identity_theft: {
    category: "Identity Theft",
    icon: Shield,
    templates: [
      { id: "605b_bureau", name: "§605B Identity Theft Block", description: "Demand bureaus block fraudulent accounts within 4 business days", deadline: "4 business days" },
      { id: "605b_furnisher", name: "§605B Direct to Furnisher", description: "Send block demand directly to the creditor/furnisher", deadline: "4 business days" },
      { id: "ftc_affidavit", name: "FTC Identity Theft Report", description: "Official identity theft affidavit", deadline: "N/A", external: "https://www.identitytheft.gov/" },
    ]
  },
  disputes: {
    category: "Credit Disputes",
    icon: FileWarning,
    templates: [
      { id: "611_dispute", name: "§611 Standard Dispute", description: "Challenge inaccurate information on your credit report", deadline: "30 days" },
      { id: "609_disclosure", name: "§609 Method of Verification", description: "Request proof of how disputed info was verified", deadline: "15 days" },
      { id: "623_direct", name: "§623 Direct Furnisher Dispute", description: "Dispute directly with the company reporting the info", deadline: "30 days" },
    ]
  },
  debt_collection: {
    category: "Debt Collection",
    icon: AlertTriangle,
    templates: [
      { id: "809_validation", name: "§809 Debt Validation", description: "Demand collector prove the debt is valid", deadline: "30 days" },
      { id: "cease_desist", name: "Cease & Desist Letter", description: "Demand collector stop contacting you", deadline: "Immediate" },
      { id: "pay_delete", name: "Pay for Delete Request", description: "Offer payment in exchange for removal", deadline: "Negotiable" },
    ]
  },
  specialty: {
    category: "Specialty Agencies",
    icon: Building2,
    templates: [
      { id: "chex_dispute", name: "ChexSystems Dispute", description: "Dispute banking history errors", deadline: "30 days" },
      { id: "ews_dispute", name: "Early Warning Dispute", description: "Dispute EWS records", deadline: "30 days" },
      { id: "lexis_dispute", name: "LexisNexis Dispute", description: "Dispute public records, address history", deadline: "30 days" },
    ]
  },
  escalation: {
    category: "Escalation",
    icon: Scale,
    templates: [
      { id: "cfpb_complaint", name: "CFPB Complaint", description: "File with Consumer Financial Protection Bureau", deadline: "15-60 days", external: "https://www.consumerfinance.gov/complaint/" },
      { id: "state_ag", name: "State Attorney General", description: "File with your state's AG consumer protection", deadline: "Varies" },
      { id: "intent_to_sue", name: "Intent to Sue Letter", description: "Final demand before litigation", deadline: "15-30 days" },
    ]
  },
};

// ============================================================================
// LETTER CONTENT
// ============================================================================

const LETTER_CONTENT = {
  "605b_bureau": (info) => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

[BUREAU NAME]
[BUREAU ADDRESS]

Re: Identity Theft Block Request Pursuant to FCRA §605B
SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

I am a victim of identity theft. Pursuant to the Fair Credit Reporting Act, 15 U.S.C. § 1681c-2 (Section 605B), I am requesting that you block the following fraudulent information from my credit report within four (4) business days of receipt of this letter.

FRAUDULENT ACCOUNTS TO BE BLOCKED:
${info?.accounts || '[ACCOUNT NAME] - Account #[XXXX] - Opened [DATE]'}

I have enclosed:
□ Copy of FTC Identity Theft Report
□ Copy of government-issued photo ID
□ Proof of address

Under 15 U.S.C. § 1681c-2(a), you must block this information within four (4) business days. Failure to comply may result in civil liability under 15 U.S.C. § 1681n (willful noncompliance) including statutory damages of $100 to $1,000 per violation.

Sincerely,

______________________________
[YOUR NAME]`,

  "611_dispute": (info) => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

[BUREAU NAME]
[BUREAU ADDRESS]

Re: Dispute of Inaccurate Information - FCRA §611
SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

Pursuant to FCRA §611, I am disputing the following inaccurate information:

ITEMS DISPUTED:
${info?.accounts || 'Creditor: [CREDITOR NAME]\nAccount Number: [XXXX]\nReason: [REASON]'}

Under §611(a)(1)(A), you must conduct a reasonable investigation within 30 days. Under §611(a)(5)(A), if the information is inaccurate or unverifiable, you must delete or modify it.

Please send me an updated copy of my credit report upon completion.

Sincerely,

______________________________
[YOUR NAME]`,

  "809_validation": (info) => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

[COLLECTION AGENCY NAME]
[ADDRESS]

Re: Debt Validation Request - FDCPA §809
Reference: [ACCOUNT NUMBER]

To Whom It May Concern:

I am requesting validation of this alleged debt pursuant to FDCPA §809. Please provide:

1. The amount of the debt and how it was calculated
2. The name and address of the original creditor
3. A copy of the original signed contract
4. Proof you are licensed to collect in [STATE]
5. Complete payment history

Under §809(b), you must cease collection until validation is provided. Violations may result in statutory damages under 15 U.S.C. § 1692k.

Sincerely,

______________________________
[YOUR NAME]

SENT VIA CERTIFIED MAIL`,

  "cease_desist": () => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[YOUR NAME]
[YOUR ADDRESS]

[COLLECTION AGENCY]
[ADDRESS]

Re: Cease and Desist - FDCPA §805(c)

Pursuant to FDCPA §805(c), I demand you cease all communication regarding this matter.

You may only contact me to:
(1) Advise collection efforts are terminated
(2) Notify me of specific remedies you may invoke

Further communication will be considered a violation.

______________________________
[YOUR NAME]`,

  "chex_dispute": () => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[YOUR NAME]
[YOUR ADDRESS]

ChexSystems, Inc.
7805 Hudson Road, Suite 100
Woodbury, MN 55125

Re: Dispute of ChexSystems Information
SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

I am disputing inaccurate information in my ChexSystems report pursuant to FCRA §611.

DISPUTED ITEM:
Bank: [BANK NAME]
Reason: [REASON FOR DISPUTE]

Please investigate within 30 days and provide written results.

______________________________
[YOUR NAME]`,
};

// Default letter for templates without specific content
const getLetterContent = (templateId, info) => {
  if (LETTER_CONTENT[templateId]) {
    return LETTER_CONTENT[templateId](info);
  }
  return `[Letter template for ${templateId}]\n\nCustomize this template with your specific information.`;
};

// ============================================================================
// HOOKS
// ============================================================================

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initial;
    } catch { return initial; }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);

  return [value, setValue];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Dashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('analyze');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [disputes, setDisputes] = useLocalStorage('605b_disputes', []);
  const [auditLog, setAuditLog] = useLocalStorage('605b_audit', []);
  const [flaggedItems, setFlaggedItems] = useLocalStorage('605b_flagged', []);
  
  // Analysis state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  
  // Template state
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [generatedLetter, setGeneratedLetter] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const logAction = useCallback((action, details) => {
    setAuditLog(prev => [{
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action,
      details
    }, ...prev]);
  }, [setAuditLog]);

  // File upload handler
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

  // Analyze reports
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
      logAction('REPORTS_ANALYZED', { 
        filesCount: uploadedFiles.length,
        issuesFound: data.analysis?.findings?.length || 0 
      });
    } catch (err) {
      console.error('Analysis error:', err);
      setAnalysisError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle flag on finding
  const toggleFlag = (finding) => {
    const exists = flaggedItems.find(f => f.id === finding.id);
    if (exists) {
      setFlaggedItems(prev => prev.filter(f => f.id !== finding.id));
    } else {
      setFlaggedItems(prev => [...prev, { ...finding, flaggedAt: new Date().toISOString() }]);
      logAction('ITEM_FLAGGED', { account: finding.account, issue: finding.issue });
    }
  };

  // Create dispute from flagged item
  const createDisputeFromFlagged = (item) => {
    const newDispute = {
      id: Date.now(),
      agency: 'TBD',
      type: item.statute?.includes('605B') ? '605B' : '611',
      account: item.account,
      issue: item.issue,
      createdAt: new Date().toISOString(),
      deadline: calculateDeadline(item.statute?.includes('605B') ? '605B' : '611'),
      status: 'pending'
    };
    setDisputes(prev => [newDispute, ...prev]);
    logAction('DISPUTE_CREATED_FROM_FLAG', { account: item.account });
  };

  // Send chat message
  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    
    setInputValue('');
    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          systemPrompt: SYSTEM_PROMPT
        }),
      });

      if (!response.ok) throw new Error(await response.text());

      const text = await response.text();
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: text }]);
      logAction('AI_CHAT', { query: text.substring(0, 50) });
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Error: ${err.message}`,
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize chat
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 1,
        role: 'assistant',
        content: `Welcome to 605b.ai. I help with credit disputes and identity theft recovery.

I can help with:
• Identity theft recovery — §605B blocks, FTC reports
• Credit disputes — §611 disputes, verification requests
• Debt collection — §809 validation, cease & desist
• Escalation — CFPB complaints, attorney referrals

What's your situation?`
      }]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const calculateDeadline = (type) => {
    const now = new Date();
    const days = type === '605B' ? 4 : 30;
    let count = 0;
    while (count < days) {
      now.setDate(now.getDate() + 1);
      if (now.getDay() !== 0 && now.getDay() !== 6) count++;
    }
    return now.toISOString();
  };

  const getDaysRemaining = (deadline) => Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const severityColor = {
    high: '#ef4444',
    medium: '#f59e0b', 
    low: '#22c55e'
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <Link href="/" style={styles.logo}>605b<span style={{ color: '#d4a574' }}>.ai</span></Link>
        </div>
        
        <nav style={styles.nav}>
          {[
            { id: 'analyze', icon: Search, label: 'Analyze Reports' },
            { id: 'chat', icon: MessageSquare, label: 'Chat' },
            { id: 'templates', icon: FileText, label: 'Templates' },
            { id: 'tracker', icon: Calendar, label: 'Tracker', badge: disputes.length },
            { id: 'flagged', icon: Flag, label: 'Flagged Items', badge: flaggedItems.length },
            { id: 'audit', icon: FileWarning, label: 'Audit Log' },
          ].map(item => (
            <button 
              key={item.id}
              style={{...styles.navItem, ...(activeTab === item.id ? styles.navItemActive : {})}}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.badge > 0 && <span style={styles.badge}>{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div style={styles.sidebarSection}>
          <div style={styles.sectionLabel}>Quick Links</div>
          <a href="https://www.identitytheft.gov/" target="_blank" rel="noopener noreferrer" style={styles.quickLink}>
            <Shield size={14} /><span>FTC Report</span><ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />
          </a>
          <a href="https://www.annualcreditreport.com/" target="_blank" rel="noopener noreferrer" style={styles.quickLink}>
            <FileText size={14} /><span>Free Credit Reports</span><ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />
          </a>
        </div>

        <div style={styles.sidebarFooter}>
          <UserButton afterSignOutUrl="/" />
          <div style={styles.userName}>{user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User'}</div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        
        {/* ANALYZE TAB */}
        {activeTab === 'analyze' && (
          <div style={styles.analyzeContainer}>
            <div style={styles.pageHeader}>
              <div>
                <h1 style={styles.pageTitle}>Analyze Credit Reports</h1>
                <p style={styles.pageSubtitle}>Upload your credit reports and let AI identify errors, inconsistencies, and dispute opportunities</p>
              </div>
            </div>

            {/* Upload Section */}
            <div style={styles.uploadSection}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              
              <div 
                style={styles.uploadZone}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
                  if (files.length) setUploadedFiles(prev => [...prev, ...files]);
                }}
              >
                <Upload size={32} style={{ color: '#d4a574', marginBottom: '12px' }} />
                <div style={styles.uploadText}>Drop credit report PDFs here or click to browse</div>
                <div style={styles.uploadHint}>Supports Experian, Equifax, TransUnion reports</div>
              </div>

              {uploadedFiles.length > 0 && (
                <div style={styles.fileList}>
                  {uploadedFiles.map((file, i) => (
                    <div key={i} style={styles.fileItem}>
                      <File size={16} style={{ color: '#d4a574' }} />
                      <span style={styles.fileName}>{file.name}</span>
                      <span style={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <button style={styles.removeFile} onClick={() => removeFile(i)}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  
                  <button 
                    style={{...styles.primaryButton, marginTop: '16px', width: '100%', justifyContent: 'center'}}
                    onClick={analyzeReports}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</>
                    ) : (
                      <><Search size={16} /> Analyze {uploadedFiles.length} Report{uploadedFiles.length > 1 ? 's' : ''}</>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Error */}
            {analysisError && (
              <div style={styles.errorBox}>
                <AlertCircle size={16} />
                <span>{analysisError}</span>
              </div>
            )}

            {/* Results */}
            {analysisResult && (
              <div style={styles.resultsSection}>
                {/* Summary */}
                <div style={styles.summaryCards}>
                  <div style={styles.summaryCard}>
                    <div style={styles.summaryValue}>{analysisResult.summary?.totalAccounts || 0}</div>
                    <div style={styles.summaryLabel}>Accounts Found</div>
                  </div>
                  <div style={styles.summaryCard}>
                    <div style={{...styles.summaryValue, color: '#f59e0b'}}>{analysisResult.summary?.potentialIssues || 0}</div>
                    <div style={styles.summaryLabel}>Potential Issues</div>
                  </div>
                  <div style={styles.summaryCard}>
                    <div style={{...styles.summaryValue, color: '#ef4444'}}>{analysisResult.summary?.highPriorityItems || 0}</div>
                    <div style={styles.summaryLabel}>High Priority</div>
                  </div>
                </div>

                {/* Findings */}
                {analysisResult.findings?.length > 0 && (
                  <div style={styles.findingsSection}>
                    <h3 style={styles.sectionTitle}>Findings</h3>
                    {analysisResult.findings.map((finding, i) => {
                      const isFlagged = flaggedItems.some(f => f.id === finding.id);
                      return (
                        <div key={finding.id || i} style={{...styles.findingCard, borderLeftColor: severityColor[finding.severity] || '#71717a'}}>
                          <div style={styles.findingHeader}>
                            <div>
                              <span style={{...styles.severityBadge, background: `${severityColor[finding.severity]}20`, color: severityColor[finding.severity]}}>
                                {finding.severity?.toUpperCase()}
                              </span>
                              <span style={styles.typeBadge}>{finding.type?.replace(/_/g, ' ')}</span>
                            </div>
                            <button 
                              style={{...styles.flagButton, color: isFlagged ? '#d4a574' : '#71717a'}}
                              onClick={() => toggleFlag(finding)}
                            >
                              <Flag size={16} fill={isFlagged ? '#d4a574' : 'none'} />
                            </button>
                          </div>
                          <div style={styles.findingAccount}>{finding.account}</div>
                          <div style={styles.findingIssue}>{finding.issue}</div>
                          <div style={styles.findingMeta}>
                            <span style={styles.statuteTag}>{finding.statute}</span>
                            <span>Success: {finding.successLikelihood}</span>
                          </div>
                          <div style={styles.findingAction}>
                            <strong>Action:</strong> {finding.recommendation}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Cross-Bureau Inconsistencies */}
                {analysisResult.crossBureauInconsistencies?.length > 0 && (
                  <div style={styles.findingsSection}>
                    <h3 style={styles.sectionTitle}>Cross-Bureau Inconsistencies</h3>
                    {analysisResult.crossBureauInconsistencies.map((item, i) => (
                      <div key={i} style={styles.inconsistencyCard}>
                        <div style={styles.inconsistencyItem}>{item.item}</div>
                        <div style={styles.inconsistencyDetails}>{item.details}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Personal Info Review */}
                {analysisResult.personalInfo && (
                  <div style={styles.findingsSection}>
                    <h3 style={styles.sectionTitle}>Personal Information Found</h3>
                    <div style={styles.personalInfoGrid}>
                      {analysisResult.personalInfo.namesFound?.length > 0 && (
                        <div style={styles.infoBlock}>
                          <div style={styles.infoLabel}>Names</div>
                          <div style={styles.infoList}>{analysisResult.personalInfo.namesFound.join(', ')}</div>
                        </div>
                      )}
                      {analysisResult.personalInfo.addressesFound?.length > 0 && (
                        <div style={styles.infoBlock}>
                          <div style={styles.infoLabel}>Addresses</div>
                          <div style={styles.infoList}>{analysisResult.personalInfo.addressesFound.join('; ')}</div>
                        </div>
                      )}
                    </div>
                    <p style={styles.infoNote}>Review this information. Flag anything unfamiliar — it may indicate fraud.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* FLAGGED ITEMS TAB */}
        {activeTab === 'flagged' && (
          <div style={styles.flaggedContainer}>
            <div style={styles.pageHeader}>
              <div>
                <h1 style={styles.pageTitle}>Flagged Items</h1>
                <p style={styles.pageSubtitle}>Items you've flagged for dispute from your credit report analysis</p>
              </div>
            </div>

            {flaggedItems.length === 0 ? (
              <div style={styles.emptyState}>
                <Flag size={48} style={{ color: '#3f3f46', marginBottom: '16px' }} />
                <h3 style={styles.emptyTitle}>No flagged items</h3>
                <p style={styles.emptyText}>Analyze your credit reports and flag items you want to dispute.</p>
              </div>
            ) : (
              <div style={styles.flaggedGrid}>
                {flaggedItems.map((item, i) => (
                  <div key={item.id || i} style={styles.flaggedCard}>
                    <div style={styles.flaggedHeader}>
                      <span style={{...styles.severityBadge, background: `${severityColor[item.severity]}20`, color: severityColor[item.severity]}}>
                        {item.severity?.toUpperCase()}
                      </span>
                      <span style={styles.statuteTag}>{item.statute}</span>
                    </div>
                    <div style={styles.flaggedAccount}>{item.account}</div>
                    <div style={styles.flaggedIssue}>{item.issue}</div>
                    <div style={styles.flaggedActions}>
                      <button 
                        style={styles.primaryButton}
                        onClick={() => createDisputeFromFlagged(item)}
                      >
                        <Plus size={14} /> Create Dispute
                      </button>
                      <button 
                        style={styles.secondaryButton}
                        onClick={() => toggleFlag(item)}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div style={styles.chatContainer}>
            <div style={styles.chatMessages}>
              {messages.map((msg) => (
                <div key={msg.id} style={{...styles.message, ...(msg.role === 'user' ? styles.messageUser : styles.messageAssistant)}}>
                  <div style={{...styles.messageContent, ...(msg.role === 'user' ? styles.messageContentUser : styles.messageContentAssistant), ...(msg.isError ? styles.messageError : {})}}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{...styles.message, ...styles.messageAssistant}}>
                  <div style={{...styles.messageContent, ...styles.messageContentAssistant}}>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div style={styles.inputContainer}>
              <div style={styles.inputWrapper}>
                <textarea
                  style={styles.input}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                  placeholder="Describe your situation..."
                  rows={1}
                />
                <button style={{...styles.sendButton, opacity: inputValue.trim() && !isLoading ? 1 : 0.4}} onClick={sendMessage} disabled={!inputValue.trim() || isLoading}>
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TEMPLATES TAB */}
        {activeTab === 'templates' && (
          <div style={styles.templatesContainer}>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>Letter Templates</h1>
              <p style={styles.pageSubtitle}>Generate dispute letters customized for your situation</p>
            </div>
            <div style={styles.templateCategories}>
              {Object.entries(TEMPLATES).map(([key, category]) => (
                <div key={key} style={styles.categoryCard}>
                  <button style={styles.categoryHeader} onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}>
                    <div style={styles.categoryTitle}><category.icon size={20} style={{ color: '#d4a574' }} /><span>{category.category}</span></div>
                    <ChevronDown size={18} style={{ transform: expandedCategory === key ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
                  </button>
                  {expandedCategory === key && (
                    <div style={styles.templateList}>
                      {category.templates.map(template => (
                        <div key={template.id} style={styles.templateItem}>
                          <div style={styles.templateInfo}>
                            <div style={styles.templateName}>{template.name}</div>
                            <div style={styles.templateDesc}>{template.description}</div>
                            <div style={styles.templateDeadline}><Clock size={12} /> {template.deadline}</div>
                          </div>
                          {template.external ? (
                            <a href={template.external} target="_blank" rel="noopener noreferrer" style={styles.generateButton}>
                              Open <ExternalLink size={14} />
                            </a>
                          ) : (
                            <button style={styles.generateButton} onClick={() => setGeneratedLetter({ template, content: getLetterContent(template.id) })}>
                              Generate <ChevronRight size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TRACKER TAB */}
        {activeTab === 'tracker' && (
          <div style={styles.trackerContainer}>
            <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>Dispute Tracker</h1><p style={styles.pageSubtitle}>Monitor deadlines and responses</p></div>
              <button style={styles.primaryButton} onClick={() => {
                const agency = prompt('Agency name:');
                const type = prompt('Type (605B or 611):');
                if (agency && type) {
                  setDisputes(prev => [{ id: Date.now(), agency, type: type.toUpperCase(), createdAt: new Date().toISOString(), deadline: calculateDeadline(type.toUpperCase()), status: 'pending' }, ...prev]);
                  logAction('DISPUTE_CREATED', { agency, type });
                }
              }}><Plus size={16} /> Add Dispute</button>
            </div>
            {disputes.length === 0 ? (
              <div style={styles.emptyState}><Calendar size={48} style={{ color: '#3f3f46', marginBottom: '16px' }} /><h3 style={styles.emptyTitle}>No disputes tracked</h3></div>
            ) : (
              <div style={styles.disputeGrid}>
                {disputes.map(d => {
                  const days = getDaysRemaining(d.deadline);
                  const isOverdue = days < 0;
                  return (
                    <div key={d.id} style={{...styles.disputeCard, borderColor: isOverdue ? '#ef4444' : days <= 2 ? '#f59e0b' : '#27272a'}}>
                      <div style={styles.disputeHeader}>
                        <div><div style={styles.disputeAgency}>{d.agency}</div><div style={styles.disputeType}>§{d.type} • {formatDate(d.createdAt)}</div></div>
                        <span style={{...styles.statusBadge, background: d.type === '605B' ? 'rgba(212,165,116,0.15)' : 'rgba(59,130,246,0.15)', color: d.type === '605B' ? '#d4a574' : '#60a5fa'}}>{d.type === '605B' ? '4-day' : '30-day'}</span>
                      </div>
                      <div style={{...styles.countdown, color: isOverdue ? '#ef4444' : days <= 2 ? '#f59e0b' : '#22c55e'}}>
                        {isOverdue ? <><AlertCircle size={18} /> Overdue by {Math.abs(days)} days</> : <><Clock size={18} /> {days} days left</>}
                      </div>
                      <div style={styles.disputeActions}>
                        <button style={styles.actionButton} onClick={() => { setDisputes(prev => prev.map(x => x.id === d.id ? {...x, status: 'responded'} : x)); logAction('RESPONSE_RECEIVED', { agency: d.agency }); }}>
                          <CheckCircle2 size={14} /> Responded
                        </button>
                        <button style={{...styles.actionButton, color: '#ef4444'}} onClick={() => { setDisputes(prev => prev.filter(x => x.id !== d.id)); }}>
                          <X size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* AUDIT TAB */}
        {activeTab === 'audit' && (
          <div style={styles.auditContainer}>
            <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>Audit Log</h1><p style={styles.pageSubtitle}>Timestamped evidence trail</p></div>
              <button style={styles.secondaryButton} onClick={() => {
                const data = JSON.stringify({ auditLog, disputes, flaggedItems, exportedAt: new Date().toISOString() }, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `605b_audit_${new Date().toISOString().split('T')[0]}.json`; a.click();
              }}><Download size={16} /> Export</button>
            </div>
            <div style={styles.auditNotice}><Scale size={16} /><span>This log serves as evidence for CFPB complaints and litigation.</span></div>
            {auditLog.length === 0 ? (
              <div style={styles.emptyState}><FileText size={48} style={{ color: '#3f3f46', marginBottom: '16px' }} /><h3 style={styles.emptyTitle}>No actions logged</h3></div>
            ) : (
              <div style={styles.auditList}>
                {auditLog.map(entry => (
                  <div key={entry.id} style={styles.auditEntry}>
                    <div style={styles.auditTimestamp}>{new Date(entry.timestamp).toLocaleString()}</div>
                    <div style={styles.auditAction}>{entry.action}</div>
                    {Object.keys(entry.details).length > 0 && <div style={styles.auditDetails}>{JSON.stringify(entry.details)}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Letter Modal */}
      {generatedLetter && (
        <div style={styles.modalOverlay} onClick={() => setGeneratedLetter(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{generatedLetter.template.name}</h2>
              <button style={styles.closeButton} onClick={() => setGeneratedLetter(null)}><X size={20} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.letterInstructions}><AlertCircle size={16} /><span>Replace [BRACKETED] text with your info. Send via certified mail.</span></div>
              <pre style={styles.letterContent}>{generatedLetter.content}</pre>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.secondaryButton} onClick={() => copyToClipboard(generatedLetter.content)}>
                {copySuccess ? <Check size={16} /> : <Copy size={16} />} {copySuccess ? 'Copied!' : 'Copy'}
              </button>
              <button style={styles.primaryButton} onClick={() => {
                const blob = new Blob([generatedLetter.content], { type: 'text/plain' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${generatedLetter.template.id}.txt`; a.click();
              }}><Download size={16} /> Download</button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: { display: 'flex', minHeight: '100vh', background: '#09090b', color: '#fafafa' },
  
  // Sidebar
  sidebar: { width: '250px', background: '#0c0c0e', borderRight: '1px solid #1c1c1f', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh' },
  sidebarHeader: { padding: '20px', borderBottom: '1px solid #1c1c1f' },
  logo: { fontSize: '20px', fontWeight: '700', color: '#fafafa', textDecoration: 'none' },
  nav: { padding: '12px', display: 'flex', flexDirection: 'column', gap: '2px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'transparent', border: 'none', borderRadius: '8px', color: '#71717a', fontSize: '14px', fontWeight: '500', cursor: 'pointer', textAlign: 'left', width: '100%' },
  navItemActive: { background: 'rgba(212, 165, 116, 0.1)', color: '#d4a574' },
  badge: { marginLeft: 'auto', padding: '2px 8px', background: '#d4a574', color: '#09090b', borderRadius: '10px', fontSize: '11px', fontWeight: '600' },
  sidebarSection: { padding: '16px 12px', borderTop: '1px solid #1c1c1f', marginTop: 'auto' },
  sectionLabel: { fontSize: '11px', fontWeight: '600', color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', padding: '0 12px' },
  quickLink: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', color: '#71717a', fontSize: '13px', textDecoration: 'none', borderRadius: '6px' },
  sidebarFooter: { padding: '16px 20px', borderTop: '1px solid #1c1c1f', display: 'flex', alignItems: 'center', gap: '12px' },
  userName: { fontSize: '13px', color: '#a1a1aa' },

  // Main
  main: { flex: 1, marginLeft: '250px', minHeight: '100vh' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  pageTitle: { fontSize: '24px', fontWeight: '600', color: '#fafafa', marginBottom: '4px' },
  pageSubtitle: { fontSize: '14px', color: '#71717a' },

  // Analyze
  analyzeContainer: { padding: '32px', overflowY: 'auto' },
  uploadSection: { marginBottom: '24px' },
  uploadZone: { border: '2px dashed #27272a', borderRadius: '12px', padding: '48px', textAlign: 'center', cursor: 'pointer', transition: '0.2s' },
  uploadText: { fontSize: '16px', color: '#a1a1aa', marginBottom: '8px' },
  uploadHint: { fontSize: '13px', color: '#52525b' },
  fileList: { marginTop: '16px' },
  fileItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#0f0f11', border: '1px solid #1c1c1f', borderRadius: '8px', marginBottom: '8px' },
  fileName: { flex: 1, fontSize: '14px', color: '#fafafa' },
  fileSize: { fontSize: '12px', color: '#52525b' },
  removeFile: { background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' },
  errorBox: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#fca5a5', marginBottom: '24px' },
  
  // Results
  resultsSection: { marginTop: '32px' },
  summaryCards: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' },
  summaryCard: { padding: '24px', background: '#0f0f11', border: '1px solid #1c1c1f', borderRadius: '12px', textAlign: 'center' },
  summaryValue: { fontSize: '36px', fontWeight: '700', color: '#fafafa' },
  summaryLabel: { fontSize: '13px', color: '#71717a', marginTop: '4px' },
  findingsSection: { marginBottom: '32px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '16px' },
  findingCard: { padding: '20px', background: '#0f0f11', border: '1px solid #1c1c1f', borderLeft: '4px solid', borderRadius: '8px', marginBottom: '12px' },
  findingHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  severityBadge: { padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', marginRight: '8px' },
  typeBadge: { padding: '4px 8px', background: '#1c1c1f', borderRadius: '4px', fontSize: '11px', color: '#a1a1aa', textTransform: 'capitalize' },
  flagButton: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' },
  findingAccount: { fontSize: '16px', fontWeight: '600', marginBottom: '8px' },
  findingIssue: { fontSize: '14px', color: '#a1a1aa', marginBottom: '12px', lineHeight: '1.5' },
  findingMeta: { display: 'flex', gap: '16px', fontSize: '13px', color: '#71717a', marginBottom: '12px' },
  statuteTag: { color: '#d4a574' },
  findingAction: { fontSize: '13px', color: '#a1a1aa', padding: '12px', background: '#1c1c1f', borderRadius: '6px' },
  inconsistencyCard: { padding: '16px', background: '#0f0f11', border: '1px solid #1c1c1f', borderRadius: '8px', marginBottom: '12px' },
  inconsistencyItem: { fontSize: '15px', fontWeight: '500', marginBottom: '8px' },
  inconsistencyDetails: { fontSize: '14px', color: '#a1a1aa' },
  personalInfoGrid: { display: 'grid', gap: '16px', marginBottom: '16px' },
  infoBlock: { padding: '16px', background: '#0f0f11', border: '1px solid #1c1c1f', borderRadius: '8px' },
  infoLabel: { fontSize: '12px', fontWeight: '600', color: '#71717a', marginBottom: '8px', textTransform: 'uppercase' },
  infoList: { fontSize: '14px', color: '#a1a1aa' },
  infoNote: { fontSize: '13px', color: '#71717a', fontStyle: 'italic' },

  // Flagged
  flaggedContainer: { padding: '32px', overflowY: 'auto' },
  flaggedGrid: { display: 'grid', gap: '16px' },
  flaggedCard: { padding: '20px', background: '#0f0f11', border: '1px solid #1c1c1f', borderRadius: '12px' },
  flaggedHeader: { display: 'flex', gap: '8px', marginBottom: '12px' },
  flaggedAccount: { fontSize: '16px', fontWeight: '600', marginBottom: '8px' },
  flaggedIssue: { fontSize: '14px', color: '#a1a1aa', marginBottom: '16px' },
  flaggedActions: { display: 'flex', gap: '12px' },

  // Chat
  chatContainer: { display: 'flex', flexDirection: 'column', height: '100vh' },
  chatMessages: { flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '16px' },
  message: { maxWidth: '75%' },
  messageUser: { alignSelf: 'flex-end' },
  messageAssistant: { alignSelf: 'flex-start' },
  messageContent: { padding: '14px 18px', borderRadius: '16px', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' },
  messageContentUser: { background: '#d4a574', color: '#09090b', borderRadius: '16px 16px 4px 16px' },
  messageContentAssistant: { background: '#1c1c1f', color: '#e4e4e7', border: '1px solid #27272a', borderRadius: '16px 16px 16px 4px' },
  messageError: { background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' },
  inputContainer: { padding: '16px 32px 24px', borderTop: '1px solid #1c1c1f' },
  inputWrapper: { display: 'flex', alignItems: 'flex-end', gap: '12px', background: '#1c1c1f', border: '1px solid #27272a', borderRadius: '12px', padding: '12px 16px' },
  input: { flex: 1, background: 'transparent', border: 'none', color: '#fafafa', fontSize: '14px', resize: 'none', outline: 'none', lineHeight: '1.5', fontFamily: 'inherit' },
  sendButton: { width: '36px', height: '36px', borderRadius: '8px', background: '#d4a574', border: 'none', color: '#09090b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // Templates
  templatesContainer: { padding: '32px', overflowY: 'auto' },
  templateCategories: { display: 'flex', flexDirection: 'column', gap: '12px' },
  categoryCard: { background: '#0f0f11', border: '1px solid #1c1c1f', borderRadius: '12px', overflow: 'hidden' },
  categoryHeader: { width: '100%', padding: '16px 20px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: '#fafafa' },
  categoryTitle: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', fontWeight: '600' },
  templateList: { borderTop: '1px solid #1c1c1f' },
  templateItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #1c1c1f', gap: '16px' },
  templateInfo: { flex: 1 },
  templateName: { fontSize: '14px', fontWeight: '500', color: '#fafafa', marginBottom: '4px' },
  templateDesc: { fontSize: '13px', color: '#71717a', marginBottom: '6px' },
  templateDeadline: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#d4a574' },
  generateButton: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#d4a574', border: 'none', borderRadius: '6px', color: '#09090b', fontSize: '13px', fontWeight: '500', cursor: 'pointer', textDecoration: 'none' },

  // Tracker
  trackerContainer: { padding: '32px', overflowY: 'auto' },
  disputeGrid: { display: 'grid', gap: '16px' },
  disputeCard: { padding: '20px', background: '#0f0f11', border: '1px solid', borderRadius: '12px' },
  disputeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  disputeAgency: { fontSize: '16px', fontWeight: '600' },
  disputeType: { fontSize: '13px', color: '#71717a', marginTop: '2px' },
  statusBadge: { padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '500' },
  countdown: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '600', marginBottom: '16px' },
  disputeActions: { display: 'flex', gap: '8px' },
  actionButton: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#1c1c1f', border: '1px solid #27272a', borderRadius: '6px', color: '#a1a1aa', fontSize: '13px', cursor: 'pointer' },

  // Audit
  auditContainer: { padding: '32px', overflowY: 'auto' },
  auditNotice: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(212,165,116,0.1)', border: '1px solid rgba(212,165,116,0.2)', borderRadius: '8px', fontSize: '13px', color: '#d4a574', marginBottom: '24px' },
  auditList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  auditEntry: { padding: '12px 16px', background: '#0f0f11', border: '1px solid #1c1c1f', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px' },
  auditTimestamp: { color: '#52525b', marginBottom: '4px' },
  auditAction: { color: '#d4a574', fontWeight: '500' },
  auditDetails: { color: '#71717a', marginTop: '4px' },

  // Buttons
  primaryButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#d4a574', border: 'none', borderRadius: '8px', color: '#09090b', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
  secondaryButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'transparent', border: '1px solid #27272a', borderRadius: '8px', color: '#a1a1aa', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },

  // Empty
  emptyState: { textAlign: 'center', padding: '64px 32px', background: '#0f0f11', borderRadius: '12px', border: '1px solid #1c1c1f' },
  emptyTitle: { fontSize: '16px', fontWeight: '600', color: '#a1a1aa', marginBottom: '8px' },
  emptyText: { fontSize: '14px', color: '#52525b' },

  // Modal
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: '#0f0f11', border: '1px solid #27272a', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #27272a' },
  modalTitle: { fontSize: '18px', fontWeight: '600' },
  closeButton: { width: '32px', height: '32px', borderRadius: '8px', background: '#27272a', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: '24px', overflowY: 'auto', flex: 1 },
  letterInstructions: { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: 'rgba(212,165,116,0.1)', border: '1px solid rgba(212,165,116,0.2)', borderRadius: '8px', fontSize: '13px', color: '#d4a574', marginBottom: '16px' },
  letterContent: { background: '#1c1c1f', border: '1px solid #27272a', borderRadius: '8px', padding: '20px', fontSize: '13px', lineHeight: '1.6', color: '#e4e4e7', whiteSpace: 'pre-wrap', fontFamily: 'monospace', overflowX: 'auto' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid #27272a' },
};
