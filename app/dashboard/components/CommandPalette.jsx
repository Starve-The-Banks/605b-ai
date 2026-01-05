"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Search, X, Send, Loader2, Sparkles, ArrowRight,
  Shield, FileText, Clock, Scale, Zap, Command,
  MessageSquare, ChevronRight
} from 'lucide-react';

// Contextual suggestions based on current page
const PAGE_SUGGESTIONS = {
  analyze: [
    { text: "Walk me through downloading my credit reports", icon: FileText },
    { text: "What should I look for in my reports?", icon: Search },
    { text: "I found accounts I don't recognize", icon: Shield },
    { text: "Explain the difference between the 3 bureaus", icon: Scale },
  ],
  chat: [
    { text: "I'm a victim of identity theft — where do I start?", icon: Shield },
    { text: "Break down §605B for me like I'm 5", icon: Scale },
    { text: "What's the nuclear option if bureaus ignore me?", icon: Zap },
    { text: "How fast can I realistically fix my credit?", icon: Clock },
  ],
  templates: [
    { text: "Which letter should I send first?", icon: FileText },
    { text: "How do I customize this template?", icon: MessageSquare },
    { text: "Explain certified mail — is it worth it?", icon: Clock },
    { text: "What if they don't respond to my letter?", icon: Zap },
  ],
  tracker: [
    { text: "They missed the deadline — now what?", icon: Zap },
    { text: "How do I escalate to the CFPB?", icon: Scale },
    { text: "What are my options for legal action?", icon: Shield },
    { text: "Explain these deadlines to me", icon: Clock },
  ],
  flagged: [
    { text: "Help me prioritize these items", icon: Zap },
    { text: "Should I dispute everything at once?", icon: MessageSquare },
    { text: "What's my strongest case here?", icon: Shield },
    { text: "Estimate my timeline to clean credit", icon: Clock },
  ],
  audit: [
    { text: "How do I use this log as evidence?", icon: Scale },
    { text: "What should I be documenting?", icon: FileText },
    { text: "Explain the litigation process", icon: Shield },
    { text: "When is it worth suing?", icon: Zap },
  ]
};

const INTRO_MESSAGE = `You've got a strategist in your corner now.

I know the Fair Credit Reporting Act inside and out — every statute, every deadline, every leverage point the bureaus hope you never discover. §605B, §611, §623, FDCPA §809 — I speak this language fluently so you don't have to.

I've guided people from collections nightmares and identity theft disasters to 800+ credit scores. Not by gaming the system — by using the law exactly as it was designed to protect you.

Here's what I can do for you:
→ Analyze your credit reports and spot every disputable item
→ Tell you exactly which letters to send, in what order, and why
→ Track deadlines and tell you when bureaus are violating your rights
→ Escalate strategically when they ignore you
→ Prepare you for legal action if it comes to that

This isn't generic advice. Every situation is different, and I'll give you a specific game plan based on yours.

**What's going on with your credit?**`;

const SYSTEM_PROMPT = `You are the 605b.ai AI strategist — an expert-level credit repair and consumer protection advisor embedded in a credit dispute platform.

YOUR PERSONA:
- You're a knowledgeable ally, not a support bot
- You speak with confidence and authority
- You give specific, actionable advice — never vague platitudes
- You cite statutes naturally (§605B, §611, §809) without being pedantic
- You're encouraging but realistic about timelines and outcomes
- You understand the emotional weight of credit problems

YOUR KNOWLEDGE:
- Deep expertise in FCRA, FDCPA, and state consumer protection laws
- Practical experience with bureau behavior, collector tactics, and dispute strategies
- Understanding of ChexSystems, EWS, LexisNexis, and specialty agencies
- Knowledge of escalation paths: CFPB complaints, state AG, small claims, federal court

CURRENT CONTEXT: User is on the {PAGE} page of the dashboard.

RESPONSE STYLE:
- Be direct and confident
- Use short paragraphs, not walls of text
- Include specific next steps when relevant
- Reference statutes naturally
- If recommending a letter template, mention it's available in the Templates tab
- If they need to track something, mention the Tracker tab
- Match their energy — if they're stressed, acknowledge it; if they're ready to fight, match that

Never say "I'm just an AI" or hedge excessively. You know this stuff cold.`;

