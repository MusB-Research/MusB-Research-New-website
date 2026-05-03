import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    DollarSign, Search, CheckCircle2, Clock, AlertCircle,
    XCircle, Download, Wallet, CreditCard, ArrowUpRight,
    History, MoreHorizontal, ExternalLink, TrendingUp
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
    currency: string;
    status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
    payment_method: string;
    created_at: string;
    paid_at?: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$', INR: '₹', EUR: '€', GBP: '£',
    JPY: '¥', CAD: 'CA$', AUD: 'A$', SGD: 'S$',
    AED: 'د.إ'
};

const getCurrSymbol = (code: string) => {
    if (!code) return '$';
    const upper = code.toUpperCase();
    if (CURRENCY_SYMBOLS[upper]) return CURRENCY_SYMBOLS[upper];
    if (upper === 'RS' || upper === 'RUPEE') return '₹';
    return code;
};

export default function CompensationManagement({ selectedStudyId }: { selectedStudyId?: string }) {
    const [compensations, setCompensations] = useState<Compensation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'PAID'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth < 768;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const apiUrl = API || 'http://localhost:8000';

    const fetchCompensations = async () => {
        setIsLoading(true);
        try {
            const query = selectedStudyId && selectedStudyId !== 'all' ? `?study_id=${selectedStudyId}` : '';
            const res = await authFetch(`${apiUrl}/api/compensations/${query}`);
            if (res.ok) {
                const data = await res.json();
                const mapped: Compensation[] = data.map((item: any) => ({
                    id: item.id,
                    participant_name: item.participant_details?.full_name || item.participant_details?.user_details?.decrypted_name || item.participant_details?.participant_sid || 'Unknown',
                    participant_sid: item.participant_details?.participant_sid || 'N/A',
                    study_id: item.study,
                    study_protocol: item.study_details?.protocol_id || item.study_details?.id || 'N/A',
                    transaction_type: item.transaction_type,
                    description: item.description,
                    amount: parseFloat(item.amount),
                    currency: item.currency || 'USD',
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

    useEffect(() => { fetchCompensations(); }, [apiUrl, selectedStudyId]);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await authFetch(`${apiUrl}/api/compensations/${id}/`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus, paid_at: newStatus === 'PAID' ? new Date().toISOString() : null })
            });
            if (res.ok) {
                setCompensations(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as any, paid_at: newStatus === 'PAID' ? new Date().toISOString() : c.paid_at } : c));
            }
        } catch (err) { console.error("Failed to update compensation status:", err); }
    };

    const filteredCompensations = compensations.filter(c => {
        const matchesTab = filter === 'all' || c.status === filter;
        const matchesSearch = c.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.participant_sid.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.study_protocol.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStudy = !selectedStudyId || selectedStudyId === 'all' || c.study_id === selectedStudyId;
        return matchesTab && matchesSearch && matchesStudy;
    });

    const totalAmount = compensations.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.amount, 0);
    const mainCurr = compensations.length > 0 ? (compensations[0].currency || 'USD') : 'USD';

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'PAID': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'APPROVED': return 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20';
            case 'PENDING': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'CANCELLED': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-slate-400 bg-white/5 border-white/10';
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-8 max-w-7xl mx-auto"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <DollarSign className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Compensation <span className="text-emerald-500">Registry</span></h2>
                        <p className="text-[12px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1 italic">Clinical Reward Distribution • Finance</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                        {(['all', 'PENDING', 'APPROVED', 'PAID'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    filter === s ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'text-slate-500 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {s === 'all' ? 'Everything' : s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="col-span-2 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/20 rounded-3xl p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000" />
                    <div className="relative flex items-center justify-between">
                        <div>
                            <p className="text-[12px] text-emerald-400/60 font-black uppercase tracking-[0.4em] mb-3 italic">Total Paid Amount</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-white italic tracking-tighter">{getCurrSymbol(mainCurr)}{totalAmount.toLocaleString()}</span>
                                <span className="text-sm font-bold text-emerald-500/50 uppercase italic tracking-[0.3em]">{mainCurr}</span>
                            </div>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <TrendingUp className="w-8 h-8 text-emerald-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col justify-center">
                    <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.4em] mb-3 italic">Pending Review</p>
                    <div className="flex items-center justify-between">
                        <span className="text-5xl font-black text-white italic tracking-tighter">{compensations.filter(c => c.status === 'PENDING').length}</span>
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-amber-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col justify-center">
                    <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.4em] mb-3 italic">Completed Payments</p>
                    <div className="flex items-center justify-between">
                        <span className="text-5xl font-black text-white italic tracking-tighter">{compensations.filter(c => c.status === 'PAID').length}</span>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                                <th className="px-6 py-5 text-[11px] font-black text-white/50 uppercase tracking-[0.3em] italic border-r border-white/5">Payment Details</th>
                                <th className="px-6 py-5 text-[11px] font-black text-white/50 uppercase tracking-[0.3em] italic border-r border-white/5">Participant Info</th>
                                <th className="px-6 py-5 text-[11px] font-black text-white/50 uppercase tracking-[0.3em] italic border-r border-white/5 w-[15%]">Amount</th>
                                <th className="px-6 py-5 text-[11px] font-black text-white/50 uppercase tracking-[0.3em] italic border-r border-white/5 w-[15%]">Status Hub</th>
                                <th className="px-6 py-5 text-[11px] font-black text-white/50 uppercase tracking-[0.3em] italic text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <AnimatePresence mode="popLayout">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-10 h-10 border-3 border-[#10B981] border-t-transparent rounded-full animate-spin" />
                                                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-[#10B981] animate-pulse italic">Updating Records...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredCompensations.map((c) => (
                                    <motion.tr
                                        key={c.id} layout
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="hover:bg-white/[0.03] transition-all group"
                                    >
                                        <td className="px-6 py-6 border-r border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-slate-500 group-hover:text-[#10B981] group-hover:border-[#10B981]/40 transition-all shrink-0">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-base font-black text-white italic leading-none group-hover:text-[#10B981] transition-colors uppercase tracking-tight">{c.description}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-1.5 uppercase italic">{(c.transaction_type || 'N/A').replace('_', ' ')} • {new Date(c.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 border-r border-white/5">
                                            <p className="text-sm font-black text-white uppercase tracking-widest leading-none italic">{c.participant_name}</p>
                                            <p className="text-[10px] text-[#10B981] font-bold tracking-widest mt-1.5 uppercase font-mono italic">{c.participant_sid} <span className="mx-1 opacity-20">/</span> {c.study_protocol}</p>
                                        </td>
                                        <td className="px-6 py-6 border-r border-white/5">
                                            <p className="text-2xl font-black text-white italic tracking-tighter leading-none group-hover:text-[#10B981] transition-all">
                                                {getCurrSymbol(c.currency)}{c.amount.toFixed(2)}
                                            </p>
                                            <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] mt-1.5 italic">{(c.payment_method || 'PENDING').replace('_', ' ')}</p>
                                        </td>
                                        <td className="px-6 py-6 border-r border-white/5">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getStatusStyles(c.status)}`}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />{c.status}
                                            </div>
                                            {c.paid_at && (
                                                <p className="text-[10px] text-emerald-500/50 font-black uppercase tracking-widest mt-2 italic">Disbursed {new Date(c.paid_at).toLocaleDateString()}</p>
                                            )}
                                        </td>
                                        <td className="px-10 py-10 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {c.status === 'PENDING' && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(c.id, 'APPROVED')} 
                                                            className="px-5 py-2.5 bg-[#10B981] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#10B981]/20"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(c.id, 'CANCELLED')} 
                                                            className="px-5 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {c.status === 'APPROVED' && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(c.id, 'PAID')} 
                                                            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                                                        >
                                                            Mark Paid
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(c.id, 'CANCELLED')} 
                                                            className="px-5 py-2.5 bg-white/5 border border-white/10 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Empty State */}
            {!isLoading && filteredCompensations.length === 0 && (
                <div className="py-32 flex flex-col items-center justify-center bg-[#0B101B]/40 rounded-3xl border border-dashed border-white/10 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8 border border-white/5">
                        <DollarSign className="w-10 h-10 text-slate-800" />
                    </div>
                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-3">Records Clear</h3>
                    <p className="text-slate-600 font-bold uppercase tracking-[0.3em] text-[12px] italic">No matching clinical transactions recorded</p>
                </div>
            )}
        </motion.div>
    );
}
