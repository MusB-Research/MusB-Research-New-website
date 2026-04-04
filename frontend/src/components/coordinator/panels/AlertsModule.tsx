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

export default function AlertsModule({ selectedStudyId }: { selectedStudyId?: string }) {
    const [activeSeverity, setActiveSeverity] = useState<'All' | 'Critical' | 'Warning' | 'Info'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [alerts, setAlerts] = useState<AlertItem[]>([
        { id: 'AL-001', title: 'SAE Reported: SUB-023', description: 'Severe GI distress reported during V4. Immediate PI review required.', severity: 'Critical', category: 'Safety', timestamp: '2026-03-21 14:22', read: false },
        { id: 'AL-002', title: 'Kit Shipment Delayed', description: 'Pharmacy Manual kit #1292 is delayed due to logistics. Impact: V5 scheduling.', severity: 'Warning', category: 'Operational', timestamp: '2026-03-21 11:05', read: false },
        { id: 'AL-003', title: 'Consent Version Update', description: 'New Protocol v3.3 requires re-consent for all Cohort Alpha subjects.', severity: 'Info', category: 'Clinical', timestamp: '2026-03-20 09:44', read: true },
        { id: 'AL-004', title: 'Screen Fail Detected: SUB-102', description: 'Inclusion Criteria #4 failure (BMI out of range).', severity: 'Info', category: 'Clinical', timestamp: '2026-03-20 08:12', read: true },
        { id: 'AL-005', title: 'System Maintenance', description: 'Platform will be offline for 30 mins tonight at 02:00 UTC.', severity: 'Info', category: 'System', timestamp: '2026-03-19 16:00', read: false },
    ]);

    const handleMarkRead = (id: string) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    };

    const handleResolve = (id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    const handleMarkAllRead = () => {
        setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    };

    const handleArchive = () => {
        setAlerts(prev => prev.filter(a => !a.read));
    };

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
                    <button 
                        onClick={handleMarkAllRead}
                        className="px-8 py-3.5 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-xl"
                    >
                        Mark All as Read
                    </button>
                    <button 
                        onClick={handleArchive}
                        className="px-8 py-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-xl"
                    >
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
                                    activeSeverity === s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'
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
                        {filteredAlerts.length > 0 ? filteredAlerts.map((alert) => (
                            <motion.div 
                                key={alert.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className={`p-8 rounded-[2rem] border transition-all hover:bg-white/[0.02] grid grid-cols-1 lg:grid-cols-4 gap-8 group ${
                                    !alert.read ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5 opacity-60'
                                }`}
                            >
                                <div className="lg:col-span-1 flex items-center gap-6">
                                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-110 ${getSeverityStyle(alert.severity)}`}>
                                        {alert.severity === 'Critical' ? <ShieldAlert className="w-7 h-7" /> : <Bell className="w-7 h-7" />}
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-2.5 h-2.5 rounded-full ${!alert.read ? 'bg-indigo-500 animate-ping shadow-[0_0_8px_rgba(99,102,241,1)]' : 'bg-transparent'}`} />
                                            <p className="text-[12px] text-slate-500 font-black uppercase tracking-widest italic leading-none">{alert.timestamp}</p>
                                        </div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400/80 italic">{alert.category}</p>
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-3">
                                    <h4 className={`text-2xl font-black italic uppercase tracking-tighter leading-tight ${alert.severity === 'Critical' ? 'text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.25)]' : 'text-white'}`}>{alert.title}</h4>
                                    <p className="text-sm text-slate-500 font-bold uppercase tracking-tight italic leading-relaxed max-w-2xl">{alert.description}</p>
                                </div>

                                <div className="lg:col-span-1 flex items-center justify-end gap-3 transition-all">
                                    {!alert.read && (
                                        <button 
                                            onClick={() => handleMarkRead(alert.id)}
                                            className="px-5 py-3 bg-white/5 border border-white/5 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-lg"
                                        >
                                            Mark as Read
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleResolve(alert.id)}
                                        className="px-6 py-3.5 bg-white text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:scale-[1.05] active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] flex items-center gap-3"
                                    >
                                        Resolve <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )) : (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                className="p-20 text-center space-y-4"
                            >
                                <CheckCircle2 className="w-16 h-16 text-indigo-500/20 mx-auto" />
                                <p className="text-slate-500 font-black uppercase tracking-widest text-xs italic">All Tactical Signals Resolved • Research Environment Clear</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
