import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    TrendingUp, 
    Users, 
    Activity, 
    BarChart3, 
    PieChart, 
    LineChart, 
    Target, 
    Filter, 
    Download, 
    Maximize2, 
    Calendar,
    ChevronDown,
    ArrowUpRight,
    ArrowDownRight,
    Beaker,
    ShieldAlert,
    Database
} from 'lucide-react';

export default function AnalyticsModule() {
    const [activeView, setActiveView] = useState<'Recruitment' | 'Safety' | 'Data Quality' | 'Global'>('Recruitment');

    const recruitmentFunnel = [
        { label: 'Referrals', count: 4200, color: 'indigo' },
        { label: 'Screened', count: 1250, color: 'blue' },
        { label: 'Eligible', count: 520, color: 'emerald' },
        { label: 'Randomized', count: 285, color: 'indigo' },
    ];

    const safetyKPIs = [
        { label: 'SAE Rate', val: '1.2%', trend: 'down', icon: ShieldAlert, color: 'emerald' },
        { label: 'Total AEs', val: '42', trend: 'up', icon: Activity, color: 'amber' },
        { label: 'Treatment Adherence', val: '98.5%', trend: 'up', icon: Target, color: 'indigo' },
        { label: 'Protocol Deviations', val: '04', trend: 'down', icon: Beaker, color: 'emerald' },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Clinical <span className="text-indigo-400">Intelligence</span></h2>
                    <p className="text-[13px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 italic">Predictive Analytics & Performance Hub</p>
                </div>
                <div className="flex items-center gap-4 p-1.5 bg-[#0B101B]/60 border border-white/5 rounded-2xl">
                    <button onClick={() => setActiveView('Recruitment')} className={`px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${activeView === 'Recruitment' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'}`}>Recruitment</button>
                    <button onClick={() => setActiveView('Safety')} className={`px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${activeView === 'Safety' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'}`}>Safety</button>
                    <button onClick={() => setActiveView('Data Quality')} className={`px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${activeView === 'Data Quality' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'}`}>Data Quality</button>
                </div>
            </div>

            {/* Performance KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {safetyKPIs.map((kpi, i) => (
                    <motion.div 
                        key={i} 
                        layout 
                        className="bg-[#0B101B]/40 border border-white/5 rounded-[2.5rem] p-8 space-y-4 hover:border-indigo-500/20 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform">
                            <kpi.icon className="w-16 h-16 text-white" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-600 group-hover:text-indigo-400 transition-colors">
                                <kpi.icon className="w-5 h-5" />
                            </div>
                            <div className={`flex items-center gap-1.5 ${kpi.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {kpi.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                <span className="text-[10px] font-black uppercase tracking-tighter shadow-[0_0_10px_currentColor]">{kpi.trend === 'up' ? '+12%' : '-4%'}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[13px] text-slate-600 font-bold uppercase tracking-widest italic">{kpi.label}</p>
                            <p className="text-3xl font-black text-white italic uppercase tracking-tighter mt-1">{kpi.val}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recruitment Funnel */}
                <div className="lg:col-span-2 bg-[#0B101B]/40 border border-white/5 rounded-[3rem] p-10 space-y-10">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">Recruitment <span className="text-indigo-400">Velocity</span></h4>
                            <p className="text-[13px] text-slate-500 font-black uppercase tracking-widest italic">Live Funnel Data Integration</p>
                        </div>
                        <button className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"><Maximize2 className="w-4 h-4" /></button>
                    </div>
                    
                    <div className="flex flex-col gap-6">
                        {recruitmentFunnel.map((step, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-[11px] font-black text-slate-400 uppercase italic tracking-widest">{step.label}</span>
                                    <span className="text-xl font-black text-white italic">{step.count.toLocaleString()}</span>
                                </div>
                                <div className="h-4 w-full bg-white/5 border border-white/5 rounded-full overflow-hidden flex relative">
                                    <motion.div 
                                        initial={{ width: 0 }} 
                                        animate={{ width: `${(step.count / recruitmentFunnel[0].count) * 100}%` }} 
                                        className={`h-full rounded-full bg-${step.color}-600 bg-gradient-to-r from-transparent to-white/20`}
                                    />
                                    {i > 0 && (
                                        <div className="absolute top-1/2 left-[5px] -translate-y-1/2 text-[8px] font-black text-white/40 uppercase tracking-tighter">
                                            {((step.count / recruitmentFunnel[i-1].count) * 100).toFixed(0)}% Conversion
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-10 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div>
                                <p className="text-[9px] text-slate-700 font-black uppercase">Cohort Alpha Target</p>
                                <p className="text-sm font-black text-emerald-400 italic">285 / 300 Complete</p>
                            </div>
                        </div>
                        <button className="px-6 py-3 bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] transition-all italic">Simulation View</button>
                    </div>
                </div>

                {/* Right Side Cards */}
                <div className="space-y-8">
                    {/* Enrollment Predictor */}
                    <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[2.5rem] p-10 space-y-6 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 p-20 opacity-5 group-hover:scale-110 transition-transform">
                            <Target className="w-32 h-32 text-indigo-400" />
                        </div>
                        <h5 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest italic underline decoration-indigo-800 underline-offset-4">ML Enrollment Predictor</h5>
                        <p className="text-4xl font-black text-white italic uppercase tracking-tighter leading-tight">LPO Date: <span className="text-indigo-400">MAY 2026</span></p>
                        <p className="text-xs text-slate-500 font-bold uppercase italic leading-relaxed">System predicts 92% probability of reaching full randomization by Q2 2026 based on current screening velocity.</p>
                        <button className="w-full py-4 bg-white/5 border border-white/5 text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Generate Full Forecast</button>
                    </div>

                    {/* Data Quality */}
                    <div className="bg-[#0B101B]/40 border border-white/5 rounded-[2.5rem] p-10 space-y-8">
                        <div className="flex items-center gap-4">
                            <Database className="w-6 h-6 text-emerald-400" />
                            <h5 className="text-[11px] font-black text-white uppercase tracking-widest italic">Data Quality Score</h5>
                        </div>
                        <div className="flex items-end justify-between">
                            <p className="text-5xl font-black text-emerald-400 italic tracking-tighter shadow-[0_0_20px_rgba(16,185,129,0.1)]">99.2<span className="text-2xl">%</span></p>
                            <div className="text-right">
                                <p className="text-[9px] text-slate-500 font-black uppercase">Open Queries</p>
                                <p className="text-sm font-black text-white uppercase italic">08 Pending</p>
                            </div>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: '99.2%' }} className="h-full bg-emerald-500" />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
