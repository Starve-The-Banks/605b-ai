"use client";

import { X } from 'lucide-react';
import Image from 'next/image';

export default function Sidebar({ 
  tabs, 
  activeTab, 
  setActiveTab, 
  flaggedCount = 0,
  disputeCount = 0,
  mobileOpen,
  setMobileOpen,
  user
}) {
  const getCount = (tabId) => {
    if (tabId === 'flagged') return flaggedCount;
    if (tabId === 'tracker') return disputeCount;
    if (tabId === 'templates') return 62;
    return null;
  };

  const isAlert = (tabId) => tabId === 'flagged' && flaggedCount > 0;

  return (
    <>
      <style jsx>{`
        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 90;
          backdrop-filter: blur(4px);
        }
        
        .sidebar-overlay.open {
          display: block;
        }
        
        .sidebar {
          background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-deep) 100%);
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          position: relative;
          height: 100vh;
          overflow: hidden;
        }
        
        .sidebar::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 1px;
          height: 100%;
          background: linear-gradient(180deg, var(--accent-dim) 0%, transparent 30%, transparent 70%, var(--accent-dim) 100%);
          pointer-events: none;
        }
        
        .logo-area {
          padding: 24px 20px;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 2px;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        
        .logo-text {
          color: var(--text-primary);
        }
        
        .logo-accent {
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-muted) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .logo-badge {
          margin-left: 8px;
          padding: 3px 6px;
          background: var(--accent-dim);
          border: 1px solid var(--border-accent);
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
          color: var(--accent);
          letter-spacing: 0.5px;
        }
        
        .close-btn {
          display: none;
          width: 32px;
          height: 32px;
          align-items: center;
          justify-content: center;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          color: var(--text-muted);
          cursor: pointer;
        }
        
        .close-btn:hover {
          color: var(--text-primary);
        }
        
        .nav {
          flex: 1;
          padding: 16px 12px;
          overflow-y: auto;
        }
        
        .nav-group {
          margin-bottom: 24px;
        }
        
        .nav-label {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 10px;
          margin-bottom: 8px;
          font-size: 10px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1.2px;
        }
        
        .nav-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, var(--border-subtle) 0%, transparent 100%);
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 12px;
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
          margin-bottom: 2px;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }
        
        .nav-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 0;
          background: var(--accent);
          border-radius: 0 2px 2px 0;
          transition: height 0.15s ease;
          box-shadow: 0 0 8px var(--accent-glow);
        }
        
        .nav-item:hover {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }
        
        .nav-item.active {
          background: linear-gradient(90deg, var(--accent-dim) 0%, transparent 100%);
          color: var(--accent);
        }
        
        .nav-item.active::before {
          height: 20px;
        }
        
        .nav-icon {
          width: 18px;
          height: 18px;
          opacity: 0.6;
          flex-shrink: 0;
        }
        
        .nav-item.active .nav-icon {
          opacity: 1;
        }
        
        .nav-count {
          margin-left: auto;
          min-width: 20px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-card);
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          font-family: 'JetBrains Mono', monospace;
        }
        
        .nav-item.active .nav-count {
          background: var(--accent);
          color: var(--bg-deep);
        }
        
        .nav-count.alert {
          background: var(--danger);
          color: white;
          animation: pulse-alert 2s infinite;
        }
        
        @keyframes pulse-alert {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid var(--border-subtle);
          background: var(--bg-elevated);
        }
        
        .user-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
        }
        
        .user-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--accent-dim) 0%, var(--accent-subtle) 100%);
          border: 1px solid var(--border-accent);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
          color: var(--accent);
          overflow: hidden;
        }
        
        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .user-info {
          flex: 1;
          min-width: 0;
        }
        
        .user-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .user-plan {
          font-size: 11px;
          color: var(--accent-muted);
        }
        
        .resources-section {
          margin-top: auto;
          padding: 0 12px 8px;
        }
        
        .resource-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          color: var(--text-muted);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
          text-decoration: none;
        }
        
        .resource-link:hover {
          background: var(--bg-elevated);
          color: var(--text-secondary);
        }
        
        .resource-icon {
          width: 16px;
          height: 16px;
          opacity: 0.6;
        }
        
        @media (max-width: 1200px) {
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            width: 260px;
            z-index: 100;
            transform: translateX(-100%);
            transition: transform 0.2s ease;
          }
          
          .sidebar.open {
            transform: translateX(0);
          }
          
          .close-btn {
            display: flex;
          }
        }
      `}</style>

      <div 
        className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />
      
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="logo-area">
          <div className="logo">
            <Image
              src="/logos/secondary/605b-chevron-cursor.svg"
              alt="605b"
              width={24}
              height={24}
            />
            <span className="logo-text">605b</span>
            <span className="logo-accent">.ai</span>
            <span className="logo-badge">BETA</span>
          </div>
          <button className="close-btn" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>
        
        <nav className="nav">
          <div className="nav-group">
            <div className="nav-label">Core</div>
            {tabs.slice(0, 2).map(tab => {
              const Icon = tab.icon;
              const count = getCount(tab.id);
              return (
                <button
                  key={tab.id}
                  className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="nav-icon" />
                  {tab.label}
                  {count !== null && (
                    <span className={`nav-count ${isAlert(tab.id) ? 'alert' : ''}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="nav-group">
            <div className="nav-label">Manage</div>
            {tabs.slice(2).map(tab => {
              const Icon = tab.icon;
              const count = getCount(tab.id);
              return (
                <button
                  key={tab.id}
                  className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="nav-icon" />
                  {tab.label}
                  {count !== null && (
                    <span className={`nav-count ${isAlert(tab.id) ? 'alert' : ''}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="resources-section">
            <div className="nav-label">Resources</div>
            <a 
              href="https://www.annualcreditreport.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="resource-link"
            >
              <svg className="resource-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Get Free Reports
            </a>
            <a 
              href="https://www.consumerfinance.gov/complaint" 
              target="_blank" 
              rel="noopener noreferrer"
              className="resource-link"
            >
              <svg className="resource-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              File CFPB Complaint
            </a>
          </div>
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="" />
              ) : (
                user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <div className="user-info">
              <div className="user-name">
                {user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User'}
              </div>
              <div className="user-plan">Pro Plan</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
