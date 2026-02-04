"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Sparkles, Shield, FileText, Scale, Zap, Mic, MicOff, Volume2, VolumeX, X, AudioLines } from 'lucide-react';
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

// Voice mode system prompt - more conversational
const VOICE_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

VOICE MODE INSTRUCTIONS:
- Keep responses concise and conversational (2-4 sentences typically)
- Avoid markdown formatting, bullet points, or special characters
- Speak naturally as if in a phone conversation
- Ask one clarifying question at a time if needed
- Use simple, clear language that sounds good when spoken aloud
- Don't use symbols like arrows, asterisks, or dashes for lists`;

export default function ChatTab({ logAction }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  
  // Voice mode state
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const speakTextRef = useRef(null);
  const sendMessageRef = useRef(null);

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
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += result;
        } else {
          interimTranscript += result;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
      }
      
      // Show interim results in input
      setInputValue(transcript + finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-send if we have a transcript and voice mode is active
      if (transcript && voiceMode) {
        sendMessageRef.current?.(transcript);
        setTranscript('');
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [voiceSupported, transcript, voiceMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!voiceMode) {
      inputRef.current?.focus();
    }
  }, [voiceMode]);

  // Text-to-speech function
  const speakText = async (text) => {
    if (!audioEnabled || !text) return;

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'Rachel' })
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

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
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      setIsSpeaking(true);
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        
        if (voiceMode && recognitionRef.current) {
          setTimeout(() => {
            startListening();
          }, 500);
        }
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
      
    } catch (error) {
      console.error('TTS error:', error);
      browserSpeak(text);
    }
  };

  speakTextRef.current = speakText;

  const browserSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Samantha') || 
        v.name.includes('Google') || 
        v.name.includes('Microsoft') ||
        v.lang.startsWith('en')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      setIsSpeaking(true);
      
      utterance.onend = () => {
        setIsSpeaking(false);
        if (voiceMode && recognitionRef.current) {
          setTimeout(() => startListening(), 500);
        }
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening && !isSpeaking) {
      setTranscript('');
      setInputValue('');
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
      if (audioRef.current) {
        audioRef.current.pause();
      }
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      setVoiceMode(false);
    } else {
      setVoiceMode(true);
      setShowIntro(false);
      setTimeout(() => startListening(), 300);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const sendMessage = useCallback(async (text) => {
    const messageText = text || inputValue.trim();
    if (!messageText || isLoading) return;

    setShowIntro(false);
    setInputValue('');
    setTranscript('');
    
    const userMsg = { id: Date.now(), role: 'user', content: messageText };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          systemPrompt: voiceMode ? VOICE_SYSTEM_PROMPT : SYSTEM_PROMPT
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

      logAction('AI_CHAT', { query: messageText.substring(0, 50), voiceMode });
      
      if (voiceMode && audioEnabled) {
        speakTextRef.current?.(assistantMessage);
      }
      
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: `Error: ${err.message}`, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  }, [audioEnabled, inputValue, isLoading, logAction, messages, voiceMode]);

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
          color: #FF6B35;
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
          color: #FF6B35;
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
          color: #FF6B35;
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
          background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%);
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
          gap: 8px;
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
        .input-wrapper.voice-active {
          border-color: rgba(34, 197, 94, 0.5);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
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
        .btn-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .send-btn {
          background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%);
          color: #09090b;
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
        .mic-btn {
          background: #27272a;
          color: #a1a1aa;
        }
        .mic-btn:hover {
          background: #3f3f46;
          color: #fafafa;
        }
        .mic-btn.listening {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: #09090b;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
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
        .input-hint {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 12px;
          font-size: 12px;
          color: #3f3f46;
        }
        .voice-mode-overlay {
          position: fixed;
          inset: 0;
          background: rgba(9, 9, 11, 0.98);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 100;
          animation: fadeIn 0.3s ease;
        }
        .voice-orb {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(212, 165, 116, 0.2) 0%, rgba(212, 165, 116, 0.05) 100%);
          border: 2px solid rgba(212, 165, 116, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 32px;
          transition: all 0.3s;
        }
        .voice-orb.listening {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(34, 197, 94, 0.1) 100%);
          border-color: rgba(34, 197, 94, 0.5);
          animation: orbPulse 2s infinite;
        }
        .voice-orb.speaking {
          background: linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(212, 165, 116, 0.1) 100%);
          border-color: rgba(212, 165, 116, 0.5);
          animation: orbPulse 1s infinite;
        }
        .voice-orb.processing {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(245, 158, 11, 0.1) 100%);
          border-color: rgba(245, 158, 11, 0.5);
        }
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .voice-status {
          font-size: 18px;
          font-weight: 500;
          color: #fafafa;
          margin-bottom: 8px;
        }
        .voice-transcript {
          font-size: 15px;
          color: #a1a1aa;
          max-width: 400px;
          text-align: center;
          min-height: 24px;
        }
        .voice-controls {
          display: flex;
          gap: 16px;
          margin-top: 48px;
        }
        .voice-control-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .voice-control-btn.end {
          background: #ef4444;
          color: white;
        }
        .voice-control-btn.end:hover {
          background: #dc2626;
          transform: scale(1.05);
        }
        .voice-control-btn.mute {
          background: #27272a;
          color: #a1a1aa;
        }
        .voice-control-btn.mute:hover {
          background: #3f3f46;
        }
        .voice-control-btn.mute.muted {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
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
          .voice-orb {
            width: 160px;
            height: 160px;
          }
        }
      `}</style>

      {/* Voice Mode Overlay */}
      {voiceMode && (
        <div className="voice-mode-overlay">
          <div className={`voice-orb ${isListening ? 'listening' : isSpeaking ? 'speaking' : isLoading ? 'processing' : ''}`}>
            {isListening ? (
              <Mic size={64} color="#22c55e" />
            ) : isSpeaking ? (
              <AudioLines size={64} color="#FF6B35" />
            ) : isLoading ? (
              <Loader2 size={64} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <AudioLines size={64} color="#FF6B35" />
            )}
          </div>
          
          <div className="voice-status">
            {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : isLoading ? 'Thinking...' : 'Ready'}
          </div>
          
          <div className="voice-transcript">
            {inputValue || (isListening ? 'Say something...' : '')}
          </div>
          
          <div className="voice-controls">
            <button 
              className={`voice-control-btn mute ${!audioEnabled ? 'muted' : ''}`}
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setAudioEnabled(!audioEnabled);
              }}
              title={audioEnabled ? 'Mute AI voice' : 'Unmute AI voice'}
            >
              {audioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </button>
            
            <button 
              className="voice-control-btn end"
              onClick={toggleVoiceMode}
              title="End voice mode"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}

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
          <div className={`input-wrapper ${isListening ? 'voice-active' : ''}`}>
            <textarea
              ref={inputRef}
              className="chat-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
              placeholder={isListening ? 'Listening...' : 'Describe your situation...'}
              rows={1}
              disabled={voiceMode}
            />
            
            {/* Voice mode toggle - waveform icon like OpenAI/Claude */}
            {voiceSupported && (
              <button 
                className={`btn-icon voice-btn ${voiceMode ? 'active' : ''}`}
                onClick={toggleVoiceMode}
                title={voiceMode ? 'Exit voice mode' : 'Voice mode'}
              >
                <AudioLines size={20} />
              </button>
            )}
            
            {/* Mic button for quick voice input */}
            {voiceSupported && !voiceMode && (
              <button 
                className={`btn-icon mic-btn ${isListening ? 'listening' : ''}`}
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
                title={isListening ? 'Stop listening' : 'Voice input'}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            )}
            
            <button 
              className="btn-icon send-btn" 
              onClick={() => sendMessage()} 
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={20} />}
            </button>
          </div>
          
          <div className="input-hint">
            {voiceSupported ? (
              <>
                <span>Enter to send</span>
                <span>·</span>
                <span>Mic for dictation</span>
                <span>·</span>
                <span>Waves for voice chat</span>
              </>
            ) : (
              <span>Press Enter to send · Shift+Enter for new line</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
