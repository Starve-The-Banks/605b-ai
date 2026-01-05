"use client";

import { Download, Scale, FileText } from 'lucide-react';

export default function AuditTab({ auditLog, disputes, flaggedItems }) {
  const exportData = () => {
    const data = JSON.stringify({
      auditLog,
      disputes,
      flaggedItems,
      exportedAt: new Date().toISOString()
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `605b_audit_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">Evidence trail</p>
        </div>
        <button className="btn-secondary" onClick={exportData}>
          <Download size={16} /> Export
        </button>
      </div>
      <div className="audit-notice"><Scale size={16} /> This log serves as evidence for CFPB complaints.</div>
      {auditLog.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><FileText size={28} /></div>
          <div className="empty-title">No actions logged</div>
        </div>
      ) : (
        auditLog.map(entry => (
          <div key={entry.id} className="audit-entry">
            <div className="audit-timestamp">{new Date(entry.timestamp).toLocaleString()}</div>
            <div className="audit-action">{entry.action}</div>
            {Object.keys(entry.details).length > 0 && <div className="audit-details">{JSON.stringify(entry.details)}</div>}
          </div>
        ))
      )}
    </div>
  );
}
