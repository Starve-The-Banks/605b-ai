"use client";

import { useState } from 'react';
import { Shield, FileText, Clock, AlertTriangle, Building, Scale, Download, Eye, Search } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Templates', count: 62 },
  { id: 'identity', label: 'Identity Theft', count: 8, icon: Shield },
  { id: 'disputes', label: 'Bureau Disputes', count: 12, icon: FileText },
  { id: 'collections', label: 'Debt Collection', count: 10, icon: AlertTriangle },
  { id: 'specialty', label: 'Specialty Bureaus', count: 6, icon: Building },
  { id: 'escalation', label: 'Escalation', count: 8, icon: Scale },
];

const TEMPLATES = [
  {
    id: 1,
    title: '605B Identity Theft Block',
    subtitle: 'Bureau Letter',
    category: 'identity',
    description: 'The nuclear option. Forces bureaus to block fraudulent accounts within 4 business days. Requires FTC Identity Theft Report.',
    tags: ['FCRA 605B', 'Identity Theft', '4-Day Deadline', 'FTC Report'],
    stats: { success: '94%', response: '3 days', uses: '2,847' },
    featured: true
  },
  {
    id: 2,
    title: '611 Standard Dispute',
    subtitle: 'Bureau Letter',
    category: 'disputes',
    description: 'Standard dispute for inaccurate information. Triggers mandatory 30-day investigation period.',
    tags: ['FCRA 611', '30-Day Deadline', 'General Disputes'],
    stats: { success: '72%', response: '21 days', uses: '8,234' }
  },
  {
    id: 3,
    title: 'FDCPA 809 Debt Validation',
    subtitle: 'Collector Letter',
    category: 'collections',
    description: 'Demand proof from debt collectors. They must cease collection until they validate the debt.',
    tags: ['FDCPA 809', 'Collections', 'Debt Validation'],
    stats: { success: '68%', response: 'Varies', uses: '5,102' }
  },
  {
    id: 4,
    title: '609 Method of Verification',
    subtitle: 'Bureau Letter',
    category: 'disputes',
    description: 'Request documentation of how the bureau verified disputed information. Powerful follow-up tool.',
    tags: ['FCRA 609', 'Verification', 'Follow-up'],
    stats: { success: '61%', response: '15 days', uses: '3,891' }
  },
  {
    id: 5,
    title: 'ChexSystems Dispute',
    subtitle: 'Specialty Bureau',
    category: 'specialty',
    description: 'Dispute errors on your ChexSystems report that may be blocking bank account access.',
    tags: ['ChexSystems', 'Banking', 'Account Access'],
    stats: { success: '58%', response: '30 days', uses: '1,203' }
  },
  {
    id: 6,
    title: 'CFPB Complaint Escalation',
    subtitle: 'Federal Agency',
    category: 'escalation',
    description: 'Escalate unresolved disputes to the Consumer Financial Protection Bureau.',
    tags: ['CFPB', 'Escalation', 'Federal Complaint'],
    stats: { success: '81%', response: '15 days', uses: '2,156' }
  },
  {
    id: 7,
    title: 'FTC Identity Theft Affidavit',
    subtitle: 'Federal Form',
    category: 'identity',
    description: 'Official FTC affidavit required for 605B disputes and police reports.',
    tags: ['FTC', 'Affidavit', 'Required Document'],
    stats: { success: 'N/A', response: 'Immediate', uses: '4,521' }
  },
  {
    id: 8,
    title: '623 Direct Furnisher Dispute',
    subtitle: 'Creditor Letter',
    category: 'disputes',
    description: 'Dispute directly with the creditor reporting inaccurate information.',
    tags: ['FCRA 623', 'Direct Dispute', 'Furnisher'],
    stats: { success: '65%', response: '30 days', uses: '2,876' }
  },
];

