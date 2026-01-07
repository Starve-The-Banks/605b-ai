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

const VOICE_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

VOICE MODE INSTRUCTIONS:
- Keep responses concise and conversational (2-4 sentences typically)
- Avoid markdown formatting, bullet points, or special characters
- Speak naturally as if in a phone conversation
- Ask one clarifying question at a time if needed
- Use simple, clear language that sounds good when spoken aloud
- Don't use symbols like arrows, asterisks, or dashes for lists`;

export default function AIStrategistPage() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  
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

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRecognition);
  }, []);

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
      
      setInputValue(transcript + finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (transcript && voiceMode) {
        sendMessage(transcript);
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

  const speakText = useCallback(async (text) => {
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
  }, [audioEnabled, voiceMode]);

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

  const sendMessage = async (text) => {
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

      if (voiceMode && audioEnabled) {
        speakText(assistantMessage);
      }
      
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: `Error: ${err.message}`, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 48px)',
      maxWidth: '900px',
      margin: '0 auto',
    },
    chatBody: {
      flex: 1,
      overflowY: 'auto',
      paddingBottom: '24px',
    },
    introSection: {
      padding: '32px 0',
    },
    introHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '24px',
    },
    introIcon: {
      width: '56px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, rgba(247, 208, 71, 0.2) 0%, rgba(247, 208, 71, 0.05) 100%)',
      border: '1px solid rgba(247, 208, 71, 0.3)',
      borderRadius: '16px',
      color: '#f7d047',
    },
    introTitle: {
      fontSize: '22px',
      fontWeight: 600,
      color: '#fafafa',
      marginBottom: '4px',
    },
    introSubtitle: {
      fontSize: '13px',
      color: '#71717a',
      letterSpacing: '0.02em',
    },
    introText: {
      fontSize: '15px',
      lineHeight: 1.8,
      color: '#a1a1aa',
      whiteSpace: 'pre-wrap',
    },
    quickStarts: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '10px',
      marginTop: '28px',
    },
    quickStart: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 16px',
      background: 'rgba(24, 24, 27, 0.8)',
      border: '1px solid #27272a',
      borderRadius: '12px',
      color: '#a1a1aa',
      fontSize: '14px',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.2s',
    },
    quickStartIcon: {
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#27272a',
      borderRadius: '10px',
      flexShrink: 0,
    },
    messagesContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    userMsg: {
      alignSelf: 'flex-end',
      maxWidth: '85%',
    },
    assistantMsg: {
      alignSelf: 'flex-start',
      maxWidth: '85%',
    },
    userMsgContent: {
      padding: '14px 18px',
      borderRadius: '16px',
      fontSize: '15px',
      lineHeight: 1.7,
      whiteSpace: 'pre-wrap',
      background: 'linear-gradient(135deg, #f7d047 0%, #d4b840 100%)',
      color: '#09090b',
      borderBottomRightRadius: '4px',
    },
    assistantMsgContent: {
      padding: '14px 18px',
      borderRadius: '16px',
      fontSize: '15px',
      lineHeight: 1.7,
      whiteSpace: 'pre-wrap',
      background: '#18181b',
      border: '1px solid #27272a',
      color: '#e4e4e7',
      borderBottomLeftRadius: '4px',
    },
    inputArea: {
      paddingTop: '16px',
      borderTop: '1px solid #1c1c1f',
    },
    inputWrapper: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '8px',
      background: 'linear-gradient(135deg, rgba(24, 24, 27, 0.9) 0%, rgba(24, 24, 27, 0.7) 100%)',
      border: '1px solid #27272a',
      borderRadius: '16px',
      padding: '14px 18px',
    },
    chatInput: {
      flex: 1,
      background: 'transparent',
      border: 'none',
      color: '#fafafa',
      fontSize: '15px',
      resize: 'none',
      outline: 'none',
      lineHeight: 1.5,
      fontFamily: 'inherit',
      maxHeight: '120px',
    },
    btnIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'all 0.2s',
    },
    sendBtn: {
      background: 'linear-gradient(135deg, #f7d047 0%, #d4b840 100%)',
      color: '#09090b',
    },
    micBtn: {
      background: '#27272a',
      color: '#a1a1aa',
    },
    voiceBtn: {
      background: '#27272a',
      color: '#a1a1aa',
    },
    inputHint: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '16px',
      marginTop: '12px',
      fontSize: '12px',
      color: '#3f3f46',
    },
    voiceOverlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(9, 9, 11, 0.98)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
    voiceOrb: {
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, rgba(247, 208, 71, 0.2) 0%, rgba(247, 208, 71, 0.05) 100%)',
      border: '2px solid rgba(247, 208, 71, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '32px',
    },
    voiceStatus: {
      fontSize: '18px',
      fontWeight: 500,
      color: '#fafafa',
      marginBottom: '8px',
    },
    voiceTranscript: {
      fontSize: '15px',
      color: '#a1a1aa',
      maxWidth: '400px',
      textAlign: 'center',
      minHeight: '24px',
    },
    voiceControls: {
      display: 'flex',
      gap: '16px',
      marginTop: '48px',
    },
    voiceControlBtn: {
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    typingDots: {
      display: 'flex',
      gap: '4px',
      padding: '4px 0',
    },
    typingDot: {
      width: '6px',
      height: '6px',
      background: '#71717a',
      borderRadius: '50%',
    },
  };

  return (
    <>
      {voiceMode && (
        <div style={styles.voiceOverlay}>
          <div style={{
            ...styles.voiceOrb,
            background: isListening 
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(34, 197, 94, 0.1) 100%)'
              : isSpeaking 
              ? 'linear-gradient(135deg, rgba(247, 208, 71, 0.3) 0%, rgba(247, 208, 71, 0.1) 100%)'
              : isLoading
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(245, 158, 11, 0.1) 100%)'
              : styles.voiceOrb.background,
            borderColor: isListening ? 'rgba(34, 197, 94, 0.5)' : isSpeaking ? 'rgba(247, 208, 71, 0.5)' : isLoading ? 'rgba(245, 158, 11, 0.5)' : 'rgba(247, 208, 71, 0.3)',
          }}>
            {isListening ? (
              <Mic size={64} color="#22c55e" />
            ) : isSpeaking ? (
              <AudioLines size={64} color="#f7d047" />
            ) : isLoading ? (
              <Loader2 size={64} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <AudioLines size={64} color="#f7d047" />
            )}
          </div>
          
          <div style={styles.voiceStatus}>
            {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : isLoading ? 'Thinking...' : 'Ready'}
          </div>
          
          <div style={styles.voiceTranscript}>
            {inputValue || (isListening ? 'Say something...' : '')}
          </div>
          
          <div style={styles.voiceControls}>
            <button 
              style={{
                ...styles.voiceControlBtn,
                background: !audioEnabled ? 'rgba(239, 68, 68, 0.2)' : '#27272a',
                color: !audioEnabled ? '#ef4444' : '#a1a1aa',
              }}
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setAudioEnabled(!audioEnabled);
              }}
            >
              {audioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </button>
            
            <button 
              style={{
                ...styles.voiceControlBtn,
                background: '#ef4444',
                color: 'white',
              }}
              onClick={toggleVoiceMode}
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      <div style={styles.container}>
        <div style={styles.chatBody}>
          {showIntro && messages.length === 0 ? (
            <div style={styles.introSection}>
              <div style={styles.introHeader}>
                <div style={styles.introIcon}>
                  <Sparkles size={28} />
                </div>
                <div>
                  <div style={styles.introTitle}>AI Credit Strategist</div>
                  <div style={styles.introSubtitle}>FCRA · FDCPA · Consumer Protection Law</div>
                </div>
              </div>
              <div style={styles.introText}>{INTRO_MESSAGE}</div>
              <div style={styles.quickStarts}>
                {QUICK_STARTS.map((item, i) => (
                  <button 
                    key={i} 
                    style={styles.quickStart} 
                    onClick={() => sendMessage(item.text)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(247, 208, 71, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(247, 208, 71, 0.3)';
                      e.currentTarget.style.color = '#f7d047';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(24, 24, 27, 0.8)';
                      e.currentTarget.style.borderColor = '#27272a';
                      e.currentTarget.style.color = '#a1a1aa';
                    }}
                  >
                    <span style={styles.quickStartIcon}><item.icon size={18} /></span>
                    <span>{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={styles.messagesContainer}>
              {messages.map(msg => (
                <div key={msg.id} style={msg.role === 'user' ? styles.userMsg : styles.assistantMsg}>
                  <div style={msg.role === 'user' ? styles.userMsgContent : styles.assistantMsgContent}>
                    {msg.content || (
                      <div style={styles.typingDots}>
                        <span style={styles.typingDot}></span>
                        <span style={styles.typingDot}></span>
                        <span style={styles.typingDot}></span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div style={styles.inputArea}>
          <div style={{
            ...styles.inputWrapper,
            borderColor: isListening ? 'rgba(34, 197, 94, 0.5)' : '#27272a',
            boxShadow: isListening ? '0 0 0 3px rgba(34, 197, 94, 0.15)' : 'none',
          }}>
            <textarea
              ref={inputRef}
              style={styles.chatInput}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
              placeholder={isListening ? 'Listening...' : 'Describe your situation...'}
              rows={1}
              disabled={voiceMode}
            />
            
            {voiceSupported && (
              <button 
                style={{
                  ...styles.btnIcon,
                  ...styles.voiceBtn,
                  background: voiceMode ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : '#27272a',
                  color: voiceMode ? '#09090b' : '#a1a1aa',
                }}
                onClick={toggleVoiceMode}
                title={voiceMode ? 'Exit voice mode' : 'Voice mode'}
              >
                <AudioLines size={20} />
              </button>
            )}
            
            {voiceSupported && !voiceMode && (
              <button 
                style={{
                  ...styles.btnIcon,
                  ...styles.micBtn,
                  background: isListening ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : '#27272a',
                  color: isListening ? '#09090b' : '#a1a1aa',
                }}
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
                title={isListening ? 'Stop listening' : 'Voice input'}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            )}
            
            <button 
              style={{
                ...styles.btnIcon,
                ...styles.sendBtn,
                opacity: !inputValue.trim() || isLoading ? 0.4 : 1,
                cursor: !inputValue.trim() || isLoading ? 'not-allowed' : 'pointer',
              }}
              onClick={() => sendMessage()} 
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={20} />}
            </button>
          </div>
          
          <div style={styles.inputHint}>
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

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
