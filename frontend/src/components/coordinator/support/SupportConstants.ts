export const COLORS = {
    bg: '#0B101B',
    accent: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#38bdf8',
    text: '#94a3b8',
    label: '#475569',
    glass: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.06)',
};

export const MOCK_DOCS = [
    { cat: 'SOP Repository', title: 'Adverse Event Reporting SOP v3.1', type: 'PDF', size: '2.4 MB', date: '2024-02-15' },
    { cat: 'SOP Repository', title: 'Subject Enrollment Protocol Hub', type: 'DOCX', size: '1.1 MB', date: '2024-01-20' },
    { cat: 'SOP Repository', title: 'Data Integrity Maintenance Log', type: 'XLSX', size: '450 KB', date: '2024-03-01' },
    { cat: 'Training Modules', desc: 'PI Training: Electronic Signature Laws', type: 'Video', size: '124 MB', date: '2024-02-10' },
    { cat: 'Training Modules', desc: 'Coordinator: Case Report Form Guide', type: 'PDF', size: '5.6 MB', date: '2024-03-12' },
    { cat: 'Platform FAQs', title: 'MSR-01 Error Troubleshooting', type: 'Knowledge', size: '12 KB', date: '2024-03-18' },
    { cat: 'Platform FAQs', title: 'Digital Signature Failures Fix', type: 'Knowledge', size: '8 KB', date: '2024-03-19' }
];

export interface TicketMessage {
    id: string;
    sender: string;
    role: string;
    content: string;
    timestamp: string;
    attachments?: string[];
}

export interface Ticket {
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
