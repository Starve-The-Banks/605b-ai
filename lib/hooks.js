"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

// Hook for synced storage (Vercel KV + localStorage fallback)
export function useSyncedStorage(userId) {
  const [disputes, setDisputesState] = useState([]);
  const [auditLog, setAuditLogState] = useState([]);
  const [flaggedItems, setFlaggedItemsState] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState(null);
  const initialLoadDone = useRef(false);

  // Refs to track latest values for sync (avoids stale closure)
  const disputesRef = useRef(disputes);
  const auditLogRef = useRef(auditLog);
  const flaggedItemsRef = useRef(flaggedItems);
  const syncTimeoutRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => { disputesRef.current = disputes; }, [disputes]);
  useEffect(() => { auditLogRef.current = auditLog; }, [auditLog]);
  useEffect(() => { flaggedItemsRef.current = flaggedItems; }, [flaggedItems]);

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
      } catch {
        // Fall back to localStorage if server fails
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Debounced sync to server using refs to get latest values
  const syncToServer = useCallback(() => {
    if (!userId) return;

    // Clear any pending sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Schedule new sync
    syncTimeoutRef.current = setTimeout(async () => {
      setIsSyncing(true);
      setLastSyncError(null);

      try {
        const response = await fetch('/api/user-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            disputes: disputesRef.current,
            auditLog: auditLogRef.current,
            flaggedItems: flaggedItemsRef.current
          })
        });

        if (!response.ok) {
          throw new Error('Failed to sync');
        }
      } catch (error) {
        setLastSyncError(error.message);
      } finally {
        setIsSyncing(false);
      }
    }, 1000);
  }, [userId]);

  // Wrapper setters that also sync
  const setDisputes = useCallback((updater) => {
    setDisputesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('605b_disputes', JSON.stringify(next));
      return next;
    });
    syncToServer();
  }, [syncToServer]);

  const setAuditLog = useCallback((updater) => {
    setAuditLogState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('605b_audit', JSON.stringify(next));
      return next;
    });
    syncToServer();
  }, [syncToServer]);

  const setFlaggedItems = useCallback((updater) => {
    setFlaggedItemsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('605b_flagged', JSON.stringify(next));
      return next;
    });
    syncToServer();
  }, [syncToServer]);

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
