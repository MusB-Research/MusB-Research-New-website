import React from 'react';
import { motion } from 'framer-motion';
import {
    Calendar, Clock, ArrowRight, Activity, 
    FileText, CheckCircle2, Box, AlertCircle, 
    MessageSquare, History, ClipboardList, 
    Search, MapPin, DollarSign
} from 'lucide-react';
import { Card, Badge, ProgressBar, CircularProgress, Skeleton } from './SharedComponents';

const DashboardView = ({
    firstName, onAction, tasks, study, participant,
    visits = [], conversations = [], isLoading = false
}: any) => {

    // ──────────────── DATA CALCULATIONS ────────────────
    const tasksArray = tasks || [];
    const totalTasksCount = tasksArray.length;
    const completedTasksCount = tasksArray.filter((t: any) => t.status === 'COMPLETED').length;
    const pendingTasksCount = tasksArray.filter((t: any) => {
        const s = (t.status || '').toUpperCase();
        return s !== 'COMPLETED' && s !== 'LOCKED';
    }).length;
    
    const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

    const daysInStudy = React.useMemo(() => {
        const startTimestamp = participant?.reviewed_at || participant?.created_at;
        if (!startTimestamp) return 0;
        const start = new Date(startTimestamp);
        const now = new Date();
        const diffTime = Math.max(0, now.getTime() - start.getTime());
        return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }, [participant]);

    const enrollmentDateStr = React.useMemo(() => {
        const ts = participant?.reviewed_at || participant?.created_at;
        if (!ts) return 'Confirmed';
        return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    }, [participant]);

    const nextVisit = React.useMemo(() => {
        const now = new Date();
        const upcoming = (visits || [])
            .filter((v: any) => new Date(v.scheduled_date) > now && v.status === 'SCHEDULED')
            .sort((a: any, b: any) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
        return upcoming[0] || null;
    }, [visits]);

    const latestConv = conversations?.[0] || null;

    // ──────────────── LOADING STATE ────────────────
    if (isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-1.5 h-8 bg-amber-500 rounded-full" />
                    <Skeleton className="w-64 h-8" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8">
                        <Skeleton className="h-[220px] rounded-2xl" />
                    </div>
                    <div className="lg:col-span-4">
                        <Skeleton className="h-[220px] rounded-2xl" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-[200px] rounded-2xl" />
                    <Skeleton className="h-[200px] rounded-2xl" />
                </div>
            </div>
        );
    }

    const isEnrolled = participant?.status === 'ENROLLED' || participant?.status === 'ACTIVE';
    const isPending = participant?.status === 'PENDING_REVIEW' || participant?.status === 'PENDING_APPROVAL' || participant?.status === 'APPLIED';

    // ──────────────── CASE 1: NOT ENROLLED / REVIEW PENDING ────────────────
    if (!study || !participant || participant?.status === 'INELIGIBLE' || participant?.status === 'WITHDRAWN' || isPending) {
        if (isPending) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-[#0a1525] border border-amber-500/20 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(251,191,36,0.05)]">
                        <Clock className="w-10 h-10 text-amber-500/50" />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight mb-4">Application under Review</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest italic mb-10 max-w-lg leading-relaxed">
                        Thank you for applying to <span className="text-amber-400">{study?.title || 'the study'}</span>. Our clinical team is currently reviewing your eligibility. You will be notified once a decision has been reached.
                    </p>
                    <Card className="p-8 border-amber-500/20 bg-amber-500/5 max-w-md">
                        <div className="flex items-start gap-4 text-left">
                            <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">Next Steps</h4>
                                <p className="text-xs text-slate-400 font-bold leading-relaxed uppercase">
                                    You don't need to do anything right now. Once approved, your tasks and study timeline will automatically appear here.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-[#0a1525] border border-white/5 rounded-3xl flex items-center justify-center mb-8">
                    <Search className="w-10 h-10 text-amber-500/40" />
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight mb-4">No active study enrollment</h2>
                <p className="text-slate-500 font-bold tracking-tight mb-10 max-w-lg leading-relaxed">
                    Browse available studies and check your eligibility to get started with our clinical research programs.
                </p>
                <button
                    onClick={() => onAction('Discover Studies')}
                    className="flex items-center gap-3 px-10 py-5 bg-amber-400 hover:bg-amber-300 text-black rounded-xl font-black text-[12px] uppercase tracking-[0.2em] transition-all active:scale-95"
                >
                    <Search className="w-4 h-4" />
                    Discover Studies
                </button>
            </div>
        );
    }

    // ──────────────── CASE 2: ENROLLED ────────────────
    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            
            {/* WELCOME HEADER */}
            <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-amber-500 rounded-full" />
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Welcome back, <span className="text-amber-400">{firstName}</span>
                </h2>
            </div>

            {/* TOP SECTION: ENROLLMENT & TIMELINE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Enrollment Card */}
                <Card className="lg:col-span-8 p-5 sm:p-8 flex flex-row items-center gap-4 sm:gap-10 hover:bg-[#121829] group">
                    <div className="flex-shrink-0 relative scale-[0.65] sm:scale-100 origin-center" style={{ width: 160, height: 160 }}>
                        <CircularProgress value={progressPercent} size={160} strokeWidth={8} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-white italic tracking-tighter leading-none">
                                {progressPercent}%
                            </span>
                            <span className="text-[12px] font-black text-amber-400 uppercase tracking-widest mt-1">
                                Progress
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 space-y-2 sm:space-y-4 text-left min-w-0">
                        <div className="space-y-2">
                            <Badge color="amber" className="text-[10px] sm:text-[11px] py-1 sm:py-1.5 px-3 sm:px-4 font-black">
                                Enrollment Status: {participant.status.replace(/_/g, ' ')}
                            </Badge>
                            <h3 className="text-xl sm:text-3xl font-black text-white italic uppercase tracking-tighter leading-tight group-hover:text-amber-400 transition-colors">
                                {study.title}
                            </h3>
                            <p className="text-[12px] sm:text-[14px] font-black text-slate-500 uppercase tracking-widest truncate">
                                Study ID: <span className="text-slate-400 font-mono tracking-normal">{study.protocol_id || study.id.substring(0,8)}</span>
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Timeline Section */}
                <Card className="lg:col-span-4 p-5 sm:p-8 flex flex-col justify-between hover:bg-[#121829]">
                    <div className="space-y-1">
                        <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest">Current Timeline</span>
                        <div className="flex items-center gap-2 text-amber-500">
                            <History className="w-4 h-4" />
                            <p className="text-lg font-black italic tracking-tight uppercase">Study Day {daysInStudy}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4 mt-4 sm:mt-6">
                        <ProgressBar percent={Math.min(100, (daysInStudy / 90) * 100)} height={4} />
                        <div className="flex justify-between items-center text-[11px] sm:text-[12px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Started: {enrollmentDateStr}</span>
                            <span>Est. Completion: 90 Days</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* DASHBOARD GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Tasks Section (Always Visible) */}
                <Card 
                    className="lg:col-span-6 p-8 border-amber-400/10 hover:border-amber-400/30 cursor-pointer flex flex-col justify-between min-h-[220px]"
                    onClick={() => onAction('Tasks')}
                >
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                                <ClipboardList className="w-5 h-5" />
                            </div>
                            <span className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Action Required</span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                <span className="text-amber-400">{pendingTasksCount}</span> Pending Tasks
                            </h4>
                            <p className="text-[14px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                {pendingTasksCount > 0 ? "Items requiring your attention in the task list." : "Great job! You are all caught up for today."}
                            </p>
                        </div>
                    </div>
                    <div className="mt-8">
                        <button className="flex items-center gap-2 px-6 py-3 bg-[#0d1424] hover:bg-amber-400/10 border border-amber-400/20 text-[12px] font-black text-amber-400 uppercase tracking-widest rounded-xl transition-all">
                            View Tasks <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </Card>

                {/* Next Visit Section */}
                <Card 
                    className="lg:col-span-6 p-8 border-white/5 hover:border-amber-400/30 cursor-pointer flex flex-col justify-between min-h-[220px]"
                    onClick={() => onAction('Visits')}
                >
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <span className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Next Clinical Visit</span>
                        </div>

                        {nextVisit ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Date</span>
                                        <p className="text-[16px] font-black text-white italic uppercase tracking-tight">
                                            {new Date(nextVisit.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Site & Address</span>
                                        <p className="text-[15px] font-black text-amber-400 italic uppercase leading-none truncate mb-1">
                                            {nextVisit.location_name || study.location || 'Research Site'}
                                        </p>
                                        <p className="text-[13px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed line-clamp-2 italic">
                                            {nextVisit.location_address || 'Address information pending'}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Arrival Time</span>
                                        <p className="text-[16px] font-black text-white italic uppercase tracking-tight">
                                            {new Date(nextVisit.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-4">
                                <p className="text-lg font-black text-slate-500 italic uppercase">Visit not scheduled yet</p>
                                <p className="text-[12px] font-black text-slate-700 uppercase tracking-widest mt-1">Your coordinator will update this soon</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-8 flex justify-end">
                         <button className="flex items-center gap-2 text-[12px] font-black text-slate-500 hover:text-amber-400 uppercase tracking-widest transition-colors group">
                            Visit Details <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </Card>
            </div>

            {/* MESSAGES SECTION */}
            <Card className="p-8 hover:bg-[#121829] flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 shadow-inner">
                        <MessageSquare className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xl font-black text-white italic uppercase tracking-tight">Communication Portal</h4>
                        <p className="text-[14px] font-black text-slate-500 uppercase tracking-widest">
                            {latestConv?.last_message_preview ? `Latest: "${latestConv.last_message_preview.substring(0, 40)}..."` : "Stay in touch with your study team."}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => onAction('Messages')}
                    className="px-8 py-4 bg-white/5 hover:bg-amber-400/10 border border-white/10 hover:border-amber-400/30 text-white hover:text-amber-400 text-[12px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-3"
                >
                    Contact Team
                    <MessageSquare className="w-4 h-4" />
                </button>
            </Card>

            {/* REGULATORY INFO */}
            <div className="flex justify-center gap-8 py-6 opacity-20 grayscale transition-opacity hover:opacity-40">
                {['SECURE CLINICAL CLOUD', 'HIPAA COMPLIANT', 'VERIFIED SITE'].map(tag => (
                    <span key={tag} className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">{tag}</span>
                ))}
            </div>

        </div>
    );
};

export default React.memo(DashboardView);
