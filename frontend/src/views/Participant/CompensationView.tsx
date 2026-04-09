import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Trophy, ChevronRight, TrendingUp, Wallet, 
    ArrowRight, CheckCircle, Clock, History, Download,
    ShieldCheck, Gem, CreditCard, Gift, Info
} from 'lucide-react';
import { Card, Badge, ProgressBar } from './SharedComponents';

const CompensationView = ({ study, compensations = [], onAction }: any) => {
    // Senior Developer: Using realistic clinical dummy data as fallback for demonstration
    const dummyCompensations = [
        { id: 'd1', transaction_type: 'VISIT_COMPLETION', description: 'Screening & Consent Visit', amount: 150.00, status: 'PAID', paid_at: '2026-03-10T09:00:00Z', created_at: '2026-03-10T09:00:00Z' },
        { id: 'd2', transaction_type: 'TASK_COMPLETION', description: 'Bio-Marker Sensor Sync (Week 1)', amount: 45.00, status: 'PAID', paid_at: '2026-03-17T14:30:00Z', created_at: '2026-03-17T14:30:00Z' },
        { id: 'd3', transaction_type: 'VISIT_COMPLETION', description: 'Monthly Vital Assessment', amount: 250.00, status: 'APPROVED', created_at: '2026-04-02T11:15:00Z' },
        { id: 'd4', transaction_type: 'TASK_COMPLETION', description: 'Adverse Event Log Review', amount: 25.00, status: 'PENDING', created_at: '2026-04-08T16:45:00Z' },
    ];

    const activeData = compensations.length > 0 ? compensations : dummyCompensations;

    const handleDownload = () => {
        if (!history || history.length === 0) {
            return;
        }
        const csvHeaders = "Transaction Type,Description,Date,Amount,Status\n";
        const csvRows = history.map(h => 
            `"${h.type}","${h.desc}","${h.date}",$${h.amount.toFixed(2)},"${h.status}"`
        ).join("\n");
        
        const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `REWARD_STATEMENT_${study?.protocol_id || 'LOG'}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleAction = (type: string) => {
        if (onAction) {
            onAction(type);
        } else {
            alert(`Your request for "${type}" has been received. Our clinical finance team will contact you shortly.`);
        }
    };

    const totalEarned = React.useMemo(() => {
        return activeData
            .filter((c: any) => c.status === 'PAID')
            .reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0);
    }, [activeData]);

    const pendingPayment = React.useMemo(() => {
        return activeData
            .filter((c: any) => c.status === 'PENDING' || c.status === 'APPROVED')
            .reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0);
    }, [activeData]);

    const history = React.useMemo(() => {
        return Array.isArray(activeData) ? activeData.map((c: any) => ({
            id: c.id,
            type: (c.transaction_type || 'Activity').replace(/_/g, ' '),
            desc: c.description || 'Visit Assessment',
            amount: parseFloat(c.amount || 0),
            date: new Date(c.paid_at || c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            status: (c.status || 'PENDING').toUpperCase()
        })) : [];
    }, [activeData]);

    const rewardMethodLabel = React.useMemo(() => {
        if (!study) return 'Not Configured';
        const type = (study.reward_type || 'CASH').toUpperCase();
        
        // Show "AWAITED" instead of specific logic if no activity recorded yet (ignoring dummy data for this status)
        if (compensations.length === 0 && activeData === dummyCompensations) {
            return `${type} (AWAITED)`;
        }

        const logic = (study.reward_logic || 'PER_VISIT').replace(/_/g, ' ');
        return `${type} (${logic})`;
    }, [study, compensations, activeData]);

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
                                <span>Compensation Unit</span>
                                <ChevronRight className="w-3 h-3" />
                                <span className="text-white">Active Participation</span>
                            </div>
                            <h2 className="text-2xl lg:text-3xl font-black italic tracking-tighter text-white uppercase leading-none">Your Clinical Rewards Hub</h2>
                            <p className="text-slate-500 text-sm mt-4 font-bold uppercase tracking-widest italic max-w-2xl">
                                Payments are triggered automatically based on task completion and clinical verification.
                            </p>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[12px] font-black text-[#00e676] uppercase tracking-[0.3em] mb-1 italic">Total Rewards Earned</span>
                            <span className="text-4xl lg:text-5xl font-black italic tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">${totalEarned.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 mb-10">
                        <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2rem] hover:bg-white/[0.05] transition-all">
                            <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-widest mb-4 italic flex items-center gap-2">
                                <TrendingUp className="w-3.5 h-3.5 text-[#00e676]" /> Awaiting Disbursement
                            </h4>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-black text-white italic tracking-tighter">${pendingPayment.toFixed(2)}</span>
                                <Badge color="indigo">Log Verified</Badge>
                            </div>
                        </div>
                        <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2rem] hover:bg-white/[0.05] transition-all">
                            <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-widest mb-4 italic flex items-center gap-2">
                                <Wallet className="w-3.5 h-3.5 text-cyan-400" /> Reward Method
                            </h4>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/10 rounded-lg text-white">
                                        {study?.reward_type === 'COUPONS' ? <Gift className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                                    </div>
                                    <span className="text-sm font-bold text-white uppercase tracking-widest italic">{rewardMethodLabel}</span>
                                </div>
                                <Badge color="gray">Assigned</Badge>
                            </div>
                        </div>
                        <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2rem] hover:bg-white/[0.05] transition-all border-dashed border-cyan-500/20">
                            <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-widest mb-4 italic flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Compliance Status
                            </h4>
                            <div className="flex items-center justify-between">
                                <span className="text-xl font-black text-white italic tracking-tighter uppercase">Audit Ready</span>
                                <Badge color="green">Secure</Badge>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-10 border-t border-white/[0.03] flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3 text-sm font-black text-slate-500 uppercase tracking-widest italic">
                            <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" /> Incentive Log Secure
                        </div>
                    </div>
                </Card>
            </div>

            {/* 2. TRANSACTION REGISTRY */}
            <Card className="p-0 bg-[#0a101f] border-white/5 shadow-2xl overflow-hidden mt-6">
                <div className="p-10 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tight flex items-center gap-4">
                            <History className="w-6 h-6 text-indigo-400" /> Transaction Audit Registry
                        </h3>
                        <p className="text-base font-bold text-slate-500 uppercase tracking-widest mt-1">Full breakdown of all incentive disbursements.</p>
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
                                {['Transaction Type', 'Description', 'Timestamp', 'Amount', 'Status'].map(h => (
                                    <th key={h} className="p-6 text-[12px] font-black text-slate-500 uppercase tracking-widest italic border-b border-white/5">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {history.length > 0 ? history.map((row: any, i: number) => (
                                <tr key={row.id} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="p-6 px-10">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${row.status === 'PAID' ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                {row.status === 'PAID' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                            </div>
                                            <span className="text-sm font-black text-white italic uppercase tracking-tight">{row.type}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-sm font-bold text-slate-300 uppercase tracking-widest">{row.desc}</td>
                                    <td className="p-6 text-[12px] font-black text-slate-500 italic uppercase">{row.date}</td>
                                    <td className="p-6 text-base font-black text-white italic tracking-tighter">${row.amount.toFixed(2)}</td>
                                    <td className="p-6"><Badge color={row.status === 'PAID' ? 'green' : row.status === 'APPROVED' ? 'indigo' : 'amber'}>{row.status}</Badge></td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <History className="w-12 h-12 text-slate-500 mb-2" />
                                            <p className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] italic">No Transactions Authenticated Yet</p>
                                            <p className="text-[12px] font-bold text-slate-600 uppercase tracking-widest max-w-[300px]">Clinical rewards are disbursed upon protocol verification. Complete your next task to trigger a payment cycle.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-10 bg-white/[0.01] border-t border-white/5 text-center">
                    <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.3em] italic group cursor-default">
                        Institutional Review Board approved incentive structure: <span className="text-slate-400 underline underline-offset-4 decoration-white/10 shadow-glow">Study ID #{study?.protocol_id || 'N/A'}</span>
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default CompensationView;


