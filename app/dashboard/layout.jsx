"use client";

import { useState, useEffect, useRef } from 'react';
import { useUser, useAuth, SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search, Sparkles, FileText, Clock, Flag, FileCheck,
  ChevronLeft, ChevronRight, LogOut, Settings, User, ChevronUp, TrendingUp, Bell, Menu, X, Lock, Crown
} from 'lucide-react';
import Image from 'next/image';
import OnboardingWizard from './components/OnboardingWizard';
import { useUserTier, AccessRestrictionBanner } from '@/lib/useUserTier';

export default function DashboardLayout({ children }) {
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const { tier, tierName, tierColor, hasFeature, isAccessFrozen, isAccessRevoked, isBeta } = useUserTier();
  const pathname = usePathname();
  const isAIStrategist = pathname === '/dashboard/ai-strategist';
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const userMenuRef = useRef(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if onboarding is complete (localStorage first, then server)
  useEffect(() => {
    if (!user || onboardingChecked) return;

    const checkOnboarding = async () => {
      // Check localStorage first (instant)
      const localComplete = localStorage.getItem('605b_onboarding_complete');
      if (localComplete === 'true') {
        setOnboardingChecked(true);
        return;
      }

      // Check server if signed in
      if (isSignedIn) {
        try {
          const res = await fetch('/api/user-data/profile');
          if (res.ok) {
            const { profile } = await res.json();
            if (profile?.onboardingComplete) {
              // Sync to localStorage
              localStorage.setItem('605b_onboarding_complete', 'true');
              localStorage.setItem('605b_user_profile', JSON.stringify(profile));
              setOnboardingChecked(true);
              return;
            }
          }
        } catch (error) {
          console.error('Failed to check onboarding status:', error);
        }
      }

      // Not complete - show onboarding
      setShowOnboarding(true);
      setOnboardingChecked(true);
    };

    checkOnboarding();
  }, [user, isSignedIn, onboardingChecked]);

  // Load notifications from localStorage and check periodically
  useEffect(() => {
    const loadNotifications = () => {
      const savedNotifications = localStorage.getItem('605b_notifications');
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);

    const handleStorageChange = (e) => {
      if (e.key === '605b_notifications') {
        loadNotifications();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Close mobile sidebar when navigating
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem('605b_onboarding_complete', 'true');
    setShowOnboarding(false);
  };

  const sidebarItems = [
    { id: 'progress', label: 'Progress', icon: TrendingUp, section: 'CORE', href: '/dashboard/progress' },
    { id: 'analyze', label: 'Analyze', icon: Search, section: 'CORE', href: '/dashboard' },
    { id: 'ai-strategist', label: 'AI Strategist', icon: Sparkles, section: 'CORE', href: '/dashboard/ai-strategist', requiresTier: 'advanced' },
    { id: 'templates', label: 'Templates', icon: FileText, section: 'CORE', href: '/dashboard/templates' },
    { id: 'tracker', label: 'Tracker', icon: Clock, section: 'MANAGE', href: '/dashboard/tracker', requiresTier: 'toolkit' },
    { id: 'flagged', label: 'Flagged', icon: Flag, section: 'MANAGE', href: '/dashboard/flagged' },
    { id: 'audit-log', label: 'Audit Log', icon: FileCheck, section: 'MANAGE', href: '/dashboard/audit-log' },
    { id: 'settings', label: 'Settings', icon: Settings, section: 'MANAGE', href: '/dashboard/settings' },
    { id: 'account', label: 'Account', icon: User, section: 'MANAGE', href: '/dashboard/account' },
  ];

  // Check if user has access to a feature based on tier
  const hasTierAccess = (requiredTier) => {
    const tierLevels = { 'free': 0, 'toolkit': 1, 'advanced': 2, 'identity-theft': 3 };
    return tierLevels[tier] >= tierLevels[requiredTier];
  };

  const SidebarContent = () => (
    <>
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Image
            src="/logos/secondary/605b-chevron-cursor.svg"
            alt="605b"
            width={24}
            height={24}
          />
          <span style={{ fontSize: '16px', fontWeight: 600 }}>605b.ai</span>
        </div>
        {isMobile && (
          <button
            onClick={() => setMobileSidebarOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={24} />
          </button>
        )}
      </div>

      <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        {['CORE', 'MANAGE'].map(section => (
          <div key={section}>
            <div style={{ padding: '16px 12px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{section}</div>
            {sidebarItems.filter(item => item.section === section).map(item => {
              const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/dashboard');
              const isLocked = item.requiresTier && !hasTierAccess(item.requiresTier);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    color: isLocked ? 'var(--text-muted)' : (isActive ? 'var(--orange)' : 'var(--text-secondary)'),
                    background: isActive ? 'var(--orange-dim)' : 'transparent',
                    fontSize: '14px',
                    cursor: 'pointer',
                    marginBottom: '2px',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    borderLeft: isActive ? '2px solid var(--orange)' : '2px solid transparent',
                    position: 'relative',
                    opacity: isLocked ? 0.7 : 1,
                  }}
                >
                  <item.icon size={18} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isLocked && (
                    <Lock size={12} style={{ color: 'var(--text-muted)' }} />
                  )}
                  {item.id === 'tracker' && !isLocked && notifications.length > 0 && (
                    <span style={{
                      minWidth: '18px',
                      height: '18px',
                      padding: '0 5px',
                      background: notifications.some(n => n.type === 'urgent') ? 'var(--red)' : 'var(--yellow)',
                      borderRadius: '9px',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: notifications.some(n => n.type === 'urgent') ? 'pulse 2s infinite' : 'none',
                    }}>
                      {notifications.length}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Menu */}
      <div ref={userMenuRef} style={{ position: 'relative' }}>
        {userMenuOpen && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '8px',
            right: '8px',
            marginBottom: '8px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)',
            animation: 'slideUp 0.15s ease-out',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                {user?.firstName} {user?.lastName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', wordBreak: 'break-all' }}>
                {user?.primaryEmailAddress?.emailAddress}
              </div>
              {/* Tier Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  background: `${tierColor}15`,
                  border: `1px solid ${tierColor}30`,
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: tierColor,
                  textTransform: 'uppercase',
                }}>
                  {tier === 'identity-theft' && <Crown size={10} />}
                  {tierName}
                </div>
                {isBeta && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#22c55e',
                    textTransform: 'uppercase',
                  }}>
                    BETA
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '8px' }}>
              {tier !== 'identity-theft' && (
                <Link
                  href="/dashboard/account"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    background: 'var(--orange-dim)',
                    border: '1px solid rgba(255, 107, 53, 0.2)',
                    borderRadius: '8px',
                    color: 'var(--orange)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    textDecoration: 'none',
                    marginBottom: '4px',
                  }}
                >
                  <Crown size={16} />
                  Upgrade Plan
                </Link>
              )}
              <Link
                href="/dashboard/settings"
                onClick={() => setUserMenuOpen(false)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  textDecoration: 'none',
                }}
              >
                <Settings size={16} />
                Settings
              </Link>

              <SignOutButton>
                <button
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </SignOutButton>
            </div>
          </div>
        )}

        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          style={{
            width: '100%',
            padding: '16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: userMenuOpen ? 'var(--orange-dim)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            background: 'var(--orange)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            color: 'white',
            fontSize: '14px',
            flexShrink: 0,
          }}>
            {user?.firstName?.[0] || 'U'}
          </div>
          <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.firstName || 'User'}</div>
            <div style={{ fontSize: '11px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{
                width: '6px',
                height: '6px',
                background: 'var(--green)',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'pulseGlow 2s ease-in-out infinite'
              }}></span>
              Synced
            </div>
          </div>
          <ChevronUp
            size={16}
            style={{
              color: 'var(--text-muted)',
              transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s',
              flexShrink: 0,
            }}
          />
        </button>
      </div>
    </>
  );

  return (
    <>
      {showOnboarding && (
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        {/* MOBILE HEADER */}
        {isMobile && (
          <header style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '56px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            zIndex: 100,
          }}>
            <button
              onClick={() => setMobileSidebarOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '8px' }}
            >
              <Menu size={24} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Image
                src="/logos/secondary/605b-chevron-cursor.svg"
                alt="605b"
                width={24}
                height={24}
              />
              <span style={{ fontSize: '16px', fontWeight: 600 }}>605b.ai</span>
            </div>
            <div style={{ width: '40px' }} />
          </header>
        )}

        {/* MOBILE SIDEBAR OVERLAY */}
        {isMobile && mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 199,
            }}
          />
        )}

        {/* LEFT SIDEBAR */}
        <aside style={{
          width: isMobile ? '280px' : '240px',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: isMobile ? (mobileSidebarOpen ? '0' : '-280px') : 0,
          bottom: 0,
          zIndex: 200,
          transition: 'left 0.3s ease',
        }}>
          <SidebarContent />
        </aside>

        {/* MAIN CONTENT */}
        <main style={{
          flex: 1,
          marginLeft: isMobile ? 0 : '240px',
          marginRight: (!isMobile && rightSidebarOpen && !isAIStrategist) ? '340px' : '0px',
          padding: isMobile ? '72px 16px 16px' : '24px 32px',
          minHeight: '100vh',
          overflowY: 'auto',
          transition: 'margin-right 0.3s ease',
          width: isMobile ? '100%' : 'auto',
        }}>
          <AccessRestrictionBanner />
          {children}
        </main>

        {/* RIGHT SIDEBAR - Desktop only */}
        {!isMobile && !isAIStrategist && (
          <>
            {!rightSidebarOpen && (
              <button
                onClick={() => setRightSidebarOpen(true)}
                style={{
                  position: 'fixed',
                  right: '0',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '32px',
                  height: '64px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRight: 'none',
                  borderRadius: '8px 0 0 8px',
                  color: 'var(--orange)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 60
                }}
              >
                <ChevronLeft size={20} />
              </button>
            )}

            <aside style={{
              width: '340px',
              background: 'var(--bg-secondary)',
              borderLeft: '1px solid var(--border)',
              position: 'fixed',
              top: 0,
              right: rightSidebarOpen ? '0' : '-340px',
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              zIndex: 50,
              transition: 'right 0.3s ease'
            }}>
              <button
                onClick={() => setRightSidebarOpen(false)}
                style={{
                  position: 'absolute',
                  left: '-16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '32px',
                  height: '64px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px 0 0 8px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 60
                }}
              >
                <ChevronRight size={20} />
              </button>

              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'var(--orange)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={22} style={{ color: 'white' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>Quick AI Help</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    <Link href="/dashboard/ai-strategist" style={{ color: 'var(--orange)', textDecoration: 'none' }}>
                      Open full chat →
                    </Link>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'var(--orange-dim)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: 'var(--orange)'
                  }}>
                    <Sparkles size={24} />
                  </div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>AI Strategist</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
                    Get personalized credit reinvestigation guidance. Click below to start a full conversation.
                  </p>
                  <Link
                    href="/dashboard/ai-strategist"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      background: 'var(--orange)',
                      borderRadius: '10px',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '14px',
                      textDecoration: 'none',
                    }}
                  >
                    <Sparkles size={18} />
                    Start Conversation
                  </Link>
                </div>
              </div>

              <div style={{ padding: '16px' }}>
                {['What should I dispute first?', 'Explain my rights under 605B', 'How do I track deadlines?'].map((q, i) => (
                  <Link
                    key={i}
                    href="/dashboard/ai-strategist"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '12px 16px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      textAlign: 'left',
                      marginBottom: '8px',
                      textDecoration: 'none',
                    }}
                  >
                    {q}
                  </Link>
                ))}
              </div>
            </aside>
          </>
        )}
      </div>
    </>
  );
}
