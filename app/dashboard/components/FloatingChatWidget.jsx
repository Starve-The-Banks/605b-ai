"use client";

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, ChevronDown, Sparkles } from 'lucide-react';

// Contextual prompts based on which page the user is on
const CONTEXTUAL_PROMPTS = {
  analyze: [
    "How do I download my credit report as a PDF?",
    "What's the difference between the 3 bureaus?",
    "I don't recognize an account on my report",
    "What should I look for in my report?"
  ],
  chat: [
    "I'm a victim of identity theft - where do I start?",
    "Explain §605B in simple terms",
    "How long does a dispute take?",
    "What's the difference between 605B and 611?"
  ],
  templates: [
    "Which letter should I send first?",
    "How do I fill out this template?",
    "Should I send certified mail?",
    "What happens after I send this letter?"
  ],
  tracker: [
    "What do these deadlines mean?",
    "They didn't respond in time - now what?",
    "How do I escalate to the CFPB?",
    "Can I sue if they violate the deadline?"
  ],
  flagged: [
    "How do I prioritize these items?",
    "Should I dispute all of these at once?",
    "What's the best order to dispute?",
    "How long will this process take?"
  ],
  audit: [
    "Why is the audit log important?",
    "How do I use this in court?",
    "What should I document?",
    "Can I export this as evidence?"
  ]
};

// Page-specific welcome messages
const PAGE_CONTEXT = {
  analyze: "I see you're on the Analyze page. Need help downloading your credit reports or understanding what to look for?",
  chat: "Ask me anything about credit repair, identity theft, or your rights under the FCRA.",
  templates: "Looking at letter templates? I can help you pick the right one and explain how to customize it.",
  tracker: "Managing your disputes? I can explain deadlines, next steps, and what to do if they don't respond.",
  flagged: "These are items you've flagged for action. Want help prioritizing or understanding your options?",
  audit: "Your audit log tracks everything for potential legal action. Need help understanding how to use it?"
};

const SYSTEM_PROMPT = `You are 605b.ai's help assistant embedded in a credit repair application. You help users navigate the app and understand their rights.

CURRENT CONTEXT: The user is viewing the {PAGE} page of the dashboard.

Your role:
- Help users understand how to use the current page
- Explain credit repair concepts in simple, non-technical language
- Guide them through getting their credit reports
- Answer questions about FCRA, FDCPA, and their rights
- Be encouraging - many users are stressed about their credit situation

Keep responses SHORT and helpful. Use bullet points sparingly. Be warm but professional.

If they ask how to get their credit reports:
1. Go to AnnualCreditReport.com (the ONLY official free source)
2. You can get reports from all 3 bureaus weekly
3. Download as PDF (look for "Print" or "Download" option)
4. Save the file, then upload it to our Analyze page

If they seem confused or frustrated, acknowledge their feelings and break things down into smaller steps.`;

