"use client";

import { useEffect, useState } from 'react';
import { FileCheck, Clock, Trash2 } from 'lucide-react';

export default function AuditLogPage() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    try {
      setEntries(JSON.parse(localStorage.getItem('605b_audit_log') || '[]').reverse());
    } catch {
      setEntries([]);
    }
  }, []);

  const clearLog = () => {
    if (confirm('Clear audit log? This cannot be undone.')) {
      try { localStorage.removeItem('605b_audit_log'); } catch {}
      setEntries([]);
    }
  };

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCheck size={24} style={{ color: 'var(--orange)' }} />
            Audit Log
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>A record of all actions taken in this session.</p>
        </div>
        {entries.length > 0 && (
          <button onClick={clearLog} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}>
            <Trash2 size={14} /> Clear log
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <FileCheck size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>No actions logged yet</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Actions like analyzing reports and managing disputes will appear here.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          {entries.map((entry, i) => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: i < entries.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Clock size={14} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
                  {entry.action}
                </div>
                {entry.data && Object.keys(entry.data).length > 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
                    {JSON.stringify(entry.data)}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {formatTime(entry.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
