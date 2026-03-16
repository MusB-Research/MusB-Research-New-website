import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Calendar as CalendarIcon, 
    Clock, 
    User, 
    ChevronLeft, 
    ChevronRight, 
    Plus,
    Video,
    MapPin,
    MoreHorizontal,
    CheckCircle2
} from 'lucide-react';

export default function SchedulingModule() {
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                        Clinical <span className="text-cyan-400">Scheduling</span>
                    </h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 italic">
                        Coordinator Availability & Subject Visit Management
                    </p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-2">
                         Coordinator Sync
                    </button>
                    <button className="px-8 py-4 bg-cyan-500 text-slate-950 rounded-[2rem] text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3 shadow-xl shadow-cyan-500/20">
                        <Plus className="w-4 h-4" /> Book New Visit
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Left: Calendar View */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">March 2026</h3>
                                <div className="flex gap-2">
                                    <button className="p-2 bg-white/5 border border-white/10 rounded-xl hover:text-cyan-400 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                                    <button className="p-2 bg-white/5 border border-white/10 rounded-xl hover:text-cyan-400 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {['Day', 'Week', 'Month'].map(v => (
                                    <button key={v} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${v === 'Week' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white transition-all'}`}>{v}</button>
                                ))}
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-6 border-l border-t border-white/5">
                            <div className="border-r border-b border-white/5 p-4 bg-white/5 group">
                                <span className="text-[10px] font-black text-slate-700 uppercase">GMT-5</span>
                            </div>
                            {days.map(d => (
                                <div key={d} className="border-r border-b border-white/5 p-4 text-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{d}</span>
                                </div>
                            ))}

                            {hours.map(h => (
                                <React.Fragment key={h}>
                                    <div className="border-r border-b border-white/5 p-4 text-right">
                                        <span className="text-[10px] font-black text-slate-700 uppercase">{h}</span>
                                    </div>
                                    {days.map(d => (
                                        <div key={`${h}-${d}`} className="border-r border-b border-white/5 p-1 relative h-20 group">
                                            {h === '10:00' && d === 'Tue' && (
                                                <div className="absolute inset-1 bg-cyan-500/20 border-l-4 border-cyan-500 rounded-xl p-3 z-10 cursor-pointer hover:bg-cyan-500/30 transition-all overflow-hidden group/item">
                                                    <p className="text-[8px] font-black text-cyan-400 uppercase truncate">Miller - Screening</p>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Video className="w-2.5 h-2.5 text-cyan-500/50" />
                                                        <span className="text-[7px] font-bold text-slate-400 uppercase">Remote</span>
                                                    </div>
                                                </div>
                                            )}
                                            {h === '14:00' && d === 'Thu' && (
                                                <div className="absolute inset-1 bg-indigo-500/20 border-l-4 border-indigo-500 rounded-xl p-3 z-10 cursor-pointer hover:bg-indigo-500/30 transition-all group/item">
                                                    <p className="text-[8px] font-black text-indigo-400 uppercase truncate">Thompson - Follow-up</p>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <MapPin className="w-2.5 h-2.5 text-indigo-500/50" />
                                                        <span className="text-[7px] font-bold text-slate-400 uppercase">Site 01</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Availability & Queue */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Coordinator Availability */}
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 space-y-6">
                        <h4 className="text-sm font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                            <Clock className="w-4 h-4 text-cyan-400" />
                            Active <span className="text-cyan-400">Availability</span>
                        </h4>
                        <div className="space-y-4">
                            {[
                                { name: 'Dr. Emily Vance', role: 'Lead PI', status: 'Online' },
                                { name: 'Sarah Zhang', role: 'Coordinator', status: 'Busy' },
                                { name: 'Mike Ross', role: 'CRA', status: 'Online' },
                            ].map(person => (
                                <div key={person.name} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-slate-500">
                                            {person.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase italic tracking-tight">{person.name}</p>
                                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{person.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${person.status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'}`} />
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{person.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-white hover:text-slate-950 transition-all italic">Manage Working Hours</button>
                    </div>

                    {/* Today's Queue */}
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                Today's <span className="text-emerald-400">Queue</span>
                            </h4>
                            <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/10 italic">02 Active</span>
                        </div>
                        <div className="space-y-3">
                            {[
                                { name: 'Sarah Miller', type: 'Screening', staff: 'Emily Vance', status: 'In Progress' },
                                { name: 'David Cho', type: 'Follow-up', staff: 'Sarah Zhang', status: 'Arriving' },
                            ].map((item, i) => (
                                <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-cyan-500/30 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[11px] font-black text-white uppercase italic tracking-tight">{item.name}</p>
                                        <span className="text-[11px] font-black text-cyan-400 italic">2:30 PM</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                                        <span>{item.type}</span>
                                        <span>w/ {item.staff}</span>
                                    </div>
                                    <button className="w-full py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-slate-950 transition-all">Check In</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
