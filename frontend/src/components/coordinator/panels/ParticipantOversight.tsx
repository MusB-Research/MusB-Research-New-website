import React, { useState, useEffect, useCallback } from 'react';
import { authFetch, API } from '../../../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    MessageSquare,
    User,
    ChevronRight,
    CheckCircle2,
    Clock,
    AlertCircle,
    Download,
    X,
    ClipboardList,
    CheckCheck,
    Filter
} from 'lucide-react';
import { SkeletonLoader } from '../../shared/SkeletonLoader';

interface ParticipantRow {
    id: string;
    name: string;
    study: string;
    rawStatus: string;
    displayStatus: string;
    progress: number;
    submittedAt: string | null;
    lastVisit: string;
    risk: 'Low' | 'Medium' | 'High';
}

type TabKey = 'All' | 'Pending Review' | 'Enrolled' | 'Active' | 'Completed' | 'Ineligible';

const STATUS_MAP: Record<string, string> = {
    RECRUITING: 'Recruiting',
    PENDING_REVIEW: 'Pending Review',
    ELIGIBLE: 'Eligible',
    INELIGIBLE: 'Not Eligible',
    ENROLLED: 'Enrolled',
    CONSENTED: 'Consented',
    RANDOMIZED: 'Randomized',
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    DROPPED: 'Dropped',
    NEW: 'New',
};

const getStatusStyle = (raw: string) => {
    switch (raw?.toUpperCase()) {
        case 'ENROLLED':    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
        case 'ACTIVE':
        case 'RANDOMIZED':  return 'text-green-400 bg-green-500/10 border-green-500/30';
        case 'PENDING_REVIEW': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
        case 'RECRUITING':  return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
        case 'COMPLETED':   return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
        case 'INELIGIBLE':
        case 'DROPPED':     return 'text-red-400 bg-red-500/10 border-red-500/20';
        default:            return 'text-slate-400 bg-white/5 border-white/10';
    }
};

