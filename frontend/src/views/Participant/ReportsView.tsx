import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    TrendingUp, Calendar, CheckCircle2, Award, 
    BarChart3, Download, Share2, 
    Filter, Clock, Target, Zap, ChevronRight,
    ArrowUpRight, AlertCircle, Info, PieChart
} from 'lucide-react';
import { Card, Badge, CircularProgress, ProgressBar, LineChart, BarChart } from './SharedComponents';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ReportsView = ({ 
    userName, 
    study,
    compensations = [],
    tasks = [],
    visits = [],
    kits = []
}: { 
    userName?: string; 
    study?: any;
    compensations?: any[];
    tasks?: any[];
    visits?: any[];
    kits?: any[];
}) => {
    const [timeRange, setTimeRange] = useState('Entire Study');

    const totalEarned = React.useMemo(() => {
        return compensations
            .filter((c: any) => c.status === 'PAID')
            .reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0);
    }, [compensations]);

    const pendingPayment = React.useMemo(() => {
        return compensations
            .filter((c: any) => c.status === 'PENDING')
            .reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0);
    }, [compensations]);

    const totalValue = totalEarned + pendingPayment;

    const completedTasks = tasks.filter((t: any) => t.is_completed || t.status === 'COMPLETED').length;
    const totalTasks = tasks.length || 1;
    const taskCompletionPercent = Math.round((completedTasks / totalTasks) * 100);

    const recruitmentDate = study?.recruitment_start_date || study?.created_at;
    const daysInStudy = recruitmentDate ? Math.max(0, Math.ceil((new Date().getTime() - new Date(recruitmentDate).getTime()) / (1000 * 3600 * 24))) : 0;

    const handleDownloadPDF = async () => {
        const element = document.getElementById('reports-content');
        if (!element) return;

        const canvas = await html2canvas(element, {
            backgroundColor: '#0a0e1a',
            scale: 2,
            logging: false,
            useCORS: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('MusB_Research_Progress_Report.pdf');

        alert("we got your request and our team members contact you shortly");
    };

    return (
        <div id="reports-content" className="space-y-12 pb-20">
            {/* ──────────────── HEADER ──────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden">
                <div>
                    <div className="flex items-center gap-2 text-slate-500 text-[13px] font-black uppercase tracking-widest mb-4">
                        <span>Dashboard</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-cyan-500">Reports</span>
                    </div>
                    <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase italic mb-2">Reports</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[13px]">Track your progress, stay motivated, and see your study achievements</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                        {['Last 7 days', 'Last 30 days', 'Entire Study'].map(range => (
                            <button 
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all ${timeRange === range ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
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
                className="relative overflow-hidden bg-gradient-to-r from-indigo-950 via-[#1e293b] to-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-white/5"
            >
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Award className="w-32 h-32 rotate-12" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 bg-cyan-500/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-cyan-500/20 shadow-inner group">
                        <Zap className="w-8 h-8 text-cyan-400 fill-cyan-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-white italic uppercase tracking-tight">You’re making great progress!</h4>
                        <p className="text-white/80 font-bold uppercase tracking-widest text-[13px] mt-1">Keep completing your tasks to finish the study successfully and unlock full rewards.</p>
                    </div>
                </div>
            </motion.div>

            {/* ──────────────── SUMMARY OVERVIEW ──────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                <Card className="p-8 group hover:border-cyan-500/30 transition-all duration-500">
                    <div className="flex justify-between items-start mb-8">
                        <h4 className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em]">Study Completion</h4>
                        <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-inner">
                            <Target className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        <CircularProgress value={taskCompletionPercent} size={90} strokeWidth={8} />
                        <div>
                            <span className="text-[13px] font-black text-white uppercase italic block mb-1">On Track</span>
                            <p className="text-[13px] font-bold text-slate-500 uppercase leading-relaxed tracking-wider">Study completion status: {taskCompletionPercent}% synchronized</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-8 group hover:border-indigo-500/30 transition-all duration-500">
                    <div className="flex justify-between items-start mb-8">
                        <h4 className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em]">Days in Study</h4>
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black text-white italic leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">{daysInStudy}</span>
                            <span className="text-2xl font-black text-slate-600 uppercase italic">Days</span>
                        </div>
                        <p className="text-[13px] font-black text-slate-500 uppercase tracking-[0.3em]">Total active study duration</p>
                    </div>
                </Card>

                <Card className="p-8 group hover:border-[#00e676]/30 transition-all duration-500 md:col-span-2 lg:col-span-1">
                    <div className="flex justify-between items-start mb-8">
                        <h4 className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em]">Tasks Completed</h4>
                        <div className="w-10 h-10 bg-[#00e676]/10 rounded-xl flex items-center justify-center text-[#00e676] border border-[#00e676]/20 shadow-inner">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black text-white italic leading-none">{completedTasks}</span>
                                <span className="text-slate-500 font-bold uppercase text-lg">/ {totalTasks}</span>
                            </div>
                            <Badge color="green" className="animate-pulse">{taskCompletionPercent}% SYNCED</Badge>
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
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
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

                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl space-y-4">
                                <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest">Kits Completion</span>
                                <div className="space-y-3">
                                    {(kits.length > 0 ? kits.slice(0, 3) : [ {id: 1, status: 'PENDING', batch_number: 'N/A'}]).map((k: any, i: number) => (
                                        <div key={k.id || i} className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${k.status === 'DELIVERED' || k.status === 'RECEIVED' ? 'bg-[#00e676]' : 'bg-amber-500'}`} />
                                            <span className={`text-[13px] font-black uppercase tracking-widest ${k.status === 'DELIVERED' || k.status === 'RECEIVED' ? 'text-white' : 'text-slate-500 italic'}`}>
                                                Kit {i + 1}: {k.status === 'DELIVERED' || k.status === 'RECEIVED' ? 'Done' : 'Pending'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl space-y-4">
                                <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest">Study Milestones</span>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-3 h-3 text-[#00e676]" />
                                        <span className="text-[13px] font-black text-white uppercase tracking-widest">Enrollment</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${completedTasks > 0 ? 'bg-[#00e676]' : 'bg-slate-700'}`} />
                                        <span className={`text-[13px] font-black uppercase tracking-widest ${completedTasks > 0 ? 'text-white' : 'text-slate-500 italic'}`}>Baseline</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-slate-500" />
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
                                    <span className="text-3xl font-black text-white italic leading-none">0%</span>
                                </div>
                                <Badge color="gray">0%</Badge>
                            </div>
                            <LineChart data={[0, 0, 0, 0, 0, 0, 0]} color="#00e676" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest block mb-1">Current Streak</span>
                                    <span className="text-3xl font-black text-amber-500 italic leading-none">0 Days</span>
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
                    { label: 'Top Adherence', icon: Target, color: 'text-cyan-400' },
                    { label: 'Milestone Achiever', icon: Award, color: 'text-[#00e676]' },
                    { label: 'Data Pioneer', icon: Globe, color: 'text-indigo-400' }
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

const Globe = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);
