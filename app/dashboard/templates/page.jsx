"use client";

import { useState } from 'react';
import { Shield, FileText, AlertTriangle, Building, Scale, Download, Eye, Search, X, Copy, Check, FileWarning, Building2, CreditCard, Clock, Landmark, Lock } from 'lucide-react';
import { TEMPLATES, getLetterContent } from '@/lib/templates';
import { useUserTier } from '@/lib/useUserTier';
import { UpgradePrompt, LockedBadge } from '../components/UpgradePrompt';

// Flatten templates for display
const getAllTemplates = () => {
  const allTemplates = [];
  Object.entries(TEMPLATES).forEach(([categoryKey, category]) => {
    category.templates.forEach(template => {
      allTemplates.push({
        ...template,
        categoryKey,
        categoryLabel: category.category,
        categoryIcon: category.icon,
      });
    });
  });
  return allTemplates;
};

const CATEGORY_ICONS = {
  identity_theft: Shield,
  disputes: FileWarning,
  debt_collection: AlertTriangle,
  specialty: Building2,
  banking: CreditCard,
  escalation: Scale,
  followup: Clock,
};

const PRIORITY_COLORS = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#22c55e',
  info: '#6b7280',
};

// Template tier requirements by category
// free = no templates (can only view names/descriptions)
// toolkit = basic dispute templates
// advanced = full library except 605B
// identity-theft = everything including 605B workflows
const CATEGORY_TIERS = {
  identity_theft: 'identity-theft',  // Only identity-theft tier
  disputes: 'toolkit',               // Toolkit and above
  debt_collection: 'advanced',       // Advanced and above
  specialty: 'advanced',             // Advanced and above
  banking: 'advanced',               // Advanced and above
  escalation: 'advanced',            // Advanced and above
  followup: 'toolkit',               // Toolkit and above
};

// Toolkit tier templates - basic bureau disputes and debt validation
const TOOLKIT_TEMPLATE_IDS = [
  // Credit Bureau Disputes (disputes category)
  '611_dispute',
  '609_disclosure',
  '623_direct',
  'reinvestigation_failure',
  'outdated_info_removal',
  'balance_dispute',
  'account_ownership_dispute',
  'late_payment_dispute',
  // Follow-up templates (followup category)
  'no_response_followup',
  'dispute_response_rebuttal',
  'certified_mail_instructions',
  'documentation_checklist',
  'consumer_statement',
];

// Advanced tier adds these (on top of toolkit)
const ADVANCED_TEMPLATE_IDS = [
  // Remaining disputes
  'reinsertion_notice',
  'public_record_dispute',
  // All debt collection
  '809_validation',
  'cease_desist',
  'pay_delete',
  'time_barred_debt',
  'id_theft_to_collector',
  'harassment_complaint',
  'third_party_disclosure',
  'workplace_contact_cease',
  'goodwill_adjustment',
  'settlement_offer',
  // All specialty agencies
  'chex_dispute',
  'ews_dispute',
  'lexis_dispute',
  'innovis_dispute',
  'nctue_dispute',
  'telecheck_dispute',
  'clue_dispute',
  'corelogic_dispute',
  'medical_debt_dispute',
  'sagestream_dispute',
  // All banking
  'reg_e_dispute',
  'reg_z_dispute',
  'billing_error_notice',
  'provisional_credit_demand',
  'fraud_claim_appeal',
  'account_closure_fraud',
  // All escalation
  'cfpb_complaint',
  'state_ag',
  'intent_to_sue',
  'occ_complaint',
  'fdic_complaint',
  'ncua_complaint',
  'ftc_complaint',
  'small_claims_demand',
];

// Identity theft tier adds these (full 605B workflows)
const IDENTITY_THEFT_TEMPLATE_IDS = [
  '605b_bureau',
  '605b_furnisher',
  'extended_fraud_alert',
  'initial_fraud_alert',
  'credit_freeze',
  'police_report_request',
  'fraudulent_inquiry_removal',
  'ssa_notification',
  'irs_14039',
  'fraudulent_bank_closure',
  'address_dispute',
  'ftc_affidavit',
];

