import React, { useState, useMemo } from 'react';
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
    Users
} from 'lucide-react';

interface Assessment {
    id: string;
    name: string;
    status: 'Completed' | 'Pending' | 'Locked';
}

interface VisitNode {
    id: string;
    name: string;
    scheduledDate: string;
    status: 'Completed' | 'Scheduled' | 'Missed' | 'Overdue' | 'Not Scheduled';
    window: string;
    actualDate?: string;
    checklist: { item: string; done: boolean; time?: string; user?: string }[];
    assessments: Assessment[];
    vitals: { weight: number; height: number; bmi: number; bp: string; hr: number; temp: number };
    meds: { dispensed: string; dose: string; compliance: number };
}

interface Participant {
    id: string;
    status: 'Screening' | 'Active' | 'Completed';
    coordinator: string;
    nextVisitDue: string;
    study: string;
    visits: VisitNode[];
}

const MOCK_PARTICIPANTS: Participant[] = [
    {
        id: 'BTB-023',
        status: 'Active',
        coordinator: 'Sarah Jenkins',
        nextVisitDue: '2026-03-24',
        study: 'Hyper-Immunity Phase II',
        visits: [
            {
                id: 'v1',
                name: 'Screening',
                scheduledDate: '2026-01-05',
                actualDate: '2026-01-05',
                status: 'Completed',
                window: '±3 days',
                checklist: [
                    { item: 'Informed Consent Verified', done: true, time: '09:00', user: 'SJ' },
                    { item: 'Vitals Collected', done: true, time: '09:15', user: 'SJ' },
                    { item: 'Inclusion/Exclusion Reviewed', done: true, time: '09:45', user: 'SJ' }
                ],
                assessments: [
                    { id: 'a1', name: 'Baseline Symptoms', status: 'Locked' },
                    { id: 'a2', name: 'GI History Map', status: 'Locked' }
                ],
                vitals: { weight: 78.5, height: 1.82, bmi: 23.7, bp: '120/80', hr: 72, temp: 36.6 },
                meds: { dispensed: 'Placebo', dose: '1 Cap', compliance: 100 }
            },
            {
                id: 'v2',
                name: 'Baseline',
                scheduledDate: '2026-01-15',
                actualDate: '2026-01-15',
                status: 'Completed',
                window: '±2 days',
                checklist: [
                    { item: 'Randomization Complete', done: true, time: '10:00', user: 'SJ' },
                    { item: 'Dose 1 Administered', done: true, time: '10:30', user: 'SJ' }
                ],
                assessments: [
                    { id: 'a3', name: 'SF-36 Health Survey', status: 'Locked' }
                ],
                vitals: { weight: 79.0, height: 1.82, bmi: 23.8, bp: '122/82', hr: 68, temp: 36.7 },
                meds: { dispensed: 'HI-202B', dose: '100mg', compliance: 100 }
            },
            {
                id: 'v3',
                name: 'Week 4',
                scheduledDate: '2026-02-15',
                actualDate: '2026-02-16',
                status: 'Completed',
                window: '±5 days',
                checklist: [
                    { item: 'Blood Sample Collected', done: true, time: '08:30', user: 'SJ' },
                    { item: 'AE Review', done: true, time: '09:00', user: 'SJ' }
                ],
                assessments: [
                    { id: 'a4', name: 'GSRS Questionnaire', status: 'Locked' }
                ],
                vitals: { weight: 78.2, height: 1.82, bmi: 23.6, bp: '118/78', hr: 74, temp: 36.5 },
                meds: { dispensed: 'HI-202B', dose: '100mg', compliance: 92 }
            },
            {
                id: 'v4',
                name: 'Week 8',
                scheduledDate: '2026-03-24',
                status: 'Scheduled',
                window: '±5 days',
                checklist: [
                    { item: 'Collect Stool Sample', done: false },
                    { item: 'Review Adherence', done: false },
                    { item: 'Dispense Meds', done: false }
                ],
                assessments: [
                    { id: 'a5', name: 'Final Outcomes', status: 'Pending' }
                ],
                vitals: { weight: 0, height: 1.82, bmi: 0, bp: '', hr: 0, temp: 0 },
                meds: { dispensed: 'HI-202B', dose: '100mg', compliance: 0 }
            }
        ]
    },
    {
        id: 'BTB-045',
        status: 'Active',
        coordinator: 'Elena Rodriguez',
        nextVisitDue: '2026-03-10',
        study: 'Hyper-Immunity Phase II',
        visits: [
            {
                id: 'v5',
                name: 'Screening',
                scheduledDate: '2026-02-01',
                actualDate: '2026-02-01',
                status: 'Completed',
                window: '±3 days',
                checklist: [],
                assessments: [],
                vitals: { weight: 65, height: 1.65, bmi: 23.9, bp: '110/70', hr: 70, temp: 36.6 },
                meds: { dispensed: 'N/A', dose: 'N/A', compliance: 100 }
            },
            {
                id: 'v6',
                name: 'Baseline',
                scheduledDate: '2026-03-10',
                status: 'Overdue',
                window: '±2 days',
                checklist: [],
                assessments: [],
                vitals: { weight: 0, height: 1.65, bmi: 0, bp: '', hr: 0, temp: 0 },
                meds: { dispensed: 'HI-202B', dose: '100mg', compliance: 0 }
            }
        ]
    }
];

