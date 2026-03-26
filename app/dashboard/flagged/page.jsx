"use client";

import { useState, useCallback } from 'react';
import FlaggedTab from '../components/FlaggedTab';

export default function FlaggedPage() {
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

  const handleSetFlaggedItems = useCallback((updater) => {
    setFlaggedItems(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('605b_flagged', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const logAction = useCallback((action, data) => {
    try {
      const existing = JSON.parse(localStorage.getItem('605b_audit_log') || '[]');
      localStorage.setItem(
        '605b_audit_log',
        JSON.stringify([...existing, { action, data, timestamp: new Date().toISOString() }].slice(-500))
      );
    } catch {}
  }, []);

  return (
    <FlaggedTab
      flaggedItems={flaggedItems}
      setFlaggedItems={handleSetFlaggedItems}
      logAction={logAction}
    />
  );
}
