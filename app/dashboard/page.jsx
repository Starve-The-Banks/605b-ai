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
  X,
  Copy,
  Loader2,
  Upload,
  File,
  AlertTriangle,
  Check,
  Flag,
  Search,
  Trash2,
  Menu,
  Settings
} from 'lucide-react';

// System prompt for chat
const SYSTEM_PROMPT = `You are 605b.ai, an expert credit repair assistant specializing in identity theft recovery and consumer protection law. Be direct, cite statutes, give concrete next steps.`;

// Template data
const TEMPLATES = {
  identity_theft: {
    category: "Identity Theft",
    icon: Shield,
    templates: [
      { id: "605b_bureau", name: "§605B Identity Theft Block", description: "Demand bureaus block fraudulent accounts", deadline: "4 business days" },
      { id: "605b_furnisher", name: "§605B Direct to Furnisher", description: "Send block demand to creditor", deadline: "4 business days" },
      { id: "ftc_affidavit", name: "FTC Identity Theft Report", description: "Official identity theft affidavit", deadline: "N/A", external: "https://www.identitytheft.gov/" },
    ]
  },
  disputes: {
    category: "Credit Disputes",
    icon: FileWarning,
    templates: [
      { id: "611_dispute", name: "§611 Standard Dispute", description: "Challenge inaccurate information", deadline: "30 days" },
      { id: "609_disclosure", name: "§609 Method of Verification", description: "Request verification proof", deadline: "15 days" },
      { id: "623_direct", name: "§623 Direct Furnisher Dispute", description: "Dispute directly with furnisher", deadline: "30 days" },
    ]
  },
  debt_collection: {
    category: "Debt Collection",
    icon: AlertTriangle,
    templates: [
      { id: "809_validation", name: "§809 Debt Validation", description: "Demand collector prove debt", deadline: "30 days" },
      { id: "cease_desist", name: "Cease & Desist Letter", description: "Stop collector contact", deadline: "Immediate" },
      { id: "pay_delete", name: "Pay for Delete Request", description: "Payment for removal", deadline: "Negotiable" },
    ]
  },
  specialty: {
    category: "Specialty Agencies",
    icon: Building2,
    templates: [
      { id: "chex_dispute", name: "ChexSystems Dispute", description: "Dispute banking history", deadline: "30 days" },
      { id: "ews_dispute", name: "Early Warning Dispute", description: "Dispute EWS records", deadline: "30 days" },
      { id: "lexis_dispute", name: "LexisNexis Dispute", description: "Dispute public records", deadline: "30 days" },
    ]
  },
  escalation: {
    category: "Escalation",
    icon: Scale,
    templates: [
      { id: "cfpb_complaint", name: "CFPB Complaint", description: "File federal complaint", deadline: "15-60 days", external: "https://www.consumerfinance.gov/complaint/" },
      { id: "state_ag", name: "State Attorney General", description: "File state complaint", deadline: "Varies" },
      { id: "intent_to_sue", name: "Intent to Sue Letter", description: "Final demand before litigation", deadline: "15-30 days" },
    ]
  },
};

// Letter content
const LETTER_CONTENT = {
  "605b_bureau": () => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

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
[ACCOUNT NAME] - Account #[XXXX] - Opened [DATE]

I have enclosed:
□ Copy of FTC Identity Theft Report
□ Copy of government-issued photo ID
□ Proof of address

Under 15 U.S.C. § 1681c-2(a), you must block this information within four (4) business days. Failure to comply may result in civil liability under 15 U.S.C. § 1681n (willful noncompliance) including statutory damages of $100 to $1,000 per violation.

Sincerely,

______________________________
[YOUR NAME]`,

  "611_dispute": () => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

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
Creditor: [CREDITOR NAME]
Account Number: [XXXX]
Reason: [REASON]

Under §611(a)(1)(A), you must conduct a reasonable investigation within 30 days. Under §611(a)(5)(A), if the information is inaccurate or unverifiable, you must delete or modify it.

Please send me an updated copy of my credit report upon completion.

Sincerely,

______________________________
[YOUR NAME]`,

  "809_validation": () => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

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
};

