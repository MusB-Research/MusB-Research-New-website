import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    Filter, 
    Plus, 
    MessageSquare, 
    Flag, 
    AlertCircle, 
    CheckCircle2, 
    MoreHorizontal, 
    Paperclip, 
    Send, 
    User, 
    ArrowUpRight,
    Shield,
    Clock,
    FileText,
    History,
    MoreVertical,
    Check,
    X,
    Star,
    Maximize2,
    ShieldAlert,
    Save,
    Tag,
    Info,
    AlertTriangle,
    Hash,
    Link2
} from 'lucide-react';

// --- Types & Interfaces ---

type MessageStatus = 'Open' | 'In Progress' | 'Resolved' | 'Action Required' | 'Flagged';
type UrgencyLevel = 'Urgent' | 'Attention' | 'Normal';
type MessageCategory = 'Safety' | 'Protocol' | 'Eligibility' | 'General';

interface Attachment {
    id: string;
    name: string;
    type: string;
    url: string;
}

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    content: string;
    timestamp: string;
    type: MessageCategory;
    attachments?: Attachment[];
    isDraft?: boolean;
    hash?: string; // For audit-ready feel
}

interface Conversation {
    id: string;
    participantId: string;
    studyName: string;
    protocolId: string;
    assignedCoordinator: string;
    status: MessageStatus;
    urgency: UrgencyLevel;
    lastMessage: string;
    lastMessageSender: string;
    lastMessageRole: string;
    lastMessageTimestamp: string;
    isUnread: boolean;
    aiSummary: string;
    messages: Message[];
}

// --- Mock Data ---

const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: 'c1',
        participantId: 'SUB-4022',
        studyName: 'Hyper-Immune B-Cell Response',
        protocolId: 'HI-202B',
        assignedCoordinator: 'Sarah Jenkins',
        status: 'Action Required',
        urgency: 'Urgent',
        isUnread: true,
        lastMessage: "Subject reported severe nausea and headache 2 hours post-infusion. Seeking PI guidance on dosage adjustment.",
        lastMessageSender: "Sarah Jenkins",
        lastMessageRole: "Lead Coordinator",
        lastMessageTimestamp: "2026-03-20T09:15:00Z",
        aiSummary: "Potential Grade 2 Adverse Event (nausea/headache). Recommendation: Review dosage protocol for Visit 5.",
        messages: [
            {
                id: 'm1',
                senderId: 'sj1',
                senderName: 'Sarah Jenkins',
                senderRole: 'Lead Coordinator',
                content: "Subject reported severe nausea and headache 2 hours post-infusion. Seeking PI guidance on dosage adjustment for next visit.",
                timestamp: "2026-03-20T08:15:00Z",
                type: 'Safety',
                hash: 'sha256:7f8e...9a2b'
            },
            {
                id: 'm2',
                senderId: 'pi01',
                senderName: 'Dr. Michael Chen',
                senderRole: 'Principal Investigator',
                content: "Noted. Please monitor vitals every 30 minutes. If symptoms persist beyond 4 hours, escalate to the medical board.",
                timestamp: "2026-03-20T08:45:00Z",
                type: 'Safety',
                hash: 'sha256:1a2b...3c4d'
            },
            {
                id: 'm3',
                senderId: 'sj1',
                senderName: 'Sarah Jenkins',
                senderRole: 'Lead Coordinator',
                content: "Subject reported severe nausea and headache 2 hours post-infusion. Seeking PI guidance on dosage adjustment.",
                timestamp: "2026-03-20T09:15:00Z",
                type: 'Safety',
                hash: 'sha256:4d5e...6f7g'
            }
        ]
    },
    {
        id: 'c2',
        participantId: 'SUB-1109',
        studyName: 'Metabolic Syndrome Study-01',
        protocolId: 'MS-801',
        assignedCoordinator: 'Mark Wilson',
        status: 'Open',
        urgency: 'Attention',
        isUnread: false,
        lastMessage: "Patient missed today's glucose monitoring window. Protocol deviation form prepared for signature.",
        lastMessageSender: "Mark Wilson",
        lastMessageRole: "Coordinator",
        lastMessageTimestamp: "2026-03-19T16:45:00Z",
        aiSummary: "Protocol deviation: Missed V4 fasting window. No immediate safety risk.",
        messages: [
            {
                id: 'm4',
                senderId: 'mw1',
                senderName: 'Mark Wilson',
                senderRole: 'Coordinator',
                content: "Patient missed today's glucose monitoring window. Protocol deviation form prepared for signature.",
                timestamp: "2026-03-19T16:45:00Z",
                type: 'Protocol',
                hash: 'sha256:9z8y...7x6w'
            }
        ]
    },
    {
        id: 'c3',
        participantId: 'SUB-5521',
        studyName: 'Neuro-Repair Phase II',
        protocolId: 'NR-009',
        assignedCoordinator: 'Elena Rodriguez',
        status: 'Resolved',
        urgency: 'Normal',
        isUnread: false,
        lastMessage: "Informed consent signed and uploaded to the portal. Eligibility confirmed for Cohort B.",
        lastMessageSender: "Elena Rodriguez",
        lastMessageRole: "Study Lead",
        lastMessageTimestamp: "2026-03-18T11:20:00Z",
        aiSummary: "Enrollment complete. Document verification successful.",
        messages: [
            {
                id: 'm5',
                senderId: 'er1',
                senderName: 'Elena Rodriguez',
                senderRole: 'Study Lead',
                content: "Informed consent signed and uploaded to the portal. Eligibility confirmed for Cohort B.",
                timestamp: "2026-03-18T11:20:00Z",
                type: 'Eligibility',
                attachments: [
                    { id: 'a1', name: 'ICF_SUB-5521.pdf', type: 'application/pdf', url: '#' }
                ],
                hash: 'sha256:5v4u...3t2s'
            }
        ]
    }
];

