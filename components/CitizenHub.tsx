
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChatMessage, INDIAN_LANGUAGES } from '../types';
import { SYSTEM_PROMPT } from '../constants';
import { bhashini } from '../services/BhashiniService';
import { gemini } from '../services/GeminiService';
import VoiceVisualizer from './VoiceVisualizer';

class AudioResourceManager {
  private static instance: AudioResourceManager;
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;

  static getInstance() {
    if (!AudioResourceManager.instance) AudioResourceManager.instance = new AudioResourceManager();
    return AudioResourceManager.instance;
  }

  async getContext() {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    return this.ctx;
  }

  playBuffer(buffer: AudioBuffer, onEnd: () => void) {
    this.stop();
    if (!this.ctx) return;
    this.source = this.ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.connect(this.ctx.destination);
    this.source.onended = () => { onEnd(); };
    this.source.start();
  }

  stop() {
    if (this.source) {
      try { this.source.stop(); } catch (e) {}
      this.source = null;
    }
  }
}

interface ExtendedChatMessage extends ChatMessage {
  grounding?: any[];
}

const CitizenHub: React.FC = () => {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([{
    id: '1', role: 'assistant', text: 'Namaste! I am your Aadhaar Mitra. I can help you find enrollment centers, check your document status, or explain policies in your language. How can I assist today?', timestamp: new Date(), engine: 'gemini'
  }]);
  const [inputText, setInputText] = useState('');
  const [selectedLang, setSelectedLang] = useState('hi');
  const [selectedVoice, setSelectedVoice] = useState<'Kore' | 'Puck' | 'Charon' | 'Zephyr' | 'Fenrir'>('Zephyr');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [error, setError] = useState<{message: string; type: 'warning' | 'error'} | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioManager = useMemo(() => AudioResourceManager.getInstance(), []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isProcessing]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.onresult = (e: any) => handleSendMessage(e.results[0][0].transcript);
      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }
  }, [selectedLang]);

  const getPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject(new Error("Geolocation not supported"));
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
    });
  };

  // Fix: Added handleImageUpload to process local file selection for document scanning
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Clear input so same file can be selected again
      e.target.value = '';
    }
  };

  const handleSendMessage = useCallback(async (textOverride?: string, forceLocation?: boolean) => {
    const content = (textOverride || inputText).trim();
    if (!content && !pendingImage) return;
    if (isProcessing) return;

    setError(null);
    audioManager.stop();
    setPlayingId(null);

    let locationData = userLocation;
    if (forceLocation || content.toLowerCase().includes('near') || content.toLowerCase().includes('location')) {
      try {
        const pos = await getPosition();
        locationData = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(locationData);
      } catch (e) {
        console.warn("Location permission not granted or timeout.");
      }
    }

    const newUserMsg: ExtendedChatMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: content || "Scanning Aadhaar document...", 
      timestamp: new Date(),
      image: pendingImage || undefined
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    const currentImage = pendingImage;
    setPendingImage(null);
    setInputText('');
    setIsProcessing(true);

    try {
      const langName = INDIAN_LANGUAGES.find(l => l.code === selectedLang)?.name || 'Hindi';
      let processedPrompt = content;
      
      // Bhashini Pre-translation
      if (bhashini.isConfigured && selectedLang !== 'en' && content) {
        try { processedPrompt = await bhashini.translate(content, selectedLang, 'en'); } catch (e) {}
      }

      const streamId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: streamId, role: 'assistant', text: '', timestamp: new Date(), grounding: [] }]);

      let fullText = "";
      let groundingChunks: any[] = [];
      const stream = gemini.generateStream(`[Lang: ${langName}] Query: ${processedPrompt}`, SYSTEM_PROMPT, currentImage || undefined, locationData || undefined);
      
      for await (const chunk of stream) {
        fullText += chunk.text;
        if (chunk.grounding && chunk.grounding.length > 0) {
          groundingChunks = [...groundingChunks, ...chunk.grounding];
        }
        setMessages(prev => prev.map(m => m.id === streamId ? { ...m, text: fullText, grounding: groundingChunks } : m));
      }

      // Bhashini Post-translation
      if (bhashini.isConfigured && selectedLang !== 'en') {
        try {
          const translated = await bhashini.translate(fullText, 'en', selectedLang);
          setMessages(prev => prev.map(m => m.id === streamId ? { ...m, text: translated, engine: 'bhashini' } : m));
        } catch (e) {}
      }
    } catch (err) {
      setError({ message: "Interaction interrupted. Please check your internet connection.", type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, pendingImage, isProcessing, selectedLang, userLocation, audioManager]);

  const handleSpeak = async (msg: ExtendedChatMessage) => {
    if (playingId === msg.id) { audioManager.stop(); setPlayingId(null); return; }
    audioManager.stop();
    setPlayingId(msg.id);
    try {
      const ctx = await audioManager.getContext();
      let audioBuffer: AudioBuffer;
      if (bhashini.isConfigured && selectedLang !== 'en') {
        const base64Audio = await bhashini.textToSpeech(msg.text, selectedLang);
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        audioBuffer = await ctx.decodeAudioData(bytes.buffer);
      } else {
        const rawAudio = await gemini.textToSpeech(msg.text, selectedVoice);
        audioBuffer = await gemini.decodePCM(rawAudio, ctx);
      }
      audioManager.playBuffer(audioBuffer, () => setPlayingId(null));
    } catch (e) {
      setError({ message: "Voice playback failed. Please try again.", type: 'warning' });
      setPlayingId(null);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        setError({ message: "Voice recognition not supported in this browser.", type: 'error' });
        return;
      }
      recognitionRef.current.lang = selectedLang === 'en' ? 'en-US' : selectedLang;
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-right-4 duration-1000">
      {/* Dynamic Sidebar */}
      <div className="hidden lg:flex w-80 flex-col gap-6">
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex-1 flex flex-col overflow-y-auto scrollbar-hide">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Settings</h3>
             {userLocation && <span className="bg-green-100 text-green-600 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Loc: Active</span>}
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Language</label>
              <select value={selectedLang} onChange={e => setSelectedLang(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 transition-all cursor-pointer">
                {INDIAN_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native} — {l.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Assistant Voice</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Zephyr', 'Kore', 'Puck', 'Fenrir'] as const).map(v => (
                  <button key={v} onClick={() => setSelectedVoice(v)} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedVoice === v ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-100 my-4"></div>

            <h3 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-4">Aadhaar Toolkit</h3>
            <div className="space-y-3">
              {[
                { label: 'Update Phone', query: 'How do I update my mobile number?' },
                { label: 'Blue Aadhaar', query: 'What is Blue Aadhaar for children?' },
                { label: 'Find Centers', query: 'Where is the nearest Aadhaar enrollment center?', useLocation: true },
                { label: 'E-KYC Guide', query: 'Explain the e-KYC process for banks.' }
              ].map((a, i) => (
                <button key={i} onClick={() => handleSendMessage(a.query, (a as any).useLocation)} className="w-full p-4 rounded-2xl bg-slate-50 text-left text-[11px] font-bold text-slate-700 hover:bg-blue-600 hover:text-white transition-all border border-slate-100 group">
                  <span className="flex items-center justify-between">
                    {a.label}
                    {(a as any).useLocation ? <svg className="w-3.5 h-3.5 text-blue-500 group-hover:text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/></svg> : <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7" strokeWidth={4}/></svg>}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-4">
              <button onClick={() => fileInputRef.current?.click()} className="w-full p-6 rounded-3xl border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex flex-col items-center gap-3 group">
                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <span className="text-[9px] font-black uppercase tracking-[2px] text-slate-500">Scan Documents</span>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Portal */}
      <div className="flex-1 flex flex-col glass rounded-[44px] shadow-2xl border border-white/40 overflow-hidden relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-14 space-y-14 scrollbar-hide relative z-10">
          {error && (
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-[32px] flex items-center gap-5 animate-in slide-in-from-top-6">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <p className="text-xs font-black text-amber-900 uppercase tracking-widest">{error.message}</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-10 duration-700`}>
              <div className={`max-w-[85%] md:max-w-[70%] p-10 rounded-[48px] shadow-sm border group transition-all relative ${
                msg.role === 'user' ? 'bg-slate-900 text-white border-slate-800 rounded-br-none shadow-blue-900/10' : 'bg-white text-slate-800 border-slate-50 rounded-bl-none'
              }`}>
                {msg.engine === 'bhashini' && (
                  <div className="absolute -top-3 -left-3 bg-indigo-600 text-white text-[8px] px-4 py-1.5 rounded-full font-black tracking-[2px] border-4 border-white shadow-xl">BHASHINI V2</div>
                )}
                {msg.image && (
                  <div className="mb-8 relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
                    <img src={msg.image} className="w-full h-auto max-h-64 object-cover" alt="Citizen Document" />
                    <div className="absolute top-4 left-4 bg-white/90 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                       Vision Matrix Active
                    </div>
                  </div>
                )}
                <p className="text-[17px] font-semibold leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                
                {/* Visual Grounding Chips */}
                {msg.grounding && msg.grounding.length > 0 && (
                  <div className="mt-8 space-y-4 animate-in fade-in zoom-in-95">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Verified Digital Assets</p>
                    <div className="flex flex-wrap gap-3">
                      {msg.grounding.map((chunk, idx) => {
                        const link = chunk.web?.uri || chunk.maps?.uri;
                        const title = chunk.web?.title || chunk.maps?.title || "Enrollment Center";
                        if (!link) return null;
                        return (
                          <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 px-5 py-3 rounded-2xl text-[11px] font-bold text-blue-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                            {title}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className={`mt-8 flex items-center justify-between border-t pt-5 ${msg.role === 'user' ? 'border-white/10' : 'border-slate-50'}`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'opacity-40' : 'opacity-20'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.role === 'assistant' && msg.text && (
                    <button onClick={() => handleSpeak(msg)} className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${playingId === msg.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white'}`}>
                      {playingId === msg.id ? (
                        <>
                          <div className="flex gap-1 items-center"><div className="w-1 h-3 bg-white rounded-full animate-pulse"></div><div className="w-1 h-5 bg-white rounded-full animate-pulse" style={{animationDelay:'0.1s'}}></div><div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{animationDelay:'0.2s'}}></div></div>
                          Playing Audio
                        </>
                      ) : "Listen Voice"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isProcessing && !messages[messages.length-1].text && (
            <div className="flex justify-start">
               <div className="bg-white/40 px-10 py-6 rounded-[40px] border border-white/50 flex gap-4 items-center shadow-sm">
                  <div className="flex gap-2">
                    {[1,2,3].map(i => <div key={i} className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: `${i*0.15}s`}}></div>)}
                  </div>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[4px] ml-4">Engines Synchronizing</span>
               </div>
            </div>
          )}
        </div>

        {/* Input Control Dock */}
        <div className="p-8 md:p-16 bg-white/80 backdrop-blur-3xl border-t border-white/40">
          {pendingImage && (
            <div className="mb-10 flex gap-6 animate-in slide-in-from-bottom-8">
              <div className="relative group">
                <img src={pendingImage} className="w-28 h-28 rounded-[32px] object-cover border-4 border-white shadow-2xl transition-transform group-hover:rotate-3" />
                <button onClick={() => setPendingImage(null)} className="absolute -top-3 -right-3 bg-red-500 text-white p-2.5 rounded-full shadow-xl hover:bg-red-600 transition-all border-2 border-white"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path d="M6 18L18 6M6 6l12 12"/></svg></button>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                 <h4 className="text-sm font-black text-slate-900 uppercase tracking-[2px]">Aadhaar Document Loaded</h4>
                 <p className="text-xs font-bold text-slate-400 mt-2 leading-relaxed">Mitra will perform a Vision-based check of the demographic data and authenticity markers.</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-6 max-w-6xl mx-auto">
            <div className="flex-1 relative group">
              <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={isRecording ? "Listening to your voice..." : "Describe your Aadhaar query..."} className="w-full bg-white border-2 border-transparent rounded-[44px] px-14 py-8 text-[18px] font-bold focus:border-blue-500/20 focus:shadow-[0_0_100px_rgba(37,99,235,0.1)] outline-none transition-all shadow-2xl shadow-slate-300/40" disabled={isProcessing && !isRecording} />
              <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-6">
                <VoiceVisualizer isRecording={isRecording} />
              </div>
            </div>
            
            <div className="flex gap-4">
               <button onClick={toggleRecording} className={`w-24 h-24 rounded-[38px] flex items-center justify-center transition-all shadow-2xl active:scale-95 ${isRecording ? 'bg-red-500 text-white ring-8 ring-red-500/10' : 'bg-slate-900 text-white hover:bg-blue-600 shadow-slate-300'}`}>
                {isRecording ? <div className="flex gap-2 items-end h-8">{[1,2,3,4].map(i => <div key={i} className="w-2 bg-white rounded-full animate-pulse" style={{height:`${30 + i*15}%`}}></div>)}</div> : <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>}
              </button>
              {(inputText || pendingImage) && !isProcessing && (
                <button onClick={() => handleSendMessage()} className="w-24 h-24 bg-blue-600 text-white rounded-[38px] flex items-center justify-center shadow-2xl shadow-blue-500/40 hover:bg-blue-700 hover:-translate-y-1.5 transition-all active:scale-90"><svg className="w-9 h-9 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenHub;
