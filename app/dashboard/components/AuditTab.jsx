"use client";

import { useState } from 'react';
import { ScrollText, Download, Filter, Search, Clock, FileText, MessageSquare, Flag, AlertTriangle } from 'lucide-react';

const ACTION_ICONS = {
  AI_CHAT: MessageSquare,
  ANALYZE_STARTED: FileText,
  ANALYZE_COMPLETED: FileText,
  TEMPLATE_USED: FileText,
  DISPUTE_CREATED: AlertTriangle,
  DISPUTE_STATUS_UPDATED: AlertTriangle,
  ITEM_FLAGGED: Flag,
  ITEM_UNFLAGGED: Flag,
  ITEMS_UNFLAGGED: Flag,
};

const ACTION_LABELS = {
  AI_CHAT: 'AI Chat',
  ANALYZE_STARTED: 'Analysis Started',
  ANALYZE_COMPLETED: 'Analysis Completed',
  TEMPLATE_USED: 'Template Used',
  DISPUTE_CREATED: 'Dispute Created',
  DISPUTE_STATUS_UPDATED: 'Status Updated',
  ITEM_FLAGGED: 'Item Flagged',
  ITEM_UNFLAGGED: 'Item Unflagged',
  ITEMS_UNFLAGGED: 'Items Unflagged',
};

export default function AuditTab({ auditLog = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredLog = auditLog.filter(entry => {
    const matchesSearch = !searchQuery || 
      entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(entry.details).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || entry.action.includes(filterType.toUpperCase());
    return matchesSearch && matchesFilter;
  });

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportLog = () => {
    const data = JSON.stringify(auditLog, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style jsx>{`
        .audit-container {
          padding: 28px;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .header-title {
          font-size: 11px;
          font-weight: 700;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }
        
        .header-title::before {
          content: '';
          display: inline-block;
          width: 8px;
          height: 8px;
          background: var(--accent);
          border-radius: 2px;
          margin-right: 10px;
          box-shadow: 0 0 12px var(--accent-glow);
        }
        
        .entry-count {
          padding: 4px 10px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          font-family: 'JetBrains Mono', monospace;
        }
        
        .export-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .export-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        
        .controls {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .search-bar {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          transition: all 0.15s;
        }
        
        .search-bar:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-dim);
        }
        
        .search-icon {
          color: var(--text-muted);
        }
        
        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
        }
        
        .search-input::placeholder {
          color: var(--text-muted);
        }
        
        .filter-select {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          color: var(--text-secondary);
          font-size: 14px;
          cursor: pointer;
        }
        
        .filter-select select {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          cursor: pointer;
        }
        
        .filter-select select option {
          background: var(--bg-card);
          color: var(--text-primary);
        }
        
        .log-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .log-entry {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px 18px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          transition: all 0.15s;
        }
        
        .log-entry:hover {
          border-color: var(--border-default);
        }
        
        .entry-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-dim);
          border-radius: 8px;
          color: var(--accent);
          flex-shrink: 0;
        }
        
        .entry-content {
          flex: 1;
          min-width: 0;
        }
        
        .entry-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }
        
        .entry-action {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .entry-badge {
          padding: 2px 8px;
          background: var(--bg-elevated);
          border-radius: 4px;
          font-size: 10px;
          font-weight: 500;
          color: var(--text-muted);
          font-family: 'JetBrains Mono', monospace;
        }
        
        .entry-details {
          font-size: 13px;
          color: var(--text-secondary);
        }
        
        .entry-time {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-muted);
          flex-shrink: 0;
        }
        
        .empty-state {
          text-align: center;
          padding: 80px 20px;
        }
        
        .empty-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }
        
        .empty-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        
        .empty-desc {
          font-size: 14px;
          color: var(--text-muted);
          max-width: 400px;
          margin: 0 auto;
        }
        
        .info-box {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 18px 20px;
          background: var(--accent-subtle);
          border: 1px solid var(--border-accent);
          border-radius: 12px;
          margin-bottom: 24px;
        }
        
        .info-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-dim);
          border-radius: 10px;
          color: var(--accent);
          flex-shrink: 0;
        }
        
        .info-content {
          flex: 1;
        }
        
        .info-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        
        .info-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        
        @media (max-width: 768px) {
          .audit-container {
            padding: 20px 16px;
          }
          
          .header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }
          
          .controls {
            flex-direction: column;
          }
          
          .log-entry {
            flex-wrap: wrap;
          }
          
          .entry-time {
            width: 100%;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid var(--border-subtle);
          }
        }
      `}</style>

      <div className="audit-container">
        <div className="info-box">
          <div className="info-icon">
            <ScrollText size={20} />
          </div>
          <div className="info-content">
            <div className="info-title">Why This Matters</div>
            <div className="info-desc">
              Your audit log documents every action taken in your credit repair journey. 
              This creates a paper trail that can be used as evidence if you need to 
              escalate to regulators or pursue legal action against bureaus or collectors.
            </div>
          </div>
        </div>
        
        <div className="header">
          <div className="header-left">
            <h2 className="header-title">Activity Log</h2>
            <span className="entry-count">{auditLog.length} entries</span>
          </div>
          
          <button className="export-btn" onClick={exportLog}>
            <Download size={16} />
            Export Log
          </button>
        </div>
        
        <div className="controls">
          <div className="search-bar">
            <Search className="search-icon" size={18} />
            <input 
              type="text"
              className="search-input"
              placeholder="Search activity log..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filter-select">
            <Filter size={16} />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Activity</option>
              <option value="chat">AI Chat</option>
              <option value="analyze">Analysis</option>
              <option value="template">Templates</option>
              <option value="dispute">Disputes</option>
              <option value="flag">Flagged Items</option>
            </select>
          </div>
        </div>
        
        {filteredLog.length > 0 ? (
          <div className="log-list">
            {filteredLog.map(entry => {
              const Icon = ACTION_ICONS[entry.action] || ScrollText;
              return (
                <div key={entry.id} className="log-entry">
                  <div className="entry-icon">
                    <Icon size={16} />
                  </div>
                  <div className="entry-content">
                    <div className="entry-header">
                      <span className="entry-action">
                        {ACTION_LABELS[entry.action] || entry.action}
                      </span>
                      <span className="entry-badge">{entry.action}</span>
                    </div>
                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <div className="entry-details">
                        {Object.entries(entry.details).map(([key, value]) => (
                          <span key={key}>{key}: {String(value)} </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="entry-time">
                    <Clock size={12} />
                    {formatTime(entry.timestamp)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <ScrollText size={32} />
            </div>
            <div className="empty-title">No activity yet</div>
            <div className="empty-desc">
              Your actions will be logged here as you use the app. This creates a record 
              for potential legal proceedings.
            </div>
          </div>
        )}
      </div>
    </>
  );
}
