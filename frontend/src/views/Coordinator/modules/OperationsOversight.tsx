import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Rocket, Beaker, UsersRound, Bell, Calendar, 
    ArrowUpRight, ChevronLeft, ChevronRight 
} from 'lucide-react';

interface Stats {
    upcomingVisits: number;
    overdueFollowUps: number;
    awaitingCallback: number;
    pendingForms: number;
    activeSubjects: number;
}

interface Visit {
    id: string;
    participant: string;
    visit_type: string;
    scheduled_date: string;
    status: string;
}

interface OversightModuleProps {
    studyCount: number;
    stats: Stats;
    currentTime: Date;
    visits: Visit[];
    onLaunch: () => void;
    onNavigate: (id: string) => void;
}

export const OperationsOversight: React.FC<OversightModuleProps> = ({ 
    studyCount, 
    stats, 
    currentTime, 
    visits, 
    onLaunch, 
    onNavigate 
}) => {
    const [viewDate, setViewDate] = useState(new Date());

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    
    const calendarDays = Array.from({ length: 42 }, (_, i) => {
        const day = i - firstDayOfMonth + 1;
        if (day <= 0 || day > daysInMonth) return null;
        return new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    });

    const getVisitsForDay = (date: Date) => {
        return visits.filter(v => {
            const vDate = new Date(v.scheduled_date);
            return vDate.getDate() === date.getDate() && 
                   vDate.getMonth() === date.getMonth() && 
                   vDate.getFullYear() === date.getFullYear();
        });
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
                <div className="space-y-4">
                    <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tight leading-none">Operations <span className="text-[#14b8a6]">Oversight</span></h2>
                    <p className="text-[11px] text-white/40 font-bold uppercase tracking-[0.4em] italic leading-none">Clinical Research Execution & Velocity</p>
                </div>
                <button onClick={onLaunch} className="px-10 py-5 bg-[#14b8a6] text-white rounded-2xl text-[12px] font-black uppercase tracking-widest italic flex items-center gap-3 shadow-2xl shadow-teal-900/40 hover:scale-105 transition-all"><Rocket className="w-5 h-5" /> INITIALIZE STUDY</button>
            </div>

            {/* Premium Multi-Box KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Live Protocols', val: studyCount.toString().padStart(2, '0'), icon: Beaker, color: 'teal', id: 'STUDIES' },
                    { label: 'Active Subjects', val: stats.activeSubjects || '1,240', icon: UsersRound, color: 'indigo', id: 'PARTICIPANTS' },
                    { label: 'System Alerts', val: '02', icon: Bell, color: 'red', id: 'ALERTS' },
                    { label: 'Upcoming Visits', val: stats.upcomingVisits || '12', icon: Calendar, color: 'amber', id: 'VISITS' },
                ].map((stat, i) => (
                    <motion.div 
                        key={i} 
                        whileHover={{ y: -8 }}
                        onClick={() => onNavigate(stat.id)} 
                        className={`bg-[#0F172A] border border-white/5 p-10 rounded-[2.5rem] cursor-pointer group transition-all relative overflow-hidden flex flex-col items-center justify-center text-center`}
                    >
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#14b8a6]/5 blur-[80px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <div className="flex items-center justify-center mb-8 relative">
                            <div className={`w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:border-[#14b8a6]/40`}>
                                <stat.icon className="w-7 h-7 text-white" />
                            </div>
                            <ArrowUpRight className="absolute -top-2 -right-12 w-5 h-5 text-white/10 group-hover:text-white transition-colors" />
                        </div>
                        <p className="text-5xl md:text-6xl font-black text-white italic tracking-tighter leading-none mb-4 group-hover:text-[#14b8a6] transition-colors uppercase">{stat.val}</p>
                        <h4 className="text-[12px] font-black text-white/30 uppercase tracking-[0.3em] italic group-hover:text-white transition-colors">{stat.label}</h4>
                    </motion.div>
                ))}
            </div>

            {/* Secondary Operational Tier */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Overdue Follow-ups', val: stats.overdueFollowUps, color: 'text-rose-500' },
                    { label: 'Awaiting Callback', val: stats.awaitingCallback, color: 'text-[#14b8a6]' },
                    { label: 'Pending Forms', val: stats.pendingForms, color: 'text-indigo-400' },
                    { label: '60-Day Window', val: '12', color: 'text-slate-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/5 p-8 rounded-[1.5rem] flex flex-col items-center justify-center text-center">
                        <p className={`text-4xl font-black italic ${stat.color} mb-2 uppercase leading-none`}>{stat.val}</p>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Operations Calendar Section & Upcoming Events */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 pt-12 border-t border-white/5">
                <div className="xl:col-span-8 space-y-8">
                    <div className="flex items-center justify-between h-12">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-8 bg-[#14b8a6] rounded-full" />
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tight leading-none">Clinical <span className="text-[#14b8a6]">Schedule</span></h3>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"><ChevronLeft className="w-5 h-5" /></button>
                            <span className="px-6 text-[12px] font-black text-white uppercase tracking-widest italic min-w-[160px] text-center">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"><ChevronRight className="w-5 h-5" /></button>
                        </div>
                    </div>

                    <div className="bg-[#0F172A] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden">
                        <div className="grid grid-cols-7 gap-2 mb-6">
                            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                                <div key={d} className="text-center text-[10px] font-black text-white/20 tracking-widest pb-4">{d}</div>
                            ))}
                            {calendarDays.map((date, i) => {
                                if (!date) return <div key={i} className="aspect-square opacity-0" />;
                                const isToday = date.toDateString() === new Date().toDateString();
                                const dayVisits = getVisitsForDay(date);
                                
                                return (
                                    <div key={i} className={`aspect-[4/3] relative group transition-all`}>
                                        <div className={`w-full h-full rounded-2xl border ${isToday ? 'bg-[#14b8a6]/10 border-[#14b8a6]/40' : 'bg-white/[0.01] border-white/5 hover:border-white/20'} flex flex-col items-center justify-center gap-2 relative transition-all`}>
                                            <span className={`text-sm font-black italic ${isToday ? 'text-white' : 'text-white/30 group-hover:text-white'}`}>{date.getDate()}</span>
                                            {dayVisits.length > 0 && (
                                                <div className="flex gap-1.5">
                                                    {dayVisits.slice(0, 3).map((v, j) => (
                                                        <div key={j} className={`w-2 h-2 rounded-full ${v.status === 'COMPLETED' ? 'bg-[#14b8a6]' : 'bg-amber-400 animate-pulse'}`} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-4 space-y-8">
                    <div className="flex items-center gap-4 h-12">
                        <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tight leading-none">Upcoming <span className="text-indigo-400">Events</span></h3>
                    </div>
                    
                    <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        {visits.filter(v => v.status === 'SCHEDULED' || v.status === 'PENDING').sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()).slice(0, 6).map((v, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl hover:bg-white/5 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between gap-4 mb-4">
                                    <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 group-hover:border-indigo-500/50 transition-colors">
                                        <Calendar className="w-4 h-4 text-white/40 group-hover:text-white" />
                                    </div>
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{v.scheduled_date ? new Date(v.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'NOT SET'}</span>
                                </div>
                                <h5 className="text-white font-bold text-lg leading-tight uppercase italic mb-1 truncate">{v.visit_type}</h5>
                                <p className="text-[11px] text-slate-500 font-bold tracking-[0.2em] uppercase truncate">ID: {v.participant}</p>
                            </motion.div>
                        ))}
                    </div>
                    
                    <button onClick={() => onNavigate('VISITS')} className="w-full py-6 bg-white/5 border border-white/10 rounded-2xl text-[12px] font-bold text-white uppercase tracking-[0.3em] italic hover:bg-white/10 transition-all shadow-xl">VIEW OPERATIONS OVERVIEW</button>
                </div>
            </div>
        </motion.div>
    );
};
