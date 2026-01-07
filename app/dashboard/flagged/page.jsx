"use client";

import { Flag, AlertTriangle } from 'lucide-react';

export default function FlaggedPage() {
  const flaggedItems = [];

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>Flagged Items</h1>
        <p style={{ fontSize: '14px', color: '#737373' }}>Items requiring attention from your credit report analysis</p>
      </div>

      {/* Empty State */}
      {flaggedItems.length === 0 && (
        <div style={{ 
          background: '#121214', 
          border: '1px solid #1f1f23', 
          borderRadius: '12px', 
          padding: '60px 24px', 
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
          <p style={{ fontSize: '14px', color: '#737373', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
            Upload your credit reports to have our AI analyze them for potential issues, 
            identity theft markers, and disputable items.
          </p>
        </div>
      )}
    </>
  );
}
