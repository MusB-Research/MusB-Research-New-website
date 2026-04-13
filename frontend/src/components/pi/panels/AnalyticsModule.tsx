import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch, API } from '../../../utils/auth';
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
    Database,
    Clock,
    CheckCircle2,
    AlertTriangle,
    XCircle
} from 'lucide-react';

export default function AnalyticsModule({ selectedStudyId }: { selectedStudyId?: string }) {
    const [activeView, setActiveView] = useState<'Recruitment' | 'Adherence' | 'Data Quality'>('Recruitment');
    const [stats, setStats] = useState<any>(null);
    const [tracking, setTracking] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedStudyId || selectedStudyId === 'all') {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const [sData, tData] = await Promise.all([
                    authFetch(`${API}/api/studies/${selectedStudyId}/stats/`).then(r => r.json()),
                    authFetch(`${API}/api/studies/${selectedStudyId}/participant_tracking/`).then(r => r.json())
                ]);
                setStats(sData);
                setTracking(tData);
            } catch (err) {
                console.error("PI Analytics fetch failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedStudyId]);

    if (!selectedStudyId || selectedStudyId === 'all') {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-[#0B101B]/40 border border-white/5 rounded-[3rem] text-center">
                <BarChart3 className="w-16 h-16 text-slate-700 mb-6" />
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Global Oversight Portfolio</h3>
                <p className="text-[12px] text-slate-500 font-bold uppercase tracking-widest mt-2 max-w-md">Please select a specific study protocol from the Command Center header to view precise clinical intelligence and ML-driven forecasts.</p>
            </div>
        );
    }

    const complianceKPIs = [
        { label: 'Overall Compliance', val: `${stats?.completion?.compliance_rate || 0}%`, trend: 'up', icon: Target, color: 'emerald' },
        { label: 'Late Submissions', val: stats?.completion?.late || 0, trend: 'down', icon: Clock, color: 'amber' },
        { label: 'Missed Windows', val: stats?.completion?.missed || 0, trend: 'down', icon: AlertTriangle, color: 'red' },
        { label: 'Total Enrolled', val: stats?.enrolled || 0, trend: 'up', icon: Users, color: 'indigo' },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6" />
                <p className="text-slate-500 font-black uppercase tracking-[0.4em] italic text-[11px]">Synchronizing Real-time Telemetry...</p>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Clinical <span className="text-indigo-400">Intelligence</span></h2>
                    <p className="text-[13px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 italic">Official PI Oversight & Compliance Metrics</p>
                </div>
                <div className="flex items-center gap-4 p-1.5 bg-[#0B101B]/60 border border-white/5 rounded-2xl">
                    <button onClick={() => setActiveView('Recruitment')} className={`px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${activeView === 'Recruitment' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'}`}>Portfolio</button>
                    <button onClick={() => setActiveView('Adherence')} className={`px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${activeView === 'Adherence' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'}`}>Compliance</button>
                    <button onClick={() => setActiveView('Data Quality')} className={`px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${activeView === 'Data Quality' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'}`}>ML Forecast</button>
                </div>
            </div>

            {/* Performance KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {complianceKPIs.map((kpi, i) => (
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
                            <div className={`flex items-center gap-1.5 text-indigo-400`}>
                                <Activity className="w-3.5 h-3.5" />
                                <span className="text-[12px] font-black uppercase tracking-tighter shadow-[0_0_10px_currentColor]">LIVE</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[13px] text-slate-600 font-bold uppercase tracking-widest italic">{kpi.label}</p>
                            <p className="text-3xl font-black text-white italic uppercase tracking-tighter mt-1">{kpi.val}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Participant Tracking Table */}
            <div className="bg-[#0B101B]/40 border border-white/5 rounded-[3rem] p-10 space-y-10">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">Subject <span className="text-indigo-400">Adherence Matrix</span></h4>
                        <p className="text-[13px] text-slate-500 font-black uppercase tracking-widest italic">High-resolution Participant Compliance Data</p>
                    </div>
                    <div className="flex gap-4">
                         <button className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"><Download className="w-4 h-4" /></button>
                         <button className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"><Maximize2 className="w-4 h-4" /></button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                <th className="pb-6 pl-4">Subject ID</th>
                                <th className="pb-6">Current Status</th>
                                <th className="pb-6">Protocol Adherence</th>
                                <th className="pb-6">Latest Telemetry</th>
                                <th className="pb-6 text-right pr-4">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tracking.map((p, i) => (
                                <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="py-6 pl-4">
                                        <p className="text-[14px] font-black text-white flex items-center gap-3 italic uppercase">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                            {p.id}
                                        </p>
                                    </td>
                                    <td className="py-6">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                            p.status === 'ENROLLED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="py-6 min-w-[200px]">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${p.progress}%` }} className={`h-full ${p.progress > 80 ? 'bg-emerald-500' : p.progress > 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                            </div>
                                            <span className="text-[12px] font-black text-white italic min-w-[40px]">{p.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="py-6 text-[12px] font-bold text-slate-500 uppercase">
                                        {p.last_interaction ? new Date(p.last_interaction).toLocaleDateString() : 'NO ACTIVITY'}
                                    </td>
                                    <td className="py-6 text-right pr-4">
                                        <button className="px-6 py-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all opacity-0 group-hover:opacity-100 italic font-black text-[10px] uppercase tracking-widest">Scientific Review</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="pt-10 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[12px] text-slate-500 font-bold italic uppercase tracking-widest">Auditing {tracking.length} randomized subjects for protocol fidelity</p>
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-widest italic hover:scale-105 transition-all shadow-xl shadow-indigo-600/30">
                            <ShieldAlert className="w-4 h-4" /> Trigger Scientific Audit
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
