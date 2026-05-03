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
    ClipboardList,
    ExternalLink
} from 'lucide-react';
import { authFetch, API } from '../../../utils/auth';

interface AlertItem {
    id: string;
    title: string;
    description: string;
    severity: 'Critical' | 'Warning' | 'Info';
    category: 'Clinical' | 'Operational' | 'Safety' | 'System';
    timestamp: string;
    read: boolean;
    link?: string;
}

interface AlertsModuleProps {
    initialNotifications?: any[];
}

export default function AlertsModule({ initialNotifications }: AlertsModuleProps) {
    const [activeSeverity, setActiveSeverity] = useState<'All' | 'Critical' | 'Warning' | 'Info'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAlerts = async () => {
        try {
            const res = await authFetch(`${API}/api/notifications/`);
            if (res.ok) {
                const rawData = await res.json();
                const data = Array.isArray(rawData) ? rawData : (rawData.results || []);
                // Map backend Notification to AlertItem interface
                const mapped: AlertItem[] = data.map((n: any) => ({
                    id: n.id,
                    title: n.title,
                    description: n.message,
                    severity: mapTypeToSeverity(n.type),
                    category: 'System',
                    timestamp: new Date(n.created_at).toLocaleString('en-US', { 
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    }),
                    read: n.is_read,
                    link: n.link || undefined
                }));
                setAlerts(mapped);
            }
        } catch (err) {
            console.error("Failed to fetch tactical signals:", err);
        } finally {
            setLoading(false);
        }
    };

    const mapTypeToSeverity = (type: string): 'Critical' | 'Warning' | 'Info' => {
        const t = type.toUpperCase();
        if (t === 'ERROR' || t === 'CRITICAL' || t === 'DANGER') return 'Critical';
        if (t === 'WARNING' || t === 'ALERT') return 'Warning';
        return 'Info';
    };

    React.useEffect(() => {
        if (initialNotifications && initialNotifications.length > 0) {
            const data = Array.isArray(initialNotifications) ? initialNotifications : ((initialNotifications as any).results || []);
            setAlerts(mappedData(data));
            setLoading(false);
        } else {
            fetchAlerts();
        }
    }, [initialNotifications]);

    const mappedData = (data: any[]) => {
        return data.map((n: any) => ({
            id: n.id,
            title: n.title,
            description: n.message,
            severity: mapTypeToSeverity(n.type),
            category: 'System',
            timestamp: new Date(n.created_at).toLocaleString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }),
            read: n.is_read,
            link: n.link || undefined
        }));
    };

    const handleMarkRead = async (id: string) => {
        try {
            const res = await authFetch(`${API}/api/notifications/${id}/read/`, { method: 'POST' });
            if (res.ok) {
                setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
            }
        } catch (err) {
            console.error("Failed to mark alert as read:", err);
        }
    };

    const handleResolve = async (id: string) => {
        // For notifications, resolve simply marks it as read and archives it locally
        await handleMarkRead(id);
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    const handleMarkAllRead = async () => {
        try {
            const res = await authFetch(`${API}/api/notifications/read_all/`, { method: 'POST' });
            if (res.ok) {
                setAlerts(prev => prev.map(a => ({ ...a, read: true })));
            }
        } catch (err) {
            console.error("Failed to mark all read:", err);
        }
    };

    const handleArchive = () => {
        setAlerts(prev => prev.filter(a => !a.read));
    };

    const filteredAlerts = alerts.filter(a => {
        const matchesSeverity = activeSeverity === 'All' || a.severity === activeSeverity;
        const title = (a.title || '').toLowerCase();
        const desc = (a.description || '').toLowerCase();
        const search = (searchQuery || '').toLowerCase();
        const matchesSearch = title.includes(search) || desc.includes(search);
        return matchesSeverity && matchesSearch;
    });

    const getSeverityStyle = (severity: string) => {
        switch (severity) {
            case 'Critical': return 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]';
            case 'Warning': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'Info': return 'text-teal-400 bg-teal-500/10 border-teal-500/20';
            default: return 'text-slate-400 bg-white/5 border-white/10';
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            {/* Tactical Grid Overlay */}
            <div className="bg-[#0B101B]/40 border border-white/5 rounded-[3rem] p-4 lg:p-10 space-y-10 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
                    <Bell className="w-64 h-64 text-teal-400" />
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Active <span className="text-teal-400">Alerts</span></h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1 italic">Real-time Clinical Oversight & Notifications</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <button 
                            onClick={() => { setLoading(true); fetchAlerts(); }}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-teal-400 hover:text-white hover:bg-teal-600/20 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                        >
                            <Activity className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                        <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 gap-1">
                            {(['All', 'Critical', 'Warning', 'Info'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setActiveSeverity(s)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeSeverity === s ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search Active Alerts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-sm text-white font-bold outline-none focus:border-teal-500/50 transition-all w-full uppercase tracking-widest font-mono"
                    />
                </div>

                {/* Alerts List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="py-20 text-center animate-pulse">
                            <Activity className="w-12 h-12 text-teal-500/20 mx-auto mb-4" />
                            <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Scanning Tactical Signals...</p>
                        </div>
                    ) : (
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
                                            <span className={`w-2.5 h-2.5 rounded-full ${!alert.read ? 'bg-teal-500 animate-ping shadow-[0_0_8px_rgba(99,102,241,1)]' : 'bg-transparent'}`} />
                                            <p className="text-sm text-slate-500 font-black uppercase tracking-widest italic leading-none">{alert.timestamp}</p>
                                        </div>
                                        <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-400/80 italic">{alert.category}</p>
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-3">
                                    <h4 className={`text-2xl font-black italic uppercase tracking-tighter leading-tight ${alert.severity === 'Critical' ? 'text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.25)]' : 'text-white'}`}>{alert.title}</h4>
                                    <p className="text-sm text-slate-500 font-bold uppercase tracking-tight italic leading-relaxed max-w-2xl">{alert.description}</p>
                                </div>

                                <div className="lg:col-span-1 flex items-center justify-end gap-3 transition-all">
                                    {alert.link && (
                                        <button 
                                            onClick={() => {
                                                if (alert.link!.startsWith('http')) {
                                                    window.open(alert.link!, '_blank');
                                                } else {
                                                    window.location.href = alert.link!;
                                                }
                                            }}
                                            className="px-5 py-3 bg-teal-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest italic hover:scale-105 active:scale-95 transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2"
                                        >
                                            Review <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    {!alert.read && (
                                        <button 
                                            onClick={() => handleMarkRead(alert.id)}
                                            className="px-5 py-3 bg-white/5 border border-white/5 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all font-black text-sm uppercase tracking-widest active:scale-95 shadow-lg"
                                        >
                                            Mark as Read
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleResolve(alert.id)}
                                        className="px-6 py-3.5 bg-white text-slate-950 rounded-xl font-black text-sm uppercase tracking-[0.15em] hover:scale-[1.05] active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] flex items-center gap-3"
                                    >
                                        Dismiss <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )) : (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                className="p-20 text-center space-y-4"
                            >
                                <CheckCircle2 className="w-16 h-16 text-teal-500/20 mx-auto" />
                                <p className="text-slate-500 font-black uppercase tracking-widest text-sm italic">All Tactical Signals Resolved • Research Environment Clear</p>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </motion.div>
    );
}


