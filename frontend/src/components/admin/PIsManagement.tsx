import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Eye, Edit2, Shield, MoreVertical, GraduationCap, Loader2, Trash2 } from 'lucide-react';
import { authFetch , API, revealValue } from '../../utils/auth';

interface PI {
  id: string;
  name: string;
  email: string;
  credentials: string;
  status: 'Active' | 'Inactive';
  studies: string[];
  raw: any;
}

interface PIsManagementProps {
  allUsers: any[];
  allStudies: any[];
  onRefresh: () => void;
  onViewUser: (user: any) => void;
  onRegister?: () => void;
}

export default function PIsManagement({ allUsers = [], allStudies = [], onRefresh, onViewUser }: PIsManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  const pis: PI[] = useMemo(() => {
    return allUsers
      .filter(u => u.role === 'PI')
      .map(u => ({
        id: u.id,
        raw: u, // Keep original object for modal
        name: revealValue(u.full_name, u.decrypted_name) || revealValue(u.name, u.decrypted_name) || (u.email ? u.email.split('@')[0] : 'Unnamed Investigator'),
        email: revealValue(u.email) || u.email || 'unknown@domain',
        credentials: (u as any).credentials || 'MD, PhD',
        status: (u as any).status === 'Suspended' ? 'Inactive' : 'Active',
        studies: allStudies
          .filter(s => s.pi === u.id || s.pi_id === u.id || (s.assigned_pis || []).some((p: any) => p.id === u.id))
          .map(s => s.title)
      }));
  }, [allUsers, allStudies]);

  const handleToggleStatus = async (pi: any) => {
    const isCurrentlyActive = pi.status === 'Active';
    const newStatus = isCurrentlyActive ? 'Suspended' : 'Verified';
    setUpdatingId(pi.id);
    const apiUrl = API || 'http://localhost:8000';
    
    try {
      const res = await authFetch(`${apiUrl}/api/users/${pi.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        onRefresh();
      } else {
        alert('Failed to update investigator status');
      }
    } catch (err) {
      console.error(err);
      alert('Network error during status update');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeletePI = async (piId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this investigator?')) return;
    
    setUpdatingId(piId);
    const apiUrl = API || 'http://localhost:8000';
    
    try {
      const res = await authFetch(`${apiUrl}/api/users/${piId}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok || res.status === 204) {
        onRefresh();
      } else {
        alert('Failed to delete investigator');
      }
    } catch (err) {
      console.error(err);
      alert('Network error during deletion');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredPIs = pis.filter(pi => 
    pi.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    pi.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">


      <div className="bg-[#0f1133] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 bg-white/[0.01]">
          <div className="relative max-w-xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
            <input
              type="text"
              placeholder="Search investigators by name, email or specialty..."
              className="w-full bg-[#0a0b1a] border border-white/5 rounded-3xl pl-16 pr-6 py-5 text-sm text-white outline-none focus:border-indigo-500/30 font-bold uppercase italic tracking-widest placeholder:text-slate-800"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value) }
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-[12px] font-black text-[#555a7a] uppercase tracking-[0.3em] italic border-b border-white/5">
                <th className="px-10 py-8">Investigator Profile</th>
                <th className="px-10 py-8">Credentials</th>
                <th className="px-10 py-8">Assigned Studies</th>
                <th className="px-10 py-8">Account Status</th>
                <th className="px-10 py-8 text-right">System Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPIs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center opacity-30 italic uppercase tracking-[0.2em] text-[12px]">No investigators found in persistence layers</td>
                </tr>
              ) : (
                filteredPIs.map((pi) => (
                  <tr key={pi.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                          <Shield className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-base font-black text-white italic group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{pi.name}</p>
                          <p className="text-[12px] text-[#555a7a] font-black uppercase tracking-widest mt-1.5">{pi.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-3">
                        <GraduationCap className="w-4 h-4 text-slate-600" />
                        <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest italic">{pi.credentials}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-wrap gap-3">
                        {pi.studies.length > 0 ? (
                          pi.studies.map((s, i) => (
                            <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[12px] font-black text-slate-500 uppercase tracking-widest leading-none">{s}</span>
                          ))
                        ) : (
                          <span className="text-[12px] text-slate-700 italic font-black uppercase tracking-widest">No Active Assignments</span>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <button 
                        onClick={() => handleToggleStatus(pi)}
                        disabled={updatingId === pi.id}
                        className={`px-4 py-2 rounded-full text-[12px] font-black uppercase tracking-[0.2em] border transition-all flex items-center gap-2 ${
                        pi.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                        } disabled:opacity-50`}
                      >
                        {updatingId === pi.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        {pi.status === 'Active' ? 'Authorized' : 'Suspended'}
                      </button>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => onViewUser(pi.raw)}
                          title="View Details" 
                          className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-600 hover:text-white transition-all active:scale-95"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => onViewUser(pi.raw)}
                          title="Edit Investigator Profile" 
                          className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-600 hover:text-indigo-400 transition-all active:scale-95"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeletePI(pi.id)}
                          disabled={updatingId === pi.id}
                          title="Delete Investigator" 
                          className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-600 hover:text-red-500 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {updatingId === pi.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => alert('Extra controls: Reset Password, Audit Logs')}
                          className="p-3 text-slate-700 hover:text-white transition-all active:scale-95"
                        >
                          <MoreVertical className="w-5 h-5" />
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


