import React, { useState } from 'react';
import { 
  Users, UserPlus, Shield, Mail, 
  MapPin, Clock, Search, Filter, 
  MoreVertical, CheckCircle2, Lock
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function TeamModule() {
  const [searchTerm, setSearchTerm] = useState('');

  const team = [
    { name: 'Brijesh Raj', role: 'Super Admin', email: 'admin@musb.com', status: 'Active', lastLogin: '2h ago', location: 'Tampa, US' },
    { name: 'Dr. Michael Chen', role: 'PI', email: 'm.chen@hospital.org', status: 'Active', lastLogin: '45m ago', location: 'Miami, US' },
    { name: 'Sarah Wilson', role: 'Coordinator', email: 's.wilson@research.net', status: 'Away', lastLogin: '5h ago', location: 'Orlando, US' },
    { name: 'James Thompson', role: 'Sponsor', email: 'j.thompson@pharma.corp', status: 'Active', lastLogin: '12m ago', location: 'New York, US' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Platform Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
              <Users className="w-6 h-6 text-cyan-500" />
            </div>
            <span className="text-[11px] font-black text-cyan-500 uppercase tracking-[0.4em] italic font-black">Authorized Personnel</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic tracking-widest">Medical Team</h1>
          <p className="text-slate-500 font-bold mt-2 text-lg">Manage cross-functional access for PIs, Coordinators, and Sponsors.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-2 italic">
             <Lock className="w-4 h-4" /> Permission Audit
          </button>
          <button className="px-10 py-5 bg-cyan-500 text-[#0a0b1a] rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 shadow-2xl shadow-cyan-500/30 hover:scale-105 transition-all italic">
            <UserPlus className="w-5 h-5" /> Onboard Staff
          </button>
        </div>
      </div>

      {/* Stats and Filter */}
      <div className="flex flex-col xl:flex-row gap-8 items-center justify-between">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full xl:w-auto">
          {[
            { name: 'Admin', users: 2, icon: Shield },
            { name: 'Coordinator', users: 8, icon: Users },
            { name: 'CRA / Sponsor', users: 4, icon: Mail },
            { name: 'Medical Monitor', users: 1, icon: CheckCircle2 },
          ].map((cat, i) => (
            <div key={i} className="px-8 py-5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-white/20 transition-all flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <cat.icon className="w-4 h-4 text-slate-500" />
              </div>
              <div className="whitespace-nowrap">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{cat.name}</p>
                <p className="text-lg font-black text-white">{cat.users}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 w-full xl:w-auto">
          <div className="relative group w-full xl:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-cyan-500 transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH TEAM..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-16 pr-8 py-5 text-white font-bold outline-none focus:border-cyan-500/50 transition-all text-[11px] uppercase tracking-[0.2em] placeholder:text-slate-800"
            />
          </div>
          <button className="p-5 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all"><Filter className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {team.map((user, i) => (
          <div key={i} className="group relative bg-[#0a0b1a]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 hover:border-cyan-500/30 transition-all shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
               <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-500 opacity-0 group-hover:opacity-100 transition-all hover:text-white">
                 <MoreVertical className="w-4 h-4" />
               </button>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="relative mb-10">
                <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-slate-800 to-slate-950 border-4 border-white/5 flex items-center justify-center font-black text-4xl text-white shadow-2xl group-hover:scale-105 transition-all">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl border-4 border-[#0a0b1a] flex items-center justify-center ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'} shadow-lg`}>
                   <div className="w-2 h-2 rounded-full bg-white opacity-40" />
                </div>
              </div>

              <h3 className="text-xl font-black text-white uppercase tracking-widest">{user.name}</h3>
              <p className={`mt-3 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                user.role === 'Super Admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-white/5 text-slate-500 border-white/5'
              }`}>
                {user.role}
              </p>

              <div className="mt-10 w-full space-y-4 text-left">
                <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl group/link hover:bg-white/5 transition-all">
                   <Mail className="w-4 h-4 text-slate-600 group-hover/link:text-cyan-400" />
                   <span className="text-[10px] font-bold text-slate-400 tracking-widest truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                   <MapPin className="w-4 h-4 text-slate-600" />
                   <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{user.location}</span>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-white/5 w-full flex items-center justify-between">
                <div className="text-left">
                   <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Last Logged</p>
                   <p className="text-[10px] font-bold text-white uppercase tracking-[0.1em] mt-1 italic"><Clock className="w-3 h-3 inline mr-1 opacity-40" /> {user.lastLogin}</p>
                </div>
                <button className="px-6 py-3 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform italic">Manage</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
