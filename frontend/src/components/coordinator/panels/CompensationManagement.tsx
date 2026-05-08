import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    DollarSign, 
    Search, 
    Filter, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    XCircle,
    Download,
    ChevronRight,
    Wallet,
    CreditCard,
    ArrowUpRight,
    History,
    MoreHorizontal,
    ExternalLink
} from 'lucide-react';
import { API, authFetch } from '../../../utils/auth';

interface Compensation {
    id: string;
    participant_name: string;
    participant_sid: string;
    study_id: string;
    study_protocol: string;
    transaction_type: string;
    description: string;
    amount: number;
    status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
    payment_method: string;
    created_at: string;
    paid_at?: string;
}

export default function CompensationManagement({ selectedStudyId }: { selectedStudyId?: string }) {
    const [compensations, setCompensations] = useState<Compensation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const apiUrl = API || 'http://localhost:8003';

    const fetchCompensations = async () => {
        setIsLoading(true);
        try {
            const query = selectedStudyId && selectedStudyId !== 'all' ? `?study_id=${selectedStudyId}` : '';
            const res = await authFetch(`${apiUrl}/api/compensations/${query}`);
            if (res.ok) {
                const data = await res.json();
                // Map backend data to frontend interface
                const mapped: Compensation[] = data.map((item: any) => ({
                    id: item.id,
                    participant_name: item.participant_details?.full_name || item.participant_details?.user_details?.decrypted_name || item.participant_details?.participant_sid || 'Unknown',
                    participant_sid: item.participant_details?.participant_sid || 'N/A',
                    study_id: item.study,
                    study_protocol: item.study_details?.protocol_id || item.study_details?.id || 'N/A',
                    transaction_type: item.transaction_type,
                    description: item.description,
                    amount: parseFloat(item.amount),
                    status: item.status,
                    payment_method: item.payment_method,
                    created_at: item.created_at,
                    paid_at: item.paid_at
                }));
                setCompensations(mapped);
            }
        } catch (err) {
            console.error("Failed to fetch compensations:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCompensations();
    }, [apiUrl, selectedStudyId]);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await authFetch(`${apiUrl}/api/compensations/${id}/`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus, paid_at: newStatus === 'PAID' ? new Date().toISOString() : null })
            });
            if (res.ok) {
                setCompensations(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as any, paid_at: newStatus === 'PAID' ? new Date().toISOString() : c.paid_at } : c));
            }
        } catch (err) {
            console.error("Failed to update compensation status:", err);
        }
    };

    const filteredCompensations = compensations.filter(c => {
        const matchesTab = activeTab === 'ALL' || c.status === activeTab;
        const matchesSearch = c.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             c.participant_sid.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             c.study_protocol.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStudy = !selectedStudyId || selectedStudyId === 'all' || c.study_id === selectedStudyId;
        return matchesTab && matchesSearch && matchesStudy;
    });

    const statusMetrics = {
        totalPaid: compensations.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.amount, 0),
        pendingApproval: compensations.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + c.amount, 0),
        pendingPayment: compensations.filter(c => c.status === 'APPROVED').reduce((sum, c) => sum + c.amount, 0),
        count: filteredCompensations.length
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'PAID': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'APPROVED': return 'text-[#14b8a6] bg-[#14b8a6]/10 border-[#14b8a6]/20';
            case 'PENDING': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'CANCELLED': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-slate-400 bg-white/5 border-white/10';
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header Section */}
            <div className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} gap-6`}>
                <div className="space-y-2">
                    <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black text-white italic uppercase tracking-tight leading-none`}>Clinical <span className="text-blue-400">Rewards Hub</span></h2>
                    <p className="text-[11px] text-white/50 font-bold uppercase tracking-[0.4em] italic leading-none mt-2">Financial Oversight & Participant Compensation</p>
                </div>
                <div className={`flex items-center gap-3 ${isMobile ? 'w-full' : ''}`}>
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="SEARCH TRANSACTIONS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-[11px] text-white font-black outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all w-full uppercase tracking-widest"
                        />
                    </div>
                    <button className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-blue-600 transition-all group shadow-xl shrink-0">
                        <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6`}>
                {[
                    { label: 'Total Payouts', val: `$${statusMetrics.totalPaid.toLocaleString()}`, icon: Wallet, color: 'emerald' },
                    { label: 'Pending Payment', val: `$${statusMetrics.pendingPayment.toLocaleString()}`, icon: CreditCard, color: 'blue' },
                    { label: 'Awaiting Review', val: `$${statusMetrics.pendingApproval.toLocaleString()}`, icon: Clock, color: 'indigo' },
                ].map((stat, i) => (
                    <div key={i} className={`bg-[#0B101B] border border-white/5 rounded-[2rem] ${isMobile ? 'p-5' : 'p-6'} flex items-center justify-between group hover:border-blue-500/30 transition-all shadow-2xl`}>
                        <div className="space-y-2 md:space-y-3">
                            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{stat.label}</p>
                            <p className="text-2xl md:text-3xl font-black text-white italic tracking-tighter leading-none group-hover:text-blue-400 transition-colors uppercase">{stat.val}</p>
                        </div>
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
                            <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Control Bar */}
            <div className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} gap-6`}>
                <div className={`flex no-scrollbar overflow-x-auto gap-2 p-1.5 bg-[#0B101B]/60 border border-white/5 rounded-2xl whitespace-nowrap ${isMobile ? 'w-full' : ''}`}>
                    {['ALL', 'PENDING', 'APPROVED', 'PAID', 'CANCELLED'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab 
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' 
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className={`flex items-center gap-4 ${isMobile ? 'w-full justify-between px-2' : ''}`}>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{statusMetrics.count} Records</p>
                    <div className="h-4 w-px bg-white/10" />
                    <button onClick={() => fetchCompensations()} className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2 hover:underline active:scale-95 transition-all whitespace-nowrap">
                        <History className="w-3.5 h-3.5" /> Synchronize
                    </button>
                </div>
            </div>

            {/* Registry Table/Cards */}
            <div className="bg-[#0F172A]/50 backdrop-blur-3xl border border-white/5 rounded-[3rem] shadow-3xl overflow-hidden">
                {isMobile ? (
                    <div className="p-4 space-y-4">
                        {isLoading ? (
                            <div className="py-24 text-center space-y-4">
                                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-500 animate-pulse italic">Auditing Financial Records...</p>
                            </div>
                        ) : filteredCompensations.length > 0 ? (
                            filteredCompensations.map((c) => (
                                <motion.div 
                                    key={c.id} 
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-6 group"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-slate-500 group-hover:text-blue-400 group-hover:border-blue-400/40 transition-all shrink-0">
                                                <ArrowUpRight className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-white italic uppercase tracking-tight leading-none group-hover:text-blue-400 transition-colors">{c.description}</h4>
                                                <p className="text-[11px] text-slate-500 font-bold tracking-widest mt-2 uppercase italic">{new Date(c.created_at).toLocaleDateString()} • {(c.transaction_type || 'N/A').replace('_', ' ')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-5 border-y border-white/5">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">Participant</p>
                                            <p className="text-[13px] font-black text-white uppercase truncate">{c.participant_name}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">Protocol</p>
                                            <p className="text-[13px] font-black text-blue-400 uppercase font-mono">{c.study_protocol}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">Amount</p>
                                            <p className="text-xl font-black text-white italic leading-none">${c.amount.toFixed(2)}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">Method</p>
                                            <p className="text-[12px] text-slate-300 font-bold uppercase tracking-widest leading-none">{(c.payment_method || 'PENDING').replace('_', ' ')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <div className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${getStatusStyles(c.status)}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                            {c.status}
                                        </div>
                                        <div className="flex gap-2">
                                            {c.status === 'PENDING' && (
                                                <button onClick={() => handleUpdateStatus(c.id, 'APPROVED')} className="px-5 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                                                    Approve
                                                </button>
                                            )}
                                            {c.status === 'APPROVED' && (
                                                <button onClick={() => handleUpdateStatus(c.id, 'PAID')} className="px-5 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                                                    Mark Paid
                                                </button>
                                            )}
                                            <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-500 active:scale-95"><MoreHorizontal className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="py-20 text-center space-y-4">
                                <DollarSign className="w-12 h-12 text-slate-800 mx-auto" />
                                <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest italic">Ledger Clean</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar-horizontal">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-white/[0.02] border-b border-white/5">
                                    <th className="px-8 py-5 text-[11px] font-black text-white/50 uppercase tracking-widest italic border-r border-white/5">Transaction Details</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-white/50 uppercase tracking-widest italic border-r border-white/5">Participant Ref</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-white/50 uppercase tracking-widest italic border-r border-white/5">Amount</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-white/50 uppercase tracking-widest italic border-r border-white/5">Status Hub</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-white/50 uppercase tracking-widest italic text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <AnimatePresence mode="popLayout">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-500 animate-pulse italic">Auditing Financial Records...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredCompensations.map((c) => (
                                        <motion.tr 
                                            key={c.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="hover:bg-white/[0.02] transition-colors group"
                                        >
                                            <td className="px-8 py-5 border-r border-white/5">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-slate-500 group-hover:text-blue-400 group-hover:border-blue-400/40 transition-all shadow-lg">
                                                        <ArrowUpRight className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-black text-white italic leading-none group-hover:text-blue-400 transition-colors uppercase tracking-tight">{c.description}</p>
                                                        <p className="text-[11px] text-slate-500 font-bold tracking-widest mt-2 uppercase italic">{(c.transaction_type || 'N/A').replace('_', ' ')} • {new Date(c.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 border-r border-white/5">
                                                <p className="text-sm font-black text-white uppercase tracking-widest leading-none">{c.participant_name}</p>
                                                <p className="text-[10px] text-blue-400 font-bold tracking-widest mt-2 uppercase font-mono">{c.participant_sid} <span className="mx-2 opacity-20">/</span> {c.study_protocol}</p>
                                            </td>
                                            <td className="px-8 py-5 border-r border-white/5">
                                                <p className="text-2xl font-black text-white italic tracking-tighter leading-none">${c.amount.toFixed(2)}</p>
                                                <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] mt-2 italic">{(c.payment_method || 'PENDING').replace('_', ' ')}</p>
                                            </td>
                                            <td className="px-8 py-5 border-r border-white/5">
                                                <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest shadow-lg ${getStatusStyles(c.status)}`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_10px_currentColor] animate-pulse" />
                                                    {c.status}
                                                </div>
                                                {c.paid_at && (
                                                    <p className="text-[9px] text-emerald-500/50 font-bold uppercase tracking-widest mt-2 italic">Paid {new Date(c.paid_at).toLocaleDateString()}</p>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    {c.status === 'PENDING' && (
                                                        <button onClick={() => handleUpdateStatus(c.id, 'APPROVED')} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-600/20">
                                                            Approve
                                                        </button>
                                                    )}
                                                    {c.status === 'APPROVED' && (
                                                        <button onClick={() => handleUpdateStatus(c.id, 'PAID')} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-600/20">
                                                            Mark Paid
                                                        </button>
                                                    )}
                                                    <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all active:scale-95 group">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Empty State (Desktop only, mobile has it inside) */}
            {!isMobile && !isLoading && filteredCompensations.length === 0 && (
                <div className="py-32 flex flex-col items-center justify-center bg-[#0B101B]/40 rounded-[3rem] border border-dashed border-white/10 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
                        <DollarSign className="w-10 h-10 text-slate-700" />
                    </div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-3 leading-none italic">Ledger Clean</h3>
                    <p className="text-slate-500 font-medium uppercase tracking-widest text-[11px] italic">No matching clinical transactions recorded for this filter</p>
                </div>
            )}
        </motion.div>
    );
}