export default function VisitsModule() {
    const [viewMode, setViewMode] = useState<'Timeline' | 'Calendar'>('Timeline');
    const [participants, setParticipants] = useState<Participant[]>(MOCK_PARTICIPANTS);
    const [selectedParticipantId, setSelectedParticipantId] = useState<string>(MOCK_PARTICIPANTS[0].id);
    const [selectedNodeId, setSelectedNodeId] = useState<string>(MOCK_PARTICIPANTS[0].visits[0].id);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [openAccordion, setOpenAccordion] = useState<string | null>('Checklist');
    const [tempVitals, setTempVitals] = useState({ weight: 78.5, height: 1.82 });

    const selectedParticipant = useMemo(() => 
        participants.find(p => p.id === selectedParticipantId) || participants[0],
    [participants, selectedParticipantId]);

    const selectedVisit = useMemo(() => 
        selectedParticipant.visits.find(v => v.id === selectedNodeId) || selectedParticipant.visits[0],
    [selectedParticipant, selectedNodeId]);

    const bmi = useMemo(() => {
        if (!tempVitals.weight || !tempVitals.height) return 0;
        return parseFloat((tempVitals.weight / (tempVitals.height * tempVitals.height)).toFixed(1));
    }, [tempVitals]);

    const filteredParticipants = useMemo(() => {
        return participants.filter(p => p.id.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [participants, searchQuery]);

    const handleToggleChecklist = (itemIndex: number) => {
        setParticipants(prev => prev.map(p => {
            if (p.id !== selectedParticipantId) return p;
            return {
                ...p,
                visits: p.visits.map(v => {
                    if (v.id !== selectedNodeId) return v;
                    const newChecklist = [...v.checklist];
                    newChecklist[itemIndex] = { 
                        ...newChecklist[itemIndex], 
                        done: !newChecklist[itemIndex].done,
                        time: !newChecklist[itemIndex].done ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
                        user: !newChecklist[itemIndex].done ? 'SJ' : undefined
                    };
                    return { ...v, checklist: newChecklist };
                })
            };
        }));
    };

    const handleSignOff = (action: 'Approve' | 'Flag') => {
        const confirmMsg = action === 'Approve' ? 'Confirm clinical sign-off for this visit?' : 'Flag this visit for PI review?';
        if (window.confirm(confirmMsg)) {
            setParticipants(prev => prev.map(p => {
                if (p.id !== selectedParticipantId) return p;
                return {
                    ...p,
                    visits: p.visits.map(v => {
                        if (v.id !== selectedNodeId) return v;
                        return { ...v, status: action === 'Approve' ? 'Completed' : v.status };
                    })
                };
            }));
        }
    };

    const getStatusColor = (status: VisitNode['status']) => {
        switch (status) {
            case 'Completed': return 'emerald';
            case 'Scheduled': return 'indigo';
            case 'Overdue': return 'red';
            case 'Missed': return 'red text-opacity-50';
            default: return 'slate';
        }
    };

    return (
        <div className="max-w-[1920px] mx-auto flex flex-col h-[calc(100vh-14rem)] bg-[#0B101B] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">

            {/* Top Bar (Sticky) */}
            <div className="flex-shrink-0 px-6 lg:px-10 py-4 lg:py-8 bg-[#0B101B]/80 backdrop-blur-3xl border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8 z-40">
                <div className="flex flex-col md:flex-row md:items-center gap-3 lg:gap-8">
                    <h2 className="text-lg lg:text-2xl font-black text-white italic uppercase tracking-tighter">Visits & Assessments</h2>
                    <div className="flex bg-white/5 p-1 rounded-xl lg:rounded-2xl border border-white/5 self-start">
                        <button 
                            onClick={() => setViewMode('Timeline')}
                            className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl text-[8px] lg:text-[9px] font-black uppercase tracking-widest transition-all ${
                                viewMode === 'Timeline' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                            }`}
                        >
                            Flow Timeline
                        </button>
                        <button 
                            onClick={() => setViewMode('Calendar')}
                            className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl text-[8px] lg:text-[9px] font-black uppercase tracking-widest transition-all ${
                                viewMode === 'Calendar' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                            }`}
                        >
                            Full Calendar
                        </button>
                    </div>
                </div>
                <div className="flex flex-row items-stretch items-center gap-3 lg:gap-6">
                    <div className="relative flex-1 lg:w-64">
                        <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-3 h-3 lg:w-4 lg:h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl pl-10 pr-4 py-2 lg:py-2.5 text-[8px] lg:text-[9px] text-white placeholder-slate-700 outline-none focus:border-indigo-500/50 uppercase tracking-widest"
                        />
                    </div>
                    <button 
                        onClick={() => setIsScheduleOpen(true)}
                        className="px-4 lg:px-6 py-2.5 lg:py-4 bg-indigo-600 text-white rounded-xl lg:rounded-2xl text-[8px] lg:text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-900/40 whitespace-nowrap"
                    >
                        + Schedule
                    </button>
                </div>
            </div>


            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Adaptive Participant Switcher */}
                <div className="w-full lg:w-[260px] xl:w-[320px] h-[160px] lg:h-full border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col overflow-hidden bg-white/[0.01] shrink-0">
                    <div className="flex p-3 lg:p-4 border-b border-white/5 items-center justify-between bg-white/[0.02]">

                        <span className="text-[7px] lg:text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{filteredParticipants.length} SITE SUBJECTS</span>
                        <LayoutGrid className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-600" />
                    </div>


                    <div className="flex-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-y-auto no-scrollbar lg:custom-scrollbar p-4 lg:p-6 gap-3 lg:gap-4 lg:space-y-4">
                        {filteredParticipants.map(p => (
                            <button 
                                key={p.id}
                                onClick={() => setSelectedParticipantId(p.id)}
                                className={`flex-shrink-0 lg:w-full min-w-[200px] lg:min-w-0 text-left p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border transition-all relative group overflow-hidden ${
                                    selectedParticipantId === p.id 
                                        ? 'bg-indigo-600/10 border-indigo-500 shadow-xl' 
                                        : 'bg-white/5 border-white/5 hover:border-white/10'
                                }`}
                            >

                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Users className={`w-3 h-3 ${selectedParticipantId === p.id ? 'text-indigo-400' : 'text-slate-600'}`} />
                                        <span className="text-[9px] lg:text-[10px] font-black text-white italic uppercase tracking-wider">{p.id}</span>
                                    </div>
                                    <div className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${p.visits.some(v => v.status === 'Overdue') ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                                </div>
                                <p className="text-[7px] lg:text-[8px] text-indigo-400/60 font-extrabold uppercase tracking-widest mb-3 lg:mb-4 italic truncate">{p.coordinator}</p>
                                <div className="flex items-center justify-between pt-3 lg:pt-4 border-t border-white/5">
                                    <div className="space-y-0.5">
                                        <p className="text-[6px] lg:text-[7px] text-slate-600 font-black uppercase tracking-widest">Next</p>
                                        <p className="text-[8px] lg:text-[9px] text-slate-300 font-mono font-black italic">{p.nextVisitDue}</p>
                                    </div>
                                    <span className="px-2 py-0.5 bg-white/5 rounded-md text-[6px] lg:text-[7px] font-black text-slate-500 uppercase italic">{p.status}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>



                {/* Center Panel: Visit Timeline Hub */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 lg:p-6 xl:p-12 bg-[#0B101B] min-h-[450px] lg:min-h-0">
                    <div className="max-w-4xl mx-auto space-y-10 lg:space-y-16">



                        <section>
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 lg:mb-12 gap-6">
                                <div>
                                    <h3 className="text-2xl lg:text-3xl font-black text-white italic uppercase tracking-tighter">Visit Protocol Flow</h3>
                                    <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em] lg:tracking-[0.3em] mt-2 italic">#{selectedParticipant.id} • {selectedParticipant.study}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 lg:gap-4 pb-4 lg:pb-0">
                                    {['Overdue', 'Scheduled', 'Completed'].map(s => (
                                        <div key={s} className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-${s === 'Overdue' ? 'red' : s === 'Completed' ? 'emerald' : 'indigo'}-500`} />
                                            <span className="text-[8px] font-black text-slate-600 uppercase italic">{s}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="relative overflow-x-auto no-scrollbar pb-8 lg:pb-0">
                                <div className="min-w-[600px] flex items-center justify-between px-4">
                                    {/* Timeline Connector */}
                                    <div className="absolute left-10 right-10 top-[calc(50%-12px)] h-[1px] bg-gradient-to-r from-emerald-500/50 via-indigo-500/50 to-slate-800" />
                                    
                                    {selectedParticipant.visits.map((node, i) => (
                                        <button 
                                            key={node.id}
                                            onClick={() => setSelectedNodeId(node.id)}
                                            className="relative group flex flex-col items-center gap-4 lg:gap-6 z-10 basis-0 grow"
                                        >
                                            <p className={`text-[8px] lg:text-[9px] font-black uppercase tracking-widest italic transition-all ${selectedNodeId === node.id ? 'text-white' : 'text-slate-600'}`}>
                                                {node.name}
                                            </p>
                                            <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center border-2 lg:border-4 transition-all ${
                                                node.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 
                                                node.status === 'Overdue' ? 'bg-red-500/10 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 
                                                selectedNodeId === node.id ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 
                                                'bg-white/5 border-white/5'
                                            }`}>
                                                {node.status === 'Completed' ? <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-400" /> : 
                                                 node.status === 'Overdue' ? <AlertCircle className="w-5 h-5 lg:w-6 lg:h-6 text-red-500 animate-pulse" /> : 
                                                 <div className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${selectedNodeId === node.id ? 'bg-white' : 'bg-slate-700'}`} />}
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[9px] lg:text-[10px] text-white font-mono font-black italic">{node.scheduledDate}</p>
                                                <p className={`text-[7px] font-black uppercase tracking-tighter mt-1 ${
                                                    node.status === 'Completed' ? 'text-emerald-500' : 'text-slate-700'
                                                }`}>{node.status}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>


                        <section className="pt-8 lg:pt-16 border-t border-white/5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-2 gap-4 lg:gap-8">
                                <div className="p-5 lg:p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl lg:rounded-[2.5rem] flex items-center justify-between group min-h-[100px] lg:min-h-0">
                                    <div className="flex items-center gap-3 lg:gap-6">
                                        <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-2xl lg:rounded-3xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                            <Activity className="w-5 h-5 lg:w-7 lg:h-7" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[7px] lg:text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] italic truncate">Adherence Index</p>
                                            <p className="text-xl lg:text-4xl font-black text-white italic uppercase tracking-tighter mt-1 lg:mt-2">92<span className="text-indigo-500">%</span></p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 text-indigo-800 opacity-0 group-hover:opacity-100 transition-all translate-x-4 lg:group-hover:translate-x-0 hidden sm:block" />
                                </div>
                                <div className="p-5 lg:p-8 bg-white/5 border border-white/5 rounded-2xl lg:rounded-[2.5rem] flex flex-col justify-center min-h-[100px] lg:min-h-0">
                                    <p className="text-[7px] lg:text-[10px] text-slate-600 font-black uppercase tracking-widest italic mb-2 lg:mb-3 truncate">Next Target Window</p>
                                    <div className="flex items-center gap-3 lg:gap-4">
                                        <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-400 shrink-0" />
                                        <p className="text-[10px] lg:text-sm font-black text-white italic uppercase truncate">{selectedParticipant.nextVisitDue} <span className="text-slate-600 mx-1 lg:mx-2">±</span> {selectedVisit.window}</p>
                                    </div>
                                </div>
                            </div>
                        </section>



                        <div className="p-5 lg:p-10 bg-white/[0.02] border border-white/5 rounded-2xl lg:rounded-[3rem] space-y-4 lg:space-y-6">
                            <div className="flex items-center gap-3 lg:gap-4 text-emerald-400 italic">
                                <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
                                <span className="text-[9px] lg:text-[11px] font-black uppercase tracking-[0.2em]">Scientific Summary Line</span>
                            </div>
                            <p className="text-[10px] lg:text-sm font-black text-slate-400 italic leading-relaxed uppercase tracking-tight break-words whitespace-normal">
                                "Participant has completed 3 out of 4 scheduled visits. Baseline data locked. No critical deviations reported in Week 4 visit. Dosing compliance remains above the primary endpoint threshold (92%)."
                            </p>
                        </div>
                    </div>
                </div>



                {/* Right Panel: Granular Visit Details (Accordions) */}
                <div className="w-full lg:w-[350px] xl:w-[450px] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col lg:h-full overflow-hidden bg-white/[0.02] shrink-0 relative">

                    <div className="p-6 lg:p-8 border-b border-white/5 bg-white/[0.01]">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <div className="space-y-1">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{selectedVisit.name} DETAIL</h4>
                                <p className="text-[8px] text-indigo-400 font-black uppercase tracking-widest">#{selectedParticipant.id} • {selectedParticipant.coordinator}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shrink-0 ${
                                selectedVisit.status === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'
                            }`}>
                                {selectedVisit.status}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <button className="flex-1 min-w-[180px] py-4 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-indigo-900/40 hover:scale-[1.02] transition-all italic">Start Visit Sequence</button>
                            <button className="p-4 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white shrink-0"><MoreVertical className="w-5 h-5" /></button>
                        </div>
                    </div>


                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-4">
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
                                    {selectedVisit.checklist.map((item, i) => (
                                        <div 
                                            key={i} 
                                            onClick={() => handleToggleChecklist(i)}
                                            className="p-3 lg:p-4 bg-white/5 rounded-2xl flex items-center justify-between border border-transparent hover:border-white/10 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${item.done ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-transparent border-white/10'}`}>
                                                    {item.done && <Check className="w-3 h-3" />}
                                                </div>
                                                <span className={`text-[10px] lg:text-[11px] font-black uppercase italic tracking-tight ${item.done ? 'text-slate-300' : 'text-slate-500'}`}>{item.item}</span>
                                            </div>

                                            {item.done && <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity font-mono">{item.time} • {item.user}</span>}
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
                                    <span className="text-[10px] font-black text-white uppercase italic tracking-widest">Anthropometry & Vitals</span>
                                </div>
                                {openAccordion === 'Vitals' ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                            </button>
                            {openAccordion === 'Vitals' && (
                                <div className="px-6 pb-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                            <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest italic">Weight (kg)</p>
                                            <input 
                                                type="text" 
                                                value={tempVitals.weight}
                                                onChange={(e) => setTempVitals(v => ({ ...v, weight: parseFloat(e.target.value) || 0 }))}
                                                className="w-full bg-transparent text-xl font-black text-white italic outline-none border-b border-white/5 focus:border-indigo-500/50" 
                                            />
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                            <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest italic">Height (m)</p>
                                            <input 
                                                type="text" 
                                                value={tempVitals.height}
                                                onChange={(e) => setTempVitals(v => ({ ...v, height: parseFloat(e.target.value) || 0 }))}
                                                className="w-full bg-transparent text-xl font-black text-white italic outline-none border-b border-white/5 focus:border-indigo-500/50" 
                                            />
                                        </div>
                                    </div>
                                    <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest italic">Computed BMI</p>
                                            <p className="text-2xl font-black text-white italic mt-1">{bmi || 'N/A'}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                            bmi < 18.5 || bmi > 25 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-400'
                                        }`}>
                                            {bmi < 18.5 ? 'UNDERWEIGHT' : bmi > 25 ? 'OVERWEIGHT' : 'NORMAL RANGE'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                         {[
                                             { label: 'Blood Pressure', val: selectedVisit.vitals.bp, icon: Activity },
                                             { label: 'Heart Rate', val: selectedVisit.vitals.hr, icon: Activity },
                                             { label: 'Temperature', val: selectedVisit.vitals.temp, icon: Thermometer }
                                         ].map((v, i) => (
                                             <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                                 <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest italic">{v.label}</p>
                                                 <div className="flex items-center gap-2">
                                                     <v.icon className="w-3.5 h-3.5 text-indigo-400/40" />
                                                     <p className="text-sm font-black text-white italic">{v.val || '--'}</p>
                                                 </div>
                                             </div>
                                         ))}
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
                                    <span className="text-[10px] font-black text-white uppercase italic tracking-widest">Intervention Adherence</span>
                                </div>
                                {openAccordion === 'Meds' ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                            </button>
                            {openAccordion === 'Meds' && (
                                <div className="px-6 pb-6 space-y-6">
                                    <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9px] text-slate-500 font-black uppercase italic">Current Dispensation</p>
                                            <span className="text-[9px] font-black text-indigo-400 font-mono tracking-widest">LOT #HI2026-X1</span>
                                        </div>
                                        <p className="text-xl font-black text-white uppercase italic tracking-wider">{selectedVisit.meds.dispensed}</p>
                                        <p className="text-[10px] text-slate-600 font-black uppercase italic">Dose Sequence: {selectedVisit.meds.dose} @ ID-887</p>
                                    </div>
                                    <div className="relative pt-6">
                                        <div className="flex items-center justify-between mb-3 text-[9px] font-black uppercase tracking-widest italic">
                                            <span className="text-slate-500">Compliance Rate</span>
                                            <span className={`${selectedVisit.meds.compliance < 80 ? 'text-red-500' : 'text-emerald-500'}`}>{selectedVisit.meds.compliance}% Verified</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${selectedVisit.meds.compliance}%` }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                         {/* Sections for Safety, Labs, Docs simplified */}
                         <div className="p-6 border border-white/5 rounded-[2rem] bg-white/[0.01] flex items-center justify-between group cursor-pointer hover:border-white/10 transition-all">
                             <div className="flex items-center gap-4">
                                <ShieldAlert className="w-4 h-4 text-red-500" />
                                <span className="text-[10px] font-black text-white uppercase italic tracking-widest">Safety & Adverse Events</span>
                             </div>
                             <span className="text-[8px] font-black text-slate-700 uppercase italic">None Reported</span>
                         </div>
                    </div>

                    {/* PI Review & Sign-Off Panel (Sticky) */}
                    <div className="sticky bottom-0 mt-auto p-6 lg:p-8 bg-[#0B101B]/95 border-t border-white/10 space-y-6 backdrop-blur-3xl z-20">
                        <div className="flex items-center gap-3">
                            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Clinical Sign-off Authorization Required</p>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4">
                            <button 
                                onClick={() => handleSignOff('Approve')}
                                className="w-full md:flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/40 hover:scale-[1.02] active:scale-95 transition-all italic flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Approve Visit
                            </button>
                            <button className="w-full md:flex-1 py-4 bg-white/5 border border-white/5 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all italic">
                                Request correction
                            </button>
                            <button 
                                onClick={() => handleSignOff('Flag')}
                                className="p-4 bg-white/5 border border-white/5 text-red-500/60 rounded-2xl hover:bg-red-500/20 hover:text-red-400 transition-all shrink-0 self-center md:self-auto"
                            >
                                <Flag className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-[8px] text-slate-700 font-extrabold uppercase text-center italic tracking-widest">Digital signature will be appended upon biometric verification</p>
                    </div>
                </div>
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
                            className="fixed inset-0 bg-black/90 backdrop-blur-lg z-[100]"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] bg-[#0B101B] border border-white/10 rounded-[4rem] z-[101] flex flex-col shadow-2xl p-16 space-y-12"
                        >
                            <div className="flex items-center justify-between border-b border-white/5 pb-8">
                                <div>
                                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Protocol Scheduling Interface</h3>
                                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mt-3 italic">Sync visit window with global GCP timing</p>
                                </div>
                                <X className="w-8 h-8 text-slate-600 cursor-pointer hover:text-white transition-colors" onClick={() => setIsScheduleOpen(false)} />
                            </div>

                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[9px] text-slate-600 font-black uppercase tracking-widest italic">Participant ID</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-sm font-black italic uppercase text-white outline-none appearance-none">
                                        <option>BTB-023</option>
                                        <option>BTB-045</option>
                                        <option>BTB-089</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[9px] text-slate-600 font-black uppercase tracking-widest italic">Protocol Visit Type</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-sm font-black italic uppercase text-white outline-none appearance-none">
                                        <option>Screening Visit</option>
                                        <option>Baseline / Dosing</option>
                                        <option>Week 4 Follow-up</option>
                                        <option>Week 8 Assessment</option>
                                        <option>End of Study</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[9px] text-slate-600 font-black uppercase tracking-widest italic">Scheduled Epoch</label>
                                    <div className="flex gap-4">
                                        <input type="date" className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-mono font-black text-white outline-none" />
                                        <input type="time" className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-mono font-black text-white outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[9px] text-slate-600 font-black uppercase tracking-widest italic">Site Interaction Model</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Clinic Visit', 'Home Visit', 'Virtual Hub'].map(m => (
                                            <button key={m} className="px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest italic text-slate-500 hover:text-white hover:border-indigo-500/50 transition-all">
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-12 border-t border-white/5 flex items-center justify-between">
                                <button onClick={() => setIsScheduleOpen(false)} className="px-10 py-5 text-[10px] font-black text-slate-700 uppercase tracking-widest hover:text-white">Cancel Alignment</button>
                                <div className="flex gap-6">
                                    <button className="px-10 py-5 bg-white/5 border border-white/5 text-slate-400 rounded-3xl text-[10px] font-black uppercase tracking-widest">Save Temporary Draft</button>
                                    <button 
                                        onClick={() => setIsScheduleOpen(false)}
                                        className="px-14 py-5 bg-indigo-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-900/40 hover:scale-105 transition-all italic"
                                    >
                                        Confirm & Notify Coordinator
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
