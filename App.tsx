
import React, { useState } from 'react';
import { AppRole } from './types';
import Header from './components/Header';
import CitizenHub from './components/CitizenHub';
import PolicyManager from './components/PolicyManager';
import SupportCenter from './components/SupportCenter';

const App: React.FC = () => {
  const [activeRole, setActiveRole] = useState<AppRole>(AppRole.DASHBOARD);

  const renderContent = () => {
    switch (activeRole) {
      case AppRole.CITIZEN: return <CitizenHub />;
      case AppRole.OFFICIAL: return <PolicyManager />;
      case AppRole.AGENT: return <SupportCenter />;
      case AppRole.DASHBOARD: return (
        <div className="h-full flex flex-col justify-center max-w-4xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-700">
           <div className="text-center space-y-4">
             <h2 className="text-6xl font-black text-slate-900 tracking-tighter">Unified Aadhaar <span className="text-blue-600">Intelligence</span></h2>
             <p className="text-lg font-bold text-slate-500">Multi-engine portal for citizens, officials, and support teams.</p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-8">
             {[
               { id: AppRole.CITIZEN, title: 'Citizen Hub', desc: 'AI Concierge for document updates and queries.', color: 'blue' },
               { id: AppRole.OFFICIAL, title: 'Policy Engine', desc: 'Publish and simplify regulatory documents.', color: 'indigo' },
               { id: AppRole.AGENT, title: 'Support Ops', desc: 'Real-time monitoring and intervention logs.', color: 'slate' }
             ].map(card => (
               <button 
                 key={card.id}
                 onClick={() => setActiveRole(card.id)}
                 className={`group p-8 bg-white rounded-[40px] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-${card.color}-200 transition-all text-left flex flex-col justify-between h-64`}
               >
                 <div>
                    <div className={`w-12 h-12 bg-${card.color}-50 text-${card.color}-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">{card.title}</h3>
                    <p className="text-xs font-bold text-slate-400 leading-relaxed">{card.desc}</p>
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">
                    Launch Module <svg className="w-4 h-4 translate-x-[-4px] group-hover:translate-x-0 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7" strokeWidth={3}/></svg>
                 </div>
               </button>
             ))}
           </div>
        </div>
      );
      default: return <CitizenHub />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden font-['Plus_Jakarta_Sans']">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/5 rounded-full blur-[120px] pointer-events-none"></div>

      <Header activeRole={activeRole} onRoleChange={setActiveRole} />
      
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 lg:p-10 overflow-hidden">
        <div className="h-full w-full">
          {renderContent()}
        </div>
      </main>

      <footer className="h-10 border-t border-slate-200/50 flex items-center justify-between px-10 text-[9px] font-black text-slate-400 uppercase tracking-[2px] bg-white/30 backdrop-blur-md">
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Gemini API Online</span>
          <span>Bhashini Core Active</span>
        </div>
        <div>v3.0.0 Stable | Versatile Release</div>
      </footer>
    </div>
  );
};

export default App;
