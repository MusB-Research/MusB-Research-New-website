import React, { useState, useEffect, useCallback } from 'react';
import { authFetch, API } from '../../../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Search, MessageSquare, User, ChevronRight,
    CheckCircle2, Clock, AlertCircle, Download, X,
    ClipboardList, CheckCheck, Filter, DollarSign,
    CheckSquare, ListChecks
} from 'lucide-react';
import { Skeleton } from '../../../views/Participant/SharedComponents';


interface ParticipantRow {
    id: string;
    name: string;
    study: string;
    study_id: string;
    rawStatus: string;
    displayStatus: string;
    progress: number;
    submittedAt: string | null;
    lastVisit: string;
    risk: 'Low' | 'Medium' | 'High';
    tasksTotal: number;
    tasksCompleted: number;
}

type TabKey = 'All' | 'Pending Review' | 'Enrolled' | 'Active' | 'Completed' | 'Ineligible';

const STATUS_MAP: Record<string, string> = {
    RECRUITING: 'Recruiting', PENDING_REVIEW: 'Pending Review',
    ELIGIBLE: 'Eligible', INELIGIBLE: 'Not Eligible',
    ENROLLED: 'Enrolled', CONSENTED: 'Consented',
    RANDOMIZED: 'Randomized', ACTIVE: 'Active',
    COMPLETED: 'Completed', DROPPED: 'Dropped', NEW: 'New',
};

const getStatusStyle = (raw: string) => {
    switch (raw?.toUpperCase()) {
        case 'ENROLLED':    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
        case 'ACTIVE':
        case 'RANDOMIZED':  return 'text-green-400 bg-green-500/10 border-green-500/30';
        case 'PENDING_REVIEW': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
        case 'CONSENTED':   return 'text-teal-400 bg-teal-500/10 border-teal-500/30';
        case 'COMPLETED':   return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
        case 'INELIGIBLE':
        case 'DROPPED':     return 'text-red-400 bg-red-500/10 border-red-500/20';
        default:            return 'text-slate-400 bg-white/5 border-white/10';
    }
};

