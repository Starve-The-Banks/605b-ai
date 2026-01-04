"use client";

import { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, ExternalLink, AlertCircle, X, Copy, Check, Download } from 'lucide-react';
import { TEMPLATES, getLetterContent } from '@/lib/templates';

export default function TemplatesTab() {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [generatedLetter, setGeneratedLetter] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">Letter Templates</h1>
          <p className="page-subtitle">Generate dispute letters</p>
        </div>
      </div>
      {Object.entries(TEMPLATES).map(([key, category]) => (
        <div key={key} className="category-card">
          <button className="category-header" onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}>
            <div className="category-title">
              <div className="category-icon"><category.icon size={18} /></div>
              {category.category}
            </div>
            <ChevronDown size={18} style={{ transform: expandedCategory === key ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </button>
          {expandedCategory === key && category.templates.map(template => (
            <div key={template.id} className="template-item">
              <div className="template-info">
                <div className="template-name">{template.name}</div>
                <div className="template-desc">{template.description}</div>
                <div className="template-deadline"><Clock size={12} /> {template.deadline}</div>
              </div>
              {template.external ? (
                <a href={template.external} target="_blank" rel="noopener noreferrer" className="template-btn">Open <ExternalLink size={14} /></a>
              ) : (
                <button className="template-btn" onClick={() => setGeneratedLetter({ template, content: getLetterContent(template.id) })}>Generate <ChevronRight size={14} /></button>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Letter Modal */}
      {generatedLetter && (
        <div className="modal-overlay" onClick={() => setGeneratedLetter(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{generatedLetter.template.name}</div>
              <button className="close-btn" onClick={() => setGeneratedLetter(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="letter-instructions"><AlertCircle size={16} style={{ flexShrink: 0 }} /> Replace [BRACKETED] text. Send via certified mail.</div>
              <pre className="letter-content">{generatedLetter.content}</pre>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => copyToClipboard(generatedLetter.content)}>
                {copySuccess ? <Check size={16} /> : <Copy size={16} />} {copySuccess ? 'Copied!' : 'Copy'}
              </button>
              <button className="btn-primary" onClick={() => {
                const blob = new Blob([generatedLetter.content], { type: 'text/plain' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${generatedLetter.template.id}.txt`; a.click();
              }}><Download size={16} /> Download</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
