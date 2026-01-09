'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';

// Offline-first data sync hook
// Reads from localStorage immediately, syncs with Redis in background

export function useDisputes() {
  const { isSignedIn } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const syncedRef = useRef(false);

  // Load from localStorage first
  useEffect(() => {
    const saved = localStorage.getItem('605b_disputes');
    if (saved) {
      try {
        setDisputes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse local disputes:', e);
      }
    }
    setLoading(false);
  }, []);

  // Sync with server
  useEffect(() => {
    if (!isSignedIn || syncedRef.current) return;
    
    const syncWithServer = async () => {
      try {
        setSyncing(true);
        const res = await fetch('/api/user-data/disputes');
        if (res.ok) {
          const { disputes: serverDisputes } = await res.json();
          if (serverDisputes && serverDisputes.length > 0) {
            // Server has data, use it
            setDisputes(serverDisputes);
            localStorage.setItem('605b_disputes', JSON.stringify(serverDisputes));
          } else {
            // Server empty, push local data
            const local = localStorage.getItem('605b_disputes');
            if (local) {
              const localDisputes = JSON.parse(local);
              if (localDisputes.length > 0) {
                await fetch('/api/user-data/disputes', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'sync', disputes: localDisputes }),
                });
              }
            }
          }
        }
        syncedRef.current = true;
      } catch (error) {
        console.error('Failed to sync disputes:', error);
      } finally {
        setSyncing(false);
      }
    };

    syncWithServer();
  }, [isSignedIn]);

  const addDispute = useCallback(async (dispute) => {
    const sentDate = new Date(dispute.dateSent);
    const deadline = new Date(sentDate);
    deadline.setDate(deadline.getDate() + 30);

    const newDispute = {
      ...dispute,
      id: `dispute-${Date.now()}`,
      deadline: deadline.toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Update local first
    const updated = [...disputes, newDispute];
    setDisputes(updated);
    localStorage.setItem('605b_disputes', JSON.stringify(updated));

    // Sync to server
    if (isSignedIn) {
      try {
        await fetch('/api/user-data/disputes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add', dispute: newDispute }),
        });
      } catch (error) {
        console.error('Failed to sync add dispute:', error);
      }
    }

    return newDispute;
  }, [disputes, isSignedIn]);

  const updateDispute = useCallback(async (id, updates) => {
    const updated = disputes.map(d =>
      d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
    );
    setDisputes(updated);
    localStorage.setItem('605b_disputes', JSON.stringify(updated));

    if (isSignedIn) {
      try {
        await fetch('/api/user-data/disputes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update', dispute: { id, ...updates } }),
        });
      } catch (error) {
        console.error('Failed to sync update dispute:', error);
      }
    }
  }, [disputes, isSignedIn]);

  const deleteDispute = useCallback(async (id) => {
    const updated = disputes.filter(d => d.id !== id);
    setDisputes(updated);
    localStorage.setItem('605b_disputes', JSON.stringify(updated));

    if (isSignedIn) {
      try {
        await fetch('/api/user-data/disputes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', dispute: { id } }),
        });
      } catch (error) {
        console.error('Failed to sync delete dispute:', error);
      }
    }
  }, [disputes, isSignedIn]);

  return {
    disputes,
    loading,
    syncing,
    addDispute,
    updateDispute,
    deleteDispute,
  };
}

export function useSettings() {
  const { isSignedIn } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    deadlineReminders: true,
    reminderDaysBefore: 3,
    siteNotifications: true,
    voiceEnabled: true,
    voiceSpeed: 1.0,
  });
  const [loading, setLoading] = useState(true);
  const syncedRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('605b_settings');
    if (saved) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch (e) {
        console.error('Failed to parse local settings:', e);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isSignedIn || syncedRef.current) return;

    const syncWithServer = async () => {
      try {
        const res = await fetch('/api/user-data/settings');
        if (res.ok) {
          const { settings: serverSettings } = await res.json();
          if (serverSettings) {
            setSettings(prev => ({ ...prev, ...serverSettings }));
            localStorage.setItem('605b_settings', JSON.stringify(serverSettings));
          }
        }
        syncedRef.current = true;
      } catch (error) {
        console.error('Failed to sync settings:', error);
      }
    };

    syncWithServer();
  }, [isSignedIn]);

  const updateSettings = useCallback(async (updates) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    localStorage.setItem('605b_settings', JSON.stringify(updated));

    if (isSignedIn) {
      try {
        await fetch('/api/user-data/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: updated }),
        });
      } catch (error) {
        console.error('Failed to sync settings:', error);
      }
    }
  }, [settings, isSignedIn]);

  return { settings, loading, updateSettings };
}

