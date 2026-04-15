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

export default function LabsResultsModule({ selectedStudyId }: { selectedStudyId?: string }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [samples, setSamples] = useState<LabSample[]>([]);
    const [loading, setLoading] = useState(true);
    const apiUrl = API || '';

    useEffect(() => {
        const fetchLabs = async () => {
            try {
                setLoading(true);
                const query = selectedStudyId && selectedStudyId !== 'all' ? `?study=${selectedStudyId}` : '';
                const res = await authFetch(`${apiUrl}/api/lab-results/${query}`);
                if (res.ok) {
                    const data = await res.json();
                    const mapped = data.map((l: any) => ({
                        id: l.id,
                        subjectId: l.participant_sid || 'SUB-001',
                        subjectName: l.participant_name || 'Anonymous',
                        type: l.test_name,
                        status: l.status,
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
                setLoading(false);
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
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subjectName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            {/* Header / Tactical Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h2 className="text-lg font-black text-white italic uppercase tracking-tight">Health Check <span className="text-teal-400">Reports</span></h2>
                    <p className="text-[11px] text-white/40 font-bold uppercase tracking-[0.3em] mt-1 italic">Global Specimen Tracking & Bio-Analysis</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Sample ID / Subject Name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3.5 text-sm text-white font-bold outline-none focus:border-teal-500/50 transition-all w-72 uppercase tracking-widest placeholder:text-slate-700 font-mono"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3.5 bg-teal-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:scale-[1.03] transition-all shadow-xl shadow-teal-600/20">
                        Request Re-run <FlaskConical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Samples', val: samples.length.toString(), icon: Microscope, color: 'indigo' },
                    { label: 'Processing', val: samples.filter(s => s.status === 'Processing').length.toString(), icon: Activity, color: 'blue' },
                    { label: 'Abnormal Highs', val: samples.filter(s => s.status === 'Alert').length.toString(), icon: Bell, color: 'red' },
                    { label: 'Turnaround Avg', val: '4.2 Days', icon: Clock, color: 'emerald' }
                ].map((kpi, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                        <div className={`flex-shrink-0 w-10 h-10 bg-${kpi.color}-500/5 border border-${kpi.color}-500/10 rounded-xl flex items-center justify-center text-${kpi.color}-400 group-hover:scale-110 transition-transform`}>
                            <kpi.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] text-white/40 font-black uppercase tracking-widest italic block mb-0.5">{kpi.label}</span>
                            <p className="text-lg font-black text-white italic tracking-tighter leading-none">{kpi.val}</p>
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
                            <th className="px-6 py-4 text-[11px] font-black text-white/60 uppercase tracking-widest italic border-r border-white/5">Sample Track</th>
                            <th className="px-6 py-4 text-[11px] font-black text-white/60 uppercase tracking-widest italic border-r border-white/5">Clinical Subject</th>
                            <th className="px-6 py-4 text-[11px] font-black text-white/60 uppercase tracking-widest italic border-r border-white/5">Specimen Status</th>
                            <th className="px-6 py-4 text-[11px] font-black text-white/60 uppercase tracking-widest italic border-r border-white/5">Analysis Result</th>
                            <th className="px-6 py-4 text-[11px] font-black text-white/60 uppercase tracking-widest italic text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
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
        </motion.div>
    );
}


