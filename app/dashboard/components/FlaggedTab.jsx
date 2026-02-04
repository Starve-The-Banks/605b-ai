"use client";

import { useState } from 'react';
import { Flag, AlertTriangle, Trash2, FileText, ChevronRight, CheckCircle } from 'lucide-react';

export default function FlaggedTab({ flaggedItems = [], setFlaggedItems, logAction }) {
  const [selectedItems, setSelectedItems] = useState([]);
  
  const removeItem = (id) => {
    setFlaggedItems?.(prev => prev.filter(item => item.id !== id));
    logAction?.('ITEM_UNFLAGGED', { itemId: id });
  };

  const removeSelected = () => {
    setFlaggedItems?.(prev => prev.filter(item => !selectedItems.includes(item.id)));
    logAction?.('ITEMS_UNFLAGGED', { count: selectedItems.length });
    setSelectedItems([]);
  };

  const toggleSelect = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedItems.length === flaggedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(flaggedItems.map(i => i.id));
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      default: return 'info';
    }
  };

  return (
    <>
      <style jsx>{`
        .flagged-container {
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
        
        .item-count {
          padding: 4px 10px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          font-family: 'JetBrains Mono', monospace;
        }
        
        .header-actions {
          display: flex;
          gap: 10px;
        }
        
        .action-btn {
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
        
        .action-btn.secondary {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
        }
        
        .action-btn.secondary:hover {
          border-color: var(--border-default);
          color: var(--text-primary);
        }
        
        .action-btn.danger {
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.3);
          color: var(--danger);
        }
        
        .action-btn.danger:hover {
          background: rgba(248, 113, 113, 0.2);
        }
        
        .action-btn.primary {
          background: linear-gradient(135deg, var(--accent) 0%, #E55A2B 100%);
          color: var(--bg-deep);
        }
        
        .action-btn.primary:hover {
          box-shadow: 0 4px 16px var(--accent-glow);
        }
        
        .items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .item-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 18px 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          transition: all 0.15s;
        }
        
        .item-card:hover {
          border-color: var(--border-default);
          background: var(--bg-card-hover);
        }
        
        .item-card.selected {
          border-color: var(--accent);
          background: var(--accent-subtle);
        }
        
        .item-card.high {
          border-left: 3px solid var(--danger);
        }
        
        .item-card.medium {
          border-left: 3px solid var(--warning);
        }
        
        .item-card.low {
          border-left: 3px solid var(--info);
        }
        
        .checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid var(--border-default);
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s;
          margin-top: 2px;
        }
        
        .checkbox.checked {
          background: var(--accent);
          border-color: var(--accent);
          color: var(--bg-deep);
        }
        
        .item-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .item-card.high .item-icon {
          background: rgba(248, 113, 113, 0.15);
          color: var(--danger);
        }
        
        .item-card.medium .item-icon {
          background: rgba(251, 146, 60, 0.15);
          color: var(--warning);
        }
        
        .item-card.low .item-icon {
          background: rgba(96, 165, 250, 0.15);
          color: var(--info);
        }
        
        .item-content {
          flex: 1;
          min-width: 0;
        }
        
        .item-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }
        
        .item-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .severity-badge {
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .severity-badge.danger {
          background: rgba(248, 113, 113, 0.15);
          color: var(--danger);
        }
        
        .severity-badge.warning {
          background: rgba(251, 146, 60, 0.15);
          color: var(--warning);
        }
        
        .severity-badge.info {
          background: rgba(96, 165, 250, 0.15);
          color: var(--info);
        }
        
        .item-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 10px;
        }
        
        .item-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: var(--text-muted);
        }
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .item-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        
        .icon-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .icon-btn:hover {
          border-color: var(--border-default);
          color: var(--text-primary);
        }
        
        .icon-btn.danger:hover {
          background: rgba(248, 113, 113, 0.1);
          border-color: rgba(248, 113, 113, 0.3);
          color: var(--danger);
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
        
        @media (max-width: 768px) {
          .flagged-container {
            padding: 20px 16px;
          }
          
          .header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }
          
          .item-card {
            flex-wrap: wrap;
          }
          
          .item-actions {
            width: 100%;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid var(--border-subtle);
          }
        }
      `}</style>

      <div className="flagged-container">
        <div className="header">
          <div className="header-left">
            <h2 className="header-title">Flagged Items</h2>
            <span className="item-count">{flaggedItems.length} items</span>
          </div>
          
          {flaggedItems.length > 0 && (
            <div className="header-actions">
              <button className="action-btn secondary" onClick={selectAll}>
                {selectedItems.length === flaggedItems.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedItems.length > 0 && (
                <button className="action-btn danger" onClick={removeSelected}>
                  <Trash2 size={16} />
                  Remove ({selectedItems.length})
                </button>
              )}
              <button className="action-btn primary">
                <FileText size={16} />
                Generate Letters
              </button>
            </div>
          )}
        </div>
        
        {flaggedItems.length > 0 ? (
          <div className="items-list">
            {flaggedItems.map(item => (
              <div 
                key={item.id} 
                className={`item-card ${item.severity || 'low'} ${selectedItems.includes(item.id) ? 'selected' : ''}`}
              >
                <div 
                  className={`checkbox ${selectedItems.includes(item.id) ? 'checked' : ''}`}
                  onClick={() => toggleSelect(item.id)}
                >
                  {selectedItems.includes(item.id) && <CheckCircle size={14} />}
                </div>
                
                <div className={`item-icon`}>
                  <AlertTriangle size={18} />
                </div>
                
                <div className="item-content">
                  <div className="item-header">
                    <span className="item-title">{item.title}</span>
                    <span className={`severity-badge ${getSeverityColor(item.severity)}`}>
                      {item.severity || 'low'}
                    </span>
                  </div>
                  <p className="item-desc">{item.description}</p>
                  <div className="item-meta">
                    {item.bureau && (
                      <span className="meta-item">
                        <Flag size={12} />
                        {item.bureau}
                      </span>
                    )}
                    <span className="meta-item">
                      Flagged {new Date(item.flaggedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="item-actions">
                  <button className="icon-btn" title="Generate letter">
                    <FileText size={16} />
                  </button>
                  <button 
                    className="icon-btn danger" 
                    title="Remove"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                  <button className="icon-btn" title="View details">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Flag size={32} />
            </div>
            <div className="empty-title">No flagged items</div>
            <div className="empty-desc">
              Items you flag from credit report analysis will appear here for action
            </div>
          </div>
        )}
      </div>
    </>
  );
}
