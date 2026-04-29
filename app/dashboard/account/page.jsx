"use client";

import { useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useUserTier } from '@/lib/useUserTier';
import { 
  Crown, Check, ArrowRight, Shield, Zap, FileText, 
  FileSearch, Loader2, AlertTriangle, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/constants';
import CheckoutErrorModal from '@/app/components/CheckoutErrorModal';

const TIERS = [
  {
    id: 'free',
    name: 'Credit Report Analyzer',
    price: 0,
    description: 'Understand your credit report',
    icon: FileSearch,
    color: '#6b7280',
    features: [
      'Upload 1 credit report (PDF)',
      'Read-only analysis summary',
      'Issue categorization',
      'Educational process walkthrough',
    ],
  },
  {
    id: 'toolkit',
    name: 'Dispute Toolkit',
    price: 39,
    description: 'Core dispute documentation',
    icon: FileText,
    color: '#3b82f6',
    features: [
      'Everything in Free',
      'Full analysis export (PDF)',
      'Core bureau dispute templates',
      'Dispute tracker',
      'Certified mail checklist',
    ],
  },
  {
    id: 'advanced',
    name: 'Advanced Dispute Suite',
    price: 89,
    description: 'Full dispute capabilities',
    icon: Zap,
    color: 'var(--orange)',
    features: [
      'Everything in Toolkit',
      'Full template library (62 letters)',
      'Creditor dispute templates',
      'AI Strategist',
      'CFPB + FTC complaint generators',
      'Escalation documentation',
    ],
  },
  {
    id: 'identity-theft',
    name: '605B Identity Theft Toolkit',
    price: 179,
    description: 'Complete fraud documentation',
    icon: Shield,
    color: '#22c55e',
    features: [
      'Everything in Advanced',
      '605B-specific workflows',
      'FTC Identity Theft Report integration',
      'Identity theft affidavits',
      'Police report templates',
      'Attorney-ready document compilation',
    ],
  },
];

const TIER_ORDER = ['free', 'toolkit', 'advanced', 'identity-theft'];

const CHECKOUT_INTENT_KEY_PREFIX = '605b_checkout_intent:';
const CHECKOUT_INTENT_MAX_AGE_MS = 30 * 60 * 1000;

function makeCheckoutIntentId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

function readCheckoutIntent(productKey) {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;

  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_INTENT_KEY_PREFIX + productKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.intentId !== 'string' || typeof parsed.createdAt !== 'number') {
      return null;
    }

    if (Date.now() - parsed.createdAt > CHECKOUT_INTENT_MAX_AGE_MS) {
      window.sessionStorage.removeItem(CHECKOUT_INTENT_KEY_PREFIX + productKey);
      return null;
    }

    return parsed.intentId;
  } catch {
    return null;
  }
}

function writeCheckoutIntent(productKey, intentId) {
  if (typeof window === 'undefined' || !window.sessionStorage) return;

  try {
    window.sessionStorage.setItem(
      CHECKOUT_INTENT_KEY_PREFIX + productKey,
      JSON.stringify({ intentId, createdAt: Date.now() }),
    );
  } catch {
    // Best effort only; the in-memory ref still covers this page load.
  }
}

