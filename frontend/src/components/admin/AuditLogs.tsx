import React, { useState } from 'react';
import { Search, Filter, ShieldCheck, ShieldAlert, Monitor, MapPin, Tablet, Laptop, Smartphone } from 'lucide-react';

interface AuditLog {
  id: string;
  user: string;
  role: string;
  action: string;
  timestamp: string;
  status: 'Success' | 'Failure';
  ip: string;
  device: string;
  location: string;
}

export default function AuditLogs({ activities = [] }: { activities?: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const logs = activities.map(a => ({
    id: a.id,
    user: a.user,
    role: a.category,
    action: a.type.replace(/_/g, ' '),
    timestamp: a.timestamp,
    status: (a.severity === 'danger' ? 'Failure' : 'Success') as 'Success' | 'Failure',
    ip: a.ip,
    device: 'System Node',
    location: 'Remote Access'
  }));

  const filteredLogs = logs.filter(l => 
    l.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.ip.includes(searchTerm)
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black text-white italic uppercase tracking-tighter">Security <span className="text-[#a1a1aa]">Audit Logs</span></h1>
          <p className="text-xs sm:text-base text-[#8b8fa8] uppercase tracking-[0.2em] font-black mt-3">Immutable record of all platform authentication and critical events</p>
        </div>
        <div className="flex gap-4">
          <button className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all shadow-xl">
             Download Report
          </button>
        </div>
      </div>

      <div className="bg-[#0f1133] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row gap-6">
          <div className="relative flex-1">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
            <input
              type="text"
              placeholder="Search logs by user, action or IP address..."
              className="w-full bg-[#0a0b1a] border border-white/5 rounded-2xl pl-20 pr-8 py-5 text-sm text-white outline-none focus:border-white/20 font-mono tracking-wide transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
             <button className="px-6 bg-white/5 rounded-2xl text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-3 border border-white/5 hover:text-white transition-all">
                <Filter className="w-4 h-4" /> Filters
             </button>
             <button className="px-6 bg-white/5 rounded-2xl text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-3 border border-white/5 hover:text-white transition-all whitespace-nowrap">
                Last 24 Hours
             </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-xs font-black text-[#555a7a] uppercase tracking-[0.2em] italic border-b border-white/5">
                <th className="px-10 py-8">Event & Status</th>
                <th className="px-10 py-8">User / Actor</th>
                <th className="px-10 py-8">Timestamp (UTC)</th>
                <th className="px-10 py-8">Security Context</th>
                <th className="px-10 py-8 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${
                        log.status === 'Success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                      }`}>
                        {log.status === 'Success' ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className={`text-base font-black italic uppercase tracking-tight ${log.status === 'Failure' ? 'text-red-500 font-black' : 'text-white'}`}>{log.action}</p>
                        <p className="text-[10px] font-black text-[#555a7a] uppercase tracking-[0.3em] mt-1.5 leading-none">{log.status}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div>
                      <p className="text-base font-black text-white italic uppercase tracking-tight">{log.user}</p>
                      <p className="text-xs text-slate-500 font-black uppercase tracking-widest mt-1.5">{log.role}</p>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <p className="text-xs font-mono text-slate-400 font-black tracking-wider uppercase">{log.timestamp}</p>
                  </td>
                  <td className="px-10 py-8">
                    <div className="space-y-3">
                       <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                          <Monitor className="w-4 h-4" /> {log.device}
                       </div>
                       <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                          <MapPin className="w-4 h-4" /> {log.location} ({log.ip})
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <button className="text-xs font-black uppercase text-[#7c3aed] border-b border-[#7c3aed]/0 hover:border-[#7c3aed] tracking-[0.2em] italic transition-all leading-none">Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-center">
           <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] italic">End of Immutable Stream — Total Logs Indexed: 24,102</p>
        </div>
      </div>
    </div>
  );
}
