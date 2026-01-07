"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Search, Sparkles, FileText, Clock, Flag, FileCheck, 
  ChevronLeft, ChevronRight
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user } = useUser();
  const pathname = usePathname();
  const isAIStrategist = pathname === '/dashboard/ai-strategist';
  const [rightSidebarOpen, setRightSidebarOpen] = useState(!isAIStrategist);

  // Auto-close sidebar when navigating to AI Strategist
  useEffect(() => {
    if (isAIStrategist) {
      setRightSidebarOpen(false);
    }
  }, [isAIStrategist]);

  const sidebarItems = [
    { id: 'analyze', label: 'Analyze', icon: Search, section: 'CORE', href: '/dashboard' },
    { id: 'ai-strategist', label: 'AI Strategist', icon: Sparkles, section: 'CORE', href: '/dashboard/ai-strategist' },
    { id: 'templates', label: 'Templates', icon: FileText, section: 'CORE', href: '/dashboard/templates' },
    { id: 'tracker', label: 'Tracker', icon: Clock, section: 'MANAGE', href: '/dashboard/tracker' },
    { id: 'flagged', label: 'Flagged', icon: Flag, section: 'MANAGE', href: '/dashboard/flagged' },
    { id: 'audit-log', label: 'Audit Log', icon: FileCheck, section: 'MANAGE', href: '/dashboard/audit-log' },
  ];

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#0a0a0b',
      color: '#e5e5e5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* LEFT SIDEBAR */}
      <aside style={{
        width: '200px',
        background: '#0d0d0f',
        borderRight: '1px solid #1a1a1c',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50
      }}>
        <div style={{ padding: '20px', fontSize: '20px', fontWeight: 700, borderBottom: '1px solid #1a1a1c' }}>
          605b<span style={{ color: '#f7d047' }}>.ai</span>
        </div>
        
        <nav style={{ flex: 1, padding: '8px' }}>
          {['CORE', 'MANAGE'].map(section => (
            <div key={section}>
              <div style={{ padding: '16px 12px 8px', fontSize: '11px', fontWeight: 600, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{section}</div>
              {sidebarItems.filter(item => item.section === section).map(item => {
                const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/dashboard');
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
                      color: isActive ? '#f7d047' : '#a3a3a3',
                      background: isActive ? 'rgba(247, 208, 71, 0.1)' : 'transparent',
                      fontSize: '14px',
                      cursor: 'pointer',
                      marginBottom: '2px',
                      textDecoration: 'none'
                    }}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid #1a1a1c', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #f7d047 0%, #d4b840 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            color: '#0a0a0b',
            fontSize: '14px'
          }}>
            {user?.firstName?.[0] || 'M'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 500 }}>{user?.firstName || 'Michael'}</div>
            <div style={{ fontSize: '11px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', display: 'inline-block' }}></span>
              Synced
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{
        flex: 1,
        marginLeft: '200px',
        marginRight: (rightSidebarOpen && !isAIStrategist) ? '340px' : '0px',
        padding: '24px 32px',
        minHeight: '100vh',
        overflowY: 'auto',
        transition: 'margin-right 0.3s ease'
      }}>
        {children}
      </main>

      {/* RIGHT SIDEBAR TOGGLE - only show when NOT on AI Strategist */}
      {!isAIStrategist && !rightSidebarOpen && (
        <button
          onClick={() => setRightSidebarOpen(true)}
          style={{
            position: 'fixed',
            right: '0',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '32px',
            height: '64px',
            background: '#1a1a1c',
            border: '1px solid #262629',
            borderRight: 'none',
            borderRadius: '8px 0 0 8px',
            color: '#f7d047',
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

      {/* RIGHT SIDEBAR - QUICK AI PANEL (hidden on AI Strategist page) */}
      {!isAIStrategist && (
        <aside style={{
          width: '340px',
          background: '#0d0d0f',
          borderLeft: '1px solid #1a1a1c',
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
              background: '#1a1a1c',
              border: '1px solid #262629',
              borderRadius: '8px 0 0 8px',
              color: '#737373',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 60
            }}
          >
            <ChevronRight size={20} />
          </button>

          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a1c', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #f7d047 0%, #d4b840 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={22} style={{ color: '#0a0a0b' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>Quick AI Help</div>
              <div style={{ fontSize: '12px', color: '#737373' }}>
                <Link href="/dashboard/ai-strategist" style={{ color: '#f7d047', textDecoration: 'none' }}>
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
                background: 'rgba(247, 208, 71, 0.1)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#f7d047'
              }}>
                <Sparkles size={24} />
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>AI Strategist</h4>
              <p style={{ fontSize: '13px', color: '#737373', lineHeight: 1.5, marginBottom: '20px' }}>
                Get personalized credit repair guidance. Click below to start a full conversation.
              </p>
              <Link 
                href="/dashboard/ai-strategist"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #f7d047 0%, #d4b840 100%)',
                  borderRadius: '10px',
                  color: '#09090b',
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
                  background: '#1a1a1c',
                  border: '1px solid #262629',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#a3a3a3',
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
      )}
    </div>
  );
}
