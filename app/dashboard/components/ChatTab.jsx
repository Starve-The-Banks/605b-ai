"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { SYSTEM_PROMPT } from '@/lib/constants';

export default function ChatTab({ logAction }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 1,
        role: 'assistant',
        content: `Welcome to 605b.ai. I help with credit disputes and identity theft recovery.\n\nI can help with:\n• Identity theft recovery — §605B blocks\n• Credit disputes — §611 disputes\n• Debt collection — §809 validation\n• Escalation — CFPB complaints\n\nWhat's your situation?`
      }]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    setInputValue('');
    const userMsg = { id: Date.now(), role: 'user', content: text };
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
      const responseText = await response.text();
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: responseText }]);
      logAction('AI_CHAT', { query: text.substring(0, 50) });
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: `Error: ${err.message}`, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role} ${msg.isError ? 'error' : ''}`}>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content"><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
            placeholder="Describe your situation..."
            rows={1}
          />
          <button className="send-btn" onClick={sendMessage} disabled={!inputValue.trim() || isLoading}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
