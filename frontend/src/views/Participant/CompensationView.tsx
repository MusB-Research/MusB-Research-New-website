import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Trophy, ChevronRight, TrendingUp, Wallet, 
    ArrowRight, CheckCircle, Clock, History, Download,
    ShieldCheck, Gem, CreditCard, Gift, Info, Building
} from 'lucide-react';
import { Card, Badge, ProgressBar } from './SharedComponents';

const CompensationView = ({ study, compensations = [], tasks = [], visits = [], onAction }: any) => {
    // Senior Developer: Single End-of-Study Reward Pattern
    const dummyCompensations = [
        { 
            id: 'd1', 
            study_name: study?.title || 'Beat the Bloat', 
            description: 'Full Study Completion Reward', 
            amount: 200.00, 
            status: (study?.status || '').toUpperCase() === 'COMPLETED' ? 'PAID' : 'PENDING', 
            paid_at: (study?.status || '').toUpperCase() === 'COMPLETED' ? '2026-05-15T10:00:00Z' : null,
            created_at: '2026-04-10T09:00:00Z', 
            reward_method: 'Gift Card' 
        }
    ];

    const activeData = compensations.length > 0 ? compensations : dummyCompensations;

    const handleDownload = () => {
        if (!history || history.length === 0) return;
        const csvHeaders = "Study Name,Description,Reward Method,Date,Amount,Status\n";
        const csvRows = history.map(h => 
            `"${h.study}","${h.desc}","${h.method}","${h.date}",$${h.amount.toFixed(2)},"${h.status}"`
        ).join("\n");
        
        const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `STUDY_REWARD_${study?.protocol_id || 'LOG'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ELIGIBILITY LOGIC
    // Rewards are ONLY available after Study Completion.
    const isStudyCompleted = (study?.status || '').toUpperCase() === 'COMPLETED';
    
    // Check if the participant has finished all protocol items
    const allTasksCompleted = tasks.length > 0 && tasks.every((t: any) => 
        (t.status || '').toUpperCase() === 'COMPLETED' || 
        (t.status || '').toUpperCase() === 'VIEW_SUBMISSION'
    );
    const allVisitsCompleted = visits.length > 0 && visits.every((v: any) => 
        (v.status || '').toUpperCase() === 'COMPLETED' || 
        (v.status || '').toUpperCase() === 'ATTENDED'
    );

    const isEligible = isStudyCompleted && allTasksCompleted && allVisitsCompleted;

    const totalEarned = React.useMemo(() => {
        return activeData
            .filter((c: any) => c.status === 'PAID')
            .reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0);
    }, [activeData]);

    const pendingPayment = React.useMemo(() => {
        return activeData
            .filter((c: any) => c.status === 'PENDING' || c.status === 'APPROVED' || c.status === 'VERIFIED')
            .reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0);
    }, [activeData]);

    const history = React.useMemo(() => {
        return Array.isArray(activeData) ? activeData.map((c: any) => ({
            id: c.id,
            study: c.study_name || study?.title || 'Clinical Study',
            desc: c.description || 'Study Completion',
            method: c.reward_method || 'Gift Card',
            amount: parseFloat(c.amount || 0),
            date: c.paid_at ? new Date(c.paid_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Pending Completion',
            status: (c.status || 'PENDING').toUpperCase()
        })) : [];
    }, [activeData, study]);

    const mainRewardMethod = React.useMemo(() => {
        if (!study) return 'Gift Card';
        const type = (study.reward_type || 'GIFT_CARD').toUpperCase();
        if (type === 'CASH') return 'Gift Card (Restricted)';
        return 'Gift Card';
    }, [study]);

    return (
        <div className="flex flex-col gap-10 max-w-[1500px] animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 1. FINANCIAL SUMMARY HERO */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <Card className="lg:col-span-12 p-12 bg-[#0a101f] border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform">
                        <Trophy className="w-64 h-64 text-cyan-400" />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16 relative z-10">
                        <div>
                            <div className="flex items-center gap-2 text-sm font-black text-slate-500 uppercase tracking-[0.25em] mb-4 italic">
                                <span>Compensation</span>
                                <ChevronRight className="w-3 h-3" />
                                <span className="text-white">Participation Reward</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[12px] font-black text-[#00e676] uppercase tracking-[0.3em] mb-1 italic">Total Study Reward</span>
                            <span className="text-4xl lg:text-5xl font-black italic tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                ${isStudyCompleted ? totalEarned.toFixed(2) : '0.00'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 mb-10">
                        <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2rem] hover:bg-white/[0.05] transition-all">
                            <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-widest mb-4 italic flex items-center gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-[#00e676]" /> Amount Paid
                            </h4>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-black text-white italic tracking-tighter">${isStudyCompleted ? totalEarned.toFixed(2) : '0.00'}</span>
                                <Badge color={isStudyCompleted ? 'green' : 'gray'}>{isStudyCompleted ? 'Paid' : 'Awaiting'}</Badge>
                            </div>
                        </div>
                        <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2rem] hover:bg-white/[0.05] transition-all">
                            <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-widest mb-4 italic flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-amber-500" /> Amount Pending
                            </h4>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-black text-white italic tracking-tighter">${!isStudyCompleted ? pendingPayment.toFixed(2) : '0.00'}</span>
                                <Badge color="amber">{!isStudyCompleted ? 'Earned' : 'Processed'}</Badge>
                            </div>
                        </div>
                        <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2rem] hover:bg-white/[0.05] transition-all">
                            <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-widest mb-4 italic flex items-center gap-2">
                                <Wallet className="w-3.5 h-3.5 text-cyan-400" /> Reward Method
                            </h4>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/10 rounded-lg text-white">
                                        <Gift className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold text-white uppercase tracking-widest italic">{mainRewardMethod}</span>
                                </div>
                                <Badge color="indigo">Gift Card</Badge>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-10 border-t border-white/[0.03] flex items-center justify-between relative z-10">
                        {!isStudyCompleted && (
                            <div className="flex items-center gap-3 text-[11px] font-black text-amber-500 uppercase tracking-widest italic animate-pulse">
                                <Info className="w-3.5 h-3.5" /> Total reward is disbursed upon full study completion. Current Status: {study?.status || 'ENROLLED'}
                            </div>
                        )}
                        {isStudyCompleted && (
                            <div className="flex items-center gap-3 text-sm font-black text-[#00e676] uppercase tracking-widest italic">
                                <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" /> Study Completed - Reward Processed
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* 2. TRANSACTION REGISTRY */}
            <Card className="p-0 bg-[#0a101f] border-white/5 shadow-2xl overflow-hidden mt-6">
                <div className="p-10 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tight flex items-center gap-4">
                            <History className="w-6 h-6 text-indigo-400" /> Reward Registry
                        </h3>
                        <p className="text-base font-bold text-slate-500 uppercase tracking-widest mt-1">Status of study completion rewards.</p>
                    </div>
                    <button 
                        onClick={handleDownload}
                        className="p-4 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all border border-white/5 group active:scale-95"
                    >
                        <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02]">
                                {['Study Name', 'Description', 'Reward Method', 'Payment Date', 'Amount', 'Status'].map(h => (
                                    <th key={h} className="p-6 text-[12px] font-black text-slate-500 uppercase tracking-widest italic border-b border-white/5">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {history.length > 0 ? history.map((row: any, i: number) => (
                                <tr key={row.id} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="p-6 px-10">
                                        <div className="flex items-center gap-4">
                                            <Building className="w-4 h-4 text-cyan-400 opacity-40" />
                                            <span className="text-sm font-black text-white italic uppercase tracking-tight">{row.study}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-sm font-bold text-slate-300 uppercase tracking-widest">{row.desc}</td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                            <span className="text-sm font-bold text-slate-400 uppercase tracking-tighter italic">{row.method}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-[12px] font-black text-slate-500 italic uppercase">{row.date}</td>
                                    <td className="p-6 text-base font-black text-white italic tracking-tighter">${row.amount.toFixed(2)}</td>
                                    <td className="p-6"><Badge color={row.status === 'PAID' ? 'green' : 'amber'}>{row.status}</Badge></td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <History className="w-12 h-12 text-slate-500 mb-2" />
                                            <p className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] italic">Reward Processing</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default CompensationView;
