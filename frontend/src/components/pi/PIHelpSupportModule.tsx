import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
    Search, Plus, MessageSquare, Info, ShieldAlert, 
    User, Paperclip, Send, X, MoreVertical, Clock, 
    Tag, Bookmark, Save, Layers, ListFilter, CheckCircle2, 
    AlertCircle, ChevronRight, HelpCircle, FileText, 
    ArrowUpRight, Filter, ChevronDown, Bell, Lock, Globe
} from 'lucide-react';

// --- TYPES ---
interface Message {
    id: string;
    sender: string;
    role: string;
    time: string;
    text: string;
    tag: string | null;
    attachment: string | null;
    isSystem?: boolean;
    fromPI?: boolean;
}

interface Ticket {
    id: string;
    title: string;
    study: string;
    participantId: string | null;
    category: string;
    priority: string;
    status: string;
    assignedTo: string;
    createdBy: string;
    createdRole: string;
    createdAt: string;
    lastUpdated: string;
    unread: boolean;
    draft: string;
    linkedRecords: { type: string; id: string }[];
    messages: Message[];
    auditLog: { time: string; user: string; action: string }[];
}

interface FAQ {
    category: string;
    color: string;
    items: { q: string, a: string }[];
}

// --- CONSTANTS ---
const COLORS = {
    bg: '#0B101B',
    accent: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#38bdf8',
    text: '#94a3b8',
    label: '#475569',
    glass: 'rgba(255,255,255,0.025)',
    border: 'rgba(255,255,255,0.06)'
};

const TEMPLATES = [
    "Please provide more details about the issue.",
    "Issue has been resolved on our end.",
    "This has been escalated to the admin team.",
    "We are currently investigating this issue."
];

const MOCK_TICKETS: Ticket[] = [
    {
        id: 'TCK-1023',
        title: 'Participant consent form not loading',
        study: 'Beat the Bloat',
        participantId: 'BTB-023',
        category: 'Technical Support',
        priority: 'High',
        status: 'In Progress',
        assignedTo: 'Super Admin',
        createdBy: 'Dr. Yadav',
        createdRole: 'PI',
        createdAt: '2026-03-20 10:15',
        lastUpdated: '2h ago',
        unread: true,
        draft: '',
        linkedRecords: [{ type: 'Participant', id: 'BTB-023' }],
        messages: [
            { id: 'm1', sender: 'John Doe', role: 'Coordinator', time: '10:32 AM', text: 'Participant BTB-023 is unable to open the eConsent form on mobile.', tag: 'Technical', attachment: 'screenshot.png', fromPI: false },
            { id: 'm2', sender: 'Dr. Yadav', role: 'PI', time: '10:45 AM', text: 'Please check if there is a PDF version mismatch with the latest IRB approval.', tag: 'Clinical', attachment: null, fromPI: true },
            { id: 'm3', sender: 'System', role: 'System', time: '11:00 AM', text: 'Ticket assigned to Super Admin', tag: null, attachment: null, isSystem: true }
        ],
        auditLog: [
            { time: '10:15 AM', user: 'Dr. Yadav', action: 'Ticket created' },
            { time: '10:45 AM', user: 'Dr. Yadav', action: 'Message sent' },
            { time: '11:00 AM', user: 'System', action: 'Assigned to Super Admin' }
        ]
    },
    {
        id: 'TCK-1018',
        title: 'Visit 3 scheduling conflict',
        study: 'Menopause Study',
        participantId: 'MS-044',
        category: 'Study Operations',
        priority: 'Medium',
        status: 'Open',
        assignedTo: 'Coordinator',
        createdBy: 'Dr. Yadav',
        createdRole: 'PI',
        createdAt: '2026-03-19 14:00',
        lastUpdated: '1d ago',
        unread: false,
        draft: '',
        linkedRecords: [{ type: 'Study', id: 'Menopause Study' }],
        messages: [
            { id: 'm4', sender: 'Elena Rodriguez', role: 'Coordinator', time: 'Yesterday 2:00 PM', text: 'Participant MS-044 requested to reschedule Visit 3 due to work conflict.', tag: 'General', attachment: null, fromPI: false }
        ],
        auditLog: [
            { time: 'Yesterday 2:00 PM', user: 'Elena Rodriguez', action: 'Ticket created' }
        ]
    },
    {
        id: 'TCK-1015',
        title: 'IRB report export failing',
        study: 'NR-009',
        participantId: null,
        category: 'Data & Reports',
        priority: 'Urgent',
        status: 'Escalated',
        assignedTo: 'Super Admin',
        createdBy: 'Rachel Voss',
        createdRole: 'Regulatory Specialist',
        createdAt: '2026-03-18 09:00',
        lastUpdated: '2d ago',
        unread: true,
        draft: '',
        linkedRecords: [],
        messages: [
            { id: 'm5', sender: 'Rachel Voss', role: 'Regulatory Specialist', time: '2d ago 9:00 AM', text: 'The IRB export function is returning a 500 error for all studies. Needs urgent fix.', tag: 'Urgent', attachment: 'error_log.txt', fromPI: false },
            { id: 'm6', sender: 'System', role: 'System', time: '2d ago 9:05 AM', text: 'Ticket escalated to Super Admin', tag: null, attachment: null, isSystem: true }
        ],
        auditLog: [
            { time: '2d ago 9:00 AM', user: 'Rachel Voss', action: 'Ticket created' },
            { time: '2d ago 9:05 AM', user: 'System', action: 'Auto-escalated — Urgent priority' }
        ]
    }
];

