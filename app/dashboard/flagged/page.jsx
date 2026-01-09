"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Flag, AlertTriangle, Shield, FileText, Clock, Scale,
  ChevronRight, X, Plus, Check, RefreshCw, Trash2,
  ExternalLink, AlertCircle
} from 'lucide-react';
import { useFlaggedItems, useDisputes } from '@/lib/useUserData';

const SEVERITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6',
};

const TYPE_ICONS = {
  error: FileText,
  inconsistency: AlertTriangle,
  fraud_indicator: Shield,
  fcra_violation: Scale,
  dispute_opportunity: Flag,
};

const TYPE_LABELS = {
  error: 'Error',
  inconsistency: 'Inconsistency',
  fraud_indicator: 'Fraud Indicator',
  fcra_violation: 'FCRA Violation',
  dispute_opportunity: 'Dispute Opportunity',
};

export default function FlaggedPage() {
  const router = useRouter();
  const { flaggedItems, loading, syncing, markDisputed, dismissItem, clearAll } = useFlaggedItems();
  const { addDispute } = useDisputes();
  const [isMobile, setIsMobile] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [creatingDispute, setCreatingDispute] = useState(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter to show only pending items (not dismissed or already disputed)
  const pendingItems = useMemo(() => 
    flaggedItems.filter(item => item.status === 'pending'),
    [flaggedItems]
  );

  const disputedItems = useMemo(() => 
    flaggedItems.filter(item => item.status === 'disputed'),
    [flaggedItems]
  );

  const handleCreateDispute = async (item) => {
    setCreatingDispute(item.id);
    
    // Create dispute from flagged item
    const dispute = await addDispute({
      creditor: item.account || 'Unknown Account',
      bureau: 'Experian', // Default - user can change
      type: item.type === 'fraud_indicator' ? 'Identity Theft (605B)' : 'Inaccurate Information',
      dateSent: new Date().toISOString().split('T')[0],
      notes: `${item.issue}\n\nStatute: ${item.statute}\nRecommendation: ${item.recommendation}`,
      flaggedItemId: item.id,
    });

    // Mark the flagged item as disputed
    await markDisputed(item.id, dispute.id);
    
    setCreatingDispute(null);
    
    // Navigate to tracker
    router.push('/dashboard/tracker');
  };

  const handleDismiss = async (itemId) => {
    if (confirm('Dismiss this finding? You can always re-analyze your reports.')) {
      await dismissItem(itemId);
    }
  };

  const handleClearAll = async () => {
    if (confirm('Clear all findings? This will remove all flagged items.')) {
      await clearAll();
    }
  };

  const stats = useMemo(() => ({
    total: flaggedItems.length,
    pending: pendingItems.length,
    disputed: disputedItems.length,
    high: pendingItems.filter(i => i.severity === 'high').length,
  }), [flaggedItems, pendingItems, disputedItems]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#f7d047' }} />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        gap: isMobile ? '16px' : '0',
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 600, marginBottom: '4px' }}>
            Flagged Items
          </h1>
          <p style={{ fontSize: '14px', color: '#737373' }}>
            Items requiring attention from your credit report analysis
          </p>
        </div>
        {flaggedItems.length > 0 && (
          <button
            onClick={handleClearAll}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'transparent',
              border: '1px solid #27272a',
              borderRadius: '8px',
              color: '#71717a',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={16} />
            Clear All
          </button>
        )}
      </div>

      {/* Stats */}
      {flaggedItems.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '12px' : '16px',
          marginBottom: '24px',
        }}>
          {[
            { label: 'Total Found', value: stats.total, icon: Flag, color: '#f7d047' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: '#3b82f6' },
            { label: 'Disputed', value: stats.disputed, icon: Check, color: '#22c55e' },
            { label: 'High Priority', value: stats.high, icon: AlertCircle, color: '#ef4444' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: '#121214',
              border: '1px solid #1f1f23',
              borderRadius: '12px',
              padding: isMobile ? '16px' : '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#737373' }}>{stat.label}</span>
                <stat.icon size={16} style={{ color: stat.color }} />
              </div>
              <div style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: 600 }}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Pending Items */}
      {pendingItems.length > 0 ? (
        <div style={{
          background: '#121214',
          border: '1px solid #1f1f23',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1f1f23',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600 }}>
              Items to Review ({pendingItems.length})
            </h2>
            {syncing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#71717a' }}>
                <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                Syncing...
              </div>
            )}
          </div>

          {pendingItems.map((item) => {
            const IconComponent = TYPE_ICONS[item.type] || Flag;
            const severityColor = SEVERITY_COLORS[item.severity] || '#71717a';

            return (
              <div
                key={item.id}
                style={{
                  padding: isMobile ? '16px' : '20px',
                  borderBottom: '1px solid #1f1f23',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: `${severityColor}15`,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <IconComponent size={20} style={{ color: severityColor }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '15px', fontWeight: 600 }}>{item.account || 'Unknown Account'}</span>
                      <span style={{
                        padding: '2px 8px',
                        background: `${severityColor}15`,
                        color: severityColor,
                        fontSize: '11px',
                        fontWeight: 500,
                        borderRadius: '4px',
                        textTransform: 'capitalize',
                      }}>
                        {item.severity}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        background: '#27272a',
                        color: '#a1a1aa',
                        fontSize: '11px',
                        borderRadius: '4px',
                      }}>
                        {TYPE_LABELS[item.type] || item.type}
                      </span>
                    </div>

                    <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '8px', lineHeight: 1.5 }}>
                      {item.issue}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#71717a', marginBottom: '12px', flexWrap: 'wrap' }}>
                      {item.statute && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Scale size={12} />
                          {item.statute}
                        </span>
                      )}
                      {item.successLikelihood && (
                        <span style={{
                          color: item.successLikelihood === 'High' ? '#22c55e' : item.successLikelihood === 'Medium' ? '#f59e0b' : '#71717a',
                        }}>
                          {item.successLikelihood} success likelihood
                        </span>
                      )}
                    </div>

                    {item.recommendation && (
                      <div style={{
                        padding: '12px',
                        background: '#1a1a1c',
                        borderRadius: '8px',
                        marginBottom: '12px',
                      }}>
                        <div style={{ fontSize: '11px', color: '#71717a', marginBottom: '4px' }}>Recommendation</div>
                        <div style={{ fontSize: '13px', color: '#e5e5e5' }}>{item.recommendation}</div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleCreateDispute(item)}
                        disabled={creatingDispute === item.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #f7d047 0%, #d4b840 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#09090b',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: creatingDispute === item.id ? 'not-allowed' : 'pointer',
                          opacity: creatingDispute === item.id ? 0.7 : 1,
                        }}
                      >
                        {creatingDispute === item.id ? (
                          <>
                            <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus size={14} />
                            Create Dispute
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDismiss(item.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          background: 'transparent',
                          border: '1px solid #27272a',
                          borderRadius: '8px',
                          color: '#71717a',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={14} />
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div style={{
          background: '#121214',
          border: '1px solid #1f1f23',
          borderRadius: '12px',
          padding: isMobile ? '40px 20px' : '60px 24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'rgba(247, 208, 71, 0.1)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#f7d047'
          }}>
            <Flag size={32} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No Flagged Items</h2>
          <p style={{ fontSize: '14px', color: '#737373', maxWidth: '400px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Upload your credit reports to have our AI analyze them for potential issues,
            identity theft markers, and disputable items.
          </p>
          <a
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'rgba(247, 208, 71, 0.1)',
              border: '1px solid rgba(247, 208, 71, 0.3)',
              borderRadius: '8px',
              color: '#f7d047',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <FileText size={18} />
            Analyze Reports
          </a>
        </div>
      )}

      {/* Already Disputed Items */}
      {disputedItems.length > 0 && (
        <div style={{
          background: '#121214',
          border: '1px solid #1f1f23',
          borderRadius: '12px',
          overflow: 'hidden',
          marginTop: '24px',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1f1f23',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Check size={16} style={{ color: '#22c55e' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 600 }}>
              Already Disputed ({disputedItems.length})
            </h2>
          </div>

          {disputedItems.slice(0, 5).map((item) => (
            <div
              key={item.id}
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #1f1f23',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: 0.6,
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{item.account || 'Unknown Account'}</div>
                <div style={{ fontSize: '12px', color: '#71717a' }}>{TYPE_LABELS[item.type] || item.type}</div>
              </div>
              <a
                href="/dashboard/tracker"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '13px',
                  color: '#f7d047',
                  textDecoration: 'none',
                }}
              >
                View in Tracker
                <ChevronRight size={14} />
              </a>
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
