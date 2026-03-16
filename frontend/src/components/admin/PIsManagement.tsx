import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, Eye, Edit2, Shield, MoreVertical, GraduationCap } from 'lucide-react';

interface PI {
  id: string;
  name: string;
  email: string;
  credentials: string;
  status: 'Active' | 'Inactive';
  studies: string[];
}

export default function PIsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [pis] = useState<PI[]>([
    { id: '1', name: 'Dr. Michael Chen', email: 'm.chen@musb.com', credentials: 'MD, PhD - Cardiology', status: 'Active', studies: ['Beat The Bloat', 'Heart Vitality'] },
    { id: '2', name: 'Dr. Sarah Alvarez', email: 's.alvarez@musb.com', credentials: 'PhD - Gastroenterology', status: 'Active', studies: ['Beat The Bloat'] },
    { id: '3', name: 'Dr. Robert Wilson', email: 'r.wilson@musb.com', credentials: 'MD - Internal Medicine', status: 'Inactive', studies: [] },
  ]);

  const filteredPIs = pis.filter(pi => 
    pi.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    pi.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">Principal <span className="text-[#6366f1]">Investigators</span></h1>
          <p className="text-[10px] sm:text-xs text-[#8b8fa8] uppercase tracking-widest mt-2">Manage lead clinical researchers and study oversight</p>
        </div>
        <button className="px-6 py-3 bg-[#6366f1] text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:bg-[#4f46e5] transition-all">
          <UserPlus className="w-4 h-4" /> Register New PI
        </button>
      </div>

      <div className="bg-[#0f1133] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-white/[0.01]">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="text"
              placeholder="Search PIs by name, email or specialty..."
              className="w-full bg-[#0a0b1a] border border-white/5 rounded-xl pl-12 pr-6 py-3 text-xs text-white outline-none focus:border-indigo-500/30 font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-[10px] font-black text-[#555a7a] uppercase tracking-widest italic border-b border-white/5">
                <th className="px-8 py-6">Investigator Profile</th>
                <th className="px-8 py-6">Credentials</th>
                <th className="px-8 py-6">Assigned Studies</th>
                <th className="px-8 py-6">Account Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPIs.map((pi) => (
                <tr key={pi.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white italic group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{pi.name}</p>
                        <p className="text-[10px] text-[#555a7a] font-medium tracking-tight mt-0.5">{pi.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3 h-3 text-slate-600" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{pi.credentials}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-2">
                      {pi.studies.length > 0 ? (
                        pi.studies.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[8px] font-black text-slate-500 uppercase tracking-widest">{s}</span>
                        ))
                      ) : (
                        <span className="text-[9px] text-slate-700 italic uppercase">No Active Assignments</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      pi.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {pi.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button title="View Details" className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-600 hover:text-white transition-all"><Eye className="w-4 h-4" /></button>
                      <button title="Edit PI Profile" className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-600 hover:text-indigo-400 transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button className="p-2.5 text-slate-700 hover:text-white"><MoreVertical className="w-4 h-4" /></button>
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