const KNOWLEDGE_BASE: FAQ[] = [
    {
        category: 'Technical',
        color: COLORS.accent,
        items: [
            { q: 'How do I reset my password?', a: 'Go to Login page → Forgot Password → enter your email → check inbox for reset link.' },
            { q: 'Why is data not saving?', a: 'Check your internet connection. If issue persists, clear cache and retry. Contact admin if unresolved.' }
        ]
    },
    {
        category: 'Clinical',
        color: COLORS.danger,
        items: [
            { q: 'How do I report an adverse event?', a: 'Go to Subject Review → Safety Tab → Log New AE. Fill all required fields and submit.' },
            { q: 'What is the eligibility approval process?', a: 'PI reviews screening data in Subject Review → Eligibility Tab → clicks Approve Eligibility.' }
        ]
    },
    {
        category: 'Operations',
        color: COLORS.warning,
        items: [
            { q: 'How do I reschedule a visit?', a: 'Go to Study Management → Visits → select participant → edit visit date → save.' },
            { q: 'How do I upload documents?', a: 'Go to Subject Review → Documents Tab → click Upload Document → select file.' }
        ]
    },
    {
        category: 'Access',
        color: COLORS.success,
        items: [
            { q: 'How do I add a team member?', a: 'Go to Team Management → click + Add Team Member → fill form → save.' },
            { q: 'How do I change a user role?', a: 'Go to Team Management → find user → click Edit → change role → save.' }
        ]
    }
];

