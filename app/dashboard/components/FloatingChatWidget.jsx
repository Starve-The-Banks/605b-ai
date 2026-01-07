"use client";

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, ChevronDown, Sparkles, Mic, MicOff, AudioLines } from 'lucide-react';

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

const VOICE_SYSTEM_PROMPT = `You are 605b.ai's help assistant. The user is speaking to you via voice.

CURRENT CONTEXT: The user is viewing the {PAGE} page.

Keep responses VERY SHORT (1-2 sentences). Speak naturally. No bullet points or formatting.`;

export default function FloatingChatWidget({ currentTab }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  // Check for voice support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRecognition);
  }, []);

  // Initialize speech recognition
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
      // Auto-send if voice mode is active and we have input
      if (voiceMode && input.trim()) {
        sendMessage(input);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [voiceSupported, voiceMode, input]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && !voiceMode) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized, voiceMode]);

  // Add welcome message when first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: PAGE_CONTEXT[currentTab] || "Hi! I'm here to help. What questions do you have?"
      }]);
    }
  }, [isOpen, currentTab, messages.length]);

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

  const toggleVoiceMode = () => {
    if (voiceMode) {
      stopListening();
      if (audioRef.current) audioRef.current.pause();
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      setVoiceMode(false);
    } else {
      setVoiceMode(true);
      setHasInteracted(true);
      setTimeout(() => startListening(), 300);
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
        if (voiceMode) setTimeout(() => startListening(), 500);
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

  const browserSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      
      setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (voiceMode) setTimeout(() => startListening(), 500);
      };
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

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
          systemPrompt: (voiceMode ? VOICE_SYSTEM_PROMPT : SYSTEM_PROMPT).replace('{PAGE}', currentTab.toUpperCase())
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

      // Speak response if voice mode is active
      if (voiceMode && audioEnabled) {
        speakText(assistantMessage);
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
            bottom: 24px;
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
              bottom: 88px;
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
          bottom: 24px;
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
        .widget-input.listening {
          border-color: #22c55e;
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
        }
        .input-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .widget-send {
          background: #d4a574;
          color: #09090b;
        }
        .widget-send:hover {
          background: #c49665;
        }
        .widget-send:disabled {
          background: #3f3f46;
          color: #52525b;
          cursor: not-allowed;
        }
        .voice-btn {
          background: #27272a;
          color: #a1a1aa;
        }
        .voice-btn:hover {
          background: #3f3f46;
          color: #fafafa;
        }
        .voice-btn.active {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: #09090b;
        }
        .voice-btn.listening {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: #09090b;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .chat-widget {
            bottom: 88px;
            right: 12px;
            left: 12px;
            width: auto;
            max-height: 60vh;
          }
          .widget-messages {
            min-height: 150px;
            max-height: 200px;
          }
          .quick-prompts {
            padding: 10px 12px;
          }
          .quick-prompt {
            font-size: 11px;
            padding: 5px 8px;
          }
        }
      `}</style>

      <div className={`chat-widget ${isMinimized ? 'minimized' : ''}`}>
        <div className="widget-header" onClick={() => setIsMinimized(!isMinimized)}>
          <div className="widget-title">
            <span className="widget-title-icon">
              {voiceMode ? <AudioLines size={16} /> : <Sparkles size={16} />}
            </span>
            {voiceMode ? 'Voice Chat' : 'Help Assistant'}
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
                className={`widget-input ${isListening ? 'listening' : ''}`}
                placeholder={isListening ? 'Listening...' : voiceMode ? 'Voice mode active' : 'Ask a question...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                disabled={isLoading || voiceMode}
              />
              
              {/* Voice mode toggle */}
              {voiceSupported && (
                <button 
                  className={`input-btn voice-btn ${voiceMode ? 'active' : ''} ${isListening ? 'listening' : ''}`}
                  onClick={toggleVoiceMode}
                  title={voiceMode ? 'Exit voice mode' : 'Voice mode'}
                >
                  <AudioLines size={18} />
                </button>
              )}
              
              {/* Mic for dictation (when not in voice mode) */}
              {voiceSupported && !voiceMode && (
                <button 
                  className={`input-btn voice-btn ${isListening ? 'listening' : ''}`}
                  onClick={isListening ? stopListening : startListening}
                  disabled={isLoading}
                  title={isListening ? 'Stop' : 'Dictate'}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              )}
              
              <button 
                className="input-btn widget-send" 
                onClick={() => sendMessage()} 
                disabled={isLoading || !input.trim() || voiceMode}
              >
                {isLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