// ─── Compensation Modal ───────────────────────────────────────────────────────
function CompensationModal({
    participant,
    onClose,
    onSuccess,
}: {
    participant: ParticipantRow;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('Participation Reward');
    const [method, setMethod] = useState('GIFT_CARD');
    const [txType, setTxType] = useState('VISIT_COMPLETION');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount.'); return; }
        setIsSaving(true); setError(null);
        try {
            const res = await authFetch(`${API}/api/compensations/`, {
                method: 'POST',
                body: JSON.stringify({
                    participant: participant.id,
                    study: participant.study_id,
                    transaction_type: txType,
                    description,
                    amount: parseFloat(amount),
                    payment_method: method,
                    status: 'PENDING',
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || err.error || 'Failed to create compensation');
            }
            onSuccess();
            onClose();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                className="bg-[#0B101B] border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl space-y-5"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white uppercase italic tracking-tight">Send Compensation</h3>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{participant.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Study Badge */}
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Study: </span>
                    <span className="text-[11px] font-black text-blue-400 uppercase">{participant.study}</span>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Amount (USD)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-lg">$</span>
                        <input
                            type="number" min="0" step="0.01"
                            value={amount} onChange={e => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-4 py-3 text-[15px] text-white font-black outline-none focus:border-emerald-500/50 transition-all"
                        />
                    </div>
                </div>

                {/* Transaction Type */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Transaction Type</label>
                    <select
                        value={txType} onChange={e => setTxType(e.target.value)}
                        className="w-full bg-[#0F1929] border border-white/10 rounded-2xl px-4 py-3 text-[12px] text-white font-black uppercase tracking-widest outline-none focus:border-blue-500/50 transition-all"
                    >
                        <option value="VISIT_COMPLETION">Visit Completion</option>
                        <option value="STUDY_COMPLETION">Study Completion</option>
                        <option value="TASK_COMPLETION">Task Completion</option>
                        <option value="TRAVEL_REIMBURSEMENT">Travel Reimbursement</option>
                        <option value="ADVERSE_EVENT">Adverse Event</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Description</label>
                    <input
                        type="text" value={description} onChange={e => setDescription(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[12px] text-white font-bold outline-none focus:border-blue-500/50 transition-all"
                    />
                </div>

                {/* Payment Method */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Payment Method</label>
                    <select
                        value={method} onChange={e => setMethod(e.target.value)}
                        className="w-full bg-[#0F1929] border border-white/10 rounded-2xl px-4 py-3 text-[12px] text-white font-black uppercase tracking-widest outline-none focus:border-blue-500/50 transition-all"
                    >
                        <option value="GIFT_CARD">Gift Card</option>
                        <option value="CHECK">Check</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CASH">Cash</option>
                    </select>
                </div>

                {error && (
                    <p className="text-[11px] text-red-400 font-bold uppercase tracking-widest px-2">{error}</p>
                )}

                <div className="flex gap-3 pt-1">
                    <button onClick={onClose} className="flex-1 px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit} disabled={isSaving}
                        className="flex-1 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <DollarSign className="w-3.5 h-3.5" />
                        {isSaving ? 'Sending...' : 'Send Compensation'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ParticipantOversight({
    onOpenProfile, onMessage, selectedStudyId, preloadedData, isLoading: propLoading
}: {
    onOpenProfile?: (id: string) => void;
    onMessage?: (id: string) => void;
    selectedStudyId?: string | 'all';
    preloadedData?: any;
    isLoading?: boolean;
}) {
    const [activeTab, setActiveTab] = useState<TabKey>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [riskFilter, setRiskFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
    const [participants, setParticipants] = useState<ParticipantRow[]>([]);
    const [internalLoading, setInternalLoading] = useState(true);
    const isLoading = propLoading !== undefined ? propLoading : internalLoading;
    const [error, setError] = useState<string | null>(null);
    const [reviewingId, setReviewingId] = useState<string | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [reviewModal, setReviewModal] = useState<{
        id: string; name: string; decision: 'ACCEPT' | 'REJECT';
    } | null>(null);
    const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [compensationTarget, setCompensationTarget] = useState<ParticipantRow | null>(null);

    // Task count map: participantId -> { total, completed }
    const [taskCounts, setTaskCounts] = useState<Record<string, { total: number; completed: number }>>({});

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToastMsg({ text, type });
        setTimeout(() => setToastMsg(null), 3500);
    };

    const fetchParticipants = useCallback(async (isInitial = false) => {
        // If we have preloaded data for a specific study, use it instead of fetching
        if (isInitial && preloadedData?.participant_tracking && selectedStudyId && selectedStudyId !== 'all') {
            const results = preloadedData.participant_tracking;
            const mapped: ParticipantRow[] = results.map((p: any) => ({
                id: p.id,
                name: p.sid || p.name || 'Unknown Subject',
                study: preloadedData.study?.protocol_id || 'Assigned Study',
                study_id: preloadedData.study?.id || '',
                rawStatus: p.status,
                displayStatus: STATUS_MAP[p.status?.toUpperCase()] || p.status,
                progress: p.progress || 0,
                submittedAt: p.last_interaction || null,
                lastVisit: 'Tracking...',
                risk: 'Low',
                tasksTotal: p.tasks_total || 0,
                tasksCompleted: p.tasks_completed || 0,
            }));
            setParticipants(mapped);
            setInternalLoading(false);
            return;
        }

        setInternalLoading(true); setError(null);
        try {
            const [pRes, tRes] = await Promise.all([
                authFetch(`${API}/api/participants/`),
                authFetch(`${API}/api/participant-tasks/`),
            ]);
            if (!pRes.ok) throw new Error('Subject Registry Offline');
            const data = await pRes.json();
            const results = Array.isArray(data) ? data : (data.results || []);

            // Build task count map
            if (tRes.ok) {
                const tData = await tRes.json();
                const tList = Array.isArray(tData) ? tData : (tData.results || []);
                const counts: Record<string, { total: number; completed: number }> = {};
                tList.forEach((t: any) => {
                    const pid = typeof t.participant === 'object' ? (t.participant?.id || t.participant?._id) : String(t.participant || '');
                    if (!pid) return;
                    if (!counts[pid]) counts[pid] = { total: 0, completed: 0 };
                    counts[pid].total++;
                    if (t.status === 'COMPLETED') counts[pid].completed++;
                });
                setTaskCounts(counts);
            }

            const mapped: ParticipantRow[] = results.map((p: any) => ({
                id: p.id,
                name: p.user_details?.full_name || p.user_details?.decrypted_name || p.participant_sid || 'Unknown Subject',
                study: p.protocol_id || p.study_name || 'Assigned Study',
                study_id: String(p.study?.id || p.study || ''),
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
                tasksTotal: 0,
                tasksCompleted: 0,
            }));
            setParticipants(mapped);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setInternalLoading(false);
        }
    }, [preloadedData, selectedStudyId]);

    useEffect(() => { 
        if (preloadedData?.participant_tracking && selectedStudyId && selectedStudyId !== 'all') {
            fetchParticipants(true);
        } else {
            fetchParticipants();
        }
    }, [fetchParticipants, selectedStudyId, preloadedData]);

    const handleReviewDecision = async () => {
        if (!reviewModal) return;
        setReviewingId(reviewModal.id);
        try {
            const res = await authFetch(`${API}/api/participants/${reviewModal.id}/review_eligibility/`, {
                method: 'POST',
                body: JSON.stringify({ decision: reviewModal.decision, notes: reviewNotes }),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Review action failed'); }
            showToast(
                reviewModal.decision === 'ACCEPT'
                    ? `${reviewModal.name} has been enrolled successfully.`
                    : `${reviewModal.name} marked as not eligible.`,
                'success'
            );
            setReviewModal(null); setReviewNotes(''); fetchParticipants();
        } catch (e: any) {
            showToast(e.message || 'Review action failed.', 'error');
        } finally {
            setReviewingId(null);
        }
    };

    const inStudy = (p: any) => !selectedStudyId || selectedStudyId === 'all' || String(p.study_id) === String(selectedStudyId);

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
        return tabMatch && matchesSearch && matchesRisk && inStudy(p);
    });

    const pendingCount = participants.filter(p => p.rawStatus === 'PENDING_REVIEW' && inStudy(p)).length;

    const TABS: TabKey[] = ['All', 'Pending Review', 'Enrolled', 'Active', 'Completed', 'Ineligible'];
    const tabCount = (tab: TabKey) => {
        if (tab === 'All') return participants.filter(inStudy).length;
        if (tab === 'Pending Review') return participants.filter(p => p.rawStatus === 'PENDING_REVIEW' && inStudy(p)).length;
        if (tab === 'Enrolled') return participants.filter(p => p.rawStatus === 'ENROLLED' && inStudy(p)).length;
        if (tab === 'Active') return participants.filter(p => (p.rawStatus === 'ACTIVE' || p.rawStatus === 'RANDOMIZED') && inStudy(p)).length;
        if (tab === 'Completed') return participants.filter(p => p.rawStatus === 'COMPLETED' && inStudy(p)).length;
        if (tab === 'Ineligible') return participants.filter(p => (p.rawStatus === 'INELIGIBLE' || p.rawStatus === 'DROPPED') && inStudy(p)).length;
        return 0;
    };

    const handleDownload = () => {
        const headers = 'ID,Name,Study,Status,Progress,Tasks,Submitted\n';
        const rows = filteredParticipants
            .map(p => {
                const tc = taskCounts[p.id];
                return `${p.id},${p.name},${p.study},${p.displayStatus},${p.progress}%,${tc ? `${tc.completed}/${tc.total}` : 'N/A'},${p.submittedAt || 'N/A'}`;
            }).join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PARTICIPANTS_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // ── Study stats bar ────────────────────────────────────────────────────────
    const studyParticipantMap: Record<string, { name: string; count: number }> = {};
    participants.forEach(p => {
        if (!studyParticipantMap[p.study_id]) studyParticipantMap[p.study_id] = { name: p.study, count: 0 };
        studyParticipantMap[p.study_id].count++;
    });

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Toast */}
            <AnimatePresence>
                {toastMsg && (
                    <motion.div initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 80 }}
                        className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl shadow-2xl text-[12px] font-black uppercase tracking-widest flex items-center gap-3 ${toastMsg.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
                    >
                        {toastMsg.type === 'success' ? <CheckCheck className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        {toastMsg.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Compensation Modal */}
            <AnimatePresence>
                {compensationTarget && (
                    <CompensationModal
                        participant={compensationTarget}
                        onClose={() => setCompensationTarget(null)}
                        onSuccess={() => showToast(`Compensation sent for ${compensationTarget.name}`, 'success')}
                    />
                )}
            </AnimatePresence>

            {/* Review Modal */}
            <AnimatePresence>
                {reviewModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
                        onClick={(e) => { if (e.target === e.currentTarget) { setReviewModal(null); setReviewNotes(''); } }}
                    >
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0B101B] border border-white/10 rounded-[2rem] p-8 w-full max-w-lg shadow-2xl space-y-5"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${reviewModal.decision === 'ACCEPT' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                                    {reviewModal.decision === 'ACCEPT' ? <CheckCheck className="w-5 h-5 text-amber-400" /> : <X className="w-5 h-5 text-red-400" />}
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white uppercase italic tracking-tighter">
                                        {reviewModal.decision === 'ACCEPT' ? 'Enroll Participant' : 'Mark Not Eligible'}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{reviewModal.name}</p>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    {reviewModal.decision === 'ACCEPT' ? 'Enrollment Notes (optional)' : 'Rejection Reason'}
                                </label>
                                <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
                                    placeholder={reviewModal.decision === 'ACCEPT' ? 'Add any enrollment notes...' : 'Reason for ineligibility...'}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[12px] text-white font-medium outline-none focus:border-amber-500/50 transition-all resize-none min-h-[90px] placeholder:text-slate-600"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => { setReviewModal(null); setReviewNotes(''); }}
                                    className="flex-1 px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleReviewDecision} disabled={reviewingId === reviewModal.id}
                                    className={`flex-1 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 text-white ${reviewModal.decision === 'ACCEPT' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-500'}`}>
                                    {reviewingId === reviewModal.id ? 'Processing...' : reviewModal.decision === 'ACCEPT' ? 'Confirm Enrollment' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-0.5">
                    <h2 className="text-xl font-black text-white italic uppercase tracking-tight">
                        Participant <span className="text-blue-400">Oversight</span>
                    </h2>
                    <p className="text-[11px] text-white/40 font-bold uppercase tracking-[0.4em] italic">
                        Real-time Subject Portfolio & Enrollment Review
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {pendingCount > 0 && (
                        <motion.button initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            onClick={() => setActiveTab('Pending Review')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl hover:bg-amber-500/20 transition-all">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest italic">
                                {pendingCount} Pending Review{pendingCount !== 1 ? 's' : ''}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                        </motion.button>
                    )}
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input type="text" placeholder="SEARCH..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-9 pr-4 py-2.5 text-[12px] text-white font-bold outline-none focus:border-amber-500/50 transition-all w-56 uppercase tracking-widest placeholder:text-slate-600"
                        />
                    </div>
                    <div className="relative">
                        <button onClick={() => setFilterOpen(!filterOpen)}
                            className={`p-2.5 border rounded-2xl transition-all ${filterOpen ? 'bg-amber-600 text-slate-950 border-white/20' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-amber-600 hover:text-white'}`}>
                            <Filter className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                            {filterOpen && (
                                <motion.div initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.95 }}
                                    className="absolute right-0 mt-3 w-44 bg-[#0B101B] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                                    <div className="p-3 border-b border-white/5">
                                        <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest italic">Risk Level</p>
                                    </div>
                                    <div className="p-2">
                                        {(['All', 'Low', 'Medium', 'High'] as const).map(risk => (
                                            <button key={risk} onClick={() => { setRiskFilter(risk); setFilterOpen(false); }}
                                                className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${riskFilter === risk ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                                                {risk} {riskFilter === risk && <CheckCircle2 size={11} />}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button onClick={handleDownload} className="p-2.5 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-blue-600 transition-all">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Study Stats Bar (shows participant counts per study) */}
            {Object.keys(studyParticipantMap).length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {Object.entries(studyParticipantMap).map(([sid, info]) => (
                        <div key={sid} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                            <Users className="w-3 h-3 text-blue-400" />
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{info.name}</span>
                            <span className="text-[11px] font-black text-white">{info.count}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <div className="flex flex-nowrap overflow-x-auto gap-1.5 p-1 bg-[#0B101B]/60 border border-white/5 rounded-2xl w-fit custom-scrollbar-horizontal">
                {TABS.map(tab => {
                    const count = tabCount(tab);
                    const isPending = tab === 'Pending Review';
                    return (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`relative px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>
                            {tab}
                            {count > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === tab ? 'bg-white/20 text-white' : isPending ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-slate-400'}`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Table */}
            <div className="overflow-x-auto custom-scrollbar-horizontal">
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Skeleton variant="circle" size="w-10 h-10" dark={true} />
                                    <div className="space-y-2">
                                        <Skeleton variant="text" className="w-48 h-3" dark={true} />
                                        <Skeleton variant="text" className="w-32 h-2 opacity-50" dark={true} />
                                    </div>
                                </div>
                                <div className="hidden md:flex items-center gap-8">
                                    <Skeleton variant="text" className="w-24 h-2 opacity-30" dark={true} />
                                    <Skeleton variant="text" className="w-24 h-2 opacity-30" dark={true} />
                                </div>
                                <Skeleton variant="text" className="w-20 h-6 rounded-full" dark={true} />
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="py-24 flex flex-col items-center gap-4">
                        <AlertCircle className="w-10 h-10 text-red-500/50" />
                        <p className="text-[12px] text-red-400 font-bold uppercase italic">{error}</p>
                        <button onClick={fetchParticipants} className="text-[11px] font-black text-white px-5 py-2 bg-white/5 rounded-full hover:bg-white/10 transition-all uppercase tracking-widest">Retry</button>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse min-w-[1100px] border-t border-white/5">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5 whitespace-nowrap">
                                <th className="px-6 py-5 text-[11px] font-black text-white/60 uppercase tracking-widest italic border-r border-white/5">Subject</th>
                                <th className="px-6 py-5 text-[11px] font-black text-white/60 uppercase tracking-widest italic border-r border-white/5">Status</th>
                                <th className="px-6 py-5 text-[11px] font-black text-white/60 uppercase tracking-widest italic border-r border-white/5">Tasks</th>
                                <th className="px-6 py-5 text-[11px] font-black text-white/60 uppercase tracking-widest italic border-r border-white/5">Progress</th>
                                <th className="px-6 py-5 text-[11px] font-black text-white/60 uppercase tracking-widest italic border-r border-white/5">Submitted</th>
                                <th className="px-6 py-5 text-[11px] font-black text-white/60 uppercase tracking-widest italic text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <AnimatePresence mode="popLayout">
                                {filteredParticipants.map(p => {
                                    const tc = taskCounts[p.id];
                                    const tasksDone = tc?.completed ?? 0;
                                    const tasksTotal = tc?.total ?? 0;
                                    const allTasksDone = tasksTotal > 0 && tasksDone === tasksTotal;
                                    const canPay = ['ENROLLED','ACTIVE','RANDOMIZED','CONSENTED','COMPLETED'].includes(p.rawStatus?.toUpperCase());
                                    return (
                                        <motion.tr key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className={`hover:bg-white/[0.02] transition-colors group ${p.rawStatus === 'PENDING_REVIEW' ? 'bg-amber-500/[0.03]' : ''}`}>

                                            {/* Subject */}
                                            <td className="px-6 py-5 whitespace-nowrap align-middle border-r border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl border ${p.rawStatus === 'PENDING_REVIEW' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-black text-white italic uppercase tracking-tight group-hover:text-amber-400 transition-colors">{p.name}</p>
                                                        <p className="text-[10px] text-white/30 font-black tracking-widest mt-1 uppercase font-mono">{p.study}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-5 align-middle border-r border-white/5">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-widest ${getStatusStyle(p.rawStatus)}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full bg-current ${p.rawStatus === 'PENDING_REVIEW' ? 'animate-ping' : 'animate-pulse'}`} />
                                                    {p.displayStatus}
                                                </div>
                                            </td>

                                            {/* Tasks */}
                                            <td className="px-6 py-5 align-middle border-r border-white/5">
                                                {tasksTotal > 0 ? (
                                                    <div className="flex items-center gap-2">
                                                        {allTasksDone
                                                            ? <CheckSquare className="w-4 h-4 text-emerald-400" />
                                                            : <ListChecks className="w-4 h-4 text-blue-400" />}
                                                        <span className={`text-[12px] font-black ${allTasksDone ? 'text-emerald-400' : 'text-white'}`}>
                                                            {tasksDone}/{tasksTotal}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">done</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-slate-600 font-bold uppercase tracking-widest">—</span>
                                                )}
                                            </td>

                                            {/* Progress */}
                                            <td className="px-6 py-5 align-middle border-r border-white/5">
                                                <div className="w-36 space-y-1.5">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">Compliance</span>
                                                        <span className="text-[11px] font-black text-white">{p.progress}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${p.progress}%` }}
                                                            className={`h-full rounded-full ${p.rawStatus === 'PENDING_REVIEW' ? 'bg-blue-500' : p.rawStatus === 'ENROLLED' || p.rawStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Submitted */}
                                            <td className="px-6 py-5 whitespace-nowrap align-middle border-r border-white/5">
                                                <div className="flex items-center gap-2 text-slate-500 font-black italic">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] uppercase tracking-widest">
                                                        {p.submittedAt
                                                            ? new Date(p.submittedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                                                            : 'Not Submitted'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-5 align-middle">
                                                <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                                    {p.rawStatus === 'PENDING_REVIEW' && (
                                                        <>
                                                            <button onClick={() => setReviewModal({ id: p.id, name: p.name, decision: 'ACCEPT' })}
                                                                className="px-4 py-2 bg-blue-600 hover:bg-white hover:text-blue-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5">
                                                                <CheckCheck className="w-3 h-3" /> Enroll
                                                            </button>
                                                            <button onClick={() => setReviewModal({ id: p.id, name: p.name, decision: 'REJECT' })}
                                                                className="px-4 py-2 bg-red-600/80 hover:bg-white hover:text-red-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5">
                                                                <X className="w-3 h-3" /> Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {/* Send Compensation — only for enrolled/active/completed */}
                                                    {canPay && (
                                                        <button onClick={() => setCompensationTarget(p)}
                                                            className="px-4 py-2 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 shadow-lg shadow-emerald-600/20">
                                                            <DollarSign className="w-3 h-3" /> Pay
                                                        </button>
                                                    )}
                                                    <button onClick={() => onMessage?.(p.id)}
                                                        className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95">
                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => onOpenProfile?.(p.id)}
                                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white hover:text-slate-950 shadow-lg active:scale-95 transition-all">
                                                        Profile <ChevronRight className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                )}
                {filteredParticipants.length === 0 && !isLoading && !error && (
                    <div className="py-24 text-center space-y-3">
                        <ClipboardList className="w-10 h-10 text-slate-800 mx-auto" />
                        <p className="text-[11px] text-slate-600 font-black uppercase tracking-[0.2em] italic">
                            {activeTab === 'Pending Review' ? 'No participants pending review' : 'No participants match your criteria'}
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