// --- COMPONENT ---
export default function PIHelpSupportModule() {
    // State
    const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
    const [activeTicketId, setActiveTicketId] = useState('TCK-1023');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [sortMode, setSortMode] = useState('recent');
    const [myRequestsOnly, setMyRequestsOnly] = useState(false);
    const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
    const [kbSearch, setKbSearch] = useState('');
    const [kbOpenCategory, setKbOpenCategory] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [selectedTag, setSelectedTag] = useState('General');
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [newRequestOpen, setNewRequestOpen] = useState(false);
    const [newRequestForm, setNewRequestForm] = useState({ title: '', description: '', category: 'Technical Support', priority: 'Medium', study: '', participantId: '', visit: '', assignTo: 'auto', files: [] as File[] });
    const [toasts, setToasts] = useState<{ id: string, type: string, message: string }[]>([]);
    const [confirmModal, setConfirmModal] = useState<{ message: string, onConfirm: () => void, type?: string } | null>(null);
    const [ticketCounter, setTicketCounter] = useState(1024);

    const threadBottomRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filtered Tickets
    const filteredTickets = useMemo(() => {
        let list = tickets.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 t.study.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterStatus === 'All' || t.status === filterStatus;
            const matchesUser = !myRequestsOnly || t.createdBy === 'Dr. Yadav';
            return matchesSearch && matchesFilter && matchesUser;
        });

        if (sortMode === 'Priority First') {
            const pMap: any = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
            return list.sort((a, b) => pMap[a.priority] - pMap[b.priority]);
        }
        if (sortMode === 'Unread First') {
            return list.sort((a, b) => (a.unread === b.unread) ? 0 : a.unread ? -1 : 1);
        }
        return list; // default most recent
    }, [tickets, searchQuery, filterStatus, myRequestsOnly, sortMode]);

    const activeTicket = tickets.find(t => t.id === activeTicketId);

    // Effects
    useEffect(() => {
        threadBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeTicket?.messages, showKnowledgeBase]);

    // Handlers
    const addToast = (message: string, type = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev.slice(-2), { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    const handleSelectTicket = (id: string) => {
        setActiveTicketId(id);
        setShowKnowledgeBase(false);
        setTickets(prev => prev.map(t => t.id === id ? { ...t, unread: false } : t));
    };

    const handleSendMessage = () => {
        if (!messageInput.trim() && !attachedFile) return;
        const msg: Message = {
            id: 'm-' + Date.now(),
            sender: 'Dr. Yadav',
            role: 'PI',
            time: 'Just now',
            text: messageInput,
            tag: selectedTag,
            attachment: attachedFile ? attachedFile.name : null,
            fromPI: true
        };
        setTickets(prev => prev.map(t => t.id === activeTicketId ? {
            ...t,
            lastUpdated: 'Just now',
            messages: [...t.messages, msg],
            auditLog: [...t.auditLog, { time: 'Just now', user: 'Dr. Yadav', action: 'Message sent' }]
        } : t));
        setMessageInput('');
        setAttachedFile(null);
        setSelectedTag('General');
        addToast('Message dispatched');
    };

    const executeStatusChange = (newStatus: string) => {
        if (!activeTicket) return;
        const sysMsg: Message = {
            id: 'sys-' + Date.now(),
            sender: 'System',
            role: 'System',
            time: 'Now',
            text: `Status updated: ${newStatus}`,
            tag: null,
            attachment: null,
            isSystem: true
        };
        setTickets(prev => prev.map(t => t.id === activeTicketId ? {
            ...t,
            status: newStatus,
            messages: [...t.messages, sysMsg],
            auditLog: [...t.auditLog, { time: 'Now', user: 'PI (You)', action: `Status changed to ${newStatus}` }]
        } : t));
        addToast(`Ticket marked as ${newStatus}`);
    };

    const requestStatusChange = (newStatus: string) => {
        if (newStatus === 'Resolved' || newStatus === 'Closed' || newStatus === 'Escalated') {
            setConfirmModal({
                message: `Are you sure you want to mark this ticket as ${newStatus}? This will trigger system notifications and audit trail logging.`,
                type: newStatus === 'Escalated' ? 'danger' : 'indigo',
                onConfirm: () => {
                    executeStatusChange(newStatus);
                    setConfirmModal(null);
                }
            });
        } else {
            executeStatusChange(newStatus);
        }
    };

    const handleNewRequest = () => {
        if (!newRequestForm.title || !newRequestForm.description) return addToast('Title and Description required', 'error');
        const id = `TCK-${ticketCounter}`;
        let autoAssign = 'Super Admin';
        if (newRequestForm.category === 'Clinical Protocol') autoAssign = 'PI';
        if (newRequestForm.category === 'Study Operations') autoAssign = 'Coordinator';

        const newTicket: Ticket = {
            id,
            title: newRequestForm.title,
            study: newRequestForm.study || 'N/A',
            participantId: newRequestForm.participantId,
            category: newRequestForm.category,
            priority: newRequestForm.priority,
            status: 'Open',
            assignedTo: newRequestForm.assignTo === 'auto' ? autoAssign : newRequestForm.assignTo,
            createdBy: 'Dr. Yadav',
            createdRole: 'PI',
            createdAt: new Date().toLocaleString(),
            lastUpdated: 'Now',
            unread: false,
            draft: '',
            linkedRecords: [],
            messages: [
                { id: 'm0', sender: 'Dr. Yadav', role: 'PI', time: 'Now', text: newRequestForm.description, tag: 'General', attachment: null, fromPI: true }
            ],
            auditLog: [{ time: 'Now', user: 'Dr. Yadav', action: 'Ticket created' }]
        };

        setTickets(prev => [newTicket, ...prev]);
        setTicketCounter(prev => prev + 1);
        setActiveTicketId(id);
        setNewRequestOpen(false);
        setNewRequestForm({ title: '', description: '', category: 'Technical Support', priority: 'Medium', study: '', participantId: '', visit: '', assignTo: 'auto', files: [] });
        addToast(`Ticket ${id} initialized`);
    };

    // --- STYLES ---
    const G = {
        glass: { backgroundColor: COLORS.glass, backdropFilter: 'blur(12px)', border: `1px solid ${COLORS.border}` },
        label: { fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: COLORS.label },
        title: { fontSize: '20px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' as const, color: 'white' },
        btnIndigo: { backgroundColor: COLORS.accent, color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '4px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer' },
        btnGhost: { backgroundColor: 'transparent', color: COLORS.text, border: `1px solid ${COLORS.border}`, padding: '0.6rem 1.25rem', borderRadius: '4px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer' }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', backgroundColor: COLORS.bg, color: 'white', overflow: 'hidden' }}>
            
            {/* STICKY TOP BAR */}
            <header style={{ ...G.glass, padding: '1rem 3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <HelpCircle size={24} color={COLORS.accent} />
                    <h1 style={G.title}>Help & Support</h1>
                </div>

                <div style={{ flex: 1, maxWidth: '500px', margin: '0 2rem', position: 'relative' }}>
                    <Search size={16} color={COLORS.label} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                        style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.border}`, borderRadius: '100px', padding: '0.6rem 1rem 0.6rem 2.8rem', color: 'white', outline: 'none', fontSize: '14px' }}
                        placeholder="Search ticket IDs, titles, study nodes..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button style={G.btnIndigo} onClick={() => setNewRequestOpen(true)}><Plus size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> New Request</button>
                    <button 
                        style={{ ...G.btnGhost, borderColor: myRequestsOnly ? COLORS.accent : COLORS.border, color: myRequestsOnly ? 'white' : COLORS.text }}
                        onClick={() => setMyRequestsOnly(!myRequestsOnly)}
                    >
                        My Requests
                    </button>
                    <button 
                        style={{ ...G.btnGhost, backgroundColor: showKnowledgeBase ? COLORS.accent : 'transparent', color: 'white', border: 'none' }}
                        onClick={() => setShowKnowledgeBase(!showKnowledgeBase)}
                    >
                        Knowledge Base
                    </button>
                </div>
            </header>

            {/* THREE-PANEL SPLIT */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* LEFT PANEL: Ticket List */}
                <div style={{ width: '280px', borderRight: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ padding: '1rem', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {['All', 'Open', 'In Progress', 'Escalated', 'Resolved'].map(s => (
                            <button 
                                key={s} 
                                onClick={() => setFilterStatus(s)}
                                style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', padding: '0.3rem 0.6rem', borderRadius: '4px', border: `1px solid ${filterStatus === s ? COLORS.accent : COLORS.border}`, backgroundColor: filterStatus === s ? `${COLORS.accent}20` : 'transparent', color: filterStatus === s ? 'white' : COLORS.label, cursor: 'pointer' }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                        {filteredTickets.map(t => (
                            <div 
                                key={t.id}
                                onClick={() => handleSelectTicket(t.id)}
                                style={{
                                    padding: '1.25rem', borderBottom: `1px solid ${COLORS.border}`, cursor: 'pointer',
                                    backgroundColor: activeTicketId === t.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                                    borderLeft: `3px solid ${t.unread ? COLORS.accent : (activeTicketId === t.id ? COLORS.accent : 'transparent')}`,
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 900, color: COLORS.accent, fontFamily: 'monospace' }}>{t.id}</span>
                                    <span style={{ fontSize: '10px', color: COLORS.label }}>{t.lastUpdated}</span>
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', marginBottom: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                                <div style={{ fontSize: '11px', color: COLORS.label, marginBottom: '0.75rem' }}>{t.study} • {t.participantId || 'Global'}</div>
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', padding: '0.2rem 0.4rem', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.05)', color: COLORS.text }}>{t.category}</span>
                                    <span style={{ 
                                        fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', padding: '0.2rem 0.4rem', borderRadius: '2px',
                                        backgroundColor: t.priority === 'Urgent' ? `${COLORS.danger}20` : t.priority === 'High' ? `${COLORS.warning}20` : 'rgba(255,255,255,0.05)',
                                        color: t.priority === 'Urgent' ? COLORS.danger : t.priority === 'High' ? COLORS.warning : COLORS.text
                                    }}>{t.priority}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CENTER PANEL: Conversation / KB */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                    {showKnowledgeBase ? (
                        <div style={{ flex: 1, overflowY: 'auto', padding: '3rem' }}>
                            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                <h2 style={{ ...G.title, fontSize: '24px', marginBottom: '1rem' }}>Common Solutions</h2>
                                <p style={{ color: COLORS.label, marginBottom: '3rem' }}>Browse quick-fix documentation for clinical and technical operations.</p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    {KNOWLEDGE_BASE.map(kb => (
                                        <div key={kb.category} style={{ ...G.glass, padding: '1.5rem', borderRadius: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '25%', backgroundColor: kb.color }} />
                                                <span style={{ ...G.label, color: 'white' }}>{kb.category} Resources</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                {kb.items.map((item, idx) => (
                                                    <div key={idx} style={{ borderBottom: idx < kb.items.length - 1 ? `1px solid ${COLORS.border}` : 'none', paddingBottom: '1rem' }}>
                                                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.accent, marginBottom: '0.5rem' }}>Q: {item.q}</div>
                                                        <div style={{ fontSize: '13px', color: COLORS.text, lineHeight: 1.5 }}>{item.a}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : activeTicket ? (
                        <>
                            {/* THREAD HEADER */}
                            <div style={{ padding: '1.5rem 3rem', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>{activeTicket.id} • {activeTicket.title}</div>
                                    <div style={{ fontSize: '12px', color: COLORS.label, marginTop: '0.4rem' }}>{activeTicket.study} {activeTicket.participantId ? `| PID: ${activeTicket.participantId}` : ''}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button style={{ ...G.btnGhost, borderColor: COLORS.danger, color: COLORS.danger }} onClick={() => requestStatusChange('Escalated')}>Escalate</button>
                                    <button style={{ ...G.btnGhost, borderColor: COLORS.success, color: COLORS.success }} onClick={() => requestStatusChange('Resolved')}>Resolve</button>
                                    <button style={G.btnGhost} onClick={() => requestStatusChange('Closed')}>Close</button>
                                </div>
                            </div>

                            {/* CHAT THREAD */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="custom-scrollbar">
                                {activeTicket.messages.map(m => (
                                    <div key={m.id} style={{ alignSelf: m.isSystem ? 'center' : (m.fromPI ? 'flex-end' : 'flex-start'), maxWidth: m.isSystem ? '100%' : '75%' }}>
                                        {m.isSystem ? (
                                            <div style={{ fontSize: '11px', color: COLORS.label, fontStyle: 'italic', padding: '1rem', textAlign: 'center' }}>
                                                — {m.text} at {m.time} —
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: COLORS.label, marginBottom: '0.5rem', textAlign: m.fromPI ? 'right' : 'left' }}>
                                                    {m.sender} <span style={{ color: COLORS.accent }}>[{m.role}]</span> • {m.time}
                                                </div>
                                                <div style={{ 
                                                    padding: '1rem 1.5rem', borderRadius: '8px', fontSize: '14px', lineHeight: 1.6,
                                                    backgroundColor: m.fromPI ? `${COLORS.accent}15` : 'rgba(255,255,255,0.03)',
                                                    border: `1px solid ${m.fromPI ? `${COLORS.accent}40` : COLORS.border}`,
                                                    color: '#f8fafc'
                                                }}>
                                                    {m.text}
                                                    {m.attachment && (
                                                        <div style={{ marginTop: '0.75rem', padding: '0.5rem', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.2)', border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <Paperclip size={12} color={COLORS.accent} />
                                                            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{m.attachment}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {m.tag && (
                                                    <div style={{ marginTop: '0.5rem', textAlign: m.fromPI ? 'right' : 'left' }}>
                                                        <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: m.tag === 'Urgent' ? `${COLORS.danger}20` : 'rgba(255,255,255,0.1)', color: m.tag === 'Urgent' ? COLORS.danger : COLORS.text }}>{m.tag}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                                <div ref={threadBottomRef} />
                            </div>

                            {/* INPUT BOX */}
                            <div style={{ padding: '2rem 3rem', borderTop: `1px solid ${COLORS.border}`, backgroundColor: 'rgba(7, 10, 19, 0.4)' }}>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', padding: '2px' }}>
                                        {['General', 'Technical', 'Clinical', 'Urgent'].map(t => (
                                            <button key={t} onClick={() => setSelectedTag(t)} style={{ border: 'none', background: selectedTag === t ? `${COLORS.accent}20` : 'transparent', color: selectedTag === t ? 'white' : COLORS.label, padding: '0.3rem 0.8rem', fontSize: '10px', fontWeight: 900, borderRadius: '2px', cursor: 'pointer' }}>{t}</button>
                                        ))}
                                    </div>
                                    <div style={{ flex: 1 }} />
                                    <select 
                                        style={{ ...G.btnGhost, textAlign: 'left', outline: 'none', fontSize: '10px', padding: '0.4rem 0.8rem', backgroundColor: '#0B101B' }}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                    >
                                        <option value="">Select Template...</option>
                                        {TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        {attachedFile && (
                                            <div style={{ position: 'absolute', top: '-40px', left: 0, padding: '0.4rem 0.8rem', backgroundColor: `${COLORS.accent}15`, borderRadius: '4px', border: `1px solid ${COLORS.accent}40`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <Paperclip size={12} color={COLORS.accent} />
                                                <span style={{ fontSize: '11px', fontWeight: 900 }}>{attachedFile.name}</span>
                                                <X size={12} color={COLORS.accent} style={{ cursor: 'pointer' }} onClick={() => setAttachedFile(null)} />
                                            </div>
                                        )}
                                        <textarea 
                                            style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: 'white', padding: '1rem', fontSize: '15px', outline: 'none', minHeight: '80px', resize: 'none' }}
                                            placeholder="Compose clinical or technical correspondence..."
                                            value={messageInput}
                                            onChange={e => setMessageInput(e.target.value)}
                                        />
                                    </div>
                                    <input type="file" ref={fileInputRef} hidden onChange={e => setAttachedFile(e.target.files?.[0] || null)} />
                                    <button style={{ ...G.btnGhost, padding: '1.25rem' }} onClick={() => fileInputRef.current?.click()}><Paperclip size={20} /></button>
                                    <button style={{ ...G.btnIndigo, height: '80px', padding: '0 2.5rem' }} onClick={handleSendMessage}><Send size={20} /></button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: COLORS.label }}>
                            <Bell size={64} style={{ opacity: 0.1, marginBottom: '2rem' }} />
                            <div style={{ ...G.title, fontSize: '20px' }}>Support Channel Ready</div>
                            <div style={{ fontSize: '12px', marginTop: '1rem' }}>Select a ticket to begin correspondence.</div>
                        </div>
                    )}
                </div>

                {/* RIGHT PANEL: Ticket Details */}
                <div style={{ width: '260px', borderLeft: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255,255,255,0.01)', overflowY: 'auto' }} className="custom-scrollbar">
                    {activeTicket ? (
                        <div style={{ padding: '2rem 1.5rem' }}>
                            <div style={{ marginBottom: '2.5rem' }}>
                                <label style={G.label}>Origin Parameters</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: COLORS.label }}>Ticket Identity</div>
                                        <div style={{ fontSize: '15px', fontWeight: 900, fontFamily: 'monospace', color: COLORS.accent }}>{activeTicket.id}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: COLORS.label }}>Created By</div>
                                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{activeTicket.createdBy} <span style={{ color: COLORS.label, fontSize: '10px' }}>[{activeTicket.createdRole}]</span></div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: COLORS.label }}>Study Node</div>
                                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{activeTicket.study}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '2.5rem' }}>
                                <label style={G.label}>Assignment Routing</label>
                                <select 
                                    style={{ ...G.btnGhost, width: '100%', marginTop: '1rem', outline: 'none', textAlign: 'left', backgroundColor: '#0B101B' }}
                                    value={activeTicket.assignedTo}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        const sysMsg: Message = { id: 'sys-'+Date.now(), sender: 'System', role: 'System', time: 'Now', text: `Assigned to ${name}`, tag: null, attachment: null, isSystem: true };
                                        setTickets(prev => prev.map(t => t.id === activeTicketId ? { ...t, assignedTo: name, messages: [...t.messages, sysMsg] } : t));
                                        addToast(`Routed to ${name}`);
                                    }}
                                >
                                    <option>Super Admin</option>
                                    <option>PI</option>
                                    <option>Coordinator</option>
                                    <option>Rachel Voss</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '2.5rem' }}>
                                <label style={G.label}>Status Workflow</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1rem' }}>
                                    {['Open', 'In Progress', 'Waiting', 'Resolved', 'Closed'].map(s => (
                                        <button 
                                            key={s} 
                                            onClick={() => requestStatusChange(s)}
                                            style={{ ...G.btnGhost, textAlign: 'left', border: activeTicket.status === s ? `1px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`, color: activeTicket.status === s ? 'white' : COLORS.label, backgroundColor: activeTicket.status === s ? `${COLORS.accent}15` : 'transparent' }}
                                        >
                                            {s} {activeTicket.status === s && <CheckCircle2 size={12} style={{ float: 'right', marginTop: '2px' }} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: '1.5rem' }}>
                                <label style={G.label}>Audit Trace</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                                    {activeTicket.auditLog.map((log, i) => (
                                        <div key={i} style={{ fontSize: '10px', color: COLORS.label }}>
                                            <span style={{ fontWeight: 900, color: COLORS.accent }}>{log.time}</span> • {log.user}: {log.action}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: COLORS.label, fontSize: '12px' }}>Operational details waiting for ticket selection.</div>
                    )}
                </div>
            </div>

            {/* NEW REQUEST SLIDE-IN */}
            {newRequestOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={() => setNewRequestOpen(false)} />
                    <div style={{ width: '680px', height: '100%', backgroundColor: COLORS.bg, borderLeft: `1px solid ${COLORS.accent}40`, padding: '4rem', display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto' }} className="custom-scrollbar">
                        <h2 style={{ ...G.title, fontSize: '32px', marginBottom: '3rem' }}>Initialize Request</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                            <section>
                                <label style={G.label}>Request Intent / Title</label>
                                <input 
                                    style={{ ...G.btnGhost, width: '100%', marginTop: '0.75rem', outline: 'none', cursor: 'text', padding: '1.25rem' }} 
                                    placeholder="Brief summary of clinical or technical impediment..." 
                                    value={newRequestForm.title}
                                    onChange={e => setNewRequestForm({ ...newRequestForm, title: e.target.value })}
                                />
                            </section>

                            <section>
                                <label style={G.label}>Assessment Details</label>
                                <textarea 
                                    style={{ ...G.glass, width: '100%', marginTop: '0.75rem', minHeight: '200px', border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: 'white', padding: '1.5rem', outline: 'none', fontSize: '15px' }} 
                                    placeholder="Provide full context for assessment..." 
                                    value={newRequestForm.description}
                                    onChange={e => setNewRequestForm({ ...newRequestForm, description: e.target.value })}
                                />
                            </section>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <section>
                                    <label style={G.label}>Category Node</label>
                                    <select 
                                        style={{ ...G.btnGhost, width: '100%', marginTop: '0.75rem', outline: 'none', padding: '1rem', backgroundColor: '#0B101B' }}
                                        value={newRequestForm.category}
                                        onChange={e => setNewRequestForm({ ...newRequestForm, category: e.target.value })}
                                    >
                                        <option>Technical Support</option>
                                        <option>Study Operations</option>
                                        <option>Clinical Protocol</option>
                                        <option>Data & Reports</option>
                                        <option>Access & Permissions</option>
                                    </select>
                                </section>
                                <section>
                                    <label style={G.label}>Priority Score</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                        {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                                            <button 
                                                key={p} 
                                                onClick={() => setNewRequestForm({ ...newRequestForm, priority: p })}
                                                style={{ border: `1px solid ${newRequestForm.priority === p ? COLORS.accent : COLORS.border}`, background: newRequestForm.priority === p ? `${COLORS.accent}20` : 'transparent', color: newRequestForm.priority === p ? 'white' : COLORS.label, flex: 1, padding: '0.75rem', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: '4rem', display: 'flex', gap: '1.5rem' }}>
                            <button style={{ ...G.btnGhost, flex: 1, padding: '1.5rem' }} onClick={() => setNewRequestOpen(false)}>ABORT</button>
                            <button style={{ ...G.btnIndigo, flex: 2, padding: '1.5rem' }} onClick={handleNewRequest}>SUBMIT REQUEST</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRMATION MODAL */}
            {confirmModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} onClick={() => setConfirmModal(null)} />
                    <div style={{ ...G.glass, width: '100%', maxWidth: '400px', padding: '2rem', borderRadius: '1rem', position: 'relative', border: `1px solid ${confirmModal.type === 'danger' ? COLORS.danger : COLORS.accent}40` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <AlertCircle size={24} color={confirmModal.type === 'danger' ? COLORS.danger : COLORS.accent} />
                            <div style={{ ...G.title, fontSize: '18px' }}>Confirm Action</div>
                        </div>
                        <p style={{ color: COLORS.text, fontSize: '14px', lineHeight: 1.6, marginBottom: '2rem' }}>{confirmModal.message}</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button style={{ ...G.btnGhost, flex: 1 }} onClick={() => setConfirmModal(null)}>ABORT</button>
                            <button style={{ ...G.btnIndigo, flex: 1, backgroundColor: confirmModal.type === 'danger' ? COLORS.danger : COLORS.accent }} onClick={confirmModal.onConfirm}>CONFIRM</button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST SYSTEM */}
            <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 2000, display: 'flex', flexDirection: 'column-reverse', gap: '0.75rem' }}>
                {toasts.map(t => (
                    <div key={t.id} style={{ 
                        padding: '1rem 2rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '1rem',
                        backgroundColor: t.type === 'success' ? COLORS.success : t.type === 'error' ? COLORS.danger : (t.type === 'warning' ? COLORS.warning : COLORS.info),
                        color: 'white', fontWeight: 900, textTransform: 'uppercase', fontSize: '11px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        animation: 'slideIn 0.3s forwards'
                    }}>
                        <Bell size={16} /> {t.message}
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 2px; }
            `}</style>
        </div>
    );
}
