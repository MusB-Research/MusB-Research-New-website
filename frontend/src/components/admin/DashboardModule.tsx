import React, { useState, useEffect } from 'react';
import { 
  Rocket, Users, Activity, Clock, 
  ArrowUpRight, Target, Shield, 
  Plus, Calendar, HeartPulse
} from 'lucide-react';
import { motion } from 'framer-motion';
import { authFetch } from '../../utils/auth';

interface DashboardModuleProps {
  studyCount: number;
}

export default function DashboardModule({ studyCount }: DashboardModuleProps) {
  const [studies, setStudies] = useState<any[]>([]);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchStudies = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/studies/`);
      if (res.ok) {
        const data = await res.json();
        setStudies(data);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  };

  useEffect(() => {
    fetchStudies();
  }, []);

  const stats = [
    { label: 'Active Studies', value: (studies || []).filter(s => s.status === 'ACTIVE' || s.status === 'RECRUITING').length, icon: Activity, color: '#14b8a6' },
    { label: 'Total Enrollment', value: '1,240', icon: Users, color: '#f43f5e' },
    { label: 'Retention Rate', value: '94.2%', icon: Target, color: '#a855f7' },
    { label: 'System Health', value: 'Optimal', icon: Shield, color: '#3b82f6' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Platform Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0B101B] bg-slate-800" />
              ))}
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">8 System Admins Active</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
            Live System Overview
            <span className="text-[10px] font-bold text-slate-500 px-3 py-1 bg-white/5 rounded-full uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Session: 04h 12m
            </span>
          </h1>
        </div>
        
        <button className="px-10 py-5 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:scale-105 transition-all">
          <Rocket className="w-5 h-5" /> Launch Study
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="relative overflow-hidden bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] group hover:bg-white/[0.04] transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight className="w-5 h-5 text-white/20" />
            </div>
            
            <div className="flex flex-col h-full">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-2xl transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
              >
                <stat.icon className="w-7 h-7" />
              </div>
              
              <div className="mt-auto">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 font-mono">{stat.label}</p>
                <p className="text-4xl font-black text-white tracking-tight italic">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-4 italic font-black">
              <HeartPulse className="w-6 h-6 text-pink-500" />
              Active Clinical Trials
            </h2>
            <button className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">View Deployment Map</button>
          </div>
          
          <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 backdrop-blur-3xl shadow-2xl space-y-8">
            {studies.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-6">
               <Activity className="w-16 h-16 opacity-20" />
               <p className="font-black uppercase tracking-widest italic text-sm">Synchronizing live protocol data...</p>
             </div>
            ) : (
              <div className="space-y-6">
                {studies.slice(0, 3).map((study: any) => (
                  <div key={study.id} className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                        <Calendar className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <h4 className="text-white font-black uppercase tracking-widest group-hover:text-pink-400 transition-colors">{study.title}</h4>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest italic mt-1">{study.protocol_id}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                      study.status === 'ACTIVE' || study.status === 'RECRUITING' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-slate-400 border-white/5'
                    }`}>
                      {study.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
           <div className="flex items-center justify-between px-4">
            <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-4 italic font-black text-pink-500">
               Audit
            </h2>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-[3.5rem] p-10 backdrop-blur-4xl shadow-2xl h-[500px] flex flex-col items-center justify-center text-center">
             <div className="w-20 h-20 rounded-3xl bg-pink-500/10 flex items-center justify-center mb-8 border border-pink-500/20 shadow-[0_0_30px_rgba(236,72,153,0.1)]">
                <Target className="w-10 h-10 text-pink-500" />
             </div>
             <h3 className="text-white font-black text-2xl uppercase tracking-[0.1em] italic">Compliance Center</h3>
             <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest mt-4 leading-loose">
               Immutable blockchain-verified <br />
               audit logs are synchronized <br />
               every 15 minutes.
             </p>
             <button className="mt-10 px-8 py-4 bg-white/5 border border-white/10 hover:border-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105">
                Verify Chain
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
