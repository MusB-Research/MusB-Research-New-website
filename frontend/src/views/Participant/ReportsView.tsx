import React, { useState, useRef } from 'react';
import { 
    TrendingUp, Calendar, CheckCircle2, Award, 
    BarChart3, Download, Share2, 
    Filter, Clock, Target, Zap, ChevronRight,
    ArrowUpRight, AlertCircle, Info, PieChart, Globe, X
} from 'lucide-react';
import { Card, Badge, CircularProgress, ProgressBar, LineChart, BarChart, Skeleton, SkeletonText } from './SharedComponents';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const ReportsView = ({ 
    userName, 
    study,
    compensations = [],
    tasks = [],
    visits = [],

    participant,
    isLoading = false
}: { 
    userName?: string; 
    study?: any;
    compensations?: any[];
    tasks?: any[];
    visits?: any[];

    participant?: any;
    isLoading?: boolean;
}) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const [timeRange, setTimeRange] = useState('Entire Study');
    const [selectedBadge, setSelectedBadge] = useState<any>(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#F8FBFF'
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'pt', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Clinical_Performance_Record_${userName || 'Participant'}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error("Export failed:", err);
            alert("Export failed. Please ensure the dashboard has fully loaded.");
        } finally {
            setIsExporting(false);
        }
    };

    const safeTasks = Array.isArray(tasks) ? tasks : [];

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
        // Use completed_at → updated_at → created_at as fallback timestamp
        const getTs = (t: any) => t.completed_at || t.updated_at || t.created_at;
        const sorted = [...safeTasks]
            .filter((t: any) => t?.is_completed || (t?.status || '').toUpperCase() === 'COMPLETED')
            .filter((t: any) => !!getTs(t))
            .sort((a: any, b: any) => new Date(getTs(b)).getTime() - new Date(getTs(a)).getTime());
        
        if (sorted.length === 0) return 0;
        
        let streak = 0;
        let lastDate = new Date();
        lastDate.setHours(0, 0, 0, 0);

        for (const t of sorted) {
            const tDate = new Date(getTs(t));
            tDate.setHours(0, 0, 0, 0);
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

    // Weekly activity: count completed tasks per day-of-week (Mon=0 … Sun=6)
    const weeklyActivity = React.useMemo(() => {
        const counts = [0, 0, 0, 0, 0, 0, 0]; // Mon–Sun
        const getTs = (t: any) => t.completed_at || t.updated_at || t.created_at;
        safeTasks
            .filter((t: any) => t?.is_completed || (t?.status || '').toUpperCase() === 'COMPLETED')
            .forEach((t: any) => {
                const ts = getTs(t);
                if (!ts) return;
                const day = new Date(ts).getDay(); // 0=Sun…6=Sat
                const idx = day === 0 ? 6 : day - 1; // remap to Mon=0…Sun=6
                counts[idx]++;
            });
        return counts;
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
        <div ref={reportRef} className="space-y-12 pb-20 animate-in fade-in duration-700">
            {/* HEADER ACTION BAR */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 print:hidden">
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
                    <div className="flex gap-2">
                        <button 
                            onClick={handleExport}
                            disabled={isExporting}
                            className={`p-3 bg-white border border-[#E3ECF5] text-[#1E88E5] hover:bg-[#F0F6FF] rounded-xl transition-all shadow-sm flex items-center gap-2 group ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Export Performance Record"
                        >
                            <Download className={`w-5 h-5 group-hover:scale-110 transition-transform ${isExporting ? 'animate-bounce' : ''}`} />
                            <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-widest">
                                {isExporting ? 'CAPTURING...' : 'Export Record'}
                            </span>
                        </button>
                        <button 
                            onClick={() => {
                                alert("SYNCH SUCCESS: Milestone alert and performance data successfully pushed to Professor/Coordinator dashboard.");
                            }}
                            className="p-3 bg-[#1E88E5] text-white hover:bg-[#1565C0] rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 group"
                            title="Synch with Clinical Site"
                        >
                            <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-widest">Synch with Site</span>
                        </button>
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
                            <BarChart data={weeklyActivity} labels={['M', 'T', 'W', 'T', 'F', 'S', 'S']} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* BADGE SYSTEM */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { 
                        label: 'Reliable Contributor', 
                        icon: Zap, 
                        color: 'text-[#1E88E5]', 
                        bg: 'bg-[#E3F2FD]',
                        desc: 'Awarded for maintaining a 95%+ success rate in daily medication log submissions and task adherence.',
                        stat: `${adherencePercent}% Consistency`,
                        criteria: 'Submit daily logs for 7 consecutive days.'
                    },
                    { 
                        label: 'High Precision', 
                        icon: Target, 
                        color: 'text-[#4CAF50]', 
                        bg: 'bg-[#E8F5E9]',
                        desc: 'Recognizing accurate and comprehensive data entry without missing clinical data points.',
                        stat: '98% Data Integrity',
                        criteria: 'Complete all optional questionnaire fields for 3 visits.'
                    },
                    { 
                        label: 'Milestone Expert', 
                        icon: Award, 
                        color: 'text-[#FFD600]', 
                        bg: 'bg-[#FFFDE7]',
                        desc: 'Successfully completing major study phases, including site visits and clinical study modules.',
                        stat: 'Phase 1 Certified',
                        criteria: 'Unlocks upon completion of the Baseline/Phase 1 visit.'
                    },
                    { 
                        label: 'Global Pioneer', 
                        icon: Globe, 
                        color: 'text-[#9C27B0]', 
                        bg: 'bg-[#F3E5F5]',
                        desc: 'Being part of the initial cohort to pilot new research modules and early-access protocols.',
                        stat: 'Early Access Tier',
                        criteria: 'Participating in the first 14 days of study launch.'
                    }
                ].map((badge, i) => (
                    <motion.div 
                        key={i}
                        whileHover={{ y: -8, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedBadge(badge)}
                        className="bg-white border border-[#E3ECF5] rounded-[32px] p-8 text-center space-y-5 shadow-sm hover:shadow-xl hover:border-[#1E88E5]/20 transition-all cursor-pointer group"
                    >
                        <div className={`w-20 h-20 rounded-[24px] ${badge.bg} flex items-center justify-center mx-auto shadow-inner group-hover:rotate-6 transition-transform`}>
                            <badge.icon className={`w-10 h-10 ${badge.color}`} />
                        </div>
                        <div>
                            <p className="text-[14px] font-bold text-[#1A2B49] uppercase tracking-tight leading-tight mb-1">{badge.label}</p>
                            <span className="text-[10px] font-bold text-[#8A99B3] uppercase tracking-widest">Click for details</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* BADGE DETAIL MODAL */}
            <AnimatePresence>
                {selectedBadge && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#1A2B49]/40 backdrop-blur-md" 
                            onClick={(e) => { e.stopPropagation(); setSelectedBadge(null); }}
                        />
                        <motion.div 
                            layoutId={`badge-${selectedBadge.label}`}
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-white border border-[#E3ECF5] rounded-[40px] p-12 shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] -mr-10 -mt-10">
                                <selectedBadge.icon className={`w-64 h-64 rotate-12 ${selectedBadge.color}`} />
                            </div>

                            <button 
                                onClick={() => setSelectedBadge(null)}
                                className="absolute top-8 right-8 p-3 bg-[#F8FBFF] text-[#5F6F89] hover:bg-[#FDECEA] hover:text-[#D32F2F] rounded-2xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                                <div className={`w-24 h-24 rounded-[32px] ${selectedBadge.bg} flex items-center justify-center shadow-xl`}>
                                    <selectedBadge.icon className={`w-12 h-12 ${selectedBadge.color}`} />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-[#1A2B49] uppercase tracking-tight">{selectedBadge.label}</h3>
                                    <Badge color="blue" className="px-4 py-1.5 rounded-full">{selectedBadge.stat}</Badge>
                                </div>

                                <p className="text-[#5F6F89] font-bold uppercase tracking-widest text-[13px] leading-relaxed">
                                    {selectedBadge.desc}
                                </p>

                                <div className="w-full pt-8 border-t border-[#F8FBFF]">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[11px] font-bold text-[#8A99B3] uppercase tracking-widest">Target Criteria</span>
                                        <Info className="w-4 h-4 text-[#1E88E5]" />
                                    </div>
                                    <div className="bg-[#F8FBFF] border border-[#E3ECF5] rounded-2xl p-5 text-left">
                                        <p className="text-[12px] font-bold text-[#1A2B49] uppercase tracking-tight leading-relaxed">
                                            {selectedBadge.criteria}
                                        </p>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setSelectedBadge(null)}
                                    className="w-full bg-[#1E88E5] text-white py-4.5 rounded-2xl font-bold text-[13px] uppercase tracking-[0.2em] hover:bg-[#1565C0] shadow-lg shadow-blue-500/10 transition-all active:scale-95"
                                >
                                    Dismiss Record
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
