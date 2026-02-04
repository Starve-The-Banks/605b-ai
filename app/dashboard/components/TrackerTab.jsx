"use client";

import { useState } from 'react';
import { Clock, AlertTriangle, CheckCircle, XCircle, Plus, ChevronRight, Calendar, Mail, Building } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'warning', icon: Clock },
  overdue: { label: 'Overdue', color: 'danger', icon: AlertTriangle },
  resolved: { label: 'Resolved', color: 'success', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'danger', icon: XCircle },
};

export default function TrackerTab({ disputes = [], setDisputes, logAction }) {
  const [filter, setFilter] = useState('all');
  
  // Demo data if no disputes
  const displayDisputes = disputes.length > 0 ? disputes : [
    {
      id: 1,
      type: '605B Identity Theft Block',
      bureau: 'Experian',
      account: 'Capital One Collection #4821',
      status: 'pending',
      createdAt: '2026-01-02T10:00:00Z',
      deadline: '2026-01-08T10:00:00Z',
      progress: 50
    },
    {
      id: 2,
      type: '611 Standard Dispute',
      bureau: 'TransUnion',
      account: 'Unknown Medical Account',
      status: 'overdue',
      createdAt: '2025-12-05T10:00:00Z',
      deadline: '2026-01-04T10:00:00Z',
      progress: 100
    },
    {
      id: 3,
      type: '609 Method of Verification',
      bureau: 'Equifax',
      account: 'Midland Credit Collection',
      status: 'pending',
      createdAt: '2025-12-28T10:00:00Z',
      deadline: '2026-01-27T10:00:00Z',
      progress: 25
    },
  ];

  const filteredDisputes = filter === 'all' 
    ? displayDisputes 
    : displayDisputes.filter(d => d.status === filter);

  const getDaysRemaining = (deadline) => {
    const now = new Date();
    const due = new Date(deadline);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const updateStatus = (id, newStatus) => {
    if (setDisputes) {
      setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
      logAction?.('DISPUTE_STATUS_UPDATED', { disputeId: id, newStatus });
    }
  };

  return (
    <>
      <style jsx>{`
        .tracker-container {
          padding: 28px;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .tracker-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .stats-row {
          display: flex;
          gap: 8px;
        }
        
        .stat-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          font-size: 13px;
          color: var(--text-secondary);
        }
        
        .stat-badge .count {
          font-weight: 600;
          font-family: 'JetBrains Mono', monospace;
        }
        
        .stat-badge.warning .count {
          color: var(--warning);
        }
        
        .stat-badge.danger .count {
          color: var(--danger);
        }
        
        .add-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: linear-gradient(135deg, var(--accent) 0%, #E55A2B 100%);
          color: var(--bg-deep);
          font-weight: 600;
          font-size: 14px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .add-btn:hover {
          box-shadow: 0 4px 20px var(--accent-glow);
          transform: translateY(-2px);
        }
        
        .filter-tabs {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          margin-bottom: 24px;
        }
        
        .filter-tab {
          padding: 8px 16px;
          background: transparent;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .filter-tab:hover {
          color: var(--text-secondary);
        }
        
        .filter-tab.active {
          background: var(--bg-elevated);
          color: var(--text-primary);
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
        
        .section-count {
          padding: 4px 10px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          font-family: 'JetBrains Mono', monospace;
        }
        
        .disputes-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .dispute-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .dispute-card:hover {
          border-color: var(--border-default);
          background: var(--bg-card-hover);
        }
        
        .dispute-card.pending {
          border-left: 3px solid var(--warning);
        }
        
        .dispute-card.overdue {
          border-left: 3px solid var(--danger);
        }
        
        .dispute-card.resolved {
          border-left: 3px solid var(--success);
        }
        
        .status-indicator {
          position: relative;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .status-indicator::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid currentColor;
          opacity: 0.2;
        }
        
        .status-indicator.pending {
          background: var(--warning);
          color: var(--warning);
          box-shadow: 0 0 12px rgba(251, 146, 60, 0.4);
        }
        
        .status-indicator.overdue {
          background: var(--danger);
          color: var(--danger);
          box-shadow: 0 0 12px rgba(248, 113, 113, 0.4);
          animation: pulse-status 1.5s infinite;
        }
        
        .status-indicator.resolved {
          background: var(--success);
          color: var(--success);
        }
        
        @keyframes pulse-status {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        
        .dispute-info {
          flex: 1;
          min-width: 0;
        }
        
        .dispute-title {
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .dispute-bureau {
          padding: 3px 8px;
          background: var(--bg-elevated);
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          color: var(--text-muted);
        }
        
        .dispute-meta {
          font-size: 12px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .progress-container {
          width: 80px;
          flex-shrink: 0;
        }
        
        .progress-bar {
          height: 4px;
          background: var(--bg-elevated);
          border-radius: 2px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-muted) 0%, var(--accent) 100%);
          border-radius: 2px;
          transition: width 0.3s;
        }
        
        .progress-fill.overdue {
          background: var(--danger);
        }
        
        .deadline-info {
          text-align: right;
          flex-shrink: 0;
          min-width: 90px;
        }
        
        .deadline-days {
          font-size: 14px;
          font-weight: 600;
          font-family: 'JetBrains Mono', monospace;
          margin-bottom: 2px;
        }
        
        .deadline-days.warning {
          color: var(--warning);
        }
        
        .deadline-days.danger {
          color: var(--danger);
        }
        
        .deadline-days.success {
          color: var(--success);
        }
        
        .deadline-date {
          font-size: 11px;
          color: var(--text-muted);
        }
        
        .dispute-chevron {
          color: var(--text-muted);
          flex-shrink: 0;
        }
        
        .empty-state {
          text-align: center;
          padding: 60px 20px;
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
          margin-bottom: 24px;
        }
        
        @media (max-width: 768px) {
          .tracker-container {
            padding: 20px 16px;
          }
          
          .tracker-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }
          
          .header-left {
            flex-direction: column;
            align-items: stretch;
          }
          
          .stats-row {
            flex-wrap: wrap;
          }
          
          .dispute-card {
            flex-wrap: wrap;
            gap: 12px;
          }
          
          .progress-container {
            width: 100%;
            order: 10;
          }
          
          .deadline-info {
            text-align: left;
          }
        }
      `}</style>

      <div className="tracker-container">
        <div className="tracker-header">
          <div className="header-left">
            <div className="stats-row">
              <div className="stat-badge warning">
                <Clock size={14} />
                <span className="count">{displayDisputes.filter(d => d.status === 'pending').length}</span>
                <span>Pending</span>
              </div>
              <div className="stat-badge danger">
                <AlertTriangle size={14} />
                <span className="count">{displayDisputes.filter(d => d.status === 'overdue').length}</span>
                <span>Overdue</span>
              </div>
            </div>
          </div>
          
          <button className="add-btn">
            <Plus size={18} />
            Add Dispute
          </button>
        </div>
        
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({displayDisputes.length})
          </button>
          <button 
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-tab ${filter === 'overdue' ? 'active' : ''}`}
            onClick={() => setFilter('overdue')}
          >
            Overdue
          </button>
          <button 
            className={`filter-tab ${filter === 'resolved' ? 'active' : ''}`}
            onClick={() => setFilter('resolved')}
          >
            Resolved
          </button>
        </div>
        
        <div className="section-header">
          <h2 className="section-title">Active Disputes</h2>
          <span className="section-count">{filteredDisputes.length} items</span>
        </div>
        
        {filteredDisputes.length > 0 ? (
          <div className="disputes-list">
            {filteredDisputes.map(dispute => {
              const days = getDaysRemaining(dispute.deadline);
              const isOverdue = days < 0;
              
              return (
                <div key={dispute.id} className={`dispute-card ${dispute.status}`}>
                  <div className={`status-indicator ${dispute.status}`} />
                  
                  <div className="dispute-info">
                    <div className="dispute-title">
                      {dispute.bureau}
                      <span className="dispute-bureau">{dispute.type}</span>
                    </div>
                    <div className="dispute-meta">
                      <span className="meta-item">
                        <Building size={12} />
                        {dispute.account}
                      </span>
                      <span className="meta-item">
                        <Calendar size={12} />
                        Sent {formatDate(dispute.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div 
                        className={`progress-fill ${isOverdue ? 'overdue' : ''}`}
                        style={{ width: `${Math.min(dispute.progress, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="deadline-info">
                    <div className={`deadline-days ${isOverdue ? 'danger' : days <= 3 ? 'warning' : ''}`}>
                      {isOverdue ? 'OVERDUE' : `${days}d left`}
                    </div>
                    <div className="deadline-date">
                      {isOverdue ? 'Was due' : 'Due'} {formatDate(dispute.deadline)}
                    </div>
                  </div>
                  
                  <ChevronRight className="dispute-chevron" size={18} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Clock size={32} />
            </div>
            <div className="empty-title">No disputes found</div>
            <div className="empty-desc">
              {filter !== 'all' ? 'Try changing your filter' : 'Start by adding a new dispute to track'}
            </div>
            <button className="add-btn">
              <Plus size={18} />
              Add Your First Dispute
            </button>
          </div>
        )}
      </div>
    </>
  );
}
