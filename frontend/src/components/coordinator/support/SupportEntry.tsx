import React, { useState, useMemo, useRef } from 'react';
import { 
    Search, Filter, MessageCircle, Send, AlertCircle, History, Book, FileText, Settings, X 
} from 'lucide-react';
import { Ticket, TicketMessage, Ticket as TicketType } from '../support/SupportConstants';
import { TicketList } from '../support/components/TicketList';
import { TicketChat } from '../support/components/TicketChat';
import { TicketDetails } from '../support/components/TicketDetails';
import { KnowledgeBase } from '../support/views/KnowledgeBase';
import { NewRequestModal } from '../support/components/NewRequestModal';
import { authFetch, API } from '../../../utils/auth';

const MOCK_TICKETS: TicketType[] = [
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

export default function SupportModule({ selectedStudyId }: { selectedStudyId?: string }) {
    const [view, setView] = useState<'Requests' | 'KB'>('Requests');
    const [tickets, setTickets] = useState<TicketType[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [messageInput, setMessageInput] = useState('');
    const [isFlagged, setIsFlagged] = useState(false);
    const [hasAttachment, setHasAttachment] = useState(false);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API}/api/support/tickets/`);
            if (res.ok) {
                const data = await res.json();
                const results = Array.isArray(data) ? data : (data.results || []);
                const mapped: TicketType[] = results.map((t: any) => ({
                    id: t.ticket_id || `TCK-${t.id}`,
                    title: t.title,
                    study: t.study_protocol || 'Global Node',
                    participantId: t.participant_id || 'N/A',
                    category: t.category as any,
                    priority: t.priority ? (t.priority.charAt(0).toUpperCase() + t.priority.slice(1).toLowerCase()) as any : 'Medium',
                    status: t.status as any,
                    lastUpdated: new Date(t.updated_at).toLocaleString(),
                    createdAt: new Date(t.created_at).toLocaleString(),
                    createdBy: t.creator_name,
                    assignedTo: t.assigned_to_name || 'Unassigned',
                    messages: (t.messages || []).map((m: any) => ({
                        id: m.id.toString(),
                        sender: m.sender_name,
                        role: m.user_role_label,
                        content: m.content,
                        timestamp: new Date(m.created_at).toLocaleString()
                    })),
                    auditTrail: []
                }));
                setTickets(mapped);
                if (mapped.length > 0 && !selectedId) {
                    setSelectedId(mapped[0].id);
                }
            }
        } catch (e) {
            console.error('Failed to sync support incidents:', e);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchTickets();
    }, []);

    const filteredTickets = useMemo(() => {
        return tickets.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                               t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                               t.study.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStudy = !selectedStudyId || selectedStudyId === 'all' || t.study === selectedStudyId;
            return matchesSearch && matchesStudy;
        });
    }, [tickets, searchQuery, selectedStudyId]);

    const selectedTicket = useMemo(() => tickets.find(t => t.id === selectedId) || tickets[0], [tickets, selectedId]);

    const handleSendMessage = async () => {
        if (!messageInput.trim()) return;
        try {
            const ticketObj = tickets.find(t => t.id === selectedId);
            if (!ticketObj) return;

            const res = await authFetch(`${API}/api/support/tickets/${selectedId}/add_message/`, {
                method: 'POST',
                body: JSON.stringify({
                    content: isFlagged ? `[HIGH IMPACT ALERT] ${messageInput}` : messageInput,
                    tag: isFlagged ? 'Urgent' : 'General'
                })
            });

            if (res.ok) {
                fetchTickets();
                setMessageInput('');
                setIsFlagged(false);
                setHasAttachment(false);
            }
        } catch (e) {
            console.error('Transmission failure:', e);
        }
    };

    const updateTicketStatus = async (newStatus: TicketType['status']) => {
        try {
            const res = await authFetch(`${API}/api/support/tickets/${selectedId}/update_status/`, {
                method: 'POST',
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchTickets();
            }
        } catch (e) {
            console.error('Status sync failure:', e);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-14rem)] bg-[#0B101B] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            {/* Top Tactical Header */}
            <div className="flex-shrink-0 px-10 py-6 bg-[#0B101B]/80 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between z-40">
                <div className="flex items-center gap-8">
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Help & Support</h2>
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                        {['Requests', 'KB'].map((v: any) => (
                            <button 
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-4 py-2 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${
                                    view === v ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'
                                }`}
                            >
                                {v === 'Requests' ? 'Requests Hub' : 'Knowledge Base'}
                            </button>
                        ))}
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
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-[12px] text-white placeholder-slate-700 outline-none focus:border-indigo-500/50 uppercase tracking-widest font-bold"
                        />
                    </div>
                     <button 
                        onClick={() => setIsNewRequestOpen(true)}
                        className="px-6 py-4 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-900/40"
                    >
                        + New Request
                    </button>
                </div>
            </div>

            {view === 'Requests' ? (
                <div className="flex-1 flex overflow-hidden">
                    <TicketList filteredTickets={filteredTickets} selectedId={selectedId} setSelectedId={setSelectedId} />
                    <TicketChat {...{ selectedTicket, messageInput, setMessageInput, handleSendMessage, isFlagged, setIsFlagged, hasAttachment, setHasAttachment, fileInputRef }} />
                    <TicketDetails selectedTicket={selectedTicket} updateTicketStatus={updateTicketStatus} />
                </div>
            ) : (
                <KnowledgeBase />
            )}

            <NewRequestModal isOpen={isNewRequestOpen} onClose={() => setIsNewRequestOpen(false)} />
        </div>
    );
}



