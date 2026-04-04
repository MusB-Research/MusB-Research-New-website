import React, { useState, useEffect, useCallback } from 'react';
import { authFetch, API } from '../../../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, 
    Search, 
    Filter, 
    MoreHorizontal, 
    MessageSquare, 
    User, 
    ChevronRight, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    XCircle,
    TrendingUp,
    Download
} from 'lucide-react';

interface Participant {
    id: string;
    name: string;
    study: string;
    status: 'Screening' | 'Active' | 'Completed' | 'Withdrawn' | 'Fail';
    progress: number;
    lastVisit: string;
    risk: 'Low' | 'Medium' | 'High';
}

export default function ParticipantOversight({ onOpenProfile, onMessage }: { onOpenProfile?: (id: string) => void, onMessage?: (id: string) => void }) {
    const [activeTab, setActiveTab] = useState<'All' | 'Screening' | 'Active' | 'Completed' | 'Fails'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [filterOpen, setFilterOpen] = useState(false);
    const [riskFilter, setRiskFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');

    React.useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 768;
    const isTablet = windowWidth < 1440;

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchParticipants = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await authFetch(`${API}/api/participants/`);
            if (!res.ok) throw new Error('Subject Registry Offline');
            const data = await res.json();
            
            // Map Backend to PI UI Schema
            const mapped: Participant[] = data.map((p: any) => ({
                id: p.id, // Hex ID for routing
                name: p.user_details?.full_name || p.participant_sid,
                study: p.protocol_id || 'Unknown Protocol',
                status: (p.status.charAt(0) + p.status.slice(1).toLowerCase()) as any,
                progress: p.status === 'COMPLETED' ? 100 : (p.status === 'RANDOMIZED' ? 50 : 5),
                lastVisit: p.visits?.[0]?.scheduled_date?.split('T')[0] || 'No Visit',
                risk: 'Low' // Backend doesn't have risk field yet
            }));
            setParticipants(mapped);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchParticipants();
    }, [fetchParticipants]);

    const filteredParticipants = participants.filter(p => {
        const matchesTab = activeTab === 'All' || 
                         (activeTab === 'Fails' ? p.status === 'Withdrawn' || p.status === 'Fail' : p.status === activeTab);
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRisk = riskFilter === 'All' || p.risk === riskFilter;
        return matchesTab && matchesSearch && matchesRisk;
    });

    const handleDownload = () => {
        const headers = "ID,Name,Study,Status,Progress,Last Visit,Risk\n";
        const csvRows = filteredParticipants.map(p => 
            `${p.id},${p.name},${p.study},${p.status},${p.progress}%,${p.lastVisit},${p.risk}`
        ).join("\n");
        const blob = new Blob([headers + csvRows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PARTICIPANT_OVERSIGHT_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'Screening': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'Completed': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
            case 'Fail': 
            case 'Withdrawn': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-slate-400 bg-white/5 border-white/10';
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1 md:space-y-2">
                    <h2 className="text-xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-tight">Participant <span className="text-indigo-400">Oversight</span></h2>
                    <p className="text-[9px] md:text-[11px] text-white/50 font-bold uppercase tracking-[0.2em] italic">Real-time Subject Portfolio Monitoring</p>
                </div>
                <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="SEARCH..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 md:py-3 text-[10px] md:text-[11px] text-white font-bold outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all w-full md:w-80 uppercase tracking-widest placeholder:text-slate-600 shadow-2xl shadow-black/20"
                        />
                    </div>
                    <button 
                        onClick={handleDownload}
                        className="p-2.5 md:p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-indigo-600 transition-all shadow-lg active:scale-95 group"
                    >
                        <Download className="w-3.5 h-3.5 md:w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                    <div className="relative">
                        <button 
                            onClick={() => setFilterOpen(!filterOpen)}
                            className={`p-2.5 md:p-3 border rounded-2xl transition-all shadow-lg active:scale-95 group ${filterOpen ? 'bg-indigo-600 text-white border-white/20' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-indigo-600'}`}
                        >
                            <Filter className="w-3.5 h-3.5 md:w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>

                        <AnimatePresence>
                            {filterOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-3 w-48 bg-[#0B101B] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                                >
                                    <div className="p-4 border-b border-white/5">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Risk Level</p>
                                    </div>
                                    <div className="p-2">
                                        {(['All', 'Low', 'Medium', 'High'] as const).map((risk) => (
                                            <button
                                                key={risk}
                                                onClick={() => {
                                                    setRiskFilter(risk);
                                                    setFilterOpen(false);
                                                }}
                                                className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all ${riskFilter === risk ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                            >
                                                {risk}
                                                {riskFilter === risk && <CheckCircle2 size={12} />}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-nowrap overflow-x-auto gap-2 p-1.5 bg-[#0B101B]/60 border border-white/5 rounded-2xl md:w-fit custom-scrollbar-horizontal pb-3">
                {['All', 'Screening', 'Active', 'Completed', 'Fails'].map((tab: any) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 md:px-6 py-2 md:py-3 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${
                            activeTab === tab 
                                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 ring-1 ring-white/20' 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="bg-[#0F172A]/80 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/60 relative min-h-[400px]">
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                        <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] italic">Hydrating Subject Portfolio...</p>
                    </div>
                ) : error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <AlertCircle className="w-12 h-12 text-red-500/50" />
                        <p className="text-[11px] text-red-400 font-bold uppercase italic">{error}</p>
                        <button onClick={fetchParticipants} className="text-[10px] font-black text-white px-6 py-2 bg-white/5 rounded-full hover:bg-white/10 transition-all uppercase tracking-widest">Retry Connection</button>
                    </div>
                ) : (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent pointer-events-none" />
                        <div className="overflow-x-auto pb-4 custom-scrollbar-horizontal px-0.5">
                    <table className="w-full text-left border-collapse min-w-[1000px] lg:min-w-[1250px]">
                    <thead>
                        <tr className="bg-white/[0.03] border-b border-indigo-500/10 whitespace-nowrap">
                            <th className="px-3 md:px-5 py-4 md:py-5 text-[10px] md:text-[11px] font-black text-indigo-300/90 uppercase tracking-[0.2em] italic">Subject Information</th>
                            <th className="px-3 md:px-5 py-4 md:py-5 text-[10px] md:text-[11px] font-black text-indigo-300/90 uppercase tracking-[0.2em] italic">Clinical Status</th>
                            <th className="px-3 md:px-5 py-4 md:py-5 text-[10px] md:text-[11px] font-black text-indigo-300/90 uppercase tracking-[0.2em] italic">Trial Progress</th>
                            <th className="px-3 md:px-5 py-4 md:py-5 text-[10px] md:text-[11px] font-black text-indigo-300/90 uppercase tracking-[0.2em] italic">Last Visit</th>
                            <th className="px-3 md:px-5 py-4 md:py-5 text-[10px] md:text-[11px] font-black text-indigo-300/90 uppercase tracking-[0.2em] italic text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {filteredParticipants.map((p) => (
                                <motion.tr 
                                    key={p.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="hover:bg-white/[0.02] transition-colors group"
                                >
                                    <td className="px-3 md:px-5 py-4 md:py-6 whitespace-nowrap align-middle">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className="hidden sm:flex w-10 md:w-12 h-10 md:h-12 items-center justify-center bg-indigo-500/10 border border-indigo-500/20 rounded-xl md:rounded-2xl text-indigo-400 shadow-inner group-hover:scale-110 transition-transform">
                                                <User className="w-5 h-5 md:w-6 md:h-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11.5px] md:text-[13px] font-black text-white italic truncate group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{p.name}</p>
                                                <p className="text-[9px] md:text-[10px] text-white/30 font-black tracking-widest mt-0.5 md:mt-1 uppercase font-mono">{p.id} <span className="mx-1 md:mx-2 text-indigo-500/30">/</span> {p.study}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 md:px-5 py-4 md:py-5 align-middle">
                                        <div className={`inline-flex items-center gap-2 md:gap-3 px-3.5 md:px-4 py-2 md:py-2.5 rounded-full border text-[9.5px] md:text-[11px] font-black uppercase tracking-widest shadow-lg ${getStatusColor(p.status)}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_10px_currentColor] animate-pulse" />
                                            {p.status}
                                        </div>
                                    </td>
                                    <td className="px-3 md:px-5 py-4 md:py-5 align-middle">
                                        <div className="w-32 md:w-44 space-y-2 md:space-y-2.5">
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.1em] italic">Cohort Progress</span>
                                                <span className="text-[10px] md:text-[11px] font-black text-white italic">{p.progress}%</span>
                                            </div>
                                            <div className="h-2 md:h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${p.progress}%` }}
                                                    className={`h-full rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)] ${p.progress === 100 ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-indigo-600 shadow-indigo-600/30'}`}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 md:px-5 py-4 md:py-5 whitespace-nowrap align-middle">
                                        <div className="flex items-center gap-2 md:gap-3 text-indigo-300/50 italic">
                                            <Clock className="w-3 md:w-4 h-3 md:h-4" />
                                            <span className="text-[10px] md:text-[11.5px] font-bold uppercase tracking-widest">{p.lastVisit}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 md:px-5 py-4 md:py-5 align-middle">
                                        <div className="flex items-center justify-end gap-2 md:gap-3 transition-all whitespace-nowrap">
                                            <button 
                                                onClick={() => onMessage?.(p.id)}
                                                className="p-2 md:p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-lg active:scale-95 group"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5 md:w-4 h-4 group-hover:scale-110 transition-transform" />
                                            </button>
                                            <button 
                                                onClick={() => onOpenProfile?.(p.id)}
                                                className="px-4 md:px-5 py-1.5 md:py-2.5 bg-indigo-600 text-white rounded-xl text-[9px] md:text-[11px] font-black uppercase tracking-widest flex items-center gap-2 md:gap-2.5 hover:bg-white hover:text-indigo-900 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                                            >
                                                Open <span className="hidden sm:inline">Profile</span> <ChevronRight className="w-3 h-3 md:w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
                        </div>
                    </>
                )}
                {filteredParticipants.length === 0 && !isLoading && !error && (
                    <div className="py-20 text-center space-y-4">
                        <Users className="w-12 h-12 text-slate-800 mx-auto" />
                        <p className="text-[11px] text-slate-600 font-black uppercase tracking-[0.2em] italic">No participants match your criteria</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
