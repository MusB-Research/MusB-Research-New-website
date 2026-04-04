import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User as UserIcon, Eye, Edit2, Filter, Download, Loader2 } from 'lucide-react';
import { authFetch , API } from '../../utils/auth';

interface ParticipantRecord {
  id: string;
  internal_id: string;
  name: string;
  email: string;
  registeredDate: string;
  status: string;
  enrolledStudies: {
    studyId: string;
    studyName: string;
    status: string;
  }[];
  raw: any;
}

interface ParticipantsManagementProps {
  allParticipants: any[];
  allStudies: any[];
  onRefresh: () => void;
  onViewUser: (user: any) => void;
  onRegister: () => void;
}

export default function ParticipantsManagement({ allParticipants = [], allStudies = [], onRefresh, onViewUser, onRegister }: ParticipantsManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  const participantsList: ParticipantRecord[] = useMemo(() => {
    return allParticipants.map(p => ({
      id: p.participant_sid || p.id || 'N/A',
      internal_id: p.id,
      raw: p.user_details ? { ...p.user_details, id: p.id, role: 'PARTICIPANT' } : { id: p.id, role: 'PARTICIPANT', name: 'Anonymous' },
      name: p.user_details?.full_name || p.user_details?.name || 'Anonymous',
      email: p.user_details?.email || 'N/A',
      registeredDate: p.created_at ? new Date(p.created_at).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A',
      status: p.status || 'NEW',
      enrolledStudies: allStudies
        .filter(s => s.id === p.study)
        .map(s => ({
          studyId: s.protocol_id,
          studyName: s.title,
          status: p.status
        }))
    }));
  }, [allParticipants, allStudies]);

  const handleToggleStatus = async (p: ParticipantRecord) => {
    // Basic toggle logic: if ACTIVE -> INACTIVE, if anything else -> ACTIVE
    const newStatus = p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setUpdatingId(p.internal_id);
    const apiUrl = API || 'http://localhost:8000';
    
    try {
      const res = await authFetch(`${apiUrl}/api/participants/${p.internal_id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        onRefresh();
      } else {
        alert('Failed to update participant status');
      }
    } catch (err) {
      console.error(err);
      alert('Network error during status update');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = participantsList.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black text-white italic uppercase tracking-tighter">Registered <span className="text-[#22c55e]">Participants</span></h1>
          <p className="text-xs sm:text-sm text-[#8b8fa8] uppercase tracking-[0.2em] font-black mt-3">Oversee global participant engagement and study enrollment history</p>
        </div>
        <div className="flex gap-6">
          <button 
            onClick={() => alert('Exporting data...')}
            className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95"
          >
            <Download className="w-5 h-5" /> Export Data
          </button>
          <button 
            onClick={onRegister}
            className="px-8 py-4 bg-[#22c55e] text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 hover:bg-[#16a34a] transition-all active:scale-95"
          >
            <UserIcon className="w-5 h-5" /> Manual Registration
          </button>
        </div>
      </div>

      <div className="bg-[#0f1133] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row gap-6">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
            <input
              type="text"
              placeholder="Search participants by ID, Name or Email..."
              className="w-full bg-[#0a0b1a] border border-white/5 rounded-3xl pl-16 pr-6 py-5 text-sm text-white outline-none focus:border-green-500/30 font-black uppercase italic tracking-widest placeholder:text-slate-800"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
             <select 
              className="bg-[#0a0b1a] border border-white/5 rounded-3xl px-6 text-xs font-black uppercase text-slate-400 tracking-[0.2em] outline-none focus:border-green-500/30 cursor-pointer"
             >
               <option>All Statuses</option>
               <option>Active Only</option>
               <option>Enrolled Only</option>
             </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-xs font-black text-[#555a7a] uppercase tracking-[0.3em] italic border-b border-white/5">
                <th className="px-10 py-8">Participant Identity</th>
                <th className="px-10 py-8">Registration Date</th>
                <th className="px-10 py-8">Enrolled Studies & Status</th>
                <th className="px-10 py-8">Global Status</th>
                <th className="px-10 py-8 text-right">System Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-10 py-20 text-center opacity-30 italic uppercase tracking-[0.2em] text-xs">No registered participants in persistence layers</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                          <UserIcon className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-base font-black text-white italic group-hover:text-green-400 transition-colors uppercase tracking-tight">{p.name}</p>
                          <p className="text-[10px] text-[#555a7a] font-black uppercase tracking-widest mt-1.5">{p.email} • ID: {p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-xs font-black text-slate-400 uppercase tracking-widest italic">{p.registeredDate}</td>
                    <td className="px-10 py-8">
                      <div className="space-y-3">
                         {p.enrolledStudies.length > 0 ? p.enrolledStudies.map((s, i) => (
                           <div key={i} className="flex gap-4 items-center">
                              <span className="text-xs font-black text-slate-500 uppercase italic truncate max-w-[180px]">{s.studyName}</span>
                              <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                                s.status === 'ACTIVE' || s.status === 'ENROLLED' ? 'bg-blue-500/10 text-blue-400 outline outline-1 outline-blue-500/20' : 
                                s.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-slate-500'
                              }`}>{s.status}</span>
                           </div>
                         )) : <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest italic">No Studies</span>}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <button 
                        onClick={() => handleToggleStatus(p)}
                        disabled={updatingId === p.internal_id}
                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all flex items-center gap-2 ${
                        p.status === 'ACTIVE' || p.status === 'ELIGIBLE' || p.status === 'CONSENTED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                        } disabled:opacity-50`}
                      >
                        {updatingId === p.internal_id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        {p.status}
                      </button>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => onViewUser(p.raw)}
                          className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-600 hover:text-white transition-all active:scale-95"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => onViewUser(p.raw)}
                          className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-600 hover:text-green-400 transition-all active:scale-95"
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
