"use client";

import { useEffect, useState } from 'react';
import { TrendingUp, CheckCircle, Clock, AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ProgressPage() {
  const [stats, setStats] = useState({ disputes: 0, resolved: 0, pending: 0, flagged: 0 });

  useEffect(() => {
    try {
      const disputes = JSON.parse(localStorage.getItem('605b_disputes') || '[]');
      const flagged = JSON.parse(localStorage.getItem('605b_flagged') || '[]');
      setStats({
        disputes: disputes.length,
        resolved: disputes.filter(d => d.status === 'resolved').length,
        pending: disputes.filter(d => d.status === 'pending').length,
        flagged: flagged.length,
      });
    } catch {}
  }, []);

  const statCards = [
    { label: 'Total Disputes', value: stats.disputes, icon: FileText, color: '#3b82f6' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: '#22c55e' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: '#f59e0b' },
    { label: 'Flagged Items', value: stats.flagged, icon: AlertTriangle, color: '#FF6B35' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={24} style={{ color: 'var(--orange)' }} />
          Progress
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Track your dispute resolution progress over time.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', background: `${color}18`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      {stats.disputes === 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <TrendingUp size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>No disputes tracked yet</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Start by analyzing your credit report or adding disputes to track.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--orange)', borderRadius: '8px', color: 'white', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
              Analyze Report <ArrowRight size={16} />
            </Link>
            <Link href="/dashboard/tracker" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
              Tracker <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
