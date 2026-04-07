import React from 'react';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';
import { Ticket } from '../SupportConstants';

interface TicketListProps {
    filteredTickets: Ticket[];
    selectedId: string;
    setSelectedId: (id: string) => void;
}

export const TicketList: React.FC<TicketListProps> = ({ filteredTickets, selectedId, setSelectedId }) => {
    return (
        <div className="w-[380px] border-r border-white/5 flex flex-col overflow-hidden bg-white/[0.01]">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest italic">{filteredTickets.length} ACTIVE INCIDENTS</span>
                <button className="p-2 text-slate-500 hover:text-white transition-colors"><Filter className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                {filteredTickets.map(t => (
                    <button 
                        key={t.id}
                        onClick={() => setSelectedId(t.id)}
                        className={`w-full text-left p-6 rounded-[2rem] border transition-all relative group overflow-hidden ${
                            selectedId === t.id 
                                ? 'bg-indigo-600/10 border-indigo-500 shadow-xl shadow-indigo-500/5' 
                                : 'bg-white/5 border-white/5 hover:border-white/10'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[12px] font-black text-slate-500 font-mono tracking-widest leading-none">{t.id}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[12px] font-black uppercase tracking-tighter ${
                                t.priority === 'Urgent' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 
                                t.priority === 'High' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 
                                'bg-slate-700/50 text-slate-400 border border-white/5'
                            }`}>{t.priority}</span>
                        </div>
                        <h4 className={`text-[13px] font-black uppercase italic tracking-wider transition-all leading-tight ${selectedId === t.id ? 'text-white' : 'text-slate-400'}`}>{t.title}</h4>
                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-[12px] text-slate-600 font-bold italic line-clamp-1 uppercase tracking-tight">{t.study}</p>
                            <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${t.status === 'Open' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-slate-700'}`} />
                                <span className="text-[12px] font-black text-slate-500 uppercase italic tracking-widest">{t.status}</span>
                            </div>
                        </div>
                        {selectedId === t.id && (
                            <motion.div layoutId="active-ind" className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-500 rounded-r-full" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};


