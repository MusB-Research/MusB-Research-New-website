import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, User, Eye, Edit2, Filter, Download } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  email: string;
  registeredDate: string;
  status: 'Active' | 'Inactive' | 'Withdrawn';
  enrolledStudies: {
    studyId: string;
    studyName: string;
    status: 'Applied' | 'Screened' | 'Enrolled' | 'Active' | 'Completed' | 'Withdrawn';
  }[];
}

export default function ParticipantsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [participants] = useState<Participant[]>([
    {
      id: 'P001',
      name: 'John Anderson',
      email: 'j.anderson@example.com',
      registeredDate: 'Dec 12, 2025',
      status: 'Active',
      enrolledStudies: [
        { studyId: 'beat-the-bloat', studyName: 'Beat The Bloat Study', status: 'Active' }
      ]
    },
    {
      id: 'P002',
      name: 'Maria Garcia',
      email: 'm.garcia@gmail.com',
      registeredDate: 'Jan 05, 2026',
      status: 'Active',
      enrolledStudies: [
        { studyId: 'beat-the-bloat', studyName: 'Beat The Bloat Study', status: 'Completed' },
        { studyId: 'shine-study', studyName: 'Shine Study', status: 'Screened' }
      ]
    }
  ]);

  const filtered = participants.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">Registered <span className="text-[#22c55e]">Participants</span></h1>
          <p className="text-[10px] sm:text-xs text-[#8b8fa8] uppercase tracking-widest mt-2">Oversee global participant engagement and study enrollment history</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button className="px-6 py-3 bg-[#22c55e] text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 hover:bg-[#16a34a] transition-all">
            <Filter className="w-4 h-4" /> Advanced Filter
          </button>
        </div>
      </div>

      <div className="bg-[#0f1133] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="text"
              placeholder="Search participants by ID, Name or Email..."
              className="w-full bg-[#0a0b1a] border border-white/5 rounded-xl pl-12 pr-6 py-3.5 text-xs text-white outline-none focus:border-green-500/30 font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <select className="bg-[#0a0b1a] border border-white/5 rounded-xl px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest outline-none focus:border-green-500/30">
               <option>All Statuses</option>
               <option>Active Only</option>
               <option>Enrolled Only</option>
             </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-[10px] font-black text-[#555a7a] uppercase tracking-widest italic border-b border-white/5">
                <th className="px-8 py-6">Participant Identity</th>
                <th className="px-8 py-6">Registration</th>
                <th className="px-8 py-6">Enrolled Studies & Status</th>
                <th className="px-8 py-6">Global Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white italic group-hover:text-green-400 transition-colors uppercase tracking-tight">{p.name}</p>
                        <p className="text-[10px] text-[#555a7a] font-medium tracking-tight mt-0.5">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{p.registeredDate}</td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                       {p.enrolledStudies.map((s, i) => (
                         <div key={i} className="flex gap-3 items-center">
                            <span className="text-[9px] font-black text-slate-500 uppercase italic truncate max-w-[140px]">{s.studyName}</span>
                            <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${
                              s.status === 'Active' ? 'bg-blue-500/10 text-blue-400 outline outline-1 outline-blue-500/20' : 
                              s.status === 'Completed' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-slate-500'
                            }`}>{s.status}</span>
                         </div>
                       ))}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      p.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-600 hover:text-white transition-all"><Eye className="w-4 h-4" /></button>
                      <button className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-600 hover:text-green-400 transition-all"><Edit2 className="w-4 h-4" /></button>
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
