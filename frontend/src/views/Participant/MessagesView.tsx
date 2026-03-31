import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Plus, Filter, MoreHorizontal, Send, Paperclip, 
    AlertTriangle, Phone, ChevronRight, Download, Archive, 
    User, MessageSquare, Check, CheckCheck, Clock, X,
    FileText, Image as ImageIcon, ExternalLink, ShieldCheck
} from 'lucide-react';
import { Card, Badge } from './SharedComponents';

interface Message {
    id: string;
    text: string;
    sender_name: string;
    timestamp: string;
    is_from_me: boolean;
    status: 'sent' | 'delivered' | 'read';
    tag?: string;
    attachment?: {
        name: string;
        type: string;
        size: string;
    };
}

interface Thread {
    id: string;
    title: string;
    last_message: string;
    timestamp: string;
    unread_count: number;
    is_urgent: boolean;
    staff_name: string;
    staff_role: string;
    status: 'active' | 'awaiting' | 'responded';
}

const MessagesView = ({ study }: { study?: any }) => {
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>('T1');
    const [searchQuery, setSearchQuery] = useState('');
    const [isUrgentMode, setIsUrgentMode] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [isCallModalOpen, setIsCallModalOpen] = useState(false);
    const [showDetails, setShowDetails] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Mock Data
    const threads: Thread[] = useMemo(() => [
        {
            id: 'T1',
            title: 'Study Coordinator – Dosing Question',
            last_message: 'Please confirm if you took your dose today at the scheduled time.',
            timestamp: '10:32 AM',
            unread_count: 2,
            is_urgent: true,
            staff_name: 'Dr. Sarah Mitchell',
            staff_role: 'Lead Coordinator',
            status: 'active'
        },
        {
            id: 'T2',
            title: 'Lab Logistics – Kit #4920',
            last_message: 'Your shipment has been verified at the central node.',
            timestamp: 'Yesterday',
            unread_count: 0,
            is_urgent: false,
            staff_name: 'Mark Stevens',
            staff_role: 'Logistics Manager',
            status: 'responded'
        },
        {
            id: 'T3',
            title: 'Clinical Inquiry – Vital Sync',
            last_message: 'We noticed a variance in your heart rate data from last night.',
            timestamp: 'Monday',
            unread_count: 0,
            is_urgent: false,
            staff_name: 'Nurse Elena',
            staff_role: 'Clinical Staff',
            status: 'awaiting'
        }
    ], []);

    const messages: Message[] = useMemo(() => [
        {
            id: 'M1',
            text: 'Hello, I have a question about the evening dose. Should I take it with food?',
            sender_name: 'Me',
            timestamp: '09:15 AM',
            is_from_me: true,
            status: 'read'
        },
        {
            id: 'M2',
            text: 'Yes, please take the evening dose with a light meal to ensure optimal baseline stability.',
            sender_name: 'Dr. Sarah Mitchell',
            timestamp: '09:45 AM',
            is_from_me: false,
            status: 'read',
            tag: 'CLINICAL_GUIDANCE'
        },
        {
            id: 'M3',
            text: 'Understood. Initializing sync now.',
            sender_name: 'Me',
            timestamp: '10:00 AM',
            is_from_me: true,
            status: 'read'
        },
        {
            id: 'M4',
            text: 'Please confirm if you took your dose today at the scheduled time.',
            sender_name: 'Dr. Sarah Mitchell',
            timestamp: '10:32 AM',
            is_from_me: false,
            status: 'read',
            tag: 'URGENT'
        }
    ], []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const activeThread = threads.find(t => t.id === selectedThreadId);

    const handleSendMessage = () => {
        if (!messageInput.trim()) return;
        alert(`✅ Message Sent: ${messageInput}`);
        setMessageInput('');
        setIsUrgentMode(false);
    };

    return (
        <div className="h-[calc(100vh-180px)] min-h-[600px] flex gap-6 pb-4">
            {/* ──────────────── THREAD LIST (LEFT) ──────────────── */}
            <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Conversations</h3>
                        <button className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-slate-950 hover:bg-cyan-400 transition-all shadow-lg active:scale-95">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search Node..."
                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-white text-[12px] font-black uppercase tracking-widest outline-none focus:border-cyan-500/50 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                    {threads.map((thread) => (
                        <motion.div 
                            key={thread.id} 
                            onClick={() => setSelectedThreadId(thread.id)}
                            whileHover={{ x: 4 }}
                            className={`p-5 rounded-3xl border transition-all cursor-pointer relative group ${
                                selectedThreadId === thread.id 
                                    ? 'bg-cyan-500/10 border-cyan-500/30 shadow-2xl shadow-cyan-500/5' 
                                    : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                            }`}
                        >
                            {thread.is_urgent && (
                                <div className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-1 h-8 bg-red-500 rounded-r shadow-[0_0_10px_#ef4444]" />
                            )}
                            <div className="flex justify-between items-start mb-2">
                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-slate-500 group-hover:text-cyan-400 transition-colors">
                                    <User className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{thread.timestamp}</span>
                            </div>
                            <h4 className={`text-sm font-black uppercase tracking-tight mb-1 truncate ${selectedThreadId === thread.id ? 'text-white italic' : 'text-slate-400'}`}>
                                {thread.title}
                            </h4>
                            <p className="text-[12px] font-bold text-slate-600 line-clamp-2 leading-relaxed uppercase tracking-widest group-hover:text-slate-400 transition-colors">
                                {thread.last_message}
                            </p>
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex gap-2">
                                    {thread.is_urgent && <Badge color="red">URGENT</Badge>}
                                    {thread.unread_count > 0 && (
                                        <span className="bg-cyan-500 text-slate-950 text-[11px] font-black px-2 py-0.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                                            {thread.unread_count}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{thread.status}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ──────────────── CHAT PANEL (CENTER) ──────────────── */}
            <Card className="flex-1 flex flex-col overflow-hidden relative border-cyan-500/[0.05]">
                {/* Chat Header */}
                <div className="p-6 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-cyan-400 shadow-inner">
                                <ShieldCheck className="w-7 h-7" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#00e676] rounded-full border-4 border-[#0d1424]" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">{activeThread?.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{activeThread?.staff_name}</span>
                                <div className="w-1 h-1 rounded-full bg-slate-700" />
                                <span className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.2em] italic">{activeThread?.staff_role}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsCallModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all text-[11px] font-black uppercase tracking-widest"
                        >
                            <Phone className="w-4 h-4" />
                            <span className="hidden md:inline">Request Call</span>
                        </button>
                        <button onClick={() => setShowDetails(!showDetails)} className="p-3 text-slate-500 hover:text-white transition-colors">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Message Feed */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                    {messages.map((msg, i) => (
                        <div key={msg.id} className={`flex flex-col ${msg.is_from_me ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-3 mb-2 px-2">
                                {!msg.is_from_me && <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest italic">{msg.sender_name}</span>}
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{msg.timestamp}</span>
                            </div>
                            <div className="group relative max-w-[85%]">
                                <div className={`p-6 rounded-[2rem] text-sm font-bold leading-relaxed transition-all shadow-xl ${
                                    msg.is_from_me 
                                        ? 'bg-cyan-500 text-slate-950 rounded-tr-none shadow-cyan-500/10' 
                                        : 'bg-white/5 border border-white/5 text-slate-300 rounded-tl-none shadow-black/20'
                                } ${msg.tag === 'URGENT' ? 'border-red-500/50 border-2' : ''}`}>
                                    {msg.text}
                                    {msg.tag && (
                                        <div className={`mt-4 pt-3 border-t text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${msg.is_from_me ? 'border-black/10' : 'border-white/5'}`}>
                                            <AlertTriangle className={`w-3 h-3 ${msg.tag === 'URGENT' ? 'text-red-500' : 'text-amber-500'}`} />
                                            {msg.tag}
                                        </div>
                                    )}
                                </div>
                                {msg.is_from_me && (
                                    <div className="flex items-center gap-1 mt-2 px-4">
                                        <CheckCheck className="w-3 h-3 text-cyan-400" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">DECRYPTED & READ</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Message Composer */}
                <div className="p-6 bg-white/[0.01] border-t border-white/[0.05]">
                    <div className={`flex flex-col p-4 bg-[#141e35] rounded-[2.5rem] border transition-all focus-within:border-cyan-500/30 ${isUrgentMode ? 'border-red-500/30 bg-red-500/[0.02]' : 'border-white/5'}`}>
                        <textarea 
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder={isUrgentMode ? "Typing urgent alert mission..." : "Initialize secure session..."}
                            className="w-full bg-transparent p-4 outline-none text-white text-base font-bold italic resize-none no-scrollbar h-20 placeholder:text-slate-700"
                        />
                        <div className="flex items-center justify-between border-t border-white/[0.03] pt-4 mt-2">
                            <div className="flex items-center gap-4">
                                <button className="p-3 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white rounded-xl transition-all border border-white/5">
                                    <Paperclip className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setIsUrgentMode(!isUrgentMode)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border ${
                                        isUrgentMode ? 'bg-red-500 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.35)]' : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/10'
                                    }`}
                                >
                                    <AlertTriangle className={`w-3.5 h-3.5 ${isUrgentMode ? 'animate-pulse' : ''}`} />
                                    Urgent Dispatch
                                </button>
                            </div>
                            <button 
                                onClick={handleSendMessage}
                                disabled={!messageInput.trim()}
                                className={`px-8 py-3 rounded-2xl font-black text-[12px] uppercase tracking-[0.25em] transition-all flex items-center gap-3 active:scale-95 disabled:opacity-30 ${
                                    isUrgentMode ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'bg-cyan-500 text-slate-950 shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:bg-cyan-400'
                                }`}
                            >
                                <Send className="w-4 h-4" />
                                Synchronize
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* ──────────────── THREAD DETAILS (RIGHTPANEL) ──────────────── */}
            <AnimatePresence>
                {showDetails && (
                    <motion.div 
                        initial={{ width: 0, opacity: 0 }} 
                        animate={{ width: 320, opacity: 1 }} 
                        exit={{ width: 0, opacity: 0 }}
                        className="hidden xl:flex flex-col gap-6 shrink-0 overflow-hidden"
                    >
                        <Card className="p-8 space-y-8 flex-1 overflow-y-auto no-scrollbar border-white/[0.02]">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Thread Vault</h3>
                            
                            <div className="space-y-6 pb-6 border-b border-white/[0.05]">
                                <div>
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">Study Context</span>
                                    <p className="text-sm font-black text-white italic uppercase tracking-tight">Bio-Sync-2030</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">Assigned Node</span>
                                    <p className="text-sm font-black text-cyan-400 italic uppercase tracking-tight">{activeThread?.staff_name}</p>
                                </div>
                                <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl space-y-2">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Status</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#00e676]" />
                                        <span className="text-[12px] font-black text-white uppercase italic tracking-widest">Active Link</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Shared Assets</h4>
                                <div className="space-y-3">
                                    <div className="group p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between hover:border-cyan-500/30 transition-all cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-indigo-400" />
                                            <div>
                                                <p className="text-[12px] font-black text-white uppercase italic">Protocol_Log.pdf</p>
                                                <span className="text-[10px] font-black text-slate-600 uppercase">2.4 MB</span>
                                            </div>
                                        </div>
                                        <Download className="w-4 h-4 text-slate-700 group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="group p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between hover:border-cyan-500/30 transition-all cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <ImageIcon className="w-5 h-5 text-cyan-400" />
                                            <div>
                                                <p className="text-[12px] font-black text-white uppercase italic">Skin_Baseline.jpg</p>
                                                <span className="text-[10px] font-black text-slate-600 uppercase">1.1 MB</span>
                                            </div>
                                        </div>
                                        <Download className="w-4 h-4 text-slate-700 group-hover:text-white transition-colors" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/[0.05] space-y-3">
                                <button className="w-full py-4 text-slate-500 hover:text-white font-black text-[11px] uppercase tracking-widest border border-white/5 hover:border-white/10 rounded-2xl transition-all flex items-center justify-center gap-2">
                                    <Archive className="w-4 h-4" />
                                    Archive Link
                                </button>
                                <button className="w-full py-4 text-red-500 hover:text-red-400 font-black text-[11px] uppercase tracking-widest border border-red-500/10 hover:border-red-500/20 rounded-2xl transition-all flex items-center justify-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Report Node Link
                                </button>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ──────────────── CALL REQUEST MODAL ──────────────── */}
            <AnimatePresence>
                {isCallModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0a0e1a]/98 backdrop-blur-2xl" onClick={() => setIsCallModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-[#0d1424] border border-white/10 rounded-[3rem] p-12 shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
                            <div className="w-16 h-16 bg-cyan-500/10 text-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-cyan-500/20">
                                <Phone className="w-8 h-8" />
                            </div>
                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter text-center mb-4">Request Voice Sync</h3>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm text-center mb-10 leading-relaxed">
                                Initialize a direct secure line with {activeThread?.staff_name}. Preferred time nodes will be analyzed.
                            </p>
                            <div className="space-y-8 mb-10">
                                <div className="space-y-2">
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-4">Urgency Level</span>
                                    <div className="flex gap-2">
                                        {['Routine', 'Priority', 'Critical'].map(level => (
                                            <button 
                                                key={level}
                                                className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                                                    level === 'Routine' ? 'bg-white/5 text-white border-white/20' : 'bg-transparent text-slate-600 border-white/5 hover:border-white/10'
                                                }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-4">Wait Window</span>
                                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-white text-sm font-bold italic">
                                        Expected callback: &lt; 2 Standard Cycles
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => {
                                        setIsCallModalOpen(false);
                                        alert("✅ Voice Sync Requested. Monitor your encrypted dispatcher for updates.");
                                    }}
                                    className="w-full py-5 bg-cyan-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.25em] shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-95"
                                >
                                    AUTHORIZE REQUEST
                                </button>
                                <button onClick={() => setIsCallModalOpen(false)} className="w-full py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest">TERMINATE REQUEST</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MessagesView;
