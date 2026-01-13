"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';

// Tier hierarchy for comparisons
const TIER_LEVELS = {
  'free': 0,
  'toolkit': 1,
  'advanced': 2,
  'identity-theft': 3,
};

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
    color: '#f7d047',
    upgradeMessage: 'Upgrade for identity theft workflows',
  },
  'identity-theft': {
    name: '605B Identity Theft Toolkit',
    color: '#22c55e',
    upgradeMessage: null, // Top tier
  },
};

export function useUserTier() {
  const { isSignedIn } = useAuth();
  const [tierData, setTierData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load tier data
  const loadTierData = useCallback(async () => {
    // Check localStorage first for instant load
    const localTier = localStorage.getItem('605b_tier');
    const localTierData = localStorage.getItem('605b_tier_data');
    
    if (localTierData) {
      try {
        setTierData(JSON.parse(localTierData));
      } catch (e) {
        // Fall back to tier string
        if (localTier) {
          setTierData({ tier: localTier, features: TIER_FEATURES[localTier] || TIER_FEATURES.free });
        }
      }
    } else if (localTier) {
      setTierData({ tier: localTier, features: TIER_FEATURES[localTier] || TIER_FEATURES.free });
    }

    // If signed in, sync with server
    if (isSignedIn) {
      try {
        const res = await fetch('/api/user-data/tier');
        if (res.ok) {
          const data = await res.json();
          if (data.tierData) {
            setTierData(data.tierData);
            localStorage.setItem('605b_tier', data.tierData.tier);
            localStorage.setItem('605b_tier_data', JSON.stringify(data.tierData));
          }
        }
      } catch (err) {
        console.error('Failed to fetch tier data:', err);
        setError(err);
      }
    }

    setLoading(false);
  }, [isSignedIn]);

  useEffect(() => {
    loadTierData();
  }, [loadTierData]);

  // Get current tier (defaults to free)
  const tier = tierData?.tier || 'free';
  const features = tierData?.features || TIER_FEATURES.free;
  const info = TIER_INFO[tier] || TIER_INFO.free;

  // Check if user has access to a feature
  const hasFeature = useCallback((featureName) => {
    return !!features[featureName];
  }, [features]);

  // Check if user has at least a certain tier level
  const hasTierLevel = useCallback((requiredTier) => {
    const currentLevel = TIER_LEVELS[tier] || 0;
    const requiredLevel = TIER_LEVELS[requiredTier] || 0;
    return currentLevel >= requiredLevel;
  }, [tier]);

  // Check if user can perform an action (with usage tracking)
  const canPerformAction = useCallback((action) => {
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
  }, [features, tierData]);

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
  }, [tierData, isSignedIn]);

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
    getUsageStats,
    getUpgradeRecommendation,
    recordUsage,
    refresh: loadTierData,
    // Raw data for advanced usage
    tierData,
    tierInfo: info,
    allTiers: TIER_INFO,
    allFeatures: TIER_FEATURES,
  };
}

// Component for gating features
export function TierGate({ 
  requiredTier, 
  requiredFeature, 
  children, 
  fallback,
  showUpgradePrompt = true 
}) {
  const { hasTierLevel, hasFeature, getUpgradeRecommendation } = useUserTier();

  const hasAccess = requiredTier 
    ? hasTierLevel(requiredTier)
    : requiredFeature 
      ? hasFeature(requiredFeature)
      : true;

  if (hasAccess) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  if (showUpgradePrompt) {
    const upgrade = getUpgradeRecommendation();
    return (
      <div style={{
        padding: '24px',
        background: 'rgba(247, 208, 71, 0.1)',
        border: '1px solid rgba(247, 208, 71, 0.2)',
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
            background: '#f7d047',
            color: '#09090b',
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
