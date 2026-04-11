import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
        <div className="space-y-10 pt-4">
            {/* Minimal Header */}
            <div className="flex items-center justify-between pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Daily Status</h1>
                    <p className="text-sm text-slate-400 mt-1 font-medium opacity-50">Monitoring progress and essential tasks</p>
                </div>
                <button
                    onClick={onLaunch}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-slate-900 rounded-lg text-sm font-bold transition-all hover:bg-slate-100 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    New study
                </button>
            </div>

            {/* Simplified KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Active studies', val: studyCount, icon: Beaker, id: 'STUDIES', color: 'text-blue-400', bg: 'bg-blue-400/10' },
                    { label: 'Participants', val: stats.activeSubjects, icon: Users, id: 'PARTICIPANTS', color: 'text-slate-400', bg: 'bg-slate-400/10' },
                    { label: 'New alerts', val: stats.overdueFollowUps > 0 ? stats.overdueFollowUps.toString().padStart(2, '0') : '00', icon: Bell, id: 'ALERTS', color: 'text-rose-400', bg: 'bg-rose-400/10' },
                    { label: 'Upcoming visits', val: stats.upcomingVisits, icon: CalendarIcon, id: 'VISITS', color: 'text-amber-400', bg: 'bg-amber-400/10' },
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
                        { label: 'Late tasks', val: stats.overdueFollowUps, icon: Clock, color: 'text-rose-400', bg: 'bg-rose-400/10', sub: 'Immediate attention required' },
                        { label: 'Calls to make', val: stats.awaitingCallback, icon: Phone, color: 'text-amber-400', bg: 'bg-amber-400/10', sub: 'Pending participant outreach' },
                        { label: 'Forms to finish', val: stats.pendingForms, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10', sub: 'Incomplete study documentation' },
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
                        <h3 className="text-sm font-bold text-slate-400 tracking-widest">Visit calendar</h3>
                        <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-xl p-1">
                            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400"><ChevronLeft className="w-4 h-4" /></button>
                            <span className="text-[11px] font-bold text-white tracking-widest min-w-[140px] text-center">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="bg-[#1E293B]/20 border border-white/5 rounded-2xl p-6 overflow-hidden">
                        <div className="grid grid-cols-7 gap-1">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="text-center text-xs font-black text-slate-600 py-3 tracking-tighter uppercase">{d}</div>
                            ))}
                            {calendarDays.map((date, i) => {
                                if (!date) return <div key={i} className="aspect-square opacity-10" />;
                                const isToday = date.toDateString() === new Date().toDateString();
                                const dayVisits = getVisitsForDay(date);

                                return (
                                    <div key={i} className="aspect-[4/3] p-1 relative group">
                                        <div className={`w-full h-full rounded-xl border ${isToday ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/5 border-transparent hover:border-white/10'} flex flex-col items-center justify-center gap-1 transition-all`}>
                                            <span className={`text-xs font-bold ${isToday ? 'text-blue-400' : 'text-slate-500 group-hover:text-white'}`}>
                                                {date.getDate()}
                                            </span>
                                            {dayVisits.length > 0 && (
                                                <div className="flex gap-1">
                                                    {dayVisits.slice(0, 3).map((v, j) => (
                                                        <div key={j} className={`w-1 h-1 rounded-full ${v.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
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

                {/* What's Next Side */}
                <div className="lg:col-span-4 space-y-6">
                    <h3 className="text-sm font-bold text-slate-400 tracking-widest">What's next</h3>
                    <div className="bg-[#1E293B]/20 border border-white/5 rounded-2xl divide-y divide-white/5">
                        {visits.filter(v => v.status === 'SCHEDULED' || v.status === 'PENDING').sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()).slice(0, 5).map((v, i) => (
                            <div
                                key={i}
                                className="p-5 hover:bg-white/5 transition-colors cursor-pointer group"
                                onClick={() => onNavigate('VISITS')}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-blue-400 tracking-widest">
                                        {v.scheduled_date ? new Date(v.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Pending'}
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-500">
                                        {v.scheduled_date ? new Date(v.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                    </span>
                                </div>
                                <h5 className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors leading-none mb-1.5">{v.visit_type}</h5>
                                <p className="text-[11px] text-slate-500 font-medium">Participant: {v.participant}</p>
                            </div>
                        ))}
                        {visits.length === 0 && (
                            <div className="p-10 text-center text-slate-500 text-sm italic">No upcoming visits</div>
                        )}
                        <button
                            onClick={() => onNavigate('VISITS')}
                            className="w-full py-4 text-[10px] font-bold text-slate-500 hover:text-white tracking-[0.2em] transition-all bg-white/5 border-t border-white/5"
                        >
                            View all visits
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
