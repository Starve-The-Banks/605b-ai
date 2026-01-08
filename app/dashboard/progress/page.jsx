"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import {
  TrendingUp, CheckCircle, Clock, AlertTriangle, Target,
  ArrowRight, Sparkles, FileText, Shield, Calendar,
  ChevronRight, Award, Zap
} from 'lucide-react';

export default function ProgressPage() {
  const { user } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [stats, setStats] = useState({
    disputesSent: 0,
    pendingResponses: 0,
    successfulRemovals: 0,
    daysActive: 0,
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const profile = localStorage.getItem('605b_user_profile');
    if (profile) {
      setUserProfile(JSON.parse(profile));
    }

    const onboardingDate = localStorage.getItem('605b_onboarding_date');
    if (onboardingDate) {
      const days = Math.floor((Date.now() - new Date(onboardingDate).getTime()) / (1000 * 60 * 60 * 24));
      setStats(prev => ({ ...prev, daysActive: days }));
    }
  }, []);

  const journeySteps = [
    { id: 'analyze', title: 'Analyze Reports', description: 'Upload and analyze your credit reports', icon: FileText, href: '/dashboard', status: 'available' },
    { id: 'identify', title: 'Identify Issues', description: 'Review flagged items and errors', icon: AlertTriangle, href: '/dashboard/flagged', status: 'available' },
    { id: 'dispute', title: 'Send Disputes', description: 'Generate and send dispute letters', icon: Shield, href: '/dashboard/templates', status: 'available' },
    { id: 'track', title: 'Track Progress', description: 'Monitor responses and deadlines', icon: Clock, href: '/dashboard/tracker', status: 'available' },
    { id: 'follow-up', title: 'Follow Up', description: 'Escalate unresolved disputes', icon: Zap, href: '/dashboard/ai-strategist', status: 'locked' },
  ];

  const quickActions = [
    { title: 'Talk to AI Strategist', description: 'Get personalized guidance', icon: Sparkles, href: '/dashboard/ai-strategist', color: '#f7d047' },
    { title: 'Upload Credit Report', description: 'Analyze your latest report', icon: FileText, href: '/dashboard', color: '#3b82f6' },
    { title: 'View Templates', description: 'Browse dispute letters', icon: Shield, href: '/dashboard/templates', color: '#22c55e' },
  ];

  const getSituationLabel = () => {
    if (!userProfile?.situation) return null;
    const labels = {
      'identity-theft': 'Identity Theft Recovery',
      'collections': 'Collection Disputes',
      'errors': 'Error Corrections',
      'rebuild': 'Credit Rebuilding',
    };
    return labels[userProfile.situation];
  };

  return (
    <div style={{ maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
        <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 600, marginBottom: '4px' }}>
          Welcome back, {user?.firstName || 'there'}!
        </h1>
        <p style={{ fontSize: '14px', color: '#71717a' }}>
          {getSituationLabel() ? `Your ${getSituationLabel()} journey` : 'Track your credit repair progress'}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '12px' : '16px',
        marginBottom: '24px',
      }}>
        {[
          { label: 'Disputes Sent', value: stats.disputesSent, icon: FileText, color: '#f7d047' },
          { label: 'Pending', value: stats.pendingResponses, icon: Clock, color: '#3b82f6' },
          { label: 'Removals', value: stats.successfulRemovals, icon: CheckCircle, color: '#22c55e' },
          { label: 'Days Active', value: stats.daysActive, icon: Calendar, color: '#a855f7' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: '#121214',
            border: '1px solid #1f1f23',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: isMobile ? '8px' : '12px',
            }}>
              <span style={{ fontSize: isMobile ? '11px' : '13px', color: '#71717a' }}>{stat.label}</span>
              <div style={{
                width: isMobile ? '28px' : '32px',
                height: isMobile ? '28px' : '32px',
                background: `${stat.color}15`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <stat.icon size={isMobile ? 14 : 16} style={{ color: stat.color }} />
              </div>
            </div>
            <div style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: 700 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
        gap: isMobile ? '16px' : '24px'
      }}>
        {/* Journey Progress */}
        <div style={{
          background: '#121214',
          border: '1px solid #1f1f23',
          borderRadius: '12px',
          padding: isMobile ? '16px' : '24px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, rgba(247, 208, 71, 0.2) 0%, rgba(247, 208, 71, 0.05) 100%)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Target size={20} color="#f7d047" />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Your Journey</h2>
                <p style={{ fontSize: '12px', color: '#71717a' }}>Step-by-step path</p>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            {!isMobile && (
              <div style={{
                position: 'absolute',
                left: '19px',
                top: '40px',
                bottom: '40px',
                width: '2px',
                background: '#27272a',
              }} />
            )}

            {journeySteps.map((step) => (
              <Link
                key={step.id}
                href={step.href}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: isMobile ? '12px' : '16px',
                  padding: isMobile ? '12px' : '16px',
                  marginBottom: '8px',
                  background: '#1a1a1c',
                  border: '1px solid #27272a',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: 'inherit',
                  position: 'relative',
                  transition: 'all 0.15s',
                  opacity: step.status === 'locked' ? 0.5 : 1,
                }}
              >
                <div style={{
                  width: isMobile ? '36px' : '40px',
                  height: isMobile ? '36px' : '40px',
                  background: step.status === 'completed' ? '#22c55e' : step.status === 'locked' ? '#27272a' : 'rgba(247, 208, 71, 0.15)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  zIndex: 1,
                }}>
                  {step.status === 'completed' ? (
                    <CheckCircle size={isMobile ? 16 : 20} color="white" />
                  ) : (
                    <step.icon size={isMobile ? 16 : 20} style={{ color: step.status === 'locked' ? '#52525b' : '#f7d047' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 600, marginBottom: '2px' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#71717a' }}>
                    {step.description}
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: '#52525b', flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div style={{
            background: '#121214',
            border: '1px solid #1f1f23',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '24px',
            marginBottom: '16px',
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Quick Actions</h2>
            {quickActions.map((action, i) => (
              <Link
                key={i}
                href={action.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: isMobile ? '12px' : '14px',
                  background: '#1a1a1c',
                  border: '1px solid #27272a',
                  borderRadius: '10px',
                  marginBottom: '10px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: `${action.color}15`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <action.icon size={18} style={{ color: action.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{action.title}</div>
                  <div style={{ fontSize: '11px', color: '#71717a' }}>{action.description}</div>
                </div>
                <ArrowRight size={16} style={{ color: '#52525b', flexShrink: 0 }} />
              </Link>
            ))}
          </div>

          {/* Pro Tip Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(247, 208, 71, 0.1) 0%, rgba(247, 208, 71, 0.02) 100%)',
            border: '1px solid rgba(247, 208, 71, 0.2)',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
            }}>
              <Award size={20} color="#f7d047" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#f7d047' }}>Pro Tip</span>
            </div>
            <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: 1.6 }}>
              Credit bureaus must respond within 30 days. Track deadlines carefully - missed deadlines give you leverage under FCRA.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
