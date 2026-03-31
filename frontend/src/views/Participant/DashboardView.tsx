import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, Clock, ArrowRight, ChevronRight, Sparkles, Trophy, 
    Activity, FileText, CheckCircle2, Box, Zap, PlusCircle,
    AlertCircle, MessageSquare, Ship, Microscope, History,
    TrendingUp, Award, LayoutDashboard, Bell, Info, ExternalLink
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
    const pendingTasksCount = tasks?.filter((t: any) => t.status === 'PENDING').length || 0;
    const todayTasksCount = tasks?.filter((t: any) => t.status === 'PENDING' && t.due_date?.includes('Today')).length || 0;
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
                    <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[12px] font-black uppercase tracking-[0.3em] mb-4 italic">
                        <LayoutDashboard className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Command Node</span>
                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                        <span className="text-white/40">{today}</span>
                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                        <span className="text-cyan-400 group-hover:text-white transition-colors flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {localizedTime}
                        </span>
                    </div>

                    <div className="flex flex-col gap-2 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                                Welcome back, <span className="text-cyan-400">{firstName}</span>
                                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                            </h2>
                        </div>
                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-4 bg-white/5 w-fit px-3 py-1 rounded-lg border border-white/5">
                            Active Session: <span className="text-slate-300">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span> Node Sync
                        </p>
                    </div>


                    <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mt-6 italic max-w-xl">
                        Track your study progress, complete today’s activities, and stay connected with your study team.
                    </p>
                </div>
            </div>

            {/* ROW 1 – PRIMARY STATUS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card 
                    className="p-6 bg-[#0d1424] border-white/5 group hover:border-cyan-500/30 transition-all cursor-pointer relative overflow-hidden"
                    onClick={() => onAction('protocol')}
                >
                    <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest block mb-1 italic">Current Study</span>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-tight group-hover:text-cyan-400 transition-colors">{studyName}</h3>
                    <p className="text-[13px] font-bold text-slate-600 uppercase tracking-widest mt-2 italic">ID: {studyId}</p>
                    <Badge color="cyan" className="mt-4 text-[12px] py-0.5 px-2 font-black italic">HYBRID PROTOCOL</Badge>
                    <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                        <Box className="w-20 h-20 text-white" />
                    </div>
                </Card>

                {/* Card 2: Study Status */}
                <Card 
                    className="p-6 bg-[#0d1424] border-white/5 flex flex-col justify-between group hover:border-indigo-500/30 transition-all cursor-pointer"
                    onClick={() => onAction('protocol')}
                >
                    <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest block mb-1 italic">Operational Status</span>
                    <div className="mt-2">
                        <Badge color={statusColors[studyStatus] || 'cyan'} className="text-[13px] py-1 px-4 font-black italic shadow-lg shadow-green-500/10 uppercase">
                            {studyStatus}
                        </Badge>
                    </div>
                    <p className="text-[13px] font-bold text-slate-600 uppercase tracking-widest mt-4 italic">Your current mission stage</p>
                </Card>

                {/* Card 3: Medication Adherence */}
                <Card 
                    className="p-6 bg-[#0d1424] border-white/5 group hover:border-[#00e676]/30 transition-all cursor-pointer relative overflow-hidden"
                    onClick={() => onAction('logs')}
                >
                    <div className="flex justify-between items-start mb-1 h-20">
                        <div>
                            <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest block mb-1 italic">Adherence Rate</span>
                            <span className="text-4xl font-black text-white italic tracking-tighter leading-none">{adherencePercent}%</span>
                            <p className="text-[13px] font-bold text-[#00e676] uppercase tracking-widest mt-2 italic flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Log Sync Today
                            </p>
                        </div>
                        <CircularProgress value={adherencePercent} size={50} strokeWidth={4} />
                    </div>
                    <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:scale-110 transition-transform">
                        <Activity className="w-20 h-20 text-white" />
                    </div>
                </Card>

                {/* Card 4: Protocol Compensation */}
                <Card 
                    className="p-6 bg-[#0d1424] border-white/5 group hover:border-amber-500/30 transition-all cursor-pointer relative overflow-hidden"
                    onClick={() => onAction('compensation')}
                >
                    <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest block mb-1 italic">Compensation Node</span>
                    <div className="space-y-1">
                        <p className="text-[14px] font-black text-white italic uppercase tracking-widest leading-none">Total: $150.00</p>
                        <p className="text-[14px] font-black text-amber-500 italic uppercase tracking-widest leading-none mt-2">Next: Post Visit 2</p>
                    </div>
                    <Badge color="amber" className="mt-4 text-[12px] py-0.5 px-2 font-black italic">STATUS: PENDING</Badge>
                    <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:scale-110 transition-transform">
                        <Trophy className="w-20 h-20 text-white" />
                    </div>
                </Card>

                {/* Card 5: Days in Study */}
                <Card 
                    className="p-6 bg-[#0d1424] border-white/5 group hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden"
                    onClick={() => onAction('tasks')}
                >
                    <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest block mb-1 italic">Temporal Progress</span>
                    <span className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Day {daysInStudy} <span className="text-slate-600">/ {totalStudyDays}</span></span>
                    <div className="mt-4">
                        <ProgressBar percent={daysPercent} height={4} />
                    </div>
                    <p className="text-[13px] font-bold text-slate-600 uppercase tracking-widest mt-4 italic">{Math.round(daysPercent)}% Through Mission Journey</p>
                </Card>
            </div>

            {/* ROW 2 – TASKS AND MILESTONES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 6: Pending Tasks */}
                <Card 
                    className="p-8 bg-[#0a101f] border-white/5 group hover:bg-white/[0.02] hover:border-red-500/30 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[180px]"
                    onClick={() => onAction('Tasks')}
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[14px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Pending Protocols</span>
                        <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                            <PlusCircle className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <span className="text-6xl font-black text-white italic tracking-tighter block leading-none">{pendingTasksCount}</span>
                        <p className="text-[13px] font-black text-red-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                            <AlertCircle className="w-3 h-3" /> Action Required Soon
                        </p>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
                </Card>

                {/* Card 7: Today’s Tasks */}
                <Card 
                    className="p-8 bg-[#0a101f] border-white/5 group hover:bg-white/[0.02] hover:border-[#00e676]/30 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[180px]"
                    onClick={() => onAction('Tasks')}
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[14px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Today's Pipeline</span>
                        <div className="w-10 h-10 bg-[#00e676]/10 rounded-xl flex items-center justify-center text-[#00e676] group-hover:scale-110 transition-transform">
                            <Zap className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <span className="text-6xl font-black text-white italic tracking-tighter block leading-none">{todayTasksCount}</span>
                            <p className="text-[13px] font-black text-slate-600 uppercase tracking-widest mt-2 italic">Activities Assigned Today</p>
                        </div>
                        <div className="flex flex-col gap-1">
                             <span className="text-[13px] font-bold text-slate-400 uppercase tracking-widest italic">• Daily symptom diary</span>
                             <span className="text-[13px] font-bold text-slate-400 uppercase tracking-widest italic">• Supplement log</span>
                        </div>
                    </div>
                </Card>

                {/* Card 8: Next Visit / Milestone */}
                <Card 
                    className="p-8 bg-indigo-600/10 border-indigo-500/30 group hover:bg-indigo-600/20 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[180px]"
                    onClick={() => onAction('Tasks')}
                >
                    <div>
                        <span className="text-[15px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 block italic">Next Critical Milestone</span>
                        <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-tight underline decoration-indigo-500 decoration-2 underline-offset-4 mb-2">Visit 2 – May 22, 2026</h4>
                        <p className="text-[15px] font-bold text-indigo-300/60 uppercase tracking-widest italic leading-relaxed">Ensure all weekly surveys are finalized before site arrival.</p>
                    </div>
                    <div className="flex items-center gap-2 text-[14px] font-black text-indigo-400 uppercase tracking-[0.3em] mt-4 italic group-hover:translate-x-2 transition-transform">
                        Prepare Requirements <ArrowRight className="w-3 h-3" />
                    </div>
                </Card>

                {/* Card 9: Study News */}
                <Card className="p-8 bg-[#0a101f] border-white/5 group hover:bg-white/[0.02] transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[180px]">
                    <div>
                        <span className="text-[15px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block italic">Protocol Flash</span>
                        <p className="text-lg font-bold text-slate-200 italic leading-snug tracking-tight">"New instructions posted for home sample collection protocol..."</p>
                    </div>
                    <div className="flex items-center gap-2 text-[14px] font-black text-cyan-400 uppercase tracking-[0.3em] mt-4 italic hover:text-white transition-colors">
                        View Study News <ExternalLink className="w-3 h-3" />
                    </div>
                </Card>
            </div>

            {/* ROW 3 – OPERATIONS AND COMMUNICATION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <div className="mt-8 text-[14px] font-black text-cyan-500 uppercase tracking-widest flex items-center gap-2 italic">
                        Access Kits Node <ChevronRight className="w-3 h-3" />
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
                    <div className="mt-8 text-[14px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 italic">
                        Sample Genealogy <ChevronRight className="w-3 h-3" />
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
                        <p className="text-[14px] font-black text-slate-600 uppercase tracking-widest italic">Received Today, 14:20</p>
                    </div>
                    <div className="mt-8 text-[14px] font-black text-cyan-500 uppercase tracking-widest flex items-center gap-2 italic">
                        Open Messages <MessageSquare className="w-3 h-3" />
                    </div>
                </Card>

                {/* Card 13: Quick Actions (Priority) */}
                <Card className="p-8 bg-[#00e676]/5 border-[#00e676]/20 border-2 group hover:bg-[#00e676]/10 transition-all cursor-default flex flex-col justify-between shadow-[0_0_50px_rgba(0,230,118,0.05)]">
                    <div className="mb-6">
                        <h3 className="text-[15px] font-black text-[#00e676] uppercase tracking-[0.3em] mb-4 italic">Action Console</h3>
                        <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none italic mb-4">Command Center</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(!study || study.show_dosing_log) && (
                            <button onClick={() => onAction('Logs')} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[13px] font-black text-white uppercase tracking-widest transition-all italic">
                                LOG DOSE
                            </button>
                        )}
                        {(!study || study.show_ae_report) && (
                            <button onClick={() => onAction('Logs')} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[13px] font-black text-white uppercase tracking-widest transition-all italic">
                                REPORT AE
                            </button>
                        )}
                        {(!study || study.kit_tracking_enabled) && (
                            <button onClick={() => onAction('Study Kit')} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[12px] font-black text-white uppercase tracking-widest transition-all italic">
                                SYNC KITS
                            </button>
                        )}
                        <button onClick={() => onAction('Tasks')} className="w-full mt-4 py-4 bg-[#00e676] text-slate-950 rounded-2xl text-[15px] font-black uppercase tracking-[0.3em] shadow-lg shadow-[#00e676]/20 active:scale-95 transition-all italic">
                            INITIALIZE TASK
                        </button>
                    </div>
                </Card>
            </div>

            {/* ROW 4 – PARTICIPATION HISTORY */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Card 14: History Overview */}
                <Card className="md:col-span-6 lg:col-span-4 p-8 bg-[#0d1424] border-white/5 relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors">
                            <History className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-[14px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Legacy Audit</h3>
                            <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none italic">Participation History</h4>
                        </div>
                    </div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed italic">Your end-to-end contribution log within the MusB Research ecosystem.</p>
                </Card>

                {/* Card 15: Stats Count */}
                <Card className="md:col-span-3 lg:col-span-4 p-8 bg-[#0d1424] border-white/5 flex flex-col justify-center items-center text-center group hover:border-[#00e676]/30 transition-all cursor-pointer">
                    <span className="text-7xl font-black text-white italic tracking-tighter block leading-none mb-2">3</span>
                    <span className="text-[14px] font-black text-slate-600 uppercase tracking-[0.2em] italic mb-6">Total Studies Joined</span>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00e676]" />
                            <span className="text-[12px] font-black text-white italic uppercase tracking-widest">2 COMPLETED</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            <span className="text-[12px] font-black text-white italic uppercase tracking-widest">1 ACTIVE</span>
                        </div>
                    </div>
                </Card>

                {/* Card 16: Participation Outcomes */}
                <Card className="md:col-span-3 lg:col-span-4 p-8 bg-[#0d1424] border-white/5 flex flex-col justify-between group">
                    <span className="text-[14px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 block italic">Integrity Matrix</span>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                             <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest italic">Full Protocol Completed</span>
                             <span className="text-lg font-black text-[#00e676] italic tracking-tighter">02</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                             <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest italic">Early Withdrawal Node</span>
                             <span className="text-lg font-black text-slate-700 italic tracking-tighter">00</span>
                        </div>
                        <div className="flex justify-between items-center">
                             <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest italic">Protocol Deviations</span>
                             <span className="text-lg font-black text-red-500/50 italic tracking-tighter">01</span>
                        </div>
                    </div>
                </Card>
            </div>
            
            {/* QUICK ACTION PANEL (OPTIONAL EXPANDED) */}
            <div className="mt-12 pt-12 border-t border-white/5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="space-y-2 text-center md:text-left">
                        <h3 className="text-5xl font-black italic tracking-tighter text-white uppercase italic">Take Action Now</h3>
                        <p className="text-[14px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Access mission-critical tools instantly</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                         {[
                             { label: 'Start Task', icon: Zap, color: 'cyan' },
                             { label: 'Log Supplement', icon: Box, color: 'green' },
                             { label: 'Report Symptom / AE', icon: AlertCircle, color: 'red' },
                             { label: 'Message Study Team', icon: MessageSquare, color: 'indigo' },
                             { label: 'View Kit Tracking', icon: Ship, color: 'cyan' }
                         ].map((btn, i) => (
                             <button
                                key={i}
                                onClick={() => onAction(btn.label)}
                                className="group flex items-center gap-4 px-8 py-5 bg-[#0d1424] hover:bg-white/5 border border-white/5 rounded-[2rem] transition-all active:scale-95 shadow-xl"
                             >
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-${btn.color}-500/10 text-${btn.color}-500 group-hover:scale-110 transition-transform`}>
                                    <btn.icon className="w-5 h-5" />
                                </div>
                                <span className="text-[14px] font-black text-white hover:text-white uppercase tracking-[0.3em] italic">{btn.label}</span>
                             </button>
                         ))}
                    </div>
                </div>
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