const getLetterContent = (templateId) => {
  if (LETTER_CONTENT[templateId]) {
    return LETTER_CONTENT[templateId]();
  }
  return `[Letter template for ${templateId}]\n\nCustomize this template with your specific information.`;
};

// Local storage hook
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

export default function Dashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('analyze');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [disputes, setDisputes] = useLocalStorage('605b_disputes', []);
  const [auditLog, setAuditLog] = useLocalStorage('605b_audit', []);
  const [flaggedItems, setFlaggedItems] = useLocalStorage('605b_flagged', []);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

  // File upload
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
      logAction('REPORTS_ANALYZED', { filesCount: uploadedFiles.length, issuesFound: data.analysis?.findings?.length || 0 });
    } catch (err) {
      setAnalysisError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle flag
  const toggleFlag = (finding) => {
    const exists = flaggedItems.find(f => f.id === finding.id);
    if (exists) {
      setFlaggedItems(prev => prev.filter(f => f.id !== finding.id));
    } else {
      setFlaggedItems(prev => [...prev, { ...finding, flaggedAt: new Date().toISOString() }]);
      logAction('ITEM_FLAGGED', { account: finding.account });
    }
  };

  // Create dispute from flagged
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
    logAction('DISPUTE_CREATED', { account: item.account });
  };

  // Send chat
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
      const responseText = await response.text();
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: responseText }]);
      logAction('AI_CHAT', { query: text.substring(0, 50) });
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: `Error: ${err.message}`, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Init chat
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 1,
        role: 'assistant',
        content: `Welcome to 605b.ai. I help with credit disputes and identity theft recovery.\n\nI can help with:\n• Identity theft recovery — §605B blocks\n• Credit disputes — §611 disputes\n• Debt collection — §809 validation\n• Escalation — CFPB complaints\n\nWhat's your situation?`
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

  const severityColor = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };

  const tabs = [
    { id: 'analyze', icon: Search, label: 'Analyze' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'templates', icon: FileText, label: 'Templates' },
    { id: 'tracker', icon: Calendar, label: 'Tracker' },
    { id: 'flagged', icon: Flag, label: 'Flagged' },
    { id: 'audit', icon: FileWarning, label: 'Audit' },
  ];

  return (
    <>
      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .dashboard { display: flex; min-height: 100vh; background: #09090b; color: #fafafa; }
        
        /* Sidebar - Desktop */
        .sidebar {
          width: 240px;
          background: #0c0c0e;
          border-right: 1px solid #1c1c1f;
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          z-index: 100;
        }
        
        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid #1c1c1f;
        }
        
        .logo {
          font-size: 20px;
          font-weight: 700;
          color: #fafafa;
          text-decoration: none;
        }
        
        .logo-accent { color: #d4a574; }
        
        .nav { padding: 12px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
        
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: #71717a;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: all 0.15s;
        }
        
        .nav-item:hover { background: rgba(255,255,255,0.05); color: #a1a1aa; }
        .nav-item.active { background: rgba(212, 165, 116, 0.1); color: #d4a574; }
        
        .nav-badge {
          margin-left: auto;
          padding: 2px 8px;
          background: #d4a574;
          color: #09090b;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
        }
        
        .sidebar-footer {
          padding: 16px 20px;
          border-top: 1px solid #1c1c1f;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .user-name { font-size: 13px; color: #a1a1aa; }
        
        /* Main content */
        .main { flex: 1; margin-left: 240px; min-height: 100vh; }
        
        /* Mobile header */
        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: #0c0c0e;
          border-bottom: 1px solid #1c1c1f;
          padding: 0 16px;
          align-items: center;
          justify-content: space-between;
          z-index: 90;
        }
        
        .mobile-menu-btn {
          background: none;
          border: none;
          color: #fafafa;
          cursor: pointer;
          padding: 8px;
        }
        
        /* Mobile bottom nav */
        .mobile-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #0c0c0e;
          border-top: 1px solid #1c1c1f;
          padding: 8px 0;
          padding-bottom: env(safe-area-inset-bottom, 8px);
          z-index: 90;
        }
        
        .mobile-nav-items {
          display: flex;
          justify-content: space-around;
        }
        
        .mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: none;
          border: none;
          color: #71717a;
          font-size: 10px;
          cursor: pointer;
        }
        
        .mobile-nav-item.active { color: #d4a574; }
        
        /* Content areas */
        .content-area {
          padding: 24px;
          min-height: 100vh;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .page-title { font-size: 24px; font-weight: 600; margin-bottom: 4px; }
        .page-subtitle { font-size: 14px; color: #71717a; }
        
        /* Buttons */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #d4a574;
          border: none;
          border-radius: 8px;
          color: #09090b;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }
        
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: transparent;
          border: 1px solid #27272a;
          border-radius: 8px;
          color: #a1a1aa;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }
        
        /* Cards */
        .card {
          background: #0f0f11;
          border: 1px solid #1c1c1f;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
        }
        
        /* Upload zone */
        .upload-zone {
          border: 2px dashed #27272a;
          border-radius: 12px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        
        .upload-zone:hover { border-color: #d4a574; }
        
        .upload-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          background: rgba(212,165,116,0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #d4a574;
        }
        
        /* File list */
        .file-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #0f0f11;
          border: 1px solid #1c1c1f;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        
        .file-name { flex: 1; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .file-size { font-size: 12px; color: #52525b; }
        .file-remove { background: none; border: none; color: #71717a; cursor: pointer; padding: 4px; }
        
        /* Summary cards */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .summary-card {
          padding: 20px;
          background: #0f0f11;
          border: 1px solid #1c1c1f;
          border-radius: 12px;
          text-align: center;
        }
        
        .summary-value { font-size: 32px; font-weight: 700; }
        .summary-label { font-size: 12px; color: #71717a; margin-top: 4px; }
        
        /* Findings */
        .finding-card {
          padding: 16px;
          background: #0f0f11;
          border: 1px solid #1c1c1f;
          border-left: 4px solid;
          border-radius: 8px;
          margin-bottom: 12px;
        }
        
        .finding-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
        .severity-badge { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
        .statute-tag { font-size: 12px; color: #d4a574; }
        .finding-account { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
        .finding-issue { font-size: 14px; color: #a1a1aa; line-height: 1.5; margin-bottom: 12px; }
        .flag-btn { background: none; border: none; color: #71717a; cursor: pointer; padding: 8px; }
        .flag-btn.flagged { color: #d4a574; }
        
        /* Chat */
        .chat-container { display: flex; flex-direction: column; height: calc(100vh - 48px); }
        .chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .message { max-width: 85%; }
        .message.user { align-self: flex-end; }
        .message.assistant { align-self: flex-start; }
        .message-content {
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .message.user .message-content { background: #d4a574; color: #09090b; border-bottom-right-radius: 4px; }
        .message.assistant .message-content { background: #1c1c1f; color: #e4e4e7; border: 1px solid #27272a; border-bottom-left-radius: 4px; }
        .message.error .message-content { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #fca5a5; }
        
        .chat-input-area { padding: 16px; border-top: 1px solid #1c1c1f; }
        .chat-input-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          background: #1c1c1f;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 12px 16px;
        }
        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #fafafa;
          font-size: 14px;
          resize: none;
          outline: none;
          line-height: 1.5;
          font-family: inherit;
          max-height: 120px;
        }
        .send-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #d4a574;
          border: none;
          color: #09090b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .send-btn:disabled { opacity: 0.4; }
        
        /* Templates */
        .category-card { background: #0f0f11; border: 1px solid #1c1c1f; border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
        .category-header {
          width: 100%;
          padding: 16px;
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          color: #fafafa;
        }
        .category-title { display: flex; align-items: center; gap: 12px; font-size: 16px; font-weight: 600; }
        .category-icon { width: 36px; height: 36px; background: rgba(212,165,116,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #d4a574; }
        
        .template-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-top: 1px solid #1c1c1f;
          gap: 12px;
          flex-wrap: wrap;
        }
        .template-info { flex: 1; min-width: 200px; }
        .template-name { font-size: 14px; font-weight: 500; margin-bottom: 4px; }
        .template-desc { font-size: 13px; color: #71717a; margin-bottom: 4px; }
        .template-deadline { font-size: 12px; color: #d4a574; display: flex; align-items: center; gap: 4px; }
        .template-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: #d4a574;
          border: none;
          border-radius: 6px;
          color: #09090b;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
        }
        
        /* Tracker */
        .dispute-card {
          padding: 16px;
          background: #0f0f11;
          border: 1px solid;
          border-radius: 12px;
          margin-bottom: 12px;
        }
        .dispute-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
        .dispute-agency { font-size: 16px; font-weight: 600; }
        .dispute-type { font-size: 13px; color: #71717a; }
        .type-badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
        .countdown { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; margin-bottom: 12px; }
        .dispute-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #1c1c1f;
          border: 1px solid #27272a;
          border-radius: 6px;
          color: #a1a1aa;
          font-size: 13px;
          cursor: pointer;
        }
        
        /* Audit */
        .audit-notice {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(212,165,116,0.1);
          border: 1px solid rgba(212,165,116,0.2);
          border-radius: 8px;
          font-size: 13px;
          color: #d4a574;
          margin-bottom: 24px;
        }
        .audit-entry {
          padding: 12px 16px;
          background: #0f0f11;
          border: 1px solid #1c1c1f;
          border-radius: 8px;
          font-family: monospace;
          font-size: 12px;
          margin-bottom: 8px;
        }
        .audit-timestamp { color: #52525b; margin-bottom: 4px; }
        .audit-action { color: #d4a574; font-weight: 500; }
        .audit-details { color: #71717a; margin-top: 4px; }
        
        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 48px 24px;
          background: #0f0f11;
          border-radius: 12px;
          border: 1px solid #1c1c1f;
        }
        .empty-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          background: #1c1c1f;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #52525b;
        }
        .empty-title { font-size: 16px; font-weight: 600; color: #a1a1aa; margin-bottom: 8px; }
        .empty-text { font-size: 14px; color: #52525b; }
        
        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal {
          background: #0f0f11;
          border: 1px solid #27272a;
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #27272a;
        }
        .modal-title { font-size: 18px; font-weight: 600; }
        .close-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #27272a;
          border: none;
          color: #a1a1aa;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-body { padding: 20px; overflow-y: auto; flex: 1; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 20px; border-top: 1px solid #27272a; }
        
        .letter-instructions {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(212,165,116,0.1);
          border: 1px solid rgba(212,165,116,0.2);
          border-radius: 8px;
          font-size: 13px;
          color: #d4a574;
          margin-bottom: 16px;
        }
        .letter-content {
          background: #1c1c1f;
          border: 1px solid #27272a;
          border-radius: 8px;
          padding: 16px;
          font-size: 12px;
          line-height: 1.6;
          color: #e4e4e7;
          white-space: pre-wrap;
          font-family: monospace;
          overflow-x: auto;
        }
        
        /* Error box */
        .error-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px;
          color: #fca5a5;
          margin-bottom: 16px;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .main { margin-left: 0; padding-top: 60px; padding-bottom: 80px; }
          .mobile-header { display: flex; }
          .mobile-nav { display: block; }
          .content-area { padding: 16px; }
          .page-title { font-size: 20px; }
          .chat-container { height: calc(100vh - 140px); }
          .chat-messages { padding: 16px; }
          .summary-value { font-size: 24px; }
        }
      `}</style>

      <div className="dashboard">
        {/* Desktop Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <Link href="/" className="logo">605b<span className="logo-accent">.ai</span></Link>
          </div>
          <nav className="nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
                {tab.id === 'tracker' && disputes.length > 0 && <span className="nav-badge">{disputes.length}</span>}
                {tab.id === 'flagged' && flaggedItems.length > 0 && <span className="nav-badge">{flaggedItems.length}</span>}
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <UserButton afterSignOutUrl="/" />
            <span className="user-name">{user?.firstName || 'User'}</span>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="mobile-header">
          <Link href="/" className="logo">605b<span className="logo-accent">.ai</span></Link>
          <UserButton afterSignOutUrl="/" />
        </div>

        {/* Mobile Bottom Nav */}
        <div className="mobile-nav">
          <div className="mobile-nav-items">
            {tabs.slice(0, 5).map(tab => (
              <button
                key={tab.id}
                className={`mobile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="main">
          
          {/* ANALYZE TAB */}
          {activeTab === 'analyze' && (
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
                          <div key={finding.id || i} className="finding-card" style={{ borderLeftColor: severityColor[finding.severity] || '#71717a' }}>
                            <div className="finding-header">
                              <div>
                                <span className="severity-badge" style={{ background: `${severityColor[finding.severity]}20`, color: severityColor[finding.severity] }}>{finding.severity?.toUpperCase()}</span>
                                <span className="statute-tag">{finding.statute}</span>
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
          )}

          {/* FLAGGED TAB */}
          {activeTab === 'flagged' && (
            <div className="content-area">
              <div className="page-header">
                <div>
                  <h1 className="page-title">Flagged Items</h1>
                  <p className="page-subtitle">Items marked for dispute</p>
                </div>
              </div>
              {flaggedItems.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><Flag size={28} /></div>
                  <div className="empty-title">No flagged items</div>
                  <div className="empty-text">Analyze reports and flag items to dispute</div>
                </div>
              ) : (
                flaggedItems.map((item, i) => (
                  <div key={item.id || i} className="card">
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <span className="severity-badge" style={{ background: `${severityColor[item.severity]}20`, color: severityColor[item.severity] }}>{item.severity?.toUpperCase()}</span>
                      <span className="statute-tag">{item.statute}</span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{item.account}</div>
                    <div style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '16px' }}>{item.issue}</div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <button className="btn-primary" onClick={() => createDisputeFromFlagged(item)}><Plus size={14} /> Create Dispute</button>
                      <button className="btn-secondary" onClick={() => toggleFlag(item)}><Trash2 size={14} /> Remove</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <div className="chat-container">
              <div className="chat-messages">
                {messages.map(msg => (
                  <div key={msg.id} className={`message ${msg.role} ${msg.isError ? 'error' : ''}`}>
                    <div className="message-content">{msg.content}</div>
                  </div>
                ))}
                {isLoading && (
                  <div className="message assistant">
                    <div className="message-content"><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input-area">
                <div className="chat-input-wrapper">
                  <textarea
                    className="chat-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                    placeholder="Describe your situation..."
                    rows={1}
                  />
                  <button className="send-btn" onClick={sendMessage} disabled={!inputValue.trim() || isLoading}>
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATES TAB */}
          {activeTab === 'templates' && (
            <div className="content-area">
              <div className="page-header">
                <div>
                  <h1 className="page-title">Letter Templates</h1>
                  <p className="page-subtitle">Generate dispute letters</p>
                </div>
              </div>
              {Object.entries(TEMPLATES).map(([key, category]) => (
                <div key={key} className="category-card">
                  <button className="category-header" onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}>
                    <div className="category-title">
                      <div className="category-icon"><category.icon size={18} /></div>
                      {category.category}
                    </div>
                    <ChevronDown size={18} style={{ transform: expandedCategory === key ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                  </button>
                  {expandedCategory === key && category.templates.map(template => (
                    <div key={template.id} className="template-item">
                      <div className="template-info">
                        <div className="template-name">{template.name}</div>
                        <div className="template-desc">{template.description}</div>
                        <div className="template-deadline"><Clock size={12} /> {template.deadline}</div>
                      </div>
                      {template.external ? (
                        <a href={template.external} target="_blank" rel="noopener noreferrer" className="template-btn">Open <ExternalLink size={14} /></a>
                      ) : (
                        <button className="template-btn" onClick={() => setGeneratedLetter({ template, content: getLetterContent(template.id) })}>Generate <ChevronRight size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* TRACKER TAB */}
          {activeTab === 'tracker' && (
            <div className="content-area">
              <div className="page-header">
                <div>
                  <h1 className="page-title">Dispute Tracker</h1>
                  <p className="page-subtitle">Monitor deadlines</p>
                </div>
                <button className="btn-primary" onClick={() => {
                  const agency = prompt('Agency name:');
                  const type = prompt('Type (605B or 611):');
                  if (agency && type) {
                    setDisputes(prev => [{ id: Date.now(), agency, type: type.toUpperCase(), createdAt: new Date().toISOString(), deadline: calculateDeadline(type.toUpperCase()), status: 'pending' }, ...prev]);
                    logAction('DISPUTE_CREATED', { agency, type });
                  }
                }}><Plus size={16} /> Add</button>
              </div>
              {disputes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><Calendar size={28} /></div>
                  <div className="empty-title">No disputes tracked</div>
                  <div className="empty-text">Add disputes to track deadlines</div>
                </div>
              ) : (
                disputes.map(d => {
                  const days = getDaysRemaining(d.deadline);
                  const isOverdue = days < 0;
                  const statusColor = isOverdue ? '#ef4444' : days <= 2 ? '#f59e0b' : '#22c55e';
                  return (
                    <div key={d.id} className="dispute-card" style={{ borderColor: statusColor }}>
                      <div className="dispute-header">
                        <div>
                          <div className="dispute-agency">{d.agency}</div>
                          <div className="dispute-type">§{d.type} · {formatDate(d.createdAt)}</div>
                        </div>
                        <span className="type-badge" style={{ background: d.type === '605B' ? 'rgba(212,165,116,0.15)' : 'rgba(59,130,246,0.15)', color: d.type === '605B' ? '#d4a574' : '#60a5fa' }}>{d.type === '605B' ? '4-day' : '30-day'}</span>
                      </div>
                      <div className="countdown" style={{ color: statusColor }}>
                        {isOverdue ? <><AlertCircle size={18} /> Overdue {Math.abs(days)}d — VIOLATION</> : <><Clock size={18} /> {days} days left</>}
                      </div>
                      <div className="dispute-actions">
                        <button className="action-btn" onClick={() => { setDisputes(prev => prev.map(x => x.id === d.id ? {...x, status: 'responded'} : x)); logAction('RESPONSE_RECEIVED', { agency: d.agency }); }}>
                          <CheckCircle2 size={14} style={{ color: '#22c55e' }} /> Responded
                        </button>
                        <button className="action-btn" onClick={() => setDisputes(prev => prev.filter(x => x.id !== d.id))}>
                          <X size={14} style={{ color: '#ef4444' }} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* AUDIT TAB */}
          {activeTab === 'audit' && (
            <div className="content-area">
              <div className="page-header">
                <div>
                  <h1 className="page-title">Audit Log</h1>
                  <p className="page-subtitle">Evidence trail</p>
                </div>
                <button className="btn-secondary" onClick={() => {
                  const data = JSON.stringify({ auditLog, disputes, flaggedItems, exportedAt: new Date().toISOString() }, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `605b_audit_${new Date().toISOString().split('T')[0]}.json`; a.click();
                }}><Download size={16} /> Export</button>
              </div>
              <div className="audit-notice"><Scale size={16} /> This log serves as evidence for CFPB complaints.</div>
              {auditLog.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><FileText size={28} /></div>
                  <div className="empty-title">No actions logged</div>
                </div>
              ) : (
                auditLog.map(entry => (
                  <div key={entry.id} className="audit-entry">
                    <div className="audit-timestamp">{new Date(entry.timestamp).toLocaleString()}</div>
                    <div className="audit-action">{entry.action}</div>
                    {Object.keys(entry.details).length > 0 && <div className="audit-details">{JSON.stringify(entry.details)}</div>}
                  </div>
                ))
              )}
            </div>
          )}
        </main>

        {/* Letter Modal */}
        {generatedLetter && (
          <div className="modal-overlay" onClick={() => setGeneratedLetter(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">{generatedLetter.template.name}</div>
                <button className="close-btn" onClick={() => setGeneratedLetter(null)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <div className="letter-instructions"><AlertCircle size={16} style={{ flexShrink: 0 }} /> Replace [BRACKETED] text. Send via certified mail.</div>
                <pre className="letter-content">{generatedLetter.content}</pre>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => copyToClipboard(generatedLetter.content)}>
                  {copySuccess ? <Check size={16} /> : <Copy size={16} />} {copySuccess ? 'Copied!' : 'Copy'}
                </button>
                <button className="btn-primary" onClick={() => {
                  const blob = new Blob([generatedLetter.content], { type: 'text/plain' });
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${generatedLetter.template.id}.txt`; a.click();
                }}><Download size={16} /> Download</button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style jsx global>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
