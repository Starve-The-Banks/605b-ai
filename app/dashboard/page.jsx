"use client";

import { useState, useCallback } from 'react';
import AnalyzeTab from './components/AnalyzeTab';

export default function DashboardPage() {
  const [auditLog, setAuditLog] = useState([]);
  const [flaggedItems, setFlaggedItems] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('605b_flagged') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  });

  const logAction = useCallback((action, data) => {
    const entry = { action, data, timestamp: new Date().toISOString() };
    setAuditLog(prev => {
      const updated = [...prev, entry];
      try {
        const existing = JSON.parse(localStorage.getItem('605b_audit_log') || '[]');
        localStorage.setItem('605b_audit_log', JSON.stringify([...existing, entry].slice(-500)));
      } catch {}
      return updated;
    });
  }, []);

  const addFlaggedItem = useCallback((item) => {
    setFlaggedItems(prev => {
      const updated = [...prev, { ...item, id: Date.now(), flaggedAt: new Date().toISOString() }];
      try {
        localStorage.setItem('605b_flagged', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  return (
    <AnalyzeTab
      logAction={logAction}
      addFlaggedItem={addFlaggedItem}
    />
  );
}
