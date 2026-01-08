"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Clock, Plus, CheckCircle, AlertCircle, Hourglass, X,
  Calendar, Building2, FileText, Bell, Mail, Trash2,
  ChevronDown, AlertTriangle
} from 'lucide-react';

const BUREAUS = ['Experian', 'Equifax', 'TransUnion'];
const DISPUTE_TYPES = [
  'Identity Theft (605B)',
  'Inaccurate Information',
  'Account Not Mine',
  'Incorrect Balance',
  'Incorrect Status',
  'Duplicate Account',
  'Other'
];

export default function TrackerPage() {
  const { user } = useUser();
  const [disputes, setDisputes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [settings, setSettings] = useState({
    deadlineReminders: true,
    reminderDaysBefore: 3,
    emailNotifications: true,
  });

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load disputes and settings from localStorage
  useEffect(() => {
    const savedDisputes = localStorage.getItem('605b_disputes');
    if (savedDisputes) {
      setDisputes(JSON.parse(savedDisputes));
    }

    const savedSettings = localStorage.getItem('605b_settings');
    if (savedSettings) {
      setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
    }
  }, []);

  // Check for upcoming deadlines and generate notifications
  useEffect(() => {
    if (!settings.deadlineReminders) return;

    const checkDeadlines = () => {
      const now = new Date();
      const newNotifications = [];

      disputes.forEach(dispute => {
        if (dispute.status === 'resolved' || dispute.status === 'escalated') return;

        const deadline = new Date(dispute.deadline);
        const daysUntil = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

        if (daysUntil <= 0) {
          newNotifications.push({
            id: `${dispute.id}-overdue`,
            type: 'urgent',
            title: 'Deadline Passed!',
            message: `${dispute.bureau} has missed the 30-day deadline for "${dispute.creditor}". Consider escalating.`,
            disputeId: dispute.id,
            createdAt: new Date().toISOString(),
          });
        } else if (daysUntil <= settings.reminderDaysBefore) {
          newNotifications.push({
            id: `${dispute.id}-reminder`,
            type: 'warning',
            title: `${daysUntil} day${daysUntil === 1 ? '' : 's'} until deadline`,
            message: `${dispute.bureau} must respond to "${dispute.creditor}" dispute by ${deadline.toLocaleDateString()}.`,
            disputeId: dispute.id,
            createdAt: new Date().toISOString(),
          });
        }
      });

      setNotifications(newNotifications);
      localStorage.setItem('605b_notifications', JSON.stringify(newNotifications));

      if (settings.emailNotifications && newNotifications.some(n => n.type === 'urgent')) {
        triggerEmailNotification(newNotifications.filter(n => n.type === 'urgent'));
      }
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, 60000);
    return () => clearInterval(interval);
  }, [disputes, settings]);

  const triggerEmailNotification = async (urgentNotifications) => {
    const lastEmailSent = localStorage.getItem('605b_last_email_notification');
    const today = new Date().toDateString();
    if (lastEmailSent === today) return;

    try {
      await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          notifications: urgentNotifications,
          email: user?.primaryEmailAddress?.emailAddress,
        }),
      });
      localStorage.setItem('605b_last_email_notification', today);
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  };

  const saveDisputes = (newDisputes) => {
    setDisputes(newDisputes);
    localStorage.setItem('605b_disputes', JSON.stringify(newDisputes));
  };

  const addDispute = (dispute) => {
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

    saveDisputes([...disputes, newDispute]);
    setShowAddModal(false);
  };

  const updateDisputeStatus = (id, status) => {
    const updated = disputes.map(d =>
      d.id === id ? { ...d, status, updatedAt: new Date().toISOString() } : d
    );
    saveDisputes(updated);
  };

  const deleteDispute = (id) => {
    if (confirm('Are you sure you want to delete this dispute?')) {
      saveDisputes(disputes.filter(d => d.id !== id));
    }
  };

  const stats = {
    active: disputes.filter(d => d.status === 'pending').length,
    pendingResponse: disputes.filter(d => d.status === 'pending').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
    escalated: disputes.filter(d => d.status === 'escalated').length,
  };

  const getDaysRemaining = (deadline) => {
    const now = new Date();
    const dl = new Date(deadline);
    return Math.ceil((dl - now) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status, daysRemaining) => {
    if (status === 'resolved') return '#22c55e';
    if (status === 'escalated') return '#ef4444';
    if (daysRemaining <= 0) return '#ef4444';
    if (daysRemaining <= 7) return '#f59e0b';
    return '#3b82f6';
  };

  return (
    <>
      {/* Notifications Banner */}
      {notifications.length > 0 && (
        <div style={{
          background: notifications.some(n => n.type === 'urgent')
            ? 'rgba(239, 68, 68, 0.1)'
            : 'rgba(245, 158, 11, 0.1)',
          border: `1px solid ${notifications.some(n => n.type === 'urgent') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
          borderRadius: '12px',
          padding: isMobile ? '12px 16px' : '16px 20px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertTriangle
              size={20}
              style={{
                color: notifications.some(n => n.type === 'urgent') ? '#ef4444' : '#f59e0b',
                flexShrink: 0,
                marginTop: '2px',
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 600,
                fontSize: '14px',
                marginBottom: '4px',
                color: notifications.some(n => n.type === 'urgent') ? '#ef4444' : '#f59e0b',
              }}>
                {notifications.some(n => n.type === 'urgent')
                  ? 'Action Required!'
                  : 'Upcoming Deadlines'}
              </div>
              {notifications.slice(0, 3).map((notif) => (
                <div key={notif.id} style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '4px', wordBreak: 'break-word' }}>
                  • {notif.message}
                </div>
              ))}
              {notifications.length > 3 && (
                <div style={{ fontSize: '12px', color: '#71717a', marginTop: '8px' }}>
                  +{notifications.length - 3} more notification{notifications.length - 3 > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
          <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 600, marginBottom: '4px' }}>Dispute Tracker</h1>
          <p style={{ fontSize: '14px', color: '#737373' }}>Track deadlines and responses</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: 'linear-gradient(135deg, #f7d047 0%, #d4b840 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#0a0a0b',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            width: isMobile ? '100%' : 'auto',
          }}
        >
          <Plus size={18} />
          New Dispute
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '12px' : '16px',
        marginBottom: '24px'
      }}>
        {[
          { label: 'Active', value: stats.active, icon: Hourglass, color: '#f7d047' },
          { label: 'Pending', value: stats.pendingResponse, icon: Clock, color: '#3b82f6' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: '#22c55e' },
          { label: 'Escalated', value: stats.escalated, icon: AlertCircle, color: '#ef4444' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: '#121214',
            border: '1px solid #1f1f23',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#737373' }}>{stat.label}</span>
              <stat.icon size={16} style={{ color: stat.color }} />
            </div>
            <div style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: 600 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Disputes List */}
      {disputes.length > 0 ? (
        <div style={{
          background: '#121214',
          border: '1px solid #1f1f23',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {/* Desktop Table Header */}
          {!isMobile && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 120px',
              padding: '14px 20px',
              borderBottom: '1px solid #1f1f23',
              fontSize: '12px',
              fontWeight: 600,
              color: '#71717a',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              <div>Dispute</div>
              <div>Bureau</div>
              <div>Date Sent</div>
              <div>Deadline</div>
              <div>Actions</div>
            </div>
          )}

          {disputes.sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).map((dispute) => {
            const daysRemaining = getDaysRemaining(dispute.deadline);
            const statusColor = getStatusColor(dispute.status, daysRemaining);

            // Mobile Card Layout
            if (isMobile) {
              return (
                <div
                  key={dispute.id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #1f1f23',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, marginBottom: '4px', wordBreak: 'break-word' }}>{dispute.creditor}</div>
                      <div style={{ fontSize: '12px', color: '#71717a' }}>{dispute.type}</div>
                    </div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 500,
                      background: `${statusColor}15`,
                      color: statusColor,
                      flexShrink: 0,
                      marginLeft: '8px',
                    }}>
                      {dispute.status === 'resolved' ? (
                        <><CheckCircle size={10} /> Resolved</>
                      ) : dispute.status === 'escalated' ? (
                        <><AlertCircle size={10} /> Escalated</>
                      ) : daysRemaining <= 0 ? (
                        <><AlertTriangle size={10} /> Overdue</>
                      ) : (
                        <><Clock size={10} /> {daysRemaining}d</>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#a1a1aa', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Building2 size={12} /> {dispute.bureau}
                    </span>
                    <span>Sent: {new Date(dispute.dateSent).toLocaleDateString()}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={dispute.status}
                      onChange={(e) => updateDisputeStatus(dispute.id, e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: '#1a1a1c',
                        border: '1px solid #27272a',
                        borderRadius: '6px',
                        color: '#fafafa',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="resolved">Resolved</option>
                      <option value="escalated">Escalated</option>
                    </select>
                    <button
                      onClick={() => deleteDispute(dispute.id)}
                      style={{
                        padding: '8px 12px',
                        background: 'transparent',
                        border: '1px solid #27272a',
                        borderRadius: '6px',
                        color: '#71717a',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            }

            // Desktop Row Layout
            return (
              <div
                key={dispute.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 120px',
                  padding: '16px 20px',
                  borderBottom: '1px solid #1f1f23',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>{dispute.creditor}</div>
                  <div style={{ fontSize: '12px', color: '#71717a' }}>{dispute.type}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <Building2 size={14} style={{ color: '#71717a' }} />
                  {dispute.bureau}
                </div>
                <div style={{ fontSize: '14px', color: '#a1a1aa' }}>
                  {new Date(dispute.dateSent).toLocaleDateString()}
                </div>
                <div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 500,
                    background: `${statusColor}15`,
                    color: statusColor,
                  }}>
                    {dispute.status === 'resolved' ? (
                      <><CheckCircle size={12} /> Resolved</>
                    ) : dispute.status === 'escalated' ? (
                      <><AlertCircle size={12} /> Escalated</>
                    ) : daysRemaining <= 0 ? (
                      <><AlertTriangle size={12} /> Overdue</>
                    ) : (
                      <><Clock size={12} /> {daysRemaining}d left</>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={dispute.status}
                    onChange={(e) => updateDisputeStatus(dispute.id, e.target.value)}
                    style={{
                      padding: '6px 8px',
                      background: '#1a1a1c',
                      border: '1px solid #27272a',
                      borderRadius: '6px',
                      color: '#fafafa',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="escalated">Escalated</option>
                  </select>
                  <button
                    onClick={() => deleteDispute(dispute.id)}
                    style={{
                      padding: '6px',
                      background: 'transparent',
                      border: '1px solid #27272a',
                      borderRadius: '6px',
                      color: '#71717a',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Empty State
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
            <Clock size={32} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No Active Disputes</h2>
          <p style={{ fontSize: '14px', color: '#737373', maxWidth: '400px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Start tracking your disputes to monitor deadlines and bureau responses.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
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
              cursor: 'pointer'
            }}
          >
            <Plus size={18} />
            Add Your First Dispute
          </button>
        </div>
      )}

      {/* Add Dispute Modal */}
      {showAddModal && (
        <AddDisputeModal
          onClose={() => setShowAddModal(false)}
          onAdd={addDispute}
          isMobile={isMobile}
        />
      )}
    </>
  );
}

function AddDisputeModal({ onClose, onAdd, isMobile }) {
  const [form, setForm] = useState({
    creditor: '',
    bureau: 'Experian',
    type: 'Identity Theft (605B)',
    dateSent: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.creditor || !form.dateSent) return;
    onAdd(form);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: isMobile ? '0' : '20px',
    }}>
      <div style={{
        background: '#121214',
        border: '1px solid #27272a',
        borderRadius: isMobile ? '16px 16px 0 0' : '16px',
        width: '100%',
        maxWidth: isMobile ? '100%' : '500px',
        maxHeight: isMobile ? '90vh' : '90vh',
        overflow: 'auto',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #1f1f23',
          position: 'sticky',
          top: 0,
          background: '#121214',
          zIndex: 1,
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Add New Dispute</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '8px',
              color: '#a1a1aa',
            }}>
              Creditor / Account Name *
            </label>
            <input
              type="text"
              value={form.creditor}
              onChange={(e) => setForm({ ...form, creditor: e.target.value })}
              placeholder="e.g., Capital One Credit Card"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#1a1a1c',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#fafafa',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '8px',
                color: '#a1a1aa',
              }}>
                Credit Bureau
              </label>
              <select
                value={form.bureau}
                onChange={(e) => setForm({ ...form, bureau: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#1a1a1c',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: '#fafafa',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {BUREAUS.map(bureau => (
                  <option key={bureau} value={bureau}>{bureau}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '8px',
                color: '#a1a1aa',
              }}>
                Dispute Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#1a1a1c',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: '#fafafa',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {DISPUTE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '8px',
              color: '#a1a1aa',
            }}>
              Date Sent *
            </label>
            <input
              type="date"
              value={form.dateSent}
              onChange={(e) => setForm({ ...form, dateSent: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#1a1a1c',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#fafafa',
                fontSize: '14px',
              }}
            />
            <p style={{ fontSize: '11px', color: '#71717a', marginTop: '6px' }}>
              30-day deadline will be calculated automatically
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '8px',
              color: '#a1a1aa',
            }}>
              Notes (optional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any additional details..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#1a1a1c',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#fafafa',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column-reverse' : 'row' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: 'transparent',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#a1a1aa',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px',
                background: 'linear-gradient(135deg, #f7d047 0%, #d4b840 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#09090b',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Add Dispute
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
