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
    Bell,
    X,
    FileText,
    ArrowLeft
} from 'lucide-react';
import { API, authFetch } from '../../../utils/auth';
import { SkeletonLoader } from '../../shared/SkeletonLoader';

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
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSample, setSelectedSample] = useState<LabSample | null>(null);
    const [isReRunning, setIsReRunning] = useState(false);
    
    const apiUrl = API || 'http://localhost:8000';

    React.useEffect(() => {
        const fetchLabs = async () => {
            setIsLoading(true);
            try {
                let url = `${apiUrl}/api/lab-results/`;
                if (selectedStudyId && selectedStudyId !== 'all') {
                    url += `?study_id=${selectedStudyId}`;
                }
                
                const res = await authFetch(url);
                if (res.ok) {
                    const data = await res.json();
                    const labList = Array.isArray(data) ? data : (data.results || []);
                    const mapped: LabSample[] = labList.map((l: any) => ({
                        id: l.id || l._id,
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
                console.log("Labs sync complete.");
            }
        };
        fetchLabs();
    }, [apiUrl, selectedStudyId]);

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
        console.log("Releasing lab:", id);
        try {
            const res = await authFetch(`${apiUrl}/api/lab-results/${id}/release/`, {
                method: 'POST'
            });
            if (res.ok) {
                setSamples(prev => prev.map(s => s.id === id ? { ...s, isReleased: true } : s));
                if (selectedSample?.id === id) {
                    setSelectedSample(prev => prev ? { ...prev, isReleased: true } : null);
                }
            }
        } catch (err) {
            console.error("Release failed:", err);
        }
    };

    const handleRequestReRun = () => {
        setIsReRunning(true);
        setTimeout(() => setIsReRunning(false), 2000);
    };

    if (selectedSample) {
        return (
            <motion.div key="lab-detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10 relative z-10">
                <div className="flex items-center justify-between">
                    <button 
                        onClick={() => setSelectedSample(null)}
                        className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[12px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-all cursor-pointer"
                    >
                        <ArrowLeft size={16} /> Dashboard
                    </button>
                    <div className="flex items-center gap-4">
                        {!selectedSample.isReleased && selectedSample.status === 'Resulted' && (
                            <button 
                                onClick={() => handleRelease(selectedSample.id)}
                                className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all cursor-pointer"
                            >
                                Release Results <CheckCircle2 size={16} />
                            </button>
                        )}
                        <button className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[12px] font-black text-white uppercase tracking-widest transition-all cursor-pointer">
                            Export PDF <Download size={16} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                    <div className="xl:col-span-2 space-y-10">
                        <div className="bg-[#0B101B]/50 border border-white/5 rounded-[3rem] p-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] -mr-32 -mt-32" />
                            
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                                <div>
                                    <p className="text-[11px] text-blue-400 font-black uppercase tracking-[0.4em] mb-4 italic">Analysis Dossier</p>
                                    <h2 className="text-2xl md:text-4xl font-black text-white italic truncate tracking-tight uppercase mb-2">{selectedSample.type}</h2>
                                    <p className="text-sm text-slate-500 font-mono tracking-widest uppercase">Batch ID: {selectedSample.id}</p>
                                </div>
                                <div className={`inline-flex px-6 py-3 rounded-2xl border text-[12px] font-black uppercase tracking-widest self-start ${getStatusStyle(selectedSample.status)}`}>
                                    {selectedSample.status}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16 pt-12 border-t border-white/5 relative z-10">
                                <div>
                                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest mb-6">Subject Information</p>
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <Activity size={28} />
                                        </div>
                                        <div>
                                            <p className="text-xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">{selectedSample.subjectName}</p>
                                            <p className="text-[12px] text-slate-500 font-black tracking-widest uppercase">{selectedSample.subjectId}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest mb-6">Result Metrics</p>
                                    <div className="flex items-end gap-3">
                                        <p className={`text-5xl font-black italic tracking-tighter leading-none ${selectedSample.critical ? 'text-red-400' : 'text-slate-100'}`}>
                                            {selectedSample.value}
                                        </p>
                                        <p className="text-lg text-slate-500 font-black uppercase mb-1">{selectedSample.unit}</p>
                                    </div>
                                    {selectedSample.critical && (
                                        <div className="mt-4 flex items-center gap-2 text-red-500">
                                            <AlertCircle size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Out of Clinical Range</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="bg-[#0B101B]/50 border border-white/5 rounded-[2.5rem] p-10">
                                <h4 className="text-[11px] text-white/50 font-black uppercase tracking-widest mb-8 flex items-center gap-3">
                                    <Clock size={14} className="text-blue-400" /> Lab Timeline
                                </h4>
                                <div className="space-y-8 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                                    <div className="relative pl-8">
                                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-[#0B101B]" />
                                        <p className="text-[12px] font-black text-white uppercase italic">Sample Collected</p>
                                        <p className="text-[10px] text-slate-500 font-mono mt-1">{selectedSample.date}</p>
                                    </div>
                                    <div className="relative pl-8">
                                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-[#0B101B]" />
                                        <p className="text-[12px] font-black text-white uppercase italic">Processed by Lab</p>
                                        <p className="text-[10px] text-slate-500 font-mono mt-1">24 Hours from Collection</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#0B101B]/50 border border-white/5 rounded-[2.5rem] p-10">
                                <h4 className="text-[11px] text-white/50 font-black uppercase tracking-widest mb-8 flex items-center gap-3">
                                    <FileText size={14} className="text-blue-400" /> Clinical Notes
                                </h4>
                                <p className="text-sm text-slate-400 leading-relaxed italic">
                                    Standard analysis performed. All quality control checks passed successfully. No anomalies detected in specimen handling.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-10">
                        <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer">
                            <div className="absolute -right-4 -bottom-4 opacity-20 transition-transform group-hover:scale-110">
                                <TrendingUp size={120} />
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8">Bio-Stats</h4>
                            <p className="text-sm font-bold opacity-80 mb-2">Subject Trend</p>
                            <p className="text-2xl font-black italic tracking-tighter">+12% vs Baseline</p>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8">
                            <h4 className="text-[11px] text-white/40 font-black uppercase tracking-widest mb-8">Verification Log</h4>
                            <div className="space-y-6">
                                {[
                                    { msg: 'System Validated', time: '10:42 AM', ok: true },
                                    { msg: 'Lab Tech Signed', time: '11:15 AM', ok: true },
                                    { msg: 'Release Pending', time: 'Now', ok: false }
                                ].map((log, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1.5 h-1.5 rounded-full ${log.ok ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{log.msg}</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-600">{log.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div key="lab-list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 relative z-10">
            {/* Header / Tactical Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tight">Health Check <span className="text-blue-400">Reports</span></h2>
                    <p className="text-[11px] text-white/50 font-bold uppercase tracking-[0.4em] mt-3 md:mt-4 italic">Global Specimen Tracking & Bio-Analysis</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative h-[52px] pointer-events-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Sample ID / Subject Name..."
                            value={searchQuery}
                            onChange={(e) => {
                                console.log("Search updated:", e.target.value);
                                setSearchQuery(e.target.value);
                            }}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 h-full text-[12px] text-white font-bold outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all w-80 uppercase tracking-widest placeholder:text-slate-700 font-mono cursor-text"
                        />
                    </div>
                    <button 
                        onClick={handleRequestReRun}
                        className={`flex items-center gap-2 px-8 h-[52px] ${isReRunning ? 'bg-blue-500/50' : 'bg-blue-600'} text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-[1.03] transition-all shadow-xl shadow-blue-600/20 whitespace-nowrap cursor-pointer`}
                    >
                        {isReRunning ? 'Processing...' : 'Request Re-run'} <FlaskConical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-16">
                {[
                    { 
                        label: 'Total Samples', 
                        val: samples.length.toLocaleString(), 
                        icon: Microscope, 
                        color: 'blue' 
                    },
                    { 
                        label: 'Processing', 
                        val: samples.filter(s => s.status === 'Processing' || s.status === 'Shipped').length.toString(), 
                        icon: Activity, 
                        color: 'blue' 
                    },
                    { 
                        label: 'Abnormal Highs', 
                        val: samples.filter(s => s.critical).length.toString(), 
                        icon: Bell, 
                        color: 'red' 
                    },
                    { 
                        label: 'Turnaround Avg', 
                        val: samples.length > 0 ? '3.8 Days' : '0.0 Days', 
                        icon: Clock, 
                        color: 'emerald' 
                    }
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
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td className="px-10 py-10 border-r border-white/5"><div className="h-4 bg-white/5 rounded w-3/4 animate-pulse" /></td>
                                    <td className="px-10 py-10 border-r border-white/5"><div className="h-4 bg-white/5 rounded w-1/2 animate-pulse" /></td>
                                    <td className="px-10 py-10 border-r border-white/5"><div className="h-10 bg-white/5 rounded w-32 animate-pulse" /></td>
                                    <td className="px-10 py-10 border-r border-white/5"><div className="h-4 bg-white/5 rounded w-1/4 animate-pulse" /></td>
                                    <td className="px-10 py-10 text-right"><div className="h-10 bg-white/5 rounded w-24 ml-auto animate-pulse" /></td>
                                </tr>
                            ))
                        ) : filteredSamples.map((s) => (
                            <motion.tr key={s.id} layout className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-10 py-10 border-r border-white/5">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-blue-400 group-hover:border-blue-500/40 transition-all shadow-lg shadow-black/20">
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
                                                className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-white hover:text-blue-900 shadow-xl shadow-blue-600/30 transition-all cursor-pointer"
                                            >
                                                Release <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        {s.isReleased && (
                                            <div className="flex items-center gap-3 px-8 py-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl text-[12px] font-black uppercase tracking-widest">
                                                Released <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                        )}
                                        <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-lg cursor-pointer">
                                            <TrendingUp className="w-4 h-4" />
                                        </button>
                                        {(s.status === 'Resulted' || s.status === 'Alert') && (
                                            <button 
                                                onClick={() => {
                                                    console.log("Setting selected sample:", s.id);
                                                    setSelectedSample(s);
                                                }}
                                                className="px-8 py-4 bg-white text-slate-950 rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-[1.03] transition-all shadow-lg cursor-pointer"
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
