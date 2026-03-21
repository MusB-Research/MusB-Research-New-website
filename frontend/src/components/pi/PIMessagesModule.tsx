import React, { useState, useEffect, useRef } from 'react';
import { 
    Search, Plus, Filter, MessageSquare, Flag, CheckCircle2, 
    AlertTriangle, User, Paperclip, Send, X, MoreVertical,
    Clock, Tag, Bookmark, ShieldAlert, FileText, ChevronRight, ChevronDown,
    ArrowUpRight, AlertCircle, Save, Layers, ListFilter
} from 'lucide-react';

// --- TYPES ---
interface Message {
    id: string;
    sender: string;
    role: string;
    time: string;
    text: string;
    tag: 'Safety' | 'Protocol' | 'Eligibility' | 'General';
    attachment: string | null;
    fromPI: boolean;
}

interface Conversation {
    id: string;
    participantId: string;
    study: string;
    sender: string;
    senderRole: string;
    preview: string;
    timestamp: string;
    status: 'Unread' | 'Action Required' | 'Resolved' | 'Open';
    flagged: boolean;
    assignedCoordinator: string;
    participantStatus: 'Active' | 'Screening' | 'Completed';
    draft: string;
    messages: Message[];
}

interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning';
    message: string;
}

// --- MOCK DATA ---
const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: 'conv-1',
        participantId: 'BTB-023',
        study: 'Beat the Bloat',
        sender: 'John Doe',
        senderRole: 'Coordinator',
        preview: 'Participant reported mild discomfort after dose...',
        timestamp: '10:32 AM',
        status: 'Action Required',
        flagged: true,
        assignedCoordinator: 'John Doe',
        participantStatus: 'Active',
        draft: '',
        messages: [
            { id: 'm1', sender: 'John Doe', role: 'Coordinator', time: '10:32 AM', text: 'Participant BTB-023 reported mild bloating increase after dose 3.', tag: 'Safety', attachment: 'Symptom_Log.pdf', fromPI: false },
            { id: 'm2', sender: 'You', role: 'PI', time: '10:45 AM', text: 'Please monitor for 24 hours and report any escalation immediately.', tag: 'Protocol', attachment: null, fromPI: true }
        ]
    },
    {
        id: 'conv-2',
        participantId: 'BTB-017',
        study: 'Beat the Bloat',
        sender: 'Sarah Lee',
        senderRole: 'Coordinator',
        preview: 'Visit 4 completed successfully, labs submitted...',
        timestamp: 'Yesterday',
        status: 'Resolved',
        flagged: false,
        assignedCoordinator: 'Sarah Lee',
        participantStatus: 'Active',
        draft: '',
        messages: [
            { id: 'm3', sender: 'Sarah Lee', role: 'Coordinator', time: 'Yesterday 2:15 PM', text: 'Visit 4 completed successfully. Labs submitted to central lab.', tag: 'General', attachment: null, fromPI: false }
        ]
    },
    {
        id: 'conv-3',
        participantId: 'MS-044',
        study: 'Menopause Study',
        sender: 'Admin',
        senderRole: 'Admin',
        preview: 'IRB approval renewal due in 14 days...',
        timestamp: 'Mon',
        status: 'Unread',
        flagged: false,
        assignedCoordinator: 'Elena Rodriguez',
        participantStatus: 'Screening',
        draft: '',
        messages: [
            { id: 'm4', sender: 'Admin', role: 'Admin', time: 'Mon 9:00 AM', text: 'IRB approval renewal is due in 14 days. Please submit required documents.', tag: 'Protocol', attachment: 'IRB_Renewal_Form.pdf', fromPI: false }
        ]
    }
];

const TEMPLATES = [
    { label: "Eligibility Clarification", text: "Based on the internal review of participant [ID], we require further clarification on the eligibility criteria related to [PARAMETER]. Please verify clinical history." },
    { label: "AE Follow-up", text: "The reported Adverse Event requires close monitoring. Please provide updated vital signs and symptom logs every 12 hours until stabilization." },
    { label: "Visit Reminder", text: "This is a reminder that the upcoming visit [X] for participant [ID] is scheduled for [DATE]. Please ensure all primary assessments are primary." }
];

const COORDINATORS = ['John Doe', 'Sarah Lee', 'Elena Rodriguez', 'Marcus Wilt'];

