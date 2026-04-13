import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    TrendingUp, Calendar, CheckCircle2, Award, 
    BarChart3, Download, Share2, 
    Filter, Clock, Target, Zap, ChevronRight,
    ArrowUpRight, AlertCircle, Info, PieChart, Globe
} from 'lucide-react';
import { Card, Badge, CircularProgress, ProgressBar, LineChart, BarChart, Skeleton, SkeletonText, SkeletonCircle } from './SharedComponents';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const ReportsView = ({ 
    userName, 
    study,
    compensations = [],
    tasks = [],
    visits = [],
    kits = [],
    participant,
    isLoading = false
}: { 
    userName?: string; 
    study?: any;
    compensations?: any[];
    tasks?: any[];
    visits?: any[];
    kits?: any[];
    participant?: any;
    isLoading?: boolean;
}) => {
    const [timeRange, setTimeRange] = useState('Entire Study');

    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const safeKits = Array.isArray(kits) ? kits : [];
    const safeCompensations = Array.isArray(compensations) ? compensations : [];
    const safeVisits = Array.isArray(visits) ? visits : [];

    const totalEarned = React.useMemo(() => {
        return safeCompensations
            .filter((c: any) => c?.status === 'PAID')
            .reduce((sum: number, c: any) => sum + parseFloat(c?.amount || 0), 0);
    }, [safeCompensations]);

    const pendingPayment = React.useMemo(() => {
        return safeCompensations
            .filter((c: any) => c?.status === 'PENDING')
            .reduce((sum: number, c: any) => sum + parseFloat(c?.amount || 0), 0);
    }, [safeCompensations]);

    const completedTasks = safeTasks.filter((t: any) => t?.is_completed || (t?.status || '').toUpperCase() === 'COMPLETED').length;
    const totalTasks = safeTasks.length || 0;
    const taskCompletionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const recruitmentDate = participant?.reviewed_at || participant?.created_at || study?.created_at;
    const daysInStudy = recruitmentDate ? Math.max(1, Math.ceil((new Date().getTime() - new Date(recruitmentDate).getTime()) / (1000 * 3600 * 24))) : 0;

    const adherencePercent = totalTasks > 0 
        ? Math.round((safeTasks.filter((t: any) => (t?.status || '').toUpperCase() === 'COMPLETED').length / totalTasks) * 100) 
        : 0;

    const currentStreak = React.useMemo(() => {
        if (safeTasks.length === 0) return 0;
        const sorted = [...safeTasks]
            .filter((t: any) => (t?.status || '').toUpperCase() === 'COMPLETED')
            .sort((a: any, b: any) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime());
        
        if (sorted.length === 0) return 0;
        
        let streak = 0;
        let lastDate = new Date();
        lastDate.setHours(0,0,0,0);

        for (const t of sorted) {
            if (!t.completed_at) continue;
            const tDate = new Date(t.completed_at);
            tDate.setHours(0,0,0,0);
            const diff = Math.floor((lastDate.getTime() - tDate.getTime()) / (1000 * 3600 * 24));
            
            if (diff === 0 || diff === 1) {
                streak++;
                lastDate = tDate;
            } else {
                break;
            }
        }
        return streak;
    }, [safeTasks]);

    if (isLoading) {
        return (
            <div className="space-y-12 pb-20">
                <div className="flex justify-between items-end">
                    <div className="space-y-4">
                        <SkeletonText width="w-32" height="h-3" />
                        <SkeletonText width="w-48" height="h-8" />
                        <SkeletonText width="w-64" height="h-4" />
                    </div>
                    <Skeleton variant="item" className="w-64 h-12" />
                </div>
                <Skeleton className="w-full h-32" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {[1, 2].map(i => <Skeleton key={i} className="h-96" />)}
                </div>
            </div>
        );
    }

    return (
        <div id="reports-content" className="space-y-12 pb-20">
            {/* ──────────────── HEADER ──────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden">
                <div>
                    <div className="flex items-center gap-2 text-slate-500 text-[13px] font-black uppercase tracking-widest mb-4">
                        <span>Dashboard</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-amber-500">Reports</span>
                    </div>
                    <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase mb-2">Reports</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[13px]">Track your progress, stay motivated, and see your study achievements</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                        {['Last 7 days', 'Last 30 days', 'Entire Study'].map(range => (
                            <button 
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all ${timeRange === range ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ──────────────── MOTIVATIONAL BANNER ──────────────── */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-gradient-to-r from-[#0a101f] via-[#0d1424] to-[#0a101f] rounded-[2.5rem] p-8 shadow-2xl border border-white/5"
            >
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Award className="w-32 h-32 rotate-12 text-amber-500" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 bg-amber-500/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-inner group">
                        <Zap className="w-8 h-8 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-white italic uppercase tracking-tight">You’re making great progress!</h4>
                        <p className="text-white/80 font-bold uppercase tracking-widest text-[13px] mt-1">Keep completing your tasks to finish the study successfully and unlock full rewards.</p>
                    </div>
                </div>
            </motion.div>

            {/* ──────────────── SUMMARY OVERVIEW ──────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                <Card className="p-8 group hover:border-amber-500/30 transition-all duration-500">
                    <div className="flex justify-between items-start mb-8">
                        <h4 className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em]">Study Completion</h4>
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 border border-amber-500/20 shadow-inner">
                            <Target className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        <CircularProgress value={taskCompletionPercent} size={90} strokeWidth={8} />
                        <div>
                            <span className="text-[13px] font-black text-white uppercase italic block mb-1">On Track</span>
                            <p className="text-[13px] font-bold text-slate-500 uppercase leading-relaxed tracking-wider">Status: {taskCompletionPercent}% synchronized</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-8 group hover:border-amber-500/30 transition-all duration-500">
                    <div className="flex justify-between items-start mb-8">
                        <h4 className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em]">Days in Study</h4>
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 border border-amber-500/20 shadow-inner">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black text-white italic leading-none drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">{daysInStudy}</span>
                            <span className="text-2xl font-black text-slate-600 uppercase italic">Days</span>
                        </div>
                        <p className="text-[13px] font-black text-slate-500 uppercase tracking-[0.3em]">Total active duration</p>
                    </div>
                </Card>

                <Card className="p-8 group hover:border-amber-500/30 transition-all duration-500 md:col-span-2 lg:col-span-1">
                    <div className="flex justify-between items-start mb-8">
                        <h4 className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em]">Tasks Completed</h4>
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 border border-amber-500/20 shadow-inner">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black text-white italic leading-none">{completedTasks}</span>
                                <span className="text-slate-500 font-bold uppercase text-lg">/ {totalTasks}</span>
                            </div>
                            <Badge color="amber">{taskCompletionPercent}% SYNCED</Badge>
                        </div>
                        <ProgressBar percent={taskCompletionPercent} height={10} />
                    </div>
                </Card>
            </div>

            {/* ──────────────── PROGRESS & ENGAGEMENT ──────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Progress Details */}
                <Card className="p-8 space-y-10">
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-amber-500" />
                        Progress Tracking
                    </h3>
                    
                    <div className="space-y-8">
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest">Protocol Adherence</span>
                                <span className="text-[13px] font-black text-white uppercase italic">{completedTasks} / {totalTasks}</span>
                            </div>
                            <ProgressBar percent={taskCompletionPercent} />
                        </div>

                        <div className={`grid gap-6 ${study?.uses_kit !== false ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {study?.uses_kit !== false && (
                                <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl space-y-4">
                                    <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest">Kits Completion</span>
                                    <div className="space-y-3">
                                        {(safeKits.length > 0 ? safeKits.slice(0, 3) : [{ id: 1, status: 'PENDING' }]).map((k: any, i: number) => (
                                            <div key={k.id || i} className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${(k.status || '').toUpperCase() === 'DELIVERED' || (k.status || '').toUpperCase() === 'RECEIVED' ? 'bg-amber-500' : 'bg-slate-700'}`} />
                                                <span className={`text-[13px] font-black uppercase tracking-widest ${(k.status || '').toUpperCase() === 'DELIVERED' || (k.status || '').toUpperCase() === 'RECEIVED' ? 'text-white' : 'text-slate-500 italic'}`}>
                                                    Kit {i + 1}: {(k.status || '').toUpperCase() === 'DELIVERED' || (k.status || '').toUpperCase() === 'RECEIVED' ? 'Done' : 'Pending'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl space-y-4">
                                <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest">Study Milestones</span>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-3 h-3 text-amber-500" />
                                        <span className="text-[13px] font-black text-white uppercase tracking-widest">Enrollment</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${completedTasks > 0 ? 'bg-amber-500' : 'bg-slate-700'}`} />
                                        <span className={`text-[13px] font-black uppercase tracking-widest ${completedTasks > 0 ? 'text-white' : 'text-slate-500 italic'}`}>Baseline</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-slate-700" />
                                        <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest italic">Midpoint</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Engagement Section */}
                <Card className="p-8 space-y-8">
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                        <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                        Engagement Metrics
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest block mb-1">Daily Adherence</span>
                                    <span className="text-3xl font-black text-white italic leading-none">{adherencePercent}%</span>
                                </div>
                                <Badge color="amber">{adherencePercent}%</Badge>
                            </div>
                            <LineChart data={[0, 0, 0, 0, 0, 0, adherencePercent]} color="#f59e0b" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest block mb-1">Current Streak</span>
                                    <span className="text-3xl font-black text-amber-500 italic leading-none">{currentStreak} Days</span>
                                </div>
                                <div className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                            </div>
                            <BarChart data={[0, 0, 0, 0, 0, 0, 0]} labels={['M', 'T', 'W', 'T', 'F', 'S', 'S']} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* ──────────────── BADGE SYSTEM ──────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Consistent Participant', icon: Zap, color: 'text-amber-500' },
                    { label: 'Top Adherence', icon: Target, color: 'text-amber-400' },
                    { label: 'Milestone Achiever', icon: Award, color: 'text-amber-600' },
                    { label: 'Data Pioneer', icon: Globe, color: 'text-amber-500' }
                ].map((badge, i) => (
                    <motion.div 
                        key={i}
                        whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
                        className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center space-y-4"
                    >
                        <div className={`w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto ${badge.color}`}>
                            <badge.icon className="w-8 h-8" />
                        </div>
                        <p className="text-[13px] font-black text-white uppercase tracking-widest leading-tight">{badge.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* ──────────────── FOOTER ACTIONS ──────────────── */}
            <div className="flex justify-center pt-12">
                <p className="text-slate-600 font-bold uppercase tracking-widest text-[13px] italic">
                    All data is encrypted and de-identified before transmission to authorized research infrastructure.
                </p>
            </div>
        </div>
    );
};

export default ReportsView;