export default function AccountPage() {
  const { user } = useUser();
  const { tier, tierName, tierColor, getUsageStats, loading: tierLoading } = useUserTier();
  const [upgradeLoading, setUpgradeLoading] = useState(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showDisclaimerError, setShowDisclaimerError] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const checkoutIntentsRef = useRef(new Map());

  const usageStats = getUsageStats();
  const currentTierIndex = TIER_ORDER.indexOf(tier);
  const currentTierInfo = TIERS.find(t => t.id === tier);
  const availableUpgrades = TIERS.filter((_, index) => index > currentTierIndex);

  const getOrCreateCheckoutIntent = (productKey) => {
    const cache = checkoutIntentsRef.current;
    if (cache.has(productKey)) return cache.get(productKey);

    const persisted = readCheckoutIntent(productKey);
    if (persisted) {
      cache.set(productKey, persisted);
      return persisted;
    }

    const fresh = makeCheckoutIntentId();
    cache.set(productKey, fresh);
    writeCheckoutIntent(productKey, fresh);
    return fresh;
  };

  const handleUpgrade = async (targetTier) => {
    if (!disclaimerAccepted) {
      setShowDisclaimerError(true);
      document.getElementById('upgrade-disclaimer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setUpgradeLoading(targetTier.id);
    try {
      const intentId = getOrCreateCheckoutIntent(`tier:${targetTier.id}`);
      localStorage.setItem('605b_payment_pending', JSON.stringify({
        tier: targetTier.id,
        startedAt: new Date().toISOString(),
      }));

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: targetTier.id,
          disclaimerAccepted: true,
          disclaimerTimestamp: new Date().toISOString(),
          intentId,
        }),
      });

      const { url, error } = await response.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Upgrade error:', error);
      setCheckoutError(
        error instanceof Error && error.message
          ? error.message
          : 'Unable to start checkout. Please try again.'
      );
    } finally {
      setUpgradeLoading(null);
    }
  };

  if (tierLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--orange)' }} />
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <CheckoutErrorModal message={checkoutError} onClose={() => setCheckoutError(null)} />
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>Account & Plan</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Manage your subscription and view usage</p>
      </div>

      {/* Current Plan */}
      <div style={{
        background: 'var(--bg-card)',
        border: `2px solid ${tierColor}40`,
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: `${tierColor}20`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: tierColor,
            }}>
              {currentTierInfo && <currentTierInfo.icon size={28} />}
            </div>
            <div>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '4px 10px',
                background: `${tierColor}15`,
                border: `1px solid ${tierColor}30`,
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                color: tierColor,
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}>
                {tier === 'identity-theft' && <Crown size={12} />}
                Current Plan
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{tierName}</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{currentTierInfo?.description}</p>
            </div>
          </div>
          
          {tier !== 'identity-theft' && (
            <a 
              href="#upgrades"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                background: 'var(--orange)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Upgrade
              <ChevronRight size={16} />
            </a>
          )}
        </div>

        {/* Usage Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>PDF Analyses</div>
            <div style={{ fontSize: '20px', fontWeight: 600 }}>
              {usageStats.pdfAnalyses?.isUnlimited ? (
                <span style={{ color: '#22c55e' }}>Unlimited</span>
              ) : (
                <>
                  {usageStats.pdfAnalyses?.used || 0}
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}> / {usageStats.pdfAnalyses?.total || 0}</span>
                </>
              )}
            </div>
          </div>
          <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>AI Credits</div>
            <div style={{ fontSize: '20px', fontWeight: 600 }}>
              {usageStats.aiCredits?.isUnlimited ? (
                <span style={{ color: '#22c55e' }}>Unlimited</span>
              ) : (
                <>
                  {usageStats.aiCredits?.remaining || 0}
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}> remaining</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Included Features</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
            {currentTierInfo?.features.map((feature, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <Check size={14} style={{ color: '#22c55e', flexShrink: 0 }} />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upgrade Options */}
      {availableUpgrades.length > 0 && (
        <>
          <div id="upgrades" style={{ marginBottom: '16px', paddingTop: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Upgrade Your Plan</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Unlock more features with a one-time purchase</p>
          </div>

          {/* Disclaimer */}
          <div 
            id="upgrade-disclaimer"
            style={{
              background: 'var(--bg-card)',
              border: showDisclaimerError && !disclaimerAccepted ? '2px solid #ef4444' : '1px solid #27272a',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--orange)', fontSize: '14px', fontWeight: 600 }}>
              <AlertTriangle size={16} />
              Before Upgrading
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.6 }}>
              This is self-service software. We do not send letters on your behalf, contact bureaus for you, or guarantee outcomes.
            </p>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              background: 'rgba(255, 107, 53, 0.05)',
              border: '1px solid rgba(255, 107, 53, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
            }}>
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={(e) => {
                  setDisclaimerAccepted(e.target.checked);
                  if (e.target.checked) setShowDisclaimerError(false);
                }}
                style={{ width: '18px', height: '18px', accentColor: '#FF6B35' }}
              />
              <span style={{ color: '#e5e5e5' }}>I understand this is self-service software</span>
            </label>
            {showDisclaimerError && !disclaimerAccepted && (
              <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={12} />
                Please acknowledge to continue
              </div>
            )}
          </div>

          {/* Upgrade Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {availableUpgrades.map((upgradeTier) => (
              <div
                key={upgradeTier.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '200px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: `${upgradeTier.color}20`,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: upgradeTier.color,
                    flexShrink: 0,
                  }}>
                    <upgradeTier.icon size={24} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '2px' }}>{upgradeTier.name}</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{upgradeTier.description}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>$</span>
                      {upgradeTier.price}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>one-time</div>
                  </div>
                  <button
                    onClick={() => handleUpgrade(upgradeTier)}
                    disabled={upgradeLoading === upgradeTier.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '12px 20px',
                      background: upgradeTier.id === 'identity-theft' ? '#22c55e' : (upgradeTier.id === 'advanced' ? '#FF6B35' : '#3b82f6'),
                      border: 'none',
                      borderRadius: '8px',
                      color: upgradeTier.id === 'identity-theft' ? '#fff' : 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: upgradeLoading === upgradeTier.id ? 'not-allowed' : 'pointer',
                      opacity: upgradeLoading === upgradeTier.id ? 0.7 : 1,
                      minWidth: '120px',
                      justifyContent: 'center',
                    }}
                  >
                    {upgradeLoading === upgradeTier.id ? (
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>
                        Upgrade
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Note */}
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px', textAlign: 'center' }}>
            Upgrades are one-time purchases. Your new features unlock immediately after payment.
          </p>
        </>
      )}

      {/* Max Tier */}
      {tier === 'identity-theft' && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
        }}>
          <Crown size={24} style={{ color: '#22c55e', marginBottom: '8px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>You have the top tier!</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            You have access to all features including 605B workflows and attorney-ready documentation.
          </p>
        </div>
      )}

      {/* Account Info */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '24px',
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Account Information</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Email</span>
            <span style={{ fontSize: '13px' }}>{user?.primaryEmailAddress?.emailAddress}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Name</span>
            <span style={{ fontSize: '13px' }}>{user?.firstName} {user?.lastName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Support</span>
            <a href={SUPPORT_MAILTO} style={{ fontSize: '13px', color: 'var(--orange)' }}>{SUPPORT_EMAIL}</a>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
