import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Plus, Filter, Send, 
    AlertTriangle, ChevronRight, Download, Archive, 
    User, MessageSquare, Check, CheckCheck, Clock, X,
    FileText, Image as ImageIcon, ExternalLink, ShieldCheck
} from 'lucide-react';
import { Card, Badge } from './SharedComponents';
import { getUser, API, authFetch } from '../../utils/auth';

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

const MessagesView = ({ study, conversations = [], onAction }: { study?: any, conversations?: any[], onAction?: () => void }) => {
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [messageInput, setMessageInput] = useState('');

    const [showDetails, setShowDetails] = useState(true);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [fullConversations, setFullConversations] = useState<Record<string, any>>({});
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Map Backend Conversations to UI Threads
    const threads: Thread[] = useMemo(() => {
        return conversations.map((conv: any) => ({
            id: conv.id,
            title: conv.study_protocol || 'Study Communication',
            last_message: conv.last_message_preview || 'No messages yet',
            timestamp: new Date(conv.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unread_count: conv.status === 'ACTION_REQUIRED' ? 1 : 0,
            is_urgent: conv.is_flagged,
            staff_name: conv.assigned_coordinator || 'Clinical Staff',
            staff_role: 'Study Coordinator',
            status: conv.status === 'RESOLVED' ? 'responded' : 'active'
        }));
    }, [conversations]);

    // Map Backend Messages to UI
    const activeConversation = useMemo(() => {
        return fullConversations[selectedThreadId || ''] || conversations.find((c: any) => c.id === selectedThreadId);
    }, [conversations, selectedThreadId, fullConversations]);

    const messages: Message[] = useMemo(() => {
        if (!activeConversation || !activeConversation.messages) return [];
        const currentUser = getUser();
        return activeConversation.messages.map((msg: any) => ({
            id: msg.id,
            text: msg.text,
            sender_name: msg.sender_name,
            timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            is_from_me: msg.sender === currentUser?.id,
            status: 'read',
            tag: msg.tag !== 'GENERAL' ? msg.tag : undefined
        }));
    }, [activeConversation]);

    // Fetch Full Conversation Details (including messages)
    useEffect(() => {
        const fetchDetails = async () => {
            if (!selectedThreadId || fullConversations[selectedThreadId]) return;
            
            setIsLoadingDetails(true);
            try {
                const apiUrl = API || 'http://localhost:8000';
                const res = await authFetch(`${apiUrl}/api/clinical-conversations/${selectedThreadId}/`);
                if (res.ok) {
                    const data = await res.json();
                    setFullConversations(prev => ({ ...prev, [selectedThreadId]: data }));
                }
            } catch (err) {
                console.error("Failed to fetch conversation details:", err);
            } finally {
                setIsLoadingDetails(false);
            }
        };
        fetchDetails();
    }, [selectedThreadId]);

    // Auto-select first thread if none selected
    useEffect(() => {
        if (threads.length > 0 && !selectedThreadId) {
            setSelectedThreadId(threads[0].id);
        }
    }, [threads, selectedThreadId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const activeThread = threads.find(t => t.id === selectedThreadId);

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedThreadId) return;
        
        try {
            const apiUrl = API || 'http://localhost:8000';
            const res = await authFetch(`${apiUrl}/api/clinical-conversations/${selectedThreadId}/add_message/`, {
                method: 'POST',
                body: JSON.stringify({
                    text: messageInput,
                    tag: 'GENERAL'
                })
            });
            
            if (res.ok) {
                const newMessage = await res.json();
                setMessageInput('');
                // Optimistically update the UI
                setFullConversations(prev => {
                    const current = prev[selectedThreadId];
                    if (!current) return prev;
                    return {
                        ...prev,
                        [selectedThreadId]: {
                            ...current,
                            messages: [...(current.messages || []), newMessage]
                        }
                    };
                });
                if (onAction) onAction(); 
            }
        } catch (err) {
            console.error("Failed to sync message:", err);
            alert("Connection error. Please try again.");
        }
    };

    return (
        <div className="h-[calc(100vh-180px)] min-h-[600px] flex gap-6 pb-4">
            {/* ──────────────── THREAD LIST (LEFT) ──────────────── */}
            <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Conversations</h3>
                        <button 
                            onClick={async () => {
                                try {
                                    const apiUrl = API || 'http://localhost:8000';
                                    const studyId = study?.id || study?._id?.$oid || study?._id || '';
                                    const res = await authFetch(`${apiUrl}/api/clinical-conversations/`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ study: studyId })
                                    });
                                    if (res.ok) {
                                        const newConv = await res.json();
                                        setSelectedThreadId(newConv.id);
                                        // Trigger parent to re-fetch conversations
                                        if (onAction) onAction();
                                    } else {
                                        const err = await res.json();
                                        console.error("Create conversation failed:", err);
                                        alert("Could not start a new conversation. Please try again.");
                                    }
                                } catch (err) {
                                    console.error("Network error:", err);
                                    alert("Connection error. Please try again.");
                                }
                            }}
                            className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-slate-950 hover:bg-cyan-400 transition-all shadow-lg active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search Conversations..."
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
                                <span className="text-[12px] font-black text-slate-600 uppercase tracking-widest">{thread.timestamp}</span>
                            </div>
                            <h4 className={`text-[13px] font-black uppercase tracking-tight mb-1 truncate ${selectedThreadId === thread.id ? 'text-white italic' : 'text-slate-400'}`}>
                                {thread.title}
                            </h4>
                            <p className="text-[12px] font-bold text-slate-600 line-clamp-2 leading-relaxed uppercase tracking-widest group-hover:text-slate-400 transition-colors">
                                {thread.last_message}
                            </p>
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex gap-2">
                                    {thread.is_urgent && <Badge color="red">URGENT</Badge>}
                                    {thread.unread_count > 0 && (
                                        <span className="bg-cyan-500 text-slate-950 text-[12px] font-black px-2 py-0.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                                            {thread.unread_count}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[12px] font-black text-slate-700 uppercase tracking-widest">{thread.status}</span>
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
                            <h4 className="text-[17px] font-black text-white italic uppercase tracking-tighter leading-none">{activeThread?.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">{activeThread?.staff_name}</span>
                                <div className="w-1 h-1 rounded-full bg-slate-700" />
                                <span className="text-[12px] font-black text-cyan-400 uppercase tracking-[0.2em] italic">{activeThread?.staff_role}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">

                    </div>
                </div>

                {/* Message Feed */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                    {isLoadingDetails ? (
                        <div className="space-y-8 animate-pulse">
                            {[1, 2, 3].map(n => (
                                <div key={n} className={`flex flex-col ${n % 2 === 0 ? 'items-end' : 'items-start'}`}>
                                    <div className="w-32 h-3 bg-white/5 rounded-full mb-3" />
                                    <div className="w-64 h-24 bg-white/5 rounded-[2rem]" />
                                </div>
                            ))}
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 text-slate-700 mb-6">
                                <MessageSquare className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">No Messages Yet</h3>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[12px] mt-2 max-w-[200px]">Start the conversation with your study team.</p>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div key={msg.id} className={`flex flex-col ${msg.is_from_me ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-center gap-3 mb-2 px-2">
                                    {!msg.is_from_me && <span className="text-[12px] font-black text-cyan-400 uppercase tracking-widest italic">{msg.sender_name}</span>}
                                    <span className="text-[12px] font-black text-slate-600 uppercase tracking-widest">{msg.timestamp}</span>
                                </div>
                                <div className="group relative max-w-[85%]">
                                    <div className={`p-6 rounded-[2rem] text-[13px] font-bold leading-relaxed transition-all shadow-xl ${
                                        msg.is_from_me 
                                            ? 'bg-cyan-500 text-slate-950 rounded-tr-none shadow-cyan-500/10' 
                                            : 'bg-white/5 border border-white/5 text-slate-300 rounded-tl-none shadow-black/20'
                                    } ${msg.tag === 'URGENT' ? 'border-red-500/50 border-2' : ''}`}>
                                        {msg.text}
                                        {msg.tag && (
                                            <div className={`mt-4 pt-3 border-t text-[12px] font-black uppercase tracking-widest flex items-center gap-2 ${msg.is_from_me ? 'border-black/10' : 'border-white/5'}`}>
                                                <AlertTriangle className={`w-3 h-3 ${msg.tag === 'URGENT' ? 'text-red-500' : 'text-amber-500'}`} />
                                                {msg.tag}
                                            </div>
                                        )}
                                    </div>
                                    {msg.is_from_me && (
                                        <div className="flex items-center gap-1 mt-2 px-4">
                                            <CheckCheck className="w-3 h-3 text-cyan-400" />
                                            <span className="text-[12px] font-black text-slate-600 uppercase tracking-widest">MESSAGE READ</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Message Composer */}
                <div className="p-6 bg-white/[0.01] border-t border-white/[0.05]">
                    <div className="flex flex-col p-4 bg-[#141e35] rounded-[2.5rem] border border-white/5 transition-all focus-within:border-cyan-500/30">
                        <textarea 
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full bg-transparent p-4 outline-none text-white text-base font-bold italic resize-none no-scrollbar h-20 placeholder:text-slate-700"
                        />
                        <div className="flex items-center justify-between border-t border-white/[0.03] pt-4 mt-2">
                            <div className="flex items-center gap-4">
                            </div>
                            <button 
                                onClick={handleSendMessage}
                                disabled={!messageInput.trim()}
                                className="px-8 py-3 rounded-2xl font-black text-[12px] uppercase tracking-[0.25em] transition-all flex items-center gap-3 active:scale-95 disabled:opacity-30 bg-cyan-500 text-slate-950 shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:bg-cyan-400"
                            >
                                <Send className="w-4 h-4" />
                                Send Message
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* ──────────────── THREAD DETAILS (RIGHTPANEL) - REMOVED ──────────────── */}
            <AnimatePresence>
            </AnimatePresence>


        </div>
    );
};

export default MessagesView;


