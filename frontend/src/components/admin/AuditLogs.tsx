import React, { useState, useMemo } from 'react';
import { 
  Search, Shield, Clock, MapPin, 
  Monitor, AlertCircle, FileText, 
  UserPlus, ShieldAlert, Rocket, ClipboardList,
  Filter, Download, MoreVertical, CheckCircle2,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuditLog {
  id: string;
  user: string;
  role: string;
  action: string;
  timestamp: string;
  status: 'Success' | 'Failure' | 'Warning' | 'Manual Override';
  ip: string;
  device: string;
  location: string;
}

interface AuditLogsProps {
  activities?: any[];
}

export default function AuditLogs({ activities }: AuditLogsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Base mock data for when no activities are passed
  const mockLogs: AuditLog[] = [
    { id: '1', user: 'Brijesh Raj', role: 'Super Admin', action: 'System Login', timestamp: 'Mar 15, 2026 18:42:10', status: 'Success', ip: '192.168.1.100', device: 'Chrome - Windows Desktop', location: 'Tampa, US' },
    { id: '2', user: 'PI Michael Chen', role: 'PI', action: 'Update Study Protocol', timestamp: 'Mar 15, 2026 17:15:22', status: 'Success', ip: '192.168.1.105', device: 'Safari - MacBook Air', location: 'Miami, US' },
    { id: '3', user: 'Unknown', role: 'Guest', action: 'Failed Login Attempt', timestamp: 'Mar 15, 2026 16:04:30', status: 'Failure', ip: '45.16.220.14', device: 'Edge - Windows', location: 'Moscow, RU' },
    { id: '4', user: 'Sarah (PharmaCorp)', role: 'Sponsor', action: 'Data Export', timestamp: 'Mar 15, 2026 14:20:00', status: 'Success', ip: '172.16.0.42', device: 'Chrome - Windows', location: 'New York, US' },
  ];

  // If activities passed from prop, map them to AuditLog format
  const logs: AuditLog[] = useMemo(() => {
    if (!activities || activities.length === 0) return mockLogs;
    
    return activities.map((a, i) => ({
      id: a.id || i.toString(),
      user: a.user || 'Unknown',
      role: a.category || 'System',
      action: a.type || a.details || 'Audit Event',
      timestamp: a.timestamp || new Date().toISOString(),
      status: a.severity === 'danger' ? 'Failure' : a.severity === 'warning' ? 'Warning' : 'Success',
      ip: a.ip || '0.0.0.0',
      device: 'Server Log',
      location: 'Remote Node'
    }));
  }, [activities]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [logs, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-500/10 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-pink-500" />
            </div>
            <span className="text-xs font-black text-pink-500 uppercase tracking-[0.3em]">Security Intelligence</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">System Audit & Compliance</h1>
          <p className="text-slate-500 font-medium mt-2">Real-time immutable trail of all platform operations and security events.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-2 italic">
            <Lock className="w-4 h-4" /> Permission Audit
          </button>
          <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-2 italic">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Events', value: '1,429', trend: '+12%', icon: FileText, color: 'blue' },
          { label: 'Failed Access', value: '12', trend: '-5%', icon: ShieldAlert, color: 'red' },
          { label: 'Override Actions', value: '3', trend: 'Stable', icon: AlertCircle, color: 'amber' },
          { label: 'Active Sessions', value: '8', trend: 'Live', icon: Shield, color: 'emerald' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] hover:bg-white/[0.04] transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-400 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full bg-${stat.color}-500/10 text-${stat.color}-500`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-3xl shadow-2xl">
        {/* Controls */}
        <div className="p-8 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row justify-between gap-6">
          <div className="relative group w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-pink-500 transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH AUDIT TRAIL..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-16 pr-8 py-5 text-white font-bold outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/10 transition-all text-xs uppercase tracking-widest placeholder:text-slate-800"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-950/50 p-1.5 rounded-2xl border border-white/5">
              {['ALL', 'SECURITY', 'DATA', 'USER'].map((t) => (
                <button key={t} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white rounded-xl transition-all">
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Operator Info</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Action Type</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Environmental Data</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right italic">Temporal Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-pink-500/[0.02] transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center font-black text-white shadow-lg group-hover:scale-110 transition-transform">
                        {log.user.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white mb-1 group-hover:text-pink-400 transition-colors uppercase tracking-widest">{log.user}</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
                          <Shield className="w-3 h-3" />
                          {log.role}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <p className="text-sm font-black text-slate-300 uppercase tracking-widest mb-1">{log.action}</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                      <Clock className="w-3 h-3" />
                      {log.timestamp}
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                        <Monitor className="w-3.5 h-3.5 text-slate-600" />
                        <span className="uppercase tracking-widest">{log.device}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-600" />
                        <span className="uppercase tracking-widest">{log.location} — {log.ip}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                      log.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      log.status === 'Failure' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'Success' ? 'bg-emerald-500' : 'bg-red-500'} shadow-[0_0_8px_currentColor]`} />
                      {log.status}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <button className="p-3 text-slate-700 hover:text-white transition-all bg-white/[0.02] rounded-xl border border-white/5 opacity-0 group-hover:opacity-100 italic font-mono text-[10px]">
                      View Trace
                    </button>
                    <div className="text-[10px] font-mono text-slate-800 uppercase tracking-widest mt-2">
                       0x{Math.random().toString(16).substr(2, 6)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
