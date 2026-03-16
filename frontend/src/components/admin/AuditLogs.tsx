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

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [logs] = useState<AuditLog[]>([
    { id: '1', user: 'Brijesh Raj', role: 'Super Admin', action: 'System Login', timestamp: 'Mar 15, 2026 18:42:10', status: 'Success', ip: '192.168.1.100', device: 'Chrome - Windows Desktop', location: 'Tampa, US' },
    { id: '2', user: 'PI Michael Chen', role: 'PI', action: 'Update Study Protocol', timestamp: 'Mar 15, 2026 17:15:22', status: 'Success', ip: '192.168.1.105', device: 'Safari - MacBook Air', location: 'Miami, US' },
    { id: '3', user: 'Unknown', role: 'Guest', action: 'Failed Login Attempt', timestamp: 'Mar 15, 2026 16:04:30', status: 'Failure', ip: '45.16.220.14', device: 'Edge - Windows', location: 'Moscow, RU' },
    { id: '4', user: 'Sarah (PharmaCorp)', role: 'Sponsor', action: 'Data Export', timestamp: 'Mar 15, 2026 14:20:00', status: 'Success', ip: '172.16.0.42', device: 'Chrome - Windows', location: 'New York, US' },
  ]);

  const filteredLogs = logs.filter(l => 
    l.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.ip.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">Security <span className="text-[#a1a1aa]">Audit Logs</span></h1>
          <p className="text-[10px] sm:text-xs text-[#8b8fa8] uppercase tracking-widest mt-2">Immutable record of all platform authentication and critical events</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
             Download Report
          </button>
        </div>
      </div>

      <div className="bg-[#0f1133] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="text"
              placeholder="Search logs by user, action or IP address..."
              className="w-full bg-[#0a0b1a] border border-white/5 rounded-2xl pl-16 pr-6 py-4 text-xs text-white outline-none focus:border-white/20 font-mono transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
             <button className="px-5 bg-white/5 rounded-2xl text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2 border border-white/5 hover:text-white transition-all">
               <Filter className="w-3 h-3" /> Filters
             </button>
             <button className="px-5 bg-white/5 rounded-2xl text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2 border border-white/5 hover:text-white transition-all">
               Last 24 Hours
             </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-[10px] font-black text-[#555a7a] uppercase tracking-widest italic border-b border-white/5">
                <th className="px-8 py-6">Event & Status</th>
                <th className="px-8 py-6">User / Actor</th>
                <th className="px-8 py-6">Timestamp (UTC)</th>
                <th className="px-8 py-6">Security Context</th>
                <th className="px-8 py-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                        log.status === 'Success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                      }`}>
                        {log.status === 'Success' ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className={`text-xs font-black italic uppercase tracking-tight ${log.status === 'Failure' ? 'text-red-500' : 'text-white'}`}>{log.action}</p>
                        <p className="text-[9px] font-black text-[#555a7a] uppercase tracking-[0.2em] mt-0.5">{log.status}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="text-xs font-black text-white italic uppercase tracking-tight">{log.user}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{log.role}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-[10px] font-mono text-slate-400 font-bold">{log.timestamp}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                       <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          <Monitor className="w-3 h-3" /> {log.device}
                       </div>
                       <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          <MapPin className="w-3 h-3" /> {log.location} ({log.ip})
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-[9px] font-black uppercase text-[#7c3aed] border-b border-[#7c3aed]/0 hover:border-[#7c3aed] tracking-widest italic transition-all">Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-center">
           <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] italic">End of Immutable Stream — Total Logs Indexed: 24,102</p>
        </div>
      </div>
    </div>
  );
}
