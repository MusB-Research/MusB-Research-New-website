import React from 'react';
import { motion } from 'framer-motion';
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
    Check
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

const VisitsView = ({ visits = [], study }: { visits: Visit[]; study: any }) => {
    // Sort visits by scheduled date
    const sortedVisits = [...visits].sort((a, b) => 
        new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'SCHEDULED': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
            case 'IN_PROGRESS': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
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

    return (
        <div className="flex flex-col gap-10 max-w-[1500px] animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400">
                            <CalendarClock className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Clinical <span className="text-cyan-400">Calendar</span></h2>
                            <p className="text-[12px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1 italic">Protocol Timeline & Visit Oversight</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visits Timeline */}
            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-gradient-to-b from-cyan-500/50 via-indigo-500/20 to-transparent hidden md:block" />

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
                                <div className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-[#0a0e1a] bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)] z-10 hidden md:block" />

                                <Card className={`p-8 bg-[#0d1424] border-white/5 hover:border-cyan-500/30 transition-all group overflow-hidden`}>
                                    {/* Sub-bg glow */}
                                    <div className={`absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none rounded-full blur-[100px] ${visit.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-cyan-500'}`} />

                                    <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                                        {/* Left: Date & Status */}
                                        <div className="lg:w-1/3 flex flex-col justify-between">
                                            <div className="space-y-4">
                                                <Badge className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border ${getStatusStyle(visit.status)}`}>
                                                    {visit.status.replace(/_/g, ' ')}
                                                </Badge>
                                                
                                                <div className="space-y-1">
                                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter group-hover:text-cyan-400 transition-colors">
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
                                                    <MapPin className="w-4 h-4 text-cyan-400" />
                                                    <span className="text-[12px] font-black uppercase tracking-widest italic">{visit.location || 'Clinical Site Alpha'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Details & Summary */}
                                        <div className="flex-1 space-y-8">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
                                                    <div className="flex items-center gap-3 text-white/40">
                                                        <Calendar className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Scheduled Date</span>
                                                    </div>
                                                    <p className="text-lg font-black text-white italic uppercase tracking-tight">
                                                        {formatDate(visit.scheduled_date)}
                                                    </p>
                                                </div>

                                                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
                                                    <div className="flex items-center gap-3 text-white/40">
                                                        <ClipboardList className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Protocol Phase</span>
                                                    </div>
                                                    <p className="text-lg font-black text-indigo-400 italic uppercase tracking-tight">
                                                        Phase {index + 1} Assessment
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Notes / Assessments Preview */}
                                            {visit.status === 'COMPLETED' ? (
                                                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6">
                                                    <div className="flex items-center gap-3 mb-4 text-emerald-400">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Visit Data Synchronized</h4>
                                                    </div>
                                                    <p className="text-[13px] text-slate-400 font-bold leading-relaxed italic">
                                                        Assessments and clinical data from this visit have been processed. Results are being reviewed by the Principal Investigator.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="bg-white/[0.01] border border-white/[0.03] rounded-3xl p-6">
                                                    <div className="flex items-center gap-3 mb-4 text-cyan-400">
                                                        <Info className="w-5 h-5" />
                                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Patient Preparation</h4>
                                                    </div>
                                                    <ul className="space-y-3">
                                                        {[
                                                            "Fast for 8 hours prior to appointment",
                                                            "Bring current study medications/kits",
                                                            "Arrive 15 minutes early for onboarding"
                                                        ].map((item, i) => (
                                                            <li key={i} className="flex items-center gap-3 text-[12px] font-bold text-slate-500 italic">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/40" />
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))
                    ) : (
                        /* Empty State */
                        <Card className="p-20 bg-[#0d1424] border-white/5 text-center flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-slate-700 mb-8 border border-white/5">
                                <Activity className="w-10 h-10 opacity-20" />
                            </div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">No Scheduled Visits</h3>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm max-w-md mx-auto italic leading-relaxed">
                                Your clinical visit schedule will appear here once finalized by the coordination team.
                            </p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VisitsView;
