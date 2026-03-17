import React from 'react';
import { motion } from 'framer-motion';
import { 
    Users, 
    CheckCircle2, 
    AlertCircle, 
    Truck, 
    ShieldAlert, 
    Globe, 
    TrendingUp, 
    Clock,
    MousePointer2,
    ClipboardCheck,
    ArrowUpRight,
    Map
} from 'lucide-react';

interface DashboardModuleProps {
    studyCount: number;
}

export default function DashboardModule({ studyCount }: DashboardModuleProps) {
    const funnelSteps = [
        { label: 'Impressions', value: '1.2M', growth: '+12%', icon: Globe },
        { label: 'Clicks', value: '84.2K', growth: '+8%', icon: MousePointer2 },
        { label: 'Screeners', value: '12.4K', growth: '+24%', icon: ClipboardCheck },
        { label: 'Consented', value: '842', growth: '+15%', icon: CheckCircle2 },
        { label: 'Enrolled', value: '420', growth: '+5%', icon: Users },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
        >
            {/* Header / Top Stats */}
            <div className="flex flex-col sm:flex-row shadow-2xl items-start sm:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl sm:text-6xl font-black text-white italic uppercase tracking-tighter leading-tight">Live System <span className="text-cyan-400">Overview</span></h2>
                    <p className="text-sm sm:text-lg text-slate-500 font-black uppercase tracking-[0.3em] mt-4 italic">Real-time metrics across {studyCount} active protocols</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-8 py-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 shadow-xl">
                        <Clock className="w-6 h-6 text-cyan-400" />
                        <span className="text-xs sm:text-sm font-black text-white uppercase italic tracking-widest">Session: 04h 12m</span>
                    </div>
                </div>
            </div>

            {/* Recruitment Funnel */}
            <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[4rem] p-12 space-y-10 shadow-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4">
                        <TrendingUp className="w-6 h-6 text-cyan-400" />
                        Recruitment <span className="text-cyan-400">Funnel</span>
                    </h3>
                    <div className="px-6 py-2 bg-cyan-500/10 text-cyan-400 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-cyan-500/20 shadow-lg shadow-cyan-500/10">30 Day Performance Analysis</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
                    {funnelSteps.map((step, i) => (
                        <div key={step.label} className="relative group">
                            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 space-y-6 hover:bg-white/10 hover:scale-105 transition-all cursor-crosshair shadow-xl">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-all">
                                        <step.icon className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                                    </div>
                                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">{step.growth}</span>
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] italic group-hover:text-slate-300 transition-colors">{step.label}</p>
                                    <p className="text-4xl font-black text-white italic tracking-tighter mt-2">{step.value}</p>
                                </div>
                            </div>
                            {i < funnelSteps.length - 1 && (
                                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 transition-all group-hover:translate-x-2">
                                    <ArrowUpRight className="w-8 h-8 text-white/10 rotate-45" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Grid: Compliance, Logistics, Safety */}
            <div className="grid lg:grid-cols-3 gap-10">
                
                {/* Module: Compliance Metrics */}
                <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10 space-y-10 shadow-2xl group hover:border-emerald-500/20 transition-all">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4">
                            <ClipboardCheck className="w-6 h-6 text-emerald-400" />
                            Compliance
                        </h3>
                        <div className="flex items-center gap-3">
                             <span className="text-sm font-black text-emerald-400">94%</span>
                             <div className="w-16 h-2 bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
                                <div className="h-full bg-emerald-500 w-[94%] shadow-[0_0_10px_#10b981]"></div>
                             </div>
                        </div>
                    </div>
                    <div className="space-y-5">
                        {[
                            { label: 'Tasks Due Today', val: '12', color: 'text-white' },
                            { label: 'Overdue Tasks', val: '03', color: 'text-red-400' },
                            { label: 'Completion Rate', val: '98.2%', color: 'text-emerald-400' },
                        ].map(item => (
                            <div key={item.label} className="flex justify-between items-center p-6 bg-white/5 rounded-2xl border border-white/5 group/row hover:bg-white/10 transition-all">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] italic group-hover/row:text-slate-300 transition-colors">{item.label}</span>
                                <span className={`text-xl font-black italic tracking-tight ${item.color}`}>{item.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Module: Logistics Overview */}
                <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10 space-y-10 shadow-2xl group hover:border-cyan-500/20 transition-all">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4">
                            <Truck className="w-6 h-6 text-cyan-400" />
                            Logistics
                        </h3>
                        <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border border-white/10 italic">Global Inventory Flow</span>
                    </div>
                    <div className="space-y-5">
                        {[
                            { label: 'Pending Shipment', val: '24', icon: Clock },
                            { label: 'In Transit', val: '156', icon: ActivityIcon },
                            { label: 'Overdue Returns', val: '08', icon: AlertCircle },
                        ].map(item => (
                            <div key={item.label} className="flex justify-between items-center p-6 bg-white/5 rounded-2xl border border-white/5 group/row hover:border-cyan-500/30 transition-all hover:bg-white/10">
                                <div className="flex items-center gap-4">
                                    <item.icon className="w-5 h-5 text-slate-600 group-hover/row:text-cyan-400 transition-colors" />
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] italic group-hover/row:text-slate-300 transition-colors">{item.label}</span>
                                </div>
                                <span className="text-xl font-black italic tracking-tight text-white group-hover/row:text-cyan-400 transition-colors">{item.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Module: Safety Overview */}
                <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10 space-y-10 shadow-2xl group hover:border-red-500/20 transition-all">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4 text-red-400">
                            <ShieldAlert className="w-6 h-6" />
                            Safety <span className="text-white">Alerts</span>
                        </h3>
                        <span className="px-4 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-[0.3em] animate-pulse border border-red-500/20 shadow-lg shadow-red-500/10">Critical Protocol Alert</span>
                    </div>
                    <div className="space-y-6">
                        <div className="p-8 bg-red-500/5 rounded-[2.5rem] border border-red-500/10 flex flex-col items-center justify-center text-center space-y-3 group-hover:bg-red-500/10 transition-all shadow-inner">
                             <p className="text-6xl font-black text-red-500 tracking-tighter drop-shadow-lg">02</p>
                             <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] italic group-hover:text-red-400/60 transition-colors">Open Adverse Events</p>
                        </div>
                        <div className="flex justify-between items-center p-6 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] italic">High Severity Flags</span>
                            <span className="text-xl font-black italic tracking-tight text-red-500">01</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Geographic Distribution Mock */}
            <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[4rem] p-12 space-y-10 shadow-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4">
                        <Map className="w-6 h-6 text-indigo-400" />
                        Geographic <span className="text-indigo-400">Distribution Architecture</span>
                    </h3>
                    <div className="flex gap-3">
                        {['US', 'UK', 'EU', 'AS'].map(code => (
                            <span key={code} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-slate-400 hover:text-white hover:border-indigo-400/50 hover:bg-white/10 cursor-pointer transition-all shadow-lg">{code}</span>
                        ))}
                    </div>
                </div>
                
                <div className="h-80 w-full bg-[#0a0b1a]/60 rounded-[3rem] border-4 border-dashed border-white/5 flex flex-col items-center justify-center space-y-6 hover:border-indigo-500/20 transition-all group/map relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover/map:opacity-100 transition-opacity"></div>
                     <Globe className="w-16 h-16 text-slate-800 group-hover/map:text-indigo-500/40 group-hover/map:animate-spin-slow transition-all transform group-hover/map:scale-110" />
                     <p className="text-xs font-black text-slate-600 uppercase tracking-[0.5em] italic z-10 group-hover/map:text-slate-400 transition-colors">Interactive Global Map Rendering Engine Initializing...</p>
                </div>
            </div>
        </motion.div>
    );
}

// Sub components for small metrics
const ActivityIcon = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);
