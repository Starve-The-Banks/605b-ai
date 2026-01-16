"use client";

import { useState, useEffect } from 'react';
import { 
  FileCheck, Download, RefreshCw, FileText, Shield, Clock,
  Flag, Upload, Sparkles, Check, Lock
} from 'lucide-react';
import { useAuditLog } from '@/lib/useUserData';
import { useUserTier } from '@/lib/useUserTier';
import Link from 'next/link';

const ACTION_ICONS = {
  add_dispute: FileText,
  update_dispute: Clock,
  delete_dispute: FileText,
  sync_disputes: RefreshCw,
  complete_onboarding: Check,
  upload_report: Upload,
  generate_letter: FileText,
  flag_item: Flag,
  send_letter: Shield,
};

const ACTION_LABELS = {
  add_dispute: 'Added Dispute',
  update_dispute: 'Updated Dispute',
  delete_dispute: 'Deleted Dispute',
  sync_disputes: 'Synced Disputes',
  complete_onboarding: 'Completed Onboarding',
  upload_report: 'Uploaded Report',
  generate_letter: 'Generated Letter',
  flag_item: 'Flagged Item',
  send_letter: 'Marked Letter Sent',
};

export default function AuditLogPage() {
  const { auditLog, loading, exportCSV, refresh } = useAuditLog();
  const { hasFeature } = useUserTier();
  const [exporting, setExporting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if user can export audit log
  const canExport = hasFeature('auditExport');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleExport = async () => {
    setExporting(true);
    await exportCSV();
    setExporting(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--orange)' }} />
      </div>
    );
  }

  return (
    <>
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center', 
        justifyContent: 'space-between', 
        marginBottom: '24px',
        gap: isMobile ? '16px' : '0',
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 600, marginBottom: '4px' }}>Audit Log</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Complete record of all actions for potential litigation</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={refresh}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          {canExport ? (
            <button 
              onClick={handleExport}
              disabled={exporting || auditLog.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: auditLog.length === 0 ? '#52525b' : '#e5e5e5',
                fontSize: '14px',
                fontWeight: 500,
                cursor: auditLog.length === 0 ? 'not-allowed' : 'pointer',
                opacity: exporting ? 0.7 : 1,
              }}
            >
              {exporting ? (
                <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Download size={18} />
              )}
              Export CSV
            </button>
          ) : (
            <Link
              href="/pricing?highlight=advanced"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: 'var(--orange-dim)',
                border: '1px solid rgba(255, 107, 53, 0.3)',
                borderRadius: '8px',
                color: 'var(--orange)',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              <Lock size={16} />
              Upgrade to Export
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      {auditLog.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '12px' : '16px',
          marginBottom: '24px',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px 20px',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Total Actions</div>
            <div style={{ fontSize: '24px', fontWeight: 600 }}>{auditLog.length}</div>
          </div>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px 20px',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Disputes Added</div>
            <div style={{ fontSize: '24px', fontWeight: 600 }}>
              {auditLog.filter(e => e.action === 'add_dispute').length}
            </div>
          </div>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px 20px',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Reports Analyzed</div>
            <div style={{ fontSize: '24px', fontWeight: 600 }}>
              {auditLog.filter(e => e.action === 'upload_report').length}
            </div>
          </div>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px 20px',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>First Action</div>
            <div style={{ fontSize: '14px', fontWeight: 500 }}>
              {auditLog.length > 0 
                ? new Date(auditLog[auditLog.length - 1]?.timestamp).toLocaleDateString()
                : 'N/A'
              }
            </div>
          </div>
        </div>
      )}

      {/* Audit Log List */}
      {auditLog.length > 0 ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600 }}>Activity History</h2>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{auditLog.length} entries</span>
          </div>

          {auditLog.map((entry, index) => {
            const IconComponent = ACTION_ICONS[entry.action] || FileCheck;
            const label = ACTION_LABELS[entry.action] || entry.action;

            return (
              <div
                key={entry.id || index}
                style={{
                  padding: isMobile ? '14px 16px' : '16px 20px',
                  borderBottom: index < auditLog.length - 1 ? '1px solid #1f1f23' : 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: 'var(--orange-dim)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <IconComponent size={16} style={{ color: 'var(--orange)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {entry.timestamp && new Date(entry.timestamp).toLocaleString()}
                  </div>
                  {(entry.creditor || entry.account || entry.disputeId) && (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {entry.creditor && `Creditor: ${entry.creditor}`}
                      {entry.account && `Account: ${entry.account}`}
                      {entry.bureau && ` • Bureau: ${entry.bureau}`}
                      {entry.findingsCount && `Found ${entry.findingsCount} items`}
                      {entry.situation && `Situation: ${entry.situation}`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border)', 
          borderRadius: '12px', 
          padding: isMobile ? '40px 20px' : '60px 24px', 
          textAlign: 'center' 
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'var(--orange-dim)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: 'var(--orange)'
          }}>
            <FileCheck size={32} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No Activity Yet</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
            All your actions will be logged here automatically—uploads, disputes sent, 
            responses received, and more. This creates a paper trail for potential legal action.
          </p>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
