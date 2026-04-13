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
    const [filterOpen, setFilterOpen] = useState(false);
    const [typeFilter, setTypeFilter] = useState('ALL');

    const apiUrl = API || 'http://localhost:8000';

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
        const matchesType = typeFilter === 'ALL' || c.transaction_type === typeFilter;
        const matchesStudy = !selectedStudyId || selectedStudyId === 'all' || c.study_id === selectedStudyId;
        return matchesTab && matchesSearch && matchesType && matchesStudy;
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                    <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tight leading-none">Clinical <span className="text-blue-400">Rewards Hub</span></h2>
                    <p className="text-[11px] text-white/50 font-bold uppercase tracking-[0.4em] italic leading-none mt-2">Financial Oversight & Participant Compensation</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="SEARCH TRANSACTIONS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-[12px] text-white font-black outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all w-full md:w-80 uppercase tracking-widest"
                        />
                    </div>
                    <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-blue-600 transition-all group shadow-xl">
                        <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Payouts', val: `$${statusMetrics.totalPaid.toLocaleString()}`, icon: Wallet, color: 'emerald' },
                    { label: 'Pending Payment', val: `$${statusMetrics.pendingPayment.toLocaleString()}`, icon: CreditCard, color: 'blue' },
                    { label: 'Awaiting Review', val: `$${statusMetrics.pendingApproval.toLocaleString()}`, icon: Clock, color: 'indigo' },
                ].map((stat, i) => (
                    <div key={i} className="bg-[#0B101B] border border-white/5 rounded-[2.5rem] p-8 flex items-center justify-between group hover:border-blue-500/30 transition-all shadow-2xl">
                        <div className="space-y-3">
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">{stat.label}</p>
                            <p className="text-3xl font-black text-white italic tracking-tighter leading-none group-hover:text-blue-400 transition-colors uppercase">{stat.val}</p>
                        </div>
                        <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <stat.icon className="w-6 h-6 text-white" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex flex-nowrap overflow-x-auto gap-2 p-1.5 bg-[#0B101B]/60 border border-white/5 rounded-2xl custom-scrollbar-horizontal whitespace-nowrap">
                    {['ALL', 'PENDING', 'APPROVED', 'PAID', 'CANCELLED'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab 
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' 
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest italic">{statusMetrics.count} Transactions Found</p>
                    <div className="h-4 w-px bg-white/10" />
                    <button onClick={() => fetchCompensations()} className="text-[11px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2 hover:underline">
                        <History className="w-3.5 h-3.5" /> Synchronize Ledgers
                    </button>
                </div>
            </div>

            {/* Registry Table */}
            <div className="overflow-x-auto custom-scrollbar-horizontal border border-white/5 rounded-[3rem] bg-[#0F172A]/50 backdrop-blur-3xl shadow-3xl">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                        <tr className="bg-white/[0.02] border-b border-white/5">
                            <th className="px-10 py-8 text-[12px] font-black text-white/50 uppercase tracking-widest italic border-r border-white/5">Transaction Details</th>
                            <th className="px-10 py-8 text-[12px] font-black text-white/50 uppercase tracking-widest italic border-r border-white/5">Participant Ref</th>
                            <th className="px-10 py-8 text-[12px] font-black text-white/50 uppercase tracking-widest italic border-r border-white/5">Amount</th>
                            <th className="px-10 py-8 text-[12px] font-black text-white/50 uppercase tracking-widest italic border-r border-white/5">Status Hub</th>
                            <th className="px-10 py-8 text-[12px] font-black text-white/50 uppercase tracking-widest italic text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            <p className="text-[12px] font-black uppercase tracking-[0.3em] text-blue-500 animate-pulse italic">Auditing Financial Records...</p>
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
                                    <td className="px-10 py-10 border-r border-white/5">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-slate-500 group-hover:text-blue-400 group-hover:border-blue-400/40 transition-all shadow-lg">
                                                <ArrowUpRight className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-white italic leading-none group-hover:text-blue-400 transition-colors uppercase tracking-tight">{c.description}</p>
                                                <p className="text-[12px] text-slate-500 font-bold tracking-widest mt-2 uppercase italic">{c.transaction_type.replace('_', ' ')} • {new Date(c.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-10 border-r border-white/5">
                                        <p className="text-sm font-black text-white uppercase tracking-widest leading-none">{c.participant_name}</p>
                                        <p className="text-[11px] text-blue-400 font-bold tracking-widest mt-2 uppercase font-mono">{c.participant_sid} <span className="mx-2 opacity-20">/</span> {c.study_protocol}</p>
                                    </td>
                                    <td className="px-10 py-10 border-r border-white/5">
                                        <p className="text-2xl font-black text-white italic tracking-tighter leading-none">${c.amount.toFixed(2)}</p>
                                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] mt-2 italic">{c.payment_method.replace('_', ' ')}</p>
                                    </td>
                                    <td className="px-10 py-10 border-r border-white/5">
                                        <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest shadow-lg ${getStatusStyles(c.status)}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_10px_currentColor] animate-pulse" />
                                            {c.status}
                                        </div>
                                        {c.paid_at && (
                                            <p className="text-[10px] text-emerald-500/50 font-bold uppercase tracking-widest mt-2 italic">Paid {new Date(c.paid_at).toLocaleDateString()}</p>
                                        )}
                                    </td>
                                    <td className="px-10 py-10 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {c.status === 'PENDING' && (
                                                <button onClick={() => handleUpdateStatus(c.id, 'APPROVED')} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-600/20">
                                                    Approve
                                                </button>
                                            )}
                                            {c.status === 'APPROVED' && (
                                                <button onClick={() => handleUpdateStatus(c.id, 'PAID')} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-600/20">
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

            {/* Empty State */}
            {!isLoading && filteredCompensations.length === 0 && (
                <div className="py-32 flex flex-col items-center justify-center bg-[#0B101B]/40 rounded-[3rem] border border-dashed border-white/10 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
                        <DollarSign className="w-10 h-10 text-slate-700" />
                    </div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-3 leading-none italic">Ledger Clean</h3>
                    <p className="text-slate-500 font-medium uppercase tracking-widest text-[12px] italic">No matching clinical transactions recorded for this filter</p>
                </div>
            )}

        </motion.div>
    );
}
