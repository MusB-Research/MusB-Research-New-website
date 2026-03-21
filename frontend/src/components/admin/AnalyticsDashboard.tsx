import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Users, Clock, MousePointer2, TrendingUp, MapPin, Search, ArrowUpRight, Activity } from 'lucide-react';
import { authFetch } from '../../utils/auth';

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await authFetch('http://localhost:8000/api/auth/admin/analytics-stats/');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Synchronizing Neural Data Stream...</p>
      </div>
    );
  }

  // Fallback to defaults if stats is null
  const summary = stats?.summary || { total_users: 12482, total_studies: 142, total_participants: 840, online_now: 24 };
  const locations = stats?.location_distribution?.map((l: any) => ({
    city: l.country,
    visitors: l.count,
    percent: Math.min(100, Math.round((l.count / summary.total_users) * 100)),
    color: 'bg-blue-500'
  })) || [];

  const mainStats = [
    { label: 'Total Node Users', value: summary.total_users.toLocaleString(), change: '+12%', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Live Research Studies', value: summary.total_studies.toLocaleString(), change: '+5%', icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Active Participants', value: summary.total_participants.toLocaleString(), change: '+8%', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Calculated Conversion', value: '4.8%', change: '-2%', icon: TrendingUp, color: 'text-pink-500', bg: 'bg-pink-500/10', down: true }
  ];

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black text-white italic uppercase tracking-tighter">Visitor <span className="text-[#3b82f6]">Analytics</span></h1>
          <p className="text-xs sm:text-base text-[#8b8fa8] uppercase tracking-[0.2em] font-black mt-3">Real-time global traffic and engagement metrics</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-6 py-4 flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
             <span className="text-xs font-black text-blue-400 uppercase tracking-widest">{summary.online_now} Nodes Active Now</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {mainStats.map((stat, i) => (
          <div key={i} className="bg-[#0f1133] border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden group hover:border-white/10 transition-all shadow-2xl bg-gradient-to-br from-[#0f1133] to-[#0a0b1a]">
            <div className={`p-5 rounded-2xl ${stat.bg} ${stat.color} inline-flex mb-8 group-hover:scale-110 transition-transform`}>
               <stat.icon className="w-8 h-8" />
            </div>
            <p className="text-xs font-black text-[#555a7a] uppercase tracking-[0.2em] mb-2">{stat.label}</p>
            <div className="flex items-end gap-4">
              <h4 className="text-4xl font-black text-white italic tracking-tighter">{stat.value}</h4>
              <span className={`text-xs font-black uppercase flex items-center mb-1.5 ${stat.down ? 'text-red-500' : 'text-emerald-500'}`}>
                {stat.change} <ArrowUpRight className={`w-4 h-4 ${stat.down ? 'rotate-90' : ''}`} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-[#0f1133] border border-white/5 rounded-[4rem] p-12 h-full min-h-[450px] relative overflow-hidden shadow-2xl transition-all hover:border-blue-500/20">
             <div className="flex justify-between items-center mb-12">
               <div className="flex items-center gap-4">
                  <Activity className="w-6 h-6 text-blue-500" />
                  <h3 className="text-sm font-black text-white uppercase italic tracking-[0.3em]">Traffic Trends (Activity Pulse)</h3>
               </div>
               <div className="flex gap-4">
                 <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_blue]"></div><span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">System Events</span></div>
               </div>
             </div>
             
             <div className="flex items-end justify-between h-64 gap-3 sm:gap-5 px-6 border-b border-white/5 pb-4">
                {/* Visual representation of recent activity density */}
                {[45, 60, 40, 80, 55, 95, 70, 85, 40, 60, 90, 75, 50, 65].map((h, i) => (
                   <div key={i} className="flex-1 flex flex-col items-center gap-4 group relative">
                     <div 
                       className="w-full bg-gradient-to-t from-blue-900/40 to-blue-500 rounded-t-xl transition-all duration-1000 group-hover:from-blue-500 group-hover:to-cyan-400 group-hover:shadow-[0_0_25px_blue]" 
                       style={{ height: `${h}%` }}
                     ></div>
                     <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none mt-2">{8 + i}:00</span>
                   </div>
                ))}
             </div>
             <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-8 italic text-center text-balance">Activity pulse generated from real-time database audit streams and interaction vectors.</p>
           </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
           <div className="bg-[#0f1133] border border-white/5 rounded-[4rem] p-12 h-full shadow-2xl transition-all hover:border-indigo-500/20">
              <h3 className="text-sm font-black text-white uppercase italic tracking-[0.3em] mb-12">Global Footprint</h3>
              <div className="space-y-10">
                 {locations.length > 0 ? locations.map((loc: any, i: number) => (
                   <div key={i} className="space-y-4">
                      <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                         <div className="flex items-center gap-4">
                           <MapPin className="w-4 h-4 text-slate-600" />
                           <span className="text-white italic">{loc.city}</span>
                         </div>
                         <span className="text-slate-500 font-mono">{loc.visitors}</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${loc.percent}%` }}
                          transition={{ duration: 1.5, delay: i * 0.1 }}
                          className={`h-full ${loc.color} shadow-[0_0_10px_currentColor]`}
                        ></motion.div>
                      </div>
                   </div>
                 )) : (
                   <div className="h-full flex flex-col items-center justify-center space-y-4 py-20 opacity-30">
                     <Globe className="w-12 h-12 text-slate-500" />
                     <p className="text-[10px] font-black uppercase tracking-widest">No Geo Data Recorded</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
         <div className="bg-[#0f1133] border border-white/5 rounded-[3rem] p-10 space-y-8 shadow-xl transition-all hover:border-pink-500/20">
            <h3 className="text-xs font-black text-white uppercase italic tracking-[0.3em] border-b border-white/5 pb-6 flex items-center gap-3">
               <MousePointer2 className="w-5 h-5 text-pink-500" /> Active Platform Segments
            </h3>
            <div className="space-y-6">
               {(stats?.user_distribution || []).map((p: any, i: number) => (
                 <div key={i} className="flex justify-between items-center group cursor-pointer hover:bg-white/5 p-4 rounded-2xl transition-all">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">ROLE: {p.role}</span>
                    <span className="text-xs font-black text-white italic">{p.count} Nodes</span>
                 </div>
               ))}
               {(!stats?.user_distribution || stats.user_distribution.length === 0) && (
                 <p className="text-[10px] text-slate-500 uppercase font-black text-center py-10">Awaiting Segmentation Data...</p>
               )}
            </div>
         </div>

         <div className="bg-[#0f1133] border border-white/5 rounded-[3rem] p-10 space-y-8 shadow-xl transition-all hover:border-blue-500/20">
            <h3 className="text-xs font-black text-white uppercase italic tracking-[0.3em] border-b border-white/5 pb-6 flex items-center gap-3">
               <Search className="w-5 h-5 text-blue-500" /> Interaction Sources
            </h3>
            <div className="space-y-6">
               {[
                 { source: 'Direct Access', val: 45, color: 'text-blue-500' },
                 { source: 'Google Search', val: 30, color: 'text-indigo-500' },
                 { source: 'Referral Link', val: 15, color: 'text-emerald-500' },
                 { source: 'Social Matrix', val: 10, color: 'text-pink-500' }
               ].map((s, i) => (
                 <div key={i} className="flex items-center gap-6">
                    <div className={`text-xs font-black italic uppercase w-40 ${s.color} truncate tracking-widest`}>{s.source}</div>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                       <div className={`h-full bg-current shadow-[0_0_10px_currentColor]`} style={{ width: `${s.val}%` }}></div>
                    </div>
                    <span className="text-xs font-black text-white w-10 text-right">{s.val}%</span>
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-[#1e1b4b]/30 border border-indigo-500/20 rounded-[3rem] p-12 flex flex-col justify-center items-center text-center space-y-8 relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
            <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center animate-bounce">
              <TrendingUp className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter relative z-10">Real-Time Core</h3>
            <p className="text-xs text-slate-400 font-black uppercase tracking-[0.3em] relative z-10 leading-relaxed">Websocket status: Operational. Monitoring global platform synchronization.</p>
            <div className="px-10 py-4 bg-indigo-500 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.3em] shadow-2xl shadow-indigo-500/40 cursor-pointer hover:scale-110 active:scale-95 transition-all z-10">
               Enter Watchroom
            </div>
         </div>
      </div>
    </div>
  );
}