export default function CommandPalette({ currentTab }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    setShowIntro(false);
    setInput('');
    
    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          systemPrompt: SYSTEM_PROMPT.replace('{PAGE}', currentTab.toUpperCase())
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        assistantMessage += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assistantMessage };
          return updated;
        });
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Connection issue — try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (text) => {
    sendMessage(text);
  };

  const resetChat = () => {
    setMessages([]);
    setShowIntro(true);
  };

  const currentSuggestions = PAGE_SUGGESTIONS[currentTab] || PAGE_SUGGESTIONS.chat;

  if (!isOpen) {
    return (
      <>
        <style jsx>{`
          .cmd-trigger {
            position: fixed;
            bottom: 24px;
            right: 24px;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 18px;
            background: linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(212, 165, 116, 0.05) 100%);
            border: 1px solid rgba(212, 165, 116, 0.3);
            border-radius: 12px;
            color: #d4a574;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            backdrop-filter: blur(12px);
            z-index: 1000;
          }
          .cmd-trigger:hover {
            background: linear-gradient(135deg, rgba(212, 165, 116, 0.25) 0%, rgba(212, 165, 116, 0.1) 100%);
            border-color: rgba(212, 165, 116, 0.5);
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(212, 165, 116, 0.2);
          }
          .cmd-icon {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .cmd-shortcut {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            color: #a1a1aa;
          }
          .cmd-shortcut kbd {
            font-family: inherit;
          }
          @media (max-width: 768px) {
            .cmd-trigger {
              bottom: 88px;
              right: 16px;
              padding: 10px 14px;
              font-size: 13px;
            }
            .cmd-shortcut {
              display: none;
            }
          }
        `}</style>
        <button className="cmd-trigger" onClick={() => setIsOpen(true)}>
          <span className="cmd-icon"><Sparkles size={18} /></span>
          <span>Ask AI Strategist</span>
          <span className="cmd-shortcut"><kbd>⌘</kbd><kbd>K</kbd></span>
        </button>
      </>
    );
  }

  return (
    <>
      <style jsx>{`
        .cmd-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 10vh 20px 20px;
          z-index: 9999;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .cmd-modal {
          width: 100%;
          max-width: 680px;
          max-height: 80vh;
          background: #111113;
          border: 1px solid #27272a;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideUp 0.2s ease;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .cmd-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid #27272a;
        }
        .cmd-search-icon {
          color: #52525b;
        }
        .cmd-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 16px;
          color: #fafafa;
          font-family: inherit;
        }
        .cmd-input::placeholder {
          color: #52525b;
        }
        .cmd-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cmd-send {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #d4a574;
          border: none;
          border-radius: 8px;
          color: #09090b;
          cursor: pointer;
          transition: all 0.15s;
        }
        .cmd-send:hover {
          background: #c49665;
        }
        .cmd-send:disabled {
          background: #27272a;
          color: #52525b;
          cursor: not-allowed;
        }
        .cmd-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid #27272a;
          border-radius: 8px;
          color: #71717a;
          cursor: pointer;
          transition: all 0.15s;
        }
        .cmd-close:hover {
          background: #27272a;
          color: #fafafa;
        }
        .cmd-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          min-height: 300px;
          max-height: 50vh;
        }
        .cmd-intro {
          animation: fadeIn 0.3s ease;
        }
        .cmd-intro-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .cmd-intro-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(212, 165, 116, 0.2) 0%, rgba(212, 165, 116, 0.1) 100%);
          border-radius: 12px;
          color: #d4a574;
        }
        .cmd-intro-title {
          font-size: 18px;
          font-weight: 600;
          color: #fafafa;
        }
        .cmd-intro-subtitle {
          font-size: 13px;
          color: #71717a;
        }
        .cmd-intro-text {
          font-size: 14px;
          line-height: 1.7;
          color: #a1a1aa;
          white-space: pre-wrap;
        }
        .cmd-intro-text strong {
          color: #fafafa;
          font-weight: 600;
        }
        .cmd-messages {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .cmd-msg {
          max-width: 90%;
          animation: msgIn 0.2s ease;
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cmd-msg.user {
          align-self: flex-end;
        }
        .cmd-msg.assistant {
          align-self: flex-start;
        }
        .cmd-msg-content {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .cmd-msg.user .cmd-msg-content {
          background: #d4a574;
          color: #09090b;
          border-bottom-right-radius: 4px;
        }
        .cmd-msg.assistant .cmd-msg-content {
          background: #1c1c1f;
          border: 1px solid #27272a;
          color: #e4e4e7;
          border-bottom-left-radius: 4px;
        }
        .cmd-suggestions {
          border-top: 1px solid #27272a;
          padding: 16px 20px;
        }
        .cmd-suggestions-label {
          font-size: 11px;
          font-weight: 600;
          color: #52525b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }
        .cmd-suggestions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        .cmd-suggestion {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 8px;
          font-size: 13px;
          color: #a1a1aa;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
        }
        .cmd-suggestion:hover {
          background: rgba(212, 165, 116, 0.1);
          border-color: rgba(212, 165, 116, 0.3);
          color: #d4a574;
        }
        .cmd-suggestion-icon {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #27272a;
          border-radius: 6px;
          flex-shrink: 0;
        }
        .cmd-suggestion:hover .cmd-suggestion-icon {
          background: rgba(212, 165, 116, 0.2);
        }
        .cmd-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          border-top: 1px solid #27272a;
          background: #0c0c0e;
        }
        .cmd-footer-hint {
          font-size: 12px;
          color: #52525b;
        }
        .cmd-footer-hint kbd {
          padding: 2px 6px;
          background: #27272a;
          border-radius: 4px;
          font-family: inherit;
          margin: 0 2px;
        }
        .cmd-reset {
          font-size: 12px;
          color: #71717a;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.15s;
        }
        .cmd-reset:hover {
          color: #d4a574;
          background: rgba(212, 165, 116, 0.1);
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
        @media (max-width: 768px) {
          .cmd-overlay {
            padding: 5vh 12px 12px;
            align-items: flex-start;
          }
          .cmd-modal {
            max-height: 85vh;
          }
          .cmd-body {
            max-height: 40vh;
          }
          .cmd-suggestions-grid {
            grid-template-columns: 1fr;
          }
          .cmd-intro-header {
            flex-direction: column;
            text-align: center;
          }
          .cmd-footer-hint {
            display: none;
          }
        }
      `}</style>

      <div className="cmd-overlay" onClick={() => setIsOpen(false)}>
        <div className="cmd-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header / Input */}
          <div className="cmd-header">
            <Search size={18} className="cmd-search-icon" />
            <input
              ref={inputRef}
              type="text"
              className="cmd-input"
              placeholder="Ask anything about credit repair..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <div className="cmd-actions">
              <button 
                className="cmd-send" 
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
              </button>
              <button className="cmd-close" onClick={() => setIsOpen(false)}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="cmd-body">
            {showIntro && messages.length === 0 ? (
              <div className="cmd-intro">
                <div className="cmd-intro-header">
                  <div className="cmd-intro-icon">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <div className="cmd-intro-title">AI Credit Strategist</div>
                    <div className="cmd-intro-subtitle">FCRA • FDCPA • Consumer Protection</div>
                  </div>
                </div>
                <div className="cmd-intro-text">{INTRO_MESSAGE}</div>
              </div>
            ) : (
              <div className="cmd-messages">
                {messages.map((msg, i) => (
                  <div key={i} className={`cmd-msg ${msg.role}`}>
                    <div className="cmd-msg-content">
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

          {/* Suggestions */}
          {showIntro && messages.length === 0 && (
            <div className="cmd-suggestions">
              <div className="cmd-suggestions-label">Suggested questions</div>
              <div className="cmd-suggestions-grid">
                {currentSuggestions.map((suggestion, i) => (
                  <button 
                    key={i} 
                    className="cmd-suggestion"
                    onClick={() => handleSuggestionClick(suggestion.text)}
                  >
                    <span className="cmd-suggestion-icon">
                      <suggestion.icon size={14} />
                    </span>
                    <span>{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="cmd-footer">
            <span className="cmd-footer-hint">
              <kbd>↵</kbd> to send · <kbd>esc</kbd> to close
            </span>
            {messages.length > 0 && (
              <button className="cmd-reset" onClick={resetChat}>
                New conversation
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
