import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, UserCheck, Eye, Edit2, ClipboardList, TrendingUp } from 'lucide-react';

interface Coordinator {
  id: string;
  name: string;
  email: string;
  assignedStudies: {
    name: string;
    totalParticipants: number;
    activeParticipants: number;
    completed: number;
  }[];
  status: 'Active' | 'Inactive';
}

export default function CoordinatorsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [coordinators] = useState<Coordinator[]>([
    {
      id: '1',
      name: 'Emily Jones',
      email: 'e.jones@musb.com',
      status: 'Active',
      assignedStudies: [
        { name: 'Beat The Bloat', totalParticipants: 120, activeParticipants: 45, completed: 12 }
      ]
    },
    {
      id: '2',
      name: 'James Smith',
      email: 'j.smith@musb.com',
      status: 'Active',
      assignedStudies: [
        { name: 'Vital-Age Study', totalParticipants: 85, activeParticipants: 30, completed: 5 },
        { name: 'Shine Study', totalParticipants: 40, activeParticipants: 15, completed: 2 }
      ]
    }
  ]);

  const filtered = coordinators.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">Study <span className="text-[#14b8a6]">Coordinators</span></h1>
          <p className="text-[10px] sm:text-xs text-[#8b8fa8] uppercase tracking-widest mt-2">Manage frontline researchers and participant activities</p>
        </div>
        <button className="px-6 py-3 bg-[#14b8a6] text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 hover:bg-[#0d9488] transition-all">
          <UserCheck className="w-4 h-4" /> Add New Coordinator
        </button>
      </div>

      <div className="bg-[#0f1133] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-white/[0.01]">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="text"
              placeholder="Search coordinators..."
              className="w-full bg-[#0a0b1a] border border-white/5 rounded-xl pl-12 pr-6 py-3 text-xs text-white outline-none focus:border-teal-500/30 font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-[10px] font-black text-[#555a7a] uppercase tracking-widest italic border-b border-white/5">
                <th className="px-8 py-6">Coordinator Info</th>
                <th className="px-8 py-6">Assigned Study Stats</th>
                <th className="px-8 py-6">Engagement</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((coord) => (
                <tr key={coord.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white italic group-hover:text-teal-400 transition-colors uppercase tracking-tight">{coord.name}</p>
                        <p className="text-[10px] text-[#555a7a] font-medium tracking-tight mt-0.5">{coord.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-3">
                      {coord.assignedStudies.map((s, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-[8px] font-black uppercase text-teal-500/60 truncate max-w-[200px]">
                            <span>{s.name}</span>
                            <span>{s.activeParticipants}/{s.totalParticipants} ACTIVE</span>
                          </div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500" style={{ width: `${(s.activeParticipants / s.totalParticipants) * 100}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <TrendingUp className="w-3 h-3 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white italic tracking-tighter uppercase">High Activity</p>
                        <p className="text-[8px] text-[#555a7a] font-bold uppercase tracking-widest">Global Rank #{coord.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      coord.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {coord.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-600 hover:text-white transition-all"><Eye className="w-4 h-4" /></button>
                      <button className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-600 hover:text-teal-400 transition-all"><Edit2 className="w-4 h-4" /></button>
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
