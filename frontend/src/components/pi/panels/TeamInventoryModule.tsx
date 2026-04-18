import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Mail, UserPlus, Shield, Clock, Search, 
    Filter, Download, ChevronRight, UserCheck, 
    AlertCircle, Building2, UserCircle2, Calendar, Briefcase,
    X, CheckCircle2, Activity, Rocket
} from 'lucide-react';
import { authFetch, API } from '../../../utils/auth';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'ACTIVE' | 'PENDING';
    date: string;
    invited_by?: string;
}

interface TeamInventoryModuleProps {
    members: TeamMember[];
    loading?: boolean;
    onRefresh?: () => void;
    selectedStudyId?: string;
}

export default function TeamInventoryModule({ members = [], loading = false, onRefresh, selectedStudyId }: TeamInventoryModuleProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'coordinator' });
    const [isInviting, setIsInviting] = useState(false);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteData.email || !inviteData.email.includes('@')) return;
        
        setIsInviting(true);
        try {
            const res = await authFetch(`${API}/api/auth/admin/create-user/`, {
                method: 'POST',
                body: JSON.stringify({
                    email: inviteData.email,
                    first_name: inviteData.name.split(' ')[0] || inviteData.email.split('@')[0],
                    last_name: inviteData.name.split(' ').slice(1).join(' ') || 'User',
                    role: inviteData.role.toUpperCase(),
                    study_id: selectedStudyId === 'all' ? null : selectedStudyId
                })
            });

            if (res.ok) {
                setShowInviteModal(false);
                setInviteData({ name: '', email: '', role: 'coordinator' });
                if (onRefresh) onRefresh();
                alert("Personnel invited successfully.");
            } else if (res.status === 400 || res.status === 409) {
                const data = await res.json();
                if (data.existing_user) {
                    const u = data.existing_user;
                    alert(`⚠️ DUPLICATE DETECTED\n\nUser ${u.name} (${u.email}) is already in the platform.\n\nInvited By: ${u.invited_by || 'Unknown'}\nStudy Context: ${u.invited_in_study || 'General Platform'}\nStatus: ${u.status}`);
                } else {
                    alert(data.error || "Invitation failed.");
                }
            } else {
                const data = await res.json();
                alert(data.error || "Invitation failed.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsInviting(false);
        }
    };

    const filteredMembers = useMemo(() => {
        return members.filter(m => {
            const name = m.name || '';
            const email = m.email || '';
            const role = m.role || '';
            const matchesSearch = (name + email + role).toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [members, searchQuery, statusFilter]);

    const stats = useMemo(() => {
        return {
            total: members.length,
            active: members.filter(m => m.status === 'ACTIVE').length,
            pending: members.filter(m => m.status === 'PENDING').length
        };
    }, [members]);

    return (
        <div className="space-y-8 p-6 md:p-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                        <Users className="w-8 h-8 text-teal-400" />
                        Invited Team Members
                    </h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[11px] mt-2 flex items-center gap-2">
                        <Shield className="w-3 h-3 text-teal-500/50" />
                        Platform Synchronization & Deployment Records
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowInviteModal(true)}
                        className="px-6 py-4 bg-teal-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-teal-500 transition-all shadow-xl shadow-teal-600/20 flex items-center gap-2 active:scale-95"
                    >
                        <UserPlus className="w-4 h-4" />
                        Invite Personnel
                    </button>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-xl backdrop-blur-md">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Total Assets</p>
                            <p className="text-2xl font-black text-white italic leading-none">{stats.total.toString().padStart(2, '0')}</p>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="text-right">
                            <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest leading-none mb-1">Operational</p>
                            <p className="text-2xl font-black text-white italic leading-none">{stats.active.toString().padStart(2, '0')}</p>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="text-right">
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Awaiting</p>
                            <p className="text-2xl font-black text-white italic leading-none">{stats.pending.toString().padStart(2, '0')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    <input 
                        type="text"
                        placeholder="SEARCH DEPLOYED PERSONNEL..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0B101B] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white font-bold italic text-sm outline-none focus:border-teal-500/30 focus:bg-white/[0.02] transition-all tracking-tight"
                    />
                </div>

                <div className="flex items-center gap-2 bg-[#0B101B] p-2 border border-white/5 rounded-2xl">
                    <button 
                        onClick={() => setStatusFilter('ALL')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'ALL' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Display All
                    </button>
                    <button 
                        onClick={() => setStatusFilter('ACTIVE')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'ACTIVE' ? 'bg-teal-500/10 text-teal-400 shadow-lg border border-teal-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Operational
                    </button>
                    <button 
                        onClick={() => setStatusFilter('PENDING')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'PENDING' ? 'bg-amber-500/10 text-amber-400 shadow-lg border border-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Pending
                    </button>
                </div>
            </div>

            {/* Members Table */}
            <div className="bg-[#0B101B] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Users className="w-64 h-64 text-white" />
                </div>

                <table className="w-full border-collapse relative z-10">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-8 py-6 text-left text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Identity & Resource</th>
                            <th className="px-8 py-6 text-left text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Access Role</th>
                            <th className="px-8 py-6 text-left text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Origin Hub</th>
                            <th className="px-8 py-6 text-left text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Sync Status</th>
                            <th className="px-8 py-6 text-right text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Deployment Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        <AnimatePresence mode='popLayout'>
                            {filteredMembers.map((member, idx) => (
                                <motion.tr 
                                    key={member.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="group hover:bg-white/[0.02] transition-all"
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-teal-400 font-black italic shadow-inner group-hover:scale-110 transition-transform">
                                                {(member.name || member.email || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white uppercase tracking-tight italic group-hover:text-teal-400 transition-colors">{member.name || member.email || 'Unknown User'}</p>
                                                <p className="text-[11px] text-slate-500 font-bold tracking-tight lowercase">{member.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Briefcase className="w-3 h-3 text-white/20" />
                                                {member.role.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <UserCheck className="w-3 h-3 text-teal-500/50" />
                                                {member.invited_by || 'Super Admin'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                                            member.status === 'ACTIVE' 
                                            ? 'bg-teal-500/10 border-teal-500/30 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.1)]' 
                                            : 'bg-amber-500/10 border-amber-500/30 text-amber-500 animate-pulse'
                                        }`}>
                                            <div className={`w-1 h-1 rounded-full ${member.status === 'ACTIVE' ? 'bg-teal-400 shadow-[0_0_5px_teal]' : 'bg-amber-500'}`} />
                                            {member.status === 'ACTIVE' ? 'Operational' : 'Awaiting Profile'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3 text-slate-500 group-hover:text-white transition-colors">
                                            <Calendar className="w-3.5 h-3.5 opacity-50" />
                                            <span className="text-xs font-black italic tabular-nums">{member.date}</span>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>

                {filteredMembers.length === 0 && !loading && (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-10">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                            <AlertCircle className="w-8 h-8 text-slate-700" />
                        </div>
                        <h4 className="text-lg font-black text-white uppercase italic mb-2 tracking-tight">No Personnel Found</h4>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-xs">Your search parameters returned zero sync records from the meta-database.</p>
                    </div>
                )}
            </div>

            {/* Footer Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><UserPlus className="w-24 h-24 text-white" /></div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 italic">Platform Policy</p>
                    <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-tight">Active accounts are verified GXP users with validated credentials and medical licenses (if applicable).</p>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><Shield className="w-24 h-24 text-white" /></div>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4 italic">Security Guard</p>
                    <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-tight">Pending accounts expire after 7 days if credentials are not finalized by the invited personnel.</p>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><Clock className="w-24 h-24 text-white" /></div>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 italic">Action Required</p>
                    <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-tight">Contact your MusB Administrator to re-issue tokens for expired invitations or locked accounts.</p>
                </div>
            </div>
            
            {/* Invite Modal */}
            <AnimatePresence>
                {showInviteModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-md bg-[#0B101B] border border-white/5 rounded-[2.5rem] p-10 shadow-3xl space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Invite Personnel</h3>
                                <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-all"><X className="w-5 h-5 text-slate-500" /></button>
                            </div>
                            {/* Invite Form */}
                            <form onSubmit={handleInvite} className="space-y-6 relative z-10 w-full text-left">
                                <div className="space-y-2 text-left w-full">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1 text-left">Full Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="Jane Smith"
                                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-teal-500/30 transition-all text-left"
                                        value={inviteData.name}
                                        onChange={e => setInviteData({...inviteData, name: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-2 text-left w-full">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1 text-left">Email Address</label>
                                    <input 
                                        type="email" 
                                        placeholder="jane.smith@musbresearch.com"
                                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-teal-500/30 transition-all text-left"
                                        value={inviteData.email}
                                        onChange={e => setInviteData({...inviteData, email: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-2 text-left w-full border-b border-white/5 pb-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1 text-left">Platform Role</label>
                                    <select 
                                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-teal-500/30 transition-all appearance-none text-left"
                                        value={inviteData.role}
                                        onChange={e => setInviteData({...inviteData, role: e.target.value})}
                                    >
                                        <option value="coordinator" className="bg-slate-900">Research Coordinator</option>
                                        <option value="pi" className="bg-slate-900">Principal Investigator</option>
                                        <option value="sponsor" className="bg-slate-900">Sponsor Delegate</option>
                                    </select>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isInviting}
                                    className="w-full py-5 bg-teal-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] hover:bg-teal-500 transition-all shadow-xl shadow-teal-600/20 flex items-center justify-center gap-3 active:scale-95"
                                >
                                    {isInviting ? <Activity className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                                    {isInviting ? 'PROCESSING SYNC...' : 'INITIALIZE DEPLOYMENT'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
