import React from 'react';
import { motion } from 'framer-motion';
import { 
    FileBarChart, 
    TrendingUp, 
    PieChart, 
    Calendar, 
    Download, 
    ChevronRight, 
    Activity,
    Users,
    Settings,
    Clock
} from 'lucide-react';

export default function ReportsModule() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                        Analytical <span className="text-cyan-400">Reports</span>
                    </h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 italic">
                        Scientific Insights & Protocol Compliance Metadata
                    </p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-2 italic">
                         <Calendar className="w-4 h-4" /> Schedule Auto-Report
                    </button>
                    <button className="px-8 py-4 bg-cyan-500 text-slate-950 rounded-[2rem] text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3 shadow-xl shadow-cyan-500/20 hover:scale-[1.02] transition-all">
                        <FileBarChart className="w-4 h-4" /> Run New Analysis
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Visual Analytics */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                                <TrendingUp className="w-5 h-5 text-cyan-400" />
                                Recruitment <span className="text-cyan-400">Velocity</span>
                            </h3>
                            <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black text-white uppercase tracking-widest outline-none">
                                <option>Last 30 Days</option>
                                <option>Last 6 Months</option>
                                <option>Year to Date</option>
                            </select>
                        </div>

                        {/* Mock Chart Area */}
                        <div className="h-64 flex items-end justify-between gap-2 px-4 relative group">
                            {[45, 60, 52, 78, 85, 65, 92, 110, 88, 75, 95, 120].map((h, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    className="flex-1 bg-gradient-to-t from-cyan-500/20 to-cyan-500/60 rounded-t-lg relative group/bar"
                                >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-950 px-2 py-1 rounded text-[8px] font-black opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                                        {h} Hits
                                    </div>
                                </motion.div>
                            ))}
                            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/10" />
                        </div>
                        <div className="flex justify-between mt-6 px-4">
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                                <span key={m} className="text-[9px] font-black text-slate-700 uppercase">{m}</span>
                            ))}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 space-y-6">
                            <h4 className="text-xs font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                <PieChart className="w-4 h-4 text-indigo-400" /> Compliance Mix
                            </h4>
                            <div className="flex items-center gap-8">
                                <div className="w-32 h-32 rounded-full border-[10px] border-indigo-500/20 border-t-indigo-500 flex items-center justify-center relative">
                                     <span className="text-xl font-black text-white italic">84%</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500" /> <span className="text-[9px] font-black text-slate-400 uppercase">On Time</span></div>
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500/40" /> <span className="text-[9px] font-black text-slate-400 uppercase">Delayed</span></div>
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white/5" /> <span className="text-[9px] font-black text-slate-400 uppercase">Missing</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 space-y-6">
                             <h4 className="text-xs font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                <Users className="w-4 h-4 text-emerald-400" /> Diversity Ratio
                            </h4>
                             <div className="space-y-4">
                                {[
                                    { label: 'Ethnic Minorities', val: 42 },
                                    { label: 'Female Subjects', val: 56 },
                                    { label: 'Rural Connectivity', val: 18 },
                                ].map(row => (
                                    <div key={row.label} className="space-y-2">
                                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                                            <span className="text-slate-500">{row.label}</span>
                                            <span className="text-white">{row.val}%</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: `${row.val}%` }} />
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>

                {/* Report Library */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-8">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">Generated <span className="text-indigo-400">Library</span></h4>
                            <button className="text-slate-500 hover:text-white transition-colors"><Settings className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-4">
                            {[
                                { name: 'Q1 Compliance Digest', date: '2 days ago', type: 'PDF' },
                                { name: 'Diversity Audit - V2', date: '5 days ago', type: 'XLSX' },
                                { name: 'SAE Summary Monthly', date: 'Mar 01', type: 'PDF' },
                                { name: 'Participant Flowchart', date: 'Feb 28', type: 'SVG' },
                            ].map((report, i) => (
                                <div key={i} className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-[2rem] hover:border-indigo-500/30 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:text-indigo-400 transition-colors">
                                            <Download className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white italic uppercase">{report.name}</p>
                                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">{report.date} • {report.type}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-800" />
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-white hover:text-slate-950 transition-all italic flex items-center justify-center gap-3">
                            <Clock className="w-4 h-4" /> View Full Archive
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
