import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Trophy, ChevronRight, TrendingUp, Wallet, 
    ArrowRight, CheckCircle, Clock, History, Download,
    ShieldCheck, Gem, CreditCard, Gift, Info, Building
} from 'lucide-react';
import { Card, Badge, ProgressBar, Skeleton } from './SharedComponents';

const CompensationView = ({ study, compensations = [], tasks = [], visits = [], onAction, isLoading = false }: any) => {
    // Rewards registry is populated from backend clinical records.
    const dummyCompensations: any[] = [];
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

    const isStudyCompleted = (study?.status || '').toUpperCase() === 'COMPLETED';
    
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
            desc: c.description || 'Participation Reward',
            method: c.reward_method || 'Gift Card',
            amount: parseFloat(c.amount || 0),
            date: c.paid_at ? new Date(c.paid_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Processing',
            status: (c.status || 'PENDING').toUpperCase()
        })) : [];
    }, [activeData, study]);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-10 animate-pulse">
                <Skeleton className="h-96 rounded-[32px]" />
                <Skeleton className="h-64 rounded-[32px]" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10 pb-12">
            {/* HERO SECTION */}
            <div className="grid grid-cols-1 gap-8">
                <Card className="p-12 bg-white border-[#E3ECF5] shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform">
                        <Trophy className="w-80 h-80 text-[#1E88E5]" />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16 relative z-10">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[12px] font-bold text-[#8A99B3] uppercase tracking-widest mb-3">
                                <span>Study Engagement</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                                <span className="text-[#1E88E5]">Clinical Rewards</span>
                            </div>
                            <h2 className="text-2xl font-bold text-[#1A2B49] uppercase tracking-tight">Compensation Summary</h2>
                            <p className="text-[13px] font-bold text-[#5F6F89] uppercase tracking-widest italic">Acknowledge your contribution to research advancement</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[11px] font-bold text-[#1E88E5] uppercase tracking-[0.2em] mb-1">Lifetime Disbursement</span>
                            <span className="text-5xl font-bold tracking-tighter text-[#1A2B49]">
                                ${totalEarned.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 mb-10">
                        <div className="p-8 bg-[#F8FBFF] border border-[#E3ECF5] rounded-3xl hover:bg-white transition-all shadow-inner-sm">
                            <h4 className="text-[11px] font-bold text-[#8A99B3] uppercase tracking-widest mb-4 flex items-center gap-3">
                                <CheckCircle className="w-4 h-4 text-[#4CAF50]" /> Verified Earnings
                            </h4>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-bold text-[#1A2B49] tracking-tight">${totalEarned.toFixed(2)}</span>
                                <Badge color={totalEarned > 0 ? 'green' : 'slate'}>{totalEarned > 0 ? 'Paid' : 'Idle'}</Badge>
                            </div>
                        </div>
                        <div className="p-8 bg-[#F8FBFF] border border-[#E3ECF5] rounded-3xl hover:bg-white transition-all shadow-inner-sm">
                            <h4 className="text-[11px] font-bold text-[#8A99B3] uppercase tracking-widest mb-4 flex items-center gap-3">
                                <Clock className="w-4 h-4 text-[#1E88E5]" /> Pending Approval
                            </h4>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-bold text-[#1A2B49] tracking-tight">${pendingPayment.toFixed(2)}</span>
                                <Badge color="blue">{pendingPayment > 0 ? 'Processing' : 'No Queue'}</Badge>
                            </div>
                        </div>
                        <div className="p-8 bg-[#F8FBFF] border border-[#E3ECF5] rounded-3xl hover:bg-white transition-all shadow-inner-sm">
                            <h4 className="text-[11px] font-bold text-[#8A99B3] uppercase tracking-widest mb-4 flex items-center gap-3">
                                <Wallet className="w-4 h-4 text-[#1E88E5]" /> Disbursement Mode
                            </h4>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-[#E3ECF5] text-[#1E88E5]">
                                        <Gift className="w-4.5 h-4.5" />
                                    </div>
                                    <span className="text-[13px] font-bold text-[#1A2B49] uppercase tracking-tight">Gift Card</span>
                                </div>
                                <Badge color="blue">Secure</Badge>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-[#F8FBFF] flex items-center justify-between relative z-10">
                        <div className={`flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest ${isStudyCompleted ? 'text-[#4CAF50]' : 'text-[#8A99B3]'}`}>
                            <ShieldCheck className="w-4 h-4" /> 
                            {isStudyCompleted ? 'Final study disbursement protocol initiated' : 'Rewards are verified and disbursed following protocol milestones'}
                        </div>
                        <div className="flex items-center gap-1.5">
                             <span className="text-[10px] text-[#B0BCCF] font-bold uppercase">Study Status:</span>
                             <Badge color={isStudyCompleted ? 'green' : 'blue'}>{study?.status || 'ACTIVE'}</Badge>
                        </div>
                    </div>
                </Card>
            </div>

            {/* TRANSACTION REGISTRY */}
            <Card className="p-0 bg-white border-[#E3ECF5] shadow-xl overflow-hidden">
                <div className="p-10 border-b border-[#F8FBFF] flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-[#1A2B49] uppercase tracking-tight flex items-center gap-4">
                            <History className="w-6 h-6 text-[#1E88E5]" /> Distribution Registry
                        </h3>
                        <p className="text-[13px] font-bold text-[#5F6F89] uppercase tracking-widest mt-1">Immutable log of clinical compensations disbursed</p>
                    </div>
                    <button 
                        onClick={handleDownload}
                        className="p-4 bg-[#F8FBFF] hover:bg-[#E3F2FD] rounded-xl text-[#8A99B3] hover:text-[#1E88E5] transition-all border border-[#E3ECF5] group active:scale-95"
                        title="Download CSV"
                    >
                        <Download className="w-5 h-5 transition-transform" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#F8FBFF]">
                                {['Target Study', 'Classification', 'Asset Protocol', 'Processing Date', 'Value', 'Status'].map(h => (
                                    <th key={h} className="p-6 text-[11px] font-bold text-[#8A99B3] uppercase tracking-[0.15em] border-b border-[#E3ECF5]">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F8FBFF]">
                            {history.length > 0 ? history.map((row: any) => (
                                <tr key={row.id} className="hover:bg-[#F0F6FF]/30 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#1E88E5] opacity-20" />
                                            <span className="text-[13px] font-bold text-[#1A2B49] uppercase tracking-tight line-clamp-1">{row.study}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest">{row.desc}</td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[12px] font-bold text-[#8A99B3] uppercase tracking-tight">{row.method}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-[12px] font-bold text-[#1A2B49] uppercase">{row.date}</td>
                                    <td className="p-6 text-[14px] font-bold text-[#1E88E5] tracking-tight">${row.amount.toFixed(2)}</td>
                                    <td className="p-6"><Badge color={row.status === 'PAID' ? 'green' : 'blue'}>{row.status}</Badge></td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="p-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <History className="w-16 h-16 text-[#B0BCCF] mb-4" />
                                            <p className="text-[13px] font-bold text-[#1A2B49] uppercase tracking-[0.2em]">Transaction Log Initializing</p>
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

export default React.memo(CompensationView);
