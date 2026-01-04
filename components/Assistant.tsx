
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Equipment, ChatMessage, EquipmentStatus } from '../types';
import { getGripAdvice, toolDeclarations, encodeAudio, decodeAudio, decodeAudioData } from '../services/geminiService';
import { Button } from './Button';
import { ChatBubble } from './ChatBubble';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

interface AssistantProps {
  inventory: Equipment[];
  isOnline: boolean;
  onAction: (action: string, args: any) => void;
  onClose?: () => void;
}

export const Assistant: React.FC<AssistantProps> = ({ inventory, isOnline, onAction, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Yo! I'm your GripAssistant. Now with Voice Mode! Ask me to check gear in/out while your hands are full.",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Live API Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleToolCall = useCallback((toolCall: any) => {
    for (const fc of toolCall.functionCalls) {
      console.log('AI performing tool call:', fc);
      onAction(fc.name, fc.args);
      
      // Send response back to model if using Live API or standard Chat
      if (sessionRef.current) {
        sessionRef.current.sendToolResponse({
          functionResponses: {
            id: fc.id,
            name: fc.name,
            response: { result: "ok, action performed" },
          }
        });
      }
    }
  }, [onAction]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !isOnline) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const result = await getGripAdvice(input, inventory, history);

    if (result) {
      // Handle tool calls from regular chat
      if (result.functionCalls && result.functionCalls.length > 0) {
        handleToolCall({ functionCalls: result.functionCalls });
      }

      const botMsg: ChatMessage = {
        role: 'assistant',
        content: result.text || "I've updated the inventory based on your request.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMsg]);
    } else {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: "I hit a snag on the network. Is the router still plugged in?",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
    setIsLoading(false);
  };

  const toggleVoiceMode = async () => {
    if (isVoiceMode) {
      // Close session
      if (sessionRef.current) sessionRef.current.close();
      setIsVoiceMode(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsVoiceMode(true);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inCtx;
      outAudioContextRef.current = outCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Voice session opened');
            const source = inCtx.createMediaStreamSource(stream);
            const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate audio level for visualization
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i]*inputData[i];
              setAudioLevel(Math.sqrt(sum / inputData.length));

              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const base64 = encodeAudio(new Uint8Array(int16.buffer));
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.toolCall) {
              handleToolCall(msg.toolCall);
            }

            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const audioBuffer = await decodeAudioData(decodeAudio(base64Audio), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outCtx.destination);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            if (msg.serverContent?.inputTranscription) {
              console.log('User said:', msg.serverContent.inputTranscription.text);
            }
          },
          onclose: () => setIsVoiceMode(false),
          onerror: (e) => console.error('Live API Error:', e),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          tools: [{ functionDeclarations: toolDeclarations }],
          systemInstruction: 'You are a helpful Key Grip assistant named GripBot. Use tools to manage inventory.'
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Microphone Access Denied", err);
      setIsVoiceMode(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800 w-full max-w-md shadow-2xl z-20">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isVoiceMode ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]' : 'bg-amber-500/10 border border-amber-500/20'}`}>
              {isVoiceMode ? (
                <div className="flex gap-0.5 items-end h-4">
                  {[1,2,3,4,5].map(i => (
                    <div 
                      key={i} 
                      className="w-1 bg-zinc-950 rounded-full" 
                      style={{ height: `${Math.max(20, audioLevel * 200 * (i/2))}px`, transition: 'height 0.1s ease' }}
                    ></div>
                  ))}
                </div>
              ) : (
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              )}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-zinc-950 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
          </div>
          <div>
            <h2 className="font-bold text-zinc-100 uppercase tracking-tighter text-lg italic leading-none">GripAssistant</h2>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">
              {isVoiceMode ? 'Live Audio Connected' : `Status: ${isOnline ? 'Ready to Rig' : 'Offline Mode'}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleVoiceMode} className={`h-8 px-2 text-[9px] ${isVoiceMode ? 'text-amber-500' : ''}`}>
            {isVoiceMode ? 'Stop Voice' : 'Voice Mode'}
          </Button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 text-zinc-500 hover:text-white bg-zinc-800 rounded-lg active:scale-90 transition-transform"
              aria-label="Close Assistant"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Message Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-zinc-900/10"
      >
        {isVoiceMode ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-32 h-32 relative mb-6">
              <div className="absolute inset-0 bg-amber-500/10 rounded-full animate-ping"></div>
              <div className="absolute inset-4 bg-amber-500/20 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-12 h-12 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </div>
            </div>
            <h3 className="text-zinc-100 font-bold uppercase tracking-widest text-sm mb-2">Hands-Free Listening</h3>
            <p className="text-zinc-500 text-xs italic">"Check out serial CS-40-001 to John"</p>
            <p className="text-zinc-500 text-xs italic">"Is there a 600d available?"</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-3 text-zinc-500 text-xs italic p-4 bg-zinc-900/40 rounded-xl border border-dashed border-zinc-800 animate-pulse">
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-amber-500 rounded-full animate-bounce"></span>
                  <span className="w-1 h-1 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1 h-1 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
                Consulting the inventory...
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Area */}
      {!isVoiceMode && (
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex gap-2 group">
            <input
              type="text"
              value={input}
              disabled={!isOnline}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isOnline ? "Message GripBot..." : "Assistant unavailable offline"}
              className={`flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder-zinc-600 ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <Button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim() || !isOnline}
              className="shadow-lg shadow-amber-500/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
