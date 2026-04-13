import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    MapPin,
    ChevronRight,
    CheckCircle2,
    CalendarClock,
    ClipboardList,
    Stethoscope,
    Activity,
    Info,
    Check,
    ChevronDown,
    LayoutGrid,
    Search,
    Plus,
    X
} from 'lucide-react';
import { Card, Badge } from './SharedComponents';

interface Visit {
    id: string;
    visit_type: string;
    scheduled_date: string;
    actual_date?: string;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
    notes?: string;
    location: string;
    checklist?: any[];
    assessments?: any[];
    measurements?: Record<string, any>;
}

const VisitsView = ({ visits = [], study, tasks = [], isLoading = false }: { visits: Visit[]; study: any; tasks: any[]; isLoading?: boolean }) => {
    const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
    const [viewDate, setViewDate] = useState(new Date());

    // Sort visits by scheduled date for timeline
    const sortedVisits = useMemo(() => 
        [...visits].sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()),
    [visits]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'SCHEDULED': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'IN_PROGRESS': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'MISSED': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'CANCELLED': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            default: return 'bg-white/5 text-slate-400 border-white/10';
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calendarData = useMemo(() => {
        const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
        const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
        
        const sessionsByDate: Record<string, any[]> = {};
        
        // Map Visits
        visits.forEach(v => {
            const d = new Date(v.scheduled_date).toISOString().split('T')[0];
            if (!sessionsByDate[d]) sessionsByDate[d] = [];
            sessionsByDate[d].push({ type: 'VISIT', label: v.visit_type, status: v.status });
        });

        // Map Tasks
        tasks.forEach(t => {
            if (t.due_date) {
                const d = new Date(t.due_date).toISOString().split('T')[0];
                if (!sessionsByDate[d]) sessionsByDate[d] = [];
                sessionsByDate[d].push({ type: 'TASK', label: t.title, status: t.status });
            }
        });

        return { daysInMonth, firstDay, sessionsByDate };
    }, [viewDate, visits, tasks]);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-10 max-w-[1500px] animate-pulse">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl" />
                        <div className="space-y-2">
                            <div className="h-8 w-64 bg-white/10 rounded-xl" />
                            <div className="h-3 w-48 bg-white/5 rounded-full" />
                        </div>
                    </div>
                </div>
                <div className="space-y-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-white/5 border border-white/5 rounded-[3rem]" />
                    ))}
                </div>
            </div>
        );
    }

    const renderCalendar = () => {
        const { daysInMonth, firstDay, sessionsByDate } = calendarData;
        const monthYear = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        return (
            <div className="flex-1 flex flex-col space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Protocol <span className="text-amber-500">Calendar</span></h2>
                        <p className="text-[12px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1 italic">{monthYear} • All Activities Synchronized</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                        <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-3 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white">
                            <ChevronDown className="w-5 h-5 rotate-90" />
                        </button>
                        <span className="text-sm font-black text-white px-6 uppercase italic tracking-widest">{monthYear}</span>
                        <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-3 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white">
                            <ChevronDown className="w-5 h-5 -rotate-90" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="bg-[#0B101B] p-6 text-[12px] font-black text-slate-500 uppercase tracking-widest text-center border-b border-white/5 italic">
                            {d}
                        </div>
                    ))}
                    {Array.from({ length: 42 }).map((_, i) => {
                        const dayNum = i - firstDay + 1;
                        const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                        const dateString = isCurrentMonth ? new Date(viewDate.getFullYear(), viewDate.getMonth(), dayNum).toISOString().split('T')[0] : '';
                        const daySessions = sessionsByDate[dateString] || [];

                        return (
                            <div 
                                key={i} 
                                className={`min-h-[140px] bg-[#090E1A] p-4 border-r border-b border-white/[0.03] transition-all hover:bg-white/[0.02] ${!isCurrentMonth ? 'opacity-20' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`text-lg font-black italic ${dayNum === new Date().getDate() && viewDate.getMonth() === new Date().getMonth() ? 'text-amber-500' : 'text-slate-700'}`}>
                                        {isCurrentMonth ? dayNum : ''}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {daySessions.slice(0, 3).map((s, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`p-2 rounded-lg border text-[10px] font-black uppercase tracking-tighter truncate ${
                                                s.type === 'VISIT' 
                                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                                                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                            }`}
                                        >
                                            <span className="opacity-50 mr-1">{s.type === 'VISIT' ? 'V:' : 'T:'}</span>
                                            {s.label}
                                        </div>
                                    ))}
                                    {daySessions.length > 3 && (
                                        <p className="text-[10px] text-slate-600 font-bold italic text-center pt-1">+{daySessions.length - 3} More</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-10 max-w-[1500px] animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500">
                        <CalendarClock className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Clinical <span className="text-amber-500">Oversight</span></h2>
                        <p className="text-[12px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1 italic">Protocol Timeline & Site Alignment</p>
                    </div>
                </div>

                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                    <button 
                        onClick={() => setViewMode('timeline')}
                        className={`px-6 py-2 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all italic flex items-center gap-2 ${viewMode === 'timeline' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" /> Timeline
                    </button>
                    <button 
                        onClick={() => setViewMode('calendar')}
                        className={`px-6 py-2 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all italic flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        <Calendar className="w-3.5 h-3.5" /> Grid Calendar
                    </button>
                </div>
            </div>

            {viewMode === 'timeline' ? (
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-gradient-to-b from-amber-500/50 via-indigo-500/20 to-transparent hidden md:block" />

                    <div className="space-y-8 relative">
                        {sortedVisits.length > 0 ? (
                            sortedVisits.map((visit, index) => (
                                <motion.div
                                    key={visit.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative md:pl-20"
                                >
                                    {/* Marker Dot */}
                                    <div className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-[#0a0e1a] bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)] z-10 hidden md:block" />

                                    <Card className={`p-8 bg-[#0d1424] border-white/5 hover:border-amber-500/30 transition-all group overflow-hidden`}>
                                        <div className={`absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none rounded-full blur-[100px] ${visit.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />

                                        <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                                            <div className="lg:w-1/3 flex flex-col justify-between">
                                                <div className="space-y-4">
                                                    <Badge className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border ${getStatusStyle(visit.status)}`}>
                                                        {visit.status.replace(/_/g, ' ')}
                                                    </Badge>
                                                    <div className="space-y-1">
                                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter group-hover:text-amber-500 transition-colors">
                                                            {visit.visit_type.replace(/_/g, ' ')}
                                                        </h3>
                                                        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {formatTime(visit.scheduled_date)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-8 pt-6 border-t border-white/5">
                                                    <div className="flex items-center gap-3 text-slate-400">
                                                        <MapPin className="w-4 h-4 text-amber-500" />
                                                        <span className="text-[12px] font-black uppercase tracking-widest italic">{visit.location || 'Clinical Site Alpha'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-8">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
                                                        <div className="flex items-center gap-3 text-white/40">
                                                            <Calendar className="w-4 h-4" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Scheduled Date</span>
                                                        </div>
                                                        <p className="text-lg font-black text-white italic uppercase tracking-tight">{formatDate(visit.scheduled_date)}</p>
                                                    </div>
                                                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
                                                        <div className="flex items-center gap-3 text-white/40">
                                                            <ClipboardList className="w-4 h-4" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Protocol Phase</span>
                                                        </div>
                                                        <p className="text-lg font-black text-amber-500 italic uppercase tracking-tight">Phase {index + 1} Assessment</p>
                                                    </div>
                                                </div>

                                                {visit.checklist && visit.checklist.length > 0 && (
                                                    <div className="space-y-4">
                                                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Checklist Progress</h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {visit.checklist.map((item, idx) => (
                                                                <div key={idx} className="flex items-center gap-3 p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                                                                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/10 text-transparent'}`}>
                                                                        <Check className="w-3.5 h-3.5" />
                                                                    </div>
                                                                    <span className="text-[12px] font-bold text-slate-300 uppercase tracking-tight">{item.item}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-20 p-8 border border-white/5 rounded-[3rem] bg-white/[0.01]">
                                <Activity className="w-12 h-12 text-slate-800 mx-auto mb-6" />
                                <h3 className="text-xl font-black text-white italic uppercase tracking-widest">No Visits Scheduled</h3>
                                <p className="text-slate-500 mt-4 uppercase text-[10px] font-black tracking-widest">Your clinical timeline is currently clear.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                renderCalendar()
            )}
        </div>
    );
};

export default React.memo(VisitsView);
