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
}

export default function LabsResultsModule() {
    const [searchQuery, setSearchQuery] = useState('');
    const samples: LabSample[] = [
        { id: 'LAB-291', subjectId: 'SUB-001', subjectName: 'Alice Johnson', type: 'CBC-Metabolic', status: 'Resulted', value: '14.2', unit: 'g/dL', date: '2026-03-20', critical: false },
        { id: 'LAB-292', subjectId: 'SUB-002', subjectName: 'Bob Smith', type: 'Lipid Profile', status: 'Alert', value: '245', unit: 'mg/dL', date: '2026-03-21', critical: true },
        { id: 'LAB-293', subjectId: 'SUB-003', subjectName: 'Charlie Davis', type: 'Clinical Chemistry', status: 'Processing', value: '--', unit: '--', date: '2026-03-19', critical: false },
        { id: 'LAB-294', subjectId: 'SUB-005', subjectName: 'Edward Norton', type: 'Inflammatory Markers', status: 'Shipped', value: '--', unit: '--', date: '2026-03-21', critical: false },
    ];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Resulted': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'Processing': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'Shipped': return 'text-slate-400 bg-white/5 border-white/10';
            case 'Alert': return 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
            default: return 'text-slate-400 bg-white/5 border-white/10';
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            {/* Header / Tactical Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Labs & <span className="text-indigo-400">Results</span></h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 italic">Global Specimen Tracking & Bio-Analysis</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Sample ID / Subject Name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3.5 text-xs text-white font-bold outline-none focus:border-indigo-500/50 transition-all w-72 uppercase tracking-widest placeholder:text-slate-700 font-mono"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.03] transition-all shadow-xl shadow-indigo-600/20">
                        Request Re-run <FlaskConical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Samples', val: '1,422', icon: Microscope, color: 'indigo' },
                    { label: 'Processing', val: '86', icon: Activity, color: 'blue' },
                    { label: 'Abnormal Highs', val: '12', icon: Bell, color: 'red' },
                    { label: 'Turnaround Avg', val: '4.2 Days', icon: Clock, color: 'emerald' }
                ].map((kpi, i) => (
                    <div key={i} className="bg-[#0B101B]/40 border border-white/5 rounded-[2rem] p-8 space-y-4 hover:border-indigo-500/20 transition-all group overflow-hidden relative">
                        <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:scale-125 transition-transform">
                            <kpi.icon className="w-16 h-16" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 bg-${kpi.color}-500/10 rounded-xl border border-${kpi.color}-500/20 text-${kpi.color}-400`}>
                                <kpi.icon className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{kpi.label}</span>
                        </div>
                        <p className="text-3xl font-black text-white italic tracking-tighter">{kpi.val}</p>
                    </div>
                ))}
            </div>

            {/* Labs Table */}
            <div className="bg-[#0B101B]/40 border border-white/5 rounded-[3rem] overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                            <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Sample Track</th>
                            <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Clinical Subject</th>
                            <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Specimen Status</th>
                            <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Analysis Result</th>
                            <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest italic text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {samples.map((s) => (
                            <motion.tr key={s.id} layout className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-10 py-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 group-hover:border-indigo-500/40 transition-colors">
                                            <Droplet className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white italic truncate tracking-tight">{s.type}</p>
                                            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">{s.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8">
                                    <p className="text-sm font-black text-white italic">{s.subjectName}</p>
                                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{s.subjectId}</p>
                                </td>
                                <td className="px-10 py-8">
                                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusStyle(s.status)}`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_10px_currentColor]" />
                                        {s.status}
                                    </div>
                                    <p className="text-[9px] text-slate-700 font-medium uppercase font-mono ml-4 mt-2">DUE: {s.date}</p>
                                </td>
                                <td className="px-10 py-8">
                                    <div className="flex items-end gap-2">
                                        <p className={`text-2xl font-black italic tracking-tighter ${s.critical ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>{s.value}</p>
                                        <p className="text-[10px] text-slate-600 font-black uppercase mb-1.5">{s.unit}</p>
                                    </div>
                                    {s.critical && <p className="text-[8px] font-black text-red-500 uppercase tracking-[0.2em] mt-1 shrink-0">Critical High</p>}
                                </td>
                                <td className="px-10 py-8">
                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"><TrendingUp className="w-4 h-4" /></button>
                                        <button className="px-6 py-2.5 bg-white text-slate-950 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-[1.03] transition-all">Review <ChevronRight className="w-4 h-4" /></button>
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
