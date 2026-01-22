"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';

// Tier hierarchy for comparisons
const TIER_LEVELS = {
  'free': 0,
  'toolkit': 1,
  'advanced': 2,
  'identity-theft': 3,
};

// Polling configuration for post-payment sync
const PAYMENT_POLL_INTERVAL_MS = 2000; // Poll every 2 seconds
const PAYMENT_POLL_MAX_ATTEMPTS = 30; // Max 60 seconds of polling
const PAYMENT_POLL_STORAGE_KEY = '605b_payment_pending';

// Feature definitions by tier
const TIER_FEATURES = {
  free: {
    pdfAnalyses: 1,
    pdfExport: false,
    letterDownloads: false,
    templates: 'none',
    aiChat: false,
    auditExport: false,
    identityTheftWorkflow: false,
    creditorTemplates: false,
    escalationTemplates: false,
    disputeTracker: false,
  },
  toolkit: {
    pdfAnalyses: 1,
    pdfExport: true,
    letterDownloads: true,
    templates: 'basic',
    aiChat: false,
    auditExport: false,
    identityTheftWorkflow: false,
    creditorTemplates: false,
    escalationTemplates: false,
    disputeTracker: true,
  },
  advanced: {
    pdfAnalyses: 3,
    pdfExport: true,
    letterDownloads: true,
    templates: 'full',
    aiChat: true,
    auditExport: true,
    identityTheftWorkflow: false,
    creditorTemplates: true,
    escalationTemplates: true,
    disputeTracker: true,
  },
  'identity-theft': {
    pdfAnalyses: -1, // Unlimited
    pdfExport: true,
    letterDownloads: true,
    templates: 'full',
    aiChat: true,
    auditExport: true,
    identityTheftWorkflow: true,
    creditorTemplates: true,
    escalationTemplates: true,
    disputeTracker: true,
    attorneyExport: true,
  },
};

// Tier display info
const TIER_INFO = {
  free: {
    name: 'Credit Report Analyzer',
    color: '#6b7280',
    upgradeMessage: 'Upgrade to download letters and track disputes',
  },
  toolkit: {
    name: 'Dispute Toolkit',
    color: '#3b82f6',
    upgradeMessage: 'Upgrade for full template library and AI assistance',
  },
  advanced: {
    name: 'Advanced Dispute Suite',
    color: '#FF6B35',
    upgradeMessage: 'Upgrade for identity theft workflows',
  },
  'identity-theft': {
    name: '605B Identity Theft Toolkit',
    color: '#22c55e',
    upgradeMessage: null, // Top tier
  },
};

// Actions that are blocked when access is frozen (but not revoked)
const FROZEN_BLOCKED_ACTIONS = [
  'download_letter',
  'export_audit',
  'analyze_pdf',
  'use_ai_chat',
];

// Actions that require paid access (blocked when revoked)
const PAID_ACTIONS = [
  'download_letter',
  'export_audit',
  'analyze_pdf',
  'use_ai_chat',
  'use_605b_workflow',
  'use_creditor_templates',
  'use_escalation_templates',
];