export function useProfile() {
  const { isSignedIn } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const syncedRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('605b_user_profile');
    const onboardingComplete = localStorage.getItem('605b_onboarding_complete');
    if (saved) {
      try {
        setProfile({ ...JSON.parse(saved), onboardingComplete: onboardingComplete === 'true' });
      } catch (e) {
        console.error('Failed to parse local profile:', e);
      }
    } else if (onboardingComplete === 'true') {
      setProfile({ onboardingComplete: true });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isSignedIn || syncedRef.current) return;

    const syncWithServer = async () => {
      try {
        const res = await fetch('/api/user-data/profile');
        if (res.ok) {
          const { profile: serverProfile } = await res.json();
          if (serverProfile) {
            setProfile(serverProfile);
            localStorage.setItem('605b_user_profile', JSON.stringify(serverProfile));
            localStorage.setItem('605b_onboarding_complete', 'true');
          }
        }
        syncedRef.current = true;
      } catch (error) {
        console.error('Failed to sync profile:', error);
      }
    };

    syncWithServer();
  }, [isSignedIn]);

  const saveProfile = useCallback(async (profileData) => {
    const updated = { ...profileData, onboardingComplete: true };
    setProfile(updated);
    localStorage.setItem('605b_user_profile', JSON.stringify(updated));
    localStorage.setItem('605b_onboarding_complete', 'true');

    if (isSignedIn) {
      try {
        await fetch('/api/user-data/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: profileData }),
        });
      } catch (error) {
        console.error('Failed to sync profile:', error);
      }
    }
  }, [isSignedIn]);

  return { profile, loading, saveProfile };
}

export function useAuditLog() {
  const { isSignedIn } = useAuth();
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditLog = useCallback(async (limit = 100) => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/user-data/audit?limit=${limit}`);
      if (res.ok) {
        const { auditLog: serverLog } = await res.json();
        setAuditLog(serverLog || []);
      }
    } catch (error) {
      console.error('Failed to fetch audit log:', error);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  const logAction = useCallback(async (entry) => {
    if (!isSignedIn) return;

    try {
      await fetch('/api/user-data/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry }),
      });
      // Refresh
      fetchAuditLog();
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  }, [isSignedIn, fetchAuditLog]);

  const exportCSV = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      const res = await fetch('/api/user-data/audit?format=csv&limit=500');
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `605b-audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export audit log:', error);
    }
  }, [isSignedIn]);

  return { auditLog, loading, logAction, exportCSV, refresh: fetchAuditLog };
}

export function useFlaggedItems() {
  const { isSignedIn } = useAuth();
  const [flaggedItems, setFlaggedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const syncedRef = useRef(false);

  // Load from localStorage first
  useEffect(() => {
    const saved = localStorage.getItem('605b_flagged');
    if (saved) {
      try {
        setFlaggedItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse local flagged items:', e);
      }
    }
    setLoading(false);
  }, []);

  // Sync with server
  useEffect(() => {
    if (!isSignedIn || syncedRef.current) return;

    const syncWithServer = async () => {
      try {
        setSyncing(true);
        const res = await fetch('/api/user-data/flagged');
        if (res.ok) {
          const { flaggedItems: serverItems } = await res.json();
          if (serverItems && serverItems.length > 0) {
            setFlaggedItems(serverItems);
            localStorage.setItem('605b_flagged', JSON.stringify(serverItems));
          }
        }
        syncedRef.current = true;
      } catch (error) {
        console.error('Failed to sync flagged items:', error);
      } finally {
        setSyncing(false);
      }
    };

    syncWithServer();
  }, [isSignedIn]);

  // Save findings from PDF analysis
  const saveFindings = useCallback(async (findings) => {
    const items = findings.map((item, index) => ({
      ...item,
      id: item.id || `flagged-${Date.now()}-${index}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }));

    setFlaggedItems(items);
    localStorage.setItem('605b_flagged', JSON.stringify(items));

    if (isSignedIn) {
      try {
        await fetch('/api/user-data/flagged', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save', items }),
        });
      } catch (error) {
        console.error('Failed to sync flagged items:', error);
      }
    }
  }, [isSignedIn]);

  // Mark item as disputed (when added to tracker)
  const markDisputed = useCallback(async (itemId, disputeId) => {
    const updated = flaggedItems.map(item =>
      item.id === itemId
        ? { ...item, status: 'disputed', disputeId, updatedAt: new Date().toISOString() }
        : item
    );
    setFlaggedItems(updated);
    localStorage.setItem('605b_flagged', JSON.stringify(updated));

    if (isSignedIn) {
      try {
        await fetch('/api/user-data/flagged', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update', itemId, updates: { status: 'disputed', disputeId } }),
        });
      } catch (error) {
        console.error('Failed to update flagged item:', error);
      }
    }
  }, [flaggedItems, isSignedIn]);

  // Dismiss item
  const dismissItem = useCallback(async (itemId) => {
    const updated = flaggedItems.map(item =>
      item.id === itemId
        ? { ...item, status: 'dismissed', updatedAt: new Date().toISOString() }
        : item
    );
    setFlaggedItems(updated);
    localStorage.setItem('605b_flagged', JSON.stringify(updated));

    if (isSignedIn) {
      try {
        await fetch('/api/user-data/flagged', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'dismiss', itemId }),
        });
      } catch (error) {
        console.error('Failed to dismiss flagged item:', error);
      }
    }
  }, [flaggedItems, isSignedIn]);

  // Clear all
  const clearAll = useCallback(async () => {
    setFlaggedItems([]);
    localStorage.setItem('605b_flagged', JSON.stringify([]));

    if (isSignedIn) {
      try {
        await fetch('/api/user-data/flagged', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear' }),
        });
      } catch (error) {
        console.error('Failed to clear flagged items:', error);
      }
    }
  }, [isSignedIn]);

  return {
    flaggedItems,
    loading,
    syncing,
    saveFindings,
    markDisputed,
    dismissItem,
    clearAll,
  };
}
