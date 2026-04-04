import React from 'react';
import { motion } from 'framer-motion';
import { 
    Layout, 
    Users, 
    Beaker, 
    Activity, 
    Shield, 
    TrendingUp, 
    ArrowUpRight, 
    Clock,
    Globe,
    Building2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

interface DashboardModuleProps {
    studyCount: number;
    participantCount?: number;
    staffCount?: number;
    auditLogs?: any[];
    onNavigate: (module: string) => void;
    onActivitiesClick?: () => void;
}

export default function DashboardModule({ 
    studyCount, 
    participantCount = 0, 
    staffCount = 0, 
    auditLogs = [],
    onNavigate 
}: DashboardModuleProps) {
    const stats = [
        { label: 'Active Protocols', value: studyCount.toString().padStart(2, '0'), icon: Beaker, color: 'text-cyan-400', bg: 'bg-cyan-500/10', trend: '+2', module: 'STUDIES' },
        { label: 'Active Participants', value: participantCount.toLocaleString(), icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10', trend: 'Live', module: 'TEAM' },
        { label: 'Research Staff', value: staffCount.toString().padStart(2, '0'), icon: Globe, color: 'text-emerald-400', bg: 'bg-emerald-500/10', trend: 'Live', module: 'TEAM' },
        { label: 'System Health', value: 'Optimal', icon: Shield, color: 'text-pink-400', bg: 'bg-pink-500/10', trend: 'Audit', module: 'AUDIT_LOGS' }
    ];

    const recentActivities = auditLogs.length > 0 ? auditLogs.slice(0, 4).map((log: any) => ({
        id: log.id,
        action: log.action || 'System Event',
        user: log.user_email || 'MusB System',
        time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Success'
    })) : [
        { id: 1, action: 'Synchronizing Clinical Node...', user: 'MusB Research', time: 'Just now', status: 'Success' }
    ];

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
                        System <span className="text-cyan-400">Intelligence</span>
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 italic">
                        Real-time Clinical Research Command & Control
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-3 backdrop-blur-xl">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic font-mono">Terminal Synchronized</span>
                    </div>
                </div>
            </div>

            {/* KPI Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => onNavigate(stat.module)}
                        className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden group hover:border-white/10 transition-all cursor-pointer shadow-2xl"
                    >
                        <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} inline-flex mb-8 group-hover:scale-110 transition-transform`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-2 italic">{stat.label}</p>
                        <div className="flex items-end gap-3">
                            <h4 className="text-3xl font-black text-white italic tracking-tighter">{stat.value}</h4>
                            <div className="flex items-center gap-1 text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1.5 italic">
                                {stat.trend} <ArrowUpRight className="w-3 h-3" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Insights Grid */}
            <div className="grid lg:grid-cols-12 gap-12">
                {/* Protocol Health Map */}
                <div className="lg:col-span-8 bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-12 space-y-10 relative overflow-hidden shadow-2xl transition-all hover:border-cyan-500/20">
                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-4">
                            <TrendingUp className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-sm font-black text-white uppercase italic tracking-[0.3em]">Protocol Lifecycle Velocity</h3>
                        </div>
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                             {['Week', 'Month', 'Quarter'].map(t => (
                                 <button key={t} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${t === 'Month' ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-white'}`}>{t}</button>
                             ))}
                        </div>
                    </div>
                    
                    <div className="flex items-end justify-between h-64 gap-4 px-6 border-b border-white/5 pb-4 relative z-10">
                        {[45, 60, 40, 80, 55, 95, 70, 85, 40, 60, 90, 75, 50, 65].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-4 group relative">
                                <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    className="w-full bg-gradient-to-t from-indigo-950 to-indigo-500 rounded-t-xl transition-all duration-1000 group-hover:from-cyan-500 group-hover:to-indigo-400 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]" 
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-black text-slate-700 uppercase tracking-widest px-8">
                        <span>MAR 01</span>
                        <span>MAR 08</span>
                        <span>MAR 15</span>
                        <span>MAR 22</span>
                        <span>MAR 29</span>
                    </div>
                </div>

                {/* Real-time Activity Hub */}
                <div className="lg:col-span-4 bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-12 space-y-10 shadow-2xl transition-all hover:border-pink-500/20">
                    <div className="flex items-center gap-4">
                        <Activity className="w-5 h-5 text-pink-500" />
                        <h3 className="text-sm font-black text-white uppercase italic tracking-[0.3em]">Operational Pulse</h3>
                    </div>
                    <div className="space-y-8">
                        {recentActivities.map((act) => (
                            <div key={act.id} className="relative pl-8 group">
                                <div className="absolute left-0 top-0 bottom-0 w-px bg-white/5 group-hover:bg-pink-500/30 transition-colors" />
                                <div className="absolute left-[-4px] top-0 w-2 h-2 rounded-full bg-white/10 group-hover:bg-pink-500 transition-all border border-[#060811]" />
                                <div className="space-y-1.5">
                                    <p className="text-[11px] font-black text-white uppercase italic tracking-tight group-hover:text-pink-400 transition-colors">{act.action}</p>
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest italic">
                                        <span className="text-slate-500">{act.user}</span>
                                        <span className="text-slate-700">{act.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={() => onNavigate('AUDIT_LOGS')}
                        className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] hover:bg-white hover:text-slate-950 transition-all italic"
                    >
                        View Full Terminal Log
                    </button>
                </div>
            </div>

            {/* Network Infrastructure Summary */}
            <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 grid md:grid-cols-3 gap-10">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Clinical Site Cohorts</p>
                        <p className="text-2xl font-black text-white italic tracking-tighter">{participantCount.toLocaleString()} Nodes</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Protocol Deployment</p>
                        <p className="text-2xl font-black text-white italic tracking-tighter">{studyCount.toString().padStart(2, '0')} Modules</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-400">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Clinical Clearances</p>
                        <p className="text-2xl font-black text-white italic tracking-tighter">Certified Live</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
