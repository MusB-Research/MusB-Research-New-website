import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar,
    ChevronUp,
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    XCircle, 
    ChevronRight, 
    ChevronDown, 
    Plus, 
    Search, 
    Filter, 
    MoreHorizontal, 
    Activity, 
    Thermometer, 
    Droplet, 
    FileText, 
    Flag,
    Clipboard, 
    ShieldAlert, 
    Edit3, 
    ArrowRight, 
    User, 
    MapPin, 
    X,
    History,
    MoreVertical,
    Check,
    MessageSquare,
    Save,
    Lock,
    ExternalLink,
    LayoutGrid,
    Users,
    RefreshCw,
    Stethoscope
} from 'lucide-react';
import { API, authFetch } from '../../utils/auth';

interface Assessment {
    id: string;
    name: string;
    status: 'Completed' | 'Pending' | 'Locked';
}

interface Visit {
    id: string;
    name: string;
    scheduledDate: string;
    status: 'Completed' | 'Scheduled' | 'Missed' | 'Overdue' | 'Not Scheduled' | 'In Progress';
    window: string;
    actualDate?: string | null;
    checklist: { item: string; done: boolean; time?: string; user?: string }[];
    assessments: Assessment[];
    vitals: { weight: number | string; height: number | string; bmi: number | string; bp: string; hr: number | string; temp: number | string };
    meds: { dispensed: string; dose: string; compliance: number };
}

interface AEReport {
    id: string;
    description: string;
    start_date: string;
    severity: 'MILD' | 'MODERATE' | 'SEVERE';
    is_ongoing: boolean;
    related_to_product: 'YES' | 'NO' | 'UNSURE';
    action_taken: string;
}

interface Participant {
    id: string;
    db_id: string;
    status: 'Screening' | 'Active' | 'Completed';
    coordinator: string;
    nextVisitDue: string;
    study: string;
    study_id: string;
    visits: Visit[];
    aeReports: AEReport[];
}

