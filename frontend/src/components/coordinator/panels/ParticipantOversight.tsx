import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    Filter,
    MessageSquare,
    User,
    ChevronRight,
    Clock,
    Download,
    Loader2
} from 'lucide-react';
import { API, authFetch } from '../../../utils/auth';
import { useLazyLoad } from '../../../hooks/useLazyLoad';

interface Participant {
    id: string;
    participant_sid?: string;
    name: string;
    study: string;
    study_id: string;
    protocol_id: string;
    status: string;
    progress: number;
    lastVisit: string;
    risk: 'Low' | 'Medium' | 'High';
}

export default function ParticipantOversight({ onOpenProfile, onMessage, selectedStudyId }: { onOpenProfile?: (id: string) => void, onMessage?: (id: string) => void, selectedStudyId?: string }) {

    const [activeTab, setActiveTab] = useState<'All' | 'Screening' | 'Active' | 'Completed' | 'Fails'>('All');
    const [searchQuery, setSearchQuery] = useState('');
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
                    const rawData = await res.json();

                    // Handle potential paginated response or non-array data
                    const data = Array.isArray(rawData) ? rawData : (rawData.results || []);

                    const mapped: Participant[] = data.map((p: any) => {
                        const lastVisit = p.visits && p.visits.length > 0
                            ? new Date(Math.max(...p.visits.map((v: any) => new Date(v.scheduled_date).getTime()))).toLocaleDateString('en-US')
                            : 'Not scheduled';

                        const rawStatus = p.status || 'Active';
                        // Normalize status for UI display and filtering
                        const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase().replace('_', ' ');

                        return {
                            id: p.id,
                            participant_sid: p.participant_sid || 'REQ-000',
                            name: p.user_details?.full_name || p.participant_sid || 'Unknown Subject',
                            study: p.study_name || 'Assigned Study', // Display Name
                            study_id: String(p.study), // Actual ID for filtering
                            protocol_id: p.protocol_id || 'N/A', // Protocol ID for display
                            status: status,
                            progress: p.compliance || 0,
                            lastVisit: lastVisit,
                            risk: 'Low'
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
        return (participants || []).filter(p => {
            const matchesTab = activeTab === 'All' ||
                (activeTab === 'Fails' ? (p.status === 'Withdrawn' || p.status === 'Fail') : 
                 activeTab === 'Active' ? (p.status === 'Active' || p.status === 'Enrolled') :
                 p.status === activeTab);
            const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.participant_sid || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRisk = riskFilter === 'All' || p.risk === riskFilter;
            // Filter by STUDY ID, not study name
            const matchesStudy = !selectedStudyId || selectedStudyId === 'all' || String(p.study_id) === String(selectedStudyId);
            return matchesTab && matchesSearch && matchesRisk && matchesStudy;
        });
    }, [participants, activeTab, searchQuery, riskFilter, selectedStudyId]);

    const {
        visibleData: visibleParticipants,
        hasMore,
        isLoadingMore,
        loadMore
    } = useLazyLoad(filteredParticipants, 15);

    const handleDownload = () => {
        const headers = ['ID', 'Name', 'Status', 'Progress', 'Last Visit'];
        const csv = [
            headers.join(','),
            ...filteredParticipants.map(p => `${p.participant_sid},${p.name},${p.status},${p.progress}%,${p.lastVisit}`)
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Participants_Report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const getStatusStyle = (status: string) => {
        const s = status || 'Active';
        if (s.includes('Active')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if (s.includes('Screening')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        if (s.includes('Completed')) return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        if (s.includes('Fail') || s.includes('Withdrawn')) return 'bg-red-500/10 text-red-500 border-red-500/20';
        return 'bg-white/5 text-slate-400 border-white/10';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight italic">Participant <span className="text-indigo-500">List</span></h1>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">Enrollment oversight and recruitment tracking</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="SEARCH SUBJECTS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[#0B1221] border border-[#1F2937] rounded-lg pl-9 pr-4 py-2.5 text-xs font-bold text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all w-full md:w-64 uppercase tracking-wider"
                        />
                    </div>
                    <button
                        onClick={() => setFilterOpen(!filterOpen)}
                        className={`p-2 border rounded-lg transition-all ${filterOpen ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#0B1221] border-[#1F2937] text-slate-400 hover:text-white'}`}
                        title="Filters"
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="p-2 bg-[#0B1221] border border-[#1F2937] rounded-lg text-slate-400 hover:text-white transition-colors"
                        title="Export CSV"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Expanded Filters */}
            <AnimatePresence>
                {filterOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden px-2"
                    >
                        <div className="bg-[#0B1221] border border-[#1F2937] rounded-xl p-4 flex gap-4 items-center">
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Risk Profile:</span>
                            <div className="flex gap-2">
                                {(['All', 'Low', 'Medium', 'High'] as const).map(risk => (
                                    <button
                                        key={risk}
                                        onClick={() => setRiskFilter(risk)}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                                            riskFilter === risk 
                                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                                            : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-400'
                                        }`}
                                    >
                                        {risk}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filter Tabs */}
            <div className="flex gap-1 border-b border-[#1F2937] px-2">
                {['All', 'Screening', 'Active', 'Completed', 'Fails'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-4 text-xs font-black uppercase tracking-[0.15em] transition-all relative ${activeTab === tab
                                ? 'text-indigo-400'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                        )}
                    </button>
                ))}
            </div>

            {/* Table Section */}
            <div className="bg-[#0B1221] border border-[#1F2937] rounded-xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/[0.02] border-b border-[#1F2937]">
                                        <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Subject Identification</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Current Status</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Protocol Completion</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Last Interaction</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Operations</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2937]">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Accessing Clinical Node...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (visibleParticipants || []).length > 0 ? (
                            visibleParticipants.map((p) => (
                                <tr
                                    key={p.id}
                                    className="group hover:bg-white/[0.01] transition-colors"
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-9 h-9 rounded-lg bg-[#111827] border border-[#1F2937] flex items-center justify-center text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors italic">{p.name}</p>
                                                <p className="text-xs text-slate-600 mt-1 font-bold uppercase tracking-wider">SID: {p.participant_sid} • [{p.protocol_id}] {p.study}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-[0.15em] border ${getStatusStyle(p.status)}`}>
                                            {p.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="w-40 space-y-2">
                                            <div className="flex justify-between text-xs font-black text-slate-600 uppercase tracking-widest">
                                                <span>Linear Progress</span>
                                                <span className="text-white italic">{p.progress || 0}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-[#111827] rounded-full overflow-hidden">
                                                <div
                                                    style={{ width: `${p.progress || 0}%` }}
                                                    className={`h-full transition-all duration-700 ${(p.progress || 0) >= 90 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-xs font-black uppercase tracking-tight">{p.lastVisit}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                onClick={() => onMessage?.(p.id)}
                                                className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all border border-transparent hover:border-[#1F2937]"
                                                title="Direct Message"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onOpenProfile?.(p.id)}
                                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/10 active:scale-95"
                                            >
                                                Details <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="py-24 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="p-4 bg-[#111827] border border-[#1F2937] rounded-full text-slate-700">
                                            <Users className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-white uppercase tracking-widest">No matching records</p>
                                            <p className="text-xs text-slate-600 mt-2 font-bold uppercase tracking-widest">The query returned zero results from the local node.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {hasMore && (
                    <div className="p-6 border-t border-[#1F2937] bg-white/[0.01] flex justify-center">
                        <button
                            onClick={loadMore}
                            disabled={isLoadingMore}
                            className="px-10 py-3.5 bg-[#111827] hover:bg-[#1F2937] border border-[#1F2937] text-slate-400 text-xs font-black uppercase tracking-[0.2em] rounded-lg transition-all disabled:opacity-50 active:scale-95"
                        >
                            {isLoadingMore ? 'Streaming Data...' : 'Synchronize More Records'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
