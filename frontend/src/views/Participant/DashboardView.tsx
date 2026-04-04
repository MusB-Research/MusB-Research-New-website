import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Clock, ArrowRight, ChevronRight, Sparkles, Trophy,
    Activity, FileText, CheckCircle2, Box, Zap, PlusCircle,
    AlertCircle, MessageSquare, Ship, Microscope, History,
    TrendingUp, Award, LayoutDashboard, Bell, Info, ExternalLink,
    Play, Download
} from 'lucide-react';
import { Card, Badge, ProgressBar, CircularProgress } from './SharedComponents';

const DashboardView = ({ 
    firstName, userTimezone, today, onAction, tasks, study, participant, handleExportPDF, 
    allStudies = [], selectedStudyIndex = 0, onStudySwitch,
    compensations = [], visits = [], kits = [], labResults = [], conversations = []
}: any) => {
    // Live Clock State
    const [currentTime, setCurrentTime] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const localizedTime = React.useMemo(() => {
        try {
            return currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: userTimezone && userTimezone !== 'UTC' ? userTimezone : undefined,
                timeZoneName: 'short'
            });
        } catch (e) {
            return currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
            });
        }
    }, [currentTime, userTimezone]);

    // Computed Values
    const pendingTasksCount = (tasks || []).filter((t: any) => t.status === 'PENDING').length || 0;
    const todayTasksCount = (tasks || []).filter((t: any) => {
        if (t.status !== 'PENDING') return false;
        if (!t.due_date) return false;
        const taskDate = t.due_date.split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];
        return taskDate === todayStr || t.due_date.includes('Today'); // Support both patterns
    }).length || 0;
    // ──────────────── REAL DATA CALCULATIONS ────────────────
    const adherencePercent = React.useMemo(() => {
        if (!tasks || tasks.length === 0) return 0;
        // Filter tasks related to the active study if multiple exist
        const studyTasks = tasks.filter((t: any) => t.participant === participant?.id);
        if (studyTasks.length === 0) return 100; // Perfect until first task fails
        
        const completed = studyTasks.filter((t: any) => t.status === 'COMPLETED').length;
        return Math.min(100, Math.round((completed / studyTasks.length) * 100));
    }, [tasks, participant]);

    const daysInStudy = React.useMemo(() => {
        if (!participant?.created_at) return 1;
        const start = new Date(participant.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays || 1;
    }, [participant]);

    const totalStudyDays = study?.duration ? parseInt(study.duration) || 90 : 90;
    const daysPercent = (daysInStudy / totalStudyDays) * 100;

    const studyStatus = study?.status || 'Qualified';
    const studyName = study?.title || 'Beat the Bloat Study';
    const studyId = study?.protocol_id || 'N/A';

    const statusColors: any = {
        'Qualified': 'blue',
        'Enrolled': 'teal',
        'Randomized': 'purple',
        'In Study': 'green',
        'Completed': 'gray'
    };

    // ──────────────── ADDITIONAL LIVE DATA ────────────────
    const totalEarnings = React.useMemo(() => {
        return compensations
            .filter((c: any) => c.status === 'PAID')
            .reduce((sum: number, c: any) => sum + parseFloat(c.amount), 0);
    }, [compensations]);

    const nextMilestone = React.useMemo(() => {
        const now = new Date();
        const upcoming = visits
            .filter((v: any) => new Date(v.scheduled_date) > now && v.status === 'SCHEDULED')
            .sort((a: any, b: any) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
        return upcoming[0] || null;
    }, [visits]);

    const activeKit = kits[0] || null;
    const latestLab = labResults[0] || null;
    const latestConv = conversations[0] || null;

    return (
        <div className="flex flex-col gap-10 max-w-[1500px] animate-in fade-in duration-700">

            {/* PAGE HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 sm:w-1.5 sm:h-8 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2 sm:gap-3">
                            Welcome back, <span className="text-cyan-400">{firstName}</span>
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 animate-pulse" />
                        </h2>
                    </div>
                    <p className="text-[10px] sm:text-[11px] lg:text-[13px] font-bold text-slate-500 uppercase tracking-widest mt-3 sm:mt-4 italic sm:whitespace-nowrap">
                        Track your study progress, complete today’s activities, and stay connected with your study team.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-slate-500 text-[9px] sm:text-[10px] lg:text-[12px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] italic">
                    <span className="text-slate-300">{today}</span>
                    <div className="w-1 h-1 bg-white/20 rounded-full" />
                    <span className="text-white flex items-center gap-2">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {localizedTime}
                    </span>
                </div>
            </div>

            {/* ROW 1 – MISSION PERFORMANCE HERO */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Protocol Hero Section */}
                <div className="lg:col-span-8 relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-indigo-500/5 to-transparent rounded-[2rem] sm:rounded-[3rem] border border-white/5 backdrop-blur-sm -z-10 group-hover:border-cyan-500/20 transition-all duration-500" />
                    <div className="p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 relative">
                            <CircularProgress value={adherencePercent} size={window.innerWidth < 640 ? 128 : 160} strokeWidth={8} color="#06b6d4" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center -space-y-1">
                                <span className="text-2xl sm:text-4xl font-black text-white italic tracking-tighter leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                    {adherencePercent}%
                                </span>
                                <span className="text-[9px] sm:text-[11px] font-black text-cyan-400 uppercase tracking-[0.2em] italic opacity-80">
                                    Adherence
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-3 sm:space-y-4 text-center sm:text-left">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4">
                                <Badge color={statusColors[studyStatus] || 'cyan'} className="text-[9px] sm:text-[11px] py-1 px-3 sm:px-4 font-black italic shadow-lg shadow-green-500/10 uppercase border border-green-500/20">
                                    {studyStatus}
                                </Badge>
                                {allStudies.length > 1 ? (
                                    <div className="relative group/switch">
                                        <select 
                                            value={selectedStudyIndex}
                                            onChange={(e) => onStudySwitch?.(parseInt(e.target.value))}
                                            className="appearance-none bg-[#0a0e1a]/80 border border-white/10 hover:border-cyan-500/50 text-[9px] sm:text-[11px] font-black text-cyan-400 uppercase tracking-[0.2em] sm:tracking-[0.3em] py-1.5 pl-4 pr-10 rounded-full cursor-pointer outline-none transition-all shadow-inner hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] min-w-[170px] sm:min-w-[220px]"
                                        >
                                            {allStudies.map((s: any, idx: number) => (
                                                <option key={s.id} value={idx}>{s.protocol_id || 'NODE-' + idx}</option>
                                            ))}
                                        </select>
                                        <Box className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-cyan-500/50 pointer-events-none group-hover/switch:text-cyan-400 transition-colors" />
                                    </div>
                                ) : (
                                    <span className="text-[9px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Node: {studyId}</span>
                                )}
                            </div>
                            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white italic uppercase tracking-tighter leading-tight group-hover:text-cyan-400 transition-colors">
                                {studyName}
                            </h3>
                            <p className="text-[10px] sm:text-[12px] lg:text-[13px] font-bold text-slate-400 uppercase tracking-widest max-w-xl italic leading-relaxed">
                                Mission Command: Operational day {daysInStudy} of the {totalStudyDays}-day research cycle.
                            </p>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
                                <button
                                    onClick={() => handleExportPDF()}
                                    className="flex items-center gap-2.5 px-5 py-2.5 sm:px-6 sm:py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all italic shadow-lg active:scale-95"
                                >
                                    Sync Report <Download className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secondary Stats Grid */}
                <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                        className="p-6 bg-[#0d1424] border border-white/5 rounded-3xl group hover:border-amber-500/30 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
                        onClick={() => onAction('Compensation')}
                    >
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Rewards</span>
                        <div className="mt-4">
                            <p className="text-2xl font-black text-white italic tracking-tighter">${totalEarnings.toFixed(2)}</p>
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1 italic">{compensations.length > 0 ? 'Verified Telemetry' : 'Syncing Data...'}</p>
                        </div>
                        <Trophy className="absolute bottom-4 right-4 w-10 h-10 text-white opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700" />
                    </div>

                    <div
                        className="p-6 bg-[#0d1424] border border-white/5 rounded-3xl group hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
                        onClick={() => onAction('Tasks')}
                    >
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Timeline</span>
                        <div className="mt-4">
                            <p className="text-2xl font-black text-white italic tracking-tighter">Day {daysInStudy}</p>
                            <div className="mt-2">
                                <ProgressBar percent={daysPercent} height={3} />
                            </div>
                        </div>
                        <History className="absolute bottom-4 right-4 w-10 h-10 text-white opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700" />
                    </div>

                    <div
                        className="p-6 bg-[#0d1424] border border-white/5 rounded-3xl group hover:border-red-500/30 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between sm:col-span-2"
                        onClick={() => onAction('Tasks')}
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Mission Pulse</span>
                            <Badge color="red" className="text-[9px] py-0.5 px-2 font-black italic">PRIORITY ALPHA</Badge>
                        </div>
                        <div className="mt-4 flex items-end justify-between">
                            <div>
                                <p className="text-3xl font-black text-white italic tracking-tighter">{pendingTasksCount} Pending Tasks</p>
                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mt-1 italic">Action required for compliance</p>
                            </div>
                            <ArrowRight className="w-6 h-6 text-slate-500 group-hover:text-white group-hover:translate-x-2 transition-all" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ROW 2 – CORE TASKS AND UPCOMING MILESTONES */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Todays Task - Large Interactive Card */}
                <Card
                    className="lg:col-span-8 p-6 sm:p-10 bg-[#0a101f] border border-white/5 relative overflow-hidden group hover:bg-white/[0.02] transition-all cursor-pointer min-h-[260px] sm:min-h-[300px] flex flex-col justify-between"
                    onClick={() => onAction('Tasks')}
                >
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#00e676]/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-[#00e676]">
                                <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <span className="text-[13px] sm:text-[15px] font-black text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.3em] italic">Todays Task</span>
                        </div>
                        <h4 className="text-xl sm:text-3xl lg:text-3xl font-black text-white italic uppercase tracking-tighter leading-tight mb-4">
                            Synchronize <span className="text-[#00e676]">{todayTasksCount}</span> Activities
                        </h4>
                        <p className="text-[11px] sm:text-[13px] lg:text-[14px] font-bold text-slate-500 uppercase tracking-widest max-w-2xl italic leading-relaxed">
                            {todayTasksCount > 0 
                                ? `Syncing ${todayTasksCount} clinical protocols for research node ${studyId}. Maintain high adherence for compliance.`
                                : `All protocols synchronized for research node ${studyId}. Maintain your high adherence rate.`}
                        </p>
                    </div>
                    <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4 sm:gap-6 relative z-10">
                        <button className="px-6 py-3 sm:px-8 sm:py-4 bg-[#00e676] hover:bg-[#00c853] text-slate-950 rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-[13px] uppercase tracking-widest transition-all italic shadow-lg active:scale-95 flex items-center gap-2">
                            Initialize Sync <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                    </div>
                </Card>

                {/* Next Milestone - Targeted Focus Card */}
                <Card
                    className="lg:col-span-4 p-8 bg-indigo-600/10 border border-indigo-500/20 group hover:bg-indigo-600/15 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
                    onClick={() => onAction('Tasks')}
                >
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <Calendar className="w-4 h-4 text-indigo-400" />
                            <span className="text-[13px] font-black text-indigo-400 uppercase tracking-[0.25em] italic">Next Milestone</span>
                        </div>
                        <h5 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-tight mb-4">
                            {nextMilestone?.visit_type?.replace(/_/g, ' ') || 'Protocol Phase'}
                        </h5>
                        <p className="text-[13px] font-bold text-indigo-300/50 uppercase tracking-widest italic leading-relaxed mb-6">
                            Next site encounter scheduled for <span className="text-white">{nextMilestone ? new Date(nextMilestone.scheduled_date).toLocaleDateString() : 'Syncing...'}</span>. Maintain all weekly protocols before arrival.
                        </p>
                        <Badge color="cyan" className="text-[10px] py-1 px-3 border border-indigo-500/30">{nextMilestone?.status || 'IDLE'}</Badge>
                    </div>
                    <div className="mt-8">
                        <ArrowRight className="w-6 h-6 text-indigo-500 group-hover:text-white group-hover:translate-x-2 transition-all" />
                    </div>
                </Card>
            </div>

            {/* ROW 3 – OPERATIONS AND COMMUNICATION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Card 10: Kit Status */}
                <Card
                    className="p-8 bg-[#0d1424] border-white/5 group hover:border-cyan-500/30 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
                    onClick={() => onAction('Study Kit')}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Ship className="w-5 h-5 text-cyan-400" />
                        <span className="text-[15px] font-black text-slate-500 uppercase tracking-[0.25em] italic">Kit Logistics</span>
                    </div>
                    <div>
                        <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
                            {activeKit ? `Kit ID: ${activeKit.kit_number}` : 'No Active Kit'}
                        </h4>
                        <p className="text-[14px] font-black text-[#00e676] uppercase tracking-widest italic">
                            Status: {activeKit?.status?.replace(/_/g, ' ') || 'Pending Assignment'}
                        </p>
                    </div>
                    <div className="mt-8">
                        <button onClick={() => onAction('Study Kit')} className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 hover:border-cyan-500/40 rounded-full text-[12px] font-black text-cyan-400 uppercase tracking-widest transition-all italic group/btn">
                            Access Kits Node <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </Card>

                {/* Card 11: Sample Tracking */}
                <Card
                    className="p-8 bg-[#0d1424] border-white/5 group hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
                    onClick={() => onAction('Study Kit')}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Microscope className="w-5 h-5 text-indigo-400" />
                        <span className="text-[15px] font-black text-slate-500 uppercase tracking-[0.25em] italic">Biomarker Stats</span>
                    </div>
                    <div>
                        <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2 underline decoration-indigo-500/30 decoration-4">
                            {latestLab ? latestLab.test_name || latestLab.result_type?.replace(/_/g, ' ') : 'NO RECENT SAMPLES'}
                        </h4>
                        <p className="text-[14px] font-black text-indigo-400 uppercase tracking-widest italic">
                            {latestLab ? `Latest Status: ${latestLab.status?.replace(/_/g, ' ')}` : 'Awaiting clinical data sync'}
                        </p>
                    </div>
                    <div className="mt-8">
                        <button onClick={() => onAction('Study Kit')} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 hover:border-indigo-500/40 rounded-full text-[12px] font-black text-indigo-400 uppercase tracking-widest transition-all italic group/btn">
                            Sample Genealogy <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </Card>

                {/* Card 12: Recent Messages */}
                <Card
                    className="p-8 bg-[#0d1424] border-white/5 group hover:border-cyan-500/30 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
                    onClick={() => onAction('Messages')}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <MessageSquare className="w-5 h-5 text-cyan-400" />
                            <span className="text-[16px] font-black text-slate-500 uppercase tracking-[0.25em] italic">Site Comms</span>
                        </div>
                        {latestConv?.status === 'ACTION_REQUIRED' && <Badge color="red" className="text-[13px] py-0.5 px-2 animate-pulse">1 UNREAD</Badge>}
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-slate-300 italic tracking-tight leading-tight mb-2">
                            {latestConv?.last_message_preview ? `"${latestConv.last_message_preview}..."` : "No recent communications."}
                        </h4>
                    </div>
                    <div className="mt-8 flex justify-between items-center">
                        <button onClick={() => onAction('Messages')} className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 hover:border-cyan-500/40 rounded-full text-[12px] font-black text-cyan-400 uppercase tracking-widest transition-all italic group/btn">
                            Open Messages <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest italic">{latestConv ? new Date(latestConv.last_updated).toLocaleTimeString() : ''}</span>
                    </div>
                </Card>

            </div>



            {/* Footer Bottom info */}
            <div className="flex flex-col items-center gap-6 py-12 opacity-30 mt-12 grayscale">
                <div className="flex gap-8">
                    {['SECURE PROTOCOL V3.4', 'HIPAA CLOUD SYNCED', 'OPERATIONAL NODE SITE-B'].map(tag => (
                        <span key={tag} className="text-[12px] font-black text-slate-500 uppercase tracking-[0.4em] italic">{tag}</span>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default DashboardView;