// --- COMPONENT ---
export default function PIMessagesModule() {
    // State
    const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
    const [activeConvId, setActiveConvId] = useState('conv-1');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [sortMode, setSortMode] = useState<'recent' | 'priority' | 'unread'>('recent');
    const [messageInput, setMessageInput] = useState('');
    const [selectedTag, setSelectedTag] = useState<'Safety' | 'Protocol' | 'Eligibility' | 'General'>('General');
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [composeOpen, setComposeOpen] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmModal, setConfirmModal] = useState<{ message: string, onConfirm: () => void } | null>(null);
    const [actionPanelOpen, setActionPanelOpen] = useState(true);
    const [participantDrawerOpen, setParticipantDrawerOpen] = useState(false);
    
    // Refs
    const threadEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll on active conversation or messages change
    useEffect(() => {
        threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeConvId, conversations]);

    // --- LOGIC: TOASTS ---
    const addToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    // --- LOGIC: CONVERSATION LIST ---
    const activeConv = conversations.find(c => c.id === activeConvId);

    const getSortedConversations = () => {
        let filtered = conversations.filter(c => {
            const matchesSearch = c.participantId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 c.study.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 c.preview.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterStatus === 'All' || 
                                 (filterStatus === 'Unread' && c.status === 'Unread') ||
                                 (filterStatus === 'Flagged' && c.flagged) ||
                                 (filterStatus === 'Requires Action' && c.status === 'Action Required');
            return matchesSearch && matchesFilter;
        });

        if (sortMode === 'priority') {
            return filtered.sort((a, b) => (a.flagged === b.flagged) ? 0 : a.flagged ? -1 : 1);
        }
        if (sortMode === 'unread') {
            return filtered.sort((a, b) => (a.status === 'Unread' ? -1 : 1));
        }
        return filtered; // Default to recent (order in mock)
    };

    const handleSelectConv = (id: string) => {
        setActiveConvId(id);
        setConversations(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'Unread' ? 'Open' : c.status } : c));
    };

    // --- LOGIC: MESSAGE SENDING ---
    const handleSendMessage = () => {
        if (!messageInput.trim() && !attachedFile) return;

        const newMessage: Message = {
            id: 'm-' + Date.now(),
            sender: 'You',
            role: 'PI',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: messageInput,
            tag: selectedTag,
            attachment: attachedFile ? attachedFile.name : null,
            fromPI: true
        };

        setConversations(prev => prev.map(c => c.id === activeConvId ? {
            ...c,
            messages: [...c.messages, newMessage],
            preview: messageInput || (attachedFile ? `File: ${attachedFile.name}` : ''),
            timestamp: 'Just now',
            draft: ''
        } : c));

        setMessageInput('');
        setAttachedFile(null);
        setSelectedTag('General');
        addToast('Message dispatched');
    };

    const handleSaveDraft = () => {
        setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, draft: messageInput } : c));
        setMessageInput('');
        addToast('Draft saved for thread', 'warning');
    };

    // --- LOGIC: ACTIONS ---
    const toggleFlag = (id: string) => {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, flagged: !c.flagged } : c));
        addToast(activeConv?.flagged ? 'Flag removed' : 'Thread flagged for priority');
    };

    const markResolved = (id: string) => {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, status: 'Resolved' } : c));
        addToast('Conversation marked as resolved', 'success');
    };

    const handleAction = (label: string, systemText: string, tag: any = 'General', escalation = false) => {
        if (escalation) {
            setConfirmModal({
                message: "Escalate this to a safety event? Local IRB and Sponsor will be notified.",
                onConfirm: () => {
                    executeSystemAction(label, systemText, tag, true);
                    setConfirmModal(null);
                }
            });
        } else {
            executeSystemAction(label, systemText, tag);
        }
    };

    const executeSystemAction = (label: string, systemText: string, tag: any, escalation = false) => {
        const sysMsg: Message = {
            id: 'sys-' + Date.now(),
            sender: 'System',
            role: 'Audit',
            time: 'Now',
            text: systemText,
            tag,
            attachment: null,
            fromPI: false
        };
        setConversations(prev => prev.map(c => c.id === activeConvId ? {
            ...c,
            status: escalation ? 'Action Required' : c.status,
            messages: [...c.messages, sysMsg]
        } : c));
        addToast(`${label} executed successfully`);
    };

    // --- STYLES ---
    const G = {
        glass: {
            backgroundColor: 'rgba(7, 10, 19, 0.8)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            boxShadow: 'inset 0 0 20px rgba(99, 102, 241, 0.05)'
        },
        title: {
            fontSize: '2.5rem',
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase' as const,
            letterSpacing: '-0.04em',
            margin: 0,
            color: 'white'
        },
        label: {
            fontSize: '11px',
            fontWeight: 900,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.25em',
            color: '#64748b'
        },
        btnPrimary: {
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 900,
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)'
        },
        btnGhost: {
            backgroundColor: 'transparent',
            color: '#94a3b8',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '0.8rem 1.25rem',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 900,
            textTransform: 'uppercase' as const,
            cursor: 'pointer'
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', backgroundColor: '#0B101B', color: 'white', overflow: 'hidden' }}>
            {/* TOP BAR */}
            <header style={{ ...G.glass, padding: '1rem 3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
                <h1 style={{ ...G.title, fontSize: '2rem' }}>Messages</h1>

                <div style={{ display: 'flex', flex: 1, maxWidth: '600px', margin: '0 2rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0 1rem' }}>
                    <Search size={16} color="#64748b" style={{ marginTop: '0.75rem' }} />
                    <input 
                        style={{ backgroundColor: 'transparent', border: 'none', color: 'white', padding: '0.75rem', fontSize: '14px', outline: 'none', width: '100%' }}
                        placeholder="Search IDs, studies, or clinical keywords..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button style={G.btnPrimary} onClick={() => setComposeOpen(true)}><Plus size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Compose</button>
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                        {['All', 'Unread', 'Flagged', 'Requires Action'].map(f => (
                            <button key={f} 
                                onClick={() => setFilterStatus(f)}
                                style={{ ...G.btnGhost, borderColor: filterStatus === f ? '#6366f1' : 'rgba(255,255,255,0.1)', backgroundColor: filterStatus === f ? 'rgba(99,102,241,0.1)' : 'transparent', color: filterStatus === f ? 'white' : '#64748b' }}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* TWO-PANEL LAYOUT */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* LEFT PANEL: Conversation List */}
                <div style={{ width: '360px', borderRight: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', flexDirection: 'column', ...G.glass }}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={G.label}>Conversations</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setSortMode('recent')} style={{ border: 'none', background: 'none', color: sortMode === 'recent' ? '#6366f1' : '#64748b', cursor: 'pointer' }}><Clock size={16} /></button>
                            <button onClick={() => setSortMode('priority')} style={{ border: 'none', background: 'none', color: sortMode === 'priority' ? '#6366f1' : '#64748b', cursor: 'pointer' }}><Bookmark size={16} /></button>
                            <button onClick={() => setSortMode('unread')} style={{ border: 'none', background: 'none', color: sortMode === 'unread' ? '#6366f1' : '#64748b', cursor: 'pointer' }}><ListFilter size={16} /></button>
                        </div>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {getSortedConversations().map(conv => (
                            <div 
                                key={conv.id}
                                onClick={() => handleSelectConv(conv.id)}
                                style={{
                                    padding: '1.25rem 1.5rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    cursor: 'pointer',
                                    borderLeft: activeConvId === conv.id ? '4px solid #6366f1' : '4px solid transparent',
                                    backgroundColor: activeConvId === conv.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '16px', fontWeight: 900, fontStyle: 'italic', color: 'white' }}>{conv.participantId} <span style={{ color: '#64748b', fontSize: '12px' }}>| {conv.study}</span></span>
                                    <span style={{ fontSize: '11px', color: '#64748b' }}>{conv.timestamp}</span>
                                </div>
                                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{conv.sender} • {conv.senderRole}</div>
                                <div style={{ fontSize: '13px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.preview}</div>
                                
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
                                    {conv.status === 'Unread' && <span style={{ backgroundColor: '#6366f1', height: '8px', width: '8px', borderRadius: '50%' }} />}
                                    {conv.status === 'Action Required' && <span style={{ backgroundColor: '#ef4444', height: '8px', width: '8px', borderRadius: '50%' }} />}
                                    {conv.status === 'Resolved' && <CheckCircle2 size={12} color="#10b981" />}
                                    {conv.flagged && <Bookmark size={12} color="#f59e0b" fill="#f59e0b" />}
                                    <span style={{ fontSize: '10px', fontWeight: 900, color: conv.status === 'Resolved' ? '#10b981' : '#64748b', textTransform: 'uppercase' }}>{conv.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT PANEL: Message Thread */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                    {activeConv ? (
                        <>
                            {/* THREAD HEADER */}
                            <div style={{ ...G.glass, borderTop: 'none', borderRight: 'none', padding: '1rem 3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '20px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>{activeConv.participantId} • <span style={{ color: '#6366f1' }}>{activeConv.study}</span></div>
                                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.4rem', alignItems: 'center' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 900, color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>{activeConv.participantStatus} Participant</span>
                                        <span style={{ fontSize: '11px', color: '#94a3b8' }}><User size={12} style={{ marginRight: '6px' }} /> {activeConv.assignedCoordinator}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button style={{ ...G.btnGhost, padding: '0.6rem 1rem' }} onClick={() => toggleFlag(activeConv.id)}><Bookmark size={14} color={activeConv.flagged ? '#f59e0b' : '#64748b'} fill={activeConv.flagged ? '#f59e0b' : 'none'} style={{ marginRight: '6px' }} /> FLAG</button>
                                    <button style={{ ...G.btnGhost, padding: '0.6rem 1rem' }} onClick={() => markResolved(activeConv.id)}><CheckCircle2 size={14} color="#10b981" style={{ marginRight: '6px' }} /> RESOLVE</button>
                                    <button style={{ ...G.btnGhost, padding: '0.6rem 1rem' }} onClick={() => setParticipantDrawerOpen(true)}><FileText size={14} style={{ marginRight: '6px' }} /> RECORD</button>
                                    <button style={{ ...G.btnPrimary, padding: '0.6rem 1.5rem' }} onClick={() => setActionPanelOpen(!actionPanelOpen)}>ACTIONS {actionPanelOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
                                </div>
                            </div>

                            {/* DYNAMIC ACTION PANEL */}
                            {actionPanelOpen && (
                                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '1rem 3rem' }}>
                                    <div style={{ display: 'flex', gap: '3rem' }}>
                                        <div>
                                            <div style={{ ...G.label, marginBottom: '0.6rem' }}>Clinical Actions</div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button style={{ ...G.btnGhost, padding: '0.4rem 0.8rem' }} onClick={() => handleAction('Info Request', 'PI has requested additional information. Please update clinical details.', 'General')}>Request MI</button>
                                                <button style={{ ...G.btnGhost, padding: '0.4rem 0.8rem' }} onClick={() => handleAction('Deviation', 'Marked as protocol deviation by PI.', 'Protocol')}>Protocol Dev.</button>
                                                <button style={{ ...G.btnGhost, padding: '0.4rem 0.8rem', borderColor: '#ef444430', color: '#ef4444' }} onClick={() => handleAction('Escalation', 'Escalated to safety event by PI. Immediate review required.', 'Safety', true)}>Escalate Safety</button>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ ...G.label, marginBottom: '0.6rem' }}>Workflow Actions</div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <select 
                                                    style={{ ...G.btnGhost, padding: '0.4rem 0.8rem', outline: 'none', backgroundColor: '#0B101B' }}
                                                    onChange={(e) => executeSystemAction('Assignment', `Assigned to coordinator ${e.target.value} by PI`, 'General')}
                                                >
                                                    <option>Assign to...</option>
                                                    {COORDINATORS.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                {['Open', 'In Progress', 'Resolved'].map(s => (
                                                    <button key={s} onClick={() => markResolved(activeConv.id)} style={{ ...G.btnGhost, padding: '0.4rem 0.8rem', border: activeConv.status === s ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)' }}>{s}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* CHAT THREAD */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {activeConv.messages.map(m => (
                                    <div key={m.id} style={{ alignSelf: m.fromPI ? 'flex-end' : 'flex-start', maxWidth: '75%', textAlign: m.fromPI ? 'right' : 'left' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.4rem', display: 'flex', justifyContent: m.fromPI ? 'flex-end' : 'flex-start', gap: '0.6rem' }}>
                                            {!m.fromPI && <span style={{ color: '#6366f1' }}>{m.sender} [{m.role}]</span>}
                                            <span>{m.time}</span>
                                            {m.fromPI && <span style={{ color: '#6366f1' }}>YOU [PI]</span>}
                                        </div>
                                        <div style={{ 
                                            padding: '1.5rem', 
                                            borderRadius: '12px', 
                                            backgroundColor: m.fromPI ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                            border: `1px solid ${m.fromPI ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                                            lineHeight: '1.6',
                                            fontSize: '16px',
                                            color: '#f8fafc',
                                            boxShadow: m.fromPI ? '0 10px 30px rgba(99, 102, 241, 0.1)' : 'none'
                                        }}>
                                            {m.text}
                                            {m.attachment && (
                                                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                                    <Paperclip size={14} color="#6366f1" />
                                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6366f1' }}>{m.attachment}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: m.fromPI ? 'flex-end' : 'flex-start', gap: '0.5rem' }}>
                                            <span style={{ 
                                                fontSize: '10px', fontWeight: 900, textTransform: 'uppercase',
                                                padding: '0.25rem 0.6rem', borderRadius: '4px',
                                                backgroundColor: m.tag === 'Safety' ? '#ef444420' : m.tag === 'Protocol' ? '#6366f120' : 'rgba(255,255,255,0.05)',
                                                color: m.tag === 'Safety' ? '#ef4444' : m.tag === 'Protocol' ? '#6366f1' : '#64748b',
                                                border: `1px solid ${m.tag === 'Safety' ? '#ef444440' : 'rgba(255,255,255,0.1)'}`
                                            }}>{m.tag}</span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={threadEndRef} />
                            </div>

                            {/* INPUT AREA */}
                            <div style={{ ...G.glass, borderRight: 'none', borderBottom: 'none', padding: '1rem 3rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <button style={{ ...G.btnGhost, padding: '0.4rem 0.8rem', fontSize: '10px' }} onClick={() => {
                                        const t = TEMPLATES[0];
                                        setMessageInput(t.text.replace('[ID]', activeConv.participantId));
                                    }}>Template: Eligibility</button>
                                    <button style={{ ...G.btnGhost, padding: '0.4rem 0.8rem', fontSize: '10px' }} onClick={() => {
                                        const t = TEMPLATES[1];
                                        setMessageInput(t.text);
                                    }}>Template: AE Follow-up</button>
                                    <div style={{ flex: 1 }} />
                                    <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.03)', padding: '2px', borderRadius: '4px' }}>
                                        {['General', 'Safety', 'Eligibility', 'Protocol'].map(t => (
                                            <button key={t} 
                                                onClick={() => setSelectedTag(t as any)}
                                                style={{ border: 'none', background: selectedTag === t ? 'rgba(99,102,241,0.2)' : 'transparent', color: selectedTag === t ? '#6366f1' : '#64748b', padding: '0.4rem 1rem', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer' }}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        {attachedFile && (
                                            <div style={{ position: 'absolute', top: '-45px', left: 0, padding: '0.5rem 1rem', backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: '20px', border: '1px solid #6366f1', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <Paperclip size={12} color="#6366f1" />
                                                <span style={{ fontSize: '11px', fontWeight: 900, color: '#6366f1' }}>{attachedFile.name}</span>
                                                <X size={12} color="#6366f1" style={{ cursor: 'pointer' }} onClick={() => setAttachedFile(null)} />
                                            </div>
                                        )}
                                        <textarea 
                                            style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', padding: '1.25rem', fontSize: '16px', outline: 'none', minHeight: '80px', resize: 'vertical' }}
                                            placeholder="Compose clinical feedback..."
                                            value={messageInput}
                                            onChange={e => setMessageInput(e.target.value)}
                                        />
                                    </div>
                                    <input type="file" ref={fileInputRef} hidden onChange={e => setAttachedFile(e.target.files?.[0] || null)} />
                                    <button style={{ ...G.btnGhost, padding: '1.25rem' }} onClick={() => fileInputRef.current?.click()}><Paperclip size={20} /></button>
                                    <button style={{ ...G.btnGhost, padding: '1.25rem' }} onClick={handleSaveDraft}><Save size={20} /></button>
                                    <button style={{ ...G.btnPrimary, height: '80px', padding: '0 2.5rem' }} onClick={handleSendMessage}><Send size={20} /></button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            <MessageSquare size={80} style={{ marginBottom: '2rem', opacity: 0.1 }} />
                            <div style={{ fontSize: '24px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>Select a participant thread</div>
                            <div style={{ fontSize: '14px', marginTop: '1rem' }}>Clinical correspondence queue active.</div>
                        </div>
                    )}
                </div>
            </div>

            {/* COMPOSE MODAL */}
            {composeOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }} onClick={() => setComposeOpen(false)} />
                    <div style={{ ...G.glass, width: '720px', padding: '3rem', position: 'relative', borderRadius: '12px' }}>
                        <h2 style={G.title}>Compose New Message</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2.5rem' }}>
                            <div>
                                <label style={G.label}>Participant ID / To</label>
                                <input style={{ ...G.btnGhost, width: '100%', padding: '1rem', marginTop: '0.5rem', textAlign: 'left', cursor: 'text' }} placeholder="Select Recipient..." />
                            </div>
                            <div>
                                <label style={G.label}>Select Study</label>
                                <select style={{ ...G.btnGhost, width: '100%', padding: '1rem', marginTop: '0.5rem', backgroundColor: '#0B101B' }}>
                                    <option>Beat the Bloat</option>
                                    <option>Menopause Study</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: '2rem' }}>
                            <label style={G.label}>Clinical Assessment / Message</label>
                            <textarea style={{ ...G.glass, width: '100%', padding: '1.5rem', marginTop: '0.5rem', minHeight: '200px', fontSize: '16px', color: 'white', outline: 'none' }} placeholder="Detail assessment..." />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem', justifyContent: 'flex-end' }}>
                            <button style={G.btnGhost} onClick={() => setComposeOpen(false)}>CANCEL</button>
                            <button style={G.btnPrimary} onClick={() => { setComposeOpen(false); addToast('Direct message initialized'); }}>SEND DISPATCH</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRM MODAL */}
            {confirmModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)' }} onClick={() => setConfirmModal(null)} />
                    <div style={{ ...G.glass, width: '400px', padding: '3rem', position: 'relative', borderRadius: '12px', textAlign: 'center' }}>
                        <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
                        <p style={{ fontSize: '16px', fontWeight: 'bold', lineHeight: 1.6, marginBottom: '2.5rem' }}>{confirmModal.message}</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button style={{ ...G.btnGhost, flex: 1 }} onClick={() => setConfirmModal(null)}>ABORT</button>
                            <button style={{ ...G.btnPrimary, flex: 1, backgroundColor: '#ef4444' }} onClick={confirmModal.onConfirm}>CONFIRM</button>
                        </div>
                    </div>
                </div>
            )}

            {/* RECORD DRAWER */}
            {participantDrawerOpen && (
                <div style={{ position: 'fixed', top: 0, right: 0, width: '480px', height: '100vh', ...G.glass, zIndex: 500, boxShadow: '-50px 0 100px rgba(0,0,0,0.8)', padding: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                        <h2 style={G.title}>Participant Record</h2>
                        <button style={G.btnGhost} onClick={() => setParticipantDrawerOpen(false)}><X size={24} /></button>
                    </div>
                    {activeConv && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ padding: '2rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <span style={G.label}>Primary ID</span>
                                <div style={{ fontSize: '24px', fontWeight: 900, fontStyle: 'italic', marginTop: '0.5rem' }}>{activeConv.participantId}</div>
                            </div>
                            <div>
                                <span style={G.label}>Clinical Status</span>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', marginTop: '0.5rem' }}>{activeConv.participantStatus}</div>
                            </div>
                            <div>
                                <span style={G.label}>Active Study</span>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#6366f1', marginTop: '0.5rem' }}>{activeConv.study}</div>
                            </div>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                                <button style={{ ...G.btnPrimary, width: '100%' }}>OPEN FULL MEDICAL VULCAN</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TOAST SYSTEM */}
            <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 2000, display: 'flex', flexDirection: 'column-reverse', gap: '0.75rem' }}>
                {toasts.map(t => (
                    <div key={t.id} style={{ 
                        padding: '1rem 2rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '1rem',
                        backgroundColor: t.type === 'success' ? '#10b981' : t.type === 'error' ? '#ef4444' : '#f59e0b',
                        color: 'white', fontWeight: 900, textTransform: 'uppercase', fontSize: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                    }}>
                        {t.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        {t.message}
                    </div>
                ))}
            </div>
        </div>
    );
}
