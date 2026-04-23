import React, { useState, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';

import { fetchNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from '../../../api';

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

export default function AlertsModule({ selectedStudyId, initialNotifications }: { selectedStudyId?: string, initialNotifications?: any[] }) {
    const navigate = useNavigate();
    const [activeSeverity, setActiveSeverity] = useState<'All' | 'Critical' | 'Warning' | 'Info'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const mapNotificationsToAlerts = (data: any[]) => {
        return data.map((n: any) => {
            let category: AlertItem['category'] = 'Clinical';
            let severity: AlertItem['severity'] = 'Info';

            const type = (n.type || '').toUpperCase();
            if (type === 'ERROR' || n.title.toLowerCase().includes('sae')) {
                severity = 'Critical';
                category = 'Safety';
            } else if (type === 'WARNING') {
                severity = 'Warning';
                category = 'Operational';
            } else if (type === 'SUCCESS') {
                severity = 'Info';
                category = 'Clinical';
            } else if (n.title.toLowerCase().includes('maintenance') || type === 'SYSTEM') {
                category = 'System';
            }

            return {
                id: String(n.id),
                title: n.title,
                description: n.message,
                severity,
                category,
                timestamp: new Date(n.created_at).toLocaleString(),
                read: n.is_read,
                link: n.link
            };
        });
    };

    const fetchAlertData = async () => {
        setIsLoading(true);
        try {
            const data = await fetchNotifications();
            setAlerts(mapNotificationsToAlerts(data));
        } catch (err) {
            console.error("Failed to sync alert intelligence:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (initialNotifications && initialNotifications.length > 0) {
            setAlerts(mapNotificationsToAlerts(initialNotifications));
            setIsLoading(false);
        } else {
            fetchAlertData();
        }
    }, [initialNotifications]);

    const handleMarkRead = async (id: string) => {
        try {
            await markNotificationRead(id);
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

    const handleResolve = async (id: string) => {
        try {
            await deleteNotification(id);
            setAlerts(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error("Failed to resolve alert:", err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setAlerts(prev => prev.map(a => ({ ...a, read: true })));
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    const handleArchive = async () => {
        const readAlerts = alerts.filter(a => a.read);
        for (const a of readAlerts) {
            try { await deleteNotification(a.id); } catch(e) {}
        }
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
            case 'Info': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            default: return 'text-slate-400 bg-white/5 border-white/10';
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            {/* Header */}
            <div className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} gap-8`}>
                <div>
                    <h2 className={`${isMobile ? 'text-3xl' : 'text-xl md:text-3xl'} font-black text-white italic uppercase tracking-tighter`}>Tactical <span className="text-blue-400">Alerts</span></h2>
                    <p className="text-[11px] text-white/40 font-bold uppercase tracking-[0.3em] mt-2 italic">Real-time Clinical Event Intelligence</p>
                </div>
                <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-4`}>
                    <button 
                        onClick={handleMarkAllRead}
                        className={`px-8 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-xl ${isMobile ? 'w-full' : ''}`}
                    >
                        Mark All as Read
                    </button>
                    <button 
                        onClick={handleArchive}
                        className={`px-8 py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-xl ${isMobile ? 'w-full' : ''}`}
                    >
                        Archive
                    </button>
                </div>
            </div>

            {/* Tactical Grid Overlay */}
            <div className="bg-[#0B101B]/40 border border-white/5 rounded-[3rem] p-4 lg:p-8 space-y-8 relative overflow-hidden shadow-2xl">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
                    <Bell className="w-64 h-64 text-blue-400" />
                </div>

                {/* Filter Controls */}
                <div className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} gap-6 relative z-10`}>
                    <div className="flex flex-wrap gap-2">
                        {['All', 'Critical', 'Warning', 'Info'].map((s: any) => (
                            <button
                                key={s}
                                onClick={() => setActiveSeverity(s)}
                                className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                    activeSeverity === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'
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
                            className={`bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3.5 text-sm text-white font-bold outline-none focus:border-blue-500/50 transition-all ${isMobile ? 'w-full' : 'w-72'} uppercase tracking-widest font-mono shadow-2xl placeholder:text-slate-700`}
                        />
                    </div>
                </div>

                {/* Alerts List */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            <div className="py-24 text-center">
                                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-[12px] font-black uppercase tracking-[0.3em] text-blue-500 animate-pulse italic">Syncing Intel...</p>
                            </div>
                        ) : filteredAlerts.length > 0 ? filteredAlerts.map((alert) => (
                            <motion.div 
                                key={alert.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className={`p-6 lg:p-8 rounded-[2.5rem] border transition-all hover:bg-white/[0.02] flex ${isMobile ? 'flex-col' : 'items-center'} gap-8 group ${
                                    !alert.read ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5 opacity-60'
                                }`}
                            >
                                <div className="flex items-center gap-6 min-w-[200px]">
                                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-110 shadow-lg ${getSeverityStyle(alert.severity)}`}>
                                        {alert.severity === 'Critical' ? <ShieldAlert className="w-7 h-7" /> : <Bell className="w-7 h-7" />}
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-2.5 h-2.5 rounded-full ${!alert.read ? 'bg-blue-500 animate-ping shadow-[0_0_8px_rgba(59,130,246,1)]' : 'bg-transparent'}`} />
                                            <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest italic leading-none">{alert.timestamp}</p>
                                        </div>
                                         <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400/80 italic">{alert.category}</p>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3">
                                    <h4 className={`text-xl lg:text-2xl font-black italic uppercase tracking-tighter leading-tight ${alert.severity === 'Critical' ? 'text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.25)]' : 'text-white'}`}>{alert.title}</h4>
                                    <p className="text-sm text-slate-500 font-bold uppercase tracking-tight italic leading-relaxed max-w-2xl">{alert.description}</p>
                                </div>

                                 <div className={`flex items-center ${isMobile ? 'justify-between' : 'justify-end'} gap-3 transition-all`}>
                                    {alert.link && (
                                        <button 
                                            onClick={() => {
                                                if (alert.link!.startsWith('http')) {
                                                    window.open(alert.link!, '_blank');
                                                } else {
                                                    window.location.href = alert.link!;
                                                }
                                            }}
                                            className={`px-5 py-4 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest italic hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 ${isMobile ? 'flex-1 justify-center' : ''}`}
                                        >
                                            Review <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                    )}

                                    {!alert.read && (
                                         <button 
                                             onClick={() => handleMarkRead(alert.id)}
                                             className={`px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all font-black text-[11px] uppercase tracking-widest active:scale-95 shadow-lg ${isMobile ? 'flex-1 justify-center' : ''}`}
                                         >
                                            Read
                                        </button>
                                    )}
                                     <button 
                                         onClick={() => handleResolve(alert.id)}
                                         className={`px-5 py-4 border border-white/10 bg-white/5 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-white hover:text-slate-950 transition-all active:scale-95 shadow-xl flex items-center gap-3 ${isMobile ? 'flex-1 justify-center' : ''}`}
                                     >
                                        Dismiss
                                     </button>
                                </div>
                            </motion.div>
                        )) : (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                className="p-20 text-center space-y-4"
                            >
                                <CheckCircle2 className="w-16 h-16 text-blue-500/20 mx-auto" />
                                <p className="text-slate-500 font-black uppercase tracking-widest text-[12px] italic">No active alerts identified</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}


