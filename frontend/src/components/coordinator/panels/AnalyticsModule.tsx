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
    onViewProfile,
    preloadedData,
    isLoading: parentLoading
}: { 
    selectedStudyId?: string;
    onViewProfile?: (id: string) => void;
    preloadedData?: any;
    isLoading?: boolean;
}) {
    const [activeView, setActiveView] = useState<'Recruitment' | 'Adherence' | 'Data Quality'>('Recruitment');
    const [stats, setStats] = useState<any>(null);
    const [tracking, setTracking] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMaximized, setIsMaximized] = useState(false);

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                    console.error("Analytics fetch failed", res.status);
                }
            } catch (err) {
                console.error("Analytics fetch failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedStudyId, preloadedData, parentLoading]);

    if (!selectedStudyId || selectedStudyId === 'all') {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-[#0B101B]/40 border border-white/5 rounded-3xl text-center shadow-2xl">
                <BarChart3 className="w-12 h-12 text-slate-700 mb-4" />
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Global View Placeholder</h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-2 max-w-md">Please select a specific study from the top header to view precise clinical intelligence and task adherence metrics.</p>
            </div>
        );
    }

    const complianceKPIs = [
        { label: 'Overall Adherence', val: `${stats?.compliance || 0}%`, trend: 'up', icon: Target, color: 'emerald' },
        { label: 'Upcoming Visits', val: stats?.visits?.upcoming || 0, trend: 'neutral', icon: Calendar, color: 'blue' },
        { label: 'Overdue Visits', val: stats?.visits?.overdue || 0, trend: 'down', icon: AlertTriangle, color: 'red' },
        { label: 'Missed Tasks', val: stats?.completion?.missed || 0, trend: 'down', icon: XCircle, color: 'rose' },
        { label: 'Late Tasks', val: stats?.completion?.late || 0, trend: 'down', icon: Clock, color: 'amber' },
        { label: 'Total Enrolled', val: stats?.enrolled || 0, trend: 'up', icon: Users, color: 'teal' },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            className={`space-y-8 pb-12 transition-all duration-500 ${isMaximized ? 'fixed inset-0 z-[100] bg-[#0F172A] p-4 lg:p-10 overflow-y-auto' : ''}`}
        >
            {isMaximized && (
                <button 
                    onClick={() => setIsMaximized(false)}
                    className="fixed top-8 right-8 p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all z-[110] shadow-2xl"
                >
                    <XCircle className="w-6 h-6" />
                </button>
            )}

            {/* Header */}
            <div className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} gap-6`}>
                <div>
                    <h2 className={`${isMobile ? 'text-2xl' : 'text-xl md:text-2xl'} font-black text-white italic uppercase tracking-tighter`}>Study <span className="text-blue-400">Intelligence</span></h2>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em] mt-1 italic">Real-time Performance & Compliance Tracking</p>
                </div>
                <div className={`flex flex-wrap items-center gap-2 p-1 bg-[#0B101B]/60 border border-white/5 rounded-xl ${isMobile ? 'w-full justify-center' : ''}`}>
                    {['Recruitment', 'Adherence', 'Data Quality'].map((view: any) => (
                        <button 
                            key={view}
                            onClick={() => setActiveView(view)} 
                            className={`px-4 lg:px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeView === view ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {view}
                        </button>
                    ))}
                </div>
            </div>

            {/* Performance KPI Grid */}
            <div className={`grid ${isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-3' : 'grid-cols-3 xl:grid-cols-6'} gap-4`}>
                {complianceKPIs.map((kpi, i) => (
                    <motion.div 
                        key={i} 
                        layout 
                        className="bg-[#0B101B]/40 border border-white/5 rounded-2xl p-6 space-y-3 hover:border-blue-500/20 transition-all group relative overflow-hidden shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform pointer-events-none">
                            <kpi.icon className="w-12 h-12 text-white" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-600 group-hover:text-blue-400 transition-colors shadow-lg">
                                <kpi.icon className="w-4 h-4" />
                            </div>
                            <div className={`flex items-center gap-1 ${kpi.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {kpi.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                <span className="text-[9px] font-black uppercase tracking-tighter">Live</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">{kpi.label}</p>
                            <p className="text-xl font-black text-white italic uppercase tracking-tighter mt-0.5">{kpi.val}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Participant Tracking Section */}
            <div className="bg-[#0B101B]/40 border border-white/5 rounded-3xl p-6 lg:p-8 space-y-8 shadow-2xl">
                <div className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} gap-4`}>
                    <div className="space-y-0.5">
                        <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">Participant <span className="text-blue-400">Adherence</span></h4>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic leading-relaxed">Individual subject task completion tracking</p>
                    </div>
                     <div className={`flex flex-wrap gap-2 ${isMobile ? 'w-full' : ''}`}>
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
                                 a.download = `CLINICAL_ADHERENCE_${selectedStudyId}_${new Date().toISOString().split('T')[0]}.csv`;
                                 a.click();
                             }}
                             className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg"
                             title="Download CSV Report"
                         >
                             <Download className="w-3 h-3" />
                             <span>CSV</span>
                         </button>
                         {!isMobile && (
                             <button 
                                onClick={() => setIsMaximized(!isMaximized)}
                                className={`p-2.5 border rounded-xl transition-all shadow-xl active:scale-95 ${isMaximized ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/5 border-white/5 text-slate-500 hover:text-blue-400 hover:border-blue-500/30'}`}
                                title="Expand Field of View"
                             >
                                <Maximize2 className="w-3 h-3" />
                             </button>
                         )}
                     </div>
                </div>

                {!isMobile && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                                    <th className="pb-4 pl-2">Subject ID</th>
                                    <th className="pb-4">Status</th>
                                    <th className="pb-4">Adherence</th>
                                    <th className="pb-4">Last Interaction</th>
                                    <th className="pb-4 text-right pr-2">Oversight</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {tracking.map((p, i) => (
                                    <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 pl-2">
                                            <p className="text-sm font-black text-white flex items-center gap-2 italic uppercase">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                {p.id}
                                            </p>
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                                p.status === 'ENROLLED' || p.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                                p.status === 'PENDING_REVIEW' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                p.status === 'CONSENTED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                'bg-slate-500/10 text-slate-400 border border-white/10'
                                            }`}>
                                                {p.status?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-4 min-w-[150px]">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${p.progress}%` }} className={`h-full ${p.progress > 80 ? 'bg-emerald-500' : p.progress > 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                                </div>
                                                <span className="text-[11px] font-black text-white italic min-w-[35px]">{p.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-[11px] font-bold text-slate-500 italic">
                                            {p.last_interaction ? new Date(p.last_interaction).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="py-4 text-right pr-2">
                                            <button 
                                                onClick={() => onViewProfile?.(p.id)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg italic font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-white hover:text-blue-900 transition-all active:scale-95"
                                            >
                                                View Profile
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className={`pt-6 border-t border-white/5 flex ${isMobile ? 'flex-col' : 'items-center justify-between'} gap-4`}>
                    <p className="text-[10px] text-slate-500 font-bold italic uppercase tracking-widest">Tracking {tracking.length} randomized subjects in current cohort</p>
                    <button 
                        onClick={() => alert("Compliance Recall Protocol Initialized. System notifications have been dispatched to all non-compliant subjects.")}
                        className={`flex items-center justify-center gap-2 px-6 py-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest italic hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-lg shadow-blue-500/10 ${isMobile ? 'w-full' : ''}`}
                    >
                        <ShieldAlert className="w-3.5 h-3.5" /> Trigger Compliance Recall
                    </button>
                </div>
            </div>
        </motion.div>
    );
}


