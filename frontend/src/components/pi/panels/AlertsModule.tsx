import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bell, 
    AlertCircle, 
    AlertTriangle, 
    Info, 
    Search, 
    Filter, 
    Clock, 
    CheckCircle2, 
    X, 
    ChevronRight, 
    Activity, 
    ShieldAlert,
    Trash2,
    Calendar,
    MessageSquare,
    ClipboardList
} from 'lucide-react';

interface AlertItem {
    id: string;
    title: string;
    description: string;
    severity: 'Critical' | 'Warning' | 'Info';
    category: 'Clinical' | 'Operational' | 'Safety' | 'System';
    timestamp: string;
    read: boolean;
}

export default function AlertsModule() {
    const [activeSeverity, setActiveSeverity] = useState<'All' | 'Critical' | 'Warning' | 'Info'>('All');
    const [searchQuery, setSearchQuery] = useState('');

    const alerts: AlertItem[] = [
        { id: 'AL-001', title: 'SAE Reported: SUB-023', description: 'Severe GI distress reported during V4. Immediate PI review required.', severity: 'Critical', category: 'Safety', timestamp: '2026-03-21 14:22', read: false },
        { id: 'AL-002', title: 'Kit Shipment Delayed', description: 'Pharmacy Manual kit #1292 is delayed due to logistics. Impact: V5 scheduling.', severity: 'Warning', category: 'Operational', timestamp: '2026-03-21 11:05', read: false },
        { id: 'AL-003', title: 'Consent Version Update', description: 'New Protocol v3.3 requires re-consent for all Cohort Alpha subjects.', severity: 'Info', category: 'Clinical', timestamp: '2026-03-20 09:44', read: true },
        { id: 'AL-004', title: 'Screen Fail Detected: SUB-102', description: 'Inclusion Criteria #4 failure (BMI out of range).', severity: 'Info', category: 'Clinical', timestamp: '2026-03-20 08:12', read: true },
        { id: 'AL-005', title: 'System Maintenance', description: 'Platform will be offline for 30 mins tonight at 02:00 UTC.', severity: 'Info', category: 'System', timestamp: '2026-03-19 16:00', read: false },
    ];

    const filteredAlerts = alerts.filter(a => {
        const matchesSeverity = activeSeverity === 'All' || a.severity === activeSeverity;
        const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             a.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSeverity && matchesSearch;
    });

    const getSeverityStyle = (severity: string) => {
        switch (severity) {
            case 'Critical': return 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]';
            case 'Warning': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'Info': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
            default: return 'text-slate-400 bg-white/5 border-white/10';
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Alert <span className="text-indigo-400">Intelligence</span></h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 italic">Priority Notifications & Clinical Triggers</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="px-6 py-3.5 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">
                        Mark All as Read
                    </button>
                    <button className="px-6 py-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                        Archive Historical
                    </button>
                </div>
            </div>

            {/* Tactical Grid Overlay */}
            <div className="bg-[#0B101B]/40 border border-white/5 rounded-[3rem] p-4 lg:p-10 space-y-10 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
                    <Bell className="w-64 h-64 text-indigo-400" />
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex gap-2">
                        {['All', 'Critical', 'Warning', 'Info'].map((s: any) => (
                            <button
                                key={s}
                                onClick={() => setActiveSeverity(s)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeSeverity === s ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search Alerts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-sm text-white font-bold outline-none focus:border-indigo-500/50 transition-all w-64 uppercase tracking-widest font-mono"
                        />
                    </div>
                </div>

                {/* Alerts List */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredAlerts.map((alert) => (
                            <motion.div 
                                key={alert.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className={`p-8 rounded-[2rem] border transition-all hover:bg-white/[0.02] grid grid-cols-1 lg:grid-cols-4 gap-8 group ${
                                    !alert.read ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5'
                                }`}
                            >
                                <div className="lg:col-span-1 flex items-center gap-6">
                                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-110 ${getSeverityStyle(alert.severity)}`}>
                                        {alert.severity === 'Critical' ? <ShieldAlert className="w-7 h-7" /> : <Bell className="w-7 h-7" />}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${!alert.read ? 'bg-indigo-500 animate-ping' : 'bg-transparent'}`} />
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">{alert.timestamp}</p>
                                        </div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 opacity-60">{alert.category}</p>
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-2">
                                    <h4 className={`text-xl font-black italic uppercase tracking-tighter ${alert.severity === 'Critical' ? 'text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-white'}`}>{alert.title}</h4>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-tight italic leading-relaxed">{alert.description}</p>
                                </div>

                                <div className="lg:col-span-1 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="px-5 py-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all font-black text-[9px] uppercase tracking-widest">Mark as Read</button>
                                    <button className="px-5 py-2.5 bg-white text-slate-950 rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-[1.05] transition-all flex items-center gap-2">Resolve <ChevronRight className="w-3.5 h-3.5" /></button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
