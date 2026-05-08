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

export default function AnalyticsModule({ 
    selectedStudyId,
    preloadedData,
    isLoading: parentLoading,
    onOpenProfile
}: { 
    selectedStudyId?: string;
    preloadedData?: any;
    isLoading?: boolean;
    onOpenProfile?: (id: string, tab?: string) => void;
}) {
    const [activeView, setActiveView] = useState<'Recruitment' | 'Adherence' | 'Data Quality'>('Recruitment');
    const [stats, setStats] = useState<any>(null);
    const [tracking, setTracking] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (preloadedData) {
            setStats(preloadedData.stats);
            setTracking(preloadedData.participant_tracking);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            if (!selectedStudyId || selectedStudyId === 'all') {
                setLoading(false);
                return;
            }
            if (parentLoading) {
                setLoading(true);
                return;
            }

            setLoading(true);
            try {
                const res = await authFetch(`${API}/api/studies/${selectedStudyId}/coordinator_summary/`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data.stats);
                    setTracking(data.participant_tracking);
                } else {
                    console.error("PI Analytics fetch failed", res.status);
                }
            } catch (err) {
                console.error("PI Analytics fetch failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedStudyId, preloadedData, parentLoading]);

    if (!selectedStudyId || selectedStudyId === 'all') {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-[#0B101B]/40 border border-white/5 rounded-3xl text-center">
                <BarChart3 className="w-12 h-12 text-slate-700 mb-4" />
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Global Oversight Portfolio</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2 max-w-sm">Please select a specific study protocol from the Command Center header to view precise clinical intelligence and ML-driven forecasts.</p>
            </div>
        );
    }

    const complianceKPIs = [
        { label: 'Overall Adherence', val: `${stats?.compliance || 0}%`, trend: 'up', icon: Target, color: 'emerald' },
        { label: 'Upcoming Visits', val: stats?.visits?.upcoming || 0, trend: 'neutral', icon: Calendar, color: 'indigo' },
        { label: 'Overdue Visits', val: stats?.visits?.overdue || 0, trend: 'down', icon: AlertTriangle, color: 'red' },
        { label: 'Missed Tasks', val: stats?.completion?.missed || 0, trend: 'down', icon: XCircle, color: 'rose' },
        { label: 'Late Tasks', val: stats?.completion?.late || 0, trend: 'down', icon: Clock, color: 'amber' },
        { label: 'Total Enrolled', val: stats?.enrolled || 0, trend: 'up', icon: Users, color: 'teal' },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-black uppercase tracking-[0.4em] italic text-xs">Synchronizing Real-time Telemetry...</p>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Clinical <span className="text-teal-400">Intelligence</span></h2>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-[0.3em] mt-1 italic">Official PI Oversight & Compliance Metrics</p>
                </div>
                <div className="flex items-center gap-2 p-1 bg-[#0B101B]/60 border border-white/5 rounded-xl">
                    <button onClick={() => setActiveView('Recruitment')} className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeView === 'Recruitment' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'text-slate-500 hover:text-white'}`}>Portfolio</button>
                    <button onClick={() => setActiveView('Adherence')} className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeView === 'Adherence' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'text-slate-500 hover:text-white'}`}>Compliance</button>
                    <button onClick={() => setActiveView('Data Quality')} className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeView === 'Data Quality' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'text-slate-500 hover:text-white'}`}>ML Forecast</button>
                </div>
            </div>

            {/* Performance KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {complianceKPIs.map((kpi, i) => (
                    <motion.div 
                        key={i} 
                        layout 
                        className="bg-[#0B101B]/40 border border-white/5 rounded-2xl p-6 space-y-3 hover:border-teal-500/20 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform">
                            <kpi.icon className="w-12 h-12 text-white" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-600 group-hover:text-teal-400 transition-colors">
                                <kpi.icon className="w-4 h-4" />
                            </div>
                            <div className={`flex items-center gap-1 text-teal-400`}>
                                <Activity className="w-3 h-3" />
                                <span className="text-[10px] font-black uppercase tracking-tighter">LIVE</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-slate-600 font-bold uppercase tracking-widest italic">{kpi.label}</p>
                            <p className="text-2xl font-black text-white italic uppercase tracking-tighter mt-0.5">{kpi.val}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Participant Tracking Table */}
            <div className="bg-[#0B101B]/40 border border-white/5 rounded-[2rem] p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">Subject <span className="text-teal-400">Adherence Matrix</span></h4>
                        <p className="text-xs text-slate-500 font-black uppercase tracking-widest italic">High-resolution Participant Compliance Data</p>
                    </div>
                    <div className="flex gap-2">
                         <button 
                             onClick={() => {
                                 const headers = ['Subject ID', 'Status', 'Compliance %', 'Last Interaction'];
                                 const csvData = tracking.map(p => [
                                     p.id,
                                     p.status,
                                     p.progress,
                                     p.last_interaction ? new Date(p.last_interaction).toLocaleDateString() : 'N/A'
                                 ]);
                                 const csvContent = [headers.join(','), ...csvData.map(r => r.join(','))].join('\n');
                                 const blob = new Blob([csvContent], { type: 'text/csv' });
                                 const url = URL.createObjectURL(blob);
                                 const a = document.createElement('a');
                                 a.href = url;
                                 a.download = `PI_ADHERENCE_${selectedStudyId}_${new Date().toISOString().split('T')[0]}.csv`;
                                 a.click();
                             }}
                             className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-teal-400 hover:border-teal-500/30 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg"
                         >
                             <Download className="w-3 h-3" />
                             <span>CSV</span>
                         </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                <th className="pb-4 pl-2">Subject ID</th>
                                <th className="pb-4">Current Status</th>
                                <th className="pb-4">Protocol Adherence</th>
                                <th className="pb-4">Latest Telemetry</th>
                                <th className="pb-4 text-right pr-2">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tracking.map((p, i) => (
                                <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="py-4 pl-2">
                                        <p className="text-sm font-black text-white flex items-center gap-2 italic uppercase">
                                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                            {p.id}
                                        </p>
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                                            p.status === 'ENROLLED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="py-4 min-w-[150px]">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${p.progress}%` }} className={`h-full ${p.progress > 80 ? 'bg-emerald-500' : p.progress > 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                            </div>
                                            <span className="text-xs font-black text-white italic min-w-[35px]">{p.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                                        {p.last_interaction ? new Date(p.last_interaction).toLocaleDateString() : 'NO ACTIVITY'}
                                    </td>
                                    <td className="py-4 text-right pr-2">
                                        <button 
                                            onClick={() => onOpenProfile?.(p.id)}
                                            className="px-5 py-2 bg-teal-600 text-white rounded-lg italic font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-teal-950 transition-all shadow-md active:scale-95"
                                        >
                                            Scientific Review
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-bold italic uppercase tracking-widest">Auditing {tracking.length} randomized subjects for protocol fidelity</p>
                    <button className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest italic hover:scale-105 transition-all shadow-xl shadow-teal-600/20">
                        <ShieldAlert className="w-3.5 h-3.5" /> Trigger Scientific Audit
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