export default function PIMessagesModule() {
    const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
    const [selectedId, setSelectedId] = useState<string>(MOCK_CONVERSATIONS[0].id);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'All' | 'Unread' | 'Flagged' | 'Action' | 'Study'>('All');
    const [replyText, setReplyText] = useState('');
    const [selectedTag, setSelectedTag] = useState<MessageCategory>('General');
    const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const selectedConv = useMemo(() => 
        conversations.find(c => c.id === selectedId) || conversations[0]
    , [selectedId, conversations]);

    // Filter Logic
    const filteredConversations = useMemo(() => {
        return conversations.filter(c => {
            const matchesSearch = c.participantId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 c.studyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
            
            if (!matchesSearch) return false;
            if (activeTab === 'Unread') return c.isUnread;
            if (activeTab === 'Flagged') return c.status === 'Flagged';
            if (activeTab === 'Action') return c.status === 'Action Required';
            
            return true;
        });
    }, [searchQuery, activeTab, conversations]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [selectedId, conversations]);

    const handleSendMessage = () => {
        if (!replyText.trim()) return;
        
        const newMessage: Message = {
            id: `msg-${Date.now()}`,
            senderId: 'pi01',
            senderName: 'Dr. Michael Chen',
            senderRole: 'Principal Investigator',
            content: replyText,
            timestamp: new Date().toISOString(),
            type: selectedTag,
            hash: `sha256:${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 10)}`
        };

        setConversations(prev => prev.map(c => 
            c.id === selectedId ? {
                ...c,
                messages: [...c.messages, newMessage],
                lastMessage: replyText,
                lastMessageSender: 'Dr. Michael Chen',
                lastMessageRole: 'Principal Investigator',
                lastMessageTimestamp: new Date().toISOString(),
                isUnread: false
            } : c
        ));
        setReplyText('');
    };

    const handleStatusChange = (newStatus: MessageStatus) => {
        setConversations(prev => prev.map(c => 
            c.id === selectedId ? { ...c, status: newStatus } : c
        ));
    };

    const urgencyColor = (urgency: UrgencyLevel) => {
        switch (urgency) {
            case 'Urgent': return 'text-red-500 border-red-500/20 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
            case 'Attention': return 'text-amber-500 border-amber-500/20 bg-amber-500/10';
            case 'Normal': return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10';
        }
    };

    const getStatusIndicator = (status: MessageStatus) => {
        switch (status) {
            case 'Action Required': return <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />;
            case 'Resolved': return <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />;
            case 'In Progress': return <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />;
            default: return <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />;
        }
    };

    const handleAction = (type: string) => {
        alert(`ACTION LOGGED: [${type}] for ${selectedConv.participantId}. \nAudit Trail updated with PI Signature.`);
        if (type === 'Flag for Primary Review') {
            handleStatusChange('Flagged');
        }
    };

    return (

        <div className="flex flex-col h-[calc(100vh-14rem)] bg-[#0B101B] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            
            {/* --- Sticky Top Bar --- */}
            <header className="flex-shrink-0 px-10 py-8 bg-[#0B101B]/95 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between gap-12 z-20">
                <div className="flex items-center gap-8">
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                        Messages
                        <div className="h-6 w-px bg-white/10" />
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] flex items-center gap-2">
                             PI Workspace <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        </span>
                    </h2>

                    <div className="relative group min-w-[320px]">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="SEARCH BY SUBJ ID, STUDY, KEYWORD..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-16 pr-8 py-4 w-full text-[10px] font-bold text-white outline-none focus:border-cyan-500/30 transition-all uppercase tracking-widest placeholder:text-slate-800"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                        {[
                            { id: 'All', label: 'All' },
                            { id: 'Unread', label: 'Unread' },
                            { id: 'Flagged', label: 'Flagged' },
                            { id: 'Action', label: 'Requires Action' },
                            { id: 'Study', label: 'By Study' }
                        ].map((tab) => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 scale-105' : 'text-slate-500 hover:text-white'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <button className="px-8 py-4 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl italic">
                        <Plus className="w-4 h-4" /> Compose Message
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                
                {/* --- Left Panel: Conversation List --- */}
                <aside className="w-[450px] bg-white/[0.01] border-r border-white/5 flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                        {filteredConversations.map((conv) => (
                            <motion.div 
                                key={conv.id}
                                onClick={() => setSelectedId(conv.id)}
                                whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.03)' }}
                                className={`p-6 rounded-[2rem] border transition-all cursor-pointer relative group ${
                                    selectedId === conv.id 
                                        ? 'bg-indigo-600/10 border-indigo-500/30 shadow-2xl z-10' 
                                        : 'bg-transparent border-transparent'
                                }`}
                            >
                                {conv.isUnread && (
                                    <div className="absolute top-6 left-2 w-2 h-10 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.6)]" />
                                )}
                                
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-sm font-black text-white italic uppercase tracking-tighter">{conv.participantId}</h4>
                                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${urgencyColor(conv.urgency).split(' ')[0]} ${urgencyColor(conv.urgency).split(' ')[1]}`}>
                                                    {conv.urgency}
                                                </span>
                                            </div>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic line-clamp-1">{conv.studyName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{conv.lastMessageTimestamp.split('T')[1].substring(0, 5)}</p>
                                            <p className="text-[8px] text-slate-800 font-bold uppercase mt-1 italic">Audit Linked</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-indigo-400 italic uppercase">{conv.lastMessageSender}</span>
                                            <span className="text-[8px] text-slate-700 font-black uppercase tracking-wider">/ {conv.lastMessageRole}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-bold italic line-clamp-2 group-hover:text-slate-200 transition-colors leading-relaxed">
                                            {conv.lastMessage}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-3">
                                            {getStatusIndicator(conv.status)}
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{conv.status}</span>
                                        </div>
                                        {conv.status === 'Action Required' && (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                                                <ShieldAlert className="w-3 h-3 text-red-500" />
                                                <span className="text-[8px] font-black text-red-500 uppercase">Priority</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </aside>

                {/* --- Right Panel: Message Thread --- */}
                <main className="flex-1 flex flex-col bg-[#060811]/30 relative">
                    
                    {/* Header Region */}
                    <div className="flex-shrink-0 px-12 py-10 bg-[#0B101B]/40 backdrop-blur-2xl border-b border-white/5">
                        <div className="flex items-start justify-between gap-12">
                            <div className="space-y-6 flex-1">
                                <div className="flex items-center gap-8">
                                    <div className="w-16 h-16 rounded-[2rem] bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                                        <User className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">{selectedConv.participantId}</h3>
                                            <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                                                {getStatusIndicator(selectedConv.status)}
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedConv.status}</span>
                                            </div>
                                        </div>
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{selectedConv.studyName} <span className="text-indigo-500/50">• Protocol #{selectedConv.protocolId}</span></p>
                                    </div>
                                </div>

                                {/* AI Summary Line */}
                                <div className="flex items-center gap-6 p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] max-w-3xl group cursor-help transition-all hover:bg-indigo-500/10">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0 text-indigo-400">
                                        <Shield className="w-5 h-5 animate-pulse" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Clinical Sentiment & AI Insight</p>
                                        <p className="text-[12px] text-slate-300 font-bold italic leading-relaxed">"{selectedConv.aiSummary}"</p>
                                    </div>
                                    <button className="px-5 py-2.5 bg-white/5 hover:bg-white hover:text-[#0B101B] rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest transition-all">
                                        Full Record
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-6 text-right">
                                <div className="flex gap-3">
                                    <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all">
                                        <Star className="w-5 h-5" />
                                    </button>
                                    <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all">
                                        <Link2 className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => setIsActionPanelOpen(!isActionPanelOpen)}
                                        className={`p-4 rounded-2xl transition-all flex items-center gap-3 border ${
                                            isActionPanelOpen ? 'bg-indigo-600 text-white border-transparent' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                                        }`}
                                    >
                                        <MoreVertical className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Controls</span>
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] italic">Assigned Coordinator</p>
                                    <div className="flex items-center gap-3 justify-end mt-1">
                                        <span className="text-xs font-black text-white italic uppercase">{selectedConv.assignedCoordinator}</span>
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chat Body */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-12 space-y-12 bg-gradient-to-b from-transparent to-[#0B101B]/20">
                        {selectedConv.messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.senderId === 'pi01' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                                <div className={`max-w-[70%] space-y-4 ${msg.senderId === 'pi01' ? 'items-end' : 'items-start'}`}>
                                    <div className={`flex items-center gap-4 ${msg.senderId === 'pi01' ? 'flex-row-reverse text-right' : ''}`}>
                                        <div className={`w-10 h-10 rounded-[1.25rem] flex items-center justify-center font-black text-[12px] italic border ${
                                            msg.senderId === 'pi01' ? 'bg-white text-slate-950 border-white' : 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
                                        }`}>
                                            {msg.senderName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 justify-inherit">
                                                <span className="text-[11px] font-black text-white italic uppercase tracking-wider">{msg.senderName}</span>
                                                <span className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 border border-white/10">{msg.senderRole}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5 justify-inherit">
                                                <span className="text-[8px] text-slate-700 font-black uppercase">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • MARCH 20</span>
                                                {msg.hash && (
                                                    <span className="text-[7px] text-slate-800 font-mono uppercase tracking-tighter flex items-center gap-1 group">
                                                        <Hash className="w-2 h-2" /> {msg.hash}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`relative p-8 rounded-[2.5rem] text-[14px] font-bold leading-relaxed italic border group ${
                                        msg.senderId === 'pi01' 
                                            ? 'bg-indigo-600 text-white border-transparent shadow-2xl' 
                                            : 'bg-white/[0.03] text-slate-300 border-white/5 hover:bg-white/[0.05] transition-all'
                                    }`}>
                                        {msg.content}
                                        
                                        <div className={`absolute ${msg.senderId === 'pi01' ? '-left-4' : '-right-4'} -top-2 px-3 py-1 bg-[#0B101B] border border-white/10 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl`}>
                                            {msg.type} Category
                                        </div>

                                        {msg.type === 'Safety' && msg.senderId !== 'pi01' && (
                                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,.8)]" />
                                        )}
                                    </div>

                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-3 mt-4">
                                            {msg.attachments.map(at => (
                                                <div key={at.id} className="flex items-center gap-4 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group shadow-xl">
                                                    <Paperclip className="w-4 h-4 text-cyan-500" />
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">{at.name}</p>
                                                        <p className="text-[8px] text-slate-600 font-bold uppercase mt-0.5">2.4 MB • Hashed PDF</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* --- Reply Interface --- */}
                    <div className="flex-shrink-0 px-12 py-10 bg-[#0B101B]/80 backdrop-blur-3xl border-t border-white/5">
                        <div className="max-w-5xl mx-auto space-y-6">
                            
                            {/* Auto-tag suggestions */}
                            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
                                <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20 whitespace-nowrap">
                                    <Star className="w-3 h-3 text-indigo-400" />
                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Clinical Chips:</span>
                                </div>
                                {[
                                    "Adverse event detected", "Missed visit alert", "Dose adjustment required", 
                                    "Eligibility waiver needed", "Safety Labs requested", "Protocol Deviation Noted"
                                ].map((chip) => (
                                    <button 
                                        key={chip}
                                        onClick={() => setReplyText(prev => prev + (prev ? ' ' : '') + chip + '. ')}
                                        className="whitespace-nowrap px-5 py-2 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-black text-slate-500 hover:text-white hover:border-indigo-500/50 transition-all uppercase tracking-widest"
                                    >
                                        + {chip}
                                    </button>
                                ))}
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 focus-within:border-indigo-500/50 transition-all shadow-inner relative group/input">
                                <div className="flex items-center justify-between mb-6 px-2">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-3">
                                            <Tag className="w-4 h-4 text-slate-700" />
                                            <div className="flex gap-2">
                                                {['Safety', 'Protocol', 'Eligibility', 'General'].map(tag => (
                                                    <button 
                                                        key={tag}
                                                        onClick={() => setSelectedTag(tag as MessageCategory)}
                                                        className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                            selectedTag === tag ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-slate-600 hover:text-slate-400'
                                                        }`}
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button className="p-3 bg-white/5 rounded-2xl text-slate-600 hover:text-white transition-all border border-white/5">
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                        <button className="p-3 bg-white/5 rounded-2xl text-slate-600 hover:text-white transition-all border border-white/5">
                                            <Maximize2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                <textarea 
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="TYPE CLINICAL RESPONSE... (ENTER TO TRANSMIT)"
                                    className="w-full bg-transparent border-none outline-none resize-none text-[15px] text-white placeholder-slate-800 font-bold italic h-28 p-2 custom-scrollbar uppercase tracking-[0.05em]"
                                />

                                <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <p className="text-[10px] text-slate-700 font-black uppercase italic tracking-widest">Signed: Dr. Michael Chen</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-5">
                                        <button className="px-10 py-4 bg-white/5 text-slate-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border border-white/10">
                                            <Save className="w-4 h-4" /> Save Draft
                                        </button>
                                        <button 
                                            onClick={handleSendMessage}
                                            className="px-12 py-4 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-4 italic"
                                        >
                                            Transmit <Send className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* --- Action & Workflow Panel (Slide-in) --- */}
                <AnimatePresence>
                    {isActionPanelOpen && (
                        <>
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsActionPanelOpen(false)}
                                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-40"
                            />
                            <motion.aside 
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="absolute right-0 top-0 bottom-0 w-[420px] bg-[#0B101B] border-l border-white/10 z-50 flex flex-col shadow-2xl"
                            >
                                <div className="flex-shrink-0 px-10 py-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                    <div>
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Clinical Controls</h3>
                                        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mt-1 italic">Audit-Linked Response Matrix</p>
                                    </div>
                                    <button onClick={() => setIsActionPanelOpen(false)} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12">
                                    
                                    <section>
                                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 italic border-b border-white/5 pb-3">Clinical Oversight</h4>
                                        <div className="grid gap-3">
                                            {[
                                                { label: 'Flag for Primary Review', icon: Flag, color: 'amber', desc: 'Add visual indicator for high-priority monitoring' },
                                                { label: 'Protocol Deviation', icon: AlertCircle, color: 'cyan', desc: 'Log non-compliance event to regulatory trail' },
                                                { label: 'Escalate to Sponsor', icon: ArrowUpRight, color: 'red', desc: 'Transmit thread to external clinical monitor' },
                                                { label: 'Add to Participant Record', icon: FileText, color: 'indigo', desc: 'Permanent link to subject medical history' }
                                            ].map((action, i) => (
                                                <button 
                                                    key={i} 
                                                    onClick={() => handleAction(action.label)}
                                                    className="w-full flex items-start gap-4 p-5 bg-white/5 border border-white/5 rounded-[2rem] hover:bg-white/[0.08] hover:border-white/10 transition-all group text-left"
                                                >
                                                    <div className={`w-12 h-12 rounded-2xl bg-${action.color}-500/10 flex items-center justify-center text-${action.color}-500/80 group-hover:text-${action.color}-400 transition-colors flex-shrink-0`}>
                                                        <action.icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <span className="text-[11px] font-black text-white uppercase tracking-widest group-hover:text-white block">{action.label}</span>
                                                        <span className="text-[8px] text-slate-600 font-bold uppercase mt-1 block italic">{action.desc}</span>
                                                    </div>
                                                </button>
                                            ))}

                                        </div>
                                    </section>

                                    <section>
                                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 italic border-b border-white/5 pb-3">Workflow State</h4>
                                        <div className="space-y-8">
                                            <div>
                                                <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest ml-1 mb-4 block">Resolution Phase</label>
                                                <div className="grid gap-2">
                                                    {['Open', 'In Progress', 'Resolved'].map(status => (
                                                        <button 
                                                            key={status} 
                                                            onClick={() => handleStatusChange(status as MessageStatus)}
                                                            className={`w-full flex items-center justify-between p-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                                                                selectedConv.status === status 
                                                                    ? 'bg-indigo-600 text-white border border-indigo-500 shadow-xl shadow-indigo-600/20 scale-[1.02]' 
                                                                    : 'bg-white/5 border border-transparent text-slate-500 hover:text-white hover:bg-white/10'
                                                            }`}
                                                        >
                                                            {status}
                                                            {selectedConv.status === status && <Check className="w-4 h-4" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4 pt-6 border-t border-white/5">
                                                <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest ml-1 block">Coordinator Assignment</label>
                                                <div className="relative">
                                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-300 outline-none focus:border-indigo-500/50 appearance-none italic">
                                                        <option>Transfer to: Sarah Jenkins</option>
                                                        <option>Transfer to: Mark Wilson</option>
                                                        <option>Escalate to: Dr. Elena R.</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <div className="mt-auto p-8 bg-cyan-500/5 border border-cyan-500/10 rounded-[2.5rem] relative overflow-hidden group">
                                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-colors" />
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                                                <History className="w-5 h-5" />
                                            </div>
                                            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest italic">Immutable Audit Trail</p>
                                        </div>
                                        <p className="text-[11px] text-slate-600 font-bold leading-relaxed italic relative z-10">
                                            Transmission stability verified via SHA-256. This thread is ready for FDA/EMA investigator inspection.
                                        </p>
                                    </div>

                                </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
