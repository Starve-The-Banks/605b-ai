"use client";

import { Plus, Calendar, Clock, AlertCircle, CheckCircle2, X } from 'lucide-react';

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

function getDaysRemaining(deadline) {
  return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TrackerTab({ disputes, setDisputes, logAction }) {
  const addDispute = () => {
    const agency = prompt('Agency name:');
    const type = prompt('Type (605B or 611):');
    if (agency && type) {
      setDisputes(prev => [{
        id: Date.now(),
        agency,
        type: type.toUpperCase(),
        createdAt: new Date().toISOString(),
        deadline: calculateDeadline(type.toUpperCase()),
        status: 'pending'
      }, ...prev]);
      logAction('DISPUTE_CREATED', { agency, type });
    }
  };

  const markResponded = (dispute) => {
    setDisputes(prev => prev.map(x => x.id === dispute.id ? {...x, status: 'responded'} : x));
    logAction('RESPONSE_RECEIVED', { agency: dispute.agency });
  };

  const deleteDispute = (id) => {
    setDisputes(prev => prev.filter(x => x.id !== id));
  };

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dispute Tracker</h1>
          <p className="page-subtitle">Monitor deadlines</p>
        </div>
        <button className="btn-primary" onClick={addDispute}><Plus size={16} /> Add</button>
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
                <button className="action-btn" onClick={() => markResponded(d)}>
                  <CheckCircle2 size={14} style={{ color: '#22c55e' }} /> Responded
                </button>
                <button className="action-btn" onClick={() => deleteDispute(d.id)}>
                  <X size={14} style={{ color: '#ef4444' }} /> Delete
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
