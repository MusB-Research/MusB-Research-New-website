import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Clock, ArrowRight, ChevronRight, Sparkles, Trophy,
    Activity, FileText, CheckCircle2, Box, Zap, PlusCircle,
    AlertCircle, MessageSquare, Ship, Microscope, History,
    TrendingUp, Award, LayoutDashboard, Bell, Info, ExternalLink,
    Play, Download, ClipboardList
} from 'lucide-react';
import { Card, Badge, ProgressBar, CircularProgress } from './SharedComponents';

const DashboardView = ({ 
    firstName, userTimezone, onAction, tasks, study, participant, 
    allStudies = [], selectedStudyIndex = 0, onStudySwitch,
    compensations = [], visits = [], kits = [], labResults = [], conversations = [],
    unreadMessagesCount = 0
}: any) => {
    // ──────────────── REAL DATA CALCULATIONS ────────────────
    const totalTasksCount = (tasks || []).length || 0;
    const completedTasksCount = (tasks || []).filter((t: any) => t.status === 'COMPLETED').length || 0;
    const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

    const pendingTasksCount = (tasks || []).filter((t: any) => t.status === 'PENDING' || t.status === 'OVERDUE').length || 0;
    const todayTasksCount = (tasks || []).filter((t: any) => {
        if (t.status === 'COMPLETED' || t.status === 'LOCKED') return false;
        if (!t.due_date) return false;
        const taskDate = t.due_date.split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];
        return taskDate === todayStr || t.due_date.includes('Today');
    }).length || 0;

    const daysInStudy = React.useMemo(() => {
        const startTimestamp = participant?.reviewed_at;
        if (!startTimestamp) return 0;
        const start = new Date(startTimestamp);
        const now = new Date();
        const diffTime = Math.max(0, now.getTime() - start.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    }, [participant]);

    const studyDayText = React.useMemo(() => {
        if (daysInStudy <= 0) return 'Awaiting Enrollment';
        const weeks = Math.ceil(daysInStudy / 7);
        const months = Math.ceil(daysInStudy / 30);
        return `Today is Day ${daysInStudy} – Week ${weeks}, Month ${months}`;
    }, [daysInStudy]);

    const enrollmentDateStr = React.useMemo(() => {
        if (!participant?.reviewed_at) return 'Pending Review';
        return new Date(participant.reviewed_at).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        });
    }, [participant]);

    const totalStudyDays = study?.duration ? parseInt(study.duration) || 90 : 90;
    const daysPercent = Math.min(100, (daysInStudy / totalStudyDays) * 100);

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
                </div>
            </div>

            {/* DASHBOARD STATS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Progress Section */}
                <div className="lg:col-span-8 relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-indigo-500/5 to-transparent rounded-[2rem] sm:rounded-[3rem] border border-white/5 backdrop-blur-sm -z-10 group-hover:border-cyan-500/20 transition-all duration-500" />
                    <div className="p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 relative">
                            <CircularProgress value={progressPercent} size={window.innerWidth < 640 ? 128 : 160} strokeWidth={8} color="#06b6d4" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
                                <span className="text-3xl sm:text-5xl font-black text-white italic tracking-tighter leading-none drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                                    {progressPercent}%
                                </span>
                                <span className="text-[13px] sm:text-[14px] font-black text-cyan-400 uppercase tracking-[0.25em] italic pl-[0.25em]">
                                    Progress
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-3 sm:space-y-4 text-center sm:text-left">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4">
                                {['ENROLLED', 'CONSENTED', 'RANDOMIZED', 'ACTIVE'].includes(participant?.status) ? (
                                    <Badge color="green" className="text-[12px] sm:text-[14px] py-1.5 px-4 sm:px-6 font-black italic shadow-lg shadow-green-500/10 uppercase border border-green-500/20">
                                        You are currently enrolled in this study
                                    </Badge>
                                ) : (
                                    <Badge color={participant?.status === 'INELIGIBLE' ? 'red' : 'blue'} className="text-[12px] sm:text-[14px] py-1.5 px-4 sm:px-6 font-black italic shadow-lg uppercase border border-white/10">
                                        Enrollment Status: {participant?.status?.replace(/_/g, ' ') || 'Screening'}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex flex-col gap-1">
                                <h3 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter leading-tight group-hover:text-cyan-400 transition-colors">
                                    {studyName}
                                </h3>
                                <p className="text-[15px] font-bold text-slate-500 uppercase tracking-widest italic">
                                    Study Identifier: <span className="text-cyan-500/80">{studyId}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Day Counter Column */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <div
                        className="p-6 bg-[#0d1424] border border-white/5 rounded-3xl group hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between flex-1"
                        onClick={() => onAction('Tasks')}
                    >
                         <span className="text-[15px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Current Timeline</span>
                        <div className="mt-4">
                            <p className="text-xl font-black text-white italic tracking-tighter uppercase leading-tight">{studyDayText}</p>
                            <div className="mt-4">
                                <ProgressBar percent={daysPercent} height={3} />
                            </div>
                             <p className="text-[13px] font-black text-slate-500 uppercase tracking-widest mt-3 italic">
                                 Enrolled: <span className="text-white">{enrollmentDateStr}</span>
                             </p>
                        </div>
                        <History className="absolute bottom-4 right-4 w-10 h-10 text-white opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700" />
                    </div>
                </div>
            </div>

            {/* ACTION REQUIRED & NEXT VISIT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ACTION REQUIRED CARD */}
                <Card
                    className="lg:col-span-6 p-6 sm:p-8 bg-[#0a101f] border border-[#00e676]/20 relative overflow-hidden group hover:bg-white/[0.02] transition-all cursor-pointer min-h-[220px] flex flex-col justify-between"
                    onClick={() => onAction('Tasks')}
                >
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-[#00e676]/10 rounded-xl flex items-center justify-center text-[#00e676]">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                             <span className="text-[14px] font-black text-slate-400 uppercase tracking-[0.25em] italic">Action Required</span>
                        </div>
                        <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-tight mb-2">
                             <span className="text-[#00e676]">{pendingTasksCount}</span> Pending Tasks
                        </h4>
                         <p className="text-[14px] font-bold text-slate-500 uppercase tracking-widest italic leading-relaxed">
                            {pendingTasksCount > 0 
                                ? "Items requiring your attention in the task list."
                                : "Congratulations! You have completed all tasks. Your next task will be displayed when it is ready."}
                        </p>
                    </div>
                    <div className="mt-6 flex items-center justify-between relative z-10">
                        <button className="px-5 py-2.5 bg-[#00e676] hover:bg-[#00c853] text-slate-950 rounded-xl font-black text-[12px] uppercase tracking-widest transition-all italic flex items-center gap-2">
                            View Tasks <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </Card>

                {/* NEXT VISIT CARD */}
                <Card
                    className="lg:col-span-6 p-6 sm:p-8 bg-[#0a101f] border border-cyan-500/20 relative overflow-hidden group hover:bg-white/[0.02] transition-all cursor-pointer min-h-[220px] flex flex-col justify-between"
                    onClick={() => onAction('Visits')}
                >
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400">
                                <Calendar className="w-5 h-5" />
                            </div>
                             <span className="text-[14px] font-black text-slate-400 uppercase tracking-[0.25em] italic">Next Visit</span>
                        </div>
                        {nextMilestone ? (
                            <>
                                <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-tight mb-2">
                                    {nextMilestone.visit_type?.replace(/_/g, ' ') || 'Clinical Assessment'}
                                </h4>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-black text-slate-600 uppercase tracking-widest">Scheduled For</span>
                                         <p className="text-[16px] font-black text-cyan-400 uppercase tracking-tight italic">
                                            {new Date(nextMilestone.scheduled_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} @ {new Date(nextMilestone.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-tight mb-2">
                                    No Visit Scheduled
                                </h4>
                                 <p className="text-[14px] font-bold text-slate-500 uppercase tracking-widest italic leading-relaxed">
                                    Your clinical coordinator will contact you when your next visit is ready.
                                </p>
                            </>
                        )}
                    </div>
                    <div className="mt-6 flex items-center justify-between relative z-10">
                        <button onClick={() => onAction('Visits')} className="px-5 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 rounded-xl font-black text-[12px] uppercase tracking-widest transition-all italic flex items-center gap-2">
                            Visit Details <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </Card>
            </div>


            {/* ROW 3 – LOGISTICS AND REPORTS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Card: Study Kit - Conditional Visibility */}
                {(study?.uses_kit !== false) && (
                    <Card
                        className="p-8 bg-[#0d1424] border-white/5 group hover:border-cyan-500/30 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
                        onClick={() => onAction('Study Kit')}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Box className="w-5 h-5 text-cyan-400" />
                             <span className="text-[16px] font-black text-slate-500 uppercase tracking-[0.25em] italic">Study Kit</span>
                        </div>
                        <div>
                            {activeKit ? (
                                <>
                                    <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
                                        Track Shipment
                                    </h4>
                                    <p className="text-[14px] font-black text-[#00e676] uppercase tracking-widest italic">
                                        {activeKit?.status?.replace(/_/g, ' ')}
                                    </p>
                                </>
                            ) : (
                                 <p className="text-slate-500 font-black italic uppercase text-base">This study is not using any kit.</p>
                            )}
                        </div>
                        <div className="mt-8">
                            <button onClick={() => onAction('Study Kit')} className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 hover:border-cyan-500/40 rounded-full text-[12px] font-black text-cyan-400 uppercase tracking-widest transition-all italic group/btn">
                                Details <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </Card>
                )}

                {/* Card: Health Checkup Reports - Conditional Visibility */}
                {(study?.uses_reports !== false) && (labResults.length > 0) && (
                    <Card
                        className="p-8 bg-[#0d1424] border-white/5 group hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
                        onClick={() => onAction('Reports')}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <FileText className="w-5 h-5 text-indigo-400" />
                            <span className="text-[15px] font-black text-slate-500 uppercase tracking-[0.25em] italic">Health Checkup Reports</span>
                        </div>
                        <div>
                            <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2 underline decoration-indigo-500/30 decoration-4">
                                {latestLab?.test_name || 'Latest Results'}
                            </h4>
                            <p className="text-[14px] font-black text-indigo-400 uppercase tracking-widest italic">
                                Available for Download
                            </p>
                        </div>
                        <div className="mt-8">
                            <button onClick={() => onAction('Reports')} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 hover:border-indigo-500/40 rounded-full text-[12px] font-black text-indigo-400 uppercase tracking-widest transition-all italic group/btn">
                                View History <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </Card>
                )}

                {/* Card: Messages */}
                <Card
                    className="p-8 bg-[#0d1424] border-white/5 group hover:border-cyan-500/30 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
                    onClick={() => onAction('Messages')}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <MessageSquare className="w-5 h-5 text-cyan-400" />
                            <span className="text-[16px] font-black text-slate-500 uppercase tracking-[0.25em] italic">Messages</span>
                        </div>
                        {unreadMessagesCount > 0 && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" />}
                    </div>
                    <div>
                         <h4 className="text-xl font-bold text-slate-300 italic tracking-tight leading-tight mb-2">
                            {latestConv?.last_message_preview ? `"${latestConv.last_message_preview}..."` : "Stay in touch with your study team."}
                        </h4>
                    </div>
                    <div className="mt-8 flex justify-between items-center">
                        <button onClick={() => onAction('Messages')} className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 hover:border-cyan-500/40 rounded-full text-[12px] font-black text-cyan-400 uppercase tracking-widest transition-all italic group/btn">
                            Contact Team <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        {latestConv && <span className="text-[12px] font-black text-slate-600 uppercase tracking-widest italic">{new Date(latestConv.last_updated).toLocaleTimeString()}</span>}
                    </div>
                </Card>
            </div>

            {/* Footer Regulatory Bottom info */}
            <div className="flex flex-col items-center gap-6 py-12 opacity-30 mt-12 grayscale">
                <div className="flex gap-8">
                    {['SECURE CLINICAL CLOUD', 'HIPAA COMPLIANT', 'VERIFIED SITE'].map(tag => (
                        <span key={tag} className="text-[12px] font-black text-slate-500 uppercase tracking-[0.4em] italic">{tag}</span>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default DashboardView;