export default function TemplatesTab({ logAction, addDispute }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const filteredTemplates = TEMPLATES.filter(t => {
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
    const matchesSearch = !searchQuery || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (template) => {
    logAction?.('TEMPLATE_USED', { templateId: template.id, title: template.title });
    addDispute?.({
      type: template.title,
      templateId: template.id,
      category: template.category
    });
  };

  return (
    <>
      <style jsx>{`
        .templates-container {
          padding: 28px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          margin-bottom: 24px;
          transition: all 0.15s;
        }
        
        .search-bar:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-dim);
        }
        
        .search-icon {
          color: var(--text-muted);
        }
        
        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 15px;
          outline: none;
        }
        
        .search-input::placeholder {
          color: var(--text-muted);
        }
        
        .filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 28px;
        }
        
        .filter-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .filter-pill:hover {
          background: var(--bg-card-hover);
          border-color: var(--border-default);
          color: var(--text-primary);
        }
        
        .filter-pill.active {
          background: linear-gradient(135deg, var(--accent-dim) 0%, var(--accent-subtle) 100%);
          border-color: var(--accent);
          color: var(--accent);
          box-shadow: 0 0 16px var(--accent-dim);
        }
        
        .filter-count {
          padding: 2px 6px;
          background: var(--bg-elevated);
          border-radius: 10px;
          font-size: 10px;
          font-family: 'JetBrains Mono', monospace;
        }
        
        .filter-pill.active .filter-count {
          background: var(--accent);
          color: var(--bg-deep);
          font-weight: 600;
        }
        
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        
        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 700;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }
        
        .section-title::before {
          content: '';
          width: 8px;
          height: 8px;
          background: var(--accent);
          border-radius: 2px;
          box-shadow: 0 0 12px var(--accent-glow);
        }
        
        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 16px;
        }
        
        .template-card {
          background: linear-gradient(145deg, var(--bg-card) 0%, var(--bg-elevated) 100%);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        
        .template-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, var(--accent-muted) 50%, transparent 100%);
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .template-card:hover {
          border-color: var(--border-accent);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        
        .template-card:hover::before {
          opacity: 1;
        }
        
        .template-card.featured {
          border-color: var(--accent);
          background: linear-gradient(145deg, var(--bg-card) 0%, rgba(247, 208, 71, 0.03) 100%);
        }
        
        .template-card.featured::after {
          content: '';
          position: absolute;
          top: -100px;
          right: -100px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, var(--accent-dim) 0%, transparent 70%);
          pointer-events: none;
        }
        
        .card-top {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 14px;
        }
        
        .card-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--accent-dim) 0%, var(--accent-subtle) 100%);
          border: 1px solid var(--border-accent);
          border-radius: 10px;
          color: var(--accent);
          flex-shrink: 0;
        }
        
        .card-meta {
          flex: 1;
          min-width: 0;
        }
        
        .card-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .card-subtitle {
          font-size: 12px;
          color: var(--text-muted);
        }
        
        .card-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: linear-gradient(135deg, var(--accent) 0%, #E55A2B 100%);
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          color: var(--bg-deep);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .card-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.65;
          margin-bottom: 16px;
        }
        
        .card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }
        
        .tag {
          padding: 4px 10px;
          background: var(--bg-deep);
          border: 1px solid var(--border-subtle);
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          color: var(--text-muted);
          font-family: 'JetBrains Mono', monospace;
        }
        
        .tag.highlight {
          background: var(--accent-dim);
          border-color: var(--border-accent);
          color: var(--accent);
        }
        
        .card-stats {
          display: flex;
          gap: 20px;
          padding-top: 14px;
          border-top: 1px solid var(--border-subtle);
        }
        
        .stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .stat-label {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stat-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          font-family: 'JetBrains Mono', monospace;
        }
        
        .stat-value.success {
          color: var(--success);
        }
        
        .card-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border-subtle);
        }
        
        .card-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex: 1;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
        }
        
        .card-btn.primary {
          background: linear-gradient(135deg, var(--accent) 0%, #E55A2B 100%);
          color: var(--bg-deep);
        }
        
        .card-btn.primary:hover {
          box-shadow: 0 4px 16px var(--accent-glow);
        }
        
        .card-btn.secondary {
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
        }
        
        .card-btn.secondary:hover {
          border-color: var(--border-default);
          color: var(--text-primary);
        }
        
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted);
        }
        
        .empty-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          background: var(--bg-card);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }
        
        .empty-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        
        @media (max-width: 768px) {
          .templates-container {
            padding: 20px 16px;
          }
          
          .templates-grid {
            grid-template-columns: 1fr;
          }
          
          .filters {
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 8px;
            margin-bottom: 20px;
          }
          
          .filter-pill {
            flex-shrink: 0;
          }
        }
      `}</style>

      <div className="templates-container">
        <div className="search-bar">
          <Search className="search-icon" size={20} />
          <input 
            type="text"
            className="search-input"
            placeholder="Search templates by name, statute, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filters">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`filter-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
              <span className="filter-count">{cat.count}</span>
            </button>
          ))}
        </div>
        
        <div className="section-header">
          <div className="section-title">
            {activeCategory === 'all' ? 'All Templates' : CATEGORIES.find(c => c.id === activeCategory)?.label}
          </div>
        </div>
        
        {filteredTemplates.length > 0 ? (
          <div className="templates-grid">
            {filteredTemplates.map(template => (
              <div key={template.id} className={`template-card ${template.featured ? 'featured' : ''}`}>
                <div className="card-top">
                  <div className="card-icon">
                    <Shield size={20} />
                  </div>
                  <div className="card-meta">
                    <div className="card-title">
                      {template.title}
                      {template.featured && <span className="card-badge">Featured</span>}
                    </div>
                    <div className="card-subtitle">{template.subtitle}</div>
                  </div>
                </div>
                
                <p className="card-desc">{template.description}</p>
                
                <div className="card-tags">
                  {template.tags.map((tag, i) => (
                    <span key={i} className={`tag ${i === 0 ? 'highlight' : ''}`}>{tag}</span>
                  ))}
                </div>
                
                <div className="card-stats">
                  <div className="stat">
                    <span className="stat-label">Success</span>
                    <span className="stat-value success">{template.stats.success}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Response</span>
                    <span className="stat-value">{template.stats.response}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Used</span>
                    <span className="stat-value">{template.stats.uses}x</span>
                  </div>
                </div>
                
                <div className="card-actions">
                  <button className="card-btn secondary">
                    <Eye size={16} />
                    Preview
                  </button>
                  <button className="card-btn primary" onClick={() => handleUseTemplate(template)}>
                    <Download size={16} />
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Search size={28} />
            </div>
            <div className="empty-title">No templates found</div>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </>
  );
}
