import React, { useState, useMemo, useEffect } from 'react';
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
    const [availableStudies, setAvailableStudies] = useState<string[]>([]);
    const [allStudies, setAllStudies] = useState<any[]>([]);
    const [studyTasks, setStudyTasks] = useState<any[]>([]);
    const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
    const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [openAccordion, setOpenAccordion] = useState<string | null>('Checklist');
        const [tempVitals, setTempVitals] = useState<{weight: number | string, height: number | string}>({ weight: 78.5, height: 1.82 });
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

    const loadInitialData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const [pRes, sRes, tRes] = await Promise.all([
                authFetch(`${apiUrl}/api/participants/`),
                authFetch(`${apiUrl}/api/studies/`),
                authFetch(`${apiUrl}/api/participant-tasks/`)
            ]);

            if (pRes.ok) {
                const data = await pRes.json();
                const participants_list: any[] = Array.isArray(data) ? data : (data.results || []);
                const mapped: Participant[] = participants_list.map((p: any) => ({
                    id: p.participant_sid || p.id,
                    db_id: p.id,
                    status: p.status === 'ACTIVE' ? 'Active' : p.status === 'SCREENING' ? 'Screening' : 'Completed',
                    coordinator: p.coordinator_name || 'Coordinator Unassigned',
                    nextVisitDue: p.next_visit_date || 'N/A',
                    study: p.study_name || 'General Study',
                    study_id: p.study,
                    visits: (p.visits || []).map((v: any) => ({
                        id: v.id,
                        name: v.visit_type,
                        scheduledDate: v.scheduled_date ? new Date(v.scheduled_date).toLocaleDateString() : 'N/A',
                        status: v.status === 'COMPLETED' ? 'Completed' : v.status === 'SCHEDULED' ? 'Scheduled' : 'Overdue',
                        window: '±3 days',
                        actualDate: v.actual_date,
                        checklist: (v.checklist || []).map((inner: any) => ({
                            item: inner.label || inner.item,
                            done: inner.checked || inner.done,
                            time: inner.time,
                            user: inner.by || inner.user
                        })),
                        assessments: v.assessments || [],
                        vitals: v.measurements || { weight: 0, height: 0, bmi: 0, bp: 'N/A', hr: 0, temp: 0 },
                        meds: (v.dispensing && v.dispensing.length > 0) ? {
                            dispensed: v.dispensing[0].product || 'N/A',
                            dose: v.dispensing[0].dose || 'N/A',
                            compliance: v.dispensing[0].compliance || 100
                        } : { dispensed: 'N/A', dose: 'N/A', compliance: 100 }
                    })),
                    aeReports: (p.ae_reports || []).map((ae: any) => ({
                        id: ae.id,
                        description: ae.description,
                        start_date: ae.start_date,
                        severity: ae.severity,
                        is_ongoing: ae.is_ongoing,
                        related_to_product: ae.related_to_product,
                        action_taken: ae.action_taken
                    }))
                }));
                
                const finalData = (selectedStudyId && selectedStudyId !== 'all') 
                    ? mapped.filter(p => p.study_id === selectedStudyId || p.study === selectedStudyId) 
                    : mapped;
                setParticipants(finalData);
                
                if (finalData.length > 0 && !selectedParticipantId) {
                    setSelectedParticipantId(finalData[0].id);
                    if ((finalData[0]?.visits?.length ?? 0) > 0) setSelectedVisitId(finalData[0].visits[0].id);
                }
            }

            if (sRes.ok) {
                const sData = await sRes.json();
                setAllStudies(sData);
                setAvailableStudies(sData.map((s: any) => s.title));
            }

            if (tRes.ok) {
                const tData = await tRes.json();
                setGlobalTasks(tData);
            }
        } catch (error) {
            console.error("Clinical sync failure:", error);
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, selectedStudyId, selectedParticipantId]);

    useEffect(() => {
        const fetchTasks = async () => {
            const studyId = scheduleData.studyId;
            if (!studyId) {
                setStudyTasks([]);
                return;
            }
            try {
                const res = await authFetch(`${apiUrl}/api/tasks/?study=${studyId}`);
                if (res.ok) {
                    const data = await res.json();
                    setStudyTasks(data);
                }
            } catch (err) {
                console.error("Task sync failure:", err);
            }
        };
        fetchTasks();
    }, [scheduleData.studyId, apiUrl]);

    const handleProblemConfirm = async () => {
        if (!selectedParticipant || !problemData.description) {
            alert('Description Required: Please describe the clinical finding.');
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
                loadInitialData();
            } else {
                alert("Persistence Error: Failed to log clinical concern.");
            }
        } catch (err) {
            console.error("Clinical Reporting Failure:", err);
            alert("Network interference detected during reporting.");
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
                loadInitialData();
            } else {
                alert("Study Sync Error: Failed to persist visit data.");
            }
        } catch (err) {
            console.error("Clinical Scheduling Failure:", err);
            alert("Network interference detected during scheduling.");
        }
    };

    React.useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const selectedParticipant = useMemo(() => 
        participants.find(p => p.id === selectedParticipantId) || null,
    [participants, selectedParticipantId]);

    const selectedVisit = useMemo(() => 
        selectedParticipant?.visits?.find(v => v.id === selectedVisitId) || selectedParticipant?.visits?.[0] || null,
    [selectedParticipant, selectedVisitId]);

    const bmi = useMemo(() => {
        if (!tempVitals.weight || !tempVitals.height) return 0;
        return parseFloat((Number(tempVitals.weight) / (Number(tempVitals.height) * Number(tempVitals.height))).toFixed(1));
    }, [tempVitals]);

    const filteredParticipants = useMemo(() => 
        participants.filter(p => p.id.toLowerCase().includes(searchQuery.toLowerCase())),
    [participants, searchQuery]);

    const handleToggleChecklist = (itemIndex: number) => {
        setParticipants(prev => prev.map(p => {
            if (p.id !== selectedParticipantId) return p;
            return {
                ...p,
                visits: (p.visits || []).map(v => {
                    if (v.id !== selectedVisitId) return v;
                    const newChecklist = [...v.checklist];
                    newChecklist[itemIndex] = { 
                        ...newChecklist[itemIndex], 
                        done: !newChecklist[itemIndex].done,
                        time: !newChecklist[itemIndex].done ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
                        user: !newChecklist[itemIndex].done ? 'PI' : undefined
                    };
                    return { ...v, checklist: newChecklist };
                })
            };
        }));
    };

    const handleSignOff = async (action: 'Approve' | 'Flag') => {
        if (!selectedVisit) return;
        const confirmMsg = action === 'Approve' ? 'Confirm investigator sign-off for this visit?' : 'Flag this visit for secondary review?';
        
        if (window.confirm(confirmMsg)) {
            try {
                const payload = {
                    status: action === 'Approve' ? 'COMPLETED' : 'SCHEDULED',
                    pi_approved: action === 'Approve',
                    locked: action === 'Approve'
                };

                const resp = await authFetch(`${apiUrl}/api/visits/${selectedVisit.id}/`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload)
                });

                if (resp.ok) loadInitialData();
            } catch (err) {
                console.error("Sign-off failure:", err);
            }
        }
    };

    const getStatusColor = (status: Visit['status']) => {
        switch (status) {
            case 'Completed': return 'emerald';
            case 'Scheduled': return 'indigo';
            case 'Overdue': return 'red';
            case 'Missed': return 'red text-opacity-50';
            default: return 'slate';
        }
    };

    const calendarData = useMemo(() => {
        const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
        const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
        
        const sessionsByDate: Record<string, any[]> = {};
        
        // Map Visits
        participants.forEach(p => {
            (p.visits || []).forEach(v => {
                try {
                    if (v.scheduledDate) {
                        const d = new Date(v.scheduledDate).toISOString().split('T')[0];
                        if (!sessionsByDate[d]) sessionsByDate[d] = [];
                        sessionsByDate[d].push({ type: 'VISIT', label: `${p.id}: ${v.name}`, status: v.status, participant: p.id });
                    }
                } catch (e) {
                    console.warn("Skipping malformed visit date:", v.scheduledDate);
                }
            });
        });

        // Map Tasks
        globalTasks.forEach(t => {
            if (t.due_date) {
                try {
                    const d = new Date(t.due_date).toISOString().split('T')[0];
                    if (!sessionsByDate[d]) sessionsByDate[d] = [];
                    sessionsByDate[d].push({ type: 'TASK', label: t.title, status: t.status, participant: t.participant_name || 'Subject' });
                } catch (e) {
                    console.warn("Skipping malformed task date:", t.due_date);
                }
            }
        });

        return { daysInMonth, firstDay, sessionsByDate };
    }, [viewDate, participants, globalTasks]);

    const renderCalendar = () => {
        const { daysInMonth, firstDay, sessionsByDate } = calendarData;
        const monthYear = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        return (
            <div className="flex-1 flex flex-col p-12 space-y-8 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Site <span className="text-teal-500">Calendar</span></h2>
                        <p className="text-sm text-slate-500 font-black uppercase tracking-[0.3em] italic">{monthYear} • Study Sync: ACTIVE</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                        <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-3 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white">
                            <ChevronDown className="w-5 h-5 rotate-90" />
                        </button>
                        <span className="text-sm font-black text-white px-4 uppercase italic tracking-widest">{monthYear}</span>
                        <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-3 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white">
                            <ChevronDown className="w-5 h-5 -rotate-90" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="bg-[#0D1424] p-6 text-sm font-black text-slate-500 uppercase tracking-widest text-center border-b border-white/5 italic">
                            {d}
                        </div>
                    ))}
                    {Array.from({ length: 42 }).map((_, i) => {
                        const dayNum = i - firstDay + 1;
                        const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                        const dateString = isCurrentMonth ? new Date(viewDate.getFullYear(), viewDate.getMonth(), dayNum).toISOString().split('T')[0] : '';
                        const daySessions = sessionsByDate[dateString] || [];

                        return (
                            <div 
                                key={i} 
                                className={`h-[120px] bg-[#0B101B] p-2 border-r border-b border-white/[0.03] transition-all hover:bg-white/[0.02] overflow-hidden flex flex-col ${!isCurrentMonth ? 'opacity-20' : ''}`}
                            >
                                <div className="flex justify-between items-center mb-1 shrink-0">
                                    <span className={`text-[11px] font-black italic leading-none ${dayNum === new Date().getDate() && viewDate.getMonth() === new Date().getMonth() ? 'text-teal-400' : 'text-slate-600'}`}>
                                        {isCurrentMonth ? dayNum.toString().padStart(2, '0') : ''}
                                    </span>
                                    {isCurrentMonth && (
                                        <button 
                                            onClick={() => {
                                                setScheduleData(prev => ({ ...prev, date: dateString }));
                                                setIsScheduleOpen(true);
                                            }}
                                            className="p-0.5 rounded hover:text-teal-400 text-slate-700 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-col gap-[3px] overflow-hidden flex-1">
                                    {daySessions.slice(0, 3).map((s, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`px-1.5 py-[2px] rounded text-[9px] font-black uppercase tracking-tighter truncate leading-tight ${
                                                s.type === 'VISIT' 
                                                    ? 'bg-teal-500/10 border border-teal-500/20 text-teal-400' 
                                                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                            }`}
                                            title={s.label}
                                        >
                                            {s.label}
                                        </div>
                                    ))}
                                    {daySessions.length > 3 && (
                                        <p className="text-[9px] text-slate-600 font-black italic text-center leading-tight">+{daySessions.length - 3} more</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-[1920px] mx-auto flex flex-col h-[calc(100vh-14rem)] bg-[#0B101B] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            
            {isLoading && (
                <div className="absolute inset-0 z-[100] bg-[#0B101B]/90 backdrop-blur-md flex flex-col items-center justify-center">
                    <Activity className="w-12 h-12 text-teal-500 animate-pulse mb-6" />
                    <h3 className="text-xl font-black text-white italic uppercase tracking-[0.2em]">Synchronizing Clinical Records</h3>
                    <p className="text-sm text-slate-500 font-black uppercase tracking-widest mt-3">Fetching real-time investigator data...</p>
                </div>
            )}

            {!isLoading && participants.length === 0 && (
                <div className="absolute inset-0 z-[100] bg-[#0B101B] flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8">
                        <Stethoscope className="w-10 h-10 text-slate-700" />
                    </div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-widest">No Active Subjects</h3>
                    <p className="text-slate-500 max-w-md mt-4 text-sm font-bold leading-relaxed uppercase tracking-tighter">Your clinical roster is currently empty. Assigned participants will appear here upon study enrollment.</p>
                </div>
            )}

            {/* Toolbar */}
            <div className="h-20 px-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
                <div className="flex items-center gap-12">
                    <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                        <button 
                            onClick={() => setViewMode('Timeline')}
                            className={`px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all italic flex items-center gap-2 ${viewMode === 'Timeline' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" /> Clinical Timeline
                        </button>
                        <button 
                            onClick={() => setViewMode('Calendar')}
                            className={`px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all italic flex items-center gap-2 ${viewMode === 'Calendar' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            <Calendar className="w-3.5 h-3.5" /> Site Calendar
                        </button>
                    </div>

                    <div className="h-10 w-px bg-white/5" />

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-hover:text-teal-400 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search clinical subjects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/5 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-black italic uppercase text-white outline-none focus:border-teal-500/30 transition-all w-80 placeholder:text-slate-700"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => loadInitialData()}
                        className="p-4 bg-white/5 border border-white/5 text-slate-500 rounded-2xl hover:text-teal-400 hover:bg-white/10 transition-all"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setIsProblemModalOpen(true)}
                        className="px-8 py-4 bg-red-600/10 text-red-500 border border-red-500/30 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-red-600/20 transition-all italic flex items-center gap-3"
                    >
                        <ShieldAlert className="w-4 h-4" /> Report Medical Finding
                    </button>
                    <button 
                        onClick={() => setIsScheduleOpen(true)}
                        className="px-8 py-4 bg-teal-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-teal-900/40 hover:scale-105 active:scale-95 transition-all italic flex items-center gap-3"
                    >
                        <Plus className="w-4 h-4" /> Schedule Study Visit
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {viewMode === 'Timeline' ? (
                    <>
                        {/* Adaptive Participant Switcher */}
                <div className="w-[350px] border-r border-white/5 overflow-y-auto custom-scrollbar bg-white/[0.01]">
                    <div className="p-8 space-y-4">
                        {filteredParticipants.map(participant => (
                            <motion.button
                                key={participant.id}
                                whileHover={{ x: 4 }}
                                onClick={() => setSelectedParticipantId(participant.id)}
                                className={`w-full p-4 rounded-2xl border transition-all text-left relative group overflow-hidden ${
                                    selectedParticipantId === participant.id 
                                        ? 'bg-teal-600/10 border-teal-500/30' 
                                        : 'bg-white/5 border-white/5 hover:border-white/10'
                                }`}
                            >
                                {selectedParticipantId === participant.id && (
                                    <motion.div 
                                        layoutId="activeGlow"
                                        className="absolute inset-0 bg-teal-600/5 blur-xl" 
                                    />
                                )}
                                
                                <div className="flex items-start justify-between relative z-10">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                                <User className="w-5 h-5 text-teal-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-white italic tracking-tight">{participant.id}</h4>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{participant.study}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 pt-2">
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg border border-white/10">
                                                <Activity className="w-3 h-3 text-teal-400" />
                                                <span className="text-xs font-black uppercase text-slate-300">{participant.status}</span>
                                            </div>
                                            <span className="text-xs text-slate-600 font-bold uppercase italic tracking-tighter">Next: {participant.nextVisitDue}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 transition-all ${selectedParticipantId === participant.id ? 'text-teal-400' : 'text-slate-700'}`} />
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#0F172A]/30">
                    {selectedParticipant && (
                        <>
                            <div className="flex items-end justify-between mb-12">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-teal-600/20 text-teal-400 text-xs font-black uppercase tracking-[0.2em] rounded-full italic">INVESTIGATOR PORTAL</span>
                                        <span className="text-slate-700">•</span>
                                        <span className="text-slate-500 text-xs font-black uppercase tracking-widest italic">{selectedParticipant?.coordinator}</span>
                                    </div>
                                    <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">Clinical <br/>Segment Review</h2>
                                </div>
                                
                                <div className="flex gap-4">
                                    {selectedParticipant?.visits?.map(visit => (
                                        <button
                                            key={visit.id}
                                            onClick={() => setSelectedVisitId(visit.id)}
                                            className={`px-8 py-5 rounded-3xl border transition-all text-left group ${
                                                selectedVisitId === visit.id 
                                                    ? 'bg-white text-black border-white' 
                                                    : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
                                            }`}
                                        >
                                            <p className="text-xs font-black uppercase tracking-widest group-hover:text-teal-400 transition-colors mb-1">{visit.scheduledDate}</p>
                                            <p className="text-sm font-black italic uppercase tracking-tight leading-none">{visit.name}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedVisit && (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                    {/* Left Column: Clinical Core */}
                                    <div className="space-y-8">
                                        <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] space-y-10 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-8">
                                                <div className={`px-4 py-1.5 bg-${getStatusColor(selectedVisit.status)}-500/10 text-${getStatusColor(selectedVisit.status)}-400 rounded-full text-xs font-black uppercase tracking-widest border border-${getStatusColor(selectedVisit.status)}-500/20`}>
                                                    {selectedVisit.status}
                                                </div>
                                            </div>

                                            <div className="flex items-end gap-6 pt-4">
                                                <div className="w-20 h-20 bg-teal-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-teal-900/40">
                                                    <Calendar className="w-10 h-10 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase">{selectedVisit.name}</h3>
                                                    <p className="text-sm text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">{selectedVisit.scheduledDate} • SITE VISIT MODEL</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-6 pt-4">
                                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                                    <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-3 italic">Visit Stability</p>
                                                    <p className="text-2xl font-black text-white italic">±3 Days</p>
                                                </div>
                                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                                    <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-3 italic">Segment Target</p>
                                                    <p className="text-2xl font-black text-white italic">V{selectedVisit.id.slice(1)}</p>
                                                </div>
                                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                                    <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-3 italic">Site Hub</p>
                                                    <p className="text-2xl font-black text-white italic">NYC-01</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Progress */}
                                        <div className="p-8 border border-white/5 rounded-[3rem] bg-white/[0.01] space-y-6">
                                            <div className="flex items-center justify-between px-2">
                                                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                                                    <History className="w-4 h-4 text-teal-400" /> Operational Lifecycle
                                                </h4>
                                                <span className="text-xs font-black text-teal-400 uppercase tracking-widest">In Sync</span>
                                            </div>
                                            <div className="flex items-center">
                                                {[
                                                    { label: 'Screened', done: true },
                                                    { label: 'Baseline', done: selectedVisit.id !== 'v1' },
                                                    { label: 'Review', active: true },
                                                    { label: 'Sign-off', disabled: true }
                                                ].map((step, i) => (
                                                    <React.Fragment key={i}>
                                                        <div className="relative flex flex-col items-center flex-1">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                                                step.done ? 'bg-teal-600 border-teal-500' : 
                                                                step.active ? 'bg-[#0B101B] border-teal-500 ring-4 ring-teal-500/20' : 
                                                                'bg-[#0B101B] border-white/10'
                                                            }`}>
                                                                {step.done ? <Check className="w-4 h-4 text-white" /> : <div className={`w-2 h-2 rounded-full ${step.active ? 'bg-teal-500' : 'bg-white/5'}`} />}
                                                            </div>
                                                            <span className={`text-xs font-black uppercase tracking-widest mt-3 ${step.active ? 'text-white italic' : 'text-slate-600'}`}>{step.label}</span>
                                                        </div>
                                                        {i < 3 && <div className={`h-px flex-1 mb-6 ${step.done ? 'bg-teal-600' : 'bg-white/5'}`} />}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Interactive Modules */}
                                    <div className="space-y-8">
                                        {/* Accordion 1: Checklist */}
                                        <div className="border border-white/5 rounded-[3rem] overflow-hidden bg-white/[0.01]">
                                            <button 
                                                onClick={() => setOpenAccordion(openAccordion === 'Checklist' ? null : 'Checklist')}
                                                className="w-full flex items-center justify-between p-8 hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <Clipboard className="w-5 h-5 text-teal-400" />
                                                    <span className="text-[14px] font-black text-white uppercase italic tracking-widest">Study Checklist</span>
                                                </div>
                                                {openAccordion === 'Checklist' ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
                                            </button>
                                            <AnimatePresence>
                                                {openAccordion === 'Checklist' && (
                                                    <motion.div 
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="px-8 pb-8 space-y-4"
                                                    >
                                                        {selectedVisit.checklist.map((item, i) => (
                                                            <div 
                                                                key={i} 
                                                                onClick={() => handleToggleChecklist(i)}
                                                                className="p-5 bg-white/5 rounded-2xl flex items-center justify-between border border-transparent hover:border-white/10 transition-all cursor-pointer group"
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${item.done ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-transparent border-white/10'}`}>
                                                                        {item.done && <Check className="w-4 h-4" />}
                                                                    </div>
                                                                    <span className={`text-sm font-black uppercase italic tracking-tight ${item.done ? 'text-slate-300' : 'text-slate-500'}`}>{item.item}</span>
                                                                </div>
                                                                {item.done && <span className="text-xs font-black text-teal-400 uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 transition-opacity">{item.time} • {item.user}</span>}
                                                            </div>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Accordion 2: Vitals */}
                                        <div className="border border-white/5 rounded-[3rem] overflow-hidden bg-white/[0.01]">
                                            <button 
                                                onClick={() => setOpenAccordion(openAccordion === 'Vitals' ? null : 'Vitals')}
                                                className="w-full flex items-center justify-between p-8 hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <Activity className="w-5 h-5 text-teal-400" />
                                                    <span className="text-[14px] font-black text-white uppercase italic tracking-widest">Anthropometry & Vitals</span>
                                                </div>
                                                {openAccordion === 'Vitals' ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
                                            </button>
                                            <AnimatePresence>
                                                {openAccordion === 'Vitals' && (
                                                    <motion.div 
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="px-8 pb-8 space-y-8"
                                                    >
                                                        <div className="grid grid-cols-2 gap-6">
                                                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-3">
                                                                <p className="text-xs text-slate-600 font-black uppercase tracking-widest italic">Weight (kg)</p>
                                                                <input 
                                                                    type="text" 
                                                                    value={tempVitals.weight}
                                                                                                                                                                                                            onChange={(e) => setTempVitals(v => ({ ...v, weight: e.target.value }))}
                                                                    className="w-full bg-transparent text-3xl font-black text-white italic outline-none border-b-2 border-white/5 focus:border-teal-500/50 transition-all pb-2" 
                                                                />
                                                            </div>
                                                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-3">
                                                                <p className="text-xs text-slate-600 font-black uppercase tracking-widest italic">Height (m)</p>
                                                                <input 
                                                                    type="text" 
                                                                    value={tempVitals.height}
                                                                                                                                                                                                            onChange={(e) => setTempVitals(v => ({ ...v, height: e.target.value }))}
                                                                    className="w-full bg-transparent text-3xl font-black text-white italic outline-none border-b-2 border-white/5 focus:border-teal-500/50 transition-all pb-2" 
                                                                />
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="p-8 bg-teal-500/5 border border-teal-500/10 rounded-[2rem] flex items-center justify-between">
                                                            <div>
                                                                <p className="text-xs text-teal-400 font-black uppercase tracking-widest italic">Computed BMI</p>
                                                                <p className="text-4xl font-black text-white italic mt-1">{bmi || 'N/A'}</p>
                                                            </div>
                                                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                                                                bmi < 18.5 || bmi > 25 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-400'
                                                            }`}>
                                                                {bmi < 18.5 ? 'UNDERWEIGHT' : bmi > 25 ? 'OVERWEIGHT' : 'NORMAL RANGE'}
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Accordion 4: Medical Concerns */}
                                        <div className="border border-white/5 rounded-[3rem] overflow-hidden bg-white/[0.01]">
                                            <button 
                                                onClick={() => setOpenAccordion(openAccordion === 'Concerns' ? null : 'Concerns')}
                                                className="w-full flex items-center justify-between p-8 hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <ShieldAlert className="w-5 h-5 text-red-500" />
                                                    <span className="text-[14px] font-black text-white uppercase italic tracking-widest">Safety & Adverse Events</span>
                                                </div>
                                                {openAccordion === 'Concerns' ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
                                            </button>
                                            <AnimatePresence>
                                                {openAccordion === 'Concerns' && (
                                                    <motion.div 
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="px-8 pb-8 space-y-4"
                                                    >
                                                        {(selectedParticipant?.aeReports || []).length === 0 ? (
                                                            <div className="p-10 border border-white/5 bg-white/5 rounded-3xl text-center">
                                                                <p className="text-xs text-slate-600 italic uppercase font-black tracking-widest">No active clinical findings reported for this subject</p>
                                                            </div>
                                                        ) : (
                                                            selectedParticipant.aeReports.map((ae, idx) => (
                                                                <div key={idx} className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className={`px-3 py-1 rounded text-xs font-black uppercase tracking-widest ${
                                                                            ae.severity === 'SEVERE' ? 'bg-red-500/20 text-red-400' : 
                                                                            ae.severity === 'MODERATE' ? 'bg-orange-500/20 text-orange-400' : 'bg-teal-500/20 text-teal-400'
                                                                        }`}>{ae.severity}</span>
                                                                        <span className="text-xs text-slate-600 font-bold uppercase italic tracking-widest">{new Date(ae.start_date).toLocaleDateString()}</span>
                                                                    </div>
                                                                    <p className="text-sm font-black text-white uppercase italic leading-none">{ae.description}</p>
                                                                    <div className="flex items-center gap-3 pt-2 text-xs uppercase font-black italic">
                                                                        <span className="text-slate-600">Investigator Action:</span>
                                                                        <span className="text-teal-400">{ae.action_taken || 'Active Observation'}</span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PI Sign-Off sticky bar */}
                            <div className="sticky bottom-0 mt-20 -mx-12 -mb-12 p-10 bg-[#0B101B]/95 border-t border-white/10 space-y-8 backdrop-blur-3xl z-20">
                                <div className="flex items-center gap-4">
                                    <Lock className="w-5 h-5 text-amber-500 shrink-0" />
                                    <p className="text-sm text-slate-500 font-black uppercase tracking-[0.3em] italic leading-tight">Secondary Review: Investigator Sign-off Required for Database Lock</p>
                                </div>
                                <div className="flex flex-col md:flex-row gap-6">
                                    <button 
                                        onClick={() => handleSignOff('Approve')}
                                        className="w-full md:flex-1 py-6 bg-emerald-600 text-white rounded-[2rem] text-[14px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-900/40 hover:scale-[1.02] active:scale-95 transition-all italic flex items-center justify-center gap-3"
                                    >
                                        <CheckCircle2 className="w-5 h-5" /> Investigator Sign-off
                                    </button>
                                    <button 
                                        onClick={() => handleSignOff('Flag')}
                                        className="w-full md:flex-1 py-6 bg-white/5 border border-white/5 text-slate-400 rounded-[2rem] text-[14px] font-black uppercase tracking-widest hover:text-white transition-all italic flex items-center justify-center gap-3"
                                    >
                                        <Flag className="w-5 h-5" /> Flag for Clarification
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

            {/* Schedule Visit Modal */}
            <AnimatePresence>
                {isScheduleOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsScheduleOpen(false)}
                            className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100]"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 40 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 40 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] bg-[#0B101B] border border-white/10 rounded-[4rem] z-[101] flex flex-col shadow-2xl overflow-hidden"
                        >
                            <div className="p-16 space-y-16">
                                <div className="flex items-center justify-between border-b border-white/5 pb-10">
                                    <div>
                                        <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Investigator <br/>Scheduling Lead</h3>
                                        <p className="text-sm text-teal-400 font-black uppercase tracking-[0.4em] mt-4 italic">Override Protocol Window for Safety or Pk Alignment</p>
                                    </div>
                                    <button onClick={() => setIsScheduleOpen(false)} className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                                        <X className="w-8 h-8 text-slate-500" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-12">
                                    <div className="space-y-4">
                                        <label className="text-sm text-slate-600 font-black uppercase tracking-widest italic">Research Protocol (Study)</label>
                                        <div className="relative">
                                            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400" />
                                            <select 
                                                value={scheduleData.studyId}
                                                onChange={(e) => setScheduleData(prev => ({ ...prev, studyId: e.target.value, participantId: '', taskId: '' }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-8 py-5 text-sm font-black italic uppercase text-white outline-none appearance-none focus:border-teal-500/50 transition-all"
                                            >
                                                <option value="">Select Study Portfolio</option>
                                                {allStudies.map(s => (
                                                    <option key={s.id} value={s.id}>{s.protocol_id} - {s.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-sm text-slate-600 font-black uppercase tracking-widest italic">Target Participant (Subject)</label>
                                        <div className="relative">
                                            <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400" />
                                            <select 
                                                value={scheduleData.participantId}
                                                onChange={(e) => setScheduleData(prev => ({ ...prev, participantId: e.target.value }))}
                                                disabled={!scheduleData.studyId}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-8 py-5 text-sm font-black italic uppercase text-white outline-none appearance-none focus:border-teal-500/50 transition-all disabled:opacity-30"
                                            >
                                                <option value="">{scheduleData.studyId ? 'Select Clinical Subject' : 'Select Study First'}</option>
                                                {participants.filter(p => !scheduleData.studyId || p.study_id === scheduleData.studyId || p.study === scheduleData.studyId).map(p => (
                                                    <option key={p.id} value={p.id}>{p.id} ({p.status})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-sm text-slate-600 font-black uppercase tracking-widest italic">Protocol Visit Segment</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400" />
                                            <select 
                                                value={scheduleData.visitType}
                                                onChange={(e) => setScheduleData(prev => ({ ...prev, visitType: e.target.value }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-8 py-5 text-sm font-black italic uppercase text-white outline-none appearance-none focus:border-teal-500/50 transition-all"
                                            >
                                                <option>Screening Visit</option>
                                                <option>Baseline / Dosing</option>
                                                <option>Week 4 Follow-up</option>
                                                <option>Week 8 Assessment</option>
                                                <option>Final Outcome</option>
                                                <option>Unscheduled Visit</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-sm text-slate-600 font-black uppercase tracking-widest italic">Assign Automated Task</label>
                                        <div className="relative">
                                            <Clipboard className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400" />
                                            <select 
                                                value={scheduleData.taskId}
                                                onChange={(e) => setScheduleData(prev => ({ ...prev, taskId: e.target.value }))}
                                                disabled={!scheduleData.studyId}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-8 py-5 text-sm font-black italic uppercase text-white outline-none appearance-none focus:border-teal-500/50 transition-all disabled:opacity-30"
                                            >
                                                <option value="">Push Optional Protocol Task</option>
                                                {studyTasks.map(t => (
                                                    <option key={t.id} value={t.id}>{t.title} ({t.task_type})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-sm text-slate-600 font-black uppercase tracking-widest italic">Scheduled Alignment (Epoch)</label>
                                        <div className="flex gap-4">
                                            <div className="relative flex-1">
                                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                                <input 
                                                    type="date" 
                                                    value={scheduleData.date}
                                                    onChange={(e) => setScheduleData(prev => ({ ...prev, date: e.target.value }))}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-mono font-black text-white outline-none focus:border-teal-500/50 transition-all" 
                                                />
                                            </div>
                                            <div className="relative flex-1">
                                                <input 
                                                    type="time" 
                                                    value={scheduleData.time}
                                                    onChange={(e) => setScheduleData(prev => ({ ...prev, time: e.target.value }))}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-mono font-black text-white outline-none focus:border-teal-500/50 transition-all" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-sm text-slate-600 font-black uppercase tracking-widest italic">Site Interaction Model</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['Clinic Visit', 'Home Visit', 'Virtual Hub'].map(m => (
                                                <button key={m} className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-black uppercase tracking-widest italic text-slate-500 hover:text-white hover:border-teal-500/50 transition-all active:scale-95">
                                                    {m}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 pt-12 border-t border-white/5">
                                    <button 
                                        onClick={() => setIsScheduleOpen(false)}
                                        className="px-12 py-6 bg-white/5 text-slate-500 rounded-[2rem] text-sm font-black uppercase tracking-widest hover:text-white transition-all italic"
                                    >
                                        Discard
                                    </button>
                                    <button 
                                        onClick={handleScheduleConfirm}
                                        className="flex-1 py-6 bg-teal-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl shadow-teal-900/40 hover:scale-[1.02] active:scale-95 transition-all italic"
                                    >
                                        Protocol Deployment
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
                {isProblemModalOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProblemModalOpen(false)} className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[100]" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 40 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] bg-[#0B101B] border border-white/10 rounded-[4rem] z-[101] p-16 space-y-12 shadow-2xl">
                             <div className="flex items-center justify-between border-b border-white/5 pb-10">
                                <div>
                                    <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Clinical Finding <br/><span className="text-red-500">Notice</span></h3>
                                    <p className="text-sm text-red-400/60 font-black uppercase tracking-[0.4em] mt-4 italic">Expedited Adverse Event Recording</p>
                                </div>
                                <ShieldAlert className="w-12 h-12 text-red-500" />
                             </div>
                             
                             <div className="space-y-10">
                                 <div className="space-y-4">
                                     <label className="text-sm text-slate-500 uppercase font-black tracking-widest italic">Segment Finding Description</label>
                                     <textarea 
                                        value={problemData.description} 
                                        onChange={e => setProblemData(prev => ({ ...prev, description: e.target.value }))} 
                                        placeholder="Enter clinical observations, symptoms, or abnormal lab results..."
                                        className="w-full h-40 bg-white/5 border border-white/10 rounded-3xl p-6 text-white text-[14px] font-black italic uppercase outline-none focus:border-red-500/40 transition-all resize-none"
                                     />
                                 </div>

                                 <div className="grid grid-cols-2 gap-10">
                                     <div className="space-y-4">
                                         <label className="text-sm text-slate-500 uppercase font-black tracking-widest italic">Investigator Severity Rating</label>
                                         <select 
                                            value={problemData.severity} 
                                            onChange={e => setProblemData(prev => ({ ...prev, severity: e.target.value as any }))} 
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white uppercase text-sm font-black italic outline-none appearance-none"
                                         >
                                             <option value="MILD">Grade 1: Mild</option>
                                             <option value="MODERATE">Grade 2: Moderate</option>
                                             <option value="SEVERE">Grade 3: Severe / SAE</option>
                                         </select>
                                     </div>
                                     <div className="space-y-4">
                                         <label className="text-sm text-slate-500 uppercase font-black tracking-widest italic">Protocol Product Relation</label>
                                         <select 
                                            value={problemData.related_to_product} 
                                            onChange={e => setProblemData(prev => ({ ...prev, related_to_product: e.target.value as any }))} 
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white uppercase text-sm font-black italic outline-none appearance-none"
                                         >
                                             <option value="YES">Related to Mission</option>
                                             <option value="NO">Not Related</option>
                                             <option value="UNSURE">Uncertain Relation</option>
                                         </select>
                                     </div>
                                 </div>

                                 <div className="space-y-4">
                                     <label className="text-sm text-slate-500 uppercase font-black tracking-widest italic">Clinical Intervention / Action</label>
                                     <input 
                                        type="text"
                                        value={problemData.action_taken} 
                                        onChange={e => setProblemData(prev => ({ ...prev, action_taken: e.target.value }))} 
                                        placeholder="e.g., Hospitalization, Study Drug Withheld, Monitoring Only..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-sm font-black italic uppercase outline-none focus:border-teal-500/40 transition-all"
                                     />
                                 </div>

                                 <div className="flex gap-6 pt-4">
                                     <button onClick={() => setIsProblemModalOpen(false)} className="px-12 py-6 bg-white/5 text-slate-500 rounded-[2rem] text-sm font-black uppercase tracking-widest hover:text-white transition-all italic">
                                         Cancel
                                     </button>
                                     <button onClick={handleProblemConfirm} className="flex-1 py-6 bg-red-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl shadow-red-900/40 hover:scale-[1.02] active:scale-95 transition-all italic">
                                         Submit Site Finding
                                     </button>
                                 </div>
                             </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
