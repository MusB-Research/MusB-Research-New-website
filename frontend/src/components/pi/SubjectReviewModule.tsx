import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, 
    Beaker, 
    CheckCircle2, 
    AlertCircle, 
    XCircle, 
    MessageSquare, 
    Flag, 
    FileText, 
    Activity, 
    Thermometer, 
    Clipboard, 
    History, 
    ArrowUpRight, 
    Download, 
    Plus, 
    ShieldAlert, 
    Search,
    ChevronDown,
    ChevronUp,
    Droplet,
    TrendingUp,
    MoreHorizontal,
    Bell,
    Check
} from 'lucide-react';

interface Assessment {
    name: string;
    value: string | number;
    unit?: string;
    range?: string;
    status: 'normal' | 'alert' | 'critical';
}

interface Visit {
    id: string;
    name: string;
    date: string;
    status: 'Completed' | 'Pending' | 'Missed' | 'Scheduled';
    assessments: string[];
    notes: string;
}

interface AdverseEvent {
    id: string;
    term: string;
    severity: 'Mild' | 'Moderate' | 'Severe';
    relatedness: 'Related' | 'Not Related' | 'Unknown';
    date: string;
    status: 'Open' | 'Resolved';
}

export default function SubjectReviewModule() {
    const [activeSection, setActiveSection] = useState<string>('Overview');
    const [status, setStatus] = useState<'Screening' | 'Enrolled' | 'Active' | 'Completed' | 'Withdrawn'>('Active');
    const [eligibility, setEligibility] = useState<'Eligible' | 'Pending' | 'Rejected'>('Eligible');
    const [isFlagged, setIsFlagged] = useState(false);
    const [auditLog, setAuditLog] = useState<any[]>([
        { action: 'Site Monitoring Visit', user: 'Sarah Jenkins', time: '2026-03-19 14:22' },
        { action: 'Protocol Deviation Marked', user: 'Mark Wilson', time: '2026-03-18 10:05' },
        { action: 'Informed Consent Verified', user: 'Elena Rodriguez', time: '2026-03-15 09:44' }
    ]);

    const participant = {
        id: 'BTB-023',
        name: 'Michael Henderson',
        age: 44,
        sex: 'Male',
        study: 'Hyper-Immunity Phase II',
        protocol: 'HI-202B',
        arm: 'Cohort A (High Dose)',
        enrollmentDate: '2026-01-15',
        location: 'West Miami Research Hub',
        coordinator: 'Sarah Jenkins',
        complianceRate: 88,
        visitsCompleted: 4,
        totalVisits: 8,
        safetyStatus: 'Stable',
        hasDeviation: true,
        aiSummary: 'Participant is eligible, compliant (88%), mild GI improvement observed, no immediate safety concerns.'
    };

    const sections = [
        'Overview', 'Screening', 'Medical History', 'Consent', 'Visits', 'Outcome Data', 'Safety', 'Labs', 'Queries', 'Audit'
    ];

    const alerts = [
        { id: 'a1', type: 'risk', msg: 'Antibiotic use detected (Week 4)', severity: 'high' },
        { id: 'a2', type: 'compliance', msg: 'Missed dose reported 2026-03-18', severity: 'medium' },
        { id: 'a3', type: 'deviation', msg: 'Missed vital check during V3', severity: 'low' }
    ];

    const toggleFlag = () => {
        setIsFlagged(!isFlagged);
        setAuditLog([{ action: isFlagged ? 'Flag Removed' : 'Flag Added', user: 'Dr. Chen (PI)', time: 'Just now' }, ...auditLog]);
    };

    const [isSectionSelectorOpen, setIsSectionSelectorOpen] = useState(false);

    return (
        <div className="flex flex-col h-[calc(100vh-14rem)] bg-[#0B101B] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">

            {/* Top Tactical Header */}
            <div className="flex-shrink-0 px-6 lg:px-10 py-6 lg:py-8 bg-[#0B101B]/80 backdrop-blur-3xl border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 z-30">
                <div className="flex items-center gap-4 lg:gap-8">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl lg:rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                        <User className="w-6 h-6 lg:w-8 lg:h-8" />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl lg:text-3xl font-black text-white italic uppercase tracking-tighter">{participant.id}</h2>
                            <span className={`px-3 lg:px-4 py-1 rounded-full text-[9px] lg:text-[10px] font-black uppercase tracking-widest border transition-all ${
                                status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                status === 'Screening' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                'bg-slate-500/10 text-slate-500 border-white/5'
                            }`}>
                                {status}
                            </span>
                            {isFlagged && <Flag className="w-4 h-4 lg:w-5 lg:h-5 text-red-500 fill-red-500/20 animate-pulse" />}
                        </div>
                        <p className="text-[9px] lg:text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] lg:tracking-[0.3em] mt-1 lg:mt-2 italic line-clamp-1">
                            {participant.study} • Protocol #{participant.protocol}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
                    <button className="px-5 lg:px-6 py-3 lg:py-3.5 bg-emerald-600 text-white rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-900/40 whitespace-nowrap">
                        Approve Subject
                    </button>
                    <button onClick={toggleFlag} className={`p-3 lg:p-3.5 rounded-xl lg:rounded-2xl border transition-all shrink-0 ${isFlagged ? 'bg-red-600 text-white border-red-500' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                        <Flag className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                    <button className="p-3 lg:p-3.5 bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl text-slate-400 hover:text-white transition-all shrink-0">
                        <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                    <button className="p-3 lg:p-3.5 bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl text-red-500/60 hover:bg-red-500/20 hover:text-red-400 transition-all shrink-0">
                        <XCircle className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                </div>
            </div>


            <div className="flex flex-1 overflow-hidden relative">
                {/* Central Workspace: Navigation & Tab Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 lg:px-10 py-5 bg-white/[0.01] border-b border-white/5">
                        {/* Custom Mobile Section Selector */}
                        <div className="lg:hidden w-full relative">
                            <button
                                onClick={() => setIsSectionSelectorOpen(!isSectionSelectorOpen)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center justify-center gap-3 text-[10px] font-black text-white uppercase tracking-[0.2em] italic focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all active:scale-[0.98]"
                            >
                                <span>{activeSection}</span>
                                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isSectionSelectorOpen ? 'rotate-180 text-white' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isSectionSelectorOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#0B101B] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden backdrop-blur-3xl"
                                    >
                                        <div className="p-2 max-h-[350px] overflow-y-auto no-scrollbar">
                                            {sections.map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => { setActiveSection(s); setIsSectionSelectorOpen(false); }}
                                                    className={`w-full px-6 py-4 rounded-xl text-left text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        activeSection === s ? 'bg-indigo-600/10 text-indigo-400 font-black' : 'text-slate-500 hover:bg-white/5 hover:text-white'
                                                    }`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Desktop Section Buttons */}

                        <div className="hidden lg:flex gap-1 lg:gap-2 overflow-x-auto custom-scrollbar no-scrollbar py-1">
                            {sections.map(s => (
                                <button 
                                    key={s}
                                    onClick={() => setActiveSection(s)}
                                    className={`px-4 lg:px-6 py-2 rounded-lg lg:rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                        activeSection === s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>


                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 space-y-10 lg:space-y-12">

                        {/* Summary / Alerts Banner */}
                        <div className="flex flex-col gap-3 lg:gap-4">
                            {alerts.map(a => (
                                <div key={a.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 lg:p-4 rounded-2xl lg:rounded-3xl border gap-4 ${
                                    a.severity === 'high' ? 'bg-red-500/5 border-red-500/20 text-red-400' : 
                                    a.severity === 'medium' ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' : 
                                    'bg-indigo-500/5 border-indigo-500/20 text-indigo-400'
                                }`}>
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-white/5 rounded-xl shrink-0">
                                            <ShieldAlert className="w-5 h-5" />
                                        </div>
                                        <p className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest italic leading-tight">{a.msg}</p>
                                    </div>
                                    <button className="w-full sm:w-auto px-4 py-2 border border-current/20 rounded-xl text-[9px] font-black uppercase underline-offset-4 opacity-70 hover:opacity-100 transition-all text-center">
                                        Investigate
                                    </button>
                                </div>
                            ))}
                        </div>


                        {/* Section Rendering */}
                        <motion.div 
                            key={activeSection}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeSection === 'Overview' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {[
                                        { label: 'Demographics', val: `${participant.age}Y • ${participant.sex}`, icon: User },
                                        { label: 'Study Arm', val: participant.arm, icon: Beaker },
                                        { label: 'Enrollment', val: participant.enrollmentDate, icon: History },
                                        { label: 'Site Location', val: participant.location, icon: Activity },
                                        { label: 'Lead Coordinator', val: participant.coordinator, icon: MessageSquare },
                                        { label: 'Review Eligibility', val: eligibility, icon: CheckCircle2, color: 'emerald' }
                                    ].map((card, i) => (
                                        <div key={i} className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 space-y-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                                                    <card.icon className="w-5 h-5" />
                                                </div>
                                                <button className="p-2 text-slate-700 hover:text-white transition-colors"><Plus className="w-4 h-4" /></button>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-slate-600 font-extrabold uppercase tracking-widest italic">{card.label}</p>
                                                <p className="text-xl font-black text-white italic truncate mt-1">{card.val}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-indigo-500/5 border border-indigo-500/10 rounded-[2.5rem] p-8 flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-full bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                                                <Activity className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic underline decoration-indigo-800 underline-offset-4">AI Scientific Synthesis</p>
                                                <p className="text-sm font-black text-white italic leading-relaxed mt-2">"{participant.aiSummary}"</p>
                                            </div>
                                        </div>
                                        <button className="px-6 py-3 bg-white text-slate-950 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">View Record</button>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'Screening' && (
                                <div className="space-y-12">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                        <div className="space-y-6">
                                            <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.3em] border-b border-white/5 pb-4 italic">Inclusion Checklist</h4>
                                            <div className="space-y-3">
                                                {[
                                                    'Diagnosis of GI Inflammation > 6 months',
                                                    'BMI between 18.5 and 29.9 kg/m²',
                                                    'Available for full 8-visit protocol',
                                                    'Stable on baseline medications for 30 days'
                                                ].map((item, i) => (
                                                    <div key={i} className="flex items-start gap-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl group transition-all">
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                                        <span className="text-[11px] font-black text-slate-400 uppercase italic leading-tight group-hover:text-white">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <h4 className="text-[11px] font-black text-red-400 uppercase tracking-[0.3em] border-b border-white/5 pb-4 italic">Exclusion Flags</h4>
                                            <div className="space-y-3">
                                                {[
                                                    { term: 'Recent Probiotic Use', flagged: false },
                                                    { term: 'Known Allergy to Protocol Agent', flagged: false },
                                                    { term: 'Participation in Concurrent Trials', flagged: true },
                                                    { term: 'History of Major GI Surgery', flagged: false }
                                                ].map((item, i) => (
                                                    <div key={i} className={`flex items-start gap-4 p-4 border rounded-2xl transition-all ${item.flagged ? 'bg-red-500/10 border-red-500/40' : 'bg-white/5 border-white/5'}`}>
                                                        {item.flagged ? <ShieldAlert className="w-5 h-5 text-red-500" /> : <div className="w-5 h-5 rounded-full border border-white/10" />}
                                                        <span className={`text-[11px] font-black uppercase italic leading-tight ${item.flagged ? 'text-red-100' : 'text-slate-500'}`}>{item.term}</span>
                                                        {item.flagged && <span className="ml-auto text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded uppercase">Critical</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-10 bg-[#0B101B] border border-white/10 rounded-[3rem] space-y-8">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-4">Coordinator Final Assessment</p>
                                            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl text-sm italic text-slate-400 leading-relaxed font-black uppercase tracking-tight">
                                                "Participant meets all inclusion criteria. Exclusion flag for concurrent trials was reviewed; it was a previous phase study completed 4 months ago. No washout collision detected. Recommend for PI Approval."
                                                <p className="mt-4 text-[9px] text-indigo-400">— Sarah Jenkins (Lead Coordinator) • 2026-03-20</p>
                                            </div>
                                        </div>
                                        <div className="pt-6 border-t border-white/5 flex flex-col gap-6">
                                            <h4 className="text-[11px] font-black text-white uppercase tracking-widest italic">PI Final Eligibility Decision</h4>
                                            <div className="flex gap-4">
                                                <button onClick={() => setEligibility('Eligible')} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/40 hover:scale-105 transition-all">Approve Eligibility</button>
                                                <button onClick={() => setEligibility('Rejected')} className="flex-1 py-4 bg-white/5 border border-white/5 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all">Reject Subject</button>
                                                <button className="flex-1 py-4 bg-white/5 border border-white/5 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Request Clarification</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'Outcome Data' && (
                                <div className="space-y-12">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 space-y-8">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[11px] font-black text-white uppercase tracking-widest italic">Symptom Metrics</h4>
                                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div className="space-y-6">
                                                {[
                                                    { label: 'Abdominal Bloating', baseline: 8, current: 4, trend: 'down' },
                                                    { label: 'Gas Frequency', baseline: 7.5, current: 3, trend: 'down' },
                                                    { label: 'Indigestion Severity', baseline: 6, current: 2, trend: 'down' },
                                                    { label: 'Systemic Inflammation Score', baseline: 4.2, current: 3.8, trend: 'down' }
                                                ].map((metric, i) => (
                                                    <div key={i} className="space-y-3">
                                                        <div className="flex justify-between items-end">
                                                            <span className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">{metric.label}</span>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[9px] text-slate-700 font-bold uppercase">Baseline: {metric.baseline}</span>
                                                                <span className="text-xl font-black text-emerald-400 italic">{metric.current}</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                                                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(metric.current / 10) * 100}%` }} />
                                                            <div className="h-full bg-white/10" style={{ width: `${((metric.baseline - metric.current) / 10) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-6">
                                            <div className="p-8 bg-indigo-600/10 border border-indigo-500/20 rounded-[2.5rem] flex-1 flex flex-col justify-center">
                                                <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.3em] italic mb-2 underline decoration-indigo-800 underline-offset-4">Endpoint Performance</p>
                                                <h3 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">55<span className="text-indigo-500">%</span></h3>
                                                <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-4">Average improvement in reported GI distress markers vs cohort baseline</p>
                                            </div>
                                            <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] flex-1">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <Activity className="w-5 h-5 text-indigo-400" />
                                                    <p className="text-[10px] text-white font-black uppercase tracking-widest">Trend Synthesis</p>
                                                </div>
                                                <p className="text-xs text-slate-400 font-bold italic leading-relaxed uppercase tracking-tight">
                                                    Longitudinal data indicates rapid response in bloating markers (Visit 2-3). Inflammatory scores are lagging but show downward trajectory. No worsening symptoms noted across any domain.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'Safety' && (
                                <div className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-white/10 border-b border-white/5">
                                                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Reported AE Term</th>
                                                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Severity</th>
                                                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Relatedness</th>
                                                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Onset</th>
                                                <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">PI Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {[
                                                { term: 'Episodic Bloating', severity: 'Mild', related: 'Related', date: '2026-02-10', status: 'Approved' },
                                                { term: 'Faintness', severity: 'Moderate', related: 'Related', date: '2026-03-05', status: 'Pending' }
                                            ].map((ae, i) => (
                                                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-8 py-7">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-2 h-2 rounded-full ${ae.severity === 'Moderate' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                                            <p className="text-[11px] font-black text-white italic uppercase tracking-wider">{ae.term}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-7">
                                                        <span className={`px-3 py-1 bg-white/5 border rounded-lg text-[8px] font-black uppercase tracking-widest ${ae.severity === 'Moderate' ? 'text-amber-500 border-amber-500/20' : 'text-blue-500 border-blue-500/20'}`}>
                                                            {ae.severity}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-7 text-[9px] font-black text-slate-400 uppercase italic">{ae.related}</td>
                                                    <td className="px-8 py-7 text-[9px] font-black text-slate-400 uppercase tracking-widest">{ae.date}</td>
                                                    <td className="px-10 py-7 text-right">
                                                        {ae.status === 'Pending' ? (
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all">Confirm AE</button>
                                                                <button className="p-2 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/10"><ShieldAlert className="w-4 h-4" /></button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">Verified</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeSection === 'Audit' && (
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] mb-8 border-b border-white/5 pb-4 italic">Immutable Digital Ledger</h4>
                                    {auditLog.map((log, i) => (
                                        <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-all">
                                            <div className="flex items-center gap-6">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-700">
                                                    <History className="w-4 h-4" />
                                                </div>
                                                <p className="text-xs font-black text-white italic uppercase tracking-tight">{log.action}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">{log.user}</p>
                                                <p className="text-[8px] text-slate-700 font-bold uppercase tracking-widest mt-1 font-mono">{log.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Sticky Bottom Actions */}
                    <div className="flex-shrink-0 px-6 lg:px-10 py-6 border-t border-white/10 bg-[#0B101B]/95 backdrop-blur-3xl z-30 flex flex-col gap-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:items-center gap-3 lg:gap-4">
                            <button className="px-5 lg:px-8 py-3.5 lg:py-4 bg-indigo-600 text-white rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-900/40 hover:scale-[1.03] active:scale-95 transition-all italic whitespace-nowrap">
                                Approve Subject
                            </button>
                            <button onClick={toggleFlag} className="px-5 lg:px-8 py-3.5 lg:py-4 bg-white/5 border border-white/5 text-slate-400 rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest hover:text-white transition-all italic whitespace-nowrap">
                                Flag For Review
                            </button>
                            <button className="px-5 lg:px-8 py-3.5 lg:py-4 bg-white/5 border border-white/5 text-slate-400 rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest hover:text-white transition-all italic whitespace-nowrap">
                                Request info
                            </button>
                            <button className="px-5 lg:px-8 py-3.5 lg:py-4 bg-red-600/10 border border-red-500/20 text-red-500 rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all italic whitespace-nowrap">
                                Withdraw Subject
                            </button>
                            <button className="px-5 lg:px-8 py-3.5 lg:py-4 bg-white text-slate-950 rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.03] transition-all whitespace-nowrap lg:ml-auto">
                                Save Notes
                            </button>
                        </div>
                    </div>

                </div>

                {/* Right Side Summary Panel */}
                <div className="hidden xl:block w-[380px] bg-white/[0.02] border-l border-white/5 p-10 space-y-12 shrink-0 overflow-y-auto custom-scrollbar">

                    <section>
                        <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 border-b border-white/5 pb-3">Protocol Vitality</h4>
                        <div className="space-y-4">
                            {[
                                { label: 'Eligibility', val: eligibility, color: eligibility === 'Eligible' ? 'emerald' : 'amber' },
                                { label: 'Consent Status', val: 'Verified', color: 'emerald' },
                                { label: 'Visits Trace', val: `${participant.visitsCompleted}/${participant.totalVisits}`, color: 'indigo' },
                                { label: 'Adherence', val: `${participant.complianceRate}%`, color: 'emerald' },
                                { label: 'Safety Index', val: participant.safetyStatus, color: 'emerald' },
                                { label: 'Protocol Flags', val: participant.hasDeviation ? '1 Deviation' : 'None', color: participant.hasDeviation ? 'amber' : 'slate' }
                            ].map((s, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-white/5 rounded-[1.5rem] border border-white/5">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{s.label}</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full bg-${s.color}-500 shadow-[0_0_5px_rgba(var(--${s.color}-rgb),0.8)]`} />
                                        <span className={`text-lg font-black text-${s.color}-400 italic uppercase tracking-tighter`}>{s.val}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section className="mt-12 p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:rotate-12 transition-transform">
                            <Beaker className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 italic">Next Interaction</h5>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 font-black italic">V5</div>
                            <div>
                                <p className="text-xs font-black text-white uppercase italic">Scheduled 2026-03-24</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Visit 5: End of Cohort A dosing</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
