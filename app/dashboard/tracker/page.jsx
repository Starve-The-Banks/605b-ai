"use client";

import { Clock, Plus, CheckCircle, AlertCircle, Hourglass } from 'lucide-react';

export default function TrackerPage() {
  const disputes = [
    // Empty state - no disputes yet
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>Dispute Tracker</h1>
          <p style={{ fontSize: '14px', color: '#737373' }}>Track deadlines and responses for all your disputes</p>
        </div>
        <button style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          background: 'linear-gradient(135deg, #f7d047 0%, #d4b840 100%)',
          border: 'none',
          borderRadius: '8px',
          color: '#0a0a0b',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          <Plus size={18} />
          New Dispute
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Active', value: '0', icon: Hourglass, color: '#f7d047' },
          { label: 'Pending Response', value: '0', icon: Clock, color: '#3b82f6' },
          { label: 'Resolved', value: '0', icon: CheckCircle, color: '#22c55e' },
          { label: 'Escalated', value: '0', icon: AlertCircle, color: '#ef4444' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: '#121214',
            border: '1px solid #1f1f23',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#737373' }}>{stat.label}</span>
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 600 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {disputes.length === 0 && (
        <div style={{ 
          background: '#121214', 
          border: '1px solid #1f1f23', 
          borderRadius: '12px', 
          padding: '60px 24px', 
          textAlign: 'center' 
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'rgba(247, 208, 71, 0.1)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#f7d047'
          }}>
            <Clock size={32} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No Active Disputes</h2>
          <p style={{ fontSize: '14px', color: '#737373', maxWidth: '400px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Start tracking your disputes to monitor deadlines and bureau responses. 
            We'll calculate the 30-day response window automatically.
          </p>
          <button style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'rgba(247, 208, 71, 0.1)',
            border: '1px solid rgba(247, 208, 71, 0.3)',
            borderRadius: '8px',
            color: '#f7d047',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}>
            <Plus size={18} />
            Add Your First Dispute
          </button>
        </div>
      )}
    </>
  );
}
