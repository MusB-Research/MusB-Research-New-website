import React from 'react';
import { motion } from 'framer-motion';
import {
    Calendar, Clock, ArrowRight, Activity,
    FileText, CheckCircle2, Box, AlertCircle,
    MessageSquare, History, ClipboardList,
    Search, MapPin, DollarSign, Globe, ShieldCheck
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
        if (!ts) return 'N/A';
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
                    <Skeleton className="w-1.5 h-8 bg-[#1E88E5] rounded-full" />
                    <Skeleton className="w-64 h-8" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8">
                        <Skeleton className="h-[220px] rounded-[16px]" />
                    </div>
                    <div className="lg:col-span-4">
                        <Skeleton className="h-[220px] rounded-[16px]" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-[200px] rounded-[16px]" />
                    <Skeleton className="h-[200px] rounded-[16px]" />
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
                    <div className="w-24 h-24 bg-white border border-[#E3ECF5] rounded-[24px] flex items-center justify-center mb-8 shadow-sm">
                        <Clock className="w-10 h-10 text-[#1E88E5]/50" />
                    </div>
                    <h2 className="text-3xl font-bold text-[#1A2B49] tracking-tight mb-4">Application under Review</h2>
                    <p className="text-[#5F6F89] font-bold uppercase tracking-widest mb-10 max-w-lg leading-relaxed">
                        Thank you for applying to <span className="text-[#1E88E5]">{study?.title || 'the study'}</span>. Our clinical team is currently reviewing your eligibility. You will be notified once a decision has been reached.
                    </p>
                    <Card className="p-8 border-[#1E88E5]/10 bg-[#E3F2FD]/20 max-w-md">
                        <div className="flex items-start gap-4 text-left">
                            <AlertCircle className="w-6 h-6 text-[#1E88E5] shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-[12px] font-bold text-[#1A2B49] uppercase tracking-widest mb-2">Next Steps</h4>
                                <p className="text-[13px] text-[#5F6F89] font-bold leading-relaxed uppercase">
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
                <div className="w-24 h-24 bg-white border border-[#E3ECF5] rounded-[24px] flex items-center justify-center mb-8 shadow-sm">
                    <Search className="w-10 h-10 text-[#1E88E5]/40" />
                </div>
                <h2 className="text-3xl font-bold text-[#1A2B49] tracking-tight mb-4">No active study enrollment</h2>
                <p className="text-[#5F6F89] font-bold tracking-tight mb-10 max-w-lg leading-relaxed">
                    Browse available studies and check your eligibility to get started with our clinical research programs.
                </p>
                <button
                    onClick={() => onAction('Discover Studies')}
                    className="flex items-center gap-3 px-10 py-5 bg-[#1E88E5] hover:bg-[#1565C0] text-white rounded-xl font-bold text-[14px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                >
                    <Search className="w-4 h-4" />
                    Discover Studies
                </button>
            </div>
        );
    }

    // ──────────────── CASE 2: ENROLLED ────────────────
    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-10">

            {/* WELCOME HEADER */}
            <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-[#1E88E5] rounded-full" />
                <h2 className="text-xl sm:text-2xl font-bold text-[#1A2B49] tracking-tight">
                    Welcome back, <span className="text-[#1E88E5]">{firstName}</span>
                </h2>
            </div>

            {/* TOP SECTION: ENROLLMENT & TIMELINE */}
            <div className="grid-dashboard">

                {/* Enrollment Card - Senior Developer Implementation (Permanent Horizontal Layout) */}
                <Card className="lg:col-span-8 p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-center gap-6 sm:gap-10 shadow-sm border-[#E3ECF5]">

                    {/* LEFT: Circular Progress */}
                    <div className="flex-shrink-0 flex items-center justify-center">
                        <div className="relative w-[100px] h-[100px] sm:w-[120px] sm:h-[120px]">
                            <CircularProgress value={progressPercent} size={120} strokeWidth={11} />

                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl sm:text-3xl font-black text-[#1A2B49] leading-none">
                                    {progressPercent}%
                                </span>
                                <span className="text-[10px] font-bold text-[#1E88E5] uppercase tracking-widest mt-1">
                                    Complete
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Content */}
                    <div className="flex-1 flex flex-col justify-center gap-3 text-center sm:text-left">

                        {/* Status Badges */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            {isEnrolled && (
                                <Badge color="blue" className="px-4 py-1.5 text-[11px] font-bold rounded-lg border-none shadow-sm">
                                    ACTIVE PARTICIPANT
                                </Badge>
                            )}
                            <Badge color="slate" className="px-4 py-1.5 text-[11px] font-bold rounded-lg border-none shadow-sm">
                                {participant?.status?.replace(/_/g, ' ') || 'RECRUITING'}
                            </Badge>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl sm:text-3xl font-black text-[#1A2B49] leading-tight italic uppercase">
                            {study?.title || 'Untitled Study'}
                        </h3>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[12px] font-bold text-[#5F6F89] uppercase tracking-tight">
                            <div className="flex items-center gap-1.5">
                                <span className="opacity-60">PID:</span>
                                <span className="text-[#1A2B49]">{participant?.participant_sid || 'PO-XXXX'}</span>
                            </div>
                            <span className="hidden sm:inline w-1 h-1 bg-[#E3ECF5] rounded-full" />
                            <div className="flex items-center gap-1.5">
                                <span className="opacity-60">Study ID:</span>
                                <span className="text-[#1A2B49]">{study?.protocol_id || 'STD-XXXX'}</span>
                            </div>
                            <span className="hidden sm:inline w-1 h-1 bg-[#E3ECF5] rounded-full" />
                            <div className="flex items-center gap-1.5">
                                <span className="opacity-60">Enrolled:</span>
                                <span className="text-[#1A2B49]">{enrollmentDateStr}</span>
                            </div>
                        </div>
                    </div>
                </Card>
                {/* Timeline Section */}
                <Card className="lg:col-span-4 p-8 flex flex-col justify-between hover:border-[#1E88E5]/30 transition-all">
                    <div className="space-y-1">
                        <span className="text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest">Enrollment Timeline</span>
                        <div className="flex items-center gap-3 text-[#1E88E5]">
                            <History className="w-5 h-5" />
                            <p className="text-xl font-bold tracking-tight">Study Day {daysInStudy}</p>
                        </div>
                    </div>

                    <div className="space-y-4 mt-8">
                        <ProgressBar percent={Math.min(100, (daysInStudy / 90) * 100)} height={6} />
                        <div className="flex justify-between items-center text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest">
                            <span>DAY 1</span>
                            <span>Target: 90 Days</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* DASHBOARD GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Tasks Section */}
                <Card
                    className="lg:col-span-6 p-8 hover:border-[#1E88E5]/50 border-2 border-transparent transition-all cursor-pointer flex flex-col justify-between min-h-[240px] bg-white group shadow-[0_4px_25px_rgba(30,136,229,0.04)]"
                    onClick={() => onAction('Tasks')}
                >
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#E3F2FD] rounded-xl flex items-center justify-center text-[#1E88E5] border border-[#BBDEFB]">
                                <ClipboardList className="w-5 h-5" />
                            </div>
                            <span className="text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest">Clinical Protocol</span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-2xl font-bold text-[#1A2B49] tracking-tight">
                                <span className="text-[#1E88E5]">{pendingTasksCount}</span> Activities Pending
                            </h4>
                            <p className="text-[14px] font-bold text-[#5F6F89] uppercase tracking-widest leading-relaxed">
                                {pendingTasksCount > 0 ? "Items requiring immediate attention." : "Protocol adherence complete for today."}
                            </p>
                        </div>
                    </div>
                    <div className="mt-8">
                        <button className="flex items-center gap-2 group-hover:text-[#1E88E5] text-[#5F6F89] text-[13px] font-bold uppercase tracking-widest transition-all">
                            Manage Tasks <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </Card>

                {/* Next Visit Section */}
                <Card
                    className="lg:col-span-6 p-8 hover:border-[#1E88E5]/50 border-2 border-transparent transition-all cursor-pointer flex flex-col justify-between min-h-[240px] bg-white group shadow-[0_4px_25px_rgba(30,136,229,0.04)]"
                    onClick={() => onAction('Visits')}
                >
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#FFF3E0] rounded-xl flex items-center justify-center text-[#E65100] border border-[#FFE0B2]">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <span className="text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest">Next Site Visit</span>
                        </div>

                        {nextVisit ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" /> Scheduled Date
                                        </span>
                                        <p className="text-[14px] font-bold text-[#1A2B49] tracking-tight">
                                            {new Date(nextVisit.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest flex items-center gap-1.5">
                                            <MapPin className="w-3 h-3" /> Location
                                        </span>
                                        <p className="text-[15px] font-bold text-[#1E88E5] leading-none truncate mb-1 uppercase tracking-tight">
                                            {nextVisit.location_name || study.location || 'Research Site'}
                                        </p>
                                        <p className="text-[12px] font-bold text-[#5F6F89] uppercase tracking-tight leading-relaxed line-clamp-1 italic">
                                            {nextVisit.location_address || 'Address information pending'}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-[#8A99B3] uppercase tracking-widest flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" /> Check-in Time
                                    </span>
                                    <p className="text-[14px] font-bold text-[#1A2B49] tracking-tight">
                                        {new Date(nextVisit.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-2">
                                <p className="text-xl font-bold text-[#5F6F89] uppercase tracking-tight">Not scheduled yet</p>
                                <p className="text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest mt-1">Your site coordinator will update this soon</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* MESSAGES SECTION */}
            <Card className="p-8 hover:border-[#1E88E5]/30 transition-all flex flex-col sm:flex-row items-center justify-between gap-6 bg-white">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[#F0F6FF] rounded-2xl flex items-center justify-center text-[#1E88E5] border border-[#E3F2FD]">
                        <MessageSquare className="w-8 h-8" />
                    </div>
                    <div className="space-y-1 text-center sm:text-left">
                        <h4 className="text-xl font-bold text-[#1A2B49] tracking-tight uppercase">Support & Communication</h4>
                        <p className="text-[14px] font-bold text-[#5F6F89] uppercase tracking-widest leading-none">
                            {latestConv?.last_message_preview ? (
                                <>LATEST: <span className="text-[#1A2B49]">"{latestConv.last_message_preview.substring(0, 45)}..."</span></>
                            ) : "Message your clinical study team directly."}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => onAction('Messages')}
                    className="px-8 py-4 bg-[#F8FBFF] hover:bg-[#E3F2FD] border border-[#E3ECF5] text-[#1E88E5] text-[12px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-3 shadow-sm hover:shadow active:scale-95"
                >
                    Open Messages Hub
                    <ArrowRight className="w-4 h-4" />
                </button>
            </Card>

            {/* REGULATORY INFO */}
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 py-10 border-t border-[#E3ECF5] mt-10">
                {[
                    { label: 'SECURE CLINICAL CLOUD', icon: Globe },
                    { label: 'HIPAA COMPLIANT', icon: ShieldCheck },
                    { label: 'VERIFIED RESEARCH SITE', icon: CheckCircle2 }
                ].map((tag, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 opacity-70 hover:opacity-100 transition-opacity group">
                        <tag.icon className="w-4 h-4 text-[#1E88E5] group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-[0.2em]">{tag.label}</span>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default React.memo(DashboardView);