export default function VisitsModule({ selectedStudyId }: { selectedStudyId?: string }) {
    const [viewMode, setViewMode] = useState<'Timeline' | 'Calendar'>('Timeline');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [globalTasks, setGlobalTasks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [allStudies, setAllStudies] = useState<any[]>([]);
    const [studyTasks, setStudyTasks] = useState<any[]>([]);
    const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
    const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [openAccordion, setOpenAccordion] = useState<string | null>('Checklist');
    const [tempVitals, setTempVitals] = useState({ weight: 78.5, height: 1.82 });
    const [viewDate, setViewDate] = useState(new Date());
    const [scheduleData, setScheduleData] = useState({ 
        studyId: '',
        participantId: '', 
        visitType: 'Baseline / Dosing', 
        taskId: '',
        date: new Date().toISOString().split('T')[0], 
        time: '09:00' 
    });
    const [problemData, setProblemData] = useState({
        description: '',
        severity: 'MILD' as 'MILD' | 'MODERATE' | 'SEVERE',
        start_date: new Date().toISOString().split('T')[0],
        is_ongoing: true,
        related_to_product: 'UNSURE' as 'YES' | 'NO' | 'UNSURE',
        action_taken: ''
    });

    const apiUrl = API || 'http://localhost:8000';

    // ─── DATA LOADING ────────────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [pRes, sRes, tRes] = await Promise.all([
                authFetch(`${apiUrl}/api/participants/`),
                authFetch(`${apiUrl}/api/studies/`),
                authFetch(`${apiUrl}/api/participant-tasks/`)
            ]);

            if (pRes.ok) {
                const data = await pRes.json();
                if (!Array.isArray(data)) {
                    console.error("[Clinical Sync] Dataset malformation:", data);
                    setParticipants([]);
                    return;
                }
                const mapped: Participant[] = data.map((p: any) => ({
                    id: p.participant_sid || p.id,
                    db_id: p.id,
                    status: p.status === 'ACTIVE' ? 'Active' : p.status === 'SCREENING' ? 'Screening' : (p.status || 'Active'),
                    coordinator: p.coordinator_name || 'Coordinator Unassigned',
                    nextVisitDue: p.next_visit_date || 'N/A',
                    study: p.study_name || 'General Protocol',
                    study_id: p.study,
                    visits: (Array.isArray(p.visits) ? p.visits : []).map((v: any) => ({
                        id: v.id,
                        name: v.visit_type || 'Unspecified Visit',
                        scheduledDate: v.scheduled_date ? new Date(v.scheduled_date).toLocaleDateString() : 'N/A',
                        status: v.status === 'COMPLETED' ? 'Completed' : v.status === 'SCHEDULED' ? 'Scheduled' : 'Overdue',
                        window: '±3 days',
                        actualDate: v.actual_date,
                        checklist: (Array.isArray(v.checklist) ? v.checklist : []).map((inner: any) => ({
                            item: inner.label || inner.item || 'Required Task',
                            done: !!(inner.checked || inner.done),
                            time: inner.time,
                            user: inner.by || inner.user
                        })),
                        assessments: Array.isArray(v.assessments) ? v.assessments : [],
                        vitals: v.measurements || { weight: 0, height: 0, bmi: 0, bp: 'N/A', hr: 0, temp: 0 },
                        meds: (Array.isArray(v.dispensing) && v.dispensing.length > 0) ? {
                            dispensed: v.dispensing[0].product || 'N/A',
                            dose: v.dispensing[0].dose || 'N/A',
                            compliance: v.dispensing[0].compliance || 100
                        } : { dispensed: 'N/A', dose: 'N/A', compliance: 100 }
                    })),
                    aeReports: (Array.isArray(p.ae_reports) ? p.ae_reports : []).map((ae: any) => ({
                        id: ae.id,
                        description: ae.description || '',
                        start_date: ae.start_date,
                        severity: ae.severity || 'MILD',
                        is_ongoing: !!ae.is_ongoing,
                        related_to_product: ae.related_to_product || 'UNSURE',
                        action_taken: ae.action_taken || ''
                    }))
                }));
                setParticipants(mapped);
            } else {
                console.warn("[Clinical Sync] Dataset access restricted or unavailable:", pRes.status);
                setParticipants([]);
            }


            if (sRes.ok) setAllStudies(await sRes.json());
            if (tRes.ok) setGlobalTasks(await tRes.json());

        } catch (error) {
            console.error("Clinical sync failure:", error);
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl]);

    // Initial load
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle initial selection & filtering
    const filteredParticipants = useMemo(() => {
        let list = participants;
        if (selectedStudyId && selectedStudyId !== 'all') {
            list = list.filter(p => p.study_id === selectedStudyId || p.study === selectedStudyId);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            list = list.filter(p => p.id.toLowerCase().includes(query) || 
                                p.coordinator.toLowerCase().includes(query));
        }
        return list;
    }, [participants, selectedStudyId, searchQuery]);

    useEffect(() => {
        if (filteredParticipants.length > 0) {
            // Auto-select first if nothing selected or current selection is NOT in filtered list
            if (!selectedParticipantId || !filteredParticipants.find(p => p.id === selectedParticipantId)) {
                setSelectedParticipantId(filteredParticipants[0].id);
                if (filteredParticipants[0].visits.length > 0) {
                    setSelectedVisitId(filteredParticipants[0].visits[0].id);
                }
            }
        } else {
            setSelectedParticipantId(null);
            setSelectedVisitId(null);
        }
    }, [filteredParticipants, selectedParticipantId]);


    // ─── COMPUTED STATE ──────────────────────────────────────────────────────
    const selectedParticipant = useMemo(() => 
        participants.find(p => p.id === selectedParticipantId) || null,
    [participants, selectedParticipantId]);

    const selectedVisit = useMemo(() => 
        selectedParticipant?.visits?.find(v => v.id === selectedVisitId) || selectedParticipant?.visits?.[0] || null,
    [selectedParticipant, selectedVisitId]);

    const bmi = useMemo(() => {
        if (!tempVitals.weight || !tempVitals.height) return 0;
        return parseFloat((tempVitals.weight / (tempVitals.height * tempVitals.height)).toFixed(1));
    }, [tempVitals]);


    // ─── ACTIONS ─────────────────────────────────────────────────────────────
    const handleSignOff = async (action: 'Approve' | 'Flag') => {
        if (!selectedVisit) return;
        const confirmMsg = action === 'Approve' ? 'Confirm clinical sign-off for this visit?' : 'Flag this visit for PI review?';
        
        if (window.confirm(confirmMsg)) {
            try {
                const payload = {
                    status: action === 'Approve' ? 'COMPLETED' : 'SCHEDULED',
                    pi_approved: action === 'Approve',
                    locked: action === 'Approve'
                };

                const res = await authFetch(`${apiUrl}/api/visits/${selectedVisit.id}/`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload)
                });

                if (res.ok) await loadData();
                else alert("Persistence Failure: Network error");
            } catch (err) {
                alert("Signal Interference: Network error");
            }
        }
    };

    const handleScheduleConfirm = async () => {
        if (!scheduleData.participantId || !scheduleData.date) {
            alert('Selection Required: Please specify a participant and scheduled epoch.');
            return;
        }

        const targetParticipant = participants.find(p => p.id === scheduleData.participantId);
        if (!targetParticipant) return;

        try {
            const visitResp = await authFetch(`${apiUrl}/api/visits/`, {
                method: 'POST',
                body: JSON.stringify({
                    participant: targetParticipant.db_id,
                    visit_type: scheduleData.visitType,
                    scheduled_date: `${scheduleData.date}T${scheduleData.time || '09:00'}:00Z`,
                    status: 'SCHEDULED',
                    location: 'Clinic'
                })
            });

            if (scheduleData.taskId) {
                await authFetch(`${apiUrl}/api/participant-tasks/`, {
                    method: 'POST',
                    body: JSON.stringify({
                        participant: targetParticipant.db_id,
                        task: scheduleData.taskId,
                        due_date: `${scheduleData.date}T${scheduleData.time || '09:00'}:00Z`,
                        status: 'PENDING',
                        visit_name: scheduleData.visitType
                    })
                });
            }

            if (visitResp.ok) {
                setIsScheduleOpen(false);
                loadData();
            } else {
                alert("Protocol Sync Error: Failed to persist visit data.");
            }
        } catch (err) {
            console.error("Clinical Scheduling Failure:", err);
            alert("Network interference detected during scheduling.");
        }
    };

    const handleProblemConfirm = async () => {
        if (!selectedParticipant || !problemData.description) {
            alert('Description Required: Please describe the medical concern.');
            return;
        }

        try {
            const res = await authFetch(`${apiUrl}/api/ae-reports/`, {
                method: 'POST',
                body: JSON.stringify({
                    participant: selectedParticipant.db_id,
                    description: problemData.description,
                    severity: problemData.severity,
                    start_date: new Date(problemData.start_date).toISOString(),
                    is_ongoing: problemData.is_ongoing,
                    related_to_product: problemData.related_to_product,
                    action_taken: problemData.action_taken
                })
            });

            if (res.ok) {
                setIsProblemModalOpen(false);
                setProblemData({
                    description: '',
                    severity: 'MILD',
                    start_date: new Date().toISOString().split('T')[0],
                    is_ongoing: true,
                    related_to_product: 'UNSURE',
                    action_taken: ''
                });
                loadData();
            } else {
                alert("Persistence Error: Failed to log clinical concern.");
            }
        } catch (err) {
            console.error("Clinical Reporting Failure:", err);
            alert("Network interference detected during reporting.");
        }
    };

    const getStatusColor = (status: Visit['status']) => {
        switch (status) {
            case 'Completed': return 'emerald';
            case 'Scheduled': return 'indigo';
            case 'Overdue': return 'red';
            case 'Missed': return 'red';
            default: return 'slate';
        }
    };

    // ─── CALENDAR LOGIC ──────────────────────────────────────────────────────
    const calendarData = useMemo(() => {
        if (!viewDate) return { daysInMonth: 0, firstDay: 0, sessionsByDate: {} };
        
        const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
        const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
        const sessionsByDate: Record<string, any[]> = {};
        
        participants.forEach(p => {
            (p.visits || []).forEach(v => {
                if (!v.scheduledDate || v.scheduledDate === 'N/A') return;
                try {
                    const d = new Date(v.scheduledDate).toISOString().split('T')[0];
                    if (!sessionsByDate[d]) sessionsByDate[d] = [];
                    sessionsByDate[d].push({ type: 'VISIT', label: `${p.id}: ${v.name}`, status: v.status });
                } catch { /* skip */ }
            });
        });

        globalTasks.forEach(t => {
            if (!t.due_date) return;
            try {
                const d = new Date(t.due_date).toISOString().split('T')[0];
                if (!sessionsByDate[d]) sessionsByDate[d] = [];
                sessionsByDate[d].push({ type: 'TASK', label: t.title, status: t.status, participant: t.participant_name || 'Subject' });
            } catch { /* skip */ }
        });

        return { daysInMonth, firstDay, sessionsByDate };
    }, [viewDate, participants, globalTasks]);

    const renderCalendar = () => {
        const { daysInMonth, firstDay, sessionsByDate } = calendarData;
        const monthYear = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        return (
            <div className="flex-1 flex flex-col p-6 lg:p-12 space-y-8 overflow-y-auto no-scrollbar">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                    <div className="space-y-1">
                        <h2 className="text-3xl lg:text-4xl font-black text-white italic uppercase tracking-tighter">Site <span className="text-indigo-500">Calendar</span></h2>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] italic">{monthYear} • Protocol Sync: ACTIVE</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5 self-start">
                        <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                            <ChevronDown className="w-5 h-5 rotate-90 text-slate-400" />
                        </button>
                        <span className="text-sm font-black text-white px-2 uppercase italic tracking-widest min-w-[150px] text-center">{monthYear}</span>
                        <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                            <ChevronDown className="w-5 h-5 -rotate-90 text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-[2rem] lg:rounded-[3rem] overflow-hidden shadow-2xl">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="bg-[#0D1424] p-4 lg:p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center border-b border-white/5 italic">
                            {d}
                        </div>
                    ))}
                    {Array.from({ length: 42 }).map((_, i) => {
                        const dayNum = i - firstDay + 1;
                        const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                        const currentDayDate = isCurrentMonth ? new Date(viewDate.getFullYear(), viewDate.getMonth(), dayNum) : null;
                        const dateString = currentDayDate ? currentDayDate.toISOString().split('T')[0] : '';
                        const daySessions = sessionsByDate[dateString] || [];

                        return (
                            <div key={i} className={`min-h-[120px] lg:min-h-[160px] bg-[#0B101B] p-2 lg:p-4 border-r border-b border-white/[0.03] transition-all hover:bg-white/[0.02] ${!isCurrentMonth ? 'opacity-10' : ''}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-base lg:text-lg font-black italic ${currentDayDate?.toDateString() === new Date().toDateString() ? 'text-indigo-500' : 'text-slate-600'}`}>
                                        {isCurrentMonth ? dayNum : ''}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {daySessions.slice(0, 3).map((s, idx) => (
                                        <div key={idx} className={`p-1.5 rounded-lg border text-[9px] font-black uppercase tracking-tighter truncate ${
                                            s.type === 'VISIT' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                        }`}>
                                            {s.label}
                                        </div>
                                    ))}
                                    {daySessions.length > 3 && (
                                        <p className="text-[9px] text-slate-700 font-bold italic text-center">+{daySessions.length - 3} MORE</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ─── MAIN RENDER ─────────────────────────────────────────────────────────

    return (
        <div className="max-w-[1920px] mx-auto flex flex-col h-[calc(100vh-14rem)] bg-[#0B101B] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            
            {/* Overlays */}
            {isLoading && (
                <div className="absolute inset-0 z-[100] bg-[#0B101B]/90 backdrop-blur-md flex flex-col items-center justify-center">
                    <Activity className="w-12 h-12 text-indigo-500 animate-pulse mb-6" />
                    <h2 className="text-xl font-black text-white italic uppercase tracking-[0.2em]">Synchronizing Records</h2>
                </div>
            )}

            {!isLoading && participants.length === 0 && (
                <div className="absolute inset-0 z-[100] bg-[#0B101B] flex flex-col items-center justify-center p-12 text-center">
                    <Users className="w-16 h-16 text-slate-800 mb-8" />
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">No Subjects Found</h3>
                    <p className="text-slate-500 max-w-md mx-auto mt-4 uppercase text-[10px] font-black tracking-widest">The participant pool is currently empty for the selected study context.</p>
                </div>
            )}

            {/* Header Bar */}
            <div className="flex-shrink-0 px-6 lg:px-10 py-4 lg:py-8 bg-[#0B101B]/80 backdrop-blur-3xl border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 z-40">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <h2 className="text-xl lg:text-2xl font-black text-white italic uppercase tracking-tighter">Visits & Assessments</h2>
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 self-start">
                        {(['Timeline', 'Calendar'] as const).map(mode => (
                            <button key={mode} onClick={() => setViewMode(mode)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative w-64 hidden xl:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input type="text" placeholder="Search Subjects..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-[10px] text-white uppercase outline-none focus:border-indigo-500/50" />
                    </div>
                    <button onClick={() => setIsScheduleOpen(true)} className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                        + Schedule Flow
                    </button>
                    <button onClick={() => setIsProblemModalOpen(true)} className="px-6 py-3 bg-red-600/20 text-red-500 border border-red-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600/30 transition-all shadow-xl shadow-red-900/10">
                        + Report Problem
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {viewMode === 'Timeline' ? (
                    <>
                        {/* Sidebar */}
                        <div className="w-full lg:w-80 h-[200px] lg:h-full border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col bg-white/[0.01] shrink-0">
                            <div className="flex-1 overflow-x-auto lg:overflow-y-auto no-scrollbar p-4 lg:p-6 space-y-4">
                                {filteredParticipants.map(p => (
                                    <button key={p.id} onClick={() => setSelectedParticipantId(p.id)} className={`w-full text-left p-6 rounded-[2rem] border transition-all relative group overflow-hidden ${selectedParticipantId === p.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[12px] font-black text-white italic uppercase tracking-wider">{p.id}</span>
                                            <div className={`w-2 h-2 rounded-full ${p.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                                        </div>
                                        <p className="text-[10px] text-indigo-400/60 font-black uppercase tracking-widest italic truncate">{p.coordinator}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Center Panel */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12 bg-[#0B101B]">
                            {!selectedParticipant ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                                    <Users className="w-20 h-20 mb-6" />
                                    <p className="text-[10px] uppercase font-black tracking-widest">Select Subject to View Pipeline</p>
                                </div>
                            ) : (
                                <div className="max-w-4xl mx-auto space-y-16">
                                    <section>
                                        <div className="flex items-end justify-between mb-12">
                                            <div>
                                                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Clinical Execution</h3>
                                                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mt-2 italic">{selectedParticipant.id} • {selectedParticipant.study}</p>
                                            </div>
                                        </div>

                                        <div className="relative flex items-center justify-between px-10">
                                            <div className="absolute left-10 right-10 top-[calc(50%-12px)] h-px bg-white/5" />
                                            {selectedParticipant.visits.map(v => (
                                                <button key={v.id} onClick={() => setSelectedVisitId(v.id)} className="relative flex flex-col items-center gap-4 z-10 group">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 transition-all ${v.id === selectedVisitId ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.4)]' : 'bg-white/5 border-white/5'}`}>
                                                        {v.status === 'Completed' ? <Check className="w-6 h-6 text-emerald-400" /> : <div className="w-3 h-3 rounded-full bg-slate-700" />}
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[10px] text-white font-black italic">{v.name}</p>
                                                        <p className="text-[9px] text-slate-600 uppercase font-black mt-1">{v.scheduledDate}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[2.5rem] flex items-center gap-6">
                                            <Activity className="w-10 h-10 text-indigo-500" />
                                            <div>
                                                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest italic">Protocol Progress</p>
                                                <p className="text-4xl font-black text-white italic tracking-tighter mt-1">{Math.round((selectedParticipant.visits.filter(v => v.status === 'Completed').length / (selectedParticipant.visits.length || 1)) * 100)}%</p>
                                            </div>
                                        </div>
                                        <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] flex flex-col justify-center">
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic mb-2">Next Target window</p>
                                            <p className="text-sm font-black text-white italic uppercase tracking-tight">{selectedParticipant.nextVisitDue}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Panel */}
                        <div className="w-full lg:w-[450px] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col bg-white/[0.02] shrink-0">
                            {!selectedVisit ? (
                                <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                                    <Stethoscope className="w-16 h-16 mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest italic">Awaiting Selection</p>
                                </div>
                            ) : (
                                <>
                                    <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{selectedVisit.name}</h4>
                                                <p className="text-lg font-black text-white italic uppercase tracking-tighter mt-1">Core Metrics</p>
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-${getStatusColor(selectedVisit.status)}-500/10 text-${getStatusColor(selectedVisit.status)}-400 border border-${getStatusColor(selectedVisit.status)}-500/20`}>
                                                {selectedVisit.status}
                                            </span>
                                        </div>
                                        <div className="flex gap-4">
                                            <button className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all">Capture Vitals</button>
                                            <button className="p-4 bg-white/5 rounded-2xl border border-white/10"><MoreHorizontal className="w-5 h-5 text-slate-500"/></button>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-4">
                                        {/* Accordion 1: Visit Checklist */}
                                        <div className="border border-white/5 rounded-[2rem] overflow-hidden bg-white/[0.01]">
                                            <button 
                                                onClick={() => setOpenAccordion(openAccordion === 'Checklist' ? null : 'Checklist')}
                                                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <Clipboard className="w-4 h-4 text-indigo-400" />
                                                    <span className="text-[10px] font-black text-white uppercase italic tracking-widest">Protocol Checklist</span>
                                                </div>
                                                {openAccordion === 'Checklist' ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                                            </button>
                                            {openAccordion === 'Checklist' && (
                                                <div className="px-6 pb-6 space-y-3">
                                                    {(selectedVisit?.checklist || []).map((item, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                                            <span className={`text-[11px] font-bold italic uppercase tracking-tight ${item.done ? 'text-slate-400' : 'text-white'}`}>{item.item}</span>
                                                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-transparent border-white/10'}`}>
                                                                {item.done && <Check className="w-3.5 h-3.5" />}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Accordion 2: Vitals */}
                                        <div className="border border-white/5 rounded-[2rem] overflow-hidden bg-white/[0.01]">
                                            <button 
                                                onClick={() => setOpenAccordion(openAccordion === 'Vitals' ? null : 'Vitals')}
                                                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <Activity className="w-4 h-4 text-indigo-400" />
                                                    <span className="text-[10px] font-black text-white uppercase italic tracking-widest">Vitals & Metrics</span>
                                                </div>
                                                {openAccordion === 'Vitals' ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                                            </button>
                                            {openAccordion === 'Vitals' && (
                                                <div className="px-6 pb-6 space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                            <p className="text-[9px] text-slate-600 uppercase font-black mb-1">Weight (kg)</p>
                                                            <input 
                                                                type="number" 
                                                                value={tempVitals.weight} 
                                                                onChange={e => setTempVitals(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                                                                className="w-full bg-transparent text-lg font-black text-white outline-none"
                                                            />
                                                        </div>
                                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                            <p className="text-[9px] text-slate-600 uppercase font-black mb-1">Height (m)</p>
                                                            <input 
                                                                type="number" 
                                                                value={tempVitals.height} 
                                                                onChange={e => setTempVitals(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                                                                className="w-full bg-transparent text-lg font-black text-white outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex justify-between items-center">
                                                        <div>
                                                            <p className="text-[9px] text-indigo-400 font-black uppercase">Calculated BMI</p>
                                                            <p className="text-xl font-black text-white italic">{bmi}</p>
                                                        </div>
                                                        <span className="px-2 py-1 bg-indigo-600/20 text-indigo-400 text-[8px] font-black uppercase tracking-widest rounded">Stable</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Accordion 3: Medication */}
                                        <div className="border border-white/5 rounded-[2rem] overflow-hidden bg-white/[0.01]">
                                            <button 
                                                onClick={() => setOpenAccordion(openAccordion === 'Meds' ? null : 'Meds')}
                                                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <Droplet className="w-4 h-4 text-indigo-400" />
                                                    <span className="text-[10px] font-black text-white uppercase italic tracking-widest">Medication Tracking</span>
                                                </div>
                                                {openAccordion === 'Meds' ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                                            </button>
                                            {openAccordion === 'Meds' && (
                                                <div className="px-6 pb-6 space-y-4">
                                                    <div className="p-4 border border-white/5 rounded-2xl bg-white/5">
                                                        <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Active Dispensation</p>
                                                        <p className="text-sm font-black text-white uppercase italic">{selectedVisit?.meds?.dispensed || 'No medication assigned'}</p>
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <span className="text-[9px] text-slate-600 uppercase">Compliance:</span>
                                                            <span className="text-[9px] text-indigo-400 font-bold">{selectedVisit?.meds?.compliance || 0}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Accordion 4: Medical Concerns */}
                                        <div className="border border-white/5 rounded-[2rem] overflow-hidden bg-white/[0.01]">
                                            <button 
                                                onClick={() => setOpenAccordion(openAccordion === 'Concerns' ? null : 'Concerns')}
                                                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <ShieldAlert className="w-4 h-4 text-red-400" />
                                                    <span className="text-[10px] font-black text-white uppercase italic tracking-widest">Medical Concerns</span>
                                                </div>
                                                {openAccordion === 'Concerns' ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                                            </button>
                                            {openAccordion === 'Concerns' && (
                                                <div className="px-6 pb-6 space-y-4">
                                                    {(selectedParticipant?.aeReports || []).length === 0 ? (
                                                        <p className="text-[10px] text-slate-600 italic text-center py-4 uppercase font-black tracking-widest">No active medical findings</p>
                                                    ) : (
                                                        selectedParticipant?.aeReports.map((ae, idx) => (
                                                            <div key={idx} className="p-4 border border-white/5 rounded-2xl bg-white/5 space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                                                        ae.severity === 'SEVERE' ? 'bg-red-500/20 text-red-400' : 
                                                                        ae.severity === 'MODERATE' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                                                                    }`}>{ae.severity}</span>
                                                                    <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">{new Date(ae.start_date).toLocaleDateString()}</span>
                                                                </div>
                                                                <p className="text-[11px] font-bold text-white uppercase italic leading-relaxed">{ae.description}</p>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <span className="text-[8px] text-slate-600 uppercase font-black">Action:</span>
                                                                    <span className="text-[8px] text-indigo-400 font-bold uppercase">{ae.action_taken || 'Monitoring'}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-8 border-t border-white/5 mt-auto bg-[#0B101B]/95 backdrop-blur-xl">
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <button onClick={() => handleSignOff('Approve')} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/40 hover:scale-[1.02] transition-all">
                                                Approve Visit
                                            </button>
                                            <button onClick={() => handleSignOff('Flag')} className="p-4 bg-white/5 border border-white/5 text-red-500/60 rounded-2xl hover:text-red-400 transition-all">
                                                <Flag className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    renderCalendar()
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isScheduleOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsScheduleOpen(false)} className="fixed inset-0 bg-black/90 backdrop-blur-lg z-[100]" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] bg-[#0B101B] border border-white/10 rounded-[3rem] z-[101] p-12 space-y-8 shadow-2xl">
                             <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Clinical Scheduling</h3>
                             <div className="space-y-6">
                                 <div className="space-y-2">
                                     <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Target Participant</label>
                                     <select value={scheduleData.participantId} onChange={e => setScheduleData(prev => ({ ...prev, participantId: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white uppercase text-[12px] outline-none">
                                         <option value="">Select Subject</option>
                                         {participants.map(p => <option key={p.id} value={p.id}>{p.id}</option>)}
                                     </select>
                                 </div>
                                 <div className="grid grid-cols-2 gap-6">
                                     <input type="date" value={scheduleData.date} onChange={e => setScheduleData(prev => ({ ...prev, date: e.target.value }))} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[12px]" />
                                     <input type="time" value={scheduleData.time} onChange={e => setScheduleData(prev => ({ ...prev, time: e.target.value }))} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[12px]" />
                                 </div>
                                 <button onClick={handleScheduleConfirm} className="w-full py-5 bg-indigo-600 text-white rounded-3xl text-[12px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all">
                                     Confirm Deployment
                                 </button>
                             </div>
                        </motion.div>
                    </>
                )}
                {isProblemModalOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProblemModalOpen(false)} className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100]" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] bg-[#0B101B] border border-white/10 rounded-[3rem] z-[101] p-12 space-y-8 shadow-2xl">
                             <div className="flex items-center gap-4">
                                <ShieldAlert className="w-8 h-8 text-red-500" />
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Clinical Concern <span className="text-red-500">Notice</span></h3>
                             </div>
                             
                             <div className="space-y-6">
                                 <div className="space-y-2">
                                     <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest italic">Problem Description</label>
                                     <textarea 
                                        value={problemData.description} 
                                        onChange={e => setProblemData(prev => ({ ...prev, description: e.target.value }))} 
                                        placeholder="Describe the clinical finding or symptom..."
                                        className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[12px] outline-none focus:border-red-500/50 transition-colors resize-none"
                                     />
                                 </div>

                                 <div className="grid grid-cols-2 gap-6">
                                     <div className="space-y-2">
                                         <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest italic">Severity Rating</label>
                                         <select 
                                            value={problemData.severity} 
                                            onChange={e => setProblemData(prev => ({ ...prev, severity: e.target.value as any }))} 
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white uppercase text-[12px] outline-none"
                                         >
                                             <option value="MILD">Mild</option>
                                             <option value="MODERATE">Moderate</option>
                                             <option value="SEVERE">Severe</option>
                                         </select>
                                     </div>
                                     <div className="space-y-2">
                                         <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest italic">Product Relation</label>
                                         <select 
                                            value={problemData.related_to_product} 
                                            onChange={e => setProblemData(prev => ({ ...prev, related_to_product: e.target.value as any }))} 
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white uppercase text-[12px] outline-none"
                                         >
                                             <option value="YES">Related</option>
                                             <option value="NO">Not Related</option>
                                             <option value="UNSURE">Unsure</option>
                                         </select>
                                     </div>
                                 </div>

                                 <div className="space-y-2">
                                     <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest italic">Immediate Action Taken</label>
                                     <input 
                                        type="text"
                                        value={problemData.action_taken} 
                                        onChange={e => setProblemData(prev => ({ ...prev, action_taken: e.target.value }))} 
                                        placeholder="e.g., Hospital referral, Dose reduction..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[12px] outline-none focus:border-indigo-500/50 transition-colors"
                                     />
                                 </div>

                                 <button onClick={handleProblemConfirm} className="w-full py-5 bg-red-600 text-white rounded-3xl text-[12px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all">
                                     Submit Medical Record
                                 </button>
                             </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
