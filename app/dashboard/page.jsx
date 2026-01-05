"use client";

import { useState, useCallback } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import {
  MessageSquare,
  Calendar,
  FileText,
  Search,
  Flag,
  FileWarning,
  Loader2,
  Cloud,
  CloudOff,
  Sparkles
} from 'lucide-react';

import { useSyncedStorage } from '@/lib/hooks';
import { AnalyzeTab, ChatTab, TemplatesTab, TrackerTab, FlaggedTab, AuditTab, CommandPalette } from './components';
import { dashboardStyles } from './styles';

const navSections = [
  {
    label: 'Core',
    items: [
      { id: 'analyze', icon: Search, label: 'Analyze' },
      { id: 'chat', icon: Sparkles, label: 'AI Strategist' },
      { id: 'templates', icon: FileText, label: 'Templates' },
    ]
  },
  {
    label: 'Manage',
    items: [
      { id: 'tracker', icon: Calendar, label: 'Tracker' },
      { id: 'flagged', icon: Flag, label: 'Flagged' },
      { id: 'audit', icon: FileWarning, label: 'Audit Log' },
    ]
  }
];

// Flat list for mobile nav
const mobileNavItems = [
  { id: 'analyze', icon: Search, label: 'Analyze' },
  { id: 'chat', icon: Sparkles, label: 'AI' },
  { id: 'templates', icon: FileText, label: 'Letters' },
  { id: 'tracker', icon: Calendar, label: 'Track' },
  { id: 'flagged', icon: Flag, label: 'Flagged' },
];

export default function Dashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('analyze');

  // Synced storage (Vercel KV + localStorage fallback)
  const {
    disputes,
    setDisputes,
    auditLog,
    setAuditLog,
    flaggedItems,
    setFlaggedItems,
    isLoading,
    isSyncing,
    lastSyncError
  } = useSyncedStorage(user?.id);

  const logAction = useCallback((action, details) => {
    setAuditLog(prev => [{
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action,
      details
    }, ...prev]);
  }, [setAuditLog]);

  // Show loading state while initial data loads
  if (isLoading) {
    return (
      <>
        <style jsx global>{dashboardStyles}</style>
        <div className="dashboard">
          <div className="loading-overlay">
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style jsx global>{dashboardStyles}</style>

      <div className="dashboard">
        {/* Desktop Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <Link href="/" className="logo">
              <span>605b</span>
              <span className="logo-accent">.ai</span>
            </Link>
          </div>
          <nav className="nav">
            {navSections.map((section, sIdx) => (
              <div key={sIdx}>
                <div className="nav-section-label">{section.label}</div>
                {section.items.map(tab => (
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
              </div>
            ))}
          </nav>
          <div className="sidebar-footer">
            <UserButton afterSignOutUrl="/" />
            <div style={{ flex: 1 }}>
              <span className="user-name">{user?.firstName || 'User'}</span>
              <div className={`sync-indicator ${isSyncing ? 'syncing' : ''} ${lastSyncError ? 'error' : ''}`}>
                {isSyncing ? (
                  <><Cloud size={12} /> Syncing...</>
                ) : lastSyncError ? (
                  <><CloudOff size={12} /> Offline</>
                ) : (
                  <><Cloud size={12} /> Synced</>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="mobile-header">
          <Link href="/" className="logo">
            <span>605b</span>
            <span className="logo-accent">.ai</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={`sync-indicator ${isSyncing ? 'syncing' : ''} ${lastSyncError ? 'error' : ''}`}>
              {isSyncing ? <Cloud size={14} /> : lastSyncError ? <CloudOff size={14} /> : <Cloud size={14} />}
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="mobile-nav">
          <div className="mobile-nav-items">
            {mobileNavItems.map(tab => (
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
          {activeTab === 'analyze' && (
            <AnalyzeTab
              flaggedItems={flaggedItems}
              setFlaggedItems={setFlaggedItems}
              logAction={logAction}
            />
          )}

          {activeTab === 'chat' && (
            <ChatTab logAction={logAction} />
          )}

          {activeTab === 'templates' && (
            <TemplatesTab />
          )}

          {activeTab === 'tracker' && (
            <TrackerTab
              disputes={disputes}
              setDisputes={setDisputes}
              logAction={logAction}
            />
          )}

          {activeTab === 'flagged' && (
            <FlaggedTab
              flaggedItems={flaggedItems}
              setFlaggedItems={setFlaggedItems}
              setDisputes={setDisputes}
              logAction={logAction}
            />
          )}

          {activeTab === 'audit' && (
            <AuditTab
              auditLog={auditLog}
              disputes={disputes}
              flaggedItems={flaggedItems}
            />
          )}
        </main>

        {/* Command Palette AI - available on all pages except Chat */}
        <CommandPalette currentTab={activeTab} />
      </div>
    </>
  );
}
