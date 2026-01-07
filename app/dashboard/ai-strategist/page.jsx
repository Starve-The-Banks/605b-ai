"use client";

import { Sparkles } from 'lucide-react';

export default function AIStrategistPage() {
  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>AI Strategist</h1>
        <p style={{ fontSize: '14px', color: '#737373' }}>Your personal credit repair advisor powered by AI</p>
      </div>

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
          <Sparkles size={32} />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Full AI Chat Experience</h2>
        <p style={{ fontSize: '14px', color: '#737373', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
          Use the AI Strategist panel on the right to get personalized guidance on your credit repair journey. 
          Ask questions about disputes, FCRA rights, and strategy.
        </p>
      </div>
    </>
  );
}
