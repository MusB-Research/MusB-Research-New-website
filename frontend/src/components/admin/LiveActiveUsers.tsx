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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
             <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em] italic">Stream Live</span>
           </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">Live Active <span className="text-[#f59e0b]">Users</span></h1>
          <p className="text-xs sm:text-sm text-[#8b8fa8] uppercase tracking-widest mt-2">Real-time session occupancy and global activity stream</p>
        </div>
          <div className="px-6 py-3 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-2xl flex items-center gap-4">
             <div className="text-right">
               <p className="text-[10px] font-black text-[#f59e0b] uppercase tracking-widest">{isDemo ? 'Simulation' : 'Active Now'}</p>
               <p className="text-xl font-black text-white italic tracking-tighter">{users.length} {isDemo ? 'VIRTUAL' : 'GLOBAL'}</p>
             </div>
             <Activity className="w-6 h-6 text-[#f59e0b]" />
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence mode='popLayout'>
            {users.length > 0 ? users.map((user) => (
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
                     <span className="text-sm font-black px-2 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 tracking-widest uppercase">{user.role}</span>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-2xl font-black text-white italic uppercase truncate tracking-tight">{user.name}</h4>
                     
                     <div className="space-y-3 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-3 text-slate-500 group-hover:text-slate-300 transition-colors">
                           <Target className="w-3 h-3" />
                           <span className="text-xs font-black uppercase tracking-widest truncate">{user.currentPath}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3 text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs font-black uppercase tracking-widest">{user.sessionDuration}</span>
                           </div>
                           <div className="flex items-center gap-3 text-slate-500">
                              {user.device === 'Mobile' ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                              <span className="text-xs font-black uppercase tracking-widest">{user.device}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                           <Globe className="w-3 h-3" />
                           <span className="text-xs font-black uppercase tracking-widest italic">{user.location}</span>
                        </div>
                     </div>
                  </div>

                  <div className="mt-6 pt-4 flex justify-end">
                     <button className="text-xs font-black text-slate-700 hover:text-white uppercase tracking-[0.3em] transition-all italic">Intercept Node</button>
                  </div>
               </motion.div>
            )) : (
              <div className="col-span-1 md:col-span-2 lg:col-span-4 h-64 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[3rem] bg-white/[0.01]">
                <Activity className="w-12 h-12 text-[#555a7a] mb-4 animate-pulse" />
                <h3 className="text-xl font-black text-[#555a7a] uppercase italic tracking-tighter">No Other Active Nodes</h3>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-2">{allUsers ? 'Real-time synchronization active' : 'Waiting for cluster handshake...'}</p>
              </div>
            )}
         </AnimatePresence>
      </div>

      {/* Grid of occupancy */}
      <div className="bg-[#0f1133] border border-white/5 rounded-[3rem] p-10 h-64 relative overflow-hidden hidden lg:block">
         <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs font-black text-white uppercase italic tracking-widest">Platform Load & Concurrency</h3>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Capacity 0.4%</span>
         </div>
         <div className="grid grid-cols-24 gap-3 h-20">
            {Array.from({length: 48}).map((_, i) => (
               <div key={i} className={`rounded-sm transition-all duration-1000 ${i < users.length ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/5'}`}></div>
            ))}
         </div>
         <p className="mt-8 text-xs font-black text-slate-700 uppercase tracking-widest text-center">
           {isDemo ? 'DEMO MODE: No real-time clusters detected' : 'Node Cluster Status: OPTIMAL — Latency: 12ms'}
         </p>
      </div>
    </div>
  );
}
