import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, History, Send, Paperclip, AlertCircle } from 'lucide-react';
import { Ticket } from '../SupportConstants';

interface TicketChatProps {
    selectedTicket: Ticket;
    messageInput: string;
    setMessageInput: (val: string) => void;
    handleSendMessage: () => void;
    isFlagged: boolean;
    setIsFlagged: (val: boolean) => void;
    hasAttachment: boolean;
    setHasAttachment: (val: boolean) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const TicketChat: React.FC<TicketChatProps> = ({ 
    selectedTicket, messageInput, setMessageInput, handleSendMessage,
    isFlagged, setIsFlagged, hasAttachment, setHasAttachment, fileInputRef
}) => {
    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0B101B] relative">
            <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                        <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white italic uppercase tracking-wider">{selectedTicket.title}</h3>
                        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mt-1">
                            {selectedTicket.category} Incident Hub • Participant #{selectedTicket.participantId || 'N/A'}
                        </p>
                    </div>
                </div>
                <button className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-2">
                    <History className="w-4 h-4" /> Audit Log
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8 scroll-smooth">
                {selectedTicket.messages.map((m, i) => (
                    <div key={m.id} className={`flex flex-col ${m.role === 'Principal Investigator' || m.role === 'Coordinator' ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-3 mb-2 px-1">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">{m.sender}</span>
                            <span className="text-[8px] font-black text-slate-800 uppercase italic">{m.role}</span>
                            <span className="text-[7px] text-slate-900 font-mono tracking-tighter">{m.timestamp}</span>
                        </div>
                        <div className={`p-6 rounded-[2rem] max-w-[80%] border ${
                            m.role === 'Principal Investigator' || m.role === 'Coordinator'
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-600/10 rounded-tr-none' 
                                : 'bg-white/5 text-slate-300 border-white/10 rounded-tl-none'
                        }`}>
                            <p className="text-sm font-black leading-relaxed uppercase tracking-tight italic">{m.content}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-8 bg-white/[0.01] border-t border-white/5">
                <div className="bg-[#0B101B] border border-white/10 rounded-[2.5rem] p-4 flex flex-col gap-4 focus-within:border-indigo-500/50 transition-all">
                    <textarea 
                        placeholder="Type your strategic response..." 
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className="w-full bg-transparent p-4 text-sm text-white placeholder-slate-800 outline-none resize-none font-black uppercase tracking-tight h-24"
                    />
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex gap-2 relative">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={(e) => setHasAttachment(!!e.target.files?.length)}
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className={`p-3 border rounded-2xl transition-all active:scale-90 relative ${hasAttachment ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/10 text-slate-600 hover:text-white'}`}
                            >
                                <Paperclip className="w-5 h-5" />
                                {hasAttachment && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-[#0B101B]" />}
                            </button>
                            <button 
                                onClick={() => setIsFlagged(!isFlagged)}
                                className={`p-3 border rounded-2xl transition-all active:scale-90 ${isFlagged ? 'bg-red-500/20 border-red-500 text-red-500 shadow-lg shadow-red-500/10' : 'bg-white/5 border-white/10 text-slate-600 hover:text-white'}`}
                            >
                                <AlertCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex gap-4">
                            <button className="px-6 py-3 text-[9px] font-black text-slate-700 uppercase tracking-widest hover:text-white transition-colors">Clear</button>
                            <button 
                                onClick={handleSendMessage}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-indigo-900/40 hover:scale-105 transition-all flex items-center gap-2"
                            >
                                Send Response <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
