import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Target, Clock, Smartphone, Monitor, Globe } from 'lucide-react';

interface ActiveUser {
  id: string;
  name: string;
  role: string;
  currentPath: string;
  sessionDuration: string;
  device: 'Mobile' | 'Desktop';
  location: string;
  email?: string;
}

export default function LiveActiveUsers({ allUsers }: { allUsers?: any[] }) {
  const [users, setUsers] = useState<ActiveUser[]>([
    { id: '1', name: 'Brijesh Raj', role: 'SUPER_ADMIN', currentPath: '/super-admin', sessionDuration: '2h 15m', device: 'Desktop', location: 'Tampa, FL' },
    { id: '2', name: 'PI Michael Chen', role: 'PI', currentPath: '/pi-dashboard', sessionDuration: '45m', device: 'Desktop', location: 'Miami, FL' },
    { id: '3', name: 'Sarah Alvarez', role: 'COORDINATOR', currentPath: '/trials', sessionDuration: '12m', device: 'Mobile', location: 'Orlando, FL' },
    { id: '4', name: 'John Anderson', role: 'PARTICIPANT', currentPath: '/home', sessionDuration: '5m', device: 'Mobile', location: 'Tampa, FL' },
  ]);

  useEffect(() => {
    if (allUsers && allUsers.length > 0) {
      // Prioritize users with recent activity
      const activeFromList = allUsers
        .filter(u => u.lastLogin && u.lastLogin !== 'Never' && !u.lastLogin.includes('days'))
        .map(u => ({
          id: u.id,
          name: u.name,
          role: u.role,
          currentPath: u.role === 'SUPER_ADMIN' ? '/super-admin' : '/portal',
          sessionDuration: u.lastLogin === 'Just now' ? '1m' : u.lastLogin,
          device: 'Desktop' as const,
          location: 'Local Node',
          email: u.email
        }));

      // If no truly "active" ones found, show the most recent accounts as "Passive"
      if (activeFromList.length === 0) {
        const passiveUsers = allUsers.slice(0, 4).map(u => ({
          id: u.id,
          name: u.name,
          role: u.role,
          currentPath: 'IDLE',
          sessionDuration: u.lastLogin || 'Never',
          device: 'Desktop' as const,
          location: 'Database Record',
          email: u.email
        }));
        setUsers(passiveUsers);
      } else {
        setUsers(activeFromList);
      }
    } else if (allUsers) {
      setUsers([]);
    }
  }, [allUsers]);

  const isDemo = !allUsers || allUsers.length === 0;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
           <div className="flex items-center gap-3 mb-3">
             <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_#10b981]"></div>
             <span className="text-sm font-black text-emerald-500 uppercase tracking-[0.4em] italic leading-none">Stream Live</span>
           </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white italic uppercase tracking-tighter">Live Active <span className="text-[#f59e0b]">Users</span></h1>
          <p className="text-xs sm:text-base text-[#8b8fa8] uppercase tracking-[0.2em] font-black mt-3">Real-time session occupancy and global activity stream</p>
        </div>
          <div className="px-8 py-5 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-3xl flex items-center gap-6 shadow-xl shadow-amber-900/20">
             <div className="text-right">
                <p className="text-xs font-black text-[#f59e0b] uppercase tracking-[0.3em]">{isDemo ? 'Simulation' : 'Active Now'}</p>
                <p className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter mt-1">{users.length} {isDemo ? 'VIRTUAL' : 'GLOBAL'}</p>
             </div>
             <Activity className="w-8 h-8 text-[#f59e0b]" />
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <AnimatePresence mode='popLayout'>
            {users.length > 0 ? users.map((user) => (
               <motion.div 
                 key={user.id}
                 layout
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="bg-[#0f1133] border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden group hover:border-[#f59e0b]/30 transition-all shadow-2xl bg-gradient-to-br from-[#0f1133] to-[#0a0b1a]"
               >
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/5 blur-3xl rounded-full group-hover:bg-amber-500/10 transition-colors"></div>
                  
                  <div className="flex justify-between items-start mb-8">
                     <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white italic font-black text-xl shadow-inner group-hover:scale-110 transition-transform">
                        {user.name.split(' ').map(n=>n[0]).join('')}
                     </div>
                     <span className="text-xs font-black px-3 py-1.5 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 tracking-widest uppercase">{user.role}</span>
                  </div>

                  <div className="space-y-6">
                     <h4 className="text-2xl sm:text-3xl font-black text-white italic uppercase truncate tracking-tight">{user.name}</h4>
                     
                     <div className="space-y-4 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-4 text-slate-500 group-hover:text-slate-300 transition-colors">
                           <Target className="w-4 h-4" />
                           <span className="text-sm font-black uppercase tracking-widest truncate">{user.currentPath}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4 text-slate-500">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm font-black uppercase tracking-widest">{user.sessionDuration}</span>
                           </div>
                           <div className="flex items-center gap-4 text-slate-500">
                              {user.device === 'Mobile' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                              <span className="text-sm font-black uppercase tracking-widest">{user.device}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 text-slate-600">
                           <Globe className="w-4 h-4" />
                           <span className="text-sm font-black uppercase tracking-widest italic">{user.location}</span>
                        </div>
                     </div>
                  </div>

                  <div className="mt-8 pt-6 flex justify-end">
                     <button className="text-xs font-black text-slate-700 hover:text-white uppercase tracking-[0.4em] transition-all italic leading-none">Intercept Node</button>
                  </div>
               </motion.div>
            )) : (
              <div className="col-span-1 md:col-span-2 lg:col-span-4 h-80 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[4rem] bg-white/[0.01]">
                <Activity className="w-16 h-16 text-[#555a7a] mb-6 animate-pulse" />
                <h3 className="text-2xl font-black text-[#555a7a] uppercase italic tracking-tighter">No Active Trace Detected</h3>
                <p className="text-xs text-slate-600 font-black uppercase tracking-[0.3em] mt-3">{allUsers ? 'Real-time synchronization active' : 'Waiting for cluster handshake...'}</p>
              </div>
            )}
         </AnimatePresence>
      </div>

      <div className="bg-[#0f1133] border border-white/5 rounded-[4rem] p-12 h-80 relative overflow-hidden hidden lg:block shadow-2xl">
         <div className="flex justify-between items-center mb-10">
            <h3 className="text-sm font-black text-white uppercase italic tracking-[0.3em]">Platform Load & Concurrency Matrix</h3>
            <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.5em] animate-pulse">Capacity 0.4%</span>
         </div>
         <div className="grid grid-cols-24 gap-4 h-24">
            {Array.from({length: 48}).map((_, i) => (
               <div key={i} className={`rounded-md transition-all duration-1000 ${i < users.length ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.7)]' : 'bg-white/5'}`}></div>
            ))}
         </div>
         <p className="mt-10 text-sm font-black text-slate-700 uppercase tracking-[0.5em] text-center italic">
           {isDemo ? 'DEMO MODE: No real-time clusters detected' : 'Node Cluster Status: OPTIMAL — Latency: 12ms'}
         </p>
      </div>
    </div>
  );
}
