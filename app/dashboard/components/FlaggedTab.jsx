"use client";

import { Flag, Plus, Trash2 } from 'lucide-react';
import { SEVERITY_COLORS } from '@/lib/constants';

function calculateDeadline(type) {
  const now = new Date();
  const days = type === '605B' ? 4 : 30;
  let count = 0;
  while (count < days) {
    now.setDate(now.getDate() + 1);
    if (now.getDay() !== 0 && now.getDay() !== 6) count++;
  }
  return now.toISOString();
}

export default function FlaggedTab({ flaggedItems, setFlaggedItems, setDisputes, logAction }) {
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

  const removeItem = (item) => {
    setFlaggedItems(prev => prev.filter(f => f.id !== item.id));
  };

  return (
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
              <span className="severity-badge" style={{ background: `${SEVERITY_COLORS[item.severity]}20`, color: SEVERITY_COLORS[item.severity] }}>{item.severity?.toUpperCase()}</span>
              <span className="statute-tag">{item.statute}</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{item.account}</div>
            <div style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '16px' }}>{item.issue}</div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => createDisputeFromFlagged(item)}><Plus size={14} /> Create Dispute</button>
              <button className="btn-secondary" onClick={() => removeItem(item)}><Trash2 size={14} /> Remove</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
