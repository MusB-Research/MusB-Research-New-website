import React, { useState, useEffect, useRef } from 'react';
import { 
    Search, Plus, Filter, MessageSquare, Flag, CheckCircle2, 
    AlertTriangle, User, Paperclip, Send, X, MoreVertical,
    Clock, Tag, Bookmark, ShieldAlert, FileText, ChevronRight, ChevronDown,
    ArrowUpRight, AlertCircle, Save, Layers, ListFilter
} from 'lucide-react';
import { authFetch, API, getUser } from '../../utils/auth';

// --- TYPES ---
interface Message {
    id: string;
    sender: string;
    role: string;
    time: string;
    text: string;
    tag: 'Safety' | 'Study' | 'Eligibility' | 'General' | 'Protocol';
    attachment: string | null;
    fromPI: boolean;
    is_from_me: boolean;
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
    rawLastUpdated: number;
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
            { id: 'm1', sender: 'John Doe', role: 'Coordinator', time: '10:32 AM', text: 'Participant BTB-023 reported mild bloating increase after dose 3.', tag: 'Safety', attachment: 'Symptom_Log.pdf', fromPI: false, is_from_me: false },
            { id: 'm2', sender: 'You', role: 'PI', time: '10:45 AM', text: 'Please monitor for 24 hours and report any escalation immediately.', tag: 'Study', attachment: null, fromPI: true, is_from_me: true }
        ],
        rawLastUpdated: 0
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
            { id: 'm3', sender: 'Sarah Lee', role: 'Coordinator', time: 'Yesterday 2:15 PM', text: 'Visit 4 completed successfully. Labs submitted to central lab.', tag: 'General', attachment: null, fromPI: false, is_from_me: false }
        ],
        rawLastUpdated: 0
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
            { id: 'm4', sender: 'Admin', role: 'Admin', time: 'Mon 9:00 AM', text: 'IRB approval renewal is due in 14 days. Please submit required documents.', tag: 'Study', attachment: 'IRB_Renewal_Form.pdf', fromPI: false, is_from_me: false }
        ],
        rawLastUpdated: 0
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
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
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
    const [loading, setLoading] = useState(true);
    const [fetchedStudies, setFetchedStudies] = useState<any[]>([]);
    const [fetchedParticipants, setFetchedParticipants] = useState<any[]>([]);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;
    const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
    
    // Refs
    const threadEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchConversations = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API}/api/clinical-conversations/`);
            if (res.ok) {
                const data = await res.json();
                const rawResults = Array.isArray(data) ? data : (data.results || []);
                
                setConversations(prev => {
                    return rawResults.map((c: any) => {
                        const existing = prev.find((p: any) => p.id === c.id);
                        return {
                            id: c.id,
                            participantId: c.participant_sid || 'ID-PENDING',
                            study: c.study_protocol || 'Protocol Not Linked',
                            sender: c.assigned_coordinator || 'Unassigned',
                            senderRole: 'Coordinator',
                            preview: c.last_message_preview || 'No messages yet',
                            timestamp: c.last_updated ? new Date(c.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---',
                            rawLastUpdated: c.last_updated ? new Date(c.last_updated).getTime() : 0,
                            status: c.status === 'ACTION_REQUIRED' ? 'Action Required' : (c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1).toLowerCase().replace('_', ' ') : 'Open'),
                            flagged: !!c.is_flagged,
                            assignedCoordinator: c.assigned_coordinator || 'Unassigned',
                            participantStatus: c.participant_status || 'Active',
                            draft: existing ? existing.draft : '',
                            messages: existing ? existing.messages : []
                        };
                    });
                });
                
                setActiveConvId(prevActive => {
                    if (!prevActive && rawResults.length > 0) {
                        return rawResults[0].id;
                    }
                    return prevActive;
                });
            }
        } catch (e) {
            addToast('Loading error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadThread = async (id: string) => {
        try {
            const res = await authFetch(`${API}/api/clinical-conversations/${id}/`);
            if (res.ok) {
                const currentUser = getUser();
                const data = await res.json();
                const mappedMessages = (data.messages || []).map((m: any) => ({
                    id: m.id,
                    sender: m.sender_name || 'System',
                    role: m.user_role_label || 'User',
                    time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---',
                    text: m.text || '',
                    tag: m.tag ? (m.tag.charAt(0).toUpperCase() + m.tag.slice(1).toLowerCase()) : 'General',
                    fromPI: !!m.is_from_pi,
                    is_from_me: m.sender && currentUser ? m.sender === currentUser.id : false
                }));
                setConversations(prev => prev.map(c => c.id === id ? { ...c, messages: mappedMessages } : c));
            }
        } catch (e) {
            console.error("Failed to load thread", e);
        }
    };

    useEffect(() => {
        if (activeConvId) {
            loadThread(activeConvId);
        }
    }, [activeConvId]);

    // Auto-scroll on active conversation or messages change
    useEffect(() => {
        fetchConversations();
        
        const fetchSystemData = async () => {
            try {
                const sRes = await authFetch(`${API}/api/studies/`);
                if (sRes.ok) {
                    const data = await sRes.json();
                    setFetchedStudies(Array.isArray(data) ? data : (data.results || []));
                }
                const pRes = await authFetch(`${API}/api/participants/`);
                if (pRes.ok) {
                    const data = await pRes.json();
                    setFetchedParticipants(Array.isArray(data) ? data : (data.results || []));
                }
            } catch (err) {}
        };
        fetchSystemData();
    }, []);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isMobile && mobileView === 'thread') {
            setMobileView('list');
        }
    }, [isMobile]);

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

        return filtered.sort((a: any, b: any) => b.rawLastUpdated - a.rawLastUpdated);
    };

    const handleSelectConv = (id: string) => {
        setActiveConvId(id);
        if (isMobile) setMobileView('thread');
        setConversations(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'Unread' ? 'Open' : c.status } : c));
    };

    // --- LOGIC: MESSAGE SENDING ---
    const handleSendMessage = async () => {
        if (!messageInput.trim() && !attachedFile) return;

        try {
            const res = await authFetch(`${API}/api/clinical-conversations/${activeConvId}/add_message/`, {
                method: 'POST',
                body: JSON.stringify({
                    text: messageInput,
                    tag: selectedTag.toUpperCase()
                })
            });

            if (res.ok) {
                fetchConversations();
                if (activeConvId) loadThread(activeConvId);
                setMessageInput('');
                setAttachedFile(null);
                setSelectedTag('General');
                addToast('Message sent');
            }
        } catch (e) {
            addToast('Send error', 'error');
        }
    };

    const handleSaveDraft = () => {
        setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, draft: messageInput } : c));
        setMessageInput('');
        addToast('Draft saved for thread', 'warning');
    };

    // --- LOGIC: ACTIONS ---
    const toggleFlag = async (id: string) => {
        try {
            const res = await authFetch(`${API}/api/clinical-conversations/${id}/toggle_flag/`, { method: 'POST' });
            if (res.ok) {
                fetchConversations();
                addToast('Priority status updated');
            }
        } catch (e) {}
    };

    const markResolved = async (id: string) => {
        try {
            const res = await authFetch(`${API}/api/clinical-conversations/${id}/resolve/`, { method: 'POST' });
            if (res.ok) {
                fetchConversations();
                addToast('Resolved', 'success');
            }
        } catch (e) {}
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
            fromPI: false,
            is_from_me: false
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
            border: '1px solid rgba(20, 184, 166, 0.2)',
            boxShadow: 'inset 0 0 20px rgba(20, 184, 166, 0.05)'
        },
        title: {
            fontSize: '1.25rem',
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase' as const,
            letterSpacing: '-0.02em',
            margin: 0,
            color: 'white'
        },
        label: {
            fontSize: '10px',
            fontWeight: 900,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.12em',
            color: '#64748b'
        },
        btnPrimary: {
            backgroundColor: '#14b8a6',
            color: 'white',
            border: 'none',
            padding: '0.4rem 0.9rem',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 900,
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(20, 184, 166, 0.3)'
        },
        btnGhost: {
            backgroundColor: 'transparent',
            color: '#94a3b8',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 900,
            textTransform: 'uppercase' as const,
            cursor: 'pointer'
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', backgroundColor: '#0B101B', color: 'white', overflow: 'hidden' }}>
            {/* TOP BAR */}
            <header style={{ 
                ...G.glass, 
                padding: isMobile ? '0.75rem' : '0.4rem 1rem', 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center', 
                justifyContent: 'space-between', 
                zIndex: 10, 
                gap: '0.75rem' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h1 style={G.title}>Messages</h1>
                    {isMobile && <button style={G.btnPrimary} onClick={() => setComposeOpen(true)}><Plus size={13} /> Compose</button>}
                </div>

                <div style={{ display: 'flex', flex: 1, maxWidth: isMobile ? '100%' : '400px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0 0.6rem', alignItems: 'center' }}>
                    <Search size={13} color="#64748b" />
                    <input 
                        style={{ backgroundColor: 'transparent', border: 'none', color: 'white', padding: '0.45rem 0.5rem', fontSize: '12px', outline: 'none', width: '100%' }}
                        placeholder="Search IDs, studies..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-end' }}>
                    {!isMobile && <button style={G.btnPrimary} onClick={() => setComposeOpen(true)}><Plus size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Compose</button>}
                    {[
                        { label: 'All', count: conversations.length },
                        { label: 'Unread', count: conversations.filter(c => c.status === 'Unread').length },
                        { label: 'Flagged', count: conversations.filter(c => c.flagged).length },
                        { label: 'Action', count: conversations.filter(c => c.status === 'Action Required').length }
                    ].map(f => (
                        <button key={f.label} 
                            onClick={() => setFilterStatus(f.label === 'Action' ? 'Requires Action' : f.label)}
                            style={{ 
                                ...G.btnGhost, 
                                borderColor: filterStatus.startsWith(f.label) || (f.label === 'Action' && filterStatus === 'Requires Action') ? '#14b8a6' : 'rgba(255,255,255,0.1)', 
                                color: filterStatus.startsWith(f.label) || (f.label === 'Action' && filterStatus === 'Requires Action') ? 'white' : '#64748b', 
                                padding: '0.3rem 0.6rem',
                                fontSize: isMobile ? '10px' : '11px'
                            }}>
                            {f.label} <span style={{ opacity: 0.5, marginLeft: '3px' }}>{f.count}</span>
                        </button>
                    ))}
                </div>
            </header>

            {/* TWO-PANEL LAYOUT */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                
                {/* LEFT PANEL: Conversation List */}
                <div style={{ 
                    width: isMobile ? '100%' : '260px', 
                    minWidth: isMobile ? '100%' : '220px', 
                    borderRight: '1px solid rgba(20, 184, 166, 0.2)', 
                    display: isMobile && mobileView === 'thread' ? 'none' : 'flex', 
                    flexDirection: 'column', 
                    ...G.glass,
                    zIndex: 5
                }}>
                    <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={G.label}>Conversations</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setSortMode('recent')} style={{ border: 'none', background: 'none', color: sortMode === 'recent' ? '#14b8a6' : '#64748b', cursor: 'pointer' }}><Clock size={16} /></button>
                            <button onClick={() => setSortMode('priority')} style={{ border: 'none', background: 'none', color: sortMode === 'priority' ? '#14b8a6' : '#64748b', cursor: 'pointer' }}><Bookmark size={16} /></button>
                            <button onClick={() => setSortMode('unread')} style={{ border: 'none', background: 'none', color: sortMode === 'unread' ? '#14b8a6' : '#64748b', cursor: 'pointer' }}><ListFilter size={16} /></button>
                        </div>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {getSortedConversations().length === 0 ? (
                            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                                <MessageSquare size={32} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                <p style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>No results found</p>
                                <p style={{ fontSize: '10px', marginTop: '0.5rem' }}>Check your filters or search query</p>
                            </div>
                        ) : (
                            getSortedConversations().map(conv => (
                                <div 
                                    key={conv.id}
                                    onClick={() => handleSelectConv(conv.id)}
                                    style={{
                                        padding: '0.5rem 0.75rem',
                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                        cursor: 'pointer',
                                        borderLeft: activeConvId === conv.id ? '3px solid #14b8a6' : '3px solid transparent',
                                        backgroundColor: activeConvId === conv.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                                        transition: 'all 0.1s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 900, fontStyle: 'italic', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.participantId} <span style={{ color: '#64748b', fontSize: '10px' }}>| {conv.study}</span></span>
                                        <span style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap' }}>{conv.timestamp}</span>
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{conv.sender} • {conv.senderRole}</div>
                                    <div style={{ fontSize: '10px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.preview}</div>
                                    
                                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', alignItems: 'center' }}>
                                        {conv.status === 'Unread' && <span style={{ backgroundColor: '#14b8a6', height: '8px', width: '8px', borderRadius: '50%' }} />}
                                        {conv.status === 'Action Required' && <span style={{ backgroundColor: '#ef4444', height: '8px', width: '8px', borderRadius: '50%' }} />}
                                        {conv.status === 'Resolved' && <CheckCircle2 size={12} color="#10b981" />}
                                        {conv.flagged && <Bookmark size={12} color="#f59e0b" fill="#f59e0b" />}
                                        <span style={{ fontSize: '12px', fontWeight: 900, color: conv.status === 'Resolved' ? '#10b981' : '#64748b', textTransform: 'uppercase' }}>{conv.status}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL: Message Thread */}
                <div style={{ 
                    flex: 1, 
                    display: isMobile && mobileView === 'list' ? 'none' : 'flex', 
                    flexDirection: 'column', 
                    backgroundColor: 'rgba(255,255,255,0.01)',
                    width: isMobile ? '100%' : 'auto'
                }}>
                    {activeConv ? (
                        <>
                            {/* THREAD HEADER */}
                            <div style={{ ...G.glass, borderTop: 'none', borderRight: 'none', padding: '0.5rem 1rem', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {isMobile && <button style={{ ...G.btnGhost, padding: '0.4rem' }} onClick={() => setMobileView('list')}><X size={16} /></button>}
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeConv.participantId} • <span style={{ color: '#14b8a6' }}>{activeConv.study}</span></div>
                                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 900, color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', padding: '0.1rem 0.4rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>{activeConv.participantStatus} Participant</span>
                                            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={10} /> {activeConv.assignedCoordinator}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, overflowX: 'auto', paddingBottom: isMobile ? '0.5rem' : 0 }}>
                                    <button style={{ ...G.btnGhost, padding: isMobile ? '0.3rem 0.5rem' : '0.4rem 0.8rem' }} onClick={() => toggleFlag(activeConv.id)}><Bookmark size={12} color={activeConv.flagged ? '#f59e0b' : '#64748b'} fill={activeConv.flagged ? '#f59e0b' : 'none'} style={{ marginRight: '4px' }} /> FLAG</button>
                                    <button style={{ ...G.btnGhost, padding: isMobile ? '0.3rem 0.5rem' : '0.4rem 0.8rem' }} onClick={() => markResolved(activeConv.id)}><CheckCircle2 size={12} color="#10b981" style={{ marginRight: '4px' }} /> RESOLVE</button>
                                    {!isMobile && <button style={G.btnGhost} onClick={() => setParticipantDrawerOpen(true)}><FileText size={12} style={{ marginRight: '4px' }} /> RECORD</button>}
                                    <button style={{ ...G.btnPrimary, padding: isMobile ? '0.3rem 0.5rem' : '0.4rem 0.9rem' }} onClick={() => setActionPanelOpen(!actionPanelOpen)}>ACTIONS {actionPanelOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</button>
                                </div>
                            </div>

                            {/* DYNAMIC ACTION PANEL */}
                            {actionPanelOpen && (
                                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0.6rem 1rem' }}>
                                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '1rem' : '1.5rem', flexWrap: 'wrap', alignItems: isMobile ? 'stretch' : 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '0.5rem' }}>
                                            <span style={{ ...G.label, whiteSpace: 'nowrap', marginBottom: isMobile ? '0.2rem' : 0 }}>Clinical:</span>
                                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                <button style={{ ...G.btnGhost, padding: '0.3rem 0.6rem', flex: isMobile ? 1 : 'none' }} onClick={() => handleAction('Info Request', 'PI has requested more information. Please update details.', 'General')}>More Info</button>
                                                <button style={{ ...G.btnGhost, padding: '0.3rem 0.6rem', flex: isMobile ? 1 : 'none' }} onClick={() => handleAction('Deviation', 'Marked as study deviation by PI.', 'Protocol')}>Deviation</button>
                                                <button style={{ ...G.btnGhost, padding: '0.3rem 0.6rem', borderColor: '#ef444430', color: '#ef4444', flex: isMobile ? 1 : 'none' }} onClick={() => handleAction('Escalation', 'Escalated to safety event by PI. Immediate review required.', 'Safety', true)}>Escalate</button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '0.5rem' }}>
                                            <span style={{ ...G.label, whiteSpace: 'nowrap', marginBottom: isMobile ? '0.2rem' : 0 }}>Workflow:</span>
                                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                <select 
                                                    style={{ ...G.btnGhost, padding: '0.3rem 0.6rem', outline: 'none', backgroundColor: '#0B101B', flex: isMobile ? 1 : 'none' }}
                                                    onChange={(e) => executeSystemAction('Assignment', `Assigned to coordinator ${e.target.value} by PI`, 'General')}
                                                >
                                                    <option>Assign to...</option>
                                                    {COORDINATORS.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <div style={{ display: 'flex', gap: '0.4rem', flex: isMobile ? 1 : 'none' }}>
                                                    {['Open', 'In Progress', 'Resolved'].map(s => (
                                                        <button key={s} onClick={() => markResolved(activeConv.id)} style={{ ...G.btnGhost, padding: '0.3rem 0.4rem', flex: 1, border: activeConv.status === s ? '1px solid #14b8a6' : '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }}>{s}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}                            {/* CHAT THREAD */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {activeConv.messages.map(m => (
                                    <div key={m.id} style={{ alignSelf: m.is_from_me ? 'flex-end' : 'flex-start', maxWidth: '70%', textAlign: m.is_from_me ? 'right' : 'left' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.25rem', display: 'flex', justifyContent: m.is_from_me ? 'flex-end' : 'flex-start', gap: '0.4rem' }}>
                                            {!m.is_from_me && <span style={{ color: '#14b8a6' }}>{m.sender} [{m.role}]</span>}
                                            <span>{m.time}</span>
                                            {m.is_from_me && <span style={{ color: '#14b8a6' }}>YOU [{m.role}]</span>}
                                        </div>
                                        <div style={{ 
                                            padding: '0.6rem 0.9rem', 
                                            borderRadius: m.is_from_me ? '12px 12px 0 12px' : '12px 12px 12px 0', 
                                            backgroundColor: m.is_from_me ? '#14b8a6' : 'rgba(255, 255, 255, 0.05)',
                                            border: `1px solid ${m.is_from_me ? '#14b8a6' : 'rgba(255, 255, 255, 0.1)'}`,
                                            lineHeight: '1.5',
                                            fontSize: '13px',
                                            color: '#f8fafc',
                                            boxShadow: m.is_from_me ? '0 4px 12px rgba(20, 184, 166, 0.2)' : 'none',
                                            textAlign: 'left'
                                        }}>
                                            {m.text}
                                            {m.attachment && (
                                                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <Paperclip size={11} color={m.is_from_me ? "white" : "#14b8a6"} />
                                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: m.is_from_me ? "white" : "#14b8a6" }}>{m.attachment}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ marginTop: '0.25rem', display: 'flex', justifyContent: m.is_from_me ? 'flex-end' : 'flex-start' }}>
                                            <span style={{ 
                                                fontSize: '9px', fontWeight: 900, textTransform: 'uppercase',
                                                padding: '0.1rem 0.4rem', borderRadius: '3px',
                                                backgroundColor: m.tag === 'Safety' ? '#ef444420' : m.tag === 'Protocol' ? '#14b8a620' : 'rgba(255,255,255,0.05)',
                                                color: m.tag === 'Safety' ? '#ef4444' : m.tag === 'Protocol' ? '#14b8a6' : '#64748b',
                                                border: `1px solid ${m.tag === 'Safety' ? '#ef444440' : 'rgba(255,255,255,0.1)'}`
                                            }}>{m.tag}</span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={threadEndRef} />
                            </div>

                            {/* INPUT AREA */}
                            <div style={{ ...G.glass, borderRight: 'none', borderBottom: 'none', padding: isMobile ? '0.75rem' : '0.5rem 0.75rem' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <button style={{ ...G.btnGhost, padding: '0.25rem 0.5rem', fontSize: '10px', flex: isMobile ? 1 : 'none' }} onClick={() => {
                                        const t = TEMPLATES[0];
                                        setMessageInput(t.text.replace('[ID]', activeConv.participantId));
                                    }}>Template: Eligibility</button>
                                    <button style={{ ...G.btnGhost, padding: '0.25rem 0.5rem', fontSize: '10px', flex: isMobile ? 1 : 'none' }} onClick={() => {
                                        const t = TEMPLATES[1];
                                        setMessageInput(t.text);
                                    }}>Template: AE Follow-up</button>
                                    {!isMobile && <div style={{ flex: 1 }} />}
                                    <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.03)', padding: '2px', borderRadius: '4px', width: isMobile ? '100%' : 'auto', overflowX: 'auto' }}>
                                        {['General', 'Safety', 'Eligibility', 'Protocol'].map(t => (
                                            <button key={t} 
                                                onClick={() => setSelectedTag(t as any)}
                                                style={{ border: 'none', background: selectedTag === t ? 'rgba(20,184,166,0.2)' : 'transparent', color: selectedTag === t ? '#14b8a6' : '#64748b', padding: '0.25rem 0.5rem', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer', flex: 1 }}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        {attachedFile && (
                                            <div style={{ position: 'absolute', top: '-32px', left: 0, padding: '0.25rem 0.6rem', backgroundColor: 'rgba(20,184,166,0.1)', borderRadius: '20px', border: '1px solid #14b8a6', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 5 }}>
                                                <Paperclip size={10} color="#14b8a6" />
                                                <span style={{ fontSize: '10px', fontWeight: 900, color: '#14b8a6', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachedFile.name}</span>
                                                <X size={10} color="#14b8a6" style={{ cursor: 'pointer' }} onClick={() => setAttachedFile(null)} />
                                            </div>
                                        )}
                                        <textarea 
                                            style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white', padding: '0.5rem 0.75rem', fontSize: '13px', outline: 'none', minHeight: isMobile ? '44px' : '52px', resize: 'vertical' }}
                                            placeholder="Compose clinical feedback..."
                                            value={messageInput}
                                            onChange={e => setMessageInput(e.target.value)}
                                        />
                                    </div>
                                    <input type="file" ref={fileInputRef} hidden onChange={e => setAttachedFile(e.target.files?.[0] || null)} />
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        <button style={{ ...G.btnGhost, padding: isMobile ? '0.4rem' : '0.5rem' }} onClick={() => fileInputRef.current?.click()}><Paperclip size={isMobile ? 13 : 15} /></button>
                                        {!isMobile && <button style={{ ...G.btnGhost, padding: '0.5rem' }} onClick={handleSaveDraft}><Save size={15} /></button>}
                                        <button style={{ ...G.btnPrimary, height: isMobile ? '44px' : '52px', padding: isMobile ? '0 0.75rem' : '0 1rem' }} onClick={handleSendMessage}><Send size={15} /></button>
                                    </div>
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
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '1rem' : 0 }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }} onClick={() => setComposeOpen(false)} />
                    <div style={{ ...G.glass, width: isMobile ? '100%' : '720px', maxWidth: '100%', padding: isMobile ? '1.5rem' : '3rem', position: 'relative', borderRadius: '12px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ ...G.title, fontSize: isMobile ? '1rem' : '1.25rem' }}>Compose New Message</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '2rem', marginTop: isMobile ? '1.5rem' : '2.5rem' }}>
                            <div>
                                <label style={G.label}>Participant ID / To</label>
                                <select style={{ ...G.btnGhost, width: '100%', padding: '1rem', marginTop: '0.5rem', backgroundColor: '#0B101B', textTransform: 'uppercase' }}>
                                    <option value="" disabled selected>SELECT RECIPIENT...</option>
                                    {fetchedParticipants.map(p => (
                                        <option key={p.id} value={p.participant_sid || p.id}>{p.participant_sid || 'ID PENDING'} {p.user?.full_name ? `(${p.user.full_name})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={G.label}>Select Study</label>
                                <select style={{ ...G.btnGhost, width: '100%', padding: '1rem', marginTop: '0.5rem', backgroundColor: '#0B101B', textTransform: 'uppercase' }}>
                                    <option value="" disabled selected>SELECT STUDY...</option>
                                    {fetchedStudies.map(s => (
                                        <option key={s.id} value={s.title}>{s.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: isMobile ? '1.5rem' : '2rem' }}>
                            <label style={G.label}>Clinical Assessment / Message</label>
                            <textarea style={{ ...G.glass, width: '100%', padding: isMobile ? '1rem' : '1.5rem', marginTop: '0.5rem', minHeight: isMobile ? '120px' : '200px', fontSize: isMobile ? '14px' : '16px', color: 'white', outline: 'none' }} placeholder="Detail assessment..." />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: isMobile ? '2rem' : '3rem', justifyContent: 'flex-end' }}>
                            <button style={G.btnGhost} onClick={() => setComposeOpen(false)}>CANCEL</button>
                            <button style={G.btnPrimary} onClick={() => { setComposeOpen(false); addToast('Message started'); }}>SEND MESSAGE</button>
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
                <div style={{ 
                    position: 'fixed', 
                    top: 0, 
                    right: 0, 
                    width: isMobile ? '100%' : '480px', 
                    height: '100vh', 
                    ...G.glass, 
                    zIndex: 500, 
                    boxShadow: '-50px 0 100px rgba(0,0,0,0.8)', 
                    padding: isMobile ? '1.5rem' : '3rem',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '1.5rem' : '3rem' }}>
                        <h2 style={G.title}>Participant Record</h2>
                        <button style={G.btnGhost} onClick={() => setParticipantDrawerOpen(false)}><X size={24} /></button>
                    </div>
                    {activeConv && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
                            <div style={{ padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <span style={G.label}>Primary ID</span>
                                <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 900, fontStyle: 'italic', marginTop: '0.5rem' }}>{activeConv.participantId}</div>
                            </div>
                            <div>
                                <span style={G.label}>Clinical Status</span>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981', marginTop: '0.5rem' }}>{activeConv.participantStatus}</div>
                            </div>
                            <div>
                                <span style={G.label}>Active Study</span>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#14b8a6', marginTop: '0.5rem' }}>{activeConv.study}</div>
                            </div>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginTop: 'auto' }}>
                                <button style={{ ...G.btnPrimary, width: '100%', padding: '1rem' }}>OPEN FULL RECORD</button>
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


