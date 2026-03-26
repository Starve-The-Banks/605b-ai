"use client";

import { useState } from 'react';
import { Settings, Bell, Shield, Trash2, ChevronRight } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function SettingsPage() {
  const { user } = useUser();
  const [saved, setSaved] = useState(false);
  const [preferences, setPreferences] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('605b_settings') || '{}');
      } catch {
        return {};
      }
    }
    return {};
  });

  const savePreferences = (updated) => {
    setPreferences(updated);
    try {
      localStorage.setItem('605b_settings', JSON.stringify(updated));
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggle = (key) => savePreferences({ ...preferences, [key]: !preferences[key] });

  const sections = [
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { key: 'deadlineReminders', label: 'Deadline reminders', description: 'Get notified before dispute deadlines' },
        { key: 'weeklyDigest', label: 'Weekly digest', description: 'Weekly summary of dispute activity' },
      ],
    },
    {
      title: 'Privacy',
      icon: Shield,
      items: [
        { key: 'analytics', label: 'Usage analytics', description: 'Help improve the product with anonymous usage data' },
      ],
    },
  ];

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={24} style={{ color: 'var(--orange)' }} />
          Settings
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Manage your preferences and account settings.</p>
      </div>

      {saved && (
        <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '14px', color: '#22c55e' }}>
          Settings saved.
        </div>
      )}

      {sections.map(({ title, icon: Icon, items }) => (
        <div key={title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon size={18} style={{ color: 'var(--orange)' }} />
            <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>{title}</span>
          </div>
          {items.map(({ key, label, description }) => (
            <div key={key} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>{label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{description}</div>
              </div>
              <button
                onClick={() => toggle(key)}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  background: preferences[key] ? 'var(--orange)' : 'var(--border)',
                  border: 'none', cursor: 'pointer', position: 'relative',
                  transition: 'background 0.2s', flexShrink: 0,
                }}
                aria-label={`Toggle ${label}`}
              >
                <span style={{
                  position: 'absolute', top: '2px',
                  left: preferences[key] ? '22px' : '2px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'white', transition: 'left 0.2s',
                }} />
              </button>
            </div>
          ))}
        </div>
      ))}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Trash2 size={18} style={{ color: '#ef4444' }} />
          <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>Data</span>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>Clear local data</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Remove all locally stored disputes, flags, and audit logs</div>
          </div>
          <button
            onClick={() => {
              if (confirm('Clear all local data? This cannot be undone.')) {
                ['605b_disputes', '605b_flagged', '605b_audit_log', '605b_notifications', '605b_onboarding_complete'].forEach(k => {
                  try { localStorage.removeItem(k); } catch {}
                });
              }
            }}
            style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            Clear data
          </button>
        </div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>Delete account</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Permanently remove your account and all data</div>
          </div>
          <Link href="/delete-account" style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Delete <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
