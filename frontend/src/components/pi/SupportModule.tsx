import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    Filter, 
    Plus, 
    MessageCircle, 
    Clock, 
    ChevronRight, 
    Paperclip, 
    Send, 
    User, 
    Shield, 
    AlertCircle, 
    CheckCircle2, 
    MoreHorizontal,
    Flag,
    HelpCircle,
    Book,
    FileText,
    Settings,
    ArrowUpRight,
    X,
    History,
    MoreVertical,
    Check,
    Lock,
    ExternalLink
} from 'lucide-react';

interface TicketMessage {
    id: string;
    sender: string;
    role: string;
    content: string;
    timestamp: string;
    attachments?: string[];
}

interface Ticket {
    id: string;
    title: string;
    study: string;
    participantId?: string;
    category: 'Technical' | 'Study Ops' | 'Clinical' | 'Data' | 'Access' | 'General';
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    status: 'Open' | 'In Progress' | 'Waiting' | 'Escalated' | 'Resolved' | 'Closed';
    lastUpdated: string;
    createdAt: string;
    createdBy: string;
    assignedTo: string;
    messages: TicketMessage[];
    auditTrail: { action: string; user: string; time: string }[];
}

const MOCK_TICKETS: Ticket[] = [
    {
        id: 'TCK-1023',
        title: 'Eligibility Clarification - HI-202B',
        study: 'Hyper-Immunity Phase II',
        participantId: 'BTB-023',
        category: 'Clinical',
        priority: 'High',
        status: 'In Progress',
        lastUpdated: '2026-03-20 09:12',
        createdAt: '2026-03-19 14:00',
        createdBy: 'Sarah Jenkins',
        assignedTo: 'Dr. Chen (PI)',
        messages: [
            {
                id: 'm1',
                sender: 'Sarah Jenkins',
                role: 'Clinical Coordinator',
                content: 'Subject BTB-023 has a previous history of antibiotic use 4 months ago. Washout period for Cohort A is 90 days. Please confirm if they are eligible for enrollment.',
                timestamp: '2026-03-19 14:00'
            },
            {
                id: 'm2',
                sender: 'Dr. Chen',
                role: 'Principal Investigator',
                content: 'Washout period is indeed 90 days. 4 months (approx 120 days) is sufficient. Please proceed with the screening visit 1.',
                timestamp: '2026-03-20 09:12'
            }
        ],
        auditTrail: [
            { action: 'Ticket Created', user: 'Sarah Jenkins', time: '2026-03-19 14:00' },
            { action: 'Assigned to PI', user: 'System Auto-Route', time: '2026-03-19 14:02' },
            { action: 'Status changed to In Progress', user: 'Dr. Chen', time: '2026-03-20 09:12' }
        ]
    },
    {
        id: 'TCK-1024',
        title: 'Questionnaire Link Broken',
        study: 'Hyper-Immunity Phase II',
        participantId: 'BTB-045',
        category: 'Technical',
        priority: 'Medium',
        status: 'Open',
        lastUpdated: '2026-03-20 10:05',
        createdAt: '2026-03-20 10:05',
        createdBy: 'Elena Rodriguez',
        assignedTo: 'Super Admin',
        messages: [
            {
                id: 'm3',
                sender: 'Elena Rodriguez',
                role: 'Coordinator',
                content: 'The participant reported they cannot open the Week 2 questionnaire from their dashboard. It shows 404 error.',
                timestamp: '2026-03-20 10:05'
            }
        ],
        auditTrail: [
            { action: 'Ticket Created', user: 'Elena Rodriguez', time: '2026-03-20 10:05' },
            { action: 'Assigned to Tech Support', user: 'System Auto-Route', time: '2026-03-20 10:05' }
        ]
    }
];

