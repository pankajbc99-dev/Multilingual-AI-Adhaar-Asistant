
import React, { useState, useEffect } from 'react';
import { Policy, INDIAN_LANGUAGES, BhashiniConfig } from '../types';
import { INITIAL_POLICIES } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";
import { bhashini } from '../services/BhashiniService';

// Fix: Directly use process.env.API_KEY for SDK initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const PolicyManager: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>(INITIAL_POLICIES);
  const [isAdding, setIsAdding] = useState(false);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [viewingSimplified, setViewingSimplified] = useState<string | null>(null);
  const [newPolicy, setNewPolicy] = useState({ title: '', category: '', text: '' });
  const [progress, setProgress] = useState(0);

  const [bConfig, setBConfig] = useState<BhashiniConfig>({
    userId: '', apiKey: '', pipelineId: '', active: false
  });

  useEffect(() => { bhashini.setConfig(bConfig); }, [bConfig]);

  useEffect(() => {
    let interval: any;
    if (isSimplifying) interval = setInterval(() => { setProgress(p => (p < 95 ? p + 2 : p)); }, 300);
    else setProgress(0);
    return () => clearInterval(interval);
  }, [isSimplifying]);

  const handleAddPolicy = async () => {
    if (!newPolicy.title || !newPolicy.text) return;
    setIsSimplifying(true);
    try {
      const targetLanguages = ['hi', 'ta', 'te', 'bn', 'en'];
      const simpleEnglishRes = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Simplify this complex government policy for a rural citizen: "${newPolicy.text}"`,
        config: { systemInstruction: "Output only the simplified English text." }
      });
      const simpleEnglish = simpleEnglishRes.text || newPolicy.text;
      let simplifiedVersions: Record<string, string> = { en: simpleEnglish };
      if (bConfig.active && bConfig.apiKey) {
        for (const lang of targetLanguages) { if (lang !== 'en') simplifiedVersions[lang] = await bhashini.translate(simpleEnglish, 'en', lang); }
      } else {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Translate this simple text into: ${targetLanguages.join(', ')}. Text: "${simpleEnglish}"`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: targetLanguages.reduce((acc, code) => { acc[code] = { type: Type.STRING }; return acc; }, {} as any),
              required: targetLanguages,
            },
          },
        });
        simplifiedVersions = JSON.parse(response.text || '{}');
      }
      const policy: Policy = { id: Date.now().toString(), title: newPolicy.title, category: newPolicy.category || 'Regulatory', originalText: newPolicy.text, publishedAt: new Date().toISOString().split('T')[0], simplifiedVersions, bhashiniEnabled: bConfig.active };
      setPolicies([policy, ...policies]);
      setNewPolicy({ title: '', category: '', text: '' });
      setIsAdding(false);
    } catch (error) { console.error(error); } 
    finally { setIsSimplifying(false); }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide pb-20">
      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Policy Command</h2>
              <p className="text-slate-500 font-bold mt-1">Transform bureaucratic data into citizen clarity.</p>
            </div>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-3 transform hover:-translate-y-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M12 4v16m8-8H4" /></svg>
                New Distribution
              </button>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'Active Policies', value: policies.length, color: 'blue' },
              { label: 'Total Simplified', value: '42', color: 'green' },
              { label: 'Coverage', value: '18 Lang', color: 'indigo' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1 block">{stat.label}</span>
                <span className={`text-3xl font-black text-${stat.color}-600`}>{stat.value}</span>
              </div>
            ))}
          </div>

          {isAdding && (
            <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -z-10"></div>
              <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <span className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></span>
                Policy Orchestration
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Policy ID/Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Mandatory Biometric Update 2024"
                      value={newPolicy.title}
                      onChange={e => setNewPolicy({...newPolicy, title: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Classification</label>
                    <select 
                      value={newPolicy.category}
                      onChange={e => setNewPolicy({...newPolicy, category: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold outline-none focus:border-blue-500 appearance-none transition-all"
                    >
                      <option value="">Select Category</option>
                      <option value="Identity">Identity</option>
                      <option value="Security">Security</option>
                      <option value="Financial">Financial</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Raw Regulatory Text</label>
                  <textarea
                    placeholder="Paste the original gazette or policy document here..."
                    rows={6}
                    value={newPolicy.text}
                    onChange={e => setNewPolicy({...newPolicy, text: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold outline-none focus:border-blue-500 transition-all resize-none"
                  />
                </div>
                
                {isSimplifying && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[11px] font-black text-blue-600 uppercase tracking-[3px]">
                      <span className="flex items-center gap-2"><svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Multiplexing Engines...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-6">
                  <button onClick={() => setIsAdding(false)} className="px-8 py-4 rounded-2xl font-black text-slate-400 hover:text-slate-600 uppercase text-xs tracking-widest">Abort Draft</button>
                  <button 
                    onClick={handleAddPolicy}
                    disabled={isSimplifying || !newPolicy.title}
                    className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-black transition-all disabled:opacity-50 text-xs uppercase tracking-[2px]"
                  >
                    Sync & Publish
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {policies.map(policy => (
              <div key={policy.id} className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                {policy.bhashiniEnabled && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] font-black px-5 py-2 rounded-bl-3xl shadow-lg flex items-center gap-2">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L9 10.586l3.293-3.293a1 1 0 111.414 1.414z" /></svg>
                    BHASHINI CERTIFIED
                  </div>
                )}
                <div className="flex items-center gap-4 mb-6">
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-4 py-1.5 rounded-full border border-blue-100 uppercase tracking-widest">{policy.category}</span>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ID: {policy.id} • {policy.publishedAt}</span>
                </div>
                <h4 className="text-3xl font-black text-slate-900 mb-6">{policy.title}</h4>
                <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 mb-8 relative">
                   <p className="text-sm text-slate-500 leading-relaxed italic line-clamp-2">"{policy.originalText}"</p>
                </div>
                <button 
                  onClick={() => setViewingSimplified(viewingSimplified === policy.id ? null : policy.id)}
                  className="flex items-center gap-3 text-xs font-black text-blue-600 hover:text-blue-800 transition-colors group/btn"
                >
                  <span className="bg-blue-100 p-2 rounded-xl group-hover/btn:bg-blue-600 group-hover/btn:text-white transition-all">
                    <svg className={`w-4 h-4 transition-transform ${viewingSimplified === policy.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M19 9l-7 7-7-7" /></svg>
                  </span>
                  {viewingSimplified === policy.id ? 'Collapse Logic' : 'Review Multilingual Matrix'}
                </button>

                {viewingSimplified === policy.id && (
                  <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-500">
                    {policy.simplifiedVersions ? Object.entries(policy.simplifiedVersions).map(([code, text]) => (
                      <div key={code} className="p-6 bg-slate-50 rounded-3xl border border-slate-200/50 hover:bg-white hover:shadow-lg transition-all">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-3 block">{INDIAN_LANGUAGES.find(l => l.code === code)?.name || code}</span>
                        <p className="text-[13px] text-slate-700 font-bold leading-relaxed">{text as string}</p>
                      </div>
                    )) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Status Dashboard Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 p-10 rounded-[44px] shadow-2xl sticky top-24 border border-white/5 overflow-hidden">
             <div className="absolute bottom-0 right-0 w-32 h-32 bg-green-500/10 rounded-tl-[100px] -z-0"></div>
            <h3 className="text-white text-2xl font-black mb-8 flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-green-500/20">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 10-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.243a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707zM16 18a1 1 0 100-2 1 1 0 000 2z" /></svg>
              </div>
              Core API
            </h3>
            
            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ULCA Pipeline</label>
                <input 
                  type="password" 
                  value={bConfig.apiKey}
                  onChange={e => setBConfig({...bConfig, apiKey: e.target.value})}
                  className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-bold outline-none focus:border-green-500 focus:bg-white/20 transition-all placeholder:text-white/20"
                  placeholder="••••••••••••"
                />
              </div>
              
              <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${bConfig.active ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-slate-700'}`}></div>
                  <span className="text-[11px] font-black text-white uppercase tracking-[2px]">Bhashini</span>
                </div>
                <button 
                  onClick={() => setBConfig({...bConfig, active: !bConfig.active})}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${bConfig.active ? 'bg-green-600 text-white shadow-lg' : 'bg-white/10 text-slate-400'}`}
                >
                  {bConfig.active ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            
            <div className="mt-10 pt-10 border-t border-white/10 text-center relative z-10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Network Integrity</p>
              <div className="flex justify-center gap-2">
                {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: `${i*0.2}s` }}></div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyManager;
