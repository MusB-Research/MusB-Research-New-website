import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Plus, Filter, Send, AlertTriangle, ChevronRight, Download, Archive, 
    User, MessageSquare, Check, CheckCheck, Clock, X, FileText, 
    Image as ImageIcon, ExternalLink, ShieldCheck, Paperclip 
} from 'lucide-react';
import { Card, Badge, Skeleton } from './SharedComponents';
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

    // Fetch Full Conversation Details
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

    // Auto-select first thread
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
            <div className="h-[calc(100vh-120px)] flex gap-6 pb-2 animate-pulse">
                <div className="w-80 flex flex-col gap-6 shrink-0">
                    <Skeleton className="h-8 w-48 rounded-lg" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                    <div className="space-y-3 flex-1">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                    </div>
                </div>
                <Card className="flex-1 flex flex-col overflow-hidden relative">
                    <div className="p-8 border-b border-[#E3ECF5] flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-2xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48 rounded-lg" />
                            <Skeleton className="h-3 w-32 rounded-full" />
                        </div>
                    </div>
                    <div className="flex-1 p-10 space-y-8">
                        {[1, 2].map(i => (
                            <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
                                <Skeleton className="h-20 w-80 rounded-[24px]" />
                            </div>
                        ))}
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
        <div className="h-[calc(100vh-120px)] flex gap-6 pb-2">
            {/* THREAD LIST */}
            <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[14px] font-bold text-[#1A2B49] uppercase tracking-widest">Conversations</h3>
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
                            className="w-9 h-9 bg-[#1E88E5] rounded-xl flex items-center justify-center text-white hover:bg-[#1565C0] transition-all shadow-md active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F6F89] group-focus-within:text-[#1E88E5] transition-colors" />
                        <input
                            type="text"
                            placeholder="Find messages..."
                            className="w-full bg-white border border-[#E3ECF5] rounded-xl py-3 pl-11 pr-4 text-[#1A2B49] text-[13px] font-bold outline-none focus:border-[#1E88E5] transition-all placeholder:text-[#5F6F89]"
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
                            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative group ${selectedThreadId === thread.id
                                ? 'bg-[#E3F2FD] border-[#1E88E5]/20 shadow-sm'
                                : 'bg-white border-transparent hover:border-[#E3ECF5]'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${selectedThreadId === thread.id ? 'bg-white text-[#1E88E5]' : 'bg-[#F8FBFF] text-[#B0BCCF]'}`}>
                                    <User className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest">{thread.timestamp}</span>
                            </div>
                            <h5 className={`text-[14px] font-bold uppercase tracking-tight truncate mb-1 ${selectedThreadId === thread.id ? 'text-[#1E88E5]' : 'text-[#1A2B49]'}`}>{thread.title}</h5>
                            <p className="text-[12px] font-bold text-[#5F6F89] truncate mb-2">{thread.last_message}</p>
                            <div className="flex justify-end">
                                <Badge color={thread.status === 'responded' ? 'green' : 'blue'}>
                                    {thread.status === 'responded' ? 'Replied' : 'Pending'}
                                </Badge>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* CHAT PANEL */}
            <Card className="flex-1 flex flex-col overflow-hidden relative border-[#E3ECF5] shadow-xl bg-white">
                {/* Header */}
                <div className="px-4 py-2.5 border-b border-[#E3ECF5] flex items-center justify-between bg-[#F8FBFF]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-[#1E88E5] border border-[#E3ECF5] shadow-sm shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-[13px] font-bold text-[#1A2B49] uppercase tracking-tight leading-none">{activeThread?.title || 'Connect with Study Team'}</h4>
                            <p className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                Clinical Support • <span className="text-[#1E88E5]">Study Coordinator</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Feed */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar bg-[#F5F9FF]/20">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                            <MessageSquare className="w-16 h-16 text-[#B0BCCF] mb-6" />
                            <h3 className="text-xl font-bold text-[#1A2B49] uppercase tracking-widest">No Protocol Correspondence</h3>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <motion.div key={msg.id} className={`flex flex-col ${msg.is_from_me ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-center gap-2 mb-1 px-1">
                                    {!msg.is_from_me && <span className="text-[10px] font-bold text-[#1E88E5] uppercase tracking-widest">{msg.sender_name}</span>}
                                    <span className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest">{msg.timestamp}</span>
                                </div>
                                <div className={`px-4 py-3 rounded-2xl text-[13px] font-bold shadow-sm max-w-[85%] ${msg.is_from_me ? 'bg-[#1E88E5] text-white rounded-tr-none' : 'bg-white border border-[#E3ECF5] text-[#1A2B49] rounded-tl-none'}`}>
                                    {msg.text}
                                    {msg.is_from_me && (
                                        <div className="flex items-center gap-1 mt-1.5 ml-auto opacity-70">
                                            <CheckCheck className="w-3 h-3" />
                                            <span className="text-[9px] font-bold uppercase tracking-widest">Delivered</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-[#E3ECF5] bg-white flex items-end gap-3">
                    <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type clinical inquiry here..."
                        className="flex-1 bg-[#F8FBFF] border border-[#E3ECF5] rounded-xl px-4 py-2.5 text-[#1A2B49] font-bold text-[13px] placeholder:text-[#5F6F89] outline-none resize-none h-16 focus:border-[#1E88E5] transition-all"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                        <Paperclip className="w-4 h-4 text-[#B0BCCF] cursor-not-allowed" />
                        <button
                            onClick={handleSendMessage}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#1E88E5] rounded-xl text-[12px] font-bold text-white uppercase tracking-widest hover:bg-[#1565C0] shadow-md transition-all active:scale-95"
                        >
                            <Send className="w-3.5 h-3.5" />
                            Send
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default MessagesView;
