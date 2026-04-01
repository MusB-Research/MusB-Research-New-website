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

const DashboardView = ({ firstName, userTimezone, today, onAction, tasks, study, handleExportPDF }: any) => {
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
    const todayTasksCount = (tasks || []).filter((t: any) => t.status === 'PENDING' && t.due_date?.includes('Today')).length || 0;
    const adherencePercent = 85; // Mock or from study
    const daysInStudy = 24;
    const totalStudyDays = 90;
    const daysPercent = (daysInStudy / totalStudyDays) * 100;

    const studyStatus = study?.status || 'In Study';
    const studyName = study?.name || 'Beat the Bloat Study';
    const studyId = study?.protocol_id || 'MUSB-2026-001';

    const statusColors: any = {
        'Qualified': 'blue',
        'Enrolled': 'teal',
        'Randomized': 'purple',
        'In Study': 'green',
        'Completed': 'gray'
    };

    return (
        <div className="flex flex-col gap-10 max-w-[1500px] animate-in fade-in duration-700">

            {/* PAGE HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div className="space-y-1">
                    <div className="flex flex-col gap-2 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                                Welcome back, <span className="text-cyan-400">{firstName}</span>
                                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                            </h2>
                        </div>
                    </div>
                    <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mt-6 italic whitespace-nowrap">
                        Track your study progress, complete today’s activities, and stay connected with your study team.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[12px] font-black uppercase tracking-[0.3em] mb-8 italic">
                    <div className="w-1 h-1 bg-white/20 rounded-full" />
                    <span className="text-slate-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{today}</span>
                    <div className="w-1 h-1 bg-white/20 rounded-full" />
                    <span className="text-white group-hover:text-cyan-400 transition-colors flex items-center gap-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {localizedTime}
                    </span>
                </div>
            </div>

            {/* ROW 1 – MISSION PERFORMANCE HERO */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Protocol Hero Section */}
                <div className="lg:col-span-8 relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-indigo-500/5 to-transparent rounded-[3rem] border border-white/5 backdrop-blur-sm -z-10 group-hover:border-cyan-500/20 transition-all duration-500" />
                    <div className="p-10 flex flex-col md:flex-row items-center gap-10">
                        <div className="w-40 h-40 flex-shrink-0 relative">
                            <CircularProgress value={adherencePercent} size={160} strokeWidth={10} color="#06b6d4" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center -space-y-1">
                                <span className="text-4xl font-black text-white italic tracking-tighter leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                    {adherencePercent}%
                                </span>
                                <span className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.2em] italic opacity-80">
                                    Adherence
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-4 text-center md:text-left">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                <Badge color={statusColors[studyStatus] || 'cyan'} className="text-[11px] py-1 px-4 font-black italic shadow-lg shadow-green-500/10 uppercase border border-green-500/20">
                                    {studyStatus}
                                </Badge>
                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Protocol Node: {studyId}</span>
                            </div>
                            <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-tight group-hover:text-cyan-400 transition-colors">
                                {studyName}
                            </h3>
                            <p className="text-[15px] font-bold text-slate-400 uppercase tracking-widest max-w-xl italic leading-relaxed">
                                Mission Command: Operational day {daysInStudy} of the {totalStudyDays}-day research cycle. Continuous data synchronization active.
                            </p>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2">
                                <button
                                    onClick={() => handleExportPDF()}
                                    className="flex items-center gap-3 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all italic shadow-lg shadow-cyan-500/20 active:scale-95"
                                >
                                    Sync Report <Download className="w-4 h-4" />
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
                            <p className="text-2xl font-black text-white italic tracking-tighter">$150.00</p>
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1 italic">Verified Telemetry</p>
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
                    className="lg:col-span-8 p-10 bg-[#0a101f] border border-white/5 relative overflow-hidden group hover:bg-white/[0.02] transition-all cursor-pointer min-h-[300px] flex flex-col justify-between"
                    onClick={() => onAction('Tasks')}
                >
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-[#00e676]/10 rounded-2xl flex items-center justify-center text-[#00e676] group-hover:scale-110 transition-transform">
                                <Zap className="w-6 h-6" />
                            </div>
                            <span className="text-[15px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Todays Task</span>
                        </div>
                        <h4 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-tight mb-4">
                            Synchronize <span className="text-[#00e676]">{todayTasksCount}</span> Study Activities
                        </h4>
                        <p className="text-lg font-bold text-slate-500 uppercase tracking-widest max-w-2xl italic leading-relaxed">
                            Maintain your high adherence rate by completing all daily protocols. Your data syncs in real-time with the central research node.
                        </p>
                    </div>
                    <div className="mt-10 flex items-center gap-6 relative z-10">
                        <button className="px-8 py-4 bg-[#00e676] hover:bg-[#00c853] text-slate-950 rounded-2xl font-black text-[13px] uppercase tracking-widest transition-all italic shadow-lg shadow-[#00e676]/20 active:scale-95 flex items-center gap-2">
                            Initialize Sync <Play className="w-4 h-4 fill-current" />
                        </button>
                        <span className="text-[12px] font-black text-slate-600 uppercase tracking-widest italic flex items-center gap-2">
                            <Activity className="w-3 h-3 text-cyan-400 animate-pulse" /> Live Telemetry Linked
                        </span>
                    </div>

                    {/* Abstract background effect */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-[#00e676]/5 to-transparent rounded-full blur-[100px] -z-0 pointer-events-none" />
                </Card>

                {/* Next Milestone - Targeted Focus Card */}
                <Card
                    className="lg:col-span-4 p-8 bg-indigo-600/10 border border-indigo-500/20 group hover:bg-indigo-600/15 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
                    onClick={() => onAction('Tasks')}
                >
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <Calendar className="w-4 h-4 text-indigo-400" />
                            <span className="text-[13px] font-black text-indigo-400 uppercase tracking-[0.25em] italic">Critical Point</span>
                        </div>
                        <h5 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-tight mb-4">
                            Visit 2 Deployment
                        </h5>
                        <p className="text-[13px] font-bold text-indigo-300/50 uppercase tracking-widest italic leading-relaxed mb-6">
                            Next site encounter scheduled for <span className="text-white">May 22, 2026</span>. Finalize all weekly biomarker surveys before arrival.
                        </p>
                        <Badge color="cyan" className="text-[10px] py-1 px-3 border border-indigo-500/30">Action Required: Phase 2 Sync</Badge>
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
                        <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">Shipped Arrival: May 10</h4>
                        <p className="text-[14px] font-black text-[#00e676] uppercase tracking-widest italic">Asset currently in transit via Command Node</p>
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
                        <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2 underline decoration-indigo-500/30 decoration-4">Baseline Stool Received</h4>
                        <p className="text-[14px] font-black text-indigo-400 uppercase tracking-widest italic">Processing in institutional cloud</p>
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
                        <Badge color="red" className="text-[13px] py-0.5 px-2 animate-pulse">1 UNREAD</Badge>
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-slate-300 italic tracking-tight leading-tight mb-2">Coordinator: "Please remember your visit tomorrow at Site B..."</h4>
                    </div>
                    <div className="mt-8 flex justify-between items-center">
                        <button onClick={() => onAction('Messages')} className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 hover:border-cyan-500/40 rounded-full text-[12px] font-black text-cyan-400 uppercase tracking-widest transition-all italic group/btn">
                            Open Messages <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest italic">RECEIVED TODAY, 14:20</span>
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
