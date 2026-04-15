import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Beaker, Users, Bell, Calendar as CalendarIcon,
    ChevronLeft, ChevronRight, Clock, Phone, FileText
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
    participant_name?: string;
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
    isAdmin?: boolean;
}

export const OperationsOversight: React.FC<OversightModuleProps> = ({
    studyCount,
    stats,
    currentTime,
    visits,
    onLaunch,
    onNavigate,
    isAdmin = false
}) => {
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDayVisits, setSelectedDayVisits] = useState<{ date: Date; visits: Visit[] } | null>(null);

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
        <div className="space-y-10 pt-4">
            {/* Minimal Header */}
            <div className="flex items-center justify-between pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Daily Status</h1>
                    <p className="text-sm text-slate-400 mt-1 font-medium opacity-50">Monitoring progress and essential tasks</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={onLaunch}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-slate-900 rounded-lg text-sm font-bold transition-all hover:bg-slate-100 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        New study
                    </button>
                )}
            </div>

            {/* Simplified KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Active studies', val: studyCount, icon: Beaker, id: 'STUDIES', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Participants', val: stats.activeSubjects, icon: Users, id: 'PARTICIPANTS', color: 'text-slate-400', bg: 'bg-slate-400/10' },
                    { label: 'New alerts', val: stats.overdueFollowUps > 0 ? stats.overdueFollowUps.toString().padStart(2, '0') : '00', icon: Bell, id: 'ALERTS', color: 'text-rose-500', bg: 'bg-rose-500/10' },
                    { label: 'Upcoming visits', val: stats.upcomingVisits, icon: CalendarIcon, id: 'VISITS', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                ].map((stat, i) => (
                    <div
                        key={i}
                        onClick={() => onNavigate(stat.id)}
                        className="bg-[#1E293B]/40 border border-white/5 p-5 rounded-2xl hover:bg-[#1E293B]/60 cursor-pointer transition-all group"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <span className="text-[13px] font-black text-slate-500 tracking-wide uppercase">{stat.label}</span>
                        </div>
                        <p className="text-4xl font-black text-white">{stat.val}</p>
                    </div>
                ))}
            </div>

            {/* Action Required - Clean Grid to use space */}
            <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-500 tracking-widest uppercase italic">Action items Required</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Late tasks', val: stats.overdueFollowUps, icon: Clock, color: 'text-rose-500', bg: 'bg-rose-500/10', sub: 'Immediate attention required' },
                        { label: 'Calls to make', val: stats.awaitingCallback, icon: Phone, color: 'text-blue-500', bg: 'bg-blue-500/10', sub: 'Pending participant outreach' },
                        { label: 'Forms to finish', val: stats.pendingForms, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', sub: 'Incomplete study documentation' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-[#1E293B]/20 border border-white/5 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className={`p-2.5 rounded-xl ${item.bg}`}>
                                    <item.icon className={`w-5 h-5 ${item.color}`} />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{item.label}</p>
                                    <p className="text-xs text-slate-500 font-medium">{item.sub}</p>
                                </div>
                            </div>
                            <span className={`text-2xl font-bold ${item.color}`}>{item.val}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Calendar & Next Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
                {/* Calendar Side */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-400 tracking-widest uppercase">Visit calendar</h3>
                        <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-xl p-1">
                            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400"><ChevronLeft className="w-4 h-4" /></button>
                            <span className="text-[11px] font-bold text-white tracking-widest min-w-[140px] text-center">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="bg-[#0B101B]/50 border border-white/5 rounded-[2.5rem] p-8 xl:p-10 overflow-hidden shadow-2xl">
                        <div className="grid grid-cols-7 gap-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="text-center text-[10px] font-black text-slate-700 py-4 tracking-widest uppercase">{d}</div>
                            ))}
                            {calendarDays.map((date, i) => {
                                if (!date) return <div key={i} className="aspect-square opacity-5" />;
                                const isToday = date.toDateString() === new Date().toDateString();
                                const dayVisits = getVisitsForDay(date);

                                return (
                                    <div key={i} className="aspect-[4/3] p-1 relative group">
                                        <button 
                                            onClick={() => dayVisits.length > 0 && setSelectedDayVisits({ date, visits: dayVisits })}
                                            className={`w-full h-full rounded-2xl border flex flex-col items-center p-3 gap-2 transition-all ${
                                                isToday ? 'bg-blue-500/10 border-blue-500/30' : 
                                                dayVisits.length > 0 ? 'bg-white/[0.03] border-white/5 hover:border-blue-500/30 hover:bg-white/[0.05]' : 
                                                'bg-transparent border-transparent opacity-40'
                                            }`}
                                        >
                                            <span className={`text-[12px] font-black ${isToday ? 'text-blue-400' : 'text-slate-500 group-hover:text-white'}`}>
                                                {date.getDate()}
                                            </span>
                                            <div className="flex flex-col gap-1 w-full mt-1">
                                                {dayVisits.slice(0, 2).map((v, j) => (
                                                    <div key={j} className="flex items-center gap-1.5 overflow-hidden">
                                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${v.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                                        <span className="text-[9px] font-black text-slate-400 truncate tracking-tighter uppercase whitespace-nowrap">
                                                            {v.participant?.split('-').pop()} {v.visit_type}
                                                        </span>
                                                    </div>
                                                ))}
                                                {dayVisits.length > 2 && (
                                                    <div className="text-[8px] font-black text-slate-600 text-center uppercase tracking-widest mt-1">
                                                        + {dayVisits.length - 2} more
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* What's Next Side */}
                <div className="lg:col-span-4 space-y-6">
                    <h3 className="text-sm font-bold text-slate-400 tracking-widest uppercase">What's next</h3>
                    <div className="bg-[#0B101B]/50 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="divide-y divide-white/5">
                            {visits.filter(v => v.status === 'SCHEDULED' || v.status === 'PENDING').sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()).slice(0, 5).map((v, i) => (
                                <div
                                    key={i}
                                    className="p-6 hover:bg-white/5 transition-colors cursor-pointer group"
                                    onClick={() => onNavigate('VISITS')}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[9px] font-black text-blue-400 uppercase tracking-widest italic">
                                                Visit
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 tracking-widest">
                                                {v.scheduled_date ? new Date(v.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Pending'}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-600">
                                            {v.scheduled_date ? new Date(v.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        </span>
                                    </div>
                                     <h5 className="text-sm font-black text-white group-hover:text-blue-500 transition-colors leading-none mb-2 uppercase italic tracking-tight">{v.visit_type}</h5>
                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Subject: {v.participant_name || v.participant}</p>
                                </div>
                            ))}
                            {visits.length === 0 && (
                                <div className="p-10 text-center text-slate-500 text-sm italic py-20">No upcoming visits</div>
                            )}
                        </div>
                        <button
                            onClick={() => onNavigate('VISITS')}
                            className="w-full py-5 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.3em] transition-all bg-white/[0.02] border-t border-white/5 hover:bg-white/5 italic"
                        >
                            View all visits
                        </button>
                    </div>
                </div>
            </div>

            {/* Day Detail Modal */}
            <AnimatePresence>
                {selectedDayVisits && (
                    <div 
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#060a14]/90 backdrop-blur-xl cursor-default"
                        onClick={() => setSelectedDayVisits(null)}
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0B101B] border border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden"
                        >
                            <div className="p-10 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] text-blue-400 font-black uppercase tracking-[0.3em] italic mb-1">Dossier summary</p>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">
                                        {selectedDayVisits.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </h3>
                                </div>
                                <button 
                                    onClick={() => setSelectedDayVisits(null)} 
                                    className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-colors"
                                >
                                    <Plus className="w-5 h-5 rotate-45" />
                                </button>
                            </div>
                            <div className="p-10 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {selectedDayVisits.visits.map((v, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => {
                                            setSelectedDayVisits(null);
                                            onNavigate('VISITS');
                                        }}
                                        className="bg-white/5 border border-white/5 p-6 rounded-[1.5rem] hover:border-blue-500/30 cursor-pointer transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                                {v.status}
                                            </div>
                                            <span className="text-[12px] font-black text-white font-mono">
                                                {v.scheduled_date ? new Date(v.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'}
                                            </span>
                                        </div>
                                        <h4 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors uppercase italic mb-1">{v.visit_type}</h4>
                                        <p className="text-[12px] text-slate-500 font-bold uppercase tracking-widest">
                                            {v.participant_name || 'Subject ID'}: <span className="text-slate-300 ml-1">{v.participant}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="p-10 bg-white/[0.02] flex justify-end">
                                <button 
                                    onClick={() => setSelectedDayVisits(null)}
                                    className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-[12px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                    Close view
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
