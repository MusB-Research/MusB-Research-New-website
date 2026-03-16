import React from 'react';
import { motion } from 'framer-motion';
import { 
    Database, 
    Share2, 
    Download, 
    RefreshCcw, 
    CheckCircle2, 
    AlertCircle, 
    FileJson, 
    FileText, 
    DatabaseZap,
    History
} from 'lucide-react';

export default function DataModule() {
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
                        Data <span className="text-indigo-400">& Exports</span>
                    </h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 italic">
                        Raw Clinical Dataset Extraction & Quality Monitoring
                    </p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-2 italic">
                         <History className="w-4 h-4" /> Export Logs
                    </button>
                    <button className="px-8 py-4 bg-indigo-500 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3 shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-all">
                        <RefreshCcw className="w-4 h-4" /> Trigger Global Sync
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Data Quality & Health */}
                <div className="lg:col-span-12">
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10 grid md:grid-cols-4 gap-10">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Database Integrity</p>
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white italic tracking-tighter">Healthy</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Synced 4m ago</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Missing Datapoints</p>
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                                    <AlertCircle className="w-6 h-6 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white italic tracking-tighter">0.42%</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Requires Cleanup</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Total Records</p>
                            <div className="flex items-center gap-4 font-black">
                                <p className="text-4xl text-white italic tracking-tighter">12,402</p>
                                <DatabaseZap className="w-5 h-5 text-indigo-500 opacity-40 ml-auto" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Schema Version</p>
                            <div className="flex items-center gap-4">
                                <p className="text-4xl text-slate-700 italic tracking-tighter uppercase transition-colors hover:text-indigo-400 cursor-help">v4.1.0-R</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Export Wizard */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10 space-y-8">
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                            <Download className="w-5 h-5 text-cyan-400" />
                            Extraction <span className="text-cyan-400">Wizard</span>
                        </h3>
                        
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { name: 'Full Study Dataset', size: '142.1 MB', icon: Database },
                                    { name: 'Participant Meta', size: '1.2 MB', icon: Share2 },
                                    { name: 'Safety AE Logs', size: '4.8 MB', icon: AlertCircle },
                                    { name: 'Lab Result Matrix', size: '88 MB', icon: FileText },
                                ].map((item, i) => (
                                    <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-[2.5rem] hover:border-indigo-500/30 transition-all cursor-pointer group">
                                        <item.icon className="w-8 h-8 text-slate-700 group-hover:text-indigo-400 transition-colors mb-4" />
                                        <p className="text-[10px] font-black text-white uppercase italic tracking-tight">{item.name}</p>
                                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">{item.size}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Export Format Configuration</p>
                                <div className="grid grid-cols-4 gap-3">
                                    {['CSV', 'JSON', 'SAS', 'CDISC'].map(format => (
                                        <button key={format} className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${format === 'CSV' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white/5 text-slate-500 border-white/10 hover:text-white'}`}>
                                            {format}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button className="w-full py-6 bg-white/5 border border-white/10 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-slate-950 transition-all flex items-center justify-center gap-4 italic group">
                                Start Secure Download Sequence <Share2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Integration Statuses */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-8">
                        <h4 className="text-sm font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                            <FileJson className="w-5 h-5 text-indigo-400" />
                            Active <span className="text-indigo-400">Pipes</span>
                        </h4>
                        <div className="space-y-6">
                             {[
                                { name: 'MongoDB Main Cluster', status: 'ONLINE', load: '12%', color: 'text-emerald-400' },
                                { name: 'AWS S3 File Storage', status: 'SYNCING', load: '44%', color: 'text-cyan-400' },
                                { name: 'Resend API Gateway', status: 'ONLINE', load: '2%', color: 'text-emerald-400' },
                                { name: 'ElasticSearch Index', status: 'OFFLINE', load: '0%', color: 'text-red-400' },
                             ].map((pipe, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
                                    <div>
                                        <p className="text-[10px] font-black text-white uppercase italic tracking-tight">{pipe.name}</p>
                                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">Load Balance: {pipe.load}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${pipe.status === 'ONLINE' ? 'bg-emerald-500' : pipe.status === 'SYNCING' ? 'bg-cyan-500 scale-125 animate-pulse' : 'bg-red-500'}`} />
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${pipe.color}`}>{pipe.status}</span>
                                    </div>
                                </div>
                             ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
