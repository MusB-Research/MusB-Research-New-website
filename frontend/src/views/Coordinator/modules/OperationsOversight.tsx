import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Beaker, Users, Bell, Calendar as CalendarIcon,
    ChevronLeft, ChevronRight, Clock, Phone, FileText, Activity,
    CalendarDays, LayoutDashboard, Target, ShieldCheck, ChevronDown
} from 'lucide-react';

import { Skeleton } from '../../Participant/SharedComponents';

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
    tasks?: any[];
    onLaunch: () => void;
    onNavigate: (id: string) => void;
    isAdmin?: boolean;
    isLoading?: boolean;
}

export const OperationsOversight: React.FC<OversightModuleProps> = ({
    studyCount,
    stats,
    currentTime,
    visits,
    onLaunch,
    onNavigate,
    isAdmin = false,
    isLoading = false
}) => {
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDayVisits, setSelectedDayVisits] = useState<{ date: Date; visits: Visit[] } | null>(null);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

    const calendarDays = Array.from({ length: 42 }, (_, i) => {
        const day = i - firstDayOfMonth + 1;
        if (day <= 0 || day > daysInMonth) return null;
        return new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    });

    const getVisitsForDay = (date: Date) => {
        return (visits || []).filter(v => {
            if (!v.scheduled_date) return false;
            const vDate = new Date(v.scheduled_date);
            return vDate.getDate() === date.getDate() &&
                vDate.getMonth() === date.getMonth() &&
                vDate.getFullYear() === date.getFullYear();
        });
    };

    return (
        <div className="space-y-12 pt-4">
            {/* Premium Header */}
            <div className={`flex ${isMobile ? 'flex-col gap-8' : 'items-center justify-between'} pb-8 border-b border-white/5`}>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                        <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black text-white tracking-tighter uppercase italic leading-none`}>Daily <span className="text-blue-400">Oversight</span></h1>
                    </div>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.4em] italic pl-4">Clinical operations & task monitoring</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={onLaunch}
                        className={`${isMobile ? 'w-full' : ''} inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:bg-slate-100 hover:scale-105 active:scale-95 shadow-xl shadow-white/5`}
                    >
                        <Plus className="w-4 h-4" />
                        Initialize Protocol
                    </button>
                )}
            </div>

            {/* Optimized KPI Cards */}
            <div className={`grid ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-4'} gap-6`}>
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-[#0B101B]/40 border border-white/5 p-6 rounded-[2.5rem] animate-pulse">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-white/5" />
                                <div className="h-3 bg-white/5 w-24 rounded-lg" />
                            </div>
                            <div className="h-10 bg-white/5 w-16 rounded-xl" />
                        </div>
                    ))
                ) : [
                    { label: 'Active studies', val: studyCount, icon: Beaker, id: 'STUDIES', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Participants', val: stats.activeSubjects, icon: Users, id: 'PARTICIPANTS', color: 'text-slate-400', bg: 'bg-slate-400/10' },
                    { label: 'New alerts', val: stats.overdueFollowUps > 0 ? stats.overdueFollowUps.toString().padStart(2, '0') : '00', icon: Bell, id: 'ALERTS', color: 'text-rose-500', bg: 'bg-rose-500/10' },
                    { label: 'Upcoming visits', val: stats.upcomingVisits, icon: CalendarIcon, id: 'VISITS', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                ].map((stat, i) => (
                    <div
                        key={i}
                        onClick={() => onNavigate(stat.id)}
                        className="bg-[#0B101B]/50 backdrop-blur-xl border border-white/5 p-6 rounded-[2.5rem] hover:bg-white/[0.04] hover:border-blue-500/30 cursor-pointer transition-all group relative overflow-hidden shadow-2xl"
                    >
                        <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:scale-125 transition-transform pointer-events-none">
                            <stat.icon className="w-24 h-24 text-white" />
                        </div>
                        <div className="flex items-center gap-4 mb-5 relative z-10">
                            <div className={`p-2.5 rounded-xl ${stat.bg} border border-white/5`}>
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase italic">{stat.label}</span>
                        </div>
                        <p className="text-3xl font-black text-white italic tracking-tighter relative z-10">{stat.val}</p>
                    </div>
                ))}
            </div>

            {/* Action Items - Refined Grid */}
            <div className="space-y-8">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <h3 className="text-[11px] font-black text-slate-500 tracking-[0.4em] uppercase italic">Critical Operations Queue</h3>
                </div>
                <div className={`grid ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3'} gap-6`}>
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-6 bg-[#0B101B]/20 border border-white/5 rounded-[2rem]">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5" />
                                    <div className="space-y-3">
                                        <div className="h-4 bg-white/5 w-24 rounded-lg" />
                                        <div className="h-2 bg-white/5 w-32 rounded-lg" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : [
                        { label: 'Late Tasks', val: stats.overdueFollowUps, icon: Clock, color: 'text-rose-500', bg: 'bg-rose-500/10', sub: 'Urgent subject interaction' },
                        { label: 'Call Queue', val: stats.awaitingCallback, icon: Phone, color: 'text-blue-500', bg: 'bg-blue-500/10', sub: 'Pending outreach targets' },
                        { label: 'Form Review', val: stats.pendingForms, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10', sub: 'Document verification needed' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-6 bg-[#0B101B]/30 backdrop-blur-xl border border-white/5 rounded-[2rem] hover:bg-white/[0.04] transition-all cursor-pointer group active:scale-[0.98] shadow-2xl">
                            <div className="flex items-center gap-5">
                                <div className={`p-3.5 rounded-2xl ${item.bg} border border-white/5 shadow-xl`}>
                                    <item.icon className={`w-5 h-5 ${item.color}`} />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-[12px] font-black text-white group-hover:text-blue-400 transition-colors uppercase italic tracking-tight">{item.label}</p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">{item.sub}</p>
                                </div>
                            </div>
                            <span className={`text-2xl font-black italic tracking-tighter ${item.color}`}>{item.val}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Calendar & Next Section */}
            <div className={`grid grid-cols-1 ${isMobile ? '' : 'lg:grid-cols-12 items-stretch'} gap-10 pt-6`}>
                {/* Calendar Side */}
                <div className={`${isMobile ? '' : 'lg:col-span-8'} flex flex-col justify-between gap-8 h-full`}>
                    <div className="flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <CalendarDays className="w-4 h-4 text-slate-600" />
                            <h3 className="text-[11px] font-black text-slate-500 tracking-[0.4em] uppercase italic">Visit Scheduler</h3>
                        </div>
                        <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-1.5 shadow-2xl">
                            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-slate-400"><ChevronLeft className="w-4 h-4" /></button>
                            <span className="text-[10px] font-black text-white tracking-[0.2em] min-w-[150px] text-center uppercase italic">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-slate-400"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="bg-[#0B101B]/50 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-6 md:p-10 shadow-2xl relative overflow-hidden flex-1 flex flex-col justify-center">
                        <div className="grid grid-cols-7 gap-2 md:gap-4">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                <div key={i} className="text-center text-[9px] md:text-[10px] font-black text-slate-700 py-4 tracking-widest uppercase italic">
                                    <span className="hidden md:inline">{['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][i]}</span>
                                    <span className="md:hidden">{d}</span>
                                </div>
                            ))}
                            {isLoading ? (
                                Array.from({ length: 35 }).map((_, i) => (
                                    <div key={i} className="aspect-square p-1">
                                        <div className="w-full h-full rounded-2xl bg-white/5 animate-pulse" />
                                    </div>
                                ))
                            ) : calendarDays.map((date, i) => {
                                if (!date) return <div key={i} className="aspect-square opacity-[0.02]" />;
                                const isToday = date.toDateString() === new Date().toDateString();
                                const dayVisits = getVisitsForDay(date);

                                return (
                                    <div key={i} className="aspect-square p-0.5 md:p-1 relative group">
                                        <button 
                                            onClick={() => dayVisits.length > 0 && setSelectedDayVisits({ date, visits: dayVisits })}
                                            className={`w-full h-full rounded-[1.25rem] md:rounded-[1.75rem] border flex flex-col items-center justify-center p-2 transition-all relative overflow-hidden ${
                                                isToday ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 
                                                dayVisits.length > 0 ? 'bg-white/[0.03] border-white/10 hover:border-blue-500/50 hover:bg-white/[0.06]' : 
                                                'bg-transparent border-transparent opacity-20 hover:opacity-100 hover:bg-white/[0.02]'
                                            }`}
                                        >
                                            <span className={`text-[10px] md:text-sm font-black italic tracking-tighter ${isToday ? 'text-blue-400' : 'text-slate-500 group-hover:text-white'}`}>
                                                {date.getDate()}
                                            </span>
                                            
                                            {/* Indicators */}
                                            {dayVisits.length > 0 && (
                                                <div className="flex flex-wrap items-center justify-center gap-1 mt-1.5 max-w-full">
                                                    {dayVisits.slice(0, isMobile ? 3 : 5).map((v, j) => (
                                                        <div key={j} className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${v.status === 'COMPLETED' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]'}`} />
                                                    ))}
                                                    {dayVisits.length > (isMobile ? 3 : 5) && <div className="w-1 h-1 rounded-full bg-slate-600" />}
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* What's Next Side */}
                <div className={`${isMobile ? '' : 'lg:col-span-4'} flex flex-col justify-between gap-8 h-full`}>
                    <div className="flex items-center gap-3 shrink-0">
                        <Target className="w-4 h-4 text-slate-600" />
                        <h3 className="text-[11px] font-black text-slate-500 tracking-[0.4em] uppercase italic">Priority Pipeline</h3>
                    </div>
                    <div className="bg-[#0B101B]/50 backdrop-blur-2xl border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col flex-1 h-full min-h-[360px] justify-between">
                        <div className="divide-y divide-white/5 overflow-y-auto custom-scrollbar flex-1">
                            {(visits || []).filter(v => v.status === 'SCHEDULED' || v.status === 'PENDING').sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()).slice(0, 6).map((v, i) => (
                                <div
                                    key={i}
                                    className="p-8 hover:bg-white/[0.04] transition-all cursor-pointer group relative overflow-hidden"
                                    onClick={() => onNavigate('VISITS')}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] font-black text-blue-400 uppercase tracking-widest italic shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                                                Visit
                                            </div>
                                            <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase italic">
                                                {v.scheduled_date ? new Date(v.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Pending'}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-700 font-mono italic">
                                            {v.scheduled_date ? new Date(v.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        </span>
                                    </div>
                                    <h5 className="text-base font-black text-white group-hover:text-blue-400 transition-colors leading-none mb-2 uppercase italic tracking-tighter">{v.visit_type}</h5>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">{v.participant_name || v.participant}</p>
                                    </div>
                                </div>
                            ))}
                            {(visits || []).length === 0 && (
                                <div className="p-16 text-center text-slate-600 text-xs italic uppercase tracking-widest opacity-50">No priority visits in queue</div>
                            )}
                        </div>
                        <button
                            onClick={() => onNavigate('VISITS')}
                            className="w-full py-8 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.4em] transition-all bg-white/[0.02] border-t border-white/5 hover:bg-white/[0.06] italic group"
                        >
                            Analyze Full Schedule <ChevronRight className="inline w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Day Detail Modal */}
            <AnimatePresence>
                {selectedDayVisits && (
                    <div 
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#060a14]/95 backdrop-blur-2xl cursor-default"
                        onClick={() => setSelectedDayVisits(null)}
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0B101B] border border-white/10 w-full max-w-xl rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
                        >
                            <div className="p-10 md:p-12 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                                <div>
                                    <p className="text-[11px] text-blue-400 font-black uppercase tracking-[0.4em] italic mb-2">Protocol Dossier Summary</p>
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                                        {selectedDayVisits.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </h3>
                                </div>
                                <button 
                                    onClick={() => setSelectedDayVisits(null)} 
                                    className="p-4 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all hover:bg-white/10 active:scale-95"
                                >
                                    <Plus className="w-6 h-6 rotate-45" />
                                </button>
                            </div>
                            <div className="p-10 md:p-12 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                                {selectedDayVisits.visits.map((v, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => {
                                            setSelectedDayVisits(null);
                                            onNavigate('VISITS');
                                        }}
                                        className="bg-white/[0.03] border border-white/5 p-8 rounded-[2rem] hover:border-blue-500/40 hover:bg-white/[0.06] cursor-pointer transition-all group relative overflow-hidden shadow-xl"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`px-4 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest italic shadow-lg ${
                                                    v.status === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                }`}>
                                                    {v.status}
                                                </div>
                                                <ShieldCheck className="w-4 h-4 text-slate-700" />
                                            </div>
                                            <span className="text-lg font-black text-white font-mono italic tracking-tighter">
                                                {v.scheduled_date ? new Date(v.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'}
                                            </span>
                                        </div>
                                        <h4 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors uppercase italic tracking-tighter mb-2">{v.visit_type}</h4>
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                            <p className="text-[12px] text-slate-500 font-bold uppercase tracking-widest italic">
                                                Subject ID: <span className="text-slate-300 ml-1">{v.participant}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-10 md:p-12 bg-white/[0.02] flex justify-end">
                                <button 
                                    onClick={() => setSelectedDayVisits(null)}
                                    className="px-12 py-4 bg-blue-600 text-white rounded-[1.5rem] text-[12px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                                >
                                    Dismiss Dossier
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
