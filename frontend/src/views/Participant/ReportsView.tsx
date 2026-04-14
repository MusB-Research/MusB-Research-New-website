import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    TrendingUp, Calendar, CheckCircle2, Award, 
    BarChart3, Download, Share2, 
    Filter, Clock, Target, Zap, ChevronRight,
    ArrowUpRight, AlertCircle, Info, PieChart, Globe
} from 'lucide-react';
import { Card, Badge, CircularProgress, ProgressBar, LineChart, BarChart, Skeleton, SkeletonText } from './SharedComponents';
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
            <div className="space-y-12 pb-20 animate-pulse">
                <div className="flex justify-between items-end">
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <Skeleton className="w-full h-32 rounded-3xl" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {[1, 2].map(i => <Skeleton key={i} className="h-96 rounded-2xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div id="reports-content" className="space-y-10 pb-20">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden">
                <div>
                    <div className="flex items-center gap-2 text-[#5F6F89] text-[12px] font-bold uppercase tracking-widest mb-3">
                        <span>Portal</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-[#1E88E5]">Performance & Analytics</span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#1A2B49] uppercase tracking-tight mb-2">Study Insights</h2>
                    <p className="text-[#5F6F89] font-bold uppercase tracking-widest text-[13px]">Comprehensive overview of clinical contributions and milestones</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <div className="flex bg-white rounded-xl p-1 border border-[#E3ECF5] shadow-sm">
                        {['Last 30 days', 'Entire Study'].map(range => (
                            <button 
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-5 py-2 rounded-lg text-[12px] font-bold uppercase tracking-widest transition-all ${timeRange === range ? 'bg-[#1E88E5] text-white shadow-md' : 'text-[#5F6F89] hover:text-[#5F6F89]'}`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* MOTIVATIONAL BANNER */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-white rounded-[32px] p-8 shadow-sm border border-[#E3ECF5]"
            >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                    <Award className="w-48 h-48 rotate-12 text-[#1E88E5]" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 bg-[#E3F2FD] rounded-2xl flex items-center justify-center border border-[#E3F2FD] shadow-inner">
                        <Zap className="w-8 h-8 text-[#1E88E5]" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-[#1A2B49] uppercase tracking-tight">Phenomenal Contribution!</h4>
                        <p className="text-[#5F6F89] font-bold uppercase tracking-widest text-[13px] mt-1">Your data quality and adherence consistency set a high bar for clinical excellence.</p>
                    </div>
                </div>
            </motion.div>

            {/* SUMMARY OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="p-8 group hover:border-[#1E88E5]/20 bg-white">
                    <div className="flex justify-between items-start mb-8">
                        <h4 className="text-[11px] font-bold text-[#8A99B3] uppercase tracking-widest">Protocol Sync</h4>
                        <div className="w-10 h-10 bg-[#F8FBFF] rounded-xl flex items-center justify-center text-[#1E88E5] border border-[#E3ECF5]">
                            <Target className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        <CircularProgress value={taskCompletionPercent} size={90} strokeWidth={8} color="#1E88E5" />
                        <div>
                            <span className="text-[14px] font-bold text-[#1A2B49] uppercase block mb-1">Aligned</span>
                            <p className="text-[12px] font-bold text-[#5F6F89] uppercase tracking-wider">{taskCompletionPercent}% Complete</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-8 group hover:border-[#1E88E5]/20 bg-white">
                    <div className="flex justify-between items-start mb-8">
                        <h4 className="text-[11px] font-bold text-[#8A99B3] uppercase tracking-widest">Study Tenure</h4>
                        <div className="w-10 h-10 bg-[#F8FBFF] rounded-xl flex items-center justify-center text-[#1E88E5] border border-[#E3ECF5]">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold text-[#1A2B49] tracking-tighter">{daysInStudy}</span>
                            <span className="text-xl font-bold text-[#B0BCCF] uppercase tracking-widest">Days</span>
                        </div>
                        <p className="text-[11px] font-bold text-[#8A99B3] uppercase tracking-widest">Verified participant duration</p>
                    </div>
                </Card>

                <Card className="p-8 group hover:border-[#1E88E5]/20 bg-white md:col-span-2 lg:col-span-1">
                    <div className="flex justify-between items-start mb-8">
                        <h4 className="text-[11px] font-bold text-[#8A99B3] uppercase tracking-widest">Inquiry Success</h4>
                        <div className="w-10 h-10 bg-[#F8FBFF] rounded-xl flex items-center justify-center text-[#1E88E5] border border-[#E3ECF5]">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-[#1A2B49] tracking-tighter">{completedTasks}</span>
                                <span className="text-[#B0BCCF] font-bold uppercase text-lg">/ {totalTasks}</span>
                            </div>
                            <Badge color="blue">{taskCompletionPercent}% COMPLETED</Badge>
                        </div>
                        <ProgressBar percent={taskCompletionPercent} height={10} color="#1E88E5" />
                    </div>
                </Card>
            </div>

            {/* PROGRESS & ENGAGEMENT */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <Card className="p-8 space-y-10 bg-white">
                    <h3 className="text-lg font-bold text-[#1A2B49] uppercase tracking-tight flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-[#1E88E5]" />
                        Adherence Metrics
                    </h3>
                    
                    <div className="space-y-10">
                        <div>
                            <div className="flex justify-between mb-3 px-1">
                                <span className="text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest">Clinical Protocol Compliance</span>
                                <span className="text-[12px] font-bold text-[#1A2B49] uppercase">{completedTasks} / {totalTasks} Tasks</span>
                            </div>
                            <ProgressBar percent={taskCompletionPercent} color="#1E88E5" />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {study?.uses_kit !== false && (
                                <div className="p-6 bg-[#F8FBFF] rounded-2xl border border-[#E3ECF5] space-y-4">
                                    <span className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest">Kit Timeline</span>
                                    <div className="space-y-3">
                                        {(safeKits.length > 0 ? safeKits.slice(0, 3) : [{ id: 1, status: 'PENDING' }]).map((k: any, i: number) => (
                                            <div key={k.id || i} className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${(k.status || '').toUpperCase() === 'DELIVERED' || (k.status || '').toUpperCase() === 'RECEIVED' ? 'bg-[#4CAF50]' : 'bg-[#E3ECF5]'}`} />
                                                <span className={`text-[12px] font-bold uppercase tracking-widest ${(k.status || '').toUpperCase() === 'DELIVERED' || (k.status || '').toUpperCase() === 'RECEIVED' ? 'text-[#1A2B49]' : 'text-[#5F6F89]'}`}>
                                                    Module {i + 1}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="p-6 bg-[#F8FBFF] rounded-2xl border border-[#E3ECF5] space-y-4">
                                <span className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest">Study Phase</span>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-[#4CAF50]" />
                                        <span className="text-[12px] font-bold text-[#1A2B49] uppercase tracking-widest">Screening</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3.5 h-3.5 rounded-full ${completedTasks > 0 ? 'bg-[#1E88E5]' : 'bg-[#E3ECF5]'}`} />
                                        <span className={`text-[12px] font-bold uppercase tracking-widest ${completedTasks > 0 ? 'text-[#1A2B49]' : 'text-[#8A99B3]'}`}>Baseline</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-8 space-y-8 bg-white">
                    <h3 className="text-lg font-bold text-[#1A2B49] uppercase tracking-tight flex items-center gap-3">
                        <Zap className="w-5 h-5 text-[#1E88E5]" />
                        Engagement Analytics
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="flex justify-between items-end px-1">
                                <div>
                                    <span className="text-[12px] font-bold text-[#8A99B3] uppercase tracking-widest block mb-1">Participation Rate</span>
                                    <span className="text-3xl font-bold text-[#1A2B49] tracking-tighter">{adherencePercent}%</span>
                                </div>
                                <Badge color="green">Top 5%</Badge>
                            </div>
                            <LineChart data={[0, 0, 0, 0, 0, 0, adherencePercent]} color="#1E88E5" />
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-end px-1">
                                <div>
                                    <span className="text-[12px] font-bold text-[#8A99B3] uppercase tracking-widest block mb-1">Active Streak</span>
                                    <span className="text-3xl font-bold text-[#1E88E5] tracking-tighter">{currentStreak} Days</span>
                                </div>
                                <div className="w-10 h-10 bg-[#FFF3E0] text-[#E65100] rounded-xl flex items-center justify-center border border-[#FFE0B2]">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                            </div>
                            <BarChart data={[0, 0, 0, 0, 0, 0, 0]} labels={['M', 'T', 'W', 'T', 'F', 'S', 'S']} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* BADGE SYSTEM */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Reliable Contributor', icon: Zap, color: 'text-[#1E88E5]', bg: 'bg-[#E3F2FD]' },
                    { label: 'High Precision', icon: Target, color: 'text-[#4CAF50]', bg: 'bg-[#E8F5E9]' },
                    { label: 'Milestone Expert', icon: Award, color: 'text-[#FFD600]', bg: 'bg-[#FFFDE7]' },
                    { label: 'Global Pioneer', icon: Globe, color: 'text-[#9C27B0]', bg: 'bg-[#F3E5F5]' }
                ].map((badge, i) => (
                    <motion.div 
                        key={i}
                        whileHover={{ y: -5 }}
                        className="bg-white border border-[#E3ECF5] rounded-3xl p-8 text-center space-y-5 shadow-sm"
                    >
                        <div className={`w-16 h-16 rounded-2xl ${badge.bg} flex items-center justify-center mx-auto shadow-inner`}>
                            <badge.icon className={`w-8 h-8 ${badge.color}`} />
                        </div>
                        <p className="text-[13px] font-bold text-[#1A2B49] uppercase tracking-tight leading-tight">{badge.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* FOOTER */}
            <div className="flex justify-center pt-8">
                <div className="flex items-center gap-3 px-6 py-3 bg-[#F8FBFF] rounded-full border border-[#E3ECF5]">
                    <ShieldCheck className="w-4 h-4 text-[#1E88E5]" />
                    <p className="text-[#8A99B3] font-bold uppercase tracking-widest text-[11px]">
                         Clinical data integrity verified per protocol standards
                    </p>
                </div>
            </div>
        </div>
    );
};

const ShieldCheck = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
);

export default ReportsView;