export function useUserTier() {
  const { isSignedIn } = useAuth();
  const [tierData, setTierData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPollingForPayment, setIsPollingForPayment] = useState(false);
  const [paymentSyncComplete, setPaymentSyncComplete] = useState(false);
  const pollIntervalRef = useRef(null);
  const pollAttemptsRef = useRef(0);

  // Try to get search params (may fail during SSR)
  let searchParams = null;
  try {
    searchParams = useSearchParams();
  } catch (e) {
    // SSR or not in router context
  }

  // Check if we just completed a payment
  const checkForPendingPayment = useCallback(() => {
    // Check URL params for success indicator
    const isPaymentSuccess = searchParams?.get('success') === 'true';
    const purchasedTier = searchParams?.get('tier');
    const purchasedAddon = searchParams?.get('addon');
    const sessionId = searchParams?.get('session_id');

    // Also check localStorage for pending payment flag (survives page refresh)
    const pendingPayment = localStorage.getItem(PAYMENT_POLL_STORAGE_KEY);

    if (isPaymentSuccess || pendingPayment) {
      return {
        isPending: true,
        expectedTier: purchasedTier || (pendingPayment ? JSON.parse(pendingPayment).tier : null),
        expectedAddon: purchasedAddon || (pendingPayment ? JSON.parse(pendingPayment).addon : null),
        sessionId: sessionId || (pendingPayment ? JSON.parse(pendingPayment).sessionId : null),
      };
    }
    return { isPending: false };
  }, [searchParams]);

  // Sync session directly with Stripe (fallback when webhooks are delayed)
  const syncSession = useCallback(async (sessionId) => {
    if (!sessionId || !isSignedIn) return null;

    console.log('[useUserTier] Attempting direct session sync for:', sessionId);

    try {
      const res = await fetch('/api/stripe/sync-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('[useUserTier] Sync session response:', data);

        if (data.granted) {
          // Success! Update local state
          const tierData = data.tierData || {
            tier: data.tier,
            features: TIER_FEATURES[data.tier] || TIER_FEATURES.free,
          };

          setTierData(tierData);
          localStorage.setItem('605b_tier', tierData.tier);
          localStorage.setItem('605b_tier_data', JSON.stringify(tierData));
          localStorage.removeItem(PAYMENT_POLL_STORAGE_KEY);
          setPaymentSyncComplete(true);
          setIsPollingForPayment(false);

          return tierData;
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('[useUserTier] Sync session failed:', res.status, errorData);
      }
    } catch (err) {
      console.error('[useUserTier] Sync session error:', err);
    }

    return null;
  }, [isSignedIn]);

  // Fetch tier data from server (always authoritative)
  const fetchServerTierData = useCallback(async () => {
    if (!isSignedIn) return null;

    try {
      const res = await fetch('/api/user-data/tier', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        return data.tierData || null;
      }
    } catch (err) {
      console.error('Failed to fetch tier data:', err);
    }
    return null;
  }, [isSignedIn]);

  // Poll for entitlement after payment
  const startPaymentPolling = useCallback(async (expectedTier, sessionId = null) => {
    console.log('[useUserTier] Starting payment sync for tier:', expectedTier, 'sessionId:', sessionId);
    setIsPollingForPayment(true);
    pollAttemptsRef.current = 0;

    // Store pending payment in localStorage (survives page refresh)
    localStorage.setItem(PAYMENT_POLL_STORAGE_KEY, JSON.stringify({
      tier: expectedTier,
      sessionId: sessionId,
      startedAt: new Date().toISOString(),
    }));

    // FIRST: Try direct session sync if we have a sessionId
    // This bypasses webhook delays entirely
    if (sessionId) {
      console.log('[useUserTier] Attempting direct sync-session first...');
      const syncResult = await syncSession(sessionId);
      if (syncResult) {
        console.log('[useUserTier] Direct sync-session succeeded!');
        return true;
      }
      console.log('[useUserTier] Direct sync-session did not grant - falling back to polling');
    }

    const poll = async () => {
      pollAttemptsRef.current++;
      console.log(`[useUserTier] Poll attempt ${pollAttemptsRef.current}/${PAYMENT_POLL_MAX_ATTEMPTS}`);

      // Every 5th poll, try sync-session again if we have sessionId
      if (sessionId && pollAttemptsRef.current % 5 === 0) {
        console.log('[useUserTier] Retrying sync-session...');
        const syncResult = await syncSession(sessionId);
        if (syncResult) {
          console.log('[useUserTier] Sync-session succeeded on retry!');
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          return true;
        }
      }

      const serverData = await fetchServerTierData();

      if (serverData) {
        const serverTierLevel = TIER_LEVELS[serverData.tier] || 0;
        const expectedTierLevel = TIER_LEVELS[expectedTier] || 0;

        // Check if entitlement has been granted (server tier >= expected tier)
        if (serverTierLevel >= expectedTierLevel && serverData.tier !== 'free') {
          console.log('[useUserTier] Payment entitlement confirmed:', serverData.tier);

          // Update state with server data
          setTierData(serverData);
          localStorage.setItem('605b_tier', serverData.tier);
          localStorage.setItem('605b_tier_data', JSON.stringify(serverData));

          // Clear pending payment flag
          localStorage.removeItem(PAYMENT_POLL_STORAGE_KEY);

          // Stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setIsPollingForPayment(false);
          setPaymentSyncComplete(true);
          return true;
        }
      }

      // Check if we've exceeded max attempts
      if (pollAttemptsRef.current >= PAYMENT_POLL_MAX_ATTEMPTS) {
        console.warn('[useUserTier] Payment polling timeout - entitlement may be delayed');
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setIsPollingForPayment(false);
        // Don't clear pending flag - let user refresh manually
        return false;
      }

      return false;
    };

    // Initial poll immediately
    const found = await poll();
    if (!found) {
      // Start interval polling
      pollIntervalRef.current = setInterval(poll, PAYMENT_POLL_INTERVAL_MS);
    }
  }, [fetchServerTierData, syncSession]);

  // Stop polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Load tier data - ALWAYS wait for server when signed in
  const loadTierData = useCallback(async (forceServerFetch = false) => {
    const pendingPayment = checkForPendingPayment();

    // CRITICAL FIX: Always keep loading=true until server responds when signed in
    // This prevents showing paywall based on stale localStorage data

    // If signed in, ALWAYS fetch from server first (authoritative source)
    if (isSignedIn) {
      const serverData = await fetchServerTierData();

      if (serverData) {
        console.log('[useUserTier] Server tier data:', serverData.tier);
        setTierData(serverData);
        localStorage.setItem('605b_tier', serverData.tier);
        localStorage.setItem('605b_tier_data', JSON.stringify(serverData));

        // CRITICAL: If server shows PAID tier, clear ALL pending payment state
        if (serverData.tier !== 'free') {
          console.log('[useUserTier] Server shows paid tier, clearing pending state');
          localStorage.removeItem(PAYMENT_POLL_STORAGE_KEY);
          setPaymentSyncComplete(true);
          setIsPollingForPayment(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        } else if (pendingPayment.isPending && serverData.tier === 'free') {
          // Server shows free but payment is pending - start polling
          if (!isPollingForPayment && pendingPayment.expectedTier) {
            startPaymentPolling(pendingPayment.expectedTier, pendingPayment.sessionId);
          }
        }

        setLoading(false);
        return;
      }
    }

    // Only use localStorage if NOT signed in or server fetch failed
    if (!pendingPayment.isPending && !forceServerFetch) {
      const localTier = localStorage.getItem('605b_tier');
      const localTierData = localStorage.getItem('605b_tier_data');

      if (localTierData) {
        try {
          setTierData(JSON.parse(localTierData));
        } catch (e) {
          if (localTier) {
            setTierData({ tier: localTier, features: TIER_FEATURES[localTier] || TIER_FEATURES.free });
          }
        }
      } else if (localTier) {
        setTierData({ tier: localTier, features: TIER_FEATURES[localTier] || TIER_FEATURES.free });
      }
    }

    setLoading(false);
  }, [isSignedIn, fetchServerTierData, checkForPendingPayment, isPollingForPayment, startPaymentPolling]);

  useEffect(() => {
    loadTierData();
  }, [loadTierData]);

  // Get current tier (defaults to free)
  const tier = tierData?.tier || 'free';
  const features = tierData?.features || TIER_FEATURES.free;
  const info = TIER_INFO[tier] || TIER_INFO.free;

  // Access status checks
  const isAccessFrozen = tierData?.accessFrozen === true;
  const isAccessRevoked = tierData?.accessRevoked === true;
  const frozenReason = tierData?.frozenReason;
  const revokedReason = tierData?.revokedReason;

  // Beta access flag (from server - authoritative)
  const isBeta = tierData?.isBeta === true;

  // Check if user has access to a feature
  const hasFeature = useCallback((featureName) => {
    // Beta users have full access to all features (server-authoritative)
    if (isBeta) {
      return true;
    }
    // If access is revoked, no paid features
    if (isAccessRevoked && featureName !== 'disputeTracker') {
      return false;
    }
    return !!features[featureName];
  }, [features, isAccessRevoked, isBeta]);

  // Check if user has at least a certain tier level
  const hasTierLevel = useCallback((requiredTier) => {
    // Beta users have top tier access (server-authoritative)
    if (isBeta) {
      return true;
    }
    // If access is revoked, treat as free tier
    if (isAccessRevoked) {
      return requiredTier === 'free';
    }
    const currentLevel = TIER_LEVELS[tier] || 0;
    const requiredLevel = TIER_LEVELS[requiredTier] || 0;
    return currentLevel >= requiredLevel;
  }, [tier, isAccessRevoked, isBeta]);

  // Check if user can perform an action (with freeze/revoke checks)
  const canPerformAction = useCallback((action) => {
    // Beta users can perform all actions (server-authoritative)
    if (isBeta) {
      return true;
    }
    // If access is revoked, block all paid actions
    if (isAccessRevoked && PAID_ACTIONS.includes(action)) {
      return false;
    }

    // If access is frozen, block specific actions (exports/downloads)
    if (isAccessFrozen && FROZEN_BLOCKED_ACTIONS.includes(action)) {
      return false;
    }

    switch (action) {
      case 'analyze_pdf':
        if (features.pdfAnalyses === -1) return true; // Unlimited
        const used = tierData?.pdfAnalysesUsed || 0;
        return used < features.pdfAnalyses;

      case 'download_letter':
        return features.letterDownloads;

      case 'use_ai_chat':
        return features.aiChat;

      case 'export_audit':
        return features.auditExport;

      case 'use_605b_workflow':
        return features.identityTheftWorkflow;

      case 'use_creditor_templates':
        return features.creditorTemplates;

      case 'use_escalation_templates':
        return features.escalationTemplates;

      case 'track_disputes':
        return features.disputeTracker;

      default:
        return false;
    }
  }, [features, tierData, isAccessFrozen, isAccessRevoked, isBeta]);

  // Get reason why an action is blocked
  const getBlockedReason = useCallback((action) => {
    if (isAccessRevoked) {
      return {
        blocked: true,
        reason: 'revoked',
        message: 'Paid features are disabled due to a billing issue. Contact support for help.',
      };
    }
    if (isAccessFrozen && FROZEN_BLOCKED_ACTIONS.includes(action)) {
      return {
        blocked: true,
        reason: 'frozen',
        message: 'Exports temporarily disabled due to a billing issue. Contact support for help.',
      };
    }
    if (!canPerformAction(action)) {
      return {
        blocked: true,
        reason: 'tier',
        message: 'This feature requires a higher tier.',
      };
    }
    return { blocked: false };
  }, [isAccessFrozen, isAccessRevoked, canPerformAction]);

  // Get usage stats
  const getUsageStats = useCallback(() => {
    return {
      pdfAnalyses: {
        used: tierData?.pdfAnalysesUsed || 0,
        total: features.pdfAnalyses,
        remaining: features.pdfAnalyses === -1 
          ? Infinity 
          : Math.max(0, features.pdfAnalyses - (tierData?.pdfAnalysesUsed || 0)),
        isUnlimited: features.pdfAnalyses === -1,
      },
      aiCredits: {
        used: tierData?.aiCreditsUsed || 0,
        total: tierData?.aiCreditsRemaining === -1 ? Infinity : (tierData?.aiCreditsRemaining || 0),
        remaining: tierData?.aiCreditsRemaining || 0,
        isUnlimited: tierData?.aiCreditsRemaining === -1,
      },
    };
  }, [tierData, features]);

  // Get upgrade recommendation
  const getUpgradeRecommendation = useCallback(() => {
    const currentLevel = TIER_LEVELS[tier] || 0;
    const nextTiers = Object.entries(TIER_LEVELS)
      .filter(([_, level]) => level > currentLevel)
      .sort((a, b) => a[1] - b[1]);
    
    if (nextTiers.length === 0) return null;
    
    const nextTierId = nextTiers[0][0];
    return {
      currentTier: tier,
      nextTier: nextTierId,
      nextTierInfo: TIER_INFO[nextTierId],
      nextTierFeatures: TIER_FEATURES[nextTierId],
      message: info.upgradeMessage,
    };
  }, [tier, info]);

  // Record usage of a feature
  const recordUsage = useCallback(async (action) => {
    // Don't record if access is frozen or revoked
    if (isAccessFrozen || isAccessRevoked) return;
    
    // Update local state
    if (action === 'analyze_pdf' && tierData) {
      const newUsed = (tierData.pdfAnalysesUsed || 0) + 1;
      const updatedData = { ...tierData, pdfAnalysesUsed: newUsed };
      setTierData(updatedData);
      localStorage.setItem('605b_tier_data', JSON.stringify(updatedData));
      
      // Sync with server
      if (isSignedIn) {
        try {
          await fetch('/api/user-data/tier/usage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, increment: 1 }),
          });
        } catch (err) {
          console.error('Failed to record usage:', err);
        }
      }
    }
  }, [tierData, isSignedIn, isAccessFrozen, isAccessRevoked]);

  // Mark payment as pending (called before redirect to Stripe)
  const markPaymentPending = useCallback((tierId) => {
    localStorage.setItem(PAYMENT_POLL_STORAGE_KEY, JSON.stringify({
      tier: tierId,
      startedAt: new Date().toISOString(),
    }));
  }, []);

  // Force refresh from server (useful after payment)
  const forceRefresh = useCallback(async () => {
    setLoading(true);
    await loadTierData(true);
    setLoading(false);
  }, [loadTierData]);

  // Clear any stuck payment pending state
  const clearPaymentPending = useCallback(() => {
    localStorage.removeItem(PAYMENT_POLL_STORAGE_KEY);
    setIsPollingForPayment(false);
  }, []);

  return {
    tier,
    tierName: info.name,
    tierColor: info.color,
    features,
    loading,
    error,
    hasFeature,
    hasTierLevel,
    canPerformAction,
    getBlockedReason,
    getUsageStats,
    getUpgradeRecommendation,
    recordUsage,
    refresh: loadTierData,
    forceRefresh,
    // Access status
    isAccessFrozen,
    isAccessRevoked,
    frozenReason,
    revokedReason,
    // Beta access
    isBeta,
    // Payment sync status
    isPollingForPayment,
    paymentSyncComplete,
    markPaymentPending,
    clearPaymentPending,
    startPaymentPolling,
    // Raw data for advanced usage
    tierData,
    tierInfo: info,
    allTiers: TIER_INFO,
    allFeatures: TIER_FEATURES,
  };
}

// Component for showing access restriction banners
export function AccessRestrictionBanner() {
  const { isAccessFrozen, isAccessRevoked, frozenReason, revokedReason } = useUserTier();

  if (isAccessRevoked) {
    return (
      <div style={{
        padding: '14px 16px',
        background: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '10px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}>
        <div style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 700 }}>!</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: '#fafafa', marginBottom: '4px', fontSize: '14px' }}>
            Access Revoked
          </div>
          <div style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: 1.5 }}>
            Paid features are disabled due to a refund or unresolved billing issue. 
            Contact <a href="mailto:support@9thwave.io" style={{ color: '#ef4444' }}>support@9thwave.io</a> for billing/account questions.
          </div>
        </div>
      </div>
    );
  }

  if (isAccessFrozen) {
    return (
      <div style={{
        padding: '14px 16px',
        background: 'rgba(251, 191, 36, 0.15)',
        border: '1px solid rgba(251, 191, 36, 0.3)',
        borderRadius: '10px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}>
        <div style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'rgba(251, 191, 36, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: '#fbbf24', fontSize: '12px' }}>⏸</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: '#fafafa', marginBottom: '4px', fontSize: '14px' }}>
            Access Temporarily Restricted
          </div>
          <div style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: 1.5 }}>
            Exports and downloads are temporarily disabled due to a billing issue. 
            You can still view your dashboard. 
            Contact <a href="mailto:support@9thwave.io" style={{ color: '#fbbf24' }}>support@9thwave.io</a> for billing/account help.
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Component for gating features
export function TierGate({ 
  requiredTier, 
  requiredFeature,
  requiredAction,
  children, 
  fallback,
  showUpgradePrompt = true 
}) {
  const { 
    hasTierLevel, 
    hasFeature, 
    canPerformAction,
    getBlockedReason,
    getUpgradeRecommendation,
    isAccessFrozen,
    isAccessRevoked,
  } = useUserTier();

  // Check access
  let hasAccess = true;
  let blockedInfo = null;

  if (requiredAction) {
    hasAccess = canPerformAction(requiredAction);
    if (!hasAccess) {
      blockedInfo = getBlockedReason(requiredAction);
    }
  } else if (requiredTier) {
    hasAccess = hasTierLevel(requiredTier);
  } else if (requiredFeature) {
    hasAccess = hasFeature(requiredFeature);
  }

  if (hasAccess) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  if (showUpgradePrompt) {
    // Show different messages based on why access is blocked
    if (blockedInfo?.reason === 'frozen') {
      return (
        <div style={{
          padding: '24px',
          background: 'rgba(251, 191, 36, 0.1)',
          border: '1px solid rgba(251, 191, 36, 0.2)',
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#fafafa' }}>
            Access Temporarily Restricted
          </div>
          <div style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '16px' }}>
            {blockedInfo.message}
          </div>
          <a 
            href="mailto:support@9thwave.io"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: '#fbbf24',
              color: '#09090b',
              borderRadius: '8px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Contact Support
          </a>
        </div>
      );
    }

    if (blockedInfo?.reason === 'revoked') {
      return (
        <div style={{
          padding: '24px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#fafafa' }}>
            Access Revoked
          </div>
          <div style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '16px' }}>
            {blockedInfo.message}
          </div>
          <a 
            href="mailto:support@9thwave.io"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: '#ef4444',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Contact Support
          </a>
        </div>
      );
    }

    // Default: upgrade prompt
    const upgrade = getUpgradeRecommendation();
    return (
      <div style={{
        padding: '24px',
        background: 'rgba(255, 107, 53, 0.1)',
        border: '1px solid rgba(255, 107, 53, 0.2)',
        borderRadius: '12px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#fafafa' }}>
          Feature Locked
        </div>
        <div style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '16px' }}>
          {upgrade?.message || 'Upgrade to access this feature'}
        </div>
        <a
          href="/pricing"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            background: '#FF6B35',
            color: '#ffffff',
            borderRadius: '8px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          View Upgrade Options
        </a>
      </div>
    );
  }

  return null;
}
