import React, { useState } from 'react';
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
    Download,
    Plus,
    Loader2
} from 'lucide-react';
import { API, authFetch } from '../../../utils/auth';
import { useLazyLoad } from '../../../hooks/useLazyLoad';

interface Participant {
    id: string;
    participant_sid?: string;
    name: string;
    study: string;
    status: string;
    progress: number;
    lastVisit: string;
    risk: 'Low' | 'Medium' | 'High';
}

export default function ParticipantOversight({ onOpenProfile, onMessage, selectedStudyId }: { onOpenProfile?: (id: string) => void, onMessage?: (id: string) => void, selectedStudyId?: string }) {

    const [activeTab, setActiveTab] = useState<'All' | 'Screening' | 'Active' | 'Completed' | 'Fails'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [filterOpen, setFilterOpen] = useState(false);
    const [riskFilter, setRiskFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const apiUrl = API || 'http://localhost:8000';

    React.useEffect(() => {
        const fetchParticipants = async () => {
            setIsLoading(true);
            try {
                const res = await authFetch(`${apiUrl}/api/participants/`);
                if (res.ok) {
                    const data = await res.json();
                    const mapped: Participant[] = data.map((p: any) => {
                        // Find last visit
                        const lastVisit = p.visits && p.visits.length > 0 
                            ? new Date(Math.max(...p.visits.map((v: any) => new Date(v.scheduled_date).getTime()))).toLocaleDateString()
                            : 'No visits';
                            
                        return {
                            id: p.id,
                            participant_sid: p.participant_sid,
                            name: p.user_details?.full_name || p.participant_sid,
                            study: p.study_name || 'Assigned Study',
                            status: p.status.charAt(0) + p.status.slice(1).toLowerCase().replace('_', ' '),
                            progress: p.compliance || 0,
                            lastVisit: lastVisit,
                            risk: 'Low' // Default risk for now
                        };
                    });
                    setParticipants(mapped);
                }
            } catch (err) {
                console.error("Failed to fetch participants:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchParticipants();
    }, [apiUrl]);

    const filteredParticipants = React.useMemo(() => {
        return participants.filter(p => {
            const matchesTab = activeTab === 'All' || 
                             (activeTab === 'Fails' ? p.status === 'Withdrawn' || p.status === 'Fail' : p.status === activeTab);
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 p.id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRisk = riskFilter === 'All' || p.risk === riskFilter;
            const matchesStudy = !selectedStudyId || selectedStudyId === 'all' || p.study === selectedStudyId;
            return matchesTab && matchesSearch && matchesRisk && matchesStudy;
        });
    }, [participants, activeTab, searchQuery, riskFilter, selectedStudyId]);

    // Senior Developer: Using chunked navigation for high-volume clinical subjects
    const { 
        visibleData: visibleParticipants, 
        hasMore, 
        isLoadingMore, 
        loadMore 
    } = useLazyLoad(filteredParticipants, 10);


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
                    <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tight leading-tight">Participant <span className="text-indigo-400">Oversight</span></h2>
                    <p className="text-[11px] text-white/50 font-bold uppercase tracking-[0.4em] italic leading-none mt-2">Real-time Subject Portfolio Monitoring</p>
                </div>
                <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="SEARCH..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 md:py-3 text-[12px] text-white font-bold outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all w-full md:w-80 uppercase tracking-widest placeholder:text-slate-600 shadow-2xl shadow-black/20"
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
                                        <p className="text-[12px] font-black text-indigo-400 uppercase tracking-widest italic">Risk Level</p>
                                    </div>
                                    <div className="p-2">
                                        {(['All', 'Low', 'Medium', 'High'] as const).map((risk) => (
                                            <button
                                                key={risk}
                                                onClick={() => {
                                                    setRiskFilter(risk);
                                                    setFilterOpen(false);
                                                }}
                                                className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all ${riskFilter === risk ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
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
                        className={`px-4 md:px-6 py-2 md:py-3 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${
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
            <div className="overflow-x-auto custom-scrollbar-horizontal px-1">
                <table className="w-full text-left border-collapse min-w-[1000px] lg:min-w-[1250px] border-t border-white/5">
                    <thead>
                        <tr className="bg-white/[0.02] border-b border-white/5 whitespace-nowrap">
                            <th className="px-10 py-8 text-[12px] font-black text-white/80 uppercase tracking-widest italic border-r border-white/5">Subject Information</th>
                            <th className="px-10 py-8 text-[12px] font-black text-white/80 uppercase tracking-widest italic border-r border-white/5">Clinical Status</th>
                            <th className="px-10 py-8 text-[12px] font-black text-white/80 uppercase tracking-widest italic border-r border-white/5">Trial Progress</th>
                            <th className="px-10 py-8 text-[12px] font-black text-white/80 uppercase tracking-widest italic border-r border-white/5">Last Visit</th>
                            <th className="px-10 py-8 text-[12px] font-black text-white/80 uppercase tracking-widest italic text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-slate-500">
                                    <div className="flex items-center justify-center gap-3 italic uppercase tracking-[0.2em] font-black">
                                        <Loader2 className="w-4 h-4 animate-spin text-cyan-500" /> Authenticating Registry...
                                    </div>
                                </td>
                            </tr>
                        ) : visibleParticipants.map((p) => (
                            <motion.tr 
                                key={p.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="group border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                            >
                                    <td className="px-10 py-10 whitespace-nowrap align-middle border-r border-white/5">
                                        <div className="flex items-center gap-6">
                                            <div className="hidden sm:flex w-12 h-12 items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/40 transition-all shadow-lg shadow-black/20">
                                                <User className="w-5 h-5 md:w-6 md:h-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-base font-black text-white italic truncate group-hover:text-indigo-400 transition-colors uppercase tracking-tight leading-none">{p.name}</p>
                                                <p className="text-[12px] text-slate-500 font-black tracking-widest mt-1.5 uppercase font-mono leading-none">SID: {p.participant_sid} <span className="mx-2 text-indigo-500/30">/</span> {p.study}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-10 align-middle border-r border-white/5">
                                        <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-xl border text-[12px] font-black uppercase tracking-widest shadow-lg ${getStatusColor(p.status)}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_10px_currentColor] animate-pulse" />
                                            {p.status}
                                        </div>
                                    </td>
                                    <td className="px-10 py-10 align-middle border-r border-white/5">
                                        <div className="w-44 space-y-3">
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[11px] font-black text-white/40 uppercase tracking-widest italic leading-none">Compliance</span>
                                                <span className="text-[11px] font-black text-white italic leading-none">{p.progress}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${p.progress}%` }}
                                                    className={`h-full rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)] ${p.progress >= 90 ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-indigo-600 shadow-indigo-600/30'}`}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-10 whitespace-nowrap align-middle border-r border-white/5">
                                        <div className="flex items-center gap-3 text-slate-500 font-black italic">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-[11px] uppercase tracking-widest leading-none">{p.lastVisit}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-10 align-middle">
                                        <div className="flex items-center justify-end gap-3 transition-all whitespace-nowrap">
                                            <button 
                                                onClick={() => onMessage?.(p.id)}
                                                className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-lg active:scale-95 group"
                                            >
                                                <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                            </button>
                                            <button 
                                                onClick={() => onOpenProfile?.(p.id)}
                                                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-white hover:text-indigo-900 shadow-xl shadow-indigo-600/30 active:scale-95 transition-all"
                                            >
                                                Open <span className="hidden sm:inline">Profile</span> <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Load More Button - Integrated Row */}
            {hasMore && (
                <div className="p-8 flex flex-col items-center gap-4 bg-white/[0.01] border-t border-white/5">
                    <button
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="px-8 py-3 bg-white/5 border border-white/10 hover:border-cyan-500/40 text-slate-400 hover:text-white rounded-xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center gap-4 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isLoadingMore ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin text-cyan-500" />
                                Synchronizing Meta-Data
                            </>
                        ) : (
                            <>
                                <Plus className="w-3 h-3" />
                                Load Next Partition
                            </>
                        )}
                    </button>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">
                        Viewing {visibleParticipants.length} of {filteredParticipants.length} Active Records
                    </p>
                </div>
            )}
        </motion.div>
    );
}
