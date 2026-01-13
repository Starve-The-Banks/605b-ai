"use client";

import Link from 'next/link';
import { Lock, ArrowRight, Sparkles, FileText, Clock, Shield, Download } from 'lucide-react';

// Tier information for upgrade prompts
const TIER_UPGRADE_INFO = {
  toolkit: {
    name: 'Dispute Toolkit',
    price: 39,
    color: '#3b82f6',
    icon: FileText,
  },
  advanced: {
    name: 'Advanced Suite',
    price: 89,
    color: '#f7d047',
    icon: Sparkles,
  },
  'identity-theft': {
    name: '605B Toolkit',
    price: 179,
    color: '#22c55e',
    icon: Shield,
  },
};

// Feature to required tier mapping
const FEATURE_REQUIREMENTS = {
  'ai-chat': { tier: 'advanced', label: 'AI Strategist' },
  'full-templates': { tier: 'advanced', label: 'Full Template Library' },
  'letter-downloads': { tier: 'toolkit', label: 'Letter Downloads' },
  'dispute-tracker': { tier: 'toolkit', label: 'Dispute Tracker' },
  'audit-export': { tier: 'advanced', label: 'Audit Log Export' },
  '605b-workflow': { tier: 'identity-theft', label: '605B Workflow' },
  'creditor-templates': { tier: 'advanced', label: 'Creditor Templates' },
};

export function UpgradePrompt({ 
  feature, 
  requiredTier, 
  title, 
  description,
  compact = false,
  showFeatures = true,
}) {
  const tierKey = requiredTier || FEATURE_REQUIREMENTS[feature]?.tier || 'toolkit';
  const tierInfo = TIER_UPGRADE_INFO[tierKey] || TIER_UPGRADE_INFO.toolkit;
  const TierIcon = tierInfo.icon;

  if (compact) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        background: 'rgba(247, 208, 71, 0.08)',
        border: '1px solid rgba(247, 208, 71, 0.2)',
        borderRadius: '10px',
      }}>
        <Lock size={16} style={{ color: '#f7d047', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: '13px', color: '#a1a1aa' }}>
          {title || `Requires ${tierInfo.name}`}
        </span>
        <Link
          href={`/pricing?highlight=${tierKey}`}
          style={{
            padding: '6px 12px',
            background: tierInfo.color,
            borderRadius: '6px',
            color: '#09090b',
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Upgrade
        </Link>
      </div>
    );
  }

  return (
    <div style={{
      background: '#121214',
      border: '1px solid #1f1f23',
      borderRadius: '16px',
      padding: '40px 24px',
      textAlign: 'center',
      maxWidth: '500px',
      margin: '0 auto',
    }}>
      <div style={{
        width: '72px',
        height: '72px',
        background: `${tierInfo.color}15`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <Lock size={32} style={{ color: tierInfo.color }} />
      </div>

      <h2 style={{
        fontSize: '22px',
        fontWeight: 600,
        marginBottom: '8px',
        color: '#fafafa',
      }}>
        {title || 'Feature Locked'}
      </h2>

      <p style={{
        fontSize: '14px',
        color: '#71717a',
        lineHeight: 1.6,
        marginBottom: '24px',
        maxWidth: '380px',
        margin: '0 auto 24px',
      }}>
        {description || `This feature requires the ${tierInfo.name} tier or higher.`}
      </p>

      {showFeatures && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          textAlign: 'left',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: `${tierInfo.color}20`,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <TierIcon size={20} style={{ color: tierInfo.color }} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#fafafa' }}>
                {tierInfo.name}
              </div>
              <div style={{ fontSize: '13px', color: '#71717a' }}>
                ${tierInfo.price} one-time
              </div>
            </div>
          </div>
        </div>
      )}

      <Link
        href={`/pricing?highlight=${tierKey}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '14px 28px',
          background: `linear-gradient(135deg, ${tierInfo.color} 0%, ${tierInfo.color}dd 100%)`,
          borderRadius: '10px',
          color: '#09090b',
          fontSize: '15px',
          fontWeight: 600,
          textDecoration: 'none',
          transition: 'transform 0.2s',
        }}
      >
        Upgrade Now
        <ArrowRight size={18} />
      </Link>

      <p style={{
        fontSize: '12px',
        color: '#52525b',
        marginTop: '16px',
      }}>
        One-time payment · No subscription · Use until you're done
      </p>
    </div>
  );
}

// Inline badge for locked features
export function LockedBadge({ requiredTier }) {
  const tierInfo = TIER_UPGRADE_INFO[requiredTier] || TIER_UPGRADE_INFO.toolkit;
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      background: 'rgba(113, 113, 122, 0.2)',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 600,
      color: '#71717a',
      textTransform: 'uppercase',
    }}>
      <Lock size={10} />
      {tierInfo.name}
    </span>
  );
}

// Usage limit warning
export function UsageLimitWarning({ used, total, type = 'PDF analyses' }) {
  const remaining = total === -1 ? Infinity : total - used;
  const isLow = total !== -1 && remaining <= 1;
  const isOut = total !== -1 && remaining <= 0;

  if (total === -1) return null; // Unlimited

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 14px',
      background: isOut 
        ? 'rgba(239, 68, 68, 0.1)' 
        : isLow 
          ? 'rgba(245, 158, 11, 0.1)' 
          : 'rgba(34, 197, 94, 0.1)',
      border: `1px solid ${isOut ? 'rgba(239, 68, 68, 0.2)' : isLow ? 'rgba(245, 158, 11, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
      borderRadius: '8px',
      fontSize: '13px',
    }}>
      {isOut ? (
        <>
          <Lock size={14} style={{ color: '#ef4444' }} />
          <span style={{ color: '#fca5a5' }}>
            No {type} remaining.{' '}
            <Link href="/pricing" style={{ color: '#f7d047', textDecoration: 'underline' }}>
              Upgrade or purchase add-on
            </Link>
          </span>
        </>
      ) : (
        <>
          <span style={{ color: isLow ? '#fcd34d' : '#86efac' }}>
            {remaining} {type} remaining
          </span>
        </>
      )}
    </div>
  );
}
