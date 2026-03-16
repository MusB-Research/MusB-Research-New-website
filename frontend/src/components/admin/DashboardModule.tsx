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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Live System <span className="text-cyan-400">Overview</span></h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 italic">Real-time metrics across {studyCount} active protocols</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span className="text-[10px] font-black text-white uppercase italic">Session: 04h 12m</span>
                    </div>
                </div>
            </div>

            {/* Recruitment Funnel */}
            <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        Recruitment <span className="text-cyan-400">Funnel</span>
                    </h3>
                    <div className="px-4 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-cyan-500/20">30 Day Performance</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                    {funnelSteps.map((step, i) => (
                        <div key={step.label} className="relative group">
                            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4 hover:bg-white/10 transition-all cursor-crosshair">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                        <step.icon className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                                    </div>
                                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">{step.growth}</span>
                                </div>
                                <div>
                                    <p className="text-x font-black text-slate-500 uppercase tracking-widest italic">{step.label}</p>
                                    <p className="text-3xl font-black text-white italic tracking-tighter mt-1">{step.value}</p>
                                </div>
                            </div>
                            {i < funnelSteps.length - 1 && (
                                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                                    <ArrowUpRight className="w-6 h-6 text-white/10 rotate-45" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Grid: Compliance, Logistics, Safety */}
            <div className="grid lg:grid-cols-3 gap-8">
                
                {/* Module: Compliance Metrics */}
                <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                            <ClipboardCheck className="w-5 h-5 text-emerald-400" />
                            Compliance
                        </h3>
                        <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black text-emerald-400">94%</span>
                             <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[94%]"></div>
                             </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: 'Tasks Due Today', val: '12', color: 'text-white' },
                            { label: 'Overdue Tasks', val: '03', color: 'text-red-400' },
                            { label: 'Completion Rate', val: '98.2%', color: 'text-emerald-400' },
                        ].map(item => (
                            <div key={item.label} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{item.label}</span>
                                <span className={`text-base font-black italic tracking-tight ${item.color}`}>{item.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Module: Logistics Overview */}
                <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                            <Truck className="w-5 h-5 text-cyan-400" />
                            Logistics
                        </h3>
                        <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest border border-white/10 italic">Global Inventory</span>
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: 'Pending Shipment', val: '24', icon: Clock },
                            { label: 'In Transit', val: '156', icon: Activity },
                            { label: 'Overdue Returns', val: '08', icon: AlertCircle },
                        ].map(item => (
                            <div key={item.label} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-cyan-500/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <item.icon className="w-4 h-4 text-slate-600" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{item.label}</span>
                                </div>
                                <span className="text-base font-black italic tracking-tight text-white group-hover:text-cyan-400 transition-colors">{item.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Module: Safety Overview */}
                <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-white uppercase italic tracking-tighter flex items-center gap-3 text-red-400">
                            <ShieldAlert className="w-5 h-5" />
                            Safety <span className="text-white">Alerts</span>
                        </h3>
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded text-[9px] font-black uppercase tracking-widest animate-pulse">Critical</span>
                    </div>
                    <div className="space-y-4">
                        <div className="p-6 bg-red-500/5 rounded-[2rem] border border-red-500/10 flex flex-col items-center justify-center text-center space-y-2">
                             <p className="text-4xl font-black text-red-400 tracking-tighter">02</p>
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Open Adverse Events</p>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">High Severity Flags</span>
                            <span className="text-base font-black italic tracking-tight text-red-400">01</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Geographic Distribution Mock */}
            <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                        <Map className="w-5 h-5 text-indigo-400" />
                        Geographic <span className="text-indigo-400">Distribution</span>
                    </h3>
                    <div className="flex gap-2">
                        {['US', 'UK', 'EU', 'AS'].map(code => (
                            <span key={code} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-slate-400 hover:text-white hover:border-indigo-400/50 cursor-pointer transition-all">{code}</span>
                        ))}
                    </div>
                </div>
                
                <div className="h-64 w-full bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center justify-center space-y-4">
                     <Globe className="w-12 h-12 text-slate-800" />
                     <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] italic">Interactive Global Map Rendering...</p>
                </div>
            </div>
        </motion.div>
    );
}

// Sub components for small metrics
const Activity = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);