export default function ParticipantOversight({
    onOpenProfile,
    onMessage,
    selectedStudyId
}: {
    onOpenProfile?: (id: string) => void;
    onMessage?: (id: string) => void;
    selectedStudyId?: string | 'all';
}) {
    const [activeTab, setActiveTab] = useState<TabKey>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [riskFilter, setRiskFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
    const [participants, setParticipants] = useState<ParticipantRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reviewingId, setReviewingId] = useState<string | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [reviewModal, setReviewModal] = useState<{
        id: string;
        name: string;
        decision: 'ACCEPT' | 'REJECT';
    } | null>(null);
    const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToastMsg({ text, type });
        setTimeout(() => setToastMsg(null), 3500);
    };

    const fetchParticipants = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await authFetch(`${API}/api/participants/`);
            if (!res.ok) throw new Error('Subject Registry Offline');
            const data = await res.json();
            const results = Array.isArray(data) ? data : (data.results || []);

            const mapped: ParticipantRow[] = results.map((p: any) => ({
                id: p.id,
                name: p.user_details?.full_name || p.participant_sid || 'Unknown Subject',
                study: p.protocol_id || p.study_name || 'Assigned Study',
                study_id: String(p.study),
                rawStatus: p.status,
                displayStatus: STATUS_MAP[p.status?.toUpperCase()] || p.status,
                progress: p.compliance || (
                    p.status === 'COMPLETED' ? 100 :
                    p.status === 'ENROLLED' || p.status === 'ACTIVE' || p.status === 'RANDOMIZED' ? 60 :
                    p.status === 'PENDING_REVIEW' ? 30 :
                    p.status === 'RECRUITING' ? 10 : 5
                ),
                submittedAt: p.submitted_at || p.created_at || null,
                lastVisit: p.visits?.[0]?.scheduled_date?.split('T')[0] || 'No Visit',
                risk: 'Low',
            }));
            setParticipants(mapped);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setTimeout(() => setIsLoading(false), 800);
        }
    }, []);

    useEffect(() => {
        fetchParticipants();
    }, [fetchParticipants]);

    const handleReviewDecision = async () => {
        if (!reviewModal) return;
        setReviewingId(reviewModal.id);
        try {
            const res = await authFetch(
                `${API}/api/participants/${reviewModal.id}/review_eligibility/`,
                {
                    method: 'POST',
                    body: JSON.stringify({ decision: reviewModal.decision, notes: reviewNotes }),
                }
            );
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Review action failed');
            }
            showToast(
                reviewModal.decision === 'ACCEPT'
                    ? `${reviewModal.name} has been enrolled successfully.`
                    : `${reviewModal.name} marked as not eligible.`,
                'success'
            );
            setReviewModal(null);
            setReviewNotes('');
            fetchParticipants();
        } catch (e: any) {
            showToast(e.message || 'Review action failed.', 'error');
        } finally {
            setReviewingId(null);
        }
    };

    const filteredParticipants = participants.filter((p: any) => {
        const tabMatch =
            activeTab === 'All' ? true :
            activeTab === 'Pending Review' ? p.rawStatus === 'PENDING_REVIEW' :
            activeTab === 'Enrolled' ? p.rawStatus === 'ENROLLED' :
            activeTab === 'Active' ? (p.rawStatus === 'ACTIVE' || p.rawStatus === 'RANDOMIZED') :
            activeTab === 'Completed' ? p.rawStatus === 'COMPLETED' :
            activeTab === 'Ineligible' ? (p.rawStatus === 'INELIGIBLE' || p.rawStatus === 'DROPPED') : true;
        
        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.study.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesRisk = riskFilter === 'All' || p.risk === riskFilter;
        
        const matchesStudy = !selectedStudyId || selectedStudyId === 'all' || String(p.study_id) === String(selectedStudyId);

        return tabMatch && matchesSearch && matchesRisk && matchesStudy;
    });

    const pendingCount = participants.filter((p) => p.rawStatus === 'PENDING_REVIEW' && (!selectedStudyId || selectedStudyId === 'all' || String((p as any).study_id) === String(selectedStudyId))).length;

    const TABS: TabKey[] = ['All', 'Pending Review', 'Enrolled', 'Active', 'Completed', 'Ineligible'];
    const tabCount = (tab: TabKey) => {
        const inStudy = (p: any) => (!selectedStudyId || selectedStudyId === 'all' || String(p.study_id) === String(selectedStudyId));
        if (tab === 'All') return participants.filter(inStudy).length;
        if (tab === 'Pending Review') return participants.filter((p) => p.rawStatus === 'PENDING_REVIEW' && inStudy(p)).length;
        if (tab === 'Enrolled') return participants.filter((p) => p.rawStatus === 'ENROLLED' && inStudy(p)).length;
        if (tab === 'Active') return participants.filter((p) => (p.rawStatus === 'ACTIVE' || p.rawStatus === 'RANDOMIZED') && inStudy(p)).length;
        if (tab === 'Completed') return participants.filter((p) => p.rawStatus === 'COMPLETED' && inStudy(p)).length;
        if (tab === 'Ineligible') return participants.filter((p) => (p.rawStatus === 'INELIGIBLE' || p.rawStatus === 'DROPPED') && inStudy(p)).length;
        return 0;
    };

    const handleDownload = () => {
        const headers = 'ID,Name,Study,Status,Progress,Submitted\n';
        const rows = filteredParticipants
            .map((p) => `${p.id},${p.name},${p.study},${p.displayStatus},${p.progress}%,${p.submittedAt || 'N/A'}`)
            .join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PARTICIPANTS_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

            {/* ── Toast ── */}
            <AnimatePresence>
                {toastMsg && (
                    <motion.div
                        initial={{ opacity: 0, x: 80 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl shadow-2xl text-[12px] font-black uppercase tracking-widest flex items-center gap-3 ${
                            toastMsg.type === 'success' ? 'bg-amber-600 text-slate-950' : 'bg-red-600 text-white'
                        }`}
                    >
                        {toastMsg.type === 'success' ? <CheckCheck className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        {toastMsg.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Review Confirm Modal ── */}
            <AnimatePresence>
                {reviewModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
                        onClick={(e) => { if (e.target === e.currentTarget) { setReviewModal(null); setReviewNotes(''); } }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0B101B] border border-white/10 rounded-[2rem] p-10 w-full max-w-lg shadow-2xl space-y-6"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                    reviewModal.decision === 'ACCEPT'
                                        ? 'bg-amber-500/10 border border-amber-500/20'
                                        : 'bg-red-500/10 border border-red-500/20'
                                }`}>
                                    {reviewModal.decision === 'ACCEPT'
                                        ? <CheckCheck className="w-6 h-6 text-amber-400" />
                                        : <X className="w-6 h-6 text-red-400" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">
                                        {reviewModal.decision === 'ACCEPT' ? 'Enroll Participant' : 'Mark Not Eligible'}
                                    </h3>
                                    <p className="text-[12px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                        {reviewModal.name}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    {reviewModal.decision === 'ACCEPT' ? 'Enrollment Notes (optional)' : 'Rejection Reason'}
                                </label>
                                <textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder={
                                        reviewModal.decision === 'ACCEPT'
                                            ? 'Add any enrollment notes...'
                                            : 'Reason for ineligibility...'
                                    }
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[13px] text-white font-medium outline-none focus:border-amber-500/50 transition-all resize-none min-h-[100px] placeholder:text-slate-600"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setReviewModal(null); setReviewNotes(''); }}
                                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReviewDecision}
                                    disabled={reviewingId === reviewModal.id}
                                    className={`flex-1 px-6 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all disabled:opacity-50 text-white ${
                                        reviewModal.decision === 'ACCEPT'
                                            ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20'
                                            : 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20'
                                    }`}
                                >
                                    {reviewingId === reviewModal.id
                                        ? 'Processing...'
                                        : reviewModal.decision === 'ACCEPT'
                                            ? 'Confirm Enrollment'
                                            : 'Confirm Rejection'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Header ── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1 md:space-y-2">
                    <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tight leading-tight">
                        Participant <span className="text-blue-400">Oversight</span>
                    </h2>
                    <p className="text-[13px] text-white/50 font-bold uppercase tracking-[0.4em] italic leading-none mt-2">
                        Real-time Subject Portfolio &amp; Enrollment Review
                    </p>
                </div>

                {/* Pending Review Alert */}
                {pendingCount > 0 && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => setActiveTab('Pending Review')}
                        className="flex items-center gap-3 px-5 py-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl hover:bg-amber-500/20 transition-all shadow-lg shadow-amber-500/10"
                    >
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
                        <span className="text-[12px] font-black text-amber-400 uppercase tracking-widest italic">
                            {pendingCount} Pending Review{pendingCount !== 1 ? 's' : ''} — Action Required
                        </span>
                        <ChevronRight className="w-4 h-4 text-amber-400" />
                    </motion.button>
                )}

                <div className="flex items-center gap-2 md:gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="SEARCH..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-[12px] text-white font-bold outline-none focus:border-amber-500/50 transition-all w-64 uppercase tracking-widest placeholder:text-slate-600"
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setFilterOpen(!filterOpen)}
                            className={`p-3 border rounded-2xl transition-all ${filterOpen ? 'bg-amber-600 text-slate-950 border-white/20' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-amber-600'}`}
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                            {filterOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-3 w-48 bg-[#0B101B] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                                >
                                    <div className="p-4 border-b border-white/5">
                                        <p className="text-[12px] font-black text-blue-400 uppercase tracking-widest italic">Risk Level</p>
                                    </div>
                                    <div className="p-2">
                                        {(['All', 'Low', 'Medium', 'High'] as const).map((risk) => (
                                            <button
                                                key={risk}
                                                onClick={() => { setRiskFilter(risk); setFilterOpen(false); }}
                                                className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all ${riskFilter === risk ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                            >
                                                {risk}
                                                {riskFilter === risk && <CheckCircle2 size={12} />}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button onClick={handleDownload} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-blue-600 transition-all">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex flex-nowrap overflow-x-auto gap-2 p-1.5 bg-[#0B101B]/60 border border-white/5 rounded-2xl w-fit custom-scrollbar-horizontal pb-3">
                {TABS.map((tab) => {
                    const count = tabCount(tab);
                    const isPending = tab === 'Pending Review';
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative px-4 md:px-6 py-2 md:py-3 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                                activeTab === tab
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                        >
                            {tab}
                            {count > 0 && (
                                <span className={`text-[12px] px-1.5 py-0.5 rounded-full font-black ${
                                    activeTab === tab
                                        ? 'bg-white/20 text-white'
                                        : isPending
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : 'bg-white/10 text-slate-400'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Table ── */}
            <div className="overflow-x-auto custom-scrollbar-horizontal px-1">
                {isLoading ? (
                    <SkeletonLoader type="table" rows={6} />
                ) : error ? (
                    <div className="py-40 flex flex-col items-center justify-center gap-4">
                        <AlertCircle className="w-12 h-12 text-red-500/50" />
                        <p className="text-[12px] text-red-400 font-bold uppercase italic">{error}</p>
                        <button onClick={fetchParticipants} className="text-[12px] font-black text-white px-6 py-2 bg-white/5 rounded-full hover:bg-white/10 transition-all uppercase tracking-widest">
                            Retry
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto pb-4 custom-scrollbar-horizontal px-0.5">
                        <table className="w-full text-left border-collapse min-w-[1000px] border-t border-white/5">
                            <thead>
                                <tr className="bg-white/[0.02] border-b border-white/5 whitespace-nowrap">
                                    <th className="px-10 py-8 text-[12px] font-black text-white/80 uppercase tracking-widest italic border-r border-white/5">Subject Information</th>
                                    <th className="px-10 py-8 text-[12px] font-black text-white/80 uppercase tracking-widest italic border-r border-white/5">Clinical Status</th>
                                    <th className="px-10 py-8 text-[12px] font-black text-white/80 uppercase tracking-widest italic border-r border-white/5">Trial Progress</th>
                                    <th className="px-10 py-8 text-[12px] font-black text-white/80 uppercase tracking-widest italic border-r border-white/5">Submitted</th>
                                    <th className="px-10 py-8 text-[12px] font-black text-white/80 uppercase tracking-widest italic text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <AnimatePresence mode="popLayout">
                                    {filteredParticipants.map((p) => (
                                        <motion.tr
                                            key={p.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className={`hover:bg-white/[0.02] transition-colors group ${p.rawStatus === 'PENDING_REVIEW' ? 'bg-amber-500/[0.03]' : ''}`}
                                        >
                                            {/* Subject */}
                                            <td className="px-10 py-10 whitespace-nowrap align-middle border-r border-white/5">
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-12 h-12 flex items-center justify-center rounded-2xl border shadow-lg shadow-black/20 ${
                                                        p.rawStatus === 'PENDING_REVIEW'
                                                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                            : 'bg-white/5 border-white/10 text-slate-500'
                                                    }`}>
                                                        <User className="w-5 h-5 md:w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-black text-white italic uppercase tracking-tight group-hover:text-amber-400 transition-colors leading-none">{p.name}</p>
                                                        <p className="text-[13px] text-white/30 font-black tracking-widest mt-1.5 uppercase font-mono leading-none">{p.study}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-10 py-10 align-middle border-r border-white/5">
                                                <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-xl border text-[12px] font-black uppercase tracking-widest shadow-lg ${getStatusStyle(p.rawStatus)}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full bg-current ${p.rawStatus === 'PENDING_REVIEW' ? 'animate-ping' : 'animate-pulse'} shadow-[0_0_8px_currentColor]`} />
                                                    {p.displayStatus}
                                                </div>
                                            </td>

                                            {/* Progress */}
                                            <td className="px-10 py-10 align-middle border-r border-white/5">
                                                <div className="w-44 space-y-3">
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-[13px] font-black text-white/40 uppercase tracking-widest italic leading-none">Compliance</span>
                                                        <span className="text-[13px] font-black text-white italic leading-none">{p.progress}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${p.progress}%` }}
                                                            className={`h-full rounded-full ${
                                                                p.rawStatus === 'PENDING_REVIEW' ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' :
                                                                p.rawStatus === 'ENROLLED' || p.rawStatus === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' :
                                                                'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                                            }`}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Submitted */}
                                            <td className="px-10 py-10 whitespace-nowrap align-middle border-r border-white/5">
                                                <div className="flex items-center gap-3 text-slate-500 font-black italic">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="text-[11px] uppercase tracking-widest leading-none">
                                                        {p.submittedAt
                                                            ? new Date(p.submittedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                                                            : 'Not Submitted'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-10 py-10 align-middle">
                                                <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                                                    {/* Accept / Reject – only shown for PENDING_REVIEW */}
                                                    {p.rawStatus === 'PENDING_REVIEW' && (
                                                        <>
                                                            <button
                                                                onClick={() => setReviewModal({ id: p.id, name: p.name, decision: 'ACCEPT' })}
                                                                className="px-6 py-3 bg-blue-600 hover:bg-white hover:text-blue-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-2"
                                                            >
                                                                <CheckCheck className="w-3.5 h-3.5" /> Enroll
                                                            </button>
                                                            <button
                                                                onClick={() => setReviewModal({ id: p.id, name: p.name, decision: 'REJECT' })}
                                                                className="px-6 py-3 bg-red-600/80 hover:bg-white hover:text-red-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-600/20 active:scale-95 flex items-center gap-2"
                                                            >
                                                                <X className="w-3.5 h-3.5" /> Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => onMessage?.(p.id)}
                                                        className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-lg active:scale-95 group/btn"
                                                    >
                                                        <MessageSquare className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                                    </button>
                                                    <button
                                                        onClick={() => onOpenProfile?.(p.id)}
                                                        className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-white hover:text-slate-950 shadow-xl shadow-blue-600/30 active:scale-95 transition-all"
                                                    >
                                                        Open Profile <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
                {filteredParticipants.length === 0 && !isLoading && !error && (
                    <div className="py-40 text-center space-y-4">
                        <ClipboardList className="w-12 h-12 text-slate-800 mx-auto" />
                        <p className="text-[12px] text-slate-600 font-black uppercase tracking-[0.2em] italic">
                            {activeTab === 'Pending Review' ? 'No participants pending review' : 'No participants match your criteria'}
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

