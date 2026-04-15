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
import { API, authFetch, getUser } from '../../utils/auth';

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
    id: string; // Database ID
    db_id: string; // Database ID
    participant_sid: string;
    name: string;
    protocol_id: string;
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
        visitType: 'BASELINE',
        customVisitType: '',
        location: 'Clinic',
        customLocation: '',
        locationAddress: '',
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
                const rawData = await pRes.json();
                // Handle paginated responses from Django Rest Framework
                const data = Array.isArray(rawData) ? rawData : (rawData.results || []);

                if (!Array.isArray(data)) {
                    console.error("[Clinical Sync] Dataset malformation:", rawData);
                    setParticipants([]);
                    return;
                }
                const mapped: Participant[] = data.map((p: any) => ({
                    id: p.id,
                    db_id: p.id,
                    participant_sid: p.participant_sid || 'REQ-000',
                    name: p.user_details?.decrypted_name || p.user_details?.full_name || p.participant_sid || 'Subject',
                    protocol_id: p.protocol_id || 'N/A',
                    status: p.status === 'ACTIVE' ? 'Active' : p.status === 'SCREENING' ? 'Screening' : (p.status || 'Active'),
                    coordinator: p.coordinator_name || 'Coordinator Unassigned',
                    nextVisitDue: p.next_visit_date || 'N/A',
                    study: p.study_name || 'General Protocol',
                    study_id: p.study,
                    visits: (Array.isArray(p.visits) ? p.visits : []).map((v: any) => ({
                        id: v.id,
                        name: v.visit_type || 'Unspecified Visit',
                        // Keep the raw ISO string for data logic, but format it for the UI later
                        scheduledDate: v.scheduled_date || v.date || null,
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


            if (sRes.ok) {
                const sData = await sRes.json();
                setAllStudies(Array.isArray(sData) ? sData : (sData.results || []));
            }
            if (tRes.ok) {
                const tData = await tRes.json();
                setGlobalTasks(Array.isArray(tData) ? tData : (tData.results || []));
            }

        } catch (error) {
            console.error("Clinical sync failure:", error);
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl]);

    // Initial load
    useEffect(() => {
        loadData();
        // Check for missed visits on load to trigger alerts/notifications
        const checkMissed = async () => {
            try {
                await authFetch(`${apiUrl}/api/visits/check_missed/`, { method: 'POST' });
            } catch (e) { /* silent check */ }
        };
        checkMissed();
    }, [loadData, apiUrl]);

    // Handle initial selection & filtering
    const filteredParticipants = useMemo(() => {
        let list = participants;
        if (selectedStudyId && selectedStudyId !== 'all') {
            // Robust comparison using String cast for MongoDB ObjectIDs vs Frontend selection
            list = list.filter(p =>
                String(p.study_id) === String(selectedStudyId) ||
                String(p.study) === String(selectedStudyId)
            );
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            list = list.filter(p =>
                (p.name || '').toLowerCase().includes(query) ||
                (p.participant_sid || '').toLowerCase().includes(query) ||
                (p.coordinator || '').toLowerCase().includes(query)
            );
        }
        return list;
    }, [participants, selectedStudyId, searchQuery]);

    useEffect(() => {
        if (filteredParticipants.length > 0) {
            // 1. Auto-select Participant
            const firstId = String(filteredParticipants[0].id);
            if (!selectedParticipantId || !filteredParticipants.find(p => String(p.id) === String(selectedParticipantId))) {
                setSelectedParticipantId(firstId);
            }

            // 2. Auto-select Visit (with guard to prevent infinite re-renders)
            const firstParticipantVisits = filteredParticipants.find(p => String(p.id) === (selectedParticipantId || firstId))?.visits || [];
            if (firstParticipantVisits.length > 0) {
                const firstVisitId = String(firstParticipantVisits[0].id);
                if (!selectedVisitId || !firstParticipantVisits.find(v => String(v.id) === String(selectedVisitId))) {
                    setSelectedVisitId(firstVisitId);
                }
            }
        } else {
            if (selectedParticipantId !== null) setSelectedParticipantId(null);
            if (selectedVisitId !== null) setSelectedVisitId(null);
        }
    }, [filteredParticipants, selectedParticipantId, selectedVisitId]);


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
            const localDateTime = new Date(`${scheduleData.date}T${scheduleData.time || '09:00'}:00`);
            const isoDateTime = localDateTime.toISOString();

            const finalVisitType = scheduleData.visitType === 'OTHER' ? scheduleData.customVisitType : scheduleData.visitType;
            const finalLocation = scheduleData.location === 'OTHER' ? scheduleData.customLocation : scheduleData.location;

            const visitResp = await authFetch(`${apiUrl}/api/visits/`, {
                method: 'POST',
                body: JSON.stringify({
                    participant: targetParticipant.db_id,
                    visit_type: finalVisitType || 'Unspecified Visit',
                    scheduled_date: isoDateTime,
                    status: 'SCHEDULED',
                    location: finalLocation || 'Clinic',
                    location_address: scheduleData.locationAddress,
                    scheduled_by: getUser()?.id // Attribute the scheduling to the current coordinator
                })
            });

            if (scheduleData.taskId) {
                await authFetch(`${apiUrl}/api/participant-tasks/`, {
                    method: 'POST',
                    body: JSON.stringify({
                        participant: targetParticipant.db_id,
                        task: scheduleData.taskId,
                        due_date: isoDateTime,
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
                if (!v.scheduledDate) return;
                try {
                    const dateObj = new Date(v.scheduledDate);
                    if (isNaN(dateObj.getTime())) return; // Safety check
                    const d = dateObj.toISOString().split('T')[0];
                    if (!sessionsByDate[d]) sessionsByDate[d] = [];
                    sessionsByDate[d].push({ type: 'VISIT', label: `${p.participant_sid}: ${v.name}`, status: v.status });
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
            <div className="flex-1 flex flex-col p-6 lg:p-10 bg-[#0B101B]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                    <h2 className="text-lg md:text-xl font-bold text-white tracking-wide uppercase">Site Calendar</h2>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-2 text-slate-400 hover:text-white transition-colors">
                            <ChevronDown className="w-5 h-5 rotate-90" />
                        </button>
                        <span className="text-sm font-semibold text-white min-w-[120px] text-center">{monthYear.toUpperCase()}</span>
                        <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-2 text-slate-400 hover:text-white transition-colors">
                            <ChevronDown className="w-5 h-5 -rotate-90" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 border border-white/10 rounded-xl overflow-hidden bg-[#0D1424]">
                    <div className="grid grid-cols-7 border-b border-white/10">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="p-2 md:p-4 text-[10px] md:text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
                                {d}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 grid-rows-6 flex-1 h-[calc(100%-48px)] bg-white/[0.02]">
                        {Array.from({ length: 42 }).map((_, i) => {
                            const dayNum = i - firstDay + 1;
                            const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                            const currentDayDate = isCurrentMonth ? new Date(viewDate.getFullYear(), viewDate.getMonth(), dayNum) : null;
                            const dateString = currentDayDate ? currentDayDate.toISOString().split('T')[0] : '';
                            const daySessions = sessionsByDate[dateString] || [];
                            const isToday = currentDayDate?.toDateString() === new Date().toDateString();

                            return (
                                <div key={i} className={`p-3 border-r border-b border-white/10 ${!isCurrentMonth ? 'opacity-20 bg-black/20' : 'hover:bg-white/[0.04] transition-colors'} ${isToday ? 'bg-indigo-500/10' : ''}`}>
                                    <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-indigo-400' : 'text-slate-300'}`}>
                                        {isCurrentMonth ? dayNum : ''}
                                    </div>
                                    <div className="space-y-1.5">
                                        {daySessions.slice(0, 3).map((s, idx) => (
                                            <div key={idx} className={`px-2 py-1 rounded text-[10px] font-medium truncate ${s.type === 'VISIT' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'
                                                }`}>
                                                {s.label}
                                            </div>
                                        ))}
                                        {daySessions.length > 3 && (
                                            <p className="text-[10px] text-slate-500 pl-1">+{daySessions.length - 3} more</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    // ─── MAIN RENDER ─────────────────────────────────────────────────────────

    return (
        <div className="w-full flex flex-col h-[calc(100vh-6rem)] bg-[#0B101B]">

            {/* Overlays */}
            {isLoading && (
                <div className="absolute inset-0 z-[100] bg-[#0B101B]/80 flex flex-col items-center justify-center">
                    <Activity className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                    <p className="text-sm font-medium text-white tracking-wide">Loading records...</p>
                </div>
            )}

            {/* Header Bar */}
            <div className="flex-shrink-0 px-6 py-5 bg-[#0B101B] border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <h2 className="text-lg font-bold text-white tracking-wider">VISITS & ASSESSMENTS</h2>
                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                        {(['Timeline', 'Calendar'] as const).map(mode => (
                            <button key={mode} onClick={() => setViewMode(mode)} className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-colors ${viewMode === mode ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                                {mode.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative w-64 hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Search Subjects..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-indigo-500" />
                    </div>
                    <button onClick={() => setIsScheduleOpen(true)} className="px-5 py-2 border border-white/20 text-white rounded-lg text-xs font-bold tracking-wider hover:bg-white/10 transition-colors">
                        + SCHEDULE FLOW
                    </button>
                    <button onClick={() => setIsProblemModalOpen(true)} className="px-5 py-2 border border-red-500/50 text-red-400 rounded-lg text-xs font-bold tracking-wider hover:bg-red-500/10 transition-colors">
                        + REPORT PROBLEM
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {!isLoading && participants.length === 0 && (
                    <div className="absolute inset-0 z-10 bg-[#0B101B]/50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                        <Users className="w-16 h-16 text-slate-700/50 mb-6" />
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">No Subjects Found</h3>
                        <p className="text-sm text-slate-500 max-w-md font-bold uppercase tracking-widest italic">
                            The participant pool is currently empty for the selected study context.
                        </p>
                    </div>
                )}
                {viewMode === 'Timeline' ? (
                    <>
                        {/* Sidebar */}
                        <div className="w-80 h-full border-r border-white/10 bg-[#0f172a] flex flex-col shrink-0">
                            <div className="flex-1 overflow-y-auto w-[250px] p-4 space-y-2">
                                {filteredParticipants.map(p => (
                                    <button key={p.id} onClick={() => setSelectedParticipantId(p.id)} className={`w-full text-left p-4 rounded-xl border transition-colors ${selectedParticipantId === p.id ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-transparent border-transparent hover:bg-white/[0.03]'}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-bold text-white">{p.participant_sid}</span>
                                            <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                                        </div>
                                        <p className="text-xs font-medium text-slate-300 truncate">{p.name}</p>
                                        <p className="text-[10px] text-slate-500 mt-1 truncate">[{p.protocol_id}] {p.study}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Center Panel */}
                        <div className="flex-1 overflow-y-auto p-5 lg:p-8 bg-[#0B101B]">
                            {!selectedParticipant ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                    <p className="text-sm font-medium text-slate-400">Select a subject to view timeline</p>
                                </div>
                            ) : (
                                <div className="max-w-4xl mx-auto">
                                    {/* Subject Header */}
                                    <div className="mb-5">
                                        <h3 className="text-2xl font-bold text-white mb-2 uppercase">{selectedParticipant.name}</h3>
                                        <p className="text-xs text-slate-400 tracking-wide">
                                            SID: {selectedParticipant.participant_sid} &bull; [{selectedParticipant.protocol_id}] {selectedParticipant.study}
                                        </p>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="p-6 bg-[#0f172a] border border-white/10 rounded-2xl flex items-center gap-5">
                                            <Activity className="w-8 h-8 text-indigo-400" />
                                            <div>
                                                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Protocol Progress</p>
                                                <p className="text-3xl font-bold text-white">{(selectedParticipant.visits && selectedParticipant.visits.length > 0) ? Math.round((selectedParticipant.visits.filter(v => v.status === 'Completed').length / selectedParticipant.visits.length) * 100) : 0}%</p>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-[#0f172a] border border-white/10 rounded-2xl flex flex-col justify-center">
                                            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Next Target Window</p>
                                            <p className="text-lg font-bold text-white uppercase">{selectedParticipant.nextVisitDue !== 'N/A' ? new Date(selectedParticipant.nextVisitDue).toLocaleDateString() : 'Not Available'}</p>
                                        </div>
                                    </div>

                                    {/* Horizontal Timeline */}
                                    <div className="relative pt-6">
                                        <div className="absolute left-0 right-0 top-[40px] h-px bg-white/10" />
                                        <div className="flex justify-between items-start w-full relative z-10 px-8">
                                            {selectedParticipant.visits.length > 0 ? selectedParticipant.visits.map(v => (
                                                <button key={v.id} onClick={() => setSelectedVisitId(v.id)} className="flex flex-col items-center gap-3 w-24">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${v.id === selectedVisitId ? 'bg-indigo-600 border-indigo-400' : 'bg-[#0f172a] border-white/20'}`}>
                                                        {v.status === 'Completed' ? <Check className="w-4 h-4 text-emerald-400" /> : <div className="w-2 h-2 rounded-full bg-slate-500" />}
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[11px] text-white font-semibold truncate w-full">{v.name}</p>
                                                        <p className="text-[10px] text-slate-500 mt-1">
                                                            {v.scheduledDate ? new Date(v.scheduledDate).toLocaleDateString() : 'Pending'}
                                                        </p>
                                                    </div>
                                                </button>
                                            )) : (
                                                <div className="w-full py-8 text-center"><p className="text-sm text-slate-500 font-medium tracking-wide">No visits scheduled for this participant</p></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Panel */}
                        <div className="w-[450px] border-l border-white/10 bg-[#0f172a] flex flex-col shrink-0">
                            {!selectedVisit ? (
                                <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                                    <Stethoscope className="w-12 h-12 mb-4 text-slate-500" />
                                    <p className="text-sm font-medium tracking-wide text-slate-400">Awaiting Selection</p>
                                </div>
                            ) : (
                                <>
                                    <div className="p-6 border-b border-white/10">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{selectedVisit.name}</h4>
                                                <p className="text-xl font-bold text-white mt-1">Core Metrics</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${selectedVisit.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : selectedVisit.status === 'Scheduled' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {selectedVisit.status}
                                            </span>
                                        </div>
                                        <div className="flex gap-3">
                                            <button className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">Capture Vitals</button>
                                            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4 text-slate-400" /></button>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                        {/* Accordion 1: Visit Checklist */}
                                        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0B101B]">
                                            <button
                                                onClick={() => setOpenAccordion(openAccordion === 'Checklist' ? null : 'Checklist')}
                                                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Clipboard className="w-4 h-4 text-slate-400" />
                                                    <span className="text-xs font-semibold text-white tracking-wide">Protocol Checklist</span>
                                                </div>
                                                {openAccordion === 'Checklist' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                            </button>
                                            {openAccordion === 'Checklist' && (
                                                <div className="px-4 pb-4 space-y-2">
                                                    {(selectedVisit?.checklist || []).map((item, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5">
                                                            <span className={`text-xs font-medium tracking-wide ${item.done ? 'text-slate-500' : 'text-slate-300'}`}>{item.item}</span>
                                                            <div className={`w-4 h-4 rounded flex items-center justify-center ${item.done ? 'bg-emerald-500 text-white' : 'bg-transparent border border-white/20'}`}>
                                                                {item.done && <Check className="w-3 h-3" />}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Accordion 2: Vitals */}
                                        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0B101B]">
                                            <button
                                                onClick={() => setOpenAccordion(openAccordion === 'Vitals' ? null : 'Vitals')}
                                                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Activity className="w-4 h-4 text-slate-400" />
                                                    <span className="text-xs font-semibold text-white tracking-wide">Vitals & Metrics</span>
                                                </div>
                                                {openAccordion === 'Vitals' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                            </button>
                                            {openAccordion === 'Vitals' && (
                                                <div className="px-4 pb-4 space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5">
                                                            <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Weight (kg)</p>
                                                            <input
                                                                type="number"
                                                                value={tempVitals.weight}
                                                                onChange={e => setTempVitals(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                                                                className="w-full bg-transparent text-sm font-semibold text-white outline-none"
                                                            />
                                                        </div>
                                                        <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5">
                                                            <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Height (m)</p>
                                                            <input
                                                                type="number"
                                                                value={tempVitals.height}
                                                                onChange={e => setTempVitals(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                                                                className="w-full bg-transparent text-sm font-semibold text-white outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex justify-between items-center">
                                                        <div>
                                                            <p className="text-[10px] text-indigo-300 font-semibold uppercase">Calculated BMI</p>
                                                            <p className="text-lg font-bold text-indigo-400">{bmi}</p>
                                                        </div>
                                                        <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase rounded">Stable</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Accordion 3: Medication */}
                                        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0B101B]">
                                            <button
                                                onClick={() => setOpenAccordion(openAccordion === 'Meds' ? null : 'Meds')}
                                                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Droplet className="w-4 h-4 text-slate-400" />
                                                    <span className="text-xs font-semibold text-white tracking-wide">Medication Tracking</span>
                                                </div>
                                                {openAccordion === 'Meds' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                            </button>
                                            {openAccordion === 'Meds' && (
                                                <div className="px-4 pb-4">
                                                    <div className="p-3 border border-white/5 rounded-lg bg-white/[0.02]">
                                                        <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Active Dispensation</p>
                                                        <p className="text-sm font-semibold text-white">{selectedVisit?.meds?.dispensed || 'No medication assigned'}</p>
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <span className="text-[10px] text-slate-400">Compliance:</span>
                                                            <span className="text-[10px] font-bold text-slate-300">{selectedVisit?.meds?.compliance || 0}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Accordion 4: Medical Concerns */}
                                        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0B101B]">
                                            <button
                                                onClick={() => setOpenAccordion(openAccordion === 'Concerns' ? null : 'Concerns')}
                                                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <ShieldAlert className="w-4 h-4 text-slate-400" />
                                                    <span className="text-xs font-semibold text-white tracking-wide">Medical Concerns</span>
                                                </div>
                                                {openAccordion === 'Concerns' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                            </button>
                                            {openAccordion === 'Concerns' && (
                                                <div className="px-4 pb-4 space-y-3">
                                                    {(selectedParticipant?.aeReports || []).length === 0 ? (
                                                        <p className="text-xs text-slate-500 text-center py-2">No active medical findings</p>
                                                    ) : (
                                                        selectedParticipant?.aeReports.map((ae, idx) => (
                                                            <div key={idx} className="p-3 border border-white/5 rounded-lg bg-white/[0.02] space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${ae.severity === 'SEVERE' ? 'bg-red-500/20 text-red-400' :
                                                                        ae.severity === 'MODERATE' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                                                                        }`}>{ae.severity}</span>
                                                                    <span className="text-[10px] text-slate-500">{new Date(ae.start_date).toLocaleDateString()}</span>
                                                                </div>
                                                                <p className="text-xs text-slate-300">{ae.description}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[10px] text-slate-500">Action:</span>
                                                                    <span className="text-[10px] text-slate-300 font-medium">{ae.action_taken || 'Monitoring'}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-6 border-t border-white/10 bg-[#0f172a]">
                                        <div className="flex gap-3">
                                            <button onClick={() => handleSignOff('Approve')} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
                                                Approve Visit
                                            </button>
                                            <button onClick={() => handleSignOff('Flag')} className="px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-red-400 rounded-lg transition-colors">
                                                <Flag className="w-4 h-4" />
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsScheduleOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] bg-[#1e293b] border border-white/10 rounded-xl z-[101] p-8 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-6">Schedule Clinical Visit</h3>
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-400 font-semibold tracking-wide">Target Participant</label>
                                    <select value={scheduleData.participantId} onChange={e => setScheduleData(prev => ({ ...prev, participantId: e.target.value }))} className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-indigo-500">
                                        <option value="">Select Subject...</option>
                                        {participants.map(p => <option key={p.id} value={p.id}>{p.name} ({p.participant_sid})</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-slate-400 font-semibold tracking-wide">Visit Type</label>
                                        <select value={scheduleData.visitType} onChange={e => setScheduleData(prev => ({ ...prev, visitType: e.target.value }))} className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-indigo-500">
                                            <option value="SCREENING">Screening Visit</option>
                                            <option value="BASELINE">Baseline Visit</option>
                                            <option value="FOLLOW_UP">Follow-up Visit</option>
                                            <option value="FINAL">Final Visit</option>
                                            <option value="UNSCHEDULED">Unscheduled Visit</option>
                                            <option value="ONBOARDING">Onboarding Call</option>
                                            <option value="OTHER">Other / Custom Type...</option>
                                        </select>
                                        {scheduleData.visitType === 'OTHER' && (
                                            <input 
                                                type="text" 
                                                placeholder="Enter custom visit name..."
                                                value={scheduleData.customVisitType}
                                                onChange={e => setScheduleData(prev => ({ ...prev, customVisitType: e.target.value }))}
                                                className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 mt-2 text-white text-sm outline-none focus:border-indigo-500"
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-slate-400 font-semibold tracking-wide">Visit Mode</label>
                                        <select value={scheduleData.location} onChange={e => setScheduleData(prev => ({ ...prev, location: e.target.value }))} className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-indigo-500">
                                            <option value="Clinic">In-Clinic Visit</option>
                                            <option value="Virtual">Telehealth / Virtual</option>
                                            <option value="Home Visit">At-Home Visit</option>
                                            <option value="OTHER">Other / Custom Mode...</option>
                                        </select>
                                        {scheduleData.location === 'OTHER' && (
                                            <input 
                                                type="text" 
                                                placeholder="Enter custom mode..."
                                                value={scheduleData.customLocation}
                                                onChange={e => setScheduleData(prev => ({ ...prev, customLocation: e.target.value }))}
                                                className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 mt-2 text-white text-sm outline-none focus:border-indigo-500"
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-400 font-semibold tracking-wide">Specific Address / Room Details</label>
                                    <input 
                                        type="text" 
                                        value={scheduleData.locationAddress} 
                                        onChange={e => setScheduleData(prev => ({ ...prev, locationAddress: e.target.value }))} 
                                        placeholder="e.g., Level 4, Clinical Suite 102"
                                        className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-indigo-500" 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-slate-400 font-semibold tracking-wide">Date</label>
                                        <input type="date" value={scheduleData.date} onChange={e => setScheduleData(prev => ({ ...prev, date: e.target.value }))} className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-indigo-500" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-slate-400 font-semibold tracking-wide">Local Time</label>
                                        <input type="time" value={scheduleData.time} onChange={e => setScheduleData(prev => ({ ...prev, time: e.target.value }))} className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-indigo-500" />
                                    </div>
                                </div>
                                <button onClick={handleScheduleConfirm} className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold tracking-wide transition-colors">
                                    Confirm Schedule
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
                {isProblemModalOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProblemModalOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] bg-[#1e293b] border border-white/10 rounded-xl z-[101] p-8 shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <ShieldAlert className="w-6 h-6 text-red-500" />
                                <h3 className="text-xl font-bold text-white">Report Clinical Concern</h3>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-400 font-semibold tracking-wide">Problem Description</label>
                                    <textarea
                                        value={problemData.description}
                                        onChange={e => setProblemData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Describe the clinical finding or symptom..."
                                        className="w-full h-24 bg-[#0f172a] border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-red-500/50 resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-slate-400 font-semibold tracking-wide">Severity</label>
                                        <select
                                            value={problemData.severity}
                                            onChange={e => setProblemData(prev => ({ ...prev, severity: e.target.value as any }))}
                                            className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-red-500/50"
                                        >
                                            <option value="MILD">Mild</option>
                                            <option value="MODERATE">Moderate</option>
                                            <option value="SEVERE">Severe</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-slate-400 font-semibold tracking-wide">Product Related</label>
                                        <select
                                            value={problemData.related_to_product}
                                            onChange={e => setProblemData(prev => ({ ...prev, related_to_product: e.target.value as any }))}
                                            className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-red-500/50"
                                        >
                                            <option value="YES">Yes</option>
                                            <option value="NO">No</option>
                                            <option value="UNSURE">Unsure</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-400 font-semibold tracking-wide">Immediate Action Taken</label>
                                    <input
                                        type="text"
                                        value={problemData.action_taken}
                                        onChange={e => setProblemData(prev => ({ ...prev, action_taken: e.target.value }))}
                                        placeholder="e.g., Medication prescribed..."
                                        className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-red-500/50"
                                    />
                                </div>

                                <button onClick={handleProblemConfirm} className="w-full mt-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold tracking-wide transition-colors">
                                    Submit Report
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
