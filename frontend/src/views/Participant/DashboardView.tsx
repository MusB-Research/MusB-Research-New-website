import React from 'react';
import { motion } from 'framer-motion';
import {
    Calendar, Clock, ArrowRight, Activity,
    FileText, CheckCircle2, AlertCircle,
    MessageSquare, History, ClipboardList,
    Search, MapPin, DollarSign, Globe, ShieldCheck,
    Package, Truck, Zap, Layers3, X, FileSignature, Trophy
} from 'lucide-react';
import { Card, Badge, ProgressBar, CircularProgress, Skeleton } from './SharedComponents';

const DashboardView = ({
    firstName, onAction, tasks, study, participant,
    visits = [], conversations = [], isLoading = false,
    allStudies = [], selectedStudyIndex = 0, onStudySwitch,
    kits = []
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
        const status = (participant?.status || '').toUpperCase();
        if (status === 'PENDING_REVIEW') return 0; // Don't count days during review

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

    const activeKit = React.useMemo(() => {
        if (!kits || kits.length === 0) return null;
        // Find most relevant kit (active or latest)
        return [...kits].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
    }, [kits]);

    const kitStep = React.useMemo(() => {
        if (!activeKit) return 0;
        const s = (activeKit.status || '').toUpperCase();
        if (s.includes('RECEIVED')) return 3;
        if (s.includes('SHIPPED')) return 2;
        return 1;
    }, [activeKit]);

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

    const studySwitcher = allStudies && allStudies.length > 1 && (
        <div className="flex items-center gap-3 bg-white border border-[#E3ECF5] p-3 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest shrink-0">Switch Study:</span>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {allStudies.map((st: any, idx: number) => {
                    const isPendingStudy = ['PENDING_APPROVAL', 'APPLIED', 'PENDING_REVIEW'].includes((st?.participantStatus || '').toUpperCase());
                    return (
                        <button
                            key={idx}
                            onClick={() => {
                                const isPendingTarget = ['PENDING_APPROVAL', 'APPLIED', 'PENDING_REVIEW'].includes((st?.participantStatus || '').toUpperCase());
                                const hasEnrolledStudy = allStudies.some((s: any) => !['PENDING_APPROVAL', 'APPLIED', 'PENDING_REVIEW'].includes((s?.participantStatus || '').toUpperCase()));
                                if (isPendingTarget && hasEnrolledStudy) {
                                    alert('You are already enrolled in a study. This application is pending review.');
                                    return;
                                }
                                onStudySwitch?.(idx);
                            }}
                            className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${
                                selectedStudyIndex === idx
                                    ? 'bg-[#1E88E5] text-white shadow-lg shadow-blue-500/20'
                                    : 'bg-[#F8FBFF] text-[#5F6F89] hover:bg-[#E3F2FD]'
                            }`}
                        >
                            {st?.title || st?.protocol_id || `Study ${idx + 1}`}
                            {isPendingStudy && (
                                <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                                    selectedStudyIndex === idx ? 'bg-white/20 text-white' : 'bg-[#FFF3E0] text-[#E65100]'
                                }`}>Pending Review</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const pStatus = (participant?.status || '').toUpperCase().trim();
    const appStatus = (participant?.approval_status || '').toUpperCase().trim();
    const isConsented = ['CONSENTED', 'RANDOMIZED', 'ACTIVE', 'COMPLETED'].includes(pStatus);
    const isEnrolled = isConsented || ['ENROLLED', 'REGISTERED', 'SCREENING', 'ELIGIBLE'].includes(pStatus);
    const isPending = ['PENDING_APPROVAL', 'APPLIED', 'PENDING_REVIEW'].includes(pStatus);
    const isRejected = pStatus === 'INELIGIBLE' || pStatus === 'DROPPED' || appStatus === 'REJECTED';

    if (!study || !participant || isRejected || isPending) {
        if (isRejected) {
            const isDropped = pStatus === 'DROPPED';
            return (
                <div className="flex flex-col gap-4 w-full animate-in fade-in duration-500">
                    {studySwitcher}
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-white border border-red-100 rounded-[24px] flex items-center justify-center mb-8 shadow-sm">
                            {isDropped ? <AlertCircle className="w-10 h-10 text-orange-500/50" /> : <X className="w-10 h-10 text-red-500/50" />}
                        </div>
                        <h2 className="text-3xl font-bold text-[#1A2B49] tracking-tight mb-4">{isDropped ? 'Study Participation Ended' : 'Eligibility Update'}</h2>
                        <p className="text-[#5F6F89] font-bold uppercase tracking-widest mb-6 max-w-lg leading-relaxed">
                            {isDropped 
                                ? `Your participation in ${study?.title || 'the study'} has been formally closed.`
                                : `A decision has been reached regarding your application for ${study?.title || 'the study'}.`}
                        </p>
                        
                        <Card className={`p-8 border-l-4 max-w-xl w-full text-left ${isDropped ? 'border-orange-500 bg-orange-50/30' : 'border-red-500 bg-red-50/30'}`}>
                            <div className="flex items-start gap-4">
                                <AlertCircle className={`w-6 h-6 shrink-0 mt-0.5 ${isDropped ? 'text-orange-500' : 'text-red-500'}`} />
                                <div>
                                    <h4 className="text-[12px] font-black text-[#1A2B49] uppercase tracking-[0.2em] mb-3">Feedback from Clinical Team</h4>
                                    <div className="text-[14px] text-[#5F6F89] font-bold leading-relaxed uppercase whitespace-pre-wrap">
                                        {participant?.status_notes || (isDropped 
                                            ? "Your record has been updated to reflect study withdrawal/completion. Thank you for your time."
                                            : "Thank you for your interest. At this time, you do not meet all the specific criteria required for this protocol. We appreciate your contribution to medical research.")
                                        }
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-red-100">
                                        <p className="text-[11px] text-[#8A99B3] font-bold uppercase tracking-widest">
                                            This status update is final. For further clarification, please contact the study coordinator.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <button
                            onClick={() => onAction('Discover Studies')}
                            className="mt-10 flex items-center gap-3 px-10 py-5 bg-white border border-[#E3ECF5] hover:bg-[#F8FBFF] text-[#1A2B49] rounded-xl font-bold text-[14px] uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                        >
                            <Search className="w-4 h-4" />
                            Browse Other Studies
                        </button>
                    </div>
                </div>
            );
        }

        if (isPending) {
            return (
                <div className="flex flex-col gap-4 w-full animate-in fade-in duration-500">
                    {studySwitcher}
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
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-4 w-full animate-in fade-in duration-500">
                {studySwitcher}
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
            </div>
        );
    }

    // ──────────────── CASE 2: ENROLLED ────────────────
    return (
        <div className="flex flex-col gap-4 animate-in fade-in duration-700 pb-6">

            {/* STUDY SWITCHER */}
            {studySwitcher}

            {/* WELCOME HEADER */}
            <div className="flex items-center gap-2.5">
                <div className="w-1 h-6 bg-[#1E88E5] rounded-full" />
                <h2 className="text-lg font-bold text-[#1A2B49] tracking-tight">
                    Welcome back, <span className="text-[#1E88E5]">{firstName}</span>
                </h2>
            </div>

            {/* CLINICAL PROFILE STRIP — Study Arm */}
            {(() => {
                const arm = participant?.assigned_arm_name || participant?.assigned_arm?.name;
                if (!arm) return null;
                const chips = [
                    { icon: Layers3, label: 'Study Arm', value: arm || null, color: '#00796B', bg: '#E0F2F1' },
                ];
                return (
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        {chips.map((chip) => {
                            if (!chip.value) return null;
                            const Icon = chip.icon;
                            return (
                                <div
                                    key={chip.label}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-wide transition-all"
                                    style={{ backgroundColor: chip.bg, borderColor: chip.color + '30', color: chip.color }}
                                >
                                    <Icon size={12} />
                                    <span className="text-[#8A99B3] uppercase mr-0.5" style={{ fontSize: '9px', letterSpacing: '0.12em' }}>{chip.label}:</span>
                                    <span>{chip.value}</span>
                                </div>
                            );
                        })}
                    </div>
                );
            })()}

            {/* TOP SECTION: ENROLLMENT & TIMELINE */}
            {!isConsented && (
                <div className="bg-[#FFF3E0] border border-[#FFE0B2] rounded-2xl p-6 flex items-start gap-5 shadow-sm">
                    <div className="w-12 h-12 bg-[#FF9800]/10 rounded-xl flex items-center justify-center shrink-0">
                        <FileSignature className="w-6 h-6 text-[#F57C00]" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-[#F57C00] uppercase tracking-[0.2em]">Action Required</span>
                            <div className="h-1 w-1 bg-[#F57C00]/30 rounded-full" />
                        </div>
                        <h3 className="text-lg font-bold text-[#1A2B49] mb-1">Informed Consent Form Pending</h3>
                        <p className="text-[#5F6F89] text-[13px] font-bold leading-relaxed mb-4 uppercase">
                            You have been approved for <span className="text-[#1E88E5]">{study?.title}</span>. To begin your participation and access questionnaires, you must first review and sign the informed consent document.
                        </p>
                        <button 
                            onClick={() => onAction('Tasks')}
                            className="bg-[#FF9800] hover:bg-[#F57C00] text-white px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all shadow-md shadow-orange-500/20 flex items-center gap-2"
                        >
                            Sign Document Now
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                {/* Enrollment Card */}
                <Card className="lg:col-span-8 p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-4 sm:gap-6 shadow-sm border-[#E3ECF5]">
                    {/* Circular Progress */}
                    <div className="flex-shrink-0">
                        <div className="relative w-[80px] h-[80px]">
                            <CircularProgress value={progressPercent} size={80} strokeWidth={8} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-lg font-black text-[#1A2B49] leading-none">{progressPercent}%</span>
                                <span className="text-[8px] font-bold text-[#1E88E5] uppercase tracking-wider mt-0.5">Done</span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start gap-1.5 text-center sm:text-left">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <Badge color="slate" className="text-[10px] rounded-md">
                                {participant?.status?.replace(/_/g, ' ') || 'ENROLLED'}
                            </Badge>
                            {['ACTIVE', 'RANDOMIZED', 'ENROLLED'].includes((participant?.status || '').toUpperCase()) && (
                                <Badge color="blue" className="text-[10px] rounded-md">ACTIVE</Badge>
                            )}
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-[#1A2B49] leading-tight italic uppercase truncate">
                            {study?.title || 'Untitled Study'}
                        </h3>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-x-3 gap-y-1 text-[10px] font-bold text-[#5F6F89] uppercase tracking-tight">
                            <span>PID: <span className="text-[#1A2B49]">{participant?.participant_sid || 'PO-XXXX'}</span></span>
                            <span className="hidden sm:inline">·</span>
                            <span>Study ID: <span className="text-[#1A2B49]">{study?.protocol_id || 'STD-XXXX'}</span></span>
                            <span className="hidden sm:inline">·</span>
                            <span>Enrolled: <span className="text-[#1A2B49]">{enrollmentDateStr}</span></span>
                        </div>
                    </div>
                </Card>

                {/* Timeline Card */}
                <Card className="lg:col-span-4 p-4 sm:p-5 flex flex-col justify-between hover:border-[#1E88E5]/30 transition-all">
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest">Enrollment Timeline</span>
                        <div className="flex items-center gap-2 text-[#1E88E5]">
                            <History className="w-4 h-4" />
                            <p className="text-base font-bold tracking-tight">
                                {daysInStudy > 0 ? `Study Day ${daysInStudy}` : 'Waiting for Approval'}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2 mt-4">
                        <ProgressBar 
                            percent={daysInStudy > 0 ? Math.max(2, Math.min(100, (daysInStudy / 90) * 100)) : 0} 
                            height={6} 
                        />
                        <div className="flex justify-between items-center text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest">
                            <span>DAY 1</span>
                            <span>Target: 90 Days</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* DASHBOARD GRID: Tasks + Visit */}
            {(participant?.status || '').toUpperCase() !== 'PENDING_REVIEW' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    
                    {/* Tasks Card */}
                    <Card
                        className={`p-5 hover:border-[#1E88E5]/50 border-2 border-transparent transition-all cursor-pointer flex flex-col justify-between min-h-[180px] bg-white group shadow-[0_4px_25px_rgba(30,136,229,0.04)] ${!isConsented ? 'border-orange-100' : ''}`}
                        onClick={() => onAction('Tasks')}
                    >
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${!isConsented ? 'bg-orange-50 text-orange-500 border-orange-200' : 'bg-[#E3F2FD] text-[#1E88E5] border-[#BBDEFB]'}`}>
                                    <ClipboardList className="w-4 h-4" />
                                </div>
                                <span className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest">
                                    {!isConsented ? 'Enrollment Required' : 'Clinical Protocol'}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xl font-bold text-[#1A2B49] tracking-tight">
                                    {!isConsented ? (
                                        <><span className="text-orange-500">Sign</span> Consent Form</>
                                    ) : (
                                        <><span className="text-[#1E88E5]">{pendingTasksCount}</span> Activities Pending</>
                                    )}
                                </h4>
                                <p className="text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest">
                                    {!isConsented ? "Required before accessing study tasks." : (pendingTasksCount > 0 ? "Items requiring immediate attention." : "Protocol adherence complete for today.")}
                                </p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 group-hover:text-[#1E88E5] text-[#5F6F89] text-[11px] font-bold uppercase tracking-widest transition-all mt-4">
                            Manage Tasks <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </Card>
    
                    {/* Next Visit Card */}
                    <Card
                        className="p-5 hover:border-[#1E88E5]/50 border-2 border-transparent transition-all cursor-pointer flex flex-col justify-between min-h-[180px] bg-white group shadow-[0_4px_25px_rgba(30,136,229,0.04)]"
                        onClick={() => onAction('Visits')}
                    >
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-[#FFF3E0] rounded-lg flex items-center justify-center text-[#E65100] border border-[#FFE0B2]">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <span className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest">Next Site Visit</span>
                            </div>
    
                            {nextVisit ? (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    <div className="space-y-0.5">
                                        <span className="text-[9px] font-bold text-[#5F6F89] uppercase tracking-widest flex items-center gap-1">
                                            <Calendar className="w-2.5 h-2.5" /> Scheduled Date
                                        </span>
                                        <p className="text-[13px] font-bold text-[#1A2B49] tracking-tight">
                                            {new Date(nextVisit.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[9px] font-bold text-[#8A99B3] uppercase tracking-widest flex items-center gap-1">
                                            <Clock className="w-2.5 h-2.5" /> Check-in Time
                                        </span>
                                        <p className="text-[13px] font-bold text-[#1A2B49] tracking-tight">
                                            {new Date(nextVisit.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="col-span-2 space-y-0.5">
                                        <span className="text-[9px] font-bold text-[#5F6F89] uppercase tracking-widest flex items-center gap-1">
                                            <MapPin className="w-2.5 h-2.5" /> Location
                                        </span>
                                        <p className="text-[13px] font-bold text-[#1E88E5] uppercase tracking-tight truncate">
                                            {nextVisit.location_name || study.location || 'Research Site'}
                                        </p>
                                        <p className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-tight line-clamp-1 italic">
                                            {nextVisit.location_address || 'Address pending'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-1">
                                    <p className="text-base font-bold text-[#5F6F89] uppercase tracking-tight">Not scheduled yet</p>
                                    <p className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest mt-1">Your coordinator will update this soon</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            ) : (
                <Card className="p-8 border-[#1E88E5]/10 bg-[#E3F2FD]/20">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#1E88E5]">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-[#1A2B49] uppercase tracking-widest mb-2">Review in Progress</h4>
                            <p className="text-[13px] text-[#5F6F89] font-bold leading-relaxed uppercase">
                                Your enrollment for <span className="text-[#1E88E5]">{study?.title}</span> is currently being reviewed by our clinical team. Once approved, your tasks and study timeline will appear here.
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* SHIPPING TRACKER BAR (3-Step Simplified Flow) */}
            {activeKit && study?.has_study_kit && (
                <Card 
                    className="p-4 hover:border-[#1E88E5]/30 transition-all flex flex-col bg-white border-l-4 border-l-[#1E88E5] cursor-pointer group"
                    onClick={() => onAction('Study Kit')}
                >
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-center sm:text-left">
                            <div className="w-10 h-10 bg-[#E3F2FD] rounded-xl flex items-center justify-center text-[#1E88E5] border border-[#BBDEFB] shrink-0">
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-[#1A2B49] tracking-tight uppercase leading-none">Clinical Supply Tracker</h4>
                                <p className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest leading-none mt-1">
                                    {activeKit.kit_type} · <span className="font-mono">{activeKit.kit_number}</span>
                                </p>
                            </div>
                        </div>

                        {/* 3-Step Visual Flow */}
                        <div className="flex items-center gap-2 sm:gap-6 w-full sm:w-auto px-4 sm:px-0">
                            {[
                                { id: 1, label: 'Prepare', icon: ClipboardList },
                                { id: 2, label: 'Ship', icon: Truck },
                                { id: 3, label: 'Receive', icon: CheckCircle2 }
                            ].map((step, idx, arr) => (
                                <React.Fragment key={step.id}>
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                                            kitStep >= step.id 
                                                ? 'bg-[#1E88E5] border-[#1E88E5] text-white shadow-md' 
                                                : 'bg-white border-[#E3ECF5] text-[#B0BCCF]'
                                        }`}>
                                            <step.icon className="w-3.5 h-3.5" />
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-tighter ${
                                            kitStep >= step.id ? 'text-[#1E88E5]' : 'text-[#B0BCCF]'
                                        }`}>{step.label}</span>
                                    </div>
                                    {idx < arr.length - 1 && (
                                        <div className={`h-0.5 flex-1 min-w-[20px] sm:min-w-[40px] rounded-full transition-all ${
                                            kitStep > step.id ? 'bg-[#1E88E5]' : 'bg-[#E3ECF5]'
                                        }`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        <div className="shrink-0 flex items-center gap-2 text-[#1E88E5] font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                            Details <ArrowRight className="w-3 h-3" />
                        </div>
                    </div>
                </Card>
            )}

            {/* STUDY OVERVIEW & BENEFITS (DYNAMIC) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-6 border-l-4 border-l-[#1E88E5] bg-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-[#E3F2FD] rounded-lg text-[#1E88E5]">
                            <Globe className="w-4 h-4" />
                        </div>
                        <h4 className="text-[11px] font-black text-[#1A2B49] uppercase tracking-[0.2em]">Study Protocol Overview</h4>
                    </div>
                    <div className="text-[13px] text-[#5F6F89] font-medium leading-relaxed max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                        {study?.description || study?.overview || "Study overview and protocol details will be available here."}
                    </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-[#4CAF50] bg-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-[#E8F5E9] rounded-lg text-[#4CAF50]">
                            <Trophy className="w-4 h-4" />
                        </div>
                        <h4 className="text-[11px] font-black text-[#1A2B49] uppercase tracking-[0.2em]">Participant Benefits</h4>
                    </div>
                    <div className="text-[13px] text-[#5F6F89] font-medium leading-relaxed max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                        {study?.benefit || "Information regarding compensation, laboratory results, and health benefits will be detailed here."}
                    </div>
                </Card>
            </div>

            {/* MESSAGES BAR */}

            {/* WEARABLE INTEGRATION BAR */}
            <Card className="p-4 hover:border-[#4CAF50]/30 transition-all flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border-l-4 border-l-[#4CAF50]">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                    <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center text-[#2E7D32] border border-[#C8E6C9] shrink-0">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#1A2B49] tracking-tight uppercase leading-none">Wearable & Health Data</h4>
                        <p className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest leading-none mt-1 truncate max-w-[260px]">
                            {participant?.wearable_linked ? "System synchronized with real-time biometric telemetry." : "Connect Fitbit or Apple Health for protocol monitoring."}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={() => onAction('Connect Wearable', { platform: 'fitbit' })}
                        className={`px-4 py-2.5 border rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${participant?.fitbit_linked ? 'bg-[#E8F5E9] border-[#C8E6C9] text-[#2E7D32]' : 'bg-[#F8FBFF] border-[#E3ECF5] text-[#1E88E5] hover:bg-[#E3F2FD]'}`}
                    >
                        {participant?.fitbit_linked ? <CheckCircle2 className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                        Fitbit
                    </button>
                    <button
                        onClick={() => onAction('Connect Wearable', { platform: 'apple' })}
                        className={`px-4 py-2.5 border rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${participant?.apple_linked ? 'bg-[#E8F5E9] border-[#C8E6C9] text-[#2E7D32]' : 'bg-[#F8FBFF] border-[#E3ECF5] text-[#1E88E5] hover:bg-[#E3F2FD]'}`}
                    >
                        {participant?.apple_linked ? <CheckCircle2 className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                        Apple Health
                    </button>
                </div>
            </Card>

            {/* REGULATORY FOOTER */}
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 py-4 border-t border-[#E3ECF5]">
                {[
                    { label: 'SECURE CLINICAL CLOUD', icon: Globe },
                    { label: 'HIPAA COMPLIANT', icon: ShieldCheck },
                    { label: 'VERIFIED RESEARCH SITE', icon: CheckCircle2 }
                ].map((tag, idx) => (
                    <div key={idx} className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                        <tag.icon className="w-3.5 h-3.5 text-[#1E88E5]" />
                        <span className="text-[9px] font-bold text-[#5F6F89] uppercase tracking-[0.2em]">{tag.label}</span>
                    </div>
                ))}
            </div>

        </div>
    );


};

export default React.memo(DashboardView);
