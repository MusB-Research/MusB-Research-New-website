import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, User, Globe, Target, Clock, Smartphone, Monitor } from 'lucide-react';

interface ActiveUser {
  id: string;
  name: string;
  role: string;
  currentPath: string;
  sessionDuration: string;
  device: 'Mobile' | 'Desktop';
  location: string;
}

export default function LiveActiveUsers() {
  const [users, setUsers] = useState<ActiveUser[]>([
    { id: '1', name: 'Brijesh Raj', role: 'SUPER_ADMIN', currentPath: '/super-admin', sessionDuration: '2h 15m', device: 'Desktop', location: 'Tampa, FL' },
    { id: '2', name: 'PI Michael Chen', role: 'PI', currentPath: '/pi-dashboard', sessionDuration: '45m', device: 'Desktop', location: 'Miami, FL' },
    { id: '3', name: 'Sarah Alvarez', role: 'COORDINATOR', currentPath: '/trials', sessionDuration: '12m', device: 'Mobile', location: 'Orlando, FL' },
    { id: '4', name: 'John Anderson', role: 'PARTICIPANT', currentPath: '/home', sessionDuration: '5m', device: 'Mobile', location: 'Tampa, FL' },
  ]);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Small randomized shifts to "sim" live data if needed
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] italic">Stream Live</span>
           </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">Live Active <span className="text-[#f59e0b]">Users</span></h1>
          <p className="text-[10px] sm:text-xs text-[#8b8fa8] uppercase tracking-widest mt-2">Real-time session occupancy and global activity stream</p>
        </div>
        <div className="px-6 py-3 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-2xl flex items-center gap-4">
           <div className="text-right">
             <p className="text-[8px] font-black text-[#f59e0b] uppercase tracking-widest">Active Now</p>
             <p className="text-xl font-black text-white italic tracking-tighter">{users.length} GLOBAL</p>
           </div>
           <Activity className="w-6 h-6 text-[#f59e0b]" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <AnimatePresence mode='popLayout'>
            {users.map((user) => (
               <motion.div 
                 key={user.id}
                 layout
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="bg-[#0f1133] border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-[#f59e0b]/30 transition-all shadow-2xl"
               >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full group-hover:bg-amber-500/10 transition-colors"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                     <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white italic font-black shadow-inner">
                        {user.name.split(' ').map(n=>n[0]).join('')}
                     </div>
                     <span className="text-[8px] font-black px-2 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 tracking-widest uppercase">{user.role}</span>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-lg font-black text-white italic uppercase truncate tracking-tight">{user.name}</h4>
                     
                     <div className="space-y-3 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-3 text-slate-500 group-hover:text-slate-300 transition-colors">
                           <Target className="w-3 h-3" />
                           <span className="text-[9px] font-black uppercase tracking-widest truncate">{user.currentPath}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3 text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span className="text-[9px] font-black uppercase tracking-widest">{user.sessionDuration}</span>
                           </div>
                           <div className="flex items-center gap-3 text-slate-500">
                              {user.device === 'Mobile' ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                              <span className="text-[9px] font-black uppercase tracking-widest">{user.device}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                           <Globe className="w-3 h-3" />
                           <span className="text-[9px] font-black uppercase tracking-widest italic">{user.location}</span>
                        </div>
                     </div>
                  </div>

                  <div className="mt-6 pt-4 flex justify-end">
                     <button className="text-[8px] font-black text-slate-700 hover:text-white uppercase tracking-[0.3em] transition-all italic">Intercept Node</button>
                  </div>
               </motion.div>
            ))}
         </AnimatePresence>
      </div>

      {/* Grid of occupancy */}
      <div className="bg-[#0f1133] border border-white/5 rounded-[3rem] p-10 h-64 relative overflow-hidden hidden lg:block">
         <div className="flex justify-between items-center mb-8">
            <h3 className="text-[10px] font-black text-white uppercase italic tracking-widest">Platform Load & Concurrency</h3>
            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.4em]">Capacity 0.4%</span>
         </div>
         <div className="grid grid-cols-24 gap-3 h-20">
            {Array.from({length: 48}).map((_, i) => (
               <div key={i} className={`rounded-sm transition-all duration-1000 ${i < users.length ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/5'}`}></div>
            ))}
         </div>
         <p className="mt-8 text-[9px] font-black text-slate-700 uppercase tracking-widest text-center">Node Cluster Status: OPTIMAL — Latency: 12ms</p>
      </div>
    </div>
  );
}
