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
    const [emailCheckResult, setEmailCheckResult] = useState<any>(null);

    const [inviteForm, setInviteForm] = useState({
        email: '',
        role: 'COORDINATOR',
        organization: 'MusB Research',
        scope: 'ALL',
        study_ids: [] as string[]
    });

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        setEmailCheckResult(null);
        try {
            // Check if email already exists in system
            const checkRes = await fetch(`${API}/api/auth/check-email/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteForm.email }),
                credentials: 'include'
            });

            if (checkRes.ok) {
                const checkData = await checkRes.json();
                if (checkData.exists && !e.currentTarget.getAttribute('data-confirmed')) {
                    setEmailCheckResult(checkData);
                    setIsSubmitting(false);
                    return;
                }
            }

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
            <div className={`flex ${isMobile ? 'flex-col gap-4' : 'justify-between items-center'} bg-[#0B101B]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-5 shadow-2xl`}>
                <div>
                    <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white uppercase tracking-tighter`}>
                        Invitations
                    </h1>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1 flex items-center gap-2">
                        <Shield className="w-2.5 h-2.5 text-indigo-500/40" />
                        Manage Personnel Access
                    </p>
                </div>
                <button 
                    onClick={() => setShowInviteModal(true)}
                    className={`${isMobile ? 'w-full py-3' : 'px-5 py-3'} flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all shadow-lg shadow-indigo-600/20 active:scale-95`}
                >
                    <UserPlus className="w-4 h-4" />
                    Send Invite
                </button>
            </div>

            {/* Stats Row */}
            <div className={`grid grid-cols-1 ${isTablet ? 'grid-cols-2' : 'md:grid-cols-3'} gap-4 md:gap-6`}>
                {[
                    { label: 'Pending', value: invitations.filter(i => !i.is_accepted).length, color: 'text-indigo-400', icon: Clock },
                    { label: 'Accepted', value: invitations.filter(i => i.is_accepted).length, color: 'text-emerald-400', icon: CheckCircle2 },
                    { label: 'Rate', value: invitations.length > 0 ? `${Math.round((invitations.filter(i => i.is_accepted).length / invitations.length) * 100)}%` : '0%', color: 'text-amber-400', icon: RefreshCcw },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-[#0B101B]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-xl">
                        <div>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">{stat.label}</p>
                            <p className={`text-2xl font-bold text-white ${stat.color}`}>{stat.value}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                            <stat.icon className={`w-5 h-5 ${stat.color} opacity-40`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Area */}
            <div className="flex-1 bg-[#0B101B]/30 backdrop-blur-2xl border border-white/5 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                {/* Table Header / Search */}
                <div className={`p-4 border-b border-white/5 flex ${isMobile ? 'flex-col' : 'items-center justify-between'} gap-4`}>
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input 
                            type="text" 
                            placeholder="Search..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:border-indigo-500/50 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className={`flex items-center ${isMobile ? 'justify-end' : ''} gap-2`}>
                         <button className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white transition-colors">
                            <Filter className="w-4 h-4" />
                         </button>
                         <button onClick={fetchInvitations} className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white transition-colors">
                            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                         </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    {isMobile ? (
                        <div className="p-4 space-y-4">
                            {filteredInvitations.map((inv) => (
                                <div key={inv.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-4 shadow-xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-white/5 flex items-center justify-center">
                                                <Mail className="w-5 h-5 text-indigo-400 opacity-60" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white tracking-tight">{inv.email}</p>
                                                <p className="text-[10px] text-white/30 uppercase font-bold">{inv.organization || 'MusB'}</p>
                                            </div>
                                        </div>
                                        {inv.is_accepted ? (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        ) : (
                                            <Clock className={`w-5 h-5 ${new Date(inv.expires_at) < new Date() ? 'text-red-500' : 'text-amber-500'}`} />
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Role</p>
                                            <div className="flex items-center gap-1.5">
                                                <Shield className="w-3 h-3 text-indigo-500" />
                                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">{inv.role}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Access</p>
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                                                {inv.scope === 'SPECIFIC' ? `${inv.study_ids?.length || 0} Studies` : 'All'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Date</p>
                                            <p className="text-[10px] font-bold text-white/60">
                                                {new Date(inv.created_at).toLocaleDateString('en-US')}
                                            </p>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full border ${inv.is_accepted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : new Date(inv.expires_at) < new Date() ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                                            <span className="text-[9px] font-bold uppercase tracking-wider">
                                                {inv.is_accepted ? 'Accepted' : new Date(inv.expires_at) < new Date() ? 'Expired' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-[#0B1120] z-10">
                                <tr className="border-b border-white/5">
                                    <th className="px-6 py-5 text-[10px] font-bold text-white/40 uppercase tracking-wider">Person</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-white/40 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-white/40 uppercase tracking-wider">Access</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-white/40 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-white/40 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredInvitations.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5 flex items-center justify-center">
                                                    <Mail className="w-5 h-5 text-indigo-400 opacity-60" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white tracking-tight">{inv.email}</p>
                                                    <p className="text-[10px] text-white/30 uppercase font-bold">{inv.organization || 'MusB'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="flex items-center gap-2 text-[11px] font-bold text-white/70 uppercase tracking-wider">
                                                <Shield className="w-3 h-3 text-indigo-500" />
                                                {inv.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{inv.scope}</p>
                                                <p className="text-[11px] font-bold text-indigo-400">
                                                    {inv.scope === 'SPECIFIC' ? `${inv.study_ids?.length || 0} Studies` : 'All'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-sm font-bold text-white/60 tabular-nums">
                                                {new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5">
                                            {inv.is_accepted ? (
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Accepted</span>
                                                </div>
                                            ) : (
                                                <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full w-fit ${new Date(inv.expires_at) < new Date() ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                                                    <Clock className={`w-3 h-3 ${new Date(inv.expires_at) < new Date() ? 'text-red-500' : 'text-amber-500'}`} />
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${new Date(inv.expires_at) < new Date() ? 'text-red-400' : 'text-amber-400'}`}>
                                                        {new Date(inv.expires_at) < new Date() ? 'Expired' : 'Pending'}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="p-2 opacity-0 group-hover:opacity-100 transition-all text-white/40 hover:text-white">
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
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
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Invite</h3>
                                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1">Add new user.</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                                    <XCircle className="w-6 h-6 text-white/20" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateInvitation} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider ml-1">Email</label>
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
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider ml-1">Role</label>
                                            <select 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-indigo-500/50 appearance-none"
                                                value={inviteForm.role}
                                                onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})}
                                            >
                                                <option value="COORDINATOR" className="bg-[#0B101B] text-white">Coordinator</option>
                                                <option value="SPONSOR" className="bg-[#0B101B] text-white">Sponsor / Monitor</option>
                                                <option value="PI" className="bg-[#0B101B] text-white">Sub-Investigator</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider ml-1">Org</label>
                                            <input 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-indigo-500/50"
                                                value={inviteForm.organization}
                                                onChange={(e) => setInviteForm({...inviteForm, organization: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider ml-1">Scope</label>
                                        <div className="flex gap-4">
                                            <button 
                                                type="button"
                                                onClick={() => setInviteForm({...inviteForm, scope: 'ALL'})}
                                                className={`flex-1 p-4 rounded-2xl border transition-all flex flex-col items-center ${inviteForm.scope === 'ALL' ? 'bg-indigo-600/10 border-indigo-500' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                            >
                                                <Shield className={`w-5 h-5 mb-2 ${inviteForm.scope === 'ALL' ? 'text-indigo-400' : 'text-slate-500'}`} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Global</span>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setInviteForm({...inviteForm, scope: 'SPECIFIC'})}
                                                className={`flex-1 p-4 rounded-2xl border transition-all flex flex-col items-center ${inviteForm.scope === 'SPECIFIC' ? 'bg-indigo-600/10 border-indigo-500' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                            >
                                                <Building className={`w-5 h-5 mb-2 ${inviteForm.scope === 'SPECIFIC' ? 'text-indigo-400' : 'text-slate-500'}`} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Specific</span>
                                            </button>
                                        </div>
                                    </div>

                                    {inviteForm.scope === 'SPECIFIC' && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider ml-1">Studies</label>
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
                                    {emailCheckResult && (
                                        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-4 animate-in fade-in zoom-in-95">
                                            <div className="flex items-center gap-3">
                                                <AlertCircle className="w-5 h-5 text-amber-500" />
                                                <p className="text-[11px] font-bold text-white uppercase tracking-wider">Already Exists</p>
                                            </div>
                                            <p className="text-[10px] text-white/60 font-medium leading-relaxed">
                                                {emailCheckResult.message} Continuing will still send an invitation link which might overwrite their current role access if they accept.
                                            </p>
                                            <div className="flex gap-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => setEmailCheckResult(null)}
                                                    className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-all"
                                                >
                                                    Change Email
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={(e) => {
                                                        const form = e.currentTarget.closest('form');
                                                        if (form) {
                                                            form.setAttribute('data-confirmed', 'true');
                                                            handleCreateInvitation({ preventDefault: () => {}, currentTarget: form } as any);
                                                        }
                                                    }}
                                                    className="flex-1 py-3 bg-amber-500 text-slate-950 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-white transition-all"
                                                >
                                                    Invite Anyway
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {!emailCheckResult && (
                                        <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-[9px] text-amber-500/80 font-bold uppercase leading-relaxed tracking-wider">
                                                Email dispatch is currently manual. Please share the login credentials securely after creating the invitation record.
                                            </p>
                                        </div>
                                    )}

                                    <button 
                                        disabled={isSubmitting}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold uppercase tracking-wider py-5 rounded-[1.5rem] shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                                    >
                                        {isSubmitting ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        {emailCheckResult ? 'Invite Anyway' : 'Send Invite'}
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
