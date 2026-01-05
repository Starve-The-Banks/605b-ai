"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, Shield, FileText, Scale, Zap } from 'lucide-react';
import { SYSTEM_PROMPT } from '@/lib/constants';

const INTRO_MESSAGE = `You've got a strategist in your corner now.

I know the Fair Credit Reporting Act inside and out — every statute, every deadline, every leverage point the bureaus hope you never discover. §605B, §611, §623, FDCPA §809 — I speak this language fluently so you don't have to.

I've guided people from collections nightmares and identity theft disasters to 800+ credit scores. Not by gaming the system — by using the law exactly as it was designed to protect you.

**Here's what I can do for you:**
→ Analyze your credit reports and spot every disputable item
→ Tell you exactly which letters to send, in what order, and why
→ Track deadlines and tell you when bureaus are violating your rights
→ Escalate strategically when they ignore you
→ Prepare you for legal action if it comes to that

This isn't generic advice. Every situation is different, and I'll give you a specific game plan based on yours.

**What's going on with your credit?**`;

const QUICK_STARTS = [
  { text: "I'm a victim of identity theft", icon: Shield },
  { text: "I have collections I want to dispute", icon: FileText },
  { text: "Break down my rights under FCRA", icon: Scale },
  { text: "What's the fastest path to clean credit?", icon: Zap },
];

export default function ChatTab({ logAction }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (text) => {
    const messageText = text || inputValue.trim();
    if (!messageText || isLoading) return;

    setShowIntro(false);
    setInputValue('');
    
    const userMsg = { id: Date.now(), role: 'user', content: messageText };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          systemPrompt: SYSTEM_PROMPT
        }),
      });

      if (!response.ok) throw new Error(await response.text());
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: '' }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        assistantMessage += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { id: Date.now() + 1, role: 'assistant', content: assistantMessage };
          return updated;
        });
      }

      logAction('AI_CHAT', { query: messageText.substring(0, 50) });
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: `Error: ${err.message}`, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style jsx>{`
        .chat-wrapper {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 48px);
          max-width: 800px;
          margin: 0 auto;
          padding: 24px;
        }
        .chat-body {
          flex: 1;
          overflow-y: auto;
          padding-bottom: 24px;
        }
        .chat-intro {
          padding: 32px 0;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .intro-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .intro-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(212, 165, 116, 0.2) 0%, rgba(212, 165, 116, 0.05) 100%);
          border: 1px solid rgba(212, 165, 116, 0.3);
          border-radius: 16px;
          color: #d4a574;
        }
        .intro-title {
          font-size: 22px;
          font-weight: 600;
          color: #fafafa;
          margin-bottom: 4px;
        }
        .intro-subtitle {
          font-size: 13px;
          color: #71717a;
          letter-spacing: 0.02em;
        }
        .intro-text {
          font-size: 15px;
          line-height: 1.8;
          color: #a1a1aa;
          white-space: pre-wrap;
        }
        .intro-text strong {
          color: #fafafa;
          font-weight: 600;
        }
        .quick-starts {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 28px;
        }
        .quick-start {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(24, 24, 27, 0.8);
          border: 1px solid #27272a;
          border-radius: 12px;
          color: #a1a1aa;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }
        .quick-start:hover {
          background: rgba(212, 165, 116, 0.1);
          border-color: rgba(212, 165, 116, 0.3);
          color: #d4a574;
          transform: translateY(-2px);
        }
        .quick-start-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #27272a;
          border-radius: 10px;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .quick-start:hover .quick-start-icon {
          background: rgba(212, 165, 116, 0.2);
          color: #d4a574;
        }
        .messages-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .msg {
          max-width: 85%;
          animation: msgIn 0.2s ease;
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .msg.user {
          align-self: flex-end;
        }
        .msg.assistant {
          align-self: flex-start;
        }
        .msg-content {
          padding: 14px 18px;
          border-radius: 16px;
          font-size: 15px;
          line-height: 1.7;
          white-space: pre-wrap;
        }
        .msg.user .msg-content {
          background: linear-gradient(135deg, #d4a574 0%, #c49665 100%);
          color: #09090b;
          border-bottom-right-radius: 4px;
        }
        .msg.assistant .msg-content {
          background: #18181b;
          border: 1px solid #27272a;
          color: #e4e4e7;
          border-bottom-left-radius: 4px;
        }
        .msg.error .msg-content {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }
        .typing-dots {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }
        .typing-dots span {
          width: 6px;
          height: 6px;
          background: #71717a;
          border-radius: 50%;
          animation: bounce 1.4s infinite;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.16s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.32s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .input-area {
          padding-top: 16px;
          border-top: 1px solid #1c1c1f;
        }
        .input-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          background: linear-gradient(135deg, rgba(24, 24, 27, 0.9) 0%, rgba(24, 24, 27, 0.7) 100%);
          border: 1px solid #27272a;
          border-radius: 16px;
          padding: 14px 18px;
          transition: all 0.2s;
        }
        .input-wrapper:focus-within {
          border-color: rgba(212, 165, 116, 0.4);
          box-shadow: 0 0 0 3px rgba(212, 165, 116, 0.1);
        }
        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #fafafa;
          font-size: 15px;
          resize: none;
          outline: none;
          line-height: 1.5;
          font-family: inherit;
          max-height: 120px;
        }
        .chat-input::placeholder {
          color: #52525b;
        }
        .send-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #d4a574 0%, #c49665 100%);
          border: none;
          color: #09090b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .send-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(212, 165, 116, 0.3);
        }
        .send-btn:disabled {
          opacity: 0.4;
          transform: none;
          box-shadow: none;
          cursor: not-allowed;
        }
        .input-hint {
          display: flex;
          justify-content: center;
          margin-top: 12px;
          font-size: 12px;
          color: #3f3f46;
        }
        @media (max-width: 768px) {
          .chat-wrapper {
            padding: 16px;
            height: calc(100vh - 140px);
          }
          .intro-header {
            flex-direction: column;
            text-align: center;
          }
          .intro-title {
            font-size: 20px;
          }
          .quick-starts {
            grid-template-columns: 1fr;
          }
          .msg {
            max-width: 92%;
          }
        }
      `}</style>

      <div className="chat-wrapper">
        <div className="chat-body">
          {showIntro && messages.length === 0 ? (
            <div className="chat-intro">
              <div className="intro-header">
                <div className="intro-icon">
                  <Sparkles size={28} />
                </div>
                <div>
                  <div className="intro-title">AI Credit Strategist</div>
                  <div className="intro-subtitle">FCRA · FDCPA · Consumer Protection Law</div>
                </div>
              </div>
              <div className="intro-text">{INTRO_MESSAGE}</div>
              <div className="quick-starts">
                {QUICK_STARTS.map((item, i) => (
                  <button key={i} className="quick-start" onClick={() => sendMessage(item.text)}>
                    <span className="quick-start-icon"><item.icon size={18} /></span>
                    <span>{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages-container">
              {messages.map(msg => (
                <div key={msg.id} className={`msg ${msg.role} ${msg.isError ? 'error' : ''}`}>
                  <div className="msg-content">
                    {msg.content || (
                      <div className="typing-dots">
                        <span></span><span></span><span></span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="input-area">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              className="chat-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
              placeholder="Describe your situation..."
              rows={1}
            />
            <button className="send-btn" onClick={() => sendMessage()} disabled={!inputValue.trim() || isLoading}>
              {isLoading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={20} />}
            </button>
          </div>
          <div className="input-hint">Press Enter to send · Shift+Enter for new line</div>
        </div>
      </div>
    </>
  );
}
