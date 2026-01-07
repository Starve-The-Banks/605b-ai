"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  Search, Sparkles, FileText, Clock, Flag, FileCheck, 
  Upload, ExternalLink, AlertCircle, ChevronDown, ChevronUp,
  Mic, Send, X, BookOpen, Shield, Scale,
  TrendingUp, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight
} from 'lucide-react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) setStoredValue(JSON.parse(item));
    } catch (e) { console.error(e); }
  }, [key]);
  const setValue = (value) => {
    try {
      const v = value instanceof Function ? value(storedValue) : value;
      setStoredValue(v);
      window.localStorage.setItem(key, JSON.stringify(v));
    } catch (e) { console.error(e); }
  };
  return [storedValue, setValue];
}

export default function Dashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('analyze');
  const [resourcesExpanded, setResourcesExpanded] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsUploading(true);
    setTimeout(() => setIsUploading(false), 2000);
  };

  const sidebarItems = [
    { id: 'analyze', label: 'Analyze', icon: Search, section: 'CORE' },
    { id: 'ai-strategist', label: 'AI Strategist', icon: Sparkles, section: 'CORE' },
    { id: 'templates', label: 'Templates', icon: FileText, section: 'CORE' },
    { id: 'tracker', label: 'Tracker', icon: Clock, section: 'MANAGE' },
    { id: 'flagged', label: 'Flagged', icon: Flag, section: 'MANAGE' },
    { id: 'audit-log', label: 'Audit Log', icon: FileCheck, section: 'MANAGE' },
  ];

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
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#0a0a0b',
      color: '#e5e5e5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* LEFT SIDEBAR */}
      <aside style={{
        width: '200px',
        background: '#0d0d0f',
        borderRight: '1px solid #1a1a1c',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50
      }}>
        <div style={{ padding: '20px', fontSize: '20px', fontWeight: 700, borderBottom: '1px solid #1a1a1c' }}>
          605b<span style={{ color: '#f7d047' }}>.ai</span>
        </div>
        
        <nav style={{ flex: 1, padding: '8px' }}>
          {['CORE', 'MANAGE'].map(section => (
            <div key={section}>
              <div style={{ padding: '16px 12px 8px', fontSize: '11px', fontWeight: 600, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{section}</div>
              {sidebarItems.filter(item => item.section === section).map(item => (
                <div
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    color: activeTab === item.id ? '#f7d047' : '#a3a3a3',
                    background: activeTab === item.id ? 'rgba(247, 208, 71, 0.1)' : 'transparent',
                    fontSize: '14px',
                    cursor: 'pointer',
                    marginBottom: '2px'
                  }}
                >
                  <item.icon size={18} />
                  {item.label}
                </div>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid #1a1a1c', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #f7d047 0%, #d4b840 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            color: '#0a0a0b',
            fontSize: '14px'
          }}>
            {user?.firstName?.[0] || 'M'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 500 }}>{user?.firstName || 'Michael'}</div>
            <div style={{ fontSize: '11px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', display: 'inline-block' }}></span>
              Synced
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{
        flex: 1,
        marginLeft: '200px',
        marginRight: rightSidebarOpen ? '340px' : '0px',
        padding: '24px 32px',
        minHeight: '100vh',
        overflowY: 'auto',
        transition: 'margin-right 0.3s ease'
      }}>
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
      </main>

      {/* RIGHT SIDEBAR TOGGLE BUTTON - when sidebar is closed */}
      {!rightSidebarOpen && (
        <button
          onClick={() => setRightSidebarOpen(true)}
          style={{
            position: 'fixed',
            right: '0',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '32px',
            height: '64px',
            background: '#1a1a1c',
            border: '1px solid #262629',
            borderRight: 'none',
            borderRadius: '8px 0 0 8px',
            color: '#f7d047',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60
          }}
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* RIGHT SIDEBAR - AI CHAT - COLLAPSIBLE */}
      <aside style={{
        width: '340px',
        background: '#0d0d0f',
        borderLeft: '1px solid #1a1a1c',
        position: 'fixed',
        top: 0,
        right: rightSidebarOpen ? '0' : '-340px',
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        transition: 'right 0.3s ease'
      }}>
        {/* Collapse button */}
        <button
          onClick={() => setRightSidebarOpen(false)}
          style={{
            position: 'absolute',
            left: '-16px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '32px',
            height: '64px',
            background: '#1a1a1c',
            border: '1px solid #262629',
            borderRadius: '8px 0 0 8px',
            color: '#737373',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60
          }}
        >
          <ChevronRight size={20} />
        </button>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a1c', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #f7d047 0%, #d4b840 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={22} style={{ color: '#0a0a0b' }} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>AI Strategist</div>
              <div style={{ fontSize: '12px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', display: 'inline-block' }}></span>
                Online
              </div>
            </div>
          </div>
          <button 
            onClick={() => setRightSidebarOpen(false)}
            style={{
              width: '32px',
              height: '32px',
              background: '#1a1a1c',
              border: 'none',
              borderRadius: '8px',
              color: '#737373',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'rgba(247, 208, 71, 0.1)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#f7d047'
            }}>
              <Sparkles size={24} />
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>AI Strategist</h4>
            <p style={{ fontSize: '13px', color: '#737373', lineHeight: 1.5 }}>
              I'm your credit repair strategist. I know the FCRA inside and out. Upload a credit report for analysis, or tell me what's going on with your credit.
            </p>
          </div>
        </div>

        <div style={{ padding: '0 16px 16px' }}>
          {['What should I dispute first?', 'Explain my rights under 605B', 'How long do bureaus have to respond?'].map((q, i) => (
            <button key={i} style={{
              width: '100%',
              padding: '12px 16px',
              background: '#1a1a1c',
              border: '1px solid #262629',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#a3a3a3',
              cursor: 'pointer',
              textAlign: 'left',
              marginBottom: '8px'
            }}>
              {q}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #1a1a1c' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            background: '#1a1a1c',
            border: '1px solid #262629',
            borderRadius: '10px'
          }}>
            <input 
              type="text"
              placeholder="Ask about your disputes..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                color: '#e5e5e5',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button style={{
              width: '32px',
              height: '32px',
              background: 'none',
              border: 'none',
              borderRadius: '6px',
              color: '#525252',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Mic size={18} />
            </button>
            <button style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #f7d047 0%, #d4b840 100%)',
              border: 'none',
              borderRadius: '6px',
              color: '#0a0a0b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
