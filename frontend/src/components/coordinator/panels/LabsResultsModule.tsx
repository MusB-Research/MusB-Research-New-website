import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Beaker, 
    Search, 
    Filter, 
    Download, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    TrendingUp, 
    ChevronRight,
    Droplet,
    Microscope,
    FlaskConical,
    Activity,
    Bell
} from 'lucide-react';
import { API, authFetch } from '../../../utils/auth';

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

export default function LabResultsModule({ selectedStudyId }: { selectedStudyId?: string }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [samples, setSamples] = useState<LabSample[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const apiUrl = API || 'http://localhost:8000';

    React.useEffect(() => {
        const fetchLabs = async () => {
            setIsLoading(true);
            try {
                const res = await authFetch(`${apiUrl}/api/lab-results/`);
                if (res.ok) {
                    const data = await res.json();
                    const mapped: LabSample[] = data.map((l: any) => ({
                        id: l.id,
                        subjectId: l.participant_sid || 'ID_PENDING',
                        subjectName: l.participant_name || 'Participant Name',
                        type: l.test_name,
                        status: l.status.charAt(0) + l.status.slice(1).toLowerCase() as any,
                        value: l.value,
                        unit: l.units,
                        date: l.lab_date,
                        critical: l.is_critical,
                        isReleased: l.is_released
                    }));
                    setSamples(mapped);
                }
            } catch (err) {
                console.error("Failed to sync labs:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLabs();
    }, [apiUrl]);

    const filteredSamples = samples.filter(s => 
        s.type.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subjectId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Resulted': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'Processing': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'Shipped': return 'text-slate-400 bg-white/5 border-white/10';
            case 'Alert': return 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
            default: return 'text-slate-400 bg-white/5 border-white/10';
        }
    };
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

    const handleReview = (id: string) => {
        console.log("Reviewing sample:", id);
        // Navigate or open modal
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            {/* Header / Tactical Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tight">Health Check <span className="text-indigo-400">Reports</span></h2>
                    <p className="text-[11px] text-white/50 font-bold uppercase tracking-[0.4em] mt-3 md:mt-4 italic">Global Specimen Tracking & Bio-Analysis</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Sample ID / Subject Name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3.5 text-[12px] text-white font-bold outline-none focus:border-indigo-500/50 transition-all w-72 uppercase tracking-widest placeholder:text-slate-700 font-mono"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-[1.03] transition-all shadow-xl shadow-indigo-600/20">
                        Request Re-run <FlaskConical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-16">
                {[
                    { label: 'Total Samples', val: '1,422', icon: Microscope, color: 'indigo' },
                    { label: 'Processing', val: '86', icon: Activity, color: 'blue' },
                    { label: 'Abnormal Highs', val: '12', icon: Bell, color: 'red' },
                    { label: 'Turnaround Avg', val: '4.2 Days', icon: Clock, color: 'emerald' }
                ].map((kpi, i) => (
                    <div key={i} className="flex items-center gap-6 lg:gap-8 group">
                        <div className={`flex-shrink-0 w-16 h-16 bg-${kpi.color}-500/5 border border-${kpi.color}-500/10 rounded-2xl flex items-center justify-center text-${kpi.color}-400 group-hover:scale-110 transition-transform`}>
                            <kpi.icon className="w-8 h-8" />
                        </div>
                        <div>
                            <span className="text-[11px] text-white/40 font-black uppercase tracking-widest italic block mb-1">{kpi.label}</span>
                            <p className="text-2xl lg:text-3xl font-black text-white italic tracking-tighter leading-none">{kpi.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Labs Table */}
            <div className="overflow-x-auto custom-scrollbar-horizontal">
                <table className="w-full text-left table-fixed min-w-[1000px] border-t border-white/5">
                    <colgroup>
                        <col className="w-[25%]" />
                        <col className="w-[15%]" />
                        <col className="w-[20%]" />
                        <col className="w-[20%]" />
                        <col className="w-[20%]" />
                    </colgroup>
                    <thead>
                        <tr className="bg-white/[0.02] border-b border-white/5">
                            <th className="px-10 py-8 text-[12px] font-black text-white/80 uppercase tracking-widest italic border-r border-white/5">Sample Track</th>
                            <th className="px-10 py-8 text-[12px] font-black text-white/80 uppercase tracking-widest italic border-r border-white/5">Clinical Subject</th>
                            <th className="px-10 py-8 text-[12px] font-black text-white/80 uppercase tracking-widest italic border-r border-white/5">Specimen Status</th>
                            <th className="px-10 py-8 text-[12px] font-black text-white/80 uppercase tracking-widest italic border-r border-white/5">Analysis Result</th>
                            <th className="px-10 py-8 text-[12px] font-black text-white/80 uppercase tracking-widest italic text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="py-20 text-center">
                                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Syncing Bio-Specimen Feed...</p>
                                </td>
                            </tr>
                        ) : filteredSamples.map((s) => (
                            <motion.tr key={s.id} layout className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-10 py-10 border-r border-white/5">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/40 transition-all shadow-lg shadow-black/20">
                                            <Droplet className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-white italic truncate tracking-tight uppercase leading-none">{s.type}</p>
                                            <p className="text-[12px] text-slate-500 font-mono tracking-widest mt-1.5">{s.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-10 border-r border-white/5">
                                    <p className="text-base font-black text-white italic uppercase tracking-tighter leading-none">{s.subjectName}</p>
                                    <p className="text-[12px] text-slate-500 font-black tracking-widest mt-1.5 uppercase leading-none">{s.subjectId}</p>
                                </td>
                                <td className="px-10 py-10 border-r border-white/5">
                                    <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-xl border text-[12px] font-black uppercase tracking-widest shadow-lg ${getStatusStyle(s.status)}`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_10px_currentColor] animate-pulse" />
                                        {s.status}
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-black uppercase font-mono mt-3">DUE: {s.date}</p>
                                </td>
                                <td className="px-10 py-10 border-r border-white/5">
                                    <div className="flex items-end gap-2">
                                        <p className={`text-2xl font-black italic tracking-tighter leading-none ${s.critical ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>{s.value}</p>
                                        <p className="text-[11px] text-slate-500 font-black uppercase mb-0.5">{s.unit}</p>
                                    </div>
                                    {s.critical && <p className="text-[11px] font-black text-red-500 uppercase tracking-widest mt-1.5 shrink-0">CRITICAL HIGH</p>}
                                </td>
                                <td className="px-10 py-10 text-right">
                                    <div className="flex items-center justify-end gap-3 transition-opacity">
                                        {s.status === 'Resulted' && !s.isReleased && (
                                            <button 
                                                onClick={() => handleRelease(s.id)}
                                                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-white hover:text-indigo-900 shadow-xl shadow-indigo-600/30 transition-all"
                                            >
                                                Release <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        {s.isReleased && (
                                            <div className="flex items-center gap-3 px-8 py-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl text-[12px] font-black uppercase tracking-widest">
                                                Released <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                        )}
                                        <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-lg">
                                            <TrendingUp className="w-4 h-4" />
                                        </button>
                                        {(s.status === 'Resulted' || s.status === 'Alert') && (
                                            <button 
                                                onClick={() => handleReview(s.id)}
                                                className="px-8 py-4 bg-white text-slate-950 rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-[1.03] transition-all shadow-lg"
                                            >
                                                Review <ChevronRight className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}


