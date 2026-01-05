"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

// Debounce utility
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Hook for synced storage (Vercel KV + localStorage fallback)
export function useSyncedStorage(userId) {
  const [disputes, setDisputesState] = useState([]);
  const [auditLog, setAuditLogState] = useState([]);
  const [flaggedItems, setFlaggedItemsState] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState(null);
  const initialLoadDone = useRef(false);

  // Load data from server on mount
  useEffect(() => {
    if (!userId || initialLoadDone.current) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/user-data');
        if (response.ok) {
          const data = await response.json();
          setDisputesState(data.disputes || []);
          setAuditLogState(data.auditLog || []);
          setFlaggedItemsState(data.flaggedItems || []);
          // Also update localStorage as fallback
          localStorage.setItem('605b_disputes', JSON.stringify(data.disputes || []));
          localStorage.setItem('605b_audit', JSON.stringify(data.auditLog || []));
          localStorage.setItem('605b_flagged', JSON.stringify(data.flaggedItems || []));
        } else {
          // Fall back to localStorage if server fails
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Failed to load from server, using localStorage:', error);
        loadFromLocalStorage();
      } finally {
        setIsLoading(false);
        initialLoadDone.current = true;
      }
    };

    const loadFromLocalStorage = () => {
      try {
        const savedDisputes = localStorage.getItem('605b_disputes');
        const savedAudit = localStorage.getItem('605b_audit');
        const savedFlagged = localStorage.getItem('605b_flagged');
        setDisputesState(savedDisputes ? JSON.parse(savedDisputes) : []);
        setAuditLogState(savedAudit ? JSON.parse(savedAudit) : []);
        setFlaggedItemsState(savedFlagged ? JSON.parse(savedFlagged) : []);
      } catch {
        // Ignore parse errors
      }
    };

    loadData();
  }, [userId]);

  // Sync to server (debounced)
  const syncToServer = useCallback(
    debounce(async (data) => {
      if (!userId) return;

      setIsSyncing(true);
      setLastSyncError(null);

      try {
        const response = await fetch('/api/user-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          throw new Error('Failed to sync');
        }
      } catch (error) {
        console.error('Sync error:', error);
        setLastSyncError(error.message);
      } finally {
        setIsSyncing(false);
      }
    }, 1000),
    [userId]
  );

  // Wrapper setters that also sync
  const setDisputes = useCallback((updater) => {
    setDisputesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('605b_disputes', JSON.stringify(next));
      // Get current state for sync
      syncToServer({
        disputes: next,
        auditLog: auditLog,
        flaggedItems: flaggedItems
      });
      return next;
    });
  }, [syncToServer, auditLog, flaggedItems]);

  const setAuditLog = useCallback((updater) => {
    setAuditLogState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('605b_audit', JSON.stringify(next));
      syncToServer({
        disputes: disputes,
        auditLog: next,
        flaggedItems: flaggedItems
      });
      return next;
    });
  }, [syncToServer, disputes, flaggedItems]);

  const setFlaggedItems = useCallback((updater) => {
    setFlaggedItemsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('605b_flagged', JSON.stringify(next));
      syncToServer({
        disputes: disputes,
        auditLog: auditLog,
        flaggedItems: next
      });
      return next;
    });
  }, [syncToServer, disputes, auditLog]);

  return {
    disputes,
    setDisputes,
    auditLog,
    setAuditLog,
    flaggedItems,
    setFlaggedItems,
    isLoading,
    isSyncing,
    lastSyncError
  };
}