export default function FloatingChatWidget({ currentTab }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Add welcome message when first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: PAGE_CONTEXT[currentTab] || "Hi! I'm here to help. What questions do you have?"
      }]);
    }
  }, [isOpen, currentTab, messages.length]);

  const sendMessage = async (text) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    setHasInteracted(true);
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
        content: "Sorry, I had trouble connecting. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    sendMessage(prompt);
  };

  const currentPrompts = CONTEXTUAL_PROMPTS[currentTab] || CONTEXTUAL_PROMPTS.chat;

  if (!isOpen) {
    return (
      <>
        <style jsx>{`
          .chat-fab {
            position: fixed;
            bottom: 100px;
            right: 24px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #d4a574 0%, #b8956a 100%);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #09090b;
            box-shadow: 0 4px 20px rgba(212, 165, 116, 0.4);
            transition: all 0.2s;
            z-index: 1000;
          }
          .chat-fab:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 24px rgba(212, 165, 116, 0.5);
          }
          .chat-fab-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            width: 20px;
            height: 20px;
            background: #22c55e;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 700;
            color: white;
          }
          @media (max-width: 768px) {
            .chat-fab {
              bottom: 90px;
              right: 16px;
              width: 52px;
              height: 52px;
            }
          }
        `}</style>
        <button className="chat-fab" onClick={() => setIsOpen(true)}>
          <MessageCircle size={24} />
          {!hasInteracted && <span className="chat-fab-badge">?</span>}
        </button>
      </>
    );
  }

  return (
    <>
      <style jsx>{`
        .chat-widget {
          position: fixed;
          bottom: 100px;
          right: 24px;
          width: 380px;
          max-height: 520px;
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          z-index: 1000;
          overflow: hidden;
        }
        .chat-widget.minimized {
          max-height: 56px;
        }
        .widget-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(212, 165, 116, 0.05) 100%);
          border-bottom: 1px solid #27272a;
          cursor: pointer;
        }
        .widget-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #fafafa;
        }
        .widget-title-icon {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(212, 165, 116, 0.2);
          border-radius: 8px;
          color: #d4a574;
        }
        .widget-actions {
          display: flex;
          gap: 4px;
        }
        .widget-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: #71717a;
          cursor: pointer;
          transition: all 0.15s;
        }
        .widget-btn:hover {
          background: rgba(255,255,255,0.1);
          color: #fafafa;
        }
        .widget-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 200px;
          max-height: 300px;
        }
        .widget-msg {
          max-width: 85%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
        }
        .widget-msg.user {
          align-self: flex-end;
          background: #d4a574;
          color: #09090b;
          border-radius: 12px 12px 4px 12px;
        }
        .widget-msg.assistant {
          align-self: flex-start;
          background: #27272a;
          color: #e4e4e7;
          border-radius: 12px 12px 12px 4px;
        }
        .quick-prompts {
          padding: 12px 16px;
          border-top: 1px solid #27272a;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .quick-prompts-label {
          width: 100%;
          font-size: 11px;
          color: #52525b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .quick-prompt {
          padding: 6px 10px;
          background: rgba(39, 39, 42, 0.8);
          border: 1px solid #3f3f46;
          border-radius: 6px;
          font-size: 12px;
          color: #a1a1aa;
          cursor: pointer;
          transition: all 0.15s;
        }
        .quick-prompt:hover {
          background: rgba(212, 165, 116, 0.1);
          border-color: rgba(212, 165, 116, 0.3);
          color: #d4a574;
        }
        .widget-input-area {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid #27272a;
          background: rgba(9, 9, 11, 0.5);
        }
        .widget-input {
          flex: 1;
          padding: 10px 14px;
          background: #27272a;
          border: 1px solid #3f3f46;
          border-radius: 8px;
          color: #fafafa;
          font-size: 14px;
          outline: none;
        }
        .widget-input:focus {
          border-color: #d4a574;
        }
        .widget-input::placeholder {
          color: #52525b;
        }
        .widget-send {
          width: 40px;
          height: 40px;
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
        .widget-send:hover {
          background: #c49665;
        }
        .widget-send:disabled {
          background: #3f3f46;
          color: #52525b;
          cursor: not-allowed;
        }
        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 8px 0;
        }
        .typing-indicator span {
          width: 6px;
          height: 6px;
          background: #71717a;
          border-radius: 50%;
          animation: bounce 1.4s infinite;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 0.16s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.32s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @media (max-width: 768px) {
          .chat-widget {
            bottom: 80px;
            right: 12px;
            left: 12px;
            width: auto;
            max-height: 70vh;
          }
        }
      `}</style>

      <div className={`chat-widget ${isMinimized ? 'minimized' : ''}`}>
        <div className="widget-header" onClick={() => setIsMinimized(!isMinimized)}>
          <div className="widget-title">
            <span className="widget-title-icon"><Sparkles size={16} /></span>
            Help Assistant
          </div>
          <div className="widget-actions">
            <button className="widget-btn" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}>
              <ChevronDown size={18} style={{ transform: isMinimized ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            <button className="widget-btn" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="widget-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`widget-msg ${msg.role}`}>
                  {msg.content || (
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {!hasInteracted && (
              <div className="quick-prompts">
                <div className="quick-prompts-label">
                  <Sparkles size={12} /> Quick questions
                </div>
                {currentPrompts.slice(0, 3).map((prompt, i) => (
                  <button key={i} className="quick-prompt" onClick={() => handleQuickPrompt(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div className="widget-input-area">
              <input
                ref={inputRef}
                type="text"
                className="widget-input"
                placeholder="Ask a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                disabled={isLoading}
              />
              <button className="widget-send" onClick={() => sendMessage()} disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
