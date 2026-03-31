import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    TrendingUp, Calendar, CheckCircle2, Award, 
    DollarSign, BarChart3, Download, Share2, 
    Filter, Clock, Target, Zap, ChevronRight,
    ArrowUpRight, AlertCircle, Info, PieChart
} from 'lucide-react';
import { Card, Badge, CircularProgress, ProgressBar, LineChart, BarChart } from './SharedComponents';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ReportsView = ({ userName, handleExportPDF: externalExport, study }: { userName?: string; handleExportPDF?: (skipConfirm?: boolean) => void; study?: any }) => {
    const [timeRange, setTimeRange] = useState('Entire Study');

    const handleDownloadPDF = async () => {
        if (externalExport) {
            externalExport(true);
            return;
        }
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

        alert("✅ Your secure study progress report has been encrypted and downloaded.");
    };

    return (
        <div id="reports-content" className="space-y-12 pb-20">
            {/* ──────────────── HEADER ──────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden">
                <div>
                    <div className="flex items-center gap-2 text-slate-500 text-[12px] font-black uppercase tracking-widest mb-4">
                        <span>Dashboard</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-cyan-500">Reports</span>
                    </div>
                    <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase italic mb-2">Reports</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Track your progress, stay motivated, and see your study achievements</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                        {['Last 7 days', 'Last 30 days', 'Entire Study'].map(range => (
                            <button 
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${timeRange === range ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl border border-white/5 font-black text-[12px] uppercase tracking-widest transition-all"
                    >
                        <Download className="w-4 h-4" />
                        Download PDF
                    </button>
                </div>
            </div>

            {/* ──────────────── MOTIVATIONAL BANNER ──────────────── */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-[2.5rem] p-8 shadow-2xl shadow-cyan-500/10"
            >
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Award className="w-32 h-32 rotate-12" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                        <Zap className="w-8 h-8 text-white fill-current" />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-white italic uppercase tracking-tight">You’re making great progress!</h4>
                        <p className="text-white/80 font-bold uppercase tracking-widest text-sm mt-1">Keep completing your tasks to finish the study successfully and unlock full rewards.</p>
                    </div>
                </div>
            </motion.div>

            {/* ──────────────── SUMMARY OVERVIEW ──────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="p-8 group">
                    <div className="flex justify-between items-start mb-6">
                        <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Study Completion</h4>
                        <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400">
                            <Target className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        <CircularProgress value={68} />
                        <div>
                            <span className="text-sm font-black text-white uppercase italic block mb-1">On Track</span>
                            <p className="text-[12px] font-bold text-slate-500 uppercase leading-relaxed tracking-wider">You have completed 68% of your study mission.</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-8 group">
                    <div className="flex justify-between items-start mb-6">
                        <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Days in Study</h4>
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-white italic leading-none">45</span>
                            <span className="text-2xl font-black text-slate-500 uppercase italic">Days</span>
                        </div>
                        <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">Total uptime since enrollment</p>
                    </div>
                </Card>

                <Card className="p-8 group">
                    <div className="flex justify-between items-start mb-6">
                        <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Tasks Completed</h4>
                        <div className="w-10 h-10 bg-[#00e676]/10 rounded-xl flex items-center justify-center text-[#00e676]">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-white italic leading-none">32</span>
                                <span className="text-slate-500 font-bold uppercase text-sm">/ 50</span>
                            </div>
                            <span className="text-[12px] font-black text-[#00e676] uppercase tracking-widest italic">64% Done</span>
                        </div>
                        <ProgressBar percent={64} />
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
                                <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Assessments Completed</span>
                                <span className="text-[12px] font-black text-white uppercase italic">8 / 10</span>
                            </div>
                            <ProgressBar percent={80} />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl space-y-4">
                                <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Kits Completion</span>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#00e676]" />
                                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Kit 1: Done</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#00e676]" />
                                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Kit 2: Done</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">Kit 3: Pending</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl space-y-4">
                                <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Study Milestones</span>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 opacity-100">
                                        <CheckCircle2 className="w-3 h-3 text-[#00e676]" />
                                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Enrollment</span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-100">
                                        <CheckCircle2 className="w-3 h-3 text-[#00e676]" />
                                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Baseline</span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-40">
                                        <Clock className="w-3 h-3 text-slate-500" />
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">Midpoint</span>
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
                                    <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest block mb-1">Daily Adherence</span>
                                    <span className="text-3xl font-black text-white italic leading-none">85%</span>
                                </div>
                                <Badge color="green">+4%</Badge>
                            </div>
                            <LineChart data={[70, 75, 72, 80, 85, 82, 85]} color="#00e676" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest block mb-1">Current Streak</span>
                                    <span className="text-3xl font-black text-amber-500 italic leading-none">7 Days</span>
                                </div>
                                <div className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                            </div>
                            <BarChart data={[5, 7, 6, 8, 4, 9, 7]} labels={['M', 'T', 'W', 'T', 'F', 'S', 'S']} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* ──────────────── EARNINGS SUMMARY ──────────────── */}
            <Card className="p-10 border border-indigo-500/20 bg-gradient-to-b from-[#0d1424] to-[#0a0e1a]">
                <div className="flex flex-col md:flex-row justify-between gap-10 mb-12">
                    <div>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">Earnings Summary</h3>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[12px]">Track your participation rewards and pending credits</p>
                    </div>
                    <div className="grid grid-cols-3 gap-8">
                        <div className="text-right">
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest block mb-1">Total Earned</span>
                            <span className="text-2xl font-black text-white italic leading-none">$120</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest block mb-1">Pending</span>
                            <span className="text-2xl font-black text-amber-500 italic leading-none">$30</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest block mb-1">Received</span>
                            <span className="text-2xl font-black text-[#00e676] italic leading-none">$90</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="pb-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Activity Node</th>
                                <th className="pb-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Timestamp</th>
                                <th className="pb-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Credit Value</th>
                                <th className="pb-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {[
                                { node: 'Enrollment Mission', date: '2026-04-01', value: '$20.00', status: 'PAID' },
                                { node: 'Baseline Survey Sync', date: '2026-04-05', value: '$25.00', status: 'PAID' },
                                { node: 'Clinical Kit #1 Shipment', date: '2026-04-12', value: '$50.00', status: 'PAID' },
                                { node: 'Weekly Dosing Streak #1', date: '2026-04-20', value: '$25.00', status: 'PAID' },
                                { node: 'Midpoint Assessment', date: '2026-05-15', value: '$30.00', status: 'PENDING' }
                            ].map((row, i) => (
                                <tr key={i} className="group hover:bg-white/[0.01] transition-colors">
                                    <td className="py-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black italic ${row.status === 'PAID' ? 'bg-[#00e676]/10 text-[#00e676]' : 'bg-amber-500/10 text-amber-500'}`}>
                                                {row.status === 'PAID' ? '$' : '?'}
                                            </div>
                                            <span className="text-sm font-black text-white uppercase italic tracking-tight">{row.node}</span>
                                        </div>
                                    </td>
                                    <td className="py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">{row.date}</td>
                                    <td className="py-5 text-right font-black text-white italic text-sm tracking-tight">{row.value}</td>
                                    <td className="py-5 text-right">
                                        <Badge color={row.status === 'PAID' ? 'green' : 'amber'}>{row.status}</Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-12 flex justify-center">
                    <button className="flex items-center gap-2 text-[12px] font-black text-cyan-500 uppercase tracking-[0.3em] hover:text-cyan-300 transition-colors">
                        VIEW FULL PAYMENT REGISTRY
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </Card>

            {/* ──────────────── PERSONAL TRENDS ──────────────── */}
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent to-white/5" />
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-[0.5em] italic">Personal Mission Trends</h3>
                    <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent to-white/5" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="p-8 space-y-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-lg font-black text-white italic uppercase tracking-tight">Symptom Trend</h4>
                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Self-Reported Score Over Time</span>
                            </div>
                            <Badge color="indigo">Log Sync Active</Badge>
                        </div>
                        <LineChart data={[10, 8, 9, 6, 5, 4, 3, 2]} color="#6366f1" />
                    </Card>

                    <Card className="p-8 space-y-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-lg font-black text-white italic uppercase tracking-tight">Health Metrics</h4>
                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Biomarker Baseline Variance</span>
                            </div>
                            <div className="flex items-center gap-2 text-cyan-400">
                                <Info className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Verified Lab Data</span>
                            </div>
                        </div>
                        <BarChart data={[2, 4, 3, 7, 5, 6, 8]} labels={['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7']} />
                    </Card>
                </div>
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
                        <p className="text-[11px] font-black text-white uppercase tracking-widest leading-tight">{badge.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* ──────────────── FOOTER ACTIONS ──────────────── */}
            <div className="flex justify-center pt-12">
                <p className="text-slate-600 font-bold uppercase tracking-widest text-[11px] italic">
                    All data is encrypted and de-identified before transmission to research nodes.
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
