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
    const [tickets, setTickets] = useState<TicketType[]>(MOCK_TICKETS);
    const [selectedId, setSelectedId] = useState<string>(MOCK_TICKETS[0].id);
    const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [messageInput, setMessageInput] = useState('');
    const [isFlagged, setIsFlagged] = useState(false);
    const [hasAttachment, setHasAttachment] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleSendMessage = () => {
        if (!messageInput.trim()) return;
        const newMessage: TicketMessage = {
            id: Date.now().toString(),
            sender: 'Coordinator (You)',
            role: 'Coordinator',
            content: isFlagged ? `[HIGH IMPACT ALERT] ${messageInput}` : messageInput,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            attachments: hasAttachment ? ['clinical_report_0923.pdf'] : []
        };
        setTickets(prev => prev.map(t => t.id === selectedId ? { ...t, messages: [...t.messages, newMessage], lastUpdated: newMessage.timestamp } : t));
        setMessageInput('');
        setIsFlagged(false);
        setHasAttachment(false);
    };

    const updateTicketStatus = (newStatus: TicketType['status']) => {
        setTickets(prev => prev.map(t => t.id === selectedId ? { 
            ...t, 
            status: newStatus, 
            auditTrail: [...t.auditTrail, { action: `Status changed to ${newStatus}`, user: 'Coordinator', time: 'Just now' }] 
        } : t));
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
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
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

