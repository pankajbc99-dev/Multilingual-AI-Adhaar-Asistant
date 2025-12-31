
import React from 'react';
import { AppRole } from '../types';

interface HeaderProps {
  activeRole: AppRole;
  onRoleChange: (role: AppRole) => void;
}

const Header: React.FC<HeaderProps> = ({ activeRole, onRoleChange }) => {
  const roles = [
    { id: AppRole.DASHBOARD, label: 'Portal', icon: <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
    { id: AppRole.CITIZEN, label: 'Concierge', icon: <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /> },
    { id: AppRole.OFFICIAL, label: 'Official', icon: <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> },
    { id: AppRole.AGENT, label: 'Ops', icon: <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
  ];

  return (
    <header className="bg-white/70 backdrop-blur-3xl border-b border-slate-200/50 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-10 h-20 flex justify-between items-center">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => onRoleChange(AppRole.DASHBOARD)}>
          <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[14px] flex items-center justify-center text-white font-black text-xl shadow-2xl shadow-blue-500/20 group-hover:rotate-6 transition-all">
            M
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-none tracking-tight">Mitra AI</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[2px] mt-1.5">Aadhaar Unified Portal</p>
          </div>
        </div>

        <nav className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/40">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => onRoleChange(role.id)}
              className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-500 ${
                activeRole === role.id
                  ? 'bg-white text-blue-600 shadow-xl shadow-slate-200 border border-slate-200 scale-105'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                {role.icon}
              </svg>
              <span className="hidden md:inline uppercase tracking-widest">{role.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-5">
           <div className="hidden lg:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-800">Gov. Node 42-A</span>
              <span className="text-[9px] font-bold text-green-500">Live Syncing</span>
           </div>
           <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 cursor-pointer transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
