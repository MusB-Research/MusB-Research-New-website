import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, UserPlus, Clock, CheckCircle2, XCircle, Trash2,
    Search, Filter, ChevronRight, User, Shield, AlertTriangle,
    Building, RefreshCcw, Send, AlertCircle, FileText
} from 'lucide-react';
import { authFetch, API } from '../../../utils/auth';

interface Invitation {
    id: string;
    email: string;
    role: string;
    organization: string;
    scope: string;
    study_ids?: string[];
    invited_in_study?: string;
    is_accepted: boolean;
    created_at: string;
    expires_at: string;
    is_expired: boolean;
}

interface InviteForStudyModuleProps {
    allStudies?: any[];
}

export default function InviteForStudyModule({ allStudies = [] }: InviteForStudyModuleProps) {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [emailCheckResult, setEmailCheckResult] = useState<any>(null);
    const [toasts, setToasts] = useState<any[]>([]);

    const [inviteForm, setInviteForm] = useState({
        email: '',
        role: 'COORDINATOR',
        organization: 'MusB Research',
        scope: 'SPECIFIC',
        study_ids: [] as string[]
    });

    const addToast = (msg: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };

    const fetchInvitations = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API}/api/invitations/`);
            if (res.ok) {
                const data = await res.json();
                const fetched = Array.isArray(data) ? data : (data.results || []);
                // By default, filter to unaccepted ones or display all clearly
                setInvitations(fetched);
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

    const handleDeleteInvitation = async (id: string) => {
        try {
            const res = await authFetch(`${API}/api/invitations/${id}/`, {
                method: 'DELETE'
            });
            if (res.ok || res.status === 204) {
                addToast('Invitation removed successfully!', 'success');
                setInvitations(invitations.filter(inv => inv.id !== id));
            } else {
                addToast('Failed to delete invitation', 'danger');
            }
        } catch (err) {
            console.error('Delete invitation failed:', err);
            addToast('An error occurred while deleting', 'danger');
        }
    };

    const handleCreateInvitation = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setEmailCheckResult(null);
        try {
            // Check if email already exists in system
            const checkRes = await fetch(`${API}/api/auth/check-email/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteForm.email })
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
                addToast('Invitation dispatched successfully!', 'success');
                setShowInviteModal(false);
                setInviteForm({
                    email: '',
                    role: 'COORDINATOR',
                    organization: 'MusB Research',
                    scope: 'SPECIFIC',
                    study_ids: []
                });
                fetchInvitations();
            } else {
                const err = await res.json();
                addToast(err.error || 'Failed to create invitation', 'danger');
            }
        } catch (err) {
            console.error('Invitation failed:', err);
            addToast('An error occurred during submission', 'danger');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredInvitations = invitations.filter(inv => {
        const matchesSearch = inv.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.role.toLowerCase().includes(searchQuery.toLowerCase());
        // Only show unaccepted invitations per the user prompt ("dont show them until they accept")
        return matchesSearch && !inv.is_accepted;
    });

    const getStudyName = (studyIds: string[] | undefined, invitedInStudy: string | undefined) => {
        const ids = studyIds || (invitedInStudy ? [invitedInStudy] : []);
        if (!ids || ids.length === 0) return 'All Studies';
        const studyNames = ids.map(id => {
            const study = allStudies.find(s => s.id === id || s.protocol_id === id);
            return study ? (study.protocol_id || study.title) : id;
        });
        return studyNames.join(', ');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-full space-y-4"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#0B101B]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-4 shadow-2xl gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                        Invite <span className="text-blue-400">For Study</span>
                    </h1>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-2">
                        <Shield className="w-3 h-3 text-blue-500" />
                        Manage Pending Personnel Invitations Across Projects
                    </p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-wider text-[11px] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/20"
                >
                    <UserPlus className="w-4 h-4" />
                    Invite To Study
                </button>
            </div>

            {/* Main Listing View */}
            <div className="flex-1 bg-[#0B101B]/30 backdrop-blur-2xl border border-white/5 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                {/* Search & Actions Header */}
                <div className="p-4 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                            type="text"
                            placeholder="Search by email or role..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-white focus:border-blue-500/50 outline-none transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 self-end md:self-auto">
                        <button
                            onClick={fetchInvitations}
                            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center h-10 w-10"
                            title="Refresh Invitations"
                        >
                            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Listing Table */}
                <div className="flex-1 overflow-auto max-h-[60vh] custom-scrollbar">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                            <RefreshCcw className="w-8 h-8 animate-spin text-blue-500" />
                            <p className="text-xs uppercase tracking-widest font-black italic">Loading Active Invitations...</p>
                        </div>
                    ) : filteredInvitations.length === 0 ? (
                        <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
                            <Mail className="w-10 h-10 text-slate-700 opacity-40 mb-3" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No unaccepted invitations found</p>
                            <p className="text-[11px] text-slate-600 uppercase tracking-wider mt-1">All personnel invitations are either accepted or removed.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-[#0B1120] z-10">
                                <tr className="border-b border-white/5">
                                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invited Person</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Study Allocation</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Sent</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredInvitations.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                                    <Mail className="w-4.5 h-4.5 text-blue-400 opacity-80" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white tracking-tight">{inv.email}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">{inv.organization || 'MusB'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <Building className="w-3.5 h-3.5 text-blue-500/60" />
                                                <p className="text-xs font-bold text-white/90 tracking-tight">
                                                    {getStudyName(inv.study_ids, inv.invited_in_study)}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="flex items-center gap-2 text-[11px] font-bold text-white/70 uppercase tracking-wider">
                                                <Shield className="w-3.5 h-3.5 text-blue-500" />
                                                {inv.role}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className="text-xs font-bold text-slate-400 tabular-nums">
                                                {new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full w-fit ${new Date(inv.expires_at) < new Date() ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                                                <Clock className={`w-3 h-3 ${new Date(inv.expires_at) < new Date() ? 'text-red-500' : 'text-amber-500'}`} />
                                                <span className={`text-[9px] font-black uppercase tracking-wider ${new Date(inv.expires_at) < new Date() ? 'text-red-400' : 'text-amber-400'}`}>
                                                    {new Date(inv.expires_at) < new Date() ? 'Expired' : 'Pending'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button
                                                onClick={() => handleDeleteInvitation(inv.id)}
                                                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-all hover:scale-105 active:scale-95"
                                                title="Delete Invitation"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Custom Invitation Form Overlay */}
            <AnimatePresence>
                {showInviteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-[#0B1120] border border-white/10 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl relative"
                        >
                            <div className="p-7 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                        <UserPlus className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Create <span className="text-blue-400">Personnel Invite</span></h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Directly Allocate New Users To Core Tasks</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setShowInviteModal(false); setEmailCheckResult(null); }}
                                    className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateInvitation} className="p-7 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Candidate Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-blue-500/50 transition-all text-sm"
                                            placeholder="personname@example.com"
                                            value={inviteForm.email}
                                            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Role</label>
                                            <select
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-blue-500/50 appearance-none cursor-pointer transition-all text-sm"
                                                value={inviteForm.role}
                                                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                                            >
                                                <option value="COORDINATOR" className="bg-[#0B101B]">Coordinator</option>
                                                <option value="SPONSOR" className="bg-[#0B101B]">Sponsor / Monitor</option>
                                                <option value="PI" className="bg-[#0B101B]">Sub-Investigator</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Affiliated Organization</label>
                                            <input
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-blue-500/50 transition-all text-sm"
                                                value={inviteForm.organization}
                                                onChange={(e) => setInviteForm({ ...inviteForm, organization: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Studies</label>
                                        <div className="grid grid-cols-2 gap-2 max-h-36 overflow-auto p-3 bg-white/5 rounded-2xl border border-white/5">
                                            {allStudies.map(study => {
                                                const studyId = study.protocol_id || study.id;
                                                const isSelected = inviteForm.study_ids.includes(studyId);
                                                return (
                                                    <button
                                                        key={study.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const current = [...inviteForm.study_ids];
                                                            if (isSelected) {
                                                                setInviteForm({ ...inviteForm, study_ids: current.filter(x => x !== studyId) });
                                                            } else {
                                                                setInviteForm({ ...inviteForm, study_ids: [...current, studyId] });
                                                            }
                                                        }}
                                                        className={`p-3 rounded-xl border text-left flex items-center justify-between group transition-all ${isSelected ? 'bg-blue-600/20 border-blue-500' : 'bg-[#0B1120] border-white/10 hover:border-blue-500/30'}`}
                                                    >
                                                        <span className="text-[11px] font-bold text-white/80 group-hover:text-white uppercase truncate">
                                                            {study.protocol_id || 'Study'}
                                                        </span>
                                                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 space-y-4 bg-white/[0.01]">
                                    {emailCheckResult && (
                                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3 animate-in fade-in">
                                            <div className="flex items-center gap-3">
                                                <AlertCircle className="w-5 h-5 text-amber-500" />
                                                <p className="text-[11px] font-bold text-white uppercase tracking-wider">Already Exists</p>
                                            </div>
                                            <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-wider">
                                                {emailCheckResult.message} Continuing will still send an invitation link which might overwrite their access once accepted.
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setEmailCheckResult(null)}
                                                    className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-all text-white"
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
                                                    className="flex-1 py-2.5 bg-amber-500 text-slate-950 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-white transition-all"
                                                >
                                                    Invite Anyway
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {!emailCheckResult && (
                                        <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                            <p className="text-[10px] text-amber-300 font-bold uppercase leading-relaxed tracking-wider">
                                                An automated credential setup email will be dispatched to the provided email address upon submission.
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        disabled={isSubmitting}
                                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black uppercase tracking-widest py-4.5 rounded-2xl shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs italic"
                                    >
                                        {isSubmitting ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        {emailCheckResult ? 'Invite Anyway' : 'Send Invitation'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TOAST SYSTEM */}
            <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-3">
                <AnimatePresence>
                    {toasts.map(t => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, x: 50 }}
                            className={`px-6 py-4 rounded-xl shadow-2xl backdrop-blur-3xl border flex items-center gap-4 min-w-[300px] max-w-md ${
                                t.type === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                t.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                t.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            }`}
                        >
                            <div className="p-1.5 rounded-lg bg-white/5">
                                {t.type === 'danger' ? <XCircle size={16} /> :
                                 t.type === 'warning' ? <AlertCircle size={16} /> :
                                 t.type === 'success' ? <CheckCircle2 size={16} /> :
                                 <Mail size={16} />}
                            </div>
                            <div className="flex-1">
                                <p className="text-[11px] font-black uppercase tracking-tighter italic leading-tight">{t.msg}</p>
                            </div>
                            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="p-1 hover:bg-white/10 rounded-lg outline-none">
                                <XCircle size={14} className="opacity-50" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
