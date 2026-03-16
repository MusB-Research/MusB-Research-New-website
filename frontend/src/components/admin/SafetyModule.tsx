import React from 'react';
import { motion } from 'framer-motion';
import { 
    ShieldAlert, 
    AlertCircle, 
    ChevronRight, 
    FileWarning, 
    Activity, 
    MessageSquare,
    Clock,
    Search,
    Filter,
    Plus,
    BellOff
} from 'lucide-react';

export default function SafetyModule() {
    const safetyEvents = [
        { id: 'AE-001', participant: 'Marcus Thompson', event: 'Severe Nausea', severity: 'HIGH', status: 'OPEN', date: '2026-03-14 09:20' },
        { id: 'SAE-201', participant: 'Elena Rodriguez', event: 'Hospitalization - Fever', severity: 'CRITICAL', status: 'INVESTIGATING', date: '2026-03-15 02:45' },
        { id: 'AE-002', participant: 'Sarah Miller', event: 'Mild Fatigue', severity: 'LOW', status: 'RESOLVED', date: '2026-03-12 14:10' },
        { id: 'SAE-202', participant: 'David Cho', event: 'Unexpected Rash', severity: 'MEDIUM', status: 'OPEN', date: '2026-03-15 11:30' },
    ];

    const getSeverityColor = (sev: string) => {
        switch (sev) {
            case 'CRITICAL': return 'bg-red-500/20 text-red-500 border-red-500/30';
            case 'HIGH': return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
            case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
            default: return 'bg-white/5 text-slate-400 border-white/10';
        }
    };

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
                        Safety <span className="text-red-500">& Alert</span>
                    </h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 italic">
                        Pharmacovigilance & Adverse Event Monitoring
                    </p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-2 italic">
                         <BellOff className="w-4 h-4" /> Mute Alerts
                    </button>
                    <button className="px-8 py-4 bg-red-500 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3 shadow-xl shadow-red-500/20 hover:scale-[1.02] transition-all">
                        <FileWarning className="w-4 h-4" /> Log SAE (CRITICAL)
                    </button>
                </div>
            </div>

            {/* Safety Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Critical SAEs', val: '01', icon: ShieldAlert, color: 'text-red-500' },
                    { label: 'Open AEs', val: '04', icon: Activity, color: 'text-orange-500' },
                    { label: 'Avg Closure Time', val: '4.2h', icon: Clock, color: 'text-cyan-500' },
                    { label: 'Pending Reviews', val: '02', icon: MessageSquare, color: 'text-indigo-500' },
                ].map(stat => (
                    <div key={stat.label} className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 space-y-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{stat.label}</p>
                        <div className="flex items-center justify-between">
                            <p className="text-3xl font-black text-white italic tracking-tighter leading-none">{stat.val}</p>
                            <stat.icon className={`w-6 h-6 ${stat.color} opacity-40`} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Event Feed */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10">
                        <div className="flex items-center justify-between mb-8">
                             <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">
                                Active <span className="text-red-500">Events</span>
                             </h3>
                             <div className="flex gap-3">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                    <input type="text" placeholder="Search events..." className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-[10px] text-white outline-none focus:border-red-500/50 transition-all w-48 font-bold uppercase tracking-widest"/>
                                </div>
                                <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-500"><Filter className="w-4 h-4" /></button>
                             </div>
                        </div>

                        <div className="space-y-4">
                            {safetyEvents.map((event, i) => (
                                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-white/5 border border-white/5 rounded-[2.5rem] hover:border-red-500/20 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${getSeverityColor(event.severity)}`}>
                                            <AlertCircle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">{event.id}</span>
                                                <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border border-white/5 ${
                                                    event.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-slate-400'
                                                }`}>
                                                    {event.status}
                                                </span>
                                            </div>
                                            <h4 className="text-lg font-black text-white italic uppercase tracking-tight mt-1 group-hover:text-red-400 transition-colors">{event.event}</h4>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Subject: {event.participant}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 pl-16 md:pl-0">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-white italic uppercase">{event.date}</p>
                                            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-1">System Log Time</p>
                                        </div>
                                        <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-500 group-hover:text-white group-hover:border-white/20 transition-all">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Safety Hotline/Resources */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-8">
                        <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">Emergency <span className="text-red-500">Registry</span></h4>
                        <div className="space-y-6">
                            <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl space-y-4">
                                <p className="text-[11px] font-black text-red-400 uppercase italic tracking-tight">On-Call Medical Monitor</p>
                                <div className="space-y-2">
                                    <p className="text-lg font-black text-white italic">+1 (888) 902-SAFE</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Global 24/7 Response Line</p>
                                </div>
                                <button className="w-full py-3 bg-red-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all">Initiate Protocol Call</button>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Safety Guidelines</p>
                                <div className="space-y-2">
                                    {['SAE Reporting Window', 'MedDRA Coding Guide', 'Case Resolution SLA'].map(item => (
                                        <button key={item} className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-all group">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-white">{item}</span>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
