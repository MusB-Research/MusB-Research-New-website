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
    X,
    ArrowLeft,
    ArrowRight
} from 'lucide-react';
import { Card, Badge, Skeleton } from './SharedComponents';

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

    const sortedVisits = useMemo(() => 
        [...visits].sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()),
    [visits]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <Badge color="green">COMPLETED</Badge>;
            case 'SCHEDULED': return <Badge color="blue">SCHEDULED</Badge>;
            case 'IN_PROGRESS': return <Badge color="blue">IN PROGRESS</Badge>;
            case 'MISSED': return <Badge color="red">MISSED</Badge>;
            case 'CANCELLED': return <Badge color="slate">CANCELLED</Badge>;
            default: return <Badge color="slate">{status}</Badge>;
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
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
        const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        const firstDay = d.getDay();
        const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
        
        const sessionsByDate: Record<string, any[]> = {};
        
        visits.forEach(v => {
            const dateStr = new Date(v.scheduled_date).toISOString().split('T')[0];
            if (!sessionsByDate[dateStr]) sessionsByDate[dateStr] = [];
            sessionsByDate[dateStr].push({ type: 'VISIT', label: v.visit_type, status: v.status });
        });

        tasks.forEach(t => {
            if (t.due_date) {
                const dateStr = new Date(t.due_date).toISOString().split('T')[0];
                if (!sessionsByDate[dateStr]) sessionsByDate[dateStr] = [];
                sessionsByDate[dateStr].push({ type: 'TASK', label: t.title, status: t.status });
            }
        });

        return { daysInMonth, firstDay, sessionsByDate };
    }, [viewDate, visits, tasks]);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-10 animate-pulse">
                <div className="flex justify-between items-end">
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-64" />
                    </div>
                </div>
                <div className="space-y-8">
                    {[1, 2].map(i => <Skeleton key={i} className="h-64 rounded-[32px]" />)}
                </div>
            </div>
        );
    }

    const renderCalendar = () => {
        const { daysInMonth, firstDay, sessionsByDate } = calendarData;
        const monthYear = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        return (
            <div className="flex-1 flex flex-col space-y-8">
                <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-[#E3ECF5]">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-[#1A2B49] uppercase tracking-tight">Clinical Availability</h2>
                        <p className="text-[12px] text-[#5F6F89] font-bold uppercase tracking-widest">{monthYear}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-[#F8FBFF] p-1.5 rounded-xl border border-[#E3ECF5]">
                        <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-2.5 hover:bg-white rounded-lg text-[#5F6F89] transition-all shadow-sm">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[13px] font-bold text-[#1A2B49] px-6 uppercase tracking-widest">{monthYear}</span>
                        <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-2.5 hover:bg-white rounded-lg text-[#5F6F89] transition-all shadow-sm">
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-px bg-[#E3ECF5] border border-[#E3ECF5] rounded-[32px] overflow-hidden shadow-xl bg-white">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="bg-[#F8FBFF] p-5 text-[11px] font-bold text-[#5F6F89] uppercase tracking-[0.2em] text-center border-b border-[#E3ECF5]">
                            {d}
                        </div>
                    ))}
                    {Array.from({ length: 42 }).map((_, i) => {
                        const dayNum = i - firstDay + 1;
                        const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                        const isToday = dayNum === new Date().getDate() && viewDate.getMonth() === new Date().getMonth() && viewDate.getFullYear() === new Date().getFullYear();
                        
                        const dateStr = isCurrentMonth ? new Date(viewDate.getFullYear(), viewDate.getMonth(), dayNum).toISOString().split('T')[0] : '';
                        const daySessions = sessionsByDate[dateStr] || [];

                        return (
                            <div key={i} className={`min-h-[140px] bg-white p-4 transition-all hover:bg-[#F8FBFF] relative ${!isCurrentMonth ? 'bg-[#FDFDFD]/50' : ''}`}>
                                {isCurrentMonth && (
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`text-sm font-bold ${isToday ? 'bg-[#1E88E5] text-white w-7 h-7 flex items-center justify-center rounded-full' : 'text-[#5F6F89]'}`}>
                                            {dayNum}
                                        </span>
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    {isCurrentMonth && daySessions.map((s, idx) => (
                                        <div key={idx} className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-tight truncate flex items-center gap-1.5 shadow-sm ${
                                            s.type === 'VISIT' ? 'bg-[#E3F2FD] border-[#1E88E5]/20 text-[#1E88E5]' : 'bg-[#E8F5E9] border-[#4CAF50]/20 text-[#2E7D32]'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${s.type === 'VISIT' ? 'bg-[#1E88E5]' : 'bg-[#4CAF50]'}`} />
                                            {s.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-10 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest mb-1">
                        <span>Portal</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-[#1E88E5]">Engagement Timeline</span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#1A2B49] uppercase tracking-tight">Protocol Schedule</h2>
                    <p className="text-[13px] font-bold text-[#5F6F89] uppercase tracking-widest">Coordinated Clinical Assessment & Event Log</p>
                </div>

                <div className="flex bg-white p-1 rounded-xl border border-[#E3ECF5] shadow-sm">
                    <button 
                        onClick={() => setViewMode('timeline')}
                        className={`px-6 py-2.5 rounded-lg text-[12px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'timeline' ? 'bg-[#1E88E5] text-white shadow-md' : 'text-[#5F6F89] hover:text-[#1E88E5]'}`}
                    >
                        <LayoutGrid className="w-4 h-4" /> Timeline
                    </button>
                    <button 
                        onClick={() => setViewMode('calendar')}
                        className={`px-6 py-2.5 rounded-lg text-[12px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-[#1E88E5] text-white shadow-md' : 'text-[#5F6F89] hover:text-[#1E88E5]'}`}
                    >
                        <Calendar className="w-4 h-4" /> Grid Calendar
                    </button>
                </div>
            </div>

            {viewMode === 'timeline' ? (
                <div className="relative pt-4">
                    {/* Vertical Bridge */}
                    <div className="absolute left-[34px] top-0 bottom-10 w-0.5 bg-gradient-to-b from-[#1E88E5]/40 via-[#E3ECF5] to-transparent hidden md:block" />

                    <div className="space-y-10 relative">
                        {sortedVisits.length > 0 ? (
                            sortedVisits.map((visit, index) => (
                                <motion.div
                                    key={visit.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative md:pl-24"
                                >
                                    {/* Medical Marker */}
                                    <div className="absolute left-[26px] top-12 w-4 h-4 rounded-full border-4 border-white bg-[#1E88E5] shadow-lg z-10 hidden md:block" />

                                    <Card className="p-8 bg-white border border-[#E3ECF5] shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                                        <div className="flex flex-col lg:flex-row gap-10">
                                            {/* Phase Info */}
                                            <div className="lg:w-[280px] space-y-6">
                                                <div className="flex items-start justify-between lg:block lg:space-y-4">
                                                    {getStatusBadge(visit.status)}
                                                    <div className="space-y-1.5 px-0.5">
                                                        <h3 className="text-xl font-bold text-[#1A2B49] uppercase tracking-tight group-hover:text-[#1E88E5] transition-colors">
                                                            {visit.visit_type.replace(/_/g, ' ')}
                                                        </h3>
                                                        <div className="flex items-center gap-2.5 text-[#5F6F89]">
                                                            <div className="w-8 h-8 rounded-lg bg-[#F8FBFF] flex items-center justify-center border border-[#E3ECF5]">
                                                                <Clock className="w-4 h-4" />
                                                            </div>
                                                            <span className="text-[13px] font-bold uppercase tracking-widest">{formatTime(visit.scheduled_date)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="pt-6 border-t border-[#F8FBFF] flex items-center gap-3">
                                                    <MapPin className="w-4.5 h-4.5 text-[#1E88E5]" />
                                                    <span className="text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest">{visit.location || 'Protocol Site Alpha'}</span>
                                                </div>
                                            </div>

                                            {/* Data Points */}
                                            <div className="flex-1 space-y-8">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="bg-[#F8FBFF] border border-[#E3ECF5] rounded-2xl p-6 space-y-3">
                                                        <div className="flex items-center gap-2 text-[#5F6F89]">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">Scheduled Event</span>
                                                        </div>
                                                        <p className="text-lg font-bold text-[#1A2B49] uppercase tracking-tight">{formatDate(visit.scheduled_date)}</p>
                                                    </div>
                                                    <div className="bg-[#F8FBFF] border border-[#E3ECF5] rounded-2xl p-6 space-y-3">
                                                        <div className="flex items-center gap-2 text-[#5F6F89]">
                                                            <ClipboardList className="w-3.5 h-3.5" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">Sequence ID</span>
                                                        </div>
                                                        <p className="text-lg font-bold text-[#1E88E5] uppercase tracking-tight">Phase {index + 1} Assessment</p>
                                                    </div>
                                                </div>

                                                {visit.checklist && visit.checklist.length > 0 && (
                                                    <div className="space-y-4">
                                                        <h4 className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest flex items-center gap-2">
                                                            <Activity className="w-3.5 h-3.5" />
                                                            Required Protocol Steps
                                                        </h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {visit.checklist.map((item, idx) => (
                                                                <div key={idx} className="flex items-center gap-3 p-4 bg-white border border-[#E3ECF5] rounded-xl shadow-inner-sm">
                                                                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${item.done ? 'bg-[#4CAF50] border-[#4CAF50] text-white' : 'bg-[#F8FBFF] border-[#E3ECF5] text-transparent'}`}>
                                                                        <Check className="w-3.5 h-3.5" />
                                                                    </div>
                                                                    <span className={`text-[12px] font-bold uppercase tracking-tight ${item.done ? 'text-[#1A2B49]' : 'text-[#5F6F89]'}`}>{item.item}</span>
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
                            <div className="text-center py-24 bg-white border border-[#E3ECF5] rounded-[40px] shadow-sm">
                                <CalendarClock className="w-16 h-16 text-[#E3ECF5] mx-auto mb-6" />
                                <h3 className="text-xl font-bold text-[#1A2B49] uppercase tracking-tight">No Events Synchronized</h3>
                                <p className="text-[#5F6F89] mt-2 uppercase text-[11px] font-bold tracking-[0.2em]">Contact your coordinator for schedule updates</p>
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
