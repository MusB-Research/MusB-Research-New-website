import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Trophy, ChevronRight, TrendingUp, Wallet, CreditCard, 
    ArrowRight, CheckCircle, Clock, History, Download 
} from 'lucide-react';
import { Card, Badge, ProgressBar } from './SharedComponents';

const CompensationView = ({ study }: any) => {
    const totalEarned = 1450;
    const pendingPayment = 250;
    const progressToNextMilestone = 75;

    const history = [
        { id: 1, type: 'Milestone', desc: 'Baseline Visit Completion', amount: 500, date: 'Mar 05, 2026', status: 'PAID' },
        { id: 2, type: 'Incentive', desc: '14-Day Perfect Adherence Bonus', amount: 100, date: 'Mar 19, 2026', status: 'PAID' },
        { id: 3, type: 'Visit', desc: 'Week 2 Assessment', amount: 250, date: 'Mar 20, 2026', status: 'PAID' },
        { id: 4, type: 'Milestone', desc: 'Month 1 Sample Submission', amount: 250, date: 'Apr 05, 2026', status: 'PENDING' },
    ];

    return (
        <div className="flex flex-col gap-10 max-w-[1500px] animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 1. FINANCIAL SUMMARY HERO */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <Card className="lg:col-span-8 p-12 bg-[#0a101f] border-white/5 shadow-2xl relative overflow-hidden group">
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
                            <h2 className="text-4xl lg:text-6xl font-black italic tracking-tighter text-white uppercase leading-none">Your Clinical<br />Rewards Hub</h2>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[12px] font-black text-[#00e676] uppercase tracking-[0.3em] mb-1 italic">Total Lifetime Earned</span>
                            <span className="text-5xl lg:text-7xl font-black italic tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">${totalEarned}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 mb-10">
                        <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2rem] hover:bg-white/[0.05] transition-all">
                            <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-widest mb-4 italic flex items-center gap-2">
                                <TrendingUp className="w-3.5 h-3.5 text-[#00e676]" /> Pending Clinical Payout
                            </h4>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-black text-white italic tracking-tighter">${pendingPayment}</span>
                                <Badge color="indigo">Scheduled: April 05</Badge>
                            </div>
                        </div>
                        <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2rem] hover:bg-white/[0.05] transition-all">
                            <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-widest mb-4 italic flex items-center gap-2">
                                <Wallet className="w-3.5 h-3.5 text-cyan-400" /> Disbursment Method
                            </h4>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/10 rounded-lg text-white"><CreditCard className="w-4 h-4" /></div>
                                    <span className="text-sm font-bold text-white uppercase tracking-widest italic">Bank Account (***9203)</span>
                                </div>
                                <button className="text-[12px] font-black text-cyan-400 hover:text-white transition-all uppercase underline underline-offset-4">Change</button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-10 border-t border-white/[0.03] flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3 text-sm font-black text-slate-500 uppercase tracking-widest italic">
                            <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" /> Financial Vault Secure
                        </div>
                        <button className="text-sm font-black text-cyan-400 hover:text-white transition-all flex items-center gap-2 uppercase tracking-widest italic">
                            REQUEST STATEMENT <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </Card>

                {/* Next Milestone Sidebar */}
                <Card className="lg:col-span-4 p-12 bg-indigo-600 border-indigo-400/30 shadow-[0_20px_50px_rgba(79,70,229,0.3)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
                        <Trophy className="w-48 h-48 text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <h3 className="text-[12px] font-black text-indigo-200 uppercase tracking-[0.3em] mb-4 italic">Next Milestone Goal</h3>
                            <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase mb-2">Month 1 Quality Completion</h2>
                            <p className="text-[14px] font-bold text-indigo-100 uppercase tracking-widest leading-relaxed italic opacity-80 decoration-indigo-300">Submit all weekly biometrics for March to unlock the Phase 1 bonus.</p>
                        </div>

                        <div className="mt-12 space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-end text-[12px] font-black uppercase tracking-widest italic text-white">
                                    <span>Milestone Progress</span>
                                    <span>{progressToNextMilestone}%</span>
                                </div>
                                <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressToNextMilestone}%` }}
                                        className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.6)]"
                                        transition={{ duration: 2, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                            <div className="bg-white/10 p-6 rounded-2xl border border-white/10 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-black text-indigo-200 uppercase tracking-widest mb-1">Bonus Reward</p>
                                    <p className="text-2xl font-black text-white italic tracking-tighter">$250.00</p>
                                </div>
                                <div className="w-10 h-10 bg-white text-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><Trophy className="w-5 h-5" /></div>
                            </div>
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
                    <button className="p-4 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all border border-white/5">
                        <Download className="w-5 h-5" />
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
                            {history.map((row, i) => (
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
                                    <td className="p-6"><Badge color={row.status === 'PAID' ? 'green' : 'amber'}>{row.status}</Badge></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-10 bg-white/[0.01] border-t border-white/5 text-center">
                    <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.3em] italic group cursor-default">
                        Institutional Review Board approved incentive structure: <span className="text-slate-400 underline underline-offset-4 decoration-white/10 shadow-glow">Compensation ID #MSB-COMP-8822</span>
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default CompensationView;
