import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
    ArrowRight,
    User,
    Mail,
    Phone,
    FileText,
    Play
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
    location_address?: string;
    checklist?: any[];
    assessments?: any[];
    measurements?: Record<string, any>;
    scheduled_by_details?: {
        full_name?: string;
        email?: string;
        phone?: string;
        decrypted_name?: string;
        decrypted_phone?: string;
    };
    pi_details?: {
        name: string;
        email: string;
        phone: string;
        role: string;
    };
    coordinator_details?: {
        name: string;
        email: string;
        phone: string;
        role: string;
    };
}

const VisitsView = ({ visits = [], study, tasks = [], isLoading = false, onAction }: { visits: Visit[]; study: any; tasks: any[]; isLoading?: boolean; onAction?: (type: string, task?: any) => void }) => {
    const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

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
            sessionsByDate[dateStr].push({ 
                type: 'VISIT', 
                label: v.visit_type, 
                status: v.status, 
                time: formatTime(v.scheduled_date),
                raw: v 
            });
        });

        tasks.forEach(t => {
            if (t.due_date) {
                const dateStr = new Date(t.due_date).toISOString().split('T')[0];
                if (!sessionsByDate[dateStr]) sessionsByDate[dateStr] = [];
                sessionsByDate[dateStr].push({ 
                    type: 'TASK', 
                    label: t.title, 
                    status: t.status, 
                    time: formatTime(t.due_date),
                    raw: t 
                });
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
                        <div key={d} className="bg-[#F8FBFF] p-4 sm:p-5 text-[10px] sm:text-[11px] font-bold text-[#5F6F89] uppercase tracking-[0.2em] text-center border-b border-[#E3ECF5]">
                            {d}
                        </div>
                    ))}
                    {Array.from({ length: 42 }).map((_, i) => {
                        const dayNum = i - firstDay + 1;
                        const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                        const isToday = dayNum === new Date().getDate() && viewDate.getMonth() === new Date().getMonth() && viewDate.getFullYear() === new Date().getFullYear();
                        
                        const dateStr = isCurrentMonth ? new Date(viewDate.getFullYear(), viewDate.getMonth(), dayNum).toISOString().split('T')[0] : '';
                        const daySessions = sessionsByDate[dateStr] || [];
                        const displaySessions = daySessions.slice(0, 3);
                        const remainingCount = daySessions.length - 3;

                        return (
                            <div 
                                key={i} 
                                onClick={() => isCurrentMonth && daySessions.length > 0 && setSelectedDay(dateStr)}
                                className={`min-h-[140px] sm:min-h-[160px] bg-white p-2 sm:p-4 transition-all hover:bg-[#F8FBFF] relative flex flex-col cursor-pointer group ${!isCurrentMonth ? 'bg-[#FDFDFD]/30' : ''}`}
                            >
                                {isCurrentMonth && (
                                    <div className="flex justify-between items-start mb-2 sm:mb-3">
                                        <span className={`text-[12px] sm:text-sm font-bold ${isToday ? 'bg-[#1E88E5] text-white w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full' : 'text-[#5F6F89]'}`}>
                                            {dayNum}
                                        </span>
                                    </div>
                                )}
                                <div className="space-y-1 sm:space-y-1.5 flex-1">
                                    {isCurrentMonth && displaySessions.map((s, idx) => (
                                        <div key={idx} className={`px-2 py-1 rounded-md border text-[8px] sm:text-[9px] font-bold uppercase tracking-tight flex items-center gap-1.5 truncate shadow-sm ${
                                            s.type === 'VISIT' ? 'bg-[#E3F2FD] border-[#1E88E5]/20 text-[#1E88E5]' : 'bg-[#E8F5E9] border-[#4CAF50]/20 text-[#2E7D32]'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.type === 'VISIT' ? 'bg-[#1E88E5]' : 'bg-[#4CAF50]'}`} />
                                            <span className="truncate">{s.label}</span>
                                        </div>
                                    ))}
                                    {isCurrentMonth && remainingCount > 0 && (
                                        <div className="text-[9px] font-bold text-[#1E88E5] px-2 py-1 uppercase tracking-widest bg-[#E3F2FD]/50 rounded-md">
                                            + {remainingCount} more events
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Day Detail Modal via Portal */}
                {selectedDay && createPortal(
                    <AnimatePresence>
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-[#1A2B49]/40 backdrop-blur-sm"
                                onClick={() => setSelectedDay(null)}
                            />
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="relative w-full max-w-[500px] bg-white rounded-[32px] shadow-2xl overflow-hidden border border-[#E3ECF5]"
                            >
                                <div className="p-8 border-b border-[#E3ECF5] bg-[#F8FBFF] flex items-center justify-between">
                                    <div>
                                        <p className="text-[11px] font-bold text-[#1E88E5] uppercase tracking-[0.2em] mb-1">Schedule Details</p>
                                        <h3 className="text-xl font-bold text-[#1A2B49] uppercase tracking-tight">{new Date(selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedDay(null)}
                                        className="p-3 bg-white border border-[#E3ECF5] text-[#5F6F89] rounded-2xl hover:text-[#D32F2F] hover:bg-[#FDECEA] transition-all shadow-sm"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar space-y-4">
                                    {sessionsByDate[selectedDay]?.map((s, idx) => (
                                        <div key={idx} className={`p-5 rounded-2xl border transition-all hover:shadow-md ${s.type === 'VISIT' ? 'bg-[#F8FBFF] border-[#E3F2FD]' : 'bg-[#FAFAFA] border-[#E3ECF5]'}`}>
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${s.type === 'VISIT' ? 'bg-[#1E88E5]' : 'bg-[#4CAF50]'}`}>
                                                        {s.type === 'VISIT' ? <Calendar className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest">{s.type}</p>
                                                        <h5 className="text-[15px] font-bold text-[#1A2B49] uppercase tracking-tight leading-tight">{s.label}</h5>
                                                    </div>
                                                </div>
                                                <Badge color={s.status === 'COMPLETED' ? 'green' : (s.status === 'MISSED' ? 'red' : 'blue')}>
                                                    {s.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E3ECF5]/50">
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-[#5F6F89] uppercase">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {s.time}
                                                </div>
                                                {s.type === 'TASK' && (
                                                    <button 
                                                        onClick={() => { setSelectedDay(null); onAction?.('START_TASK', s.raw); }}
                                                        className="flex items-center gap-1.5 text-[11px] font-bold text-[#1E88E5] uppercase hover:underline"
                                                    >
                                                        <Play className="w-3 h-3 fill-current" /> Go to Task
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-6 bg-[#F8FBFF] border-t border-[#E3ECF5] text-center">
                                    <p className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest">Protocol Version 4.2 • Clinical Integrity Log</p>
                                </div>
                            </motion.div>
                        </div>
                    </AnimatePresence>,
                    document.body
                )}
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
                                                <div className="pt-6 border-t border-[#F8FBFF] flex flex-col gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <MapPin className="w-4.5 h-4.5 text-[#1E88E5]" />
                                                        <div className="space-y-0.5">
                                                            <span className="text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest">{visit.location || 'Protocol Site Alpha'}</span>
                                                            {visit.location_address && (
                                                                <p className="text-[11px] text-[#5F6F89] font-medium">{visit.location_address}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {(() => {
                                                        const { pi_details, coordinator_details, scheduled_by_details } = visit;
                                                        
                                                        // Render Staff Card Helper
                                                        const StaffEntry = ({ person, secondary = false }: { person: any, secondary?: boolean }) => {
                                                            if (!person) return null;
                                                            const name = person.name || person.decrypted_name || person.full_name || 'Protocol Staff';
                                                            const role = person.role || (secondary ? 'Secondary Contact' : 'Coordinator');
                                                            
                                                            return (
                                                                <div className={`p-4 rounded-2xl border transition-all ${secondary ? 'bg-white border-[#E3ECF5]' : 'bg-[#F8FBFF] border-[#1E88E5]/20'}`}>
                                                                    <div className="flex items-start gap-3">
                                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-[12px] shadow-sm uppercase ${secondary ? 'bg-[#F8FBFF] text-[#5F6F89] border border-[#E3ECF5]' : 'bg-[#1E88E5] text-white'}`}>
                                                                            {name.charAt(0)}
                                                                        </div>
                                                                        <div className="space-y-1 flex-1">
                                                                            <div className="flex items-center justify-between">
                                                                                <p className="text-[13px] font-bold text-[#1A2B49] uppercase tracking-tight">{name}</p>
                                                                                <Badge color={secondary ? 'slate' : 'blue'}>{role}</Badge>
                                                                            </div>
                                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-[#5F6F89]">
                                                                                {person.email && (
                                                                                    <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#1E88E5]/70" /> {person.email}</div>
                                                                                )}
                                                                                {(person.phone || person.decrypted_phone) && (
                                                                                    <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#1E88E5]/70" /> {person.phone || person.decrypted_phone}</div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        };

                                                        return (
                                                            <div className="pt-6 border-t border-[#F8FBFF] space-y-4">
                                                                <h4 className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest flex items-center gap-2">
                                                                    <User className="w-3.5 h-3.5 text-[#1E88E5]" />
                                                                    Clinical Care Team
                                                                </h4>
                                                                <div className="space-y-3">
                                                                    {pi_details ? <StaffEntry person={pi_details} /> : (study?.assigned_pis?.[0] && <StaffEntry person={study.assigned_pis[0]} />)}
                                                                    {coordinator_details ? <StaffEntry person={coordinator_details} secondary={!!pi_details} /> : (study?.assigned_coordinators?.[0] && <StaffEntry person={study.assigned_coordinators[0]} secondary={true} />)}
                                                                    {!pi_details && !coordinator_details && !study?.assigned_pis?.[0] && !study?.assigned_coordinators?.[0] && scheduled_by_details && <StaffEntry person={scheduled_by_details} />}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
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
