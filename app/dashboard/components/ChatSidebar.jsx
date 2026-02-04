"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Mic, MicOff, X, Volume2, VolumeX, AudioLines } from 'lucide-react';
import { SYSTEM_PROMPT } from '@/lib/constants';

const VOICE_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

VOICE MODE: Keep responses concise (2-3 sentences). Speak naturally without markdown or formatting.`;

const SUGGESTIONS = [
  "What should I dispute first?",
  "Explain my rights under 605B",
  "How long do bureaus have to respond?",
];

export default function ChatSidebar({ logAction, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "I'm your credit repair strategist. I know the FCRA inside and out. Upload a credit report for analysis, or tell me what's going on with your credit."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('chat');
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const speakTextRef = useRef(null);
  const sendMessageRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRecognition);
  }, []);

  useEffect(() => {
    if (!voiceSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (mode === 'voice' && input.trim()) {
        sendMessageRef.current?.(input);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [voiceSupported, mode, input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setInput('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = async (text) => {
    if (!audioEnabled || !text) return;

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'Rachel' })
      });

      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        if (data.useBrowserTTS) {
          browserSpeak(data.text);
          return;
        }
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) audioRef.current.pause();
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      setIsSpeaking(true);
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        if (mode === 'voice') setTimeout(() => startListening(), 500);
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      browserSpeak(text);
    }
  };

  speakTextRef.current = speakText;

  const browserSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      
      setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (mode === 'voice') setTimeout(() => startListening(), 500);
      };
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const sendMessage = useCallback(async (text) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    setInput('');
    const userMsg = { id: Date.now(), role: 'user', content: messageText };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          systemPrompt: mode === 'voice' ? VOICE_SYSTEM_PROMPT : SYSTEM_PROMPT
        })
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

      logAction?.('AI_CHAT', { query: messageText.substring(0, 50), mode });
      
      if (mode === 'voice' && audioEnabled) {
        speakTextRef.current?.(assistantMessage);
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: `Something went wrong. Please try again.`,
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [audioEnabled, input, isLoading, logAction, messages, mode]);

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  return (
    <>
      <style jsx>{`
        .chat-sidebar {
          background: linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-deep) 100%);
          border-left: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          position: relative;
          height: 100vh;
        }
        
        .chat-sidebar::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 1px;
          height: 100%;
          background: linear-gradient(180deg, var(--accent-dim) 0%, transparent 30%, transparent 70%, var(--accent-dim) 100%);
          pointer-events: none;
        }
        
        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-card);
        }
        
        .chat-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .chat-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--accent-dim) 0%, var(--accent-subtle) 100%);
          border: 1px solid var(--border-accent);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          position: relative;
        }
        
        .chat-avatar::after {
          content: '';
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 10px;
          height: 10px;
          background: var(--success);
          border: 2px solid var(--bg-card);
          border-radius: 50%;
        }
        
        .chat-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .chat-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .chat-status {
          font-size: 11px;
          color: var(--success);
        }
        
        .chat-header-actions {
          display: flex;
          gap: 4px;
        }
        
        .header-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .header-btn:hover {
          background: var(--bg-elevated);
          border-color: var(--border-subtle);
          color: var(--text-primary);
        }
        
        .mode-toggle {
          display: flex;
          margin: 12px 16px;
          background: var(--bg-deep);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          padding: 4px;
        }
        
        .mode-btn {
          flex: 1;
          padding: 8px 12px;
          background: transparent;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .mode-btn.active {
          background: linear-gradient(135deg, var(--accent-dim) 0%, var(--bg-card) 100%);
          color: var(--accent);
        }
        
        .mode-btn:hover:not(.active) {
          color: var(--text-secondary);
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .message {
          display: flex;
          gap: 12px;
          animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .msg-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 11px;
          font-weight: 700;
        }
        
        .message.assistant .msg-avatar {
          background: linear-gradient(135deg, var(--accent-dim) 0%, var(--accent-subtle) 100%);
          border: 1px solid var(--border-accent);
          color: var(--accent);
        }
        
        .message.user .msg-avatar {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
        }
        
        .msg-content {
          flex: 1;
          min-width: 0;
        }
        
        .msg-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        
        .msg-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        
        .message.assistant .msg-name {
          color: var(--accent);
        }
        
        .msg-time {
          font-size: 10px;
          color: var(--text-muted);
          font-family: 'JetBrains Mono', monospace;
        }
        
        .msg-body {
          font-size: 13px;
          line-height: 1.7;
          color: var(--text-secondary);
          white-space: pre-wrap;
        }
        
        .msg-body strong {
          color: var(--text-primary);
          font-weight: 600;
        }
        
        .message.error .msg-body {
          color: var(--danger);
        }
        
        .typing-dots {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }
        
        .typing-dots span {
          width: 6px;
          height: 6px;
          background: var(--text-muted);
          border-radius: 50%;
          animation: bounce 1.4s infinite;
        }
        
        .typing-dots span:nth-child(2) { animation-delay: 0.16s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.32s; }
        
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        
        .chat-input-area {
          padding: 16px;
          border-top: 1px solid var(--border-subtle);
          background: var(--bg-card);
        }
        
        .input-container {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          transition: all 0.15s;
        }
        
        .input-container:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-dim), 0 0 24px var(--accent-dim);
        }
        
        .input-container.listening {
          border-color: var(--success);
          box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.15);
        }
        
        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
        }
        
        .chat-input::placeholder {
          color: var(--text-muted);
        }
        
        .input-btn {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .input-btn:hover {
          background: var(--bg-card);
          color: var(--text-secondary);
        }
        
        .input-btn.active {
          background: var(--success);
          color: var(--bg-deep);
        }
        
        .input-btn.send {
          background: linear-gradient(135deg, var(--accent) 0%, #E55A2B 100%);
          color: var(--bg-deep);
        }
        
        .input-btn.send:hover:not(:disabled) {
          box-shadow: 0 2px 12px var(--accent-glow);
          transform: scale(1.05);
        }
        
        .input-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        
        .suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 12px;
        }
        
        .suggestion {
          padding: 6px 12px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          font-size: 11px;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .suggestion:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: var(--accent-subtle);
        }
        
        @media (max-width: 1200px) {
          .chat-sidebar {
            position: fixed;
            right: 0;
            top: 0;
            width: 100%;
            max-width: 400px;
            z-index: 100;
            box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
          }
        }
        
        @media (max-width: 480px) {
          .chat-sidebar {
            max-width: 100%;
          }
        }
      `}</style>

      <aside className="chat-sidebar">
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="chat-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
            </div>
            <div className="chat-info">
              <div className="chat-name">AI Strategist</div>
              <div className="chat-status">Online</div>
            </div>
          </div>
          <div className="chat-header-actions">
            <button className="header-btn" onClick={onClose} title="Close chat">
              <X size={16} />
            </button>
          </div>
        </div>
        
        <div className="mode-toggle">
          <button 
            className={`mode-btn ${mode === 'chat' ? 'active' : ''}`}
            onClick={() => setMode('chat')}
          >
            Chat
          </button>
          {voiceSupported && (
            <button 
              className={`mode-btn ${mode === 'voice' ? 'active' : ''}`}
              onClick={() => {
                setMode('voice');
                setTimeout(() => startListening(), 300);
              }}
            >
              Voice
            </button>
          )}
        </div>
        
        <div className="chat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.role} ${msg.isError ? 'error' : ''}`}>
              <div className="msg-avatar">
                {msg.role === 'assistant' ? 'AI' : 'You'}
              </div>
              <div className="msg-content">
                <div className="msg-header">
                  <span className="msg-name">{msg.role === 'assistant' ? 'AI Strategist' : 'You'}</span>
                  <span className="msg-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="msg-body">
                  {msg.content || (
                    <div className="typing-dots">
                      <span></span><span></span><span></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chat-input-area">
          <div className={`input-container ${isListening ? 'listening' : ''}`}>
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder={isListening ? 'Listening...' : 'Ask about your disputes...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={isLoading || mode === 'voice'}
            />
            
            {voiceSupported && (
              <button 
                className={`input-btn ${isListening ? 'active' : ''}`}
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
                title={isListening ? 'Stop listening' : 'Voice input'}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}
            
            {mode === 'voice' && (
              <button 
                className={`input-btn ${!audioEnabled ? 'active' : ''}`}
                onClick={() => setAudioEnabled(!audioEnabled)}
                title={audioEnabled ? 'Mute' : 'Unmute'}
              >
                {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            )}
            
            <button 
              className="input-btn send"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          
          {messages.length <= 2 && (
            <div className="suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="suggestion" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
