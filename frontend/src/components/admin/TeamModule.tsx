import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Mail, 
  MapPin, Clock, Search, Filter, 
  MoreVertical, CheckCircle2, Lock
} from 'lucide-react';
import { motion } from 'framer-motion';

import { authFetch } from '../../utils/auth';

export default function TeamModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentUserStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchTeam = async () => {
    try {
      // In a real app, this would be a specialized 'team-list' endpoint
      // For now, we'll fetch from a generic users endpoint if it exists
      const res = await authFetch(`${apiUrl}/api/auth/admin/audit-logs/`); // Mocking team via audit logs for now or specialized endpoint
      // Since there's no dedicated 'list-users' yet, we'll use a placeholder or the audit log to infer
      // Actually, I should probably stick to the placeholder if no list-users exists, 
      // but I'll add the UI for the new fields.
      setTeam([
        { id: 1, first_name: 'Brijesh', last_name: 'Raj', role: 'super_admin', email: 'admin@musb.com', status: 'active', affiliation: 'musb', lastLogin: '2h ago', location: 'Tampa, US' },
        { id: 2, first_name: 'Michael', last_name: 'Chen', role: 'pi', email: 'm.chen@hospital.org', status: 'active', affiliation: 'onsite', lastLogin: '45m ago', location: 'Miami, US' },
        { id: 3, first_name: 'Sarah', last_name: 'Wilson', role: 'coordinator', email: 's.wilson@research.net', status: 'active', affiliation: 'musb', lastLogin: '5h ago', location: 'Orlando, US' },
        { id: 4, first_name: 'Emma', last_name: 'Watson', role: 'team_member', email: 'e.watson@onsite.com', status: 'pending', affiliation: 'onsite', lastLogin: 'never', location: 'Miami, US' },
      ]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await authFetch(`${apiUrl}/api/auth/admin/create-user/`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess('Account created successfully. Instructions sent via email.');
        setTimeout(() => { setShowAddModal(false); setFormData({ email: '', first_name: '', last_name: '', role: '' }); }, 2000);
        fetchTeam();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create user');
      }
    } catch (err) { setError('Network error'); }
  };

  // Determine which roles current user can create
  const getAllowedTargetRoles = () => {
    const role = currentUser?.role?.toLowerCase();
    const aff = currentUser?.affiliation?.toLowerCase();
    if (role === 'super_admin') return ['admin', 'sponsor', 'coordinator', 'pi'];
    if (role === 'admin') return ['sponsor', 'coordinator', 'pi'];
    if (role === 'pi' && aff === 'musb') return ['sponsor', 'coordinator'];
    if (role === 'coordinator' && aff === 'musb') return ['sponsor', 'pi'];
    if (role === 'pi' && aff === 'onsite') return ['team_member'];
    return [];
  };

  const allowedRoles = getAllowedTargetRoles();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Platform Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
              <Users className="w-6 h-6 text-cyan-500" />
            </div>
            <span className="text-[11px] font-black text-cyan-500 uppercase tracking-[0.4em] italic font-black">Authorized Personnel</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic tracking-widest">Medical Team</h1>
          <p className="text-slate-500 font-bold mt-2 text-lg">Manage cross-functional access for PIs, Coordinators, and Sponsors.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-2 italic">
             <Lock className="w-4 h-4" /> Permission Audit
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            disabled={allowedRoles.length === 0}
            className={`px-10 py-5 bg-cyan-500 text-[#0a0b1a] rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 shadow-2xl shadow-cyan-500/30 hover:scale-105 transition-all italic ${allowedRoles.length === 0 ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
          >
            <UserPlus className="w-5 h-5" /> Onboard Staff
          </button>
        </div>
      </div>

      {/* Stats and Filter */}
      <div className="flex flex-col xl:flex-row gap-8 items-center justify-between">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full xl:w-auto">
          {[
            { name: 'Admin', users: 2, icon: Shield },
            { name: 'Coordinator', users: 8, icon: Users },
            { name: 'CRA / Sponsor', users: 4, icon: Mail },
            { name: 'Medical Monitor', users: 1, icon: CheckCircle2 },
          ].map((cat, i) => (
            <div key={i} className="px-8 py-5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-white/20 transition-all flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <cat.icon className="w-4 h-4 text-slate-500" />
              </div>
              <div className="whitespace-nowrap">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{cat.name}</p>
                <p className="text-lg font-black text-white">{cat.users}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 w-full xl:w-auto">
          <div className="relative group w-full xl:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-cyan-500 transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH TEAM..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-16 pr-8 py-5 text-white font-bold outline-none focus:border-cyan-500/50 transition-all text-[11px] uppercase tracking-[0.2em] placeholder:text-slate-800"
            />
          </div>
          <button className="p-5 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all"><Filter className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {team.map((user, i) => (
          <div key={i} className="group relative bg-[#0a0b1a]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 hover:border-cyan-500/30 transition-all shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
               <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-500 opacity-0 group-hover:opacity-100 transition-all hover:text-white">
                 <MoreVertical className="w-4 h-4" />
               </button>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="relative mb-10">
                <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-slate-800 to-slate-950 border-4 border-white/5 flex items-center justify-center font-black text-4xl text-white shadow-2xl group-hover:scale-105 transition-all uppercase">
                  {(user.first_name?.[0] || '') + (user.last_name?.[0] || '')}
                </div>
                <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl border-4 border-[#0a0b1a] flex items-center justify-center ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'} shadow-lg`}>
                   <div className="w-2 h-2 rounded-full bg-white opacity-40" />
                </div>
              </div>

               <h3 className="text-xl font-black text-white uppercase tracking-widest">{user.first_name} {user.last_name}</h3>
               <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
                <p className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                  user.role === 'super_admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-white/5 text-slate-500 border-white/5'
                }`}>
                  {user.role?.replace('_', ' ')}
                </p>
                <p className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                  user.affiliation === 'onsite' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                }`}>
                  {user.affiliation}
                </p>
               </div>
               
               {user.status !== 'active' && (
                 <div className="mt-4 px-6 py-2 bg-pink-500/10 border border-pink-500/20 rounded-xl">
                    <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest italic">{user.status}</span>
                 </div>
               )}

              <div className="mt-10 w-full space-y-4 text-left">
                <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl group/link hover:bg-white/5 transition-all">
                   <Mail className="w-4 h-4 text-slate-600 group-hover/link:text-cyan-400" />
                   <span className="text-[10px] font-bold text-slate-400 tracking-widest truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                   <MapPin className="w-4 h-4 text-slate-600" />
                   <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{user.location}</span>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-white/5 w-full flex items-center justify-between">
                <div className="text-left">
                   <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Last Logged</p>
                   <p className="text-[10px] font-bold text-white uppercase tracking-[0.1em] mt-1 italic"><Clock className="w-3 h-3 inline mr-1 opacity-40" /> {user.lastLogin}</p>
                </div>
                <button className="px-6 py-3 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform italic">Manage</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl" onClick={() => setShowAddModal(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-xl bg-[#0B101B] border border-white/10 rounded-[3rem] p-12 overflow-hidden shadow-2xl"
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full" />
            
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">Onboard <span className="text-cyan-400">Personnel</span></h2>
            <p className="text-slate-500 font-bold mb-10 text-xs uppercase tracking-widest italic leading-relaxed">System node instantiation for research support.</p>
            
            <form onSubmit={handleCreateUser} className="space-y-6 relative z-10">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">First Name</label>
                  <input required type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2x; px-6 py-4 outline-none focus:border-cyan-500/30 text-xs font-bold uppercase tracking-widest" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Last Name</label>
                  <input required type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2x; px-6 py-4 outline-none focus:border-cyan-500/30 text-xs font-bold uppercase tracking-widest" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Corporate/Medical Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-cyan-500/30 text-xs font-bold uppercase tracking-widest" />
              </div>
              
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">System Role Assignment</label>
                <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-cyan-500/30 text-xs font-bold uppercase tracking-widest appearance-none text-white">
                  <option value="" className="bg-[#0B101B]">SELECT PERMISSION LEVEL</option>
                  {allowedRoles.map(r => (
                    <option key={r} value={r} className="bg-[#0B101B] uppercase">{r.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              {error && <p className="text-pink-500 text-[10px] font-black uppercase tracking-widest italic">{error}</p>}
              {success && <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest italic">{success}</p>}

              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 bg-white/5 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all italic">Abort</button>
                <button type="submit" className="flex-1 py-5 bg-cyan-500 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-cyan-500/20 italic">Initialize Account</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
