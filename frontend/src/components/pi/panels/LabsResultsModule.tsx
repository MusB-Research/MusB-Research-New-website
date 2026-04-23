import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    CheckCircle2, 
    Clock, 
    TrendingUp, 
    ChevronRight,
    Droplet,
    Microscope,
    FlaskConical,
    Activity,
    Bell,
    Search
} from 'lucide-react';
import { authFetch, API } from '../../../utils/auth';

interface LabSample {
    id: string;
    subjectId: string;
    subjectName: string;
    type: string;
    status: 'Shipped' | 'Processing' | 'Resulted' | 'Alert';
    value: string;
    unit: string;
    date: string;
    critical: boolean;
    isReleased: boolean;
}

export default function LabsResultsModule({ selectedStudyId, preloadedStudies, isLoading: propLoading }: { selectedStudyId?: string, preloadedStudies?: any[], isLoading?: boolean }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [samples, setSamples] = useState<LabSample[]>([]);
    const [internalLoading, setInternalLoading] = useState(true);
    const isLoading = propLoading !== undefined ? propLoading : internalLoading;
    const apiUrl = API || '';

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchLabs = async () => {
            try {
                setInternalLoading(true);
                const query = selectedStudyId && selectedStudyId !== 'all' ? `?study=${selectedStudyId}` : '';
                const res = await authFetch(`${apiUrl}/api/lab-results/${query}`);
                if (res.ok) {
                    const data = await res.json();
                    const mapped = data.map((l: any) => ({
                        id: l.id,
                        subjectId: l.participant_sid || 'SUB-001',
                        subjectName: l.participant_name || 'Anonymous',
                        type: l.test_name || 'Standard Lab',
                        status: l.status || 'Processing',
                        value: l.value,
                        unit: l.units,
                        date: l.lab_date,
                        critical: l.is_critical,
                        isReleased: l.is_released
                    }));
                    setSamples(mapped);
                }
            } catch (err) {
                console.error("Failed to fetch labs:", err);
            } finally {
                setInternalLoading(false);
            }
        };
        fetchLabs();
    }, [selectedStudyId, apiUrl]);

    const handleRelease = async (id: string) => {
        try {
            const res = await authFetch(`${apiUrl}/api/lab-results/${id}/release/`, {
                method: 'POST'
            });
            if (res.ok) {
                setSamples(prev => prev.map(s => s.id === id ? { ...s, isReleased: true } : s));
            }
        } catch (err) {
            console.error("Release failed:", err);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Resulted': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'Processing': return 'text-teal-400 bg-teal-500/10 border-teal-500/20';
            case 'Shipped': return 'text-slate-400 bg-white/5 border-white/10';
            case 'Alert': return 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
            default: return 'text-slate-400 bg-white/5 border-white/10';
        }
    };

    const filteredSamples = samples.filter(s => 
        (s.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.subjectName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.type || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            {/* Header / Tactical Controls */}
            <div className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} gap-8`}>
                <div>
                    <h2 className={`${isMobile ? 'text-2xl' : 'text-xl'} font-black text-white italic uppercase tracking-tight`}>Health Check <span className="text-teal-400">Reports</span></h2>
                    <p className="text-[11px] text-white/40 font-bold uppercase tracking-[0.3em] mt-2 italic">Global Specimen Tracking & Bio-Analysis</p>
                </div>
                <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-4`}>
                    <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Sample ID / Subject Name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm text-white font-bold outline-none focus:border-teal-500/50 transition-all ${isMobile ? 'w-full' : 'w-72'} uppercase tracking-widest placeholder:text-slate-700 font-mono`}
                        />
                    </div>
                    <button className={`flex items-center justify-center gap-3 ${isMobile ? 'py-4 w-full' : 'px-8 py-3.5'} bg-teal-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:scale-[1.03] transition-all shadow-xl shadow-teal-600/20 active:scale-95`}>
                        Request Re-run <FlaskConical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* KPI Cards Row */}
            <div className={`grid ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-4'} gap-6`}>
                {[
                    { label: 'Total Samples', val: samples.length.toString(), icon: Microscope, color: 'indigo' },
                    { label: 'Processing', val: samples.filter(s => s.status === 'Processing').length.toString(), icon: Activity, color: 'blue' },
                    { label: 'Abnormal Highs', val: samples.filter(s => s.status === 'Alert').length.toString(), icon: Bell, color: 'red' },
                    { label: 'Turnaround Avg', val: '4.2 Days', icon: Clock, color: 'emerald' }
                ].map((kpi, i) => (
                    <div key={i} className="flex items-center gap-6 p-4 bg-white/[0.02] border border-white/5 rounded-[2rem] shadow-xl group">
                        <div className={`flex-shrink-0 w-12 h-12 bg-${kpi.color}-500/5 border border-${kpi.color}-500/10 rounded-2xl flex items-center justify-center text-${kpi.color}-400 group-hover:scale-110 transition-transform`}>
                            <kpi.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-[11px] text-white/40 font-black uppercase tracking-widest italic block mb-1">{kpi.label}</span>
                            <p className="text-xl font-black text-white italic tracking-tighter leading-none">{kpi.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Labs Table / Cards */}
            <div className="bg-[#0f1133]/40 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                {isMobile ? (
                    <div className="p-4 space-y-4">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-4 animate-pulse">
                                    <div className="h-4 bg-white/5 w-1/2 rounded" />
                                    <div className="h-12 bg-white/5 w-full rounded-xl" />
                                </div>
                            ))
                        ) : filteredSamples.length === 0 ? (
                            <div className="py-20 text-center">
                                <Microscope className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                <p className="text-sm font-black uppercase tracking-widest text-slate-600 italic">No samples identified</p>
                            </div>
                        ) : filteredSamples.map((s) => (
                            <div key={s.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-5 shadow-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-teal-400 shadow-inner">
                                            <Droplet className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-white italic uppercase tracking-tight leading-none">{s.type}</p>
                                            <p className="text-[12px] text-slate-500 font-mono tracking-widest mt-1.5">{s.id}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(s.status)}`}>
                                        {s.status}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Subject</p>
                                        <p className="text-sm font-black text-white uppercase italic truncate">{s.subjectName}</p>
                                        <p className="text-[10px] text-slate-600 font-bold tracking-widest">{s.subjectId}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Result</p>
                                        <div className="flex items-end justify-end gap-1">
                                            <p className={`text-xl font-black italic tracking-tighter leading-none ${s.critical ? 'text-red-400 animate-pulse' : 'text-slate-100'}`}>{s.value}</p>
                                            <p className="text-[10px] text-slate-500 font-black uppercase mb-0.5">{s.unit}</p>
                                        </div>
                                        {s.critical && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1">CRITICAL HIGH</p>}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <p className="text-[10px] text-slate-600 font-black uppercase font-mono tracking-widest">DUE: {s.date}</p>
                                    <div className="flex items-center gap-2">
                                        {s.status === 'Resulted' && !s.isReleased && (
                                            <button onClick={() => handleRelease(s.id)} className="px-5 py-2 bg-teal-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-teal-900/40">Release</button>
                                        )}
                                        <button className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-500"><TrendingUp size={16} /></button>
                                        <button className="px-5 py-2 bg-white text-slate-900 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl">Review</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar-horizontal">
                        <table className="w-full text-left table-fixed min-w-[1000px]">
                    <colgroup>
                        <col className="w-[25%]" />
                        <col className="w-[15%]" />
                        <col className="w-[20%]" />
                        <col className="w-[20%]" />
                        <col className="w-[20%]" />
                    </colgroup>
                    <thead>
                        <tr className="bg-white/[0.02] border-b border-white/5">
                            <th className="px-6 py-4 text-[11px] font-black text-white/60 uppercase tracking-widest italic border-r border-white/5">Sample Track</th>
                            <th className="px-6 py-4 text-[11px] font-black text-white/60 uppercase tracking-widest italic border-r border-white/5">Clinical Subject</th>
                            <th className="px-6 py-4 text-[11px] font-black text-white/60 uppercase tracking-widest italic border-r border-white/5">Specimen Status</th>
                            <th className="px-6 py-4 text-[11px] font-black text-white/60 uppercase tracking-widest italic border-r border-white/5">Analysis Result</th>
                            <th className="px-6 py-4 text-[11px] font-black text-white/60 uppercase tracking-widest italic text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="py-20 text-center">
                                    <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 italic">Syncing Bio-Specimen Feed...</p>
                                </td>
                            </tr>
                        ) : filteredSamples.map((s) => (
                            <motion.tr key={s.id} layout className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-5 border-r border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-teal-400 group-hover:border-teal-500/40 transition-all">
                                            <Droplet className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-black text-white italic truncate tracking-tight uppercase leading-none">{s.type}</p>
                                            <p className="text-[11px] text-slate-500 font-mono tracking-widest mt-1">{s.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 border-r border-white/5">
                                    <p className="text-[13px] font-black text-white italic uppercase tracking-tighter leading-none">{s.subjectName}</p>
                                    <p className="text-[11px] text-slate-500 font-black tracking-widest mt-1 uppercase leading-none">{s.subjectId}</p>
                                </td>
                                <td className="px-6 py-5 border-r border-white/5">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-black uppercase tracking-widest ${getStatusStyle(s.status)}`}>
                                        <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
                                        {s.status}
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-black uppercase font-mono mt-2">DUE: {s.date}</p>
                                </td>
                                <td className="px-6 py-5 border-r border-white/5">
                                    <div className="flex items-end gap-1.5">
                                        <p className={`text-base font-black italic tracking-tighter leading-none ${s.critical ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>{s.value}</p>
                                        <p className="text-[11px] text-slate-500 font-black uppercase mb-0.5">{s.unit}</p>
                                    </div>
                                    {s.critical && <p className="text-[11px] font-black text-red-500 uppercase tracking-widest mt-1">CRITICAL HIGH</p>}
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2 transition-opacity">
                                        {s.status === 'Resulted' && !s.isReleased && (
                                            <button 
                                                onClick={() => handleRelease(s.id)}
                                                className="px-4 py-2 bg-teal-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white hover:text-teal-900 shadow-lg shadow-teal-600/20 transition-all"
                                            >
                                                Release <CheckCircle2 className="w-3 h-3" />
                                            </button>
                                        )}
                                        {s.isReleased && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[11px] font-black uppercase tracking-widest">
                                                Released <CheckCircle2 className="w-3 h-3" />
                                            </div>
                                        )}
                                        <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                                            <TrendingUp className="w-3.5 h-3.5" />
                                        </button>
                                        {(s.status === 'Resulted' || s.status === 'Alert') && (
                                            <button className="px-4 py-2 bg-white text-slate-950 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-[1.03] transition-all shadow-md">
                                                Review <ChevronRight className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
</motion.div>
);
}


