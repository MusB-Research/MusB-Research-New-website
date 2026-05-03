import React from 'react';
import { motion } from 'framer-motion';
import { 
    Trophy, ChevronRight, Wallet, 
    CheckCircle, Clock, History, Download,
    ShieldCheck, Gift, FlaskConical
} from 'lucide-react';
import { Card, Badge, Skeleton } from './SharedComponents';
import { getCurrencySymbol } from '../../utils/format';

const CompensationView = ({ study, compensations = [], tasks = [], visits = [], onAction, isLoading = false }: any) => {
    const activeData = compensations.length > 0 ? compensations : [];

    const handleDownload = () => {
        if (!history || history.length === 0) return;
        const csvHeaders = "Study Name,Description,Reward Method,Date,Amount,Status\n";
        const currencySymbol = getCurrencySymbol(study?.compensation_currency);
        const csvRows = history.map((h: any) =>
            `"${h.study}","${h.desc}","${h.method}","${h.date}","${currencySymbol}${h.amount.toFixed(2)}","${h.status}"`
        ).join("\n");
        const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `STUDY_REWARD_${study?.protocol_id || 'LOG'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const activeCurrencySymbol = React.useMemo(() => {
        if (activeData && activeData.length > 0) {
            const descStr = activeData[0].description || '';
            const match = descStr.match(/^\[([A-Z$€£₹¥]+)\]/);
            if (match) return getCurrencySymbol(match[1]);
        }
        return getCurrencySymbol(study?.compensation_currency || 'USD');
    }, [activeData, study?.compensation_currency]);

    const studyTitle = study?.title || study?.protocol_id || study?.id || 'Enrolled Study';
    const studyProtocol = study?.protocol_id || '';
    const studyStatus = (study?.status || 'ACTIVE').toUpperCase();
    const isStudyCompleted = studyStatus === 'COMPLETED';

    const totalEarned = React.useMemo(() =>
        activeData.filter((c: any) => c.status === 'PAID')
            .reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0),
    [activeData]);

    const pendingPayment = React.useMemo(() =>
        activeData.filter((c: any) => ['PENDING','APPROVED','VERIFIED'].includes(c.status))
            .reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0),
    [activeData]);

    const history = React.useMemo(() =>
        Array.isArray(activeData) ? activeData.map((c: any) => {
            const descStr = c.description || '';
            const match = descStr.match(/^\[([A-Z$€£₹¥]+)\]\s*(.*)$/);
            const currency = match ? match[1] : (study?.compensation_currency || 'USD');
            const desc = match ? match[2] : descStr;
            const symbol = getCurrencySymbol(currency);
            return {
                id: c.id,
                study: c.study_name || studyTitle,
                desc,
                currency,
                symbol,
                method: c.payment_method || c.reward_method || 'Gift Card',
                cardNumber: c.card_number,
                paymentReference: c.payment_reference,
                amount: parseFloat(c.amount || 0),
                date: c.paid_at ? new Date(c.paid_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Processing',
                status: (c.status || 'PENDING').toUpperCase()
            };
        }) : [],
    [activeData, studyTitle, study?.compensation_currency]);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 animate-pulse">
                <Skeleton className="h-64 rounded-[24px]" />
                <Skeleton className="h-48 rounded-[24px]" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 pb-6">
            {/* ENROLLED STUDY BANNER */}
            {study && (
                <div className="flex items-center gap-3 px-5 py-3 bg-[#E8F4FD] border border-[#B3D9F7] rounded-2xl">
                    <FlaskConical className="w-4 h-4 text-[#1E88E5] shrink-0" />
                    <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-[#8A99B3] uppercase tracking-widest mr-2">Enrolled Study:</span>
                        <span className="text-[13px] font-bold text-[#1A2B49] uppercase tracking-tight truncate">{studyTitle}</span>
                        {studyProtocol && <span className="ml-2 text-[11px] font-bold text-[#8A99B3]">· {studyProtocol}</span>}
                    </div>
                    <Badge color={isStudyCompleted ? 'green' : 'blue'}>{studyStatus}</Badge>
                </div>
            )}

            {/* HERO CARD */}
            <Card className="p-6 bg-white border-[#E3ECF5] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                    <Trophy className="w-48 h-48 text-[#1E88E5]" />
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5 relative z-10">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-[#8A99B3] uppercase tracking-widest mb-1">
                            <span>Study Engagement</span>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-[#1E88E5]">Clinical Rewards</span>
                        </div>
                        <h2 className="text-xl font-bold text-[#1A2B49] uppercase tracking-tight">Compensation Summary</h2>
                        <p className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest italic">Acknowledge your contribution to research advancement</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-[#1E88E5] uppercase tracking-[0.2em] mb-0.5">Lifetime Disbursement</span>
                        <span className="text-4xl font-bold tracking-tighter text-[#1A2B49]">{activeCurrencySymbol}{totalEarned.toFixed(2)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                    <div className="p-4 bg-[#F8FBFF] border border-[#E3ECF5] rounded-2xl hover:bg-white transition-all">
                        <h4 className="text-[10px] font-bold text-[#8A99B3] uppercase tracking-widest mb-2 flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-[#4CAF50]" /> Verified Earnings
                        </h4>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-[#1A2B49] tracking-tight">{activeCurrencySymbol}{totalEarned.toFixed(2)}</span>
                            <Badge color={totalEarned > 0 ? 'green' : 'slate'}>{totalEarned > 0 ? 'Paid' : 'Idle'}</Badge>
                        </div>
                    </div>
                    <div className="p-4 bg-[#F8FBFF] border border-[#E3ECF5] rounded-2xl hover:bg-white transition-all">
                        <h4 className="text-[10px] font-bold text-[#8A99B3] uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-[#1E88E5]" /> Pending Approval
                        </h4>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-[#1A2B49] tracking-tight">{activeCurrencySymbol}{pendingPayment.toFixed(2)}</span>
                            <Badge color="blue">{pendingPayment > 0 ? 'Processing' : 'No Queue'}</Badge>
                        </div>
                    </div>
                    <div className="p-4 bg-[#F8FBFF] border border-[#E3ECF5] rounded-2xl hover:bg-white transition-all">
                        <h4 className="text-[10px] font-bold text-[#8A99B3] uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Wallet className="w-3.5 h-3.5 text-[#1E88E5]" /> Disbursement Mode
                        </h4>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white rounded-lg shadow-sm border border-[#E3ECF5] text-[#1E88E5]">
                                    <Gift className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[12px] font-bold text-[#1A2B49] uppercase tracking-tight">Gift Card</span>
                            </div>
                            <Badge color="blue">Secure</Badge>
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#F0F5FB] flex items-center justify-between relative z-10">
                    <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${isStudyCompleted ? 'text-[#4CAF50]' : 'text-[#8A99B3]'}`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {isStudyCompleted ? 'Final study disbursement protocol initiated' : 'Rewards disbursed following protocol milestones'}
                    </div>
                </div>
            </Card>

            {/* DISTRIBUTION REGISTRY */}
            <Card className="p-0 bg-white border-[#E3ECF5] shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-[#F0F5FB] flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-[#1A2B49] uppercase tracking-tight flex items-center gap-3">
                            <History className="w-5 h-5 text-[#1E88E5]" /> Distribution Registry
                        </h3>
                        <p className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest mt-0.5">Immutable log of clinical compensations disbursed</p>
                    </div>
                    <button
                        onClick={handleDownload}
                        className="p-2.5 bg-[#F8FBFF] hover:bg-[#E3F2FD] rounded-xl text-[#8A99B3] hover:text-[#1E88E5] transition-all border border-[#E3ECF5] active:scale-95"
                        title="Download CSV"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#F8FBFF]">
                                {['Target Study', 'Classification', 'Asset Protocol', 'Card Number', 'Reference #', 'Processing Date', 'Value', 'Status'].map(h => (
                                    <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-[#8A99B3] uppercase tracking-[0.15em] border-b border-[#E3ECF5]">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F8FBFF]">
                            {history.length > 0 ? history.map((row: any) => (
                                <tr key={row.id} className="hover:bg-[#F0F6FF]/30 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-[#1E88E5] opacity-40" />
                                            <span className="text-[12px] font-bold text-[#1A2B49] uppercase tracking-tight line-clamp-1">{row.study}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest">{row.desc}</td>
                                    <td className="px-5 py-4 text-[11px] font-bold text-[#8A99B3] uppercase tracking-tight">{row.method}</td>
                                    <td className="px-5 py-4 text-[11px] font-bold text-[#1A2B49]">{row.cardNumber || '-'}</td>
                                    <td className="px-5 py-4 text-[11px] font-bold text-[#1A2B49]">{row.paymentReference || '-'}</td>
                                    <td className="px-5 py-4 text-[11px] font-bold text-[#1A2B49] uppercase">{row.date}</td>
                                    <td className="px-5 py-4 text-[13px] font-bold text-[#1E88E5] tracking-tight">{row.symbol}{row.amount.toFixed(2)}</td>
                                    <td className="px-5 py-4"><Badge color={row.status === 'PAID' ? 'green' : 'blue'}>{row.status}</Badge></td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-40">
                                            <History className="w-10 h-10 text-[#B0BCCF]" />
                                            <p className="text-[12px] font-bold text-[#1A2B49] uppercase tracking-[0.2em]">No transactions yet</p>
                                            <p className="text-[10px] text-[#8A99B3] uppercase tracking-widest">Compensation appears here after coordinator approval</p>
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
