import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserCheck, Eye, Edit2, ClipboardList, TrendingUp, Loader2 } from 'lucide-react';
import { authFetch } from '../../utils/auth';

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
  raw: any;
}

interface CoordinatorsManagementProps {
  allUsers: any[];
  allStudies: any[];
  onRefresh: () => void;
  onViewUser: (user: any) => void;
  onRegister: () => void;
}

export default function CoordinatorsManagement({ allUsers = [], allStudies = [], onRefresh, onViewUser, onRegister }: CoordinatorsManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  const coordinators: Coordinator[] = useMemo(() => {
    return allUsers
      .filter(u => u.role === 'COORDINATOR')
      .map(u => ({
        id: u.id,
        raw: u,
        name: u.full_name || u.name || 'Unnamed Coordinator',
        email: u.email,
        status: (u as any).status === 'Suspended' ? 'Inactive' : 'Active',
        assignedStudies: allStudies
          .filter(s => s.coordinator === u.id || s.coordinator_id === u.id || (s.assigned_coordinators || []).some((c: any) => c.id === u.id))
          .map(s => ({
            name: s.title,
            totalParticipants: s.target_screened || 0,
            activeParticipants: s.actual_active || 0,
            completed: s.actual_completed || 0
          }))
      }));
  }, [allUsers, allStudies]);

  const handleToggleStatus = async (coord: any) => {
    const isCurrentlyActive = coord.status === 'Active';
    const newStatus = isCurrentlyActive ? 'Suspended' : 'Verified';
    setUpdatingId(coord.id);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    try {
      const res = await authFetch(`${apiUrl}/api/users/${coord.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        onRefresh();
      } else {
        alert('Failed to update coordinator status');
      }
    } catch (err) {
      console.error(err);
      alert('Network error during status update');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = coordinators.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black text-white italic uppercase tracking-tighter">Study <span className="text-[#14b8a6]">Coordinators</span></h1>
          <p className="text-xs sm:text-sm text-[#8b8fa8] uppercase tracking-[0.2em] font-black mt-3">Manage frontline researchers and participant activities</p>
        </div>
        <button 
          onClick={onRegister}
          className="px-8 py-4 bg-[#14b8a6] text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-teal-500/20 hover:bg-[#0d9488] transition-all"
        >
          <UserCheck className="w-5 h-5" /> Add New Coordinator
        </button>
      </div>

      <div className="bg-[#0f1133] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 bg-white/[0.01]">
          <div className="relative max-w-xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
            <input
              type="text"
              placeholder="Search coordinators..."
              className="w-full bg-[#0a0b1a] border border-white/5 rounded-2xl pl-16 pr-6 py-5 text-sm text-white outline-none focus:border-teal-500/30 font-bold uppercase italic tracking-widest placeholder:text-slate-800"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-xs font-black text-[#555a7a] uppercase tracking-[0.3em] italic border-b border-white/5">
                <th className="px-10 py-8">Coordinator Info</th>
                <th className="px-10 py-8">Assigned Study Stats</th>
                <th className="px-10 py-8">Engagement</th>
                <th className="px-10 py-8">Node Status</th>
                <th className="px-10 py-8 text-right">System Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center opacity-30 italic uppercase tracking-[0.2em] text-xs">No coordinators found in persistence layers</td>
                </tr>
              ) : (
                filtered.map((coord) => (
                  <tr key={coord.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                          <ClipboardList className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-base font-black text-white italic group-hover:text-teal-400 transition-colors uppercase tracking-tight">{coord.name}</p>
                          <p className="text-xs text-[#555a7a] font-black uppercase tracking-widest mt-1.5">{coord.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="space-y-4">
                        {coord.assignedStudies.length > 0 ? (
                          coord.assignedStudies.map((s, i) => (
                            <div key={i} className="space-y-2">
                              <div className="flex justify-between text-[10px] font-black uppercase text-teal-500/60 truncate max-w-[250px] tracking-widest">
                                <span>{s.name}</span>
                                <span>{s.activeParticipants}/{s.totalParticipants} ACTIVE</span>
                              </div>
                              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500 shadow-[0_0_10px_#14b8a6]" style={{ width: s.totalParticipants > 0 ? `${(s.activeParticipants / s.totalParticipants) * 100}%` : '0%' }}></div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-slate-700 italic font-black uppercase tracking-widest text-center block">No Studies</span>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl">
                          <TrendingUp className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white italic tracking-tighter uppercase">High Activity</p>
                          <p className="text-[10px] text-[#555a7a] font-black uppercase tracking-widest mt-1">Node ID: {coord.id.slice(-4).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <button 
                        onClick={() => handleToggleStatus(coord)}
                        disabled={updatingId === coord.id}
                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all flex items-center gap-2 ${
                        coord.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                        } disabled:opacity-50`}
                      >
                        {updatingId === coord.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        {coord.status === 'Active' ? 'Active Node' : 'Suspended'}
                      </button>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => onViewUser(coord.raw)}
                          className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-600 hover:text-white transition-all active:scale-95"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => onViewUser(coord.raw)}
                          className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-600 hover:text-teal-400 transition-all active:scale-95"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
