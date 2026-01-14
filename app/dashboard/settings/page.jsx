"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Bell, Mail, Volume2, Shield, Clock, Save, Check,
  ChevronRight, Moon, Smartphone
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useUser();
  const [saved, setSaved] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    deadlineReminders: true,
    reminderDaysBefore: 3,
    siteNotifications: true,
    voiceEnabled: true,
    voiceSpeed: 1.0,
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const savedSettings = localStorage.getItem('605b_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('605b_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const ToggleSwitch = ({ enabled, onToggle }) => (
    <button
      onClick={onToggle}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: enabled ? '#f7d047' : '#27272a',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: enabled ? '#09090b' : '#71717a',
        position: 'absolute',
        top: '3px',
        left: enabled ? '23px' : '3px',
        transition: 'left 0.2s, background 0.2s',
      }} />
    </button>
  );

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
        <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 600, marginBottom: '4px' }}>Settings</h1>
        <p style={{ fontSize: '14px', color: '#71717a' }}>
          Manage your preferences
        </p>
      </div>

      {/* Account Info */}
      <div style={{
        background: '#121214',
        border: '1px solid #1f1f23',
        borderRadius: '12px',
        padding: isMobile ? '16px' : '20px 24px',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px' }}>
          <div style={{
            width: isMobile ? '40px' : '48px',
            height: isMobile ? '40px' : '48px',
            background: 'linear-gradient(135deg, #f7d047 0%, #d4b840 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            color: '#09090b',
            fontSize: isMobile ? '16px' : '18px',
            flexShrink: 0,
          }}>
            {user?.firstName?.[0] || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div style={{ fontSize: isMobile ? '12px' : '13px', color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.primaryEmailAddress?.emailAddress}
            </div>
          </div>
          <Shield size={isMobile ? 18 : 20} style={{ color: '#22c55e', flexShrink: 0 }} />
        </div>
      </div>

      {/* Notification Settings */}
      <div style={{
        background: '#121214',
        border: '1px solid #1f1f23',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '16px',
      }}>
        <div style={{
          padding: isMobile ? '14px 16px' : '16px 24px',
          borderBottom: '1px solid #1f1f23',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <Bell size={18} style={{ color: '#f7d047' }} />
          <span style={{ fontSize: '15px', fontWeight: 600 }}>Notifications</span>
        </div>

        {/* Email Notifications */}
        <div style={{
          padding: isMobile ? '14px 16px' : '16px 24px',
          borderBottom: '1px solid #1f1f23',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <Mail size={18} style={{ color: '#71717a', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>Email Notifications</div>
              <div style={{ fontSize: '12px', color: '#71717a' }}>
                Receive deadline reminders via email
              </div>
            </div>
          </div>
          <ToggleSwitch
            enabled={settings.emailNotifications}
            onToggle={() => updateSetting('emailNotifications', !settings.emailNotifications)}
          />
        </div>

        {/* Deadline Reminders */}
        <div style={{
          padding: isMobile ? '14px 16px' : '16px 24px',
          borderBottom: '1px solid #1f1f23',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <Clock size={18} style={{ color: '#71717a', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>Deadline Reminders</div>
              <div style={{ fontSize: '12px', color: '#71717a' }}>
                Get notified before deadlines
              </div>
            </div>
          </div>
          <ToggleSwitch
            enabled={settings.deadlineReminders}
            onToggle={() => updateSetting('deadlineReminders', !settings.deadlineReminders)}
          />
        </div>

        {/* Reminder Days */}
        {settings.deadlineReminders && (
          <div style={{
            padding: isMobile ? '14px 16px' : '16px 24px',
            borderBottom: '1px solid #1f1f23',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <div style={{ marginLeft: isMobile ? '0' : '30px' }}>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>Remind me</div>
              <div style={{ fontSize: '12px', color: '#71717a' }}>
                Days before deadline
              </div>
            </div>
            <select
              value={settings.reminderDaysBefore}
              onChange={(e) => updateSetting('reminderDaysBefore', Number(e.target.value))}
              style={{
                padding: '8px 12px',
                background: '#1a1a1c',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#fafafa',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={5}>5 days</option>
              <option value={7}>7 days</option>
            </select>
          </div>
        )}

        {/* Site Notifications */}
        <div style={{
          padding: isMobile ? '14px 16px' : '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <Smartphone size={18} style={{ color: '#71717a', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>Site Notifications</div>
              <div style={{ fontSize: '12px', color: '#71717a' }}>
                Show badges in the app
              </div>
            </div>
          </div>
          <ToggleSwitch
            enabled={settings.siteNotifications}
            onToggle={() => updateSetting('siteNotifications', !settings.siteNotifications)}
          />
        </div>
      </div>

      {/* Voice Settings */}
      <div style={{
        background: '#121214',
        border: '1px solid #1f1f23',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '24px',
      }}>
        <div style={{
          padding: isMobile ? '14px 16px' : '16px 24px',
          borderBottom: '1px solid #1f1f23',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <Volume2 size={18} style={{ color: '#f7d047' }} />
          <span style={{ fontSize: '15px', fontWeight: 600 }}>Voice & Audio</span>
        </div>

        <div style={{
          padding: isMobile ? '14px 16px' : '16px 24px',
          borderBottom: '1px solid #1f1f23',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 500 }}>Voice Mode</div>
            <div style={{ fontSize: '12px', color: '#71717a' }}>
              Voice conversations with AI
            </div>
          </div>
          <ToggleSwitch
            enabled={settings.voiceEnabled}
            onToggle={() => updateSetting('voiceEnabled', !settings.voiceEnabled)}
          />
        </div>

        {settings.voiceEnabled && (
          <div style={{
            padding: isMobile ? '14px 16px' : '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>Voice Speed</div>
              <div style={{ fontSize: '12px', color: '#71717a' }}>
                AI voice playback speed
              </div>
            </div>
            <select
              value={settings.voiceSpeed}
              onChange={(e) => updateSetting('voiceSpeed', Number(e.target.value))}
              style={{
                padding: '8px 12px',
                background: '#1a1a1c',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#fafafa',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <option value={0.75}>Slow</option>
              <option value={1.0}>Normal</option>
              <option value={1.25}>Fast</option>
              <option value={1.5}>Very Fast</option>
            </select>
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          padding: isMobile ? '12px 20px' : '14px 24px',
          background: saved ? '#22c55e' : 'linear-gradient(135deg, #f7d047 0%, #d4b840 100%)',
          border: 'none',
          borderRadius: '10px',
          color: '#09090b',
          fontSize: '15px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {saved ? (
          <>
            <Check size={20} />
            Saved!
          </>
        ) : (
          <>
            <Save size={20} />
            Save Settings
          </>
        )}
      </button>

      <p style={{
        textAlign: 'center',
        fontSize: '12px',
        color: '#52525b',
        marginTop: '16px',
      }}>
        Settings are saved locally to your browser
      </p>
    </div>
  );
}
