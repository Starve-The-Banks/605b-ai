"use client";

import { FileCheck, Download, Filter } from 'lucide-react';

export default function AuditLogPage() {
  const auditEntries = [];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>Audit Log</h1>
          <p style={{ fontSize: '14px', color: '#737373' }}>Complete record of all actions for potential litigation</p>
        </div>
        <button style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          background: '#121214',
          border: '1px solid #1f1f23',
          borderRadius: '8px',
          color: '#e5e5e5',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer'
        }}>
          <Download size={18} />
          Export Log
        </button>
      </div>

      {/* Empty State */}
      {auditEntries.length === 0 && (
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
            <FileCheck size={32} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No Activity Yet</h2>
          <p style={{ fontSize: '14px', color: '#737373', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
            All your actions will be logged here automatically—uploads, disputes sent, 
            responses received, and more. This creates a paper trail for potential legal action.
          </p>
        </div>
      )}
    </>
  );
}
