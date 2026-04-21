import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mail, UserPlus, Clock, CheckCircle2, XCircle, 
    Search, Filter, ChevronRight, User, Shield,
    Building, RefreshCcw, Send, AlertCircle
} from 'lucide-react';
import { authFetch, API } from '../../utils/auth';

interface Invitation {
    id: string;
    email: string;
    role: string;
    organization: string;
    scope: string;
    study_ids: string[];
    is_accepted: boolean;
    created_at: string;
    expires_at: string;
    is_expired: boolean;
}

interface InvitationsModuleProps {
    allStudies?: any[];
}

export default function InvitationsModule({ allStudies = [] }: InvitationsModuleProps) {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [inviteForm, setInviteForm] = useState({
        email: '',
        role: 'COORDINATOR',
        organization: 'MusB Research',
        scope: 'ALL',
        study_ids: [] as string[]
    });

    const fetchInvitations = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API}/api/invitations/`);
            if (res.ok) {
                const data = await res.json();
                setInvitations(Array.isArray(data) ? data : (data.results || []));
            }
        } catch (err) {
            console.error('Failed to fetch invitations:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, []);

    const handleCreateInvitation = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await authFetch(`${API}/api/invitations/`, {
                method: 'POST',
                body: JSON.stringify(inviteForm)
            });
            if (res.ok) {
                setShowInviteModal(false);
                setInviteForm({
                    email: '',
                    role: 'COORDINATOR',
                    organization: 'MusB Research',
                    scope: 'ALL',
                    study_ids: []
                });
                fetchInvitations();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to create invitation');
            }
        } catch (err) {
            console.error('Invitation failed:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredInvitations = invitations.filter(inv => 
        inv.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-full space-y-6"
        >
            {/* Header */}
            <div className="flex justify-between items-center bg-white/[0.03] border border-white/5 rounded-3xl p-6 shadow-2xl">
                <div>
                    <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                        Invitation <span className="text-indigo-400">Management</span>
                    </h1>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                        <Shield className="w-2.5 h-2.5 text-indigo-500/40" />
                        Cross-Dashboard Recruitment Hub
                    </p>
                </div>
                <button 
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                    <UserPlus className="w-4 h-4" />
                    Invite Personnel
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Pending Invites', value: invitations.filter(i => !i.is_accepted).length, color: 'text-indigo-400', icon: Clock },
                    { label: 'Accepted Access', value: invitations.filter(i => i.is_accepted).length, color: 'text-emerald-400', icon: CheckCircle2 },
                    { label: 'Response Rate', value: invitations.length > 0 ? `${Math.round((invitations.filter(i => i.is_accepted).length / invitations.length) * 100)}%` : '0%', color: 'text-amber-400', icon: RefreshCcw },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className={`text-2xl font-black italic ${stat.color}`}>{stat.value}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                            <stat.icon className={`w-5 h-5 ${stat.color} opacity-40`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Area */}
            <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                {/* Table Header / Search */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input 
                            type="text" 
                            placeholder="Search by email or role..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-indigo-500/50 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                         <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white transition-colors">
                            <Filter className="w-4 h-4" />
                         </button>
                         <button onClick={fetchInvitations} className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white transition-colors">
                            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                         </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-[#0B1120] z-10">
                            <tr className="border-b border-white/5">
                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Invited Personnel</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Target Role</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Scope</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Created</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredInvitations.map((inv) => (
                                <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5 flex items-center justify-center">
                                                <Mail className="w-5 h-5 text-indigo-400 opacity-60" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white tracking-tight">{inv.email}</p>
                                                <p className="text-[10px] text-white/30 uppercase font-black">{inv.organization || 'MusB Research'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-2 text-[11px] font-black text-white/70 uppercase tracking-widest">
                                            <Shield className="w-3 h-3 text-indigo-500" />
                                            {inv.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.1em]">{inv.scope}</p>
                                            <p className="text-[11px] font-bold text-indigo-400">
                                                {inv.scope === 'SPECIFIC' ? `${inv.study_ids?.length || 0} Studies` : 'Access to All'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-white/60 tabular-nums">
                                            {new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {inv.is_accepted ? (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Accepted</span>
                                            </div>
                                        ) : (
                                            <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full w-fit ${new Date(inv.expires_at) < new Date() ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                                                <Clock className={`w-3 h-3 ${new Date(inv.expires_at) < new Date() ? 'text-red-500' : 'text-amber-500'}`} />
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${new Date(inv.expires_at) < new Date() ? 'text-red-400' : 'text-amber-400'}`}>
                                                    {new Date(inv.expires_at) < new Date() ? 'Expired' : 'Pending'}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 opacity-0 group-hover:opacity-100 transition-all text-white/40 hover:text-white">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invite Modal */}
            <AnimatePresence>
                {showInviteModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-[#0B1120] border border-white/10 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 border-b border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                        <Send className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">New Personnel Invitation</h3>
                                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1 italic">Dispatch Secure Identity Credential</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                                    <XCircle className="w-6 h-6 text-white/20" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateInvitation} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Email Address</label>
                                        <input 
                                            type="email" 
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-indigo-500/50"
                                            placeholder="personname@example.com"
                                            value={inviteForm.email}
                                            onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Assigned Role</label>
                                            <select 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-indigo-500/50 appearance-none italic"
                                                value={inviteForm.role}
                                                onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})}
                                            >
                                                <option value="COORDINATOR" className="bg-[#0B1120]">Coordinator</option>
                                                <option value="SPONSOR" className="bg-[#0B1120]">Sponsor / Monitor</option>
                                                <option value="PI" className="bg-[#0B1120]">Sub-Investigator</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Organization</label>
                                            <input 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-indigo-500/50"
                                                value={inviteForm.organization}
                                                onChange={(e) => setInviteForm({...inviteForm, organization: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Access Scope</label>
                                        <div className="flex gap-4">
                                            <button 
                                                type="button"
                                                onClick={() => setInviteForm({...inviteForm, scope: 'ALL'})}
                                                className={`flex-1 p-4 rounded-2xl border transition-all flex flex-col items-center ${inviteForm.scope === 'ALL' ? 'bg-indigo-600/10 border-indigo-500' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                            >
                                                <Shield className={`w-5 h-5 mb-2 ${inviteForm.scope === 'ALL' ? 'text-indigo-400' : 'text-slate-500'}`} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Global Access</span>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setInviteForm({...inviteForm, scope: 'SPECIFIC'})}
                                                className={`flex-1 p-4 rounded-2xl border transition-all flex flex-col items-center ${inviteForm.scope === 'SPECIFIC' ? 'bg-indigo-600/10 border-indigo-500' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                            >
                                                <Building className={`w-5 h-5 mb-2 ${inviteForm.scope === 'SPECIFIC' ? 'text-indigo-400' : 'text-slate-500'}`} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Study Specific</span>
                                            </button>
                                        </div>
                                    </div>

                                    {inviteForm.scope === 'SPECIFIC' && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Select Studies</label>
                                            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-auto p-2 bg-white/5 rounded-2xl border border-white/5">
                                                {allStudies.map(study => (
                                                    <button 
                                                        key={study.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const id = study.protocol_id || study.id;
                                                            const current = [...inviteForm.study_ids];
                                                            if (current.includes(id)) {
                                                                setInviteForm({...inviteForm, study_ids: current.filter(x => x !== id)});
                                                            } else {
                                                                setInviteForm({...inviteForm, study_ids: [...current, id]});
                                                            }
                                                        }}
                                                        className={`p-3 rounded-xl border text-left flex items-center justify-between group transition-all ${inviteForm.study_ids.includes(study.protocol_id || study.id) ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-[#0B1120] border-white/10 hover:border-indigo-500/30'}`}
                                                    >
                                                        <span className="text-[10px] font-bold text-white/80 group-hover:text-white uppercase truncate">
                                                            {study.protocol_id || 'Study'}
                                                        </span>
                                                        {inviteForm.study_ids.includes(study.protocol_id || study.id) && <CheckCircle2 className="w-3 h-3 text-indigo-400" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-white/5 space-y-4">
                                    <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-[9px] text-amber-500/80 font-bold uppercase leading-relaxed tracking-wider">
                                            Email dispatch is currently manual. Please share the login credentials securely after creating the invitation record.
                                        </p>
                                    </div>

                                    <button 
                                        disabled={isSubmitting}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black uppercase tracking-[0.2em] py-5 rounded-[1.5rem] shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                                    >
                                        {isSubmitting ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        Create Invitation
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
