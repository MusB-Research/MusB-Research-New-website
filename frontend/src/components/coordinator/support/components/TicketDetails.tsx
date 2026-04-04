import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Shield, FileText, User, Settings, Clock } from 'lucide-react';
import { Ticket } from '../SupportConstants';

interface TicketDetailsProps {
    selectedTicket: Ticket;
    updateTicketStatus: (status: Ticket['status']) => void;
}

export const TicketDetails: React.FC<TicketDetailsProps> = ({ selectedTicket, updateTicketStatus }) => {
    return (
        <div className="w-[380px] border-l border-white/5 flex flex-col overflow-y-auto custom-scrollbar p-10 space-y-12 bg-white/[0.02]">
            <section>
                <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-8 border-b border-white/5 pb-3 italic">Incident DNA</h4>
                <div className="space-y-6">
                    {[
                        { label: 'Incident ID', val: selectedTicket.id, icon: Lock },
                        { label: 'Affiliation', val: selectedTicket.study, icon: Shield },
                        { label: 'Category', val: selectedTicket.category, icon: FileText },
                        { label: 'Authored By', val: selectedTicket.createdBy, icon: User },
                        { label: 'Assigned To', val: selectedTicket.assignedTo, icon: Settings },
                        { label: 'Creation Epoch', val: selectedTicket.createdAt, icon: Clock }
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col gap-2 p-4 bg-white/5 border border-white/5 rounded-2xl">
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2 italic">
                                <item.icon className="w-3 h-3" /> {item.label}
                            </span>
                            <span className="text-[10px] font-black text-white uppercase italic tracking-widest">{item.val}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-8 border-b border-white/5 pb-3 italic">Operational Controls</h4>
                <div className="grid gap-3">
                    <label className="text-[8px] text-slate-700 font-bold uppercase tracking-widest mb-1 block">Governance State</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['In Progress', 'Waiting', 'Resolved', 'Escalated'].map(s => (
                            <button 
                                key={s}
                                onClick={() => updateTicketStatus(s as any)}
                                className={`px-4 py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                                    selectedTicket.status === s 
                                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' 
                                        : 'bg-white/5 text-slate-500 border-transparent hover:border-white/10'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <button className="mt-4 px-6 py-4 bg-red-600/10 border border-red-500/20 text-red-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-xl shadow-red-900/10">
                        CRITICAL ESCALATE
                    </button>
                </div>
            </section>

            <section className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[2.5rem]">
                <h5 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-4 italic">SLA Surveillance</h5>
                <div className="space-y-6">
                    <div className="relative pl-6 border-l border-indigo-500/20 space-y-6">
                        <div className="relative">
                            <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-4 border-[#0B101B]" />
                            <p className="text-[9px] font-black text-white uppercase italic">Created</p>
                            <p className="text-[8px] text-slate-700 mt-1 uppercase italic">{selectedTicket.createdAt}</p>
                        </div>
                        <div className="relative">
                            <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-indigo-500 border-4 border-[#0B101B]" />
                            <p className="text-[9px] font-black text-white uppercase italic">First Response</p>
                            <p className="text-[8px] text-slate-700 mt-1 uppercase italic">Within 2 Hours</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
