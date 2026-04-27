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
import { Skeleton } from '../../views/Participant/SharedComponents';


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
    notes?: string;
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

interface VisitsModuleProps {
    selectedStudyId?: string;
    preloadedParticipants?: Participant[];
    preloadedStudies?: any[];
    preloadedTasks?: any[];
    onRefresh?: () => void;
    isLoading?: boolean;
}

export default function VisitsModule({ selectedStudyId, preloadedParticipants, preloadedStudies, preloadedTasks, onRefresh, isLoading: propLoading }: VisitsModuleProps) {
    const [viewMode, setViewMode] = useState<'Timeline' | 'Calendar'>('Timeline');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [globalTasks, setGlobalTasks] = useState<any[]>(preloadedTasks || []);
    const [internalLoading, setInternalLoading] = useState(!preloadedParticipants);
    const isLoading = propLoading !== undefined ? propLoading : internalLoading;
    const [allStudies, setAllStudies] = useState<any[]>(preloadedStudies || []);
    const [studyTasks, setStudyTasks] = useState<any[]>([]);
    const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
    const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [openAccordion, setOpenAccordion] = useState<string | null>('Checklist');
    const [mobileView, setMobileView] = useState<'LIST' | 'TIMELINE' | 'DETAILS'>('LIST');
    const [tempVitals, setTempVitals] = useState({ weight: 78.5, height: 1.82 });

    const mapParticipants = useCallback((data: any[]): Participant[] => {
        return data.map((p: any) => ({
            id: p.id,
            db_id: p.id,
            participant_sid: p.participant_sid || 'REQ-000',
            name: (() => {
                const ud = p.user_details;
                if (!ud) return p.participant_sid || 'Subject';
                // Try every possible name field the backend might send
                const n = ud.decrypted_name || ud.full_name ||
                    (ud.first_name && ud.last_name ? `${ud.first_name} ${ud.last_name}`.trim() : null) ||
                    ud.first_name || ud.name || ud.email?.split('@')[0];
                // If the resolved name looks like an encrypted token, fall back
                if (n && !String(n).startsWith('gAAAA')) return n;
                return p.participant_sid || 'Subject';
            })(),
            protocol_id: p.protocol_id || 'N/A',
            status: p.status === 'ACTIVE' ? 'Active' : p.status === 'SCREENING' ? 'Screening' : (p.status || 'Active'),
            coordinator: p.coordinator_name || 'Coordinator Unassigned',
            nextVisitDue: p.next_visit_date || 'N/A',
            study: p.study_name || 'General Protocol',
            study_id: p.study,
            visits: (Array.isArray(p.visits) ? p.visits : []).map((v: any) => ({
                id: v.id,
                name: v.visit_type || 'Unspecified Visit',
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
                } : { dispensed: 'N/A', dose: 'N/A', compliance: 100 },
                notes: v.notes || ''
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
    }, []);

    // Sync state with preloaded data from dashboard
    useEffect(() => {
        if (preloadedParticipants) {
            setParticipants(mapParticipants(preloadedParticipants));
            setInternalLoading(false);
        }
        if (preloadedTasks) setGlobalTasks(preloadedTasks);
    }, [preloadedParticipants, preloadedTasks, mapParticipants]);
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
        setInternalLoading(true);
        try {
            const [pRes, sRes, tRes] = await Promise.all([
                authFetch(`${apiUrl}/api/participants/`),
                authFetch(`${apiUrl}/api/studies/`),
                authFetch(`${apiUrl}/api/staff-tasks/`)
            ]);

            if (pRes.ok) {
                const rawData = await pRes.json();
                const data = Array.isArray(rawData) ? rawData : (rawData.results || []);
                if (!Array.isArray(data)) {
                    setParticipants([]);
                    return;
                }
                setParticipants(mapParticipants(data));
            } else {
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
            setInternalLoading(false);
        }
    }, [apiUrl, mapParticipants]);

    // Initial load sync - DISABLED redundant fetch in favor of dashboard orchestration
    useEffect(() => {
        /*
        if (preloadedParticipants === undefined || preloadedParticipants === null) {
            loadData();
        }
        */
    }, [loadData, preloadedParticipants]);

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

    // Adaptive Mobile Navigation Logic
    useEffect(() => {
        if (selectedParticipantId && mobileView === 'LIST') setMobileView('TIMELINE');
    }, [selectedParticipantId, mobileView]);

    useEffect(() => {
        if (selectedVisitId && mobileView === 'TIMELINE') setMobileView('DETAILS');
    }, [selectedVisitId, mobileView]);


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
    const handleSaveVitals = async () => {
        if (!selectedVisit) return;
        try {
            const res = await authFetch(`${apiUrl}/api/visits/${selectedVisit.id}/`, {
                method: 'PATCH',
                body: JSON.stringify({
                    measurements: {
                        ...selectedVisit.vitals,
                        weight: tempVitals.weight,
                        height: tempVitals.height,
                        bmi: bmi
                    }
                })
            });
            if (res.ok) {
                if (onRefresh) onRefresh();
                else await loadData();
                alert("Biometry Synced: Clinical records updated.");
            }
        } catch (err) {
            alert("Sync Delay: Network interference detected.");
        }
    };

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

                if (res.ok) {
                    if (onRefresh) onRefresh();
                    else await loadData();
                    if(action === 'Approve') setMobileView('TIMELINE');
                }
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
                if (onRefresh) onRefresh();
                else loadData();
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
                if (onRefresh) onRefresh();
                else loadData();
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
                                    <div className="space-y-1.5 md:space-y-1">
                                        {/* Desktop View: Text Labels */}
                                        <div className="hidden md:flex flex-col gap-1">
                                            {daySessions.slice(0, 3).map((s, idx) => (
                                                <div key={idx} className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-tight truncate ${
                                                    s.type === 'VISIT' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'
                                                }`}>
                                                    {s.label}
                                                </div>
                                            ))}
                                            {daySessions.length > 3 && (
                                                <p className="text-[8px] text-slate-600 pl-1 font-bold italic">+{daySessions.length - 3} MORE</p>
                                            )}
                                        </div>

                                        {/* Mobile View: High-visibility dots */}
                                        <div className="flex flex-wrap items-center justify-center gap-1 md:hidden">
                                            {daySessions.map((s, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className={`w-1.5 h-1.5 rounded-full ${
                                                        s.type === 'VISIT' ? 'bg-indigo-400 shadow-[0_0_5px_rgba(129,140,248,0.5)]' : 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]'
                                                    }`} 
                                                />
                                            ))}
                                        </div>
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

            {/* Header Bar: Responsive Stacking */}
            <div className="flex-shrink-0 px-4 md:px-6 py-2.5 bg-[#0B101B] border-b border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center justify-between lg:justify-start gap-4 md:gap-8">
                    <h2 className="text-sm md:text-lg font-black text-white tracking-widest uppercase italic">VISITS Oversight</h2>
                    <div className="flex bg-white/5 p-0.5 rounded-xl border border-white/10 shrink-0">
                        {(['Timeline', 'Calendar'] as const).map(mode => (
                            <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 md:px-4 py-1 rounded-lg text-[10px] md:text-xs font-black tracking-widest transition-all ${viewMode === mode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}>
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input type="text" placeholder="Filter Subjects..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-[12px] text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600" />
                    </div>
                    <button onClick={() => setIsScheduleOpen(true)} className="whitespace-nowrap px-4 py-1.5 bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 rounded-xl text-[10px] font-black tracking-widest hover:bg-indigo-600 hover:text-white transition-all italic">
                        + SCHEDULE
                    </button>
                    <button 
                        onClick={() => {
                            const client = window.google?.accounts?.oauth2?.initTokenClient({
                                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                                scope: 'https://www.googleapis.com/auth/calendar.events',
                                callback: async (response: any) => {
                                    if (response.access_token) {
                                        await authFetch(`${API}/api/auth/save-google-token/`, {
                                            method: 'POST',
                                            body: JSON.stringify({
                                                access_token: response.access_token,
                                                expires_in: response.expires_in,
                                                scope: response.scope
                                            })
                                        });
                                        alert("Google Calendar Synchronized! Your appointments will now appear in your Google Calendar.");
                                    }
                                },
                            });
                            client?.requestAccessToken();
                        }}
                        className={`whitespace-nowrap px-4 py-1.5 border rounded-xl text-[10px] font-black tracking-widest transition-all italic flex items-center gap-2 ${getUser()?.google_calendar_linked ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-emerald-600 hover:text-white'}`}
                    >
                        <Calendar className="w-3 h-3" /> 
                        {getUser()?.google_calendar_linked ? 'CALENDAR LINKED' : 'SYNC GOOGLE'}
                    </button>
                    <button onClick={() => setIsProblemModalOpen(true)} className="whitespace-nowrap px-4 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[10px] font-black tracking-widest hover:bg-rose-500 hover:text-white transition-all italic">
                        + REPORT
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-x-auto overflow-y-hidden relative custom-scrollbar bg-[#0B101B]">
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
                        {/* Sidebar: Subject List */}
                        <div className={`
                            ${mobileView === 'LIST' ? 'flex w-full' : 'hidden lg:flex'} 
                            lg:w-64 xl:w-72 min-w-[250px] h-full border-r border-white/10 bg-[#0f172a] flex-col shrink-0
                        `}>
                            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
                                {isLoading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Skeleton variant="text" className="w-16 h-2" dark={true} />
                                                <Skeleton variant="circle" size="w-2 h-2" dark={true} />
                                            </div>
                                            <Skeleton variant="text" className="w-32 h-3" dark={true} />
                                            <Skeleton variant="text" className="w-24 h-2 opacity-50" dark={true} />
                                        </div>
                                    ))
                                ) : filteredParticipants.map(p => (
                                    <button 
                                        key={p.id} 
                                        onClick={() => {
                                            setSelectedParticipantId(p.id);
                                            setMobileView('TIMELINE');
                                        }} 
                                        className={`w-full text-left p-3 rounded-xl border transition-all ${selectedParticipantId === p.id ? 'bg-indigo-600/10 border-indigo-500/40 shadow-lg shadow-indigo-500/5' : 'bg-transparent border-transparent hover:bg-white/[0.03]'}`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[12px] font-black text-white italic tracking-tighter uppercase">{p.participant_sid}</span>
                                            <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
                                        </div>
                                        <p className="text-[13px] font-bold text-slate-300 truncate mb-0.5">{p.name}</p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate">
                                            <span className="text-indigo-400 italic">[{p.protocol_id}]</span> {p.study}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Center Panel: Timeline */}
                        <div className={`
                            ${mobileView === 'TIMELINE' ? 'flex w-full' : 'hidden lg:flex'} 
                            flex-1 min-w-[400px] flex-col overflow-y-auto p-3 md:p-4 bg-[#0B101B] custom-scrollbar
                        `}>
                            {!selectedParticipant ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                    <Users className="w-12 h-12 mb-4 text-slate-700" />
                                    <p className="text-sm font-black uppercase tracking-[0.2em] italic text-slate-600">Select Subject</p>
                                </div>
                            ) : (
                                <div className="max-w-4xl mx-auto w-full">
                                    {/* Mobile Back Button */}
                                    <button 
                                        onClick={() => setMobileView('LIST')}
                                        className="lg:hidden flex items-center gap-2 mb-6 text-slate-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest italic"
                                    >
                                        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                                        Back to Subjects
                                    </button>

                                    {/* Subject Header */}
                                    <div className="mb-4 p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-xl md:text-2xl font-black text-white mb-1.5 uppercase italic tracking-tighter truncate">{selectedParticipant.name}</h3>
                                                <div className="flex flex-wrap items-center gap-2.5">
                                                    <span className="px-2.5 py-0.5 bg-white/5 rounded-lg text-[10px] font-black text-indigo-400 uppercase tracking-widest italic border border-white/10">
                                                        SID: {selectedParticipant.participant_sid}
                                                    </span>
                                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest truncate">
                                                        {selectedParticipant.study}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setMobileView('DETAILS')}
                                                className="lg:hidden p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400"
                                            >
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                        <div className="p-4 bg-[#0f172a]/50 border border-white/5 rounded-2xl flex items-center gap-4 group hover:bg-[#0f172a] transition-all">
                                            <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:scale-110 transition-transform">
                                                <Activity className="w-7 h-7 text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-0.5">Protocol Progress</p>
                                                <p className="text-3xl font-black text-white tabular-nums italic">{(selectedParticipant.visits && selectedParticipant.visits.length > 0) ? Math.round((selectedParticipant.visits.filter(v => v.status === 'Completed').length / selectedParticipant.visits.length) * 100) : 0}%</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-[#0f172a]/50 border border-white/5 rounded-2xl flex flex-col justify-center group hover:bg-[#0f172a] transition-all">
                                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Target Window</p>
                                            <p className="text-lg font-black text-white uppercase italic tracking-tighter">
                                                {selectedParticipant.nextVisitDue !== 'N/A' ? new Date(selectedParticipant.nextVisitDue).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase() : 'TBD'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative py-4 overflow-x-auto custom-scrollbar scroll-smooth">
                                        <div className="absolute left-0 right-0 top-[38px] h-px bg-white/5" />
                                        <div className="flex flex-row flex-nowrap justify-start items-start gap-4 relative z-10 px-4 min-w-max">
                                            {isLoading ? (
                                                /* Skeletons for Timeline */
                                                Array.from({ length: 5 }).map((_, i) => (
                                                    <div key={i} className="flex flex-col items-center gap-2.5 w-28 flex-none min-w-[90px]">
                                                        <Skeleton variant="circle" size="w-9 h-9" dark={true} className="rounded-xl" />
                                                        <Skeleton variant="text" className="w-20 h-3" dark={true} />
                                                        <Skeleton variant="text" className="w-14 h-2 opacity-50" dark={true} />
                                                    </div>
                                                ))
                                            ) : selectedParticipant.visits.length > 0 ? selectedParticipant.visits.map(v => (
                                                <button 
                                                    key={v.id} 
                                                    onClick={() => {
                                                        setSelectedVisitId(v.id);
                                                        setMobileView('DETAILS');
                                                    }} 
                                                    className="flex flex-col items-center gap-2.5 w-28 group flex-none min-w-[90px] text-center"
                                                >
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 ${v.id === selectedVisitId ? 'bg-indigo-600 border-indigo-400 scale-110 shadow-xl shadow-indigo-500/20' : 'bg-[#0f172a] border-white/10 group-hover:border-white/30'}`}>
                                                        {v.status === 'Completed' ? <Check className="w-4.5 h-4.5 text-emerald-400" /> : <div className={`w-2 h-2 rounded-full ${v.status === 'Scheduled' ? 'bg-indigo-400' : 'bg-slate-600'}`} />}
                                                    </div>
                                                    <div className="text-center group-hover:scale-105 transition-transform">
                                                        <p className="text-[11px] text-white font-black uppercase italic tracking-tighter truncate w-full px-2">{v.name}</p>
                                                        <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">
                                                            {v.scheduledDate ? new Date(v.scheduledDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'PENDING'}
                                                        </p>
                                                    </div>
                                                </button>
                                            )) : (
                                                <div className="w-full py-8 text-center min-w-[300px]">
                                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] italic">Telemetry Offline: No Visits</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Panel: Details */}
                        <div className={`
                            ${mobileView === 'DETAILS' ? 'flex w-full' : 'hidden lg:flex'} 
                            lg:w-[340px] xl:w-[400px] min-w-[320px] border-l border-white/10 bg-[#0f172a] flex-col shrink-0 overflow-y-auto custom-scrollbar
                        `}>
                            {!selectedVisit ? (
                                <div className="flex-1 flex flex-col items-center justify-center opacity-20 p-8 text-center">
                                    <Stethoscope className="w-16 h-16 mb-6 text-slate-700" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] italic text-slate-600">Awaiting Signal</p>
                                </div>
                            ) : (
                                <div className="flex flex-col min-h-full">
                                    {/* Mobile Sub-Header */}
                                    <div className="lg:hidden p-6 border-b border-white/5 flex items-center gap-4 bg-white/[0.01]">
                                        <button onClick={() => setMobileView('TIMELINE')} className="p-2.5 bg-white/5 rounded-xl text-slate-400">
                                            <ArrowRight className="w-4 h-4 rotate-180" />
                                        </button>
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-black uppercase italic tracking-widest">Visit dossier</p>
                                            <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">{selectedVisit.name}</h4>
                                        </div>
                                    </div>

                                    <div className="p-4 pt-4 border-b border-white/10">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="hidden lg:block">
                                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">{selectedVisit.name}</h4>
                                                <p className="text-2xl font-black text-white mt-1 italic tracking-tighter">Core Metrics</p>
                                            </div>
                                            <span className={`shrink-0 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic shadow-lg ${selectedVisit.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : selectedVisit.status === 'Scheduled' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                                {selectedVisit.status}
                                            </span>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={handleSaveVitals}
                                                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] italic hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-500/20"
                                             >
                                                Vitals Flow
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 pt-4 space-y-3">
                                        {/* Accordion 1: Visit Checklist */}
                                        <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0B101B] shadow-lg">
                                            <button
                                                onClick={() => setOpenAccordion(openAccordion === 'Checklist' ? null : 'Checklist')}
                                                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Clipboard className="w-5 h-5 text-indigo-400" />
                                                    <span className="text-[11px] font-black text-white italic tracking-[0.2em] uppercase">Protocol Check</span>
                                                </div>
                                                {openAccordion === 'Checklist' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                            </button>
                                            {openAccordion === 'Checklist' && (
                                                <div className="px-4 pb-4 space-y-2">
                                                    {(selectedVisit?.checklist || []).length === 0 ? (
                                                        <p className="text-[10px] text-slate-600 text-center py-2 font-black uppercase tracking-widest italic">No protocol items defined for this visit</p>
                                                    ) : (
                                                        (selectedVisit?.checklist || []).map((item: any, idx: number) => (
                                                            <div key={idx} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5 group hover:border-indigo-500/20 transition-all">
                                                                <span className={`text-[12px] font-bold italic tracking-tight ${item.done ? 'text-slate-600 line-through' : 'text-slate-300'}`}>{item.item}</span>
                                                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${item.done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-transparent border-2 border-white/10'}`}>
                                                                    {item.done && <Check className="w-3.5 h-3.5" />}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Accordion 2: Vitals */}
                                        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0B101B]">
                                            <button
                                                onClick={() => setOpenAccordion(openAccordion === 'Vitals' ? null : 'Vitals')}
                                                className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <Activity className="w-4 h-4 text-slate-400" />
                                                    <span className="text-[11px] font-black text-white italic tracking-[0.2em] uppercase">Vitals & Metrics</span>
                                                </div>
                                                {openAccordion === 'Vitals' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                            </button>
                                            {openAccordion === 'Vitals' && (
                                                <div className="px-3.5 pb-3.5 space-y-2.5">
                                                    <div className="grid grid-cols-2 gap-2.5">
                                                        <div className="p-2.5 bg-white/[0.02] rounded-lg border border-white/5">
                                                            <p className="text-[9px] text-slate-500 uppercase font-black mb-1 italic">Weight (kg)</p>
                                                            <input
                                                                type="number"
                                                                value={tempVitals.weight}
                                                                onChange={e => setTempVitals(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                                                                className="w-full bg-transparent text-sm font-bold text-white outline-none"
                                                            />
                                                        </div>
                                                        <div className="p-2.5 bg-white/[0.02] rounded-lg border border-white/5">
                                                            <p className="text-[9px] text-slate-500 uppercase font-black mb-1 italic">Height (m)</p>
                                                            <input
                                                                type="number"
                                                                value={tempVitals.height}
                                                                onChange={e => setTempVitals(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                                                                className="w-full bg-transparent text-sm font-bold text-white outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex justify-between items-center">
                                                        <div>
                                                            <p className="text-[10px] text-indigo-300 font-semibold uppercase italic">Calculated BMI</p>
                                                            <p className="text-lg font-bold text-indigo-400 italic">{bmi}</p>
                                                        </div>
                                                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase rounded italic">Stable</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Accordion 3: Medication */}
                                        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0B101B]">
                                            <button
                                                onClick={() => setOpenAccordion(openAccordion === 'Meds' ? null : 'Meds')}
                                                className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <Droplet className="w-4 h-4 text-slate-400" />
                                                    <span className="text-[11px] font-black text-white italic tracking-[0.2em] uppercase">Medication</span>
                                                </div>
                                                {openAccordion === 'Meds' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                            </button>
                                            {openAccordion === 'Meds' && (
                                                <div className="px-3.5 pb-3.5">
                                                    <div className="p-2.5 border border-white/5 rounded-lg bg-white/[0.02]">
                                                        <p className="text-[9px] text-slate-500 uppercase font-black mb-0.5 italic">Active Dispensation</p>
                                                        <p className="text-sm font-bold text-white italic truncate">{selectedVisit?.meds?.dispensed || 'No medication assigned'}</p>
                                                        <div className="mt-1.5 flex items-center gap-2">
                                                            <span className="text-[9px] text-slate-500 font-black uppercase italic">Compliance:</span>
                                                            <span className="text-[10px] font-black text-emerald-400 italic">{selectedVisit?.meds?.compliance || 0}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Accordion 4: Medical Concerns */}
                                        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0B101B]">
                                            <button
                                                onClick={() => setOpenAccordion(openAccordion === 'Concerns' ? null : 'Concerns')}
                                                className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <ShieldAlert className="w-4 h-4 text-slate-400" />
                                                    <span className="text-[11px] font-black text-white italic tracking-[0.2em] uppercase">Security Signal</span>
                                                </div>
                                                {openAccordion === 'Concerns' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                            </button>
                                            {openAccordion === 'Concerns' && (
                                                <div className="px-3.5 pb-3.5 space-y-2.5">
                                                    {(selectedParticipant?.aeReports || []).length === 0 ? (
                                                        <p className="text-[10px] text-slate-600 text-center py-2 font-black uppercase tracking-widest italic">No active findings</p>
                                                    ) : (
                                                        selectedParticipant?.aeReports.map((ae, idx) => (
                                                            <div key={idx} className="p-2.5 border border-white/5 rounded-lg bg-white/[0.02] space-y-1.5">
                                                                <div className="flex items-center justify-between">
                                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded italic ${ae.severity === 'SEVERE' ? 'bg-red-500/20 text-red-400' :
                                                                        ae.severity === 'MODERATE' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                                                                        }`}>{ae.severity}</span>
                                                                    <span className="text-[9px] text-slate-500 font-bold italic">{new Date(ae.start_date).toLocaleDateString()}</span>
                                                                </div>
                                                                <p className="text-[11px] text-slate-300 font-medium leading-relaxed">{ae.description}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-[9px] text-slate-600 font-black uppercase italic">Protocol Action:</span>
                                                                    <span className="text-[9px] text-indigo-400 font-black uppercase italic">{ae.action_taken || 'Monitoring'}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4 border-t border-white/10 bg-[#0f172a] mt-auto">
                                        <div className="flex gap-3">
                                            <button onClick={() => handleSignOff('Approve')} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] italic hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-500/20">
                                                Approve Visit
                                            </button>
                                            <button onClick={() => handleSignOff('Flag')} className="px-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl transition-all hover:bg-rose-500 hover:text-white">
                                                <Flag className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
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
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] bg-[#1e293b] border border-white/10 rounded-2xl z-[101] p-6 md:p-8 shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter">Schedule Clinical Visit</h3>
                                <button 
                                    onClick={() => setIsScheduleOpen(false)}
                                    className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all group"
                                >
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>
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

                                {/* Google Calendar Handshake Button Inside Modal */}
                                <div className="pt-2">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const client = window.google?.accounts?.oauth2?.initTokenClient({
                                                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                                                scope: 'https://www.googleapis.com/auth/calendar.events',
                                                callback: async (response: any) => {
                                                    if (response.access_token) {
                                                        await authFetch(`${API}/api/auth/save-google-token/`, {
                                                            method: 'POST',
                                                            body: JSON.stringify({
                                                                access_token: response.access_token,
                                                                expires_in: response.expires_in,
                                                                scope: response.scope
                                                            })
                                                        });
                                                        alert("Google Calendar Synchronized!");
                                                    }
                                                },
                                            });
                                            client?.requestAccessToken();
                                        }}
                                        className={`w-full py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all border ${
                                            getUser()?.google_calendar_linked 
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                            : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                        }`}
                                    >
                                        <Calendar className="w-4 h-4" />
                                        {getUser()?.google_calendar_linked ? 'Calendar Linked' : 'Connect Google Calendar'}
                                    </button>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 text-center opacity-60">
                                        Syncing allows participants to receive calendar invites automatically.
                                    </p>
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
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] bg-[#1e293b] border border-white/10 rounded-2xl z-[101] p-6 md:p-8 shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <ShieldAlert className="w-6 h-6 text-red-500" />
                                    <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter">Report Clinical Concern</h3>
                                </div>
                                <button 
                                    onClick={() => setIsProblemModalOpen(false)}
                                    className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all group"
                                >
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                </button>
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