export default function TemplatesPage() {
  const { tier, hasFeature, loading: tierLoading } = useUserTier();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Tier hierarchy for comparisons
  const TIER_LEVELS = { 'free': 0, 'toolkit': 1, 'advanced': 2, 'identity-theft': 3 };
  const userTierLevel = TIER_LEVELS[tier] || 0;

  // Check if a specific template is accessible based on user's tier
  const isTemplateAccessible = (template) => {
    // Free tier has no template access
    if (userTierLevel === 0) return false;

    // External links (like FTC, annualcreditreport) are always accessible
    if (template.external) return true;

    // Identity-theft tier templates require identity-theft tier
    if (IDENTITY_THEFT_TEMPLATE_IDS.includes(template.id)) {
      return userTierLevel >= 3; // identity-theft tier
    }

    // Advanced tier templates require advanced or higher
    if (ADVANCED_TEMPLATE_IDS.includes(template.id)) {
      return userTierLevel >= 2; // advanced or identity-theft
    }

    // Toolkit templates require toolkit or higher
    if (TOOLKIT_TEMPLATE_IDS.includes(template.id)) {
      return userTierLevel >= 1; // toolkit, advanced, or identity-theft
    }

    // Default: require advanced for any unmapped templates
    return userTierLevel >= 2;
  };

  // For upgrade prompts - determine what tier is needed for a template
  const getRequiredTier = (template) => {
    if (IDENTITY_THEFT_TEMPLATE_IDS.includes(template.id)) return 'identity-theft';
    if (ADVANCED_TEMPLATE_IDS.includes(template.id)) return 'advanced';
    if (TOOLKIT_TEMPLATE_IDS.includes(template.id)) return 'toolkit';
    return 'advanced';
  };

  const allTemplates = getAllTemplates();
  
  const categories = [
    { id: 'all', label: 'All Templates', count: allTemplates.length },
    ...Object.entries(TEMPLATES).map(([key, cat]) => ({
      id: key,
      label: cat.category,
      count: cat.templates.length,
      icon: cat.icon,
    }))
  ];

  const filteredTemplates = allTemplates.filter(t => {
    const matchesCategory = activeCategory === 'all' || t.categoryKey === activeCategory;
    const matchesSearch = !searchQuery || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.deadline && t.deadline.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCopy = async () => {
    if (selectedTemplate) {
      const content = getLetterContent(selectedTemplate.id);
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (selectedTemplate) {
      const content = getLetterContent(selectedTemplate.id);
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTemplate.name.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleExternalLink = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      marginBottom: '24px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 600,
      marginBottom: '4px',
    },
    subtitle: {
      fontSize: '14px',
      color: 'var(--text-muted)',
    },
    searchBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 18px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      marginBottom: '24px',
    },
    searchInput: {
      flex: 1,
      background: 'transparent',
      border: 'none',
      color: '#e5e5e5',
      fontSize: '15px',
      outline: 'none',
    },
    filters: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginBottom: '28px',
    },
    filterPill: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 14px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 500,
      color: '#a3a3a3',
      cursor: 'pointer',
      transition: 'all 0.15s',
    },
    filterPillActive: {
      background: 'var(--orange-dim)',
      borderColor: 'rgba(255, 107, 53, 0.3)',
      color: 'var(--orange)',
    },
    filterCount: {
      padding: '2px 6px',
      background: 'var(--bg-secondary)',
      borderRadius: '10px',
      fontSize: '10px',
    },
    filterCountActive: {
      background: 'var(--orange)',
      color: 'white',
      fontWeight: 600,
    },
    resultsInfo: {
      fontSize: '13px',
      color: 'var(--text-muted)',
      marginBottom: '16px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: '16px',
    },
    card: {
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '20px',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    cardTop: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '14px',
      marginBottom: '12px',
    },
    cardIcon: {
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--orange-dim)',
      border: '1px solid rgba(255, 107, 53, 0.2)',
      borderRadius: '10px',
      color: 'var(--orange)',
      flexShrink: 0,
    },
    cardMeta: {
      flex: 1,
      minWidth: 0,
    },
    cardTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#e5e5e5',
      marginBottom: '4px',
      lineHeight: 1.3,
    },
    cardSubtitle: {
      fontSize: '11px',
      color: 'var(--text-muted)',
    },
    cardDesc: {
      fontSize: '13px',
      color: '#a3a3a3',
      lineHeight: 1.5,
      marginBottom: '12px',
    },
    cardMeta2: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      marginBottom: '12px',
    },
    deadline: {
      fontSize: '11px',
      color: 'var(--text-muted)',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    priorityBadge: {
      padding: '3px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 600,
      textTransform: 'uppercase',
    },
    cardActions: {
      display: 'flex',
      gap: '8px',
      paddingTop: '12px',
      borderTop: '1px solid var(--border)',
    },
    cardBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      flex: 1,
      padding: '8px 12px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.15s',
      border: 'none',
    },
    cardBtnPrimary: {
      background: 'var(--orange)',
      color: 'white',
    },
    cardBtnSecondary: {
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      color: '#a3a3a3',
    },
    modal: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    },
    modalContent: {
      background: '#0d0d0f',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      width: '100%',
      maxWidth: '900px',
      maxHeight: '90vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
    modalHeader: {
      padding: '20px 24px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    modalTitle: {
      fontSize: '18px',
      fontWeight: 600,
      color: '#e5e5e5',
      marginBottom: '4px',
    },
    modalSubtitle: {
      fontSize: '13px',
      color: 'var(--text-muted)',
    },
    modalClose: {
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-secondary)',
      border: 'none',
      borderRadius: '8px',
      color: 'var(--text-muted)',
      cursor: 'pointer',
    },
    modalBody: {
      flex: 1,
      overflow: 'auto',
      padding: '24px',
    },
    templateContent: {
      background: '#0a0a0b',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '20px',
      fontSize: '12px',
      lineHeight: 1.6,
      color: '#a3a3a3',
      whiteSpace: 'pre-wrap',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      maxHeight: '60vh',
      overflow: 'auto',
    },
    modalFooter: {
      padding: '16px 24px',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
    },
    modalBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      border: 'none',
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: 'var(--text-muted)',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Letter Templates</h1>
        <p style={styles.subtitle}>{allTemplates.length} professionally-crafted dispute and validation letters</p>
      </div>

      <div style={styles.searchBar}>
        <Search size={20} style={{ color: '#525252' }} />
        <input 
          type="text"
          style={styles.searchInput}
          placeholder="Search templates by name, statute, or keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        )}
      </div>
      
      <div style={styles.filters}>
        {categories.map(cat => (
          <button
            key={cat.id}
            style={{
              ...styles.filterPill,
              ...(activeCategory === cat.id ? styles.filterPillActive : {}),
            }}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
            <span style={{
              ...styles.filterCount,
              ...(activeCategory === cat.id ? styles.filterCountActive : {}),
            }}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      <div style={styles.resultsInfo}>
        Showing {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
        {searchQuery && ` matching "${searchQuery}"`}
      </div>
      
      {filteredTemplates.length > 0 ? (
        <div style={styles.grid}>
          {filteredTemplates.map(template => {
            const IconComponent = CATEGORY_ICONS[template.categoryKey] || FileText;
            return (
              <div 
                key={template.id} 
                style={styles.card}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 107, 53, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={styles.cardTop}>
                  <div style={styles.cardIcon}>
                    <IconComponent size={20} />
                  </div>
                  <div style={styles.cardMeta}>
                    <div style={styles.cardTitle}>{template.name}</div>
                    <div style={styles.cardSubtitle}>{template.categoryLabel}</div>
                  </div>
                </div>
                
                <p style={styles.cardDesc}>{template.description}</p>
                
                <div style={styles.cardMeta2}>
                  {template.deadline && (
                    <span style={styles.deadline}>
                      <Clock size={12} />
                      {template.deadline}
                    </span>
                  )}
                  {template.priority && (
                    <span style={{
                      ...styles.priorityBadge,
                      background: `${PRIORITY_COLORS[template.priority]}20`,
                      color: PRIORITY_COLORS[template.priority],
                    }}>
                      {template.priority}
                    </span>
                  )}
                </div>
                
                <div style={styles.cardActions}>
                  {template.external ? (
                    <button 
                      style={{...styles.cardBtn, ...styles.cardBtnPrimary, flex: 1}}
                      onClick={() => handleExternalLink(template.external)}
                    >
                      <Landmark size={14} />
                      Open Official Site
                    </button>
                  ) : isTemplateAccessible(template) ? (
                    <>
                      <button 
                        style={{...styles.cardBtn, ...styles.cardBtnSecondary}}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <Eye size={14} />
                        Preview
                      </button>
                      <button 
                        style={{...styles.cardBtn, ...styles.cardBtnPrimary}}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <Download size={14} />
                        Use
                      </button>
                    </>
                  ) : (
                    <button
                      style={{...styles.cardBtn, ...styles.cardBtnPrimary, flex: 1}}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowUpgradeModal(true);
                      }}
                    >
                      <Lock size={14} />
                      {getRequiredTier(template) === 'identity-theft' ? '605B Tier' :
                       getRequiredTier(template) === 'advanced' ? 'Advanced' : 'Upgrade'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <Search size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#a3a3a3' }}>No templates found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div style={styles.modal} onClick={() => { setShowUpgradeModal(false); setSelectedTemplate(null); }}>
          <div style={{...styles.modalContent, maxWidth: '500px', padding: '0'}} onClick={(e) => e.stopPropagation()}>
            <button
              style={{...styles.modalClose, position: 'absolute', top: '16px', right: '16px', zIndex: 10}}
              onClick={() => { setShowUpgradeModal(false); setSelectedTemplate(null); }}
            >
              <X size={20} />
            </button>
            <UpgradePrompt
              feature="letter-downloads"
              requiredTier={selectedTemplate ? getRequiredTier(selectedTemplate) : 'toolkit'}
              title={
                selectedTemplate && getRequiredTier(selectedTemplate) === 'identity-theft'
                  ? 'Unlock 605B Identity Theft Templates'
                  : selectedTemplate && getRequiredTier(selectedTemplate) === 'advanced'
                  ? 'Unlock Advanced Templates'
                  : 'Unlock Letter Templates'
              }
              description={
                selectedTemplate && getRequiredTier(selectedTemplate) === 'identity-theft'
                  ? 'Upgrade to the 605B Identity Theft Toolkit to access fraud alerts, police report templates, and complete identity theft recovery workflows.'
                  : selectedTemplate && getRequiredTier(selectedTemplate) === 'advanced'
                  ? 'Upgrade to the Advanced Suite to access creditor disputes, escalation letters, specialty agency templates, and more.'
                  : 'Upgrade to the Dispute Toolkit to download and customize letter templates for your disputes.'
              }
            />
          </div>
        </div>
      )}

      {/* Template Modal */}
      {selectedTemplate && !selectedTemplate.external && (
        <div style={styles.modal} onClick={() => setSelectedTemplate(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalTitle}>{selectedTemplate.name}</div>
                <div style={styles.modalSubtitle}>
                  {selectedTemplate.categoryLabel}
                  {selectedTemplate.deadline && ` · Deadline: ${selectedTemplate.deadline}`}
                </div>
              </div>
              <button style={styles.modalClose} onClick={() => setSelectedTemplate(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {isTemplateAccessible(selectedTemplate) ? (
                <pre style={styles.templateContent}>{getLetterContent(selectedTemplate.id)}</pre>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '300px',
                  background: '#0a0a0b',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '40px 20px',
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'var(--orange-dim)',
                    border: '1px solid rgba(255, 107, 53, 0.3)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                  }}>
                    <Lock size={36} style={{ color: 'var(--orange)' }} />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#e5e5e5' }}>
                    {getRequiredTier(selectedTemplate) === 'identity-theft' ? '605B Template' :
                     getRequiredTier(selectedTemplate) === 'advanced' ? 'Advanced Template' : 'Premium Template'}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '400px', marginBottom: '8px', lineHeight: 1.6 }}>
                    This professionally-crafted letter template includes proper legal citations,
                    formatting, and strategic language to maximize effectiveness.
                  </p>
                  <p style={{ fontSize: '13px', color: '#525252', textAlign: 'center', maxWidth: '400px', marginBottom: '24px' }}>
                    {getRequiredTier(selectedTemplate) === 'identity-theft'
                      ? 'Upgrade to the 605B Identity Theft Toolkit for complete fraud recovery workflows'
                      : getRequiredTier(selectedTemplate) === 'advanced'
                      ? 'Upgrade to the Advanced Suite to unlock this template'
                      : 'Upgrade to the Dispute Toolkit to access letter templates'
                    }
                  </p>
                  <button
                    onClick={() => {
                      const tier = getRequiredTier(selectedTemplate);
                      window.location.href = `/pricing?highlight=${tier}`;
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '14px 28px',
                      background: 'var(--orange)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Lock size={18} />
                    Upgrade to Unlock
                  </button>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              {isTemplateAccessible(selectedTemplate) ? (
                <>
                  <button
                    style={{...styles.modalBtn, background: 'var(--bg-secondary)', color: '#a3a3a3'}}
                    onClick={handleCopy}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                  <button
                    style={{...styles.modalBtn, background: 'var(--orange)', color: 'white'}}
                    onClick={handleDownload}
                  >
                    <Download size={18} />
                    Download Template
                  </button>
                </>
              ) : (
                <>
                  <button
                    style={{...styles.modalBtn, background: 'var(--bg-secondary)', color: '#52525b', cursor: 'not-allowed'}}
                    disabled
                  >
                    <Lock size={18} />
                    Copy Locked
                  </button>
                  <button
                    style={{...styles.modalBtn, background: 'var(--orange)', color: 'white'}}
                    onClick={() => {
                      const tier = getRequiredTier(selectedTemplate);
                      window.location.href = `/pricing?highlight=${tier}`;
                    }}
                  >
                    <Lock size={18} />
                    Upgrade to Download
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