export default function SupportModule() {
    const [view, setView] = useState<'Requests' | 'KB'>('Requests');
    const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
    const [selectedId, setSelectedId] = useState<string>(MOCK_TICKETS[0].id);
    const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [messageInput, setMessageInput] = useState('');
    const [isFlagged, setIsFlagged] = useState(false);
    const [hasAttachment, setHasAttachment] = useState(false);
    const [kbCategory, setKbCategory] = useState<string | null>(null);
    const [downloadingIdx, setDownloadingIdx] = useState<number | null>(null);
    const [downloadSuccessIdx, setDownloadSuccessIdx] = useState<number | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);




    const selectedTicket = useMemo(() => tickets.find(t => t.id === selectedId) || tickets[0], [tickets, selectedId]);

    const filteredTickets = useMemo(() => {
        return tickets.filter(t => 
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.study.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [tickets, searchQuery]);

    const handleSendMessage = () => {
        if (!messageInput.trim()) return;
        const newMessage: TicketMessage = {
            id: Date.now().toString(),
            sender: 'Dr. Chen',
            role: 'Principal Investigator',
            content: isFlagged ? `[HIGH IMPACT ALERT] ${messageInput}` : messageInput,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            attachments: hasAttachment ? ['clinical_report_0923.pdf'] : []
        };
        setTickets(prev => prev.map(t => t.id === selectedId ? { ...t, messages: [...t.messages, newMessage], lastUpdated: newMessage.timestamp } : t));
        setMessageInput('');
        setIsFlagged(false);
        setHasAttachment(false);
    };


    const updateTicketStatus = (newStatus: Ticket['status']) => {
        setTickets(prev => prev.map(t => t.id === selectedId ? { 
            ...t, 
            status: newStatus, 
            auditTrail: [...t.auditTrail, { action: `Status changed to ${newStatus}`, user: 'Dr. Chen', time: 'Just now' }] 
        } : t));
    };

    const MOCK_DOCS = [
        { cat: 'SOP Repository', title: 'Adverse Event Reporting SOP v3.1', type: 'PDF', size: '2.4 MB', date: '2024-02-15' },
        { cat: 'SOP Repository', title: 'Subject Enrollment Protocol Hub', type: 'DOCX', size: '1.1 MB', date: '2024-01-20' },
        { cat: 'SOP Repository', title: 'Data Integrity Maintenance Log', type: 'XLSX', size: '450 KB', date: '2024-03-01' },
        { cat: 'Training Modules', desc: 'PI Training: Electronic Signature Laws', type: 'Video', size: '124 MB', date: '2024-02-10' },
        { cat: 'Training Modules', desc: 'Coordinator: Case Report Form Guide', type: 'PDF', size: '5.6 MB', date: '2024-03-12' },
        { cat: 'Platform FAQs', title: 'MSR-01 Error Troubleshooting', type: 'Knowledge', size: '12 KB', date: '2024-03-18' },
        { cat: 'Platform FAQs', title: 'Digital Signature Failures Fix', type: 'Knowledge', size: '8 KB', date: '2024-03-19' }
    ];

    const handleDownload = (idx: number) => {
        setDownloadingIdx(idx);
        setTimeout(() => {
            setDownloadingIdx(null);
            setDownloadSuccessIdx(idx);
            setTimeout(() => setDownloadSuccessIdx(null), 3000);
        }, 1500);
    };


    return (
        <div className="flex flex-col h-[calc(100vh-14rem)] bg-[#0B101B] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            {/* Top Tactical Header */}
            <div className="flex-shrink-0 px-10 py-6 bg-[#0B101B]/80 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between z-40">
                <div className="flex items-center gap-8">
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Help & Support</h2>
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                        <button 
                            onClick={() => setView('Requests')}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                view === 'Requests' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'
                            }`}
                        >
                            Requests Hub
                        </button>
                        <button 
                            onClick={() => setView('KB')}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                view === 'KB' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'
                            }`}
                        >
                            Knowledge Base
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="relative w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Find tickets..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-[9px] text-white placeholder-slate-700 outline-none focus:border-indigo-500/50 uppercase tracking-widest"
                        />
                    </div>
                    <button 
                        onClick={() => setIsNewRequestOpen(true)}
                        className="px-6 py-4 bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-900/40"
                    >
                        + New Request
                    </button>
                </div>
            </div>

            {view === 'Requests' ? (
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Ticket List */}
                    <div className="w-[380px] border-r border-white/5 flex flex-col overflow-hidden bg-white/[0.01]">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{filteredTickets.length} ACTIVE INCIDENTS</span>
                            <button className="p-2 text-slate-500 hover:text-white transition-colors"><Filter className="w-3.5 h-3.5" /></button>
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
                                        <span className="text-[8px] font-black text-slate-500 font-mono tracking-widest">{t.id}</span>
                                        <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-tighter ${
                                            t.priority === 'Urgent' ? 'bg-red-500 text-white' : 
                                            t.priority === 'High' ? 'bg-amber-500 text-white' : 
                                            'bg-slate-700 text-slate-400'
                                        }`}>{t.priority}</span>
                                    </div>
                                    <h4 className={`text-[11px] font-black uppercase italic tracking-wider transition-all ${selectedId === t.id ? 'text-white' : 'text-slate-400'}`}>{t.title}</h4>
                                    <div className="mt-4 flex items-center justify-between">
                                        <p className="text-[8px] text-slate-600 font-bold italic line-clamp-1">{t.study}</p>
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${t.status === 'Open' ? 'bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]' : 'bg-slate-700'}`} />
                                            <span className="text-[8px] font-black text-slate-500 uppercase italic">{t.status}</span>
                                        </div>
                                    </div>
                                    {selectedId === t.id && (
                                        <motion.div layoutId="active-ind" className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-500 rounded-r-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Center Panel: Communication Thread */}
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
                                <div key={m.id} className={`flex flex-col ${m.role === 'Principal Investigator' ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-3 mb-2 px-1">
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">{m.sender}</span>
                                        <span className="text-[8px] font-black text-slate-800 uppercase italic">{m.role}</span>
                                        <span className="text-[7px] text-slate-900 font-mono tracking-tighter">{m.timestamp}</span>
                                    </div>
                                    <div className={`p-6 rounded-[2rem] max-w-[80%] border ${
                                        m.role === 'Principal Investigator' 
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

                    {/* Right Panel: Details & Governance */}
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
                </div>
            ) : (
                /* Knowledge Base Tab */
                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 lg:p-20 flex flex-col items-center">
                   <AnimatePresence mode="wait">
                       {!kbCategory ? (
                           <motion.div 
                                key="hub"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full flex flex-col items-center text-center space-y-12"
                           >
                               <div className="w-24 h-24 lg:w-32 lg:h-32 bg-indigo-600/10 rounded-[2.5rem] lg:rounded-[3rem] border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <Book className="w-10 h-10 lg:w-16 lg:h-16" />
                               </div>
                               <div className="max-w-2xl space-y-6">
                                    <h2 className="text-2xl lg:text-4xl font-black text-white italic uppercase tracking-tighter leading-tight">MusB Intelligence Hub & Knowledge Repository</h2>
                                    <p className="text-[10px] lg:text-[11px] text-slate-500 font-black uppercase tracking-widest leading-relaxed italic">
                                        Access training manuals, standard operating procedures, and platform video tutorials. 
                                        Our repository is cryptographically synced across global research nodes for unified protocol alignment.
                                    </p>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full max-w-5xl">
                                    {[
                                        { label: 'SOP Repository', desc: 'Protocol Standard Operating Procedures', icon: FileText },
                                        { label: 'Training Modules', desc: 'CME-certified site coordinator training', icon: HelpCircle },
                                        { label: 'Platform FAQs', desc: 'Technical troubleshooting & FAQ logs', icon: Settings }
                                    ].map((kb, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => setKbCategory(kb.label)}
                                            className="p-6 lg:p-8 bg-white/5 border border-white/5 rounded-[2.5rem] lg:rounded-[3rem] text-left space-y-4 hover:border-indigo-500/50 hover:bg-white/[0.08] transition-all group active:scale-95"
                                        >
                                            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all">
                                                <kb.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                                            </div>
                                            <h4 className="text-[10px] lg:text-[11px] font-black text-white uppercase tracking-widest italic">{kb.label}</h4>
                                            <p className="text-[8px] lg:text-[9px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed italic line-clamp-2">{kb.desc}</p>
                                        </button>
                                    ))}
                               </div>
                           </motion.div>
                       ) : (
                           <motion.div 
                                key="detail"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className="w-full max-w-5xl space-y-12"
                           >
                               <div className="flex items-center justify-between border-b border-white/5 pb-8">
                                   <div className="flex items-center gap-6">
                                       <button 
                                            onClick={() => setKbCategory(null)}
                                            className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all hover:bg-white/10 italic text-[9px] font-black uppercase flex items-center gap-2"
                                       >
                                           <X className="w-4 h-4" /> Back to Hub
                                       </button>
                                       <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{kbCategory}</h2>
                                   </div>
                                   <p className="text-[9px] text-slate-500 font-black italic uppercase">Repository Synced Oct 2024</p>
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                                   {MOCK_DOCS.filter(d => d.cat === kbCategory).map((doc, i) => (
                                       <div 
                                            key={i} 
                                            onClick={() => !downloadingIdx && handleDownload(i)}
                                            className="p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] flex items-center justify-between group hover:border-indigo-500/30 transition-all cursor-pointer active:scale-[0.98]"
                                       >
                                           <div className="flex items-center gap-4">
                                               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                                    downloadingIdx === i ? 'bg-indigo-600 text-white animate-pulse' :
                                                    downloadSuccessIdx === i ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' :
                                                    'bg-white/5 text-slate-500'
                                               }`}>
                                                   {downloadSuccessIdx === i ? <Check className="w-5 h-5" /> : 
                                                    doc.type === 'PDF' ? <FileText className="w-5 h-5" /> : 
                                                    doc.type === 'Video' ? <MessageCircle className="w-5 h-5" /> : 
                                                    <Settings className="w-5 h-5" />}
                                               </div>
                                               <div>
                                                   <h5 className="text-[11px] font-black text-white uppercase italic tracking-wider">{doc.title || doc.desc}</h5>
                                                   <div className="flex items-center gap-3 mt-1.5 font-mono">
                                                       <span className="text-[7px] text-indigo-400 font-black uppercase">
                                                           {downloadingIdx === i ? 'TRANSMITTING...' : doc.type}
                                                       </span>
                                                       <span className="text-[7px] text-slate-700 uppercase italic">Last Updated: {doc.date}</span>
                                                       <span className="text-[7px] text-slate-800 font-black">{doc.size}</span>
                                                   </div>
                                               </div>
                                           </div>
                                           <div className="flex items-center gap-3">
                                               {downloadingIdx === i ? (
                                                   <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="p-3 text-indigo-400">
                                                       <History className="w-5 h-5" />
                                                   </motion.div>
                                               ) : downloadSuccessIdx === i ? (
                                                   <div className="p-3 text-emerald-500">
                                                       <CheckCircle2 className="w-5 h-5" />
                                                   </div>
                                               ) : (
                                                   <button className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 hover:text-white">
                                                       <ExternalLink className="w-4 h-4" />
                                                   </button>
                                               )}
                                           </div>
                                       </div>
                                   ))}
                               </div>

                           </motion.div>
                       )}
                   </AnimatePresence>
                </div>

            )}

            {/* New Request Modal */}
            <AnimatePresence>
                {isNewRequestOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsNewRequestOpen(false)}
                            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[80vh] bg-[#0B101B] border border-white/10 rounded-[4rem] z-[101] flex flex-col shadow-2xl overflow-hidden"
                        >
                            <div className="flex-shrink-0 px-12 py-10 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Initiate New Incident Report</h3>
                                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mt-3 italic">Structured Routing and Protocol Synchronization</p>
                                </div>
                                <button onClick={() => setIsNewRequestOpen(false)} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-16 space-y-16">
                                <section className="grid grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">Incident Title</label>
                                        <input type="text" placeholder="Summary of the incident..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-sm font-black italic uppercase text-white placeholder-slate-800 outline-none focus:border-indigo-500/50" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">Incident Category</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-sm font-black italic uppercase text-white outline-none focus:border-indigo-500/50 appearance-none">
                                            <option>Technical Support</option>
                                            <option>Clinical / Protocol</option>
                                            <option>Study Operations</option>
                                            <option>Data & Reports</option>
                                            <option>Access & Permissions</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 space-y-4">
                                        <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">Incident Description & Observation Logs</label>
                                        <textarea placeholder="Describe the behavior or required clarification in detail..." className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-6 text-sm font-black italic uppercase text-white placeholder-slate-800 outline-none focus:border-indigo-500/50 h-32 resize-none" />
                                    </div>
                                </section>

                                <section className="grid grid-cols-3 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">Target Study</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-[10px] font-black uppercase text-white outline-none appearance-none">
                                            <option>HI-202B</option>
                                            <option>MS-801</option>
                                            <option>NR-009</option>
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">Priority Coefficient</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-[10px] font-black uppercase text-white outline-none appearance-none">
                                            <option>Low</option>
                                            <option>Medium</option>
                                            <option>High</option>
                                            <option>Urgent</option>
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">Participant Tracking ID</label>
                                        <input type="text" placeholder="BTB-XXX" className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-[10px] font-black uppercase text-white placeholder-slate-800 outline-none" />
                                    </div>
                                </section>

                                <div className="p-12 bg-indigo-500/5 border border-indigo-500/10 rounded-[3rem] flex flex-col items-center justify-center text-center gap-6 group hover:border-indigo-500/30 transition-all border-dashed">
                                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-slate-600 group-hover:text-indigo-400 transition-all">
                                        <Paperclip className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-white uppercase italic">Append Scientific Evidence</p>
                                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2 italic">Drag and drop screenshots, PDFs, or Lab reports (MAX 50MB)</p>
                                    </div>
                                    <button className="px-8 py-3 bg-white/5 border border-white/10 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-white transition-all">Browse Cryptographic Files</button>
                                </div>
                            </div>

                            <div className="flex-shrink-0 px-12 py-10 bg-[#0B101B]/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-between">
                                <button onClick={() => setIsNewRequestOpen(false)} className="px-10 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-colors">Abort Submission</button>
                                <div className="flex gap-4">
                                    <button className="px-10 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white">Save Temporary Draft</button>
                                    <button 
                                        onClick={() => setIsNewRequestOpen(false)}
                                        className="px-12 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-900/40 hover:scale-105 transition-all italic"
                                    >
                                        Transmit Incident Report
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
