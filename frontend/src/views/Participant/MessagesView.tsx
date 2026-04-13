import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Plus, Filter, Send, AlertTriangle, ChevronRight, Download, Archive, 
    User, MessageSquare, Check, CheckCheck, Clock, X, FileText, 
    Image as ImageIcon, ExternalLink, ShieldCheck, Paperclip 
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
    attachment?: string;
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

const MessagesView = ({ study, conversations = [], onAction, isLoading = false }: { study?: any, conversations?: any[], onAction?: () => void, isLoading?: boolean }) => {
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
            tag: msg.tag !== 'GENERAL' ? msg.tag : undefined,
            attachment: msg.attachment
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

    if (isLoading) {
        return (
            <div className="h-[calc(100vh-180px)] min-h-[600px] flex gap-6 pb-4 animate-pulse">
                <div className="w-80 flex flex-col gap-6 shrink-0">
                    <div className="h-10 w-48 bg-white/5 rounded-xl" />
                    <div className="h-14 w-full bg-white/5 rounded-2xl" />
                    <div className="space-y-3 flex-1">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 rounded-[2rem]" />)}
                    </div>
                </div>
                <Card className="flex-1 flex flex-col overflow-hidden border-white/5 relative">
                    <div className="shimmer-effect" />
                    <div className="p-8 border-b border-white/5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl" />
                        <div className="space-y-2">
                            <div className="h-6 w-48 bg-white/5 rounded-lg" />
                            <div className="h-3 w-32 bg-white/5 rounded-full" />
                        </div>
                    </div>
                    <div className="flex-1 p-10 space-y-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
                                <div className="h-3 w-20 bg-white/5 rounded-full mb-2" />
                                <div className={`h-20 w-80 bg-white/5 rounded-[2rem] ${i % 2 === 0 ? 'rounded-tr-none' : 'rounded-tl-none'}`} />
                            </div>
                        ))}
                    </div>
                    <div className="p-8 border-t border-white/5">
                        <div className="h-16 w-full bg-white/5 rounded-[2rem]" />
                    </div>
                </Card>
            </div>
        );
    }

    const activeThread = threads.find(t => t.id === selectedThreadId);

    const handleSendMessage = async () => {
        if (!messageInput.trim()) return;

        try {
            const apiUrl = API || 'http://localhost:8000';
            const formData = new FormData();
            formData.append('text', messageInput);
            formData.append('tag', 'GENERAL');

            const res = await authFetch(`${apiUrl}/api/clinical-conversations/${selectedThreadId}/add_message/`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const newMessage = await res.json();
                setMessageInput('');
                // Optimistically update the UI
                setFullConversations(prev => {
                    const current = prev[selectedThreadId || ''];
                    if (!current) return prev;
                    return {
                        ...prev,
                        [selectedThreadId || '']: {
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
                        <h3 className="text-[14px] font-black text-white italic uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">Conversations</h3>
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
                                        if (onAction) onAction();
                                    }
                                } catch (err) { console.error(err); }
                            }}
                            className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-slate-950 hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] active:scale-95"
                        >
                            <Plus className="w-5 h-5 font-black" />
                        </button>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search Conversations..."
                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-white text-[12px] font-black uppercase tracking-widest outline-none focus:border-amber-500/50 transition-all"
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
                            className={`p-5 rounded-3xl border transition-all cursor-pointer relative group ${selectedThreadId === thread.id
                                ? 'bg-amber-500/10 border-amber-500/30'
                                : 'bg-white/[0.02] border-white/5'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-amber-500">
                                    <User className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{thread.timestamp}</span>
                            </div>
                            <h5 className="text-[13px] font-black text-white italic uppercase tracking-tighter truncate mb-1">{thread.title}</h5>
                            <p className="text-[12px] font-medium text-slate-500 truncate mb-4">{thread.last_message}</p>
                            <div className="flex justify-end">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${thread.status === 'responded' ? 'text-amber-500/60' : 'text-slate-600'}`}>
                                    {thread.status === 'responded' ? 'Responded' : 'Awaiting'}
                                </span>
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
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-[14px] font-black text-white italic uppercase tracking-[0.1em]">{activeThread?.title || 'Study Communication'}</h4>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                Clinical Staff • <span className="text-amber-500 italic">Study Coordinator</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Message Feed */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <MessageSquare className="w-12 h-12 text-slate-700 mb-6" />
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">No Messages</h3>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <motion.div key={msg.id} className={`flex flex-col ${msg.is_from_me ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-center gap-3 mb-2 px-2">
                                    {!msg.is_from_me && <span className="text-[12px] font-black text-amber-500 uppercase tracking-widest italic">{msg.sender_name}</span>}
                                    <span className="text-[12px] font-black text-slate-600 uppercase tracking-widest">{msg.timestamp}</span>
                                </div>
                                <div className={`p-6 rounded-[2rem] text-[15px] font-bold shadow-xl max-w-[80%] ${msg.is_from_me ? 'bg-amber-500 text-slate-950 rounded-tr-none' : 'bg-white/5 border border-white/5 text-slate-300 rounded-tl-none'}`}>
                                    {msg.text}
                                    {msg.is_from_me && (
                                        <div className="flex items-center gap-1.5 mt-4 ml-auto opacity-60">
                                            <CheckCheck className="w-3 h-3 text-slate-950" />
                                            <span className="text-[9px] font-black text-slate-950 uppercase tracking-[0.2em]">Message Read</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-8 border-t border-white/5 bg-[#0a0f1d]/50">
                    <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full bg-transparent text-white font-medium text-[16px] italic placeholder:text-slate-700 outline-none resize-none mb-6 h-20"
                    />
                    <div className="flex items-center justify-end">

                        <button
                            onClick={handleSendMessage}
                            className="flex items-center gap-4 px-12 py-3 bg-amber-500 rounded-full text-[13px] font-black text-slate-950 uppercase tracking-[0.3em] italic hover:bg-amber-400 hover:scale-[1.02] shadow-2xl shadow-amber-500/20 transition-all"
                        >
                            <Send className="w-4 h-4" />
                            Send Message
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default MessagesView;


