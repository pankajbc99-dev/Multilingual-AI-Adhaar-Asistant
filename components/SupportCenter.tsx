
import React, { useState, useRef } from 'react';
import { MOCK_LOGS } from '../constants';
import { gemini } from '../services/GeminiService';

const SupportCenter: React.FC = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const speakLogResponse = async (logId: string, text: string) => {
    if (playingId === logId) { currentSourceRef.current?.stop(); setPlayingId(null); return; }
    if (currentSourceRef.current) { try { currentSourceRef.current.stop(); } catch (e) {} }
    setLoadingId(logId);
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      const rawAudio = await gemini.textToSpeech(text);
      const audioBuffer = await gemini.decodePCM(rawAudio, ctx);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      currentSourceRef.current = source;
      setPlayingId(logId);
      setLoadingId(null);
      source.onended = () => { if (playingId === logId) setPlayingId(null); };
      source.start();
    } catch (error) { setLoadingId(null); setPlayingId(null); }
  };

  return (
    <div className="h-full flex flex-col gap-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Live Operations</h2>
          <p className="text-slate-500 font-bold mt-1">Global monitoring of citizen-agent interactions.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          {[
            { label: 'Flagged', value: '12', color: 'red' },
            { label: 'Sessions', value: '842', color: 'blue' },
            { label: 'Uptime', value: '99.9%', color: 'green' }
          ].map((stat, i) => (
            <div key={i} className="flex-1 md:flex-none bg-white px-8 py-4 rounded-3xl border border-slate-200 shadow-sm text-center">
              <span className={`block text-[10px] text-${stat.color}-600 font-black uppercase tracking-widest mb-1`}>{stat.label}</span>
              <span className="text-2xl font-black text-slate-900">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
        {/* Activity Stream */}
        <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto scrollbar-hide pr-2">
          {MOCK_LOGS.map(log => (
            <div key={log.id} className="bg-white rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all p-8 flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`w-2 h-2 rounded-full ${log.status === 'flagged' ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.timestamp} • User: {log.userId}</span>
                </div>
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] block mb-2">Query</span>
                    <p className="text-sm font-black text-slate-900 leading-relaxed">"{log.query}"</p>
                  </div>
                  <div className="bg-blue-50/30 p-6 rounded-3xl border border-blue-100/50 relative">
                     <span className="text-[9px] font-black text-blue-400 uppercase tracking-[2px] block mb-2">Automated Response ({log.language})</span>
                    <p className="text-sm font-bold text-slate-700 italic leading-relaxed">"{log.response}"</p>
                  </div>
                </div>
              </div>
              
              <div className="md:w-48 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <button 
                    onClick={() => speakLogResponse(log.id, log.response)}
                    disabled={loadingId === log.id}
                    className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all shadow-lg ${
                      playingId === log.id 
                        ? 'bg-blue-600 text-white shadow-blue-200' 
                        : 'bg-white border border-slate-200 text-blue-600 hover:bg-slate-50'
                    }`}
                  >
                    {loadingId === log.id ? 'Processing...' : playingId === log.id ? 'Stop Playing' : 'Voice Audit'}
                  </button>
                  <button className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-wider bg-slate-900 text-white hover:bg-blue-700 transition-all shadow-xl shadow-slate-200">
                    Take Control
                  </button>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Sentiment</span>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[78%]"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Metrics Sidebar */}
        <div className="hidden lg:flex flex-col gap-8">
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex-1 flex flex-col">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Trending Topics</h3>
            <div className="space-y-6 flex-1">
              {[
                { topic: 'Biometric Updates', count: '42%', color: 'blue' },
                { topic: 'Blue Aadhaar', count: '28%', color: 'indigo' },
                { topic: 'Mobile Linking', count: '15%', color: 'orange' },
                { topic: 'E-KYC Queries', count: '10%', color: 'green' }
              ].map((trend, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-slate-700">{trend.topic}</span>
                    <span className={`text-${trend.color}-600`}>{trend.count}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full">
                    <div className={`h-full bg-${trend.color}-500 rounded-full`} style={{ width: trend.count }}></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl text-white shadow-xl shadow-blue-200">
               <span className="text-[10px] font-black uppercase tracking-widest opacity-60">System Health</span>
               <div className="flex items-end gap-1 mt-2 mb-4 h-12">
                  {[4,7,3,8,9,5,6,8,10,7,5].map((h, i) => <div key={i} className="flex-1 bg-white/30 rounded-t-sm animate-pulse" style={{ height: `${h*10}%`, animationDelay: `${i*0.1}s` }}></div>)}
               </div>
               <p className="text-xs font-bold">Latency: 28ms Avg</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportCenter;
