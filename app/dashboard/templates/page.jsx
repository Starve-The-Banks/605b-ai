"use client";

import { useState } from 'react';
import { FileText, Download, Search, Filter } from 'lucide-react';

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Templates', count: 62 },
    { id: '605b', label: 'Section 605B', count: 12 },
    { id: 'fcra', label: 'FCRA Disputes', count: 18 },
    { id: 'fdcpa', label: 'FDCPA Letters', count: 10 },
    { id: 'fcba', label: 'FCBA Disputes', count: 8 },
    { id: 'chex', label: 'ChexSystems', count: 6 },
    { id: 'ews', label: 'Early Warning', count: 4 },
    { id: 'validation', label: 'Debt Validation', count: 4 },
  ];

  const templates = [
    { id: 1, name: 'Identity Theft Affidavit', category: '605b', description: 'FTC Identity Theft Report for 605B claims' },
    { id: 2, name: '605B Block Request', category: '605b', description: 'Request to block fraudulent accounts under Section 605B' },
    { id: 3, name: 'Bureau Dispute Letter', category: 'fcra', description: 'Standard dispute letter to credit bureaus' },
    { id: 4, name: 'Method of Verification Request', category: 'fcra', description: 'Request verification method used by bureau' },
    { id: 5, name: 'Debt Validation Letter', category: 'validation', description: 'Request validation of debt under FDCPA' },
    { id: 6, name: 'Cease & Desist Letter', category: 'fdcpa', description: 'Stop collector contact under FDCPA' },
    { id: 7, name: 'ChexSystems Dispute', category: 'chex', description: 'Dispute inaccurate ChexSystems records' },
    { id: 8, name: 'EWS Consumer Report Request', category: 'ews', description: 'Request your Early Warning Services report' },
  ];

  const filteredTemplates = templates.filter(t => 
    (selectedCategory === 'all' || t.category === selectedCategory) &&
    (searchQuery === '' || t.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>Letter Templates</h1>
        <p style={{ fontSize: '14px', color: '#737373' }}>62 professionally-crafted dispute and validation letters</p>
      </div>

      {/* Search and Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          background: '#121214',
          border: '1px solid #1f1f23',
          borderRadius: '10px'
        }}>
          <Search size={18} style={{ color: '#525252' }} />
          <input 
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: '#e5e5e5',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: '8px 16px',
              background: selectedCategory === cat.id ? 'rgba(247, 208, 71, 0.1)' : '#121214',
              border: `1px solid ${selectedCategory === cat.id ? 'rgba(247, 208, 71, 0.3)' : '#1f1f23'}`,
              borderRadius: '8px',
              color: selectedCategory === cat.id ? '#f7d047' : '#a3a3a3',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {cat.label}
            <span style={{
              padding: '2px 6px',
              background: selectedCategory === cat.id ? 'rgba(247, 208, 71, 0.2)' : '#1a1a1c',
              borderRadius: '4px',
              fontSize: '11px'
            }}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {filteredTemplates.map(template => (
          <div key={template.id} style={{
            background: '#121214',
            border: '1px solid #1f1f23',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'rgba(247, 208, 71, 0.1)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f7d047',
              flexShrink: 0
            }}>
              <FileText size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{template.name}</h3>
              <p style={{ fontSize: '12px', color: '#737373', marginBottom: '12px' }}>{template.description}</p>
              <button style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'rgba(247, 208, 71, 0.1)',
                border: '1px solid rgba(247, 208, 71, 0.3)',
                borderRadius: '6px',
                color: '#f7d047',
                fontSize: '12px',
                cursor: 'pointer'
              }}>
                <Download size={14} />
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
