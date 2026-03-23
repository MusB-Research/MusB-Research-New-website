import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

// === CONSTANTS ===
const SPONSOR = { id: 'SP-VITANOVA', name: 'VitaNova Therapeutics' };

const STYLES = {
    container: {
        background: '#060a14',
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: 'white',
        padding: '0 0 80px 0',
    },
    topBar: {
        position: 'sticky' as const,
        top: 0,
        background: 'rgba(6, 10, 20, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        zIndex: 100,
        padding: '16px 24px',
    },
    innerContent: {
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 24px',
    },
    card: {
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        padding: '32px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    buttonPrimary: {
        background: '#2563eb',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        padding: '12px 24px',
        fontWeight: 700,
        fontSize: '15px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
    },
    buttonGhost: {
        background: 'transparent',
        color: '#2563eb',
        border: '1px solid #2563eb',
        borderRadius: '12px',
        padding: '12px 24px',
        fontWeight: 700,
        fontSize: '15px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
    },
    pill: {
        padding: '6px 12px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
    },
    badge: {
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 800,
        background: 'rgba(255,255,255,0.05)',
        color: '#94a3b8',
    }
};

// === MOCK DATA ===
const MOCK_STUDIES = [
    {
        id: 'MUSB-2024-012',
        title: 'VITAL-Age Study',
        status: 'Recruiting',
        studyType: 'In-Person',
        nctNumber: 'NCT06123456',
        registryStatus: 'Active, Recruiting',
        documents: [
            { id: 'd1', type: 'IRB Letter', category: 'Regulatory', title: 'IRB Approval Letter', description: 'Official IRB approval document for this study protocol', version: '1.0', date: '2025-09-01', irbNumber: '25-028', expiryDate: '2026-09-01', pageCount: 3 },
            { id: 'd2', type: 'Protocol', category: 'Protocol', title: 'IRB Approved Protocol', description: 'Final approved study protocol document', version: '2.0', date: '2025-08-15', amendment: 'Amendment 1 — Aug 2025', pageCount: 48, versions: [{ version: '1.0', date: '2025-07-01', status: 'Superseded', notes: 'Initial submission' }, { version: '2.0', date: '2025-08-15', status: 'Current', notes: 'Amendment 1 — updated eligibility criteria' }] },
            { id: 'd3', type: 'Consent', category: 'Consent', title: 'Participant Consent Form', description: 'IRB-approved informed consent document for study participants', version: '1.0', date: '2025-09-01', effectiveDate: '2025-10-01', expiryDate: '2026-09-01', language: 'English', pageCount: 12, versions: [{ version: '1.0', date: '2025-09-01', status: 'Current', irbApprovalDate: '2025-09-01' }] },
            { id: 'd4', type: 'Report', category: 'Reports', title: 'Q1 2026 Progress Report', description: 'Quarterly enrollment and safety progress report', version: '1.0', date: '2026-01-10', pageCount: 8 },
            { id: 'd5', type: 'Report', category: 'Reports', title: 'Interim Safety Report', description: 'Mid-study safety monitoring summary', version: '1.0', date: '2026-02-20', pageCount: 6 },
            { id: 'd6', type: 'Site Activation', category: 'Regulatory', title: 'Site Activation Letter', description: 'Official site activation authorization from sponsor', version: '1.0', date: '2025-09-20', pageCount: 2 }
        ],
        reportStats: { progressReportsAvailable: 2, latestReport: 'Ready', participantDataAvailable: true }
    },
    {
        id: 'MUSB-2024-013',
        title: 'Anti-Aging Microbiome Study',
        status: 'Active',
        studyType: 'Virtual',
        nctNumber: null,
        registryStatus: null,
        documents: [
            { id: 'd7', type: 'IRB Letter', category: 'Regulatory', title: 'IRB Approval Letter', description: 'Official IRB approval for Anti-Aging Microbiome Study', version: '1.0', date: '2025-10-28', irbNumber: '25-041', expiryDate: '2026-10-28', pageCount: 3 },
            { id: 'd8', type: 'Protocol', category: 'Protocol', title: 'IRB Approved Protocol', description: 'Final approved study protocol', version: '1.0', date: '2025-10-15', amendment: null, pageCount: 36, versions: [{ version: '1.0', date: '2025-10-15', status: 'Current', notes: 'Initial approved version' }] },
            { id: 'd9', type: 'Consent', category: 'Consent', title: 'Participant Consent Form', description: 'IRB-approved eConsent document', version: '2.1', date: '2026-02-15', effectiveDate: '2026-03-01', expiryDate: '2027-02-28', language: 'English', pageCount: 10, versions: [{ version: '1.0', date: '2025-11-01', status: 'Superseded', irbApprovalDate: '2025-10-28' }, { version: '2.1', date: '2026-02-15', status: 'Current', irbApprovalDate: '2026-02-10' }] }
        ],
        reportStats: { progressReportsAvailable: 0, latestReport: 'Pending', participantDataAvailable: true }
    },
    {
        id: 'MUSB-2023-008',
        title: 'Gut-Brain Axis Pilot Study',
        status: 'Completed',
        studyType: 'Hybrid',
        nctNumber: 'NCT05987654',
        registryStatus: 'Completed',
        documents: [
            { id: 'd10', type: 'IRB Letter', category: 'Regulatory', title: 'IRB Approval Letter', description: 'Original IRB approval — now archived', version: '1.0', date: '2023-12-15', irbNumber: '23-091', expiryDate: '2024-12-15', pageCount: 3 },
            { id: 'd11', type: 'Protocol', category: 'Protocol', title: 'IRB Approved Protocol', description: 'Final study protocol — version 3 (final)', version: '3.0', date: '2023-12-01', amendment: 'Amendment 2', pageCount: 52, versions: [{ version: '1.0', date: '2023-10-01', status: 'Superseded', notes: 'Initial' }, { version: '2.0', date: '2023-11-15', status: 'Superseded', notes: 'Amendment 1' }, { version: '3.0', date: '2023-12-01', status: 'Final', notes: 'Amendment 2 — final' }] },
            { id: 'd12', type: 'Consent', category: 'Consent', title: 'Participant Consent Form', description: 'Final consent version used for all enrolled participants', version: '3.0', date: '2023-12-15', effectiveDate: '2024-01-01', expiryDate: '2024-12-31', language: 'English', pageCount: 11, versions: [{ version: '1.0', date: '2023-10-01', status: 'Superseded', irbApprovalDate: '2023-10-01' }, { version: '2.0', date: '2023-11-20', status: 'Superseded', irbApprovalDate: '2023-11-15' }, { version: '3.0', date: '2023-12-15', status: 'Final', irbApprovalDate: '2023-12-15' }] },
            { id: 'd13', type: 'Report', category: 'Reports', title: 'Final Study Report', description: 'Comprehensive final study report with all outcomes', version: '1.0', date: '2025-01-15', pageCount: 24 },
            { id: 'd14', type: 'Report', category: 'Reports', title: 'Q2 2024 Progress Report', description: 'Mid-study progress and safety summary', version: '1.0', date: '2024-06-30', pageCount: 10 }
        ],
        reportStats: { progressReportsAvailable: 2, latestReport: 'Sent', participantDataAvailable: true }
    }
];

// === HELPERS ===
const mockDownloadBlob = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// === SUB-COMPONENTS ===

const Icons = {
    Document: ({ color = '#2563eb', size = 24 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    ),
    Folder: ({ color = '#2563eb', size = 64 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
        </svg>
    ),
    Stamp: ({ color = '#6366f1', size = 40 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 22h14" />
            <path d="M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11a2.5 2.5 0 0 0-1.77.73L2 16.5V20c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-3.5l-2.73-2.77z" />
            <path d="M12 13V2" />
            <path d="M9 2h6" />
        </svg>
    ),
    Protocol: ({ color = '#2563eb', size = 40 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="18" x2="16" y2="18" />
            <line x1="8" y1="14" x2="16" y2="14" />
            <line x1="8" y1="10" x2="16" y2="10" />
            <line x1="8" y1="6" x2="12" y2="6" />
        </svg>
    ),
    Consent: ({ color = '#10b981', size = 40 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8.5" />
            <path d="M15 13l-3 3-2-2" />
            <path d="M9 7h10" />
            <path d="M9 11h10" />
            <path d="M18.41 2.41a2 2 0 0 1 2.83 2.83l-3.24 3.24-2.83-2.83 3.24-3.24z" />
        </svg>
    ),
    Report: ({ color = '#f59e0b', size = 40 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    ),
    External: ({ color = '#64748b', size = 40 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    ),
    Search: ({ color = '#64748b', size = 18, style = {} }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    ChevronRight: ({ color = 'currentColor', size = 16 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    ),
    Download: ({ color = 'currentColor', size = 16 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    ),
    Eye: ({ color = 'currentColor', size = 16 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    X: ({ color = 'currentColor', size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
};

const Toast = ({ message, type, onDismiss }: { message: string, type: string, onDismiss: () => void }) => {
    const colors: Record<string, string> = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#2563eb'
    };

    return (
        <div style={{
            padding: '16px 24px',
            background: '#0f172a',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            borderLeft: `4px solid ${colors[type] || colors.info}`,
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '10px',
            position: 'relative' as const,
            overflow: 'hidden',
            width: '320px',
            pointerEvents: 'auto' as const,
        }}>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{message}</div>
            </div>
            <button onClick={onDismiss} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}>
                <Icons.X size={14} color="#94a3b8" />
            </button>
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                background: colors[type] || colors.info,
                animation: 'toast-progress 3s linear forwards'
            }} />
        </div>
    );
};

// === MAIN COMPONENT ===

export default function SponsorDocumentCenter() {
    const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);
    const [studySelectValue, setStudySelectValue] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All Documents');
    const [sortMode, setSortMode] = useState('Newest First');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerDoc, setViewerDoc] = useState<any>(null);
    const [viewerPage, setViewerPage] = useState(1);
    const [viewerZoom, setViewerZoom] = useState(85);
    const [protocolVersionsOpen, setProtocolVersionsOpen] = useState(false);
    const [protocolVersionsDoc, setProtocolVersionsDoc] = useState<any>(null);
    const [consentVersionsOpen, setConsentVersionsOpen] = useState(false);
    const [consentVersionsDoc, setConsentVersionsDoc] = useState<any>(null);
    const [reportsModalOpen, setReportsModalOpen] = useState(false);
    const [toasts, setToasts] = useState<any[]>([]);
    const [selectionError, setSelectionError] = useState('');

    const viewerScrollRef = useRef<HTMLDivElement>(null);

    const showToast = useCallback((message: string, type: string = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev.slice(-2), { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    const selectedStudy = useMemo(() => 
        MOCK_STUDIES.find(s => s.id === selectedStudyId), [selectedStudyId]
    );

    const filteredDocuments = useMemo(() => {
        if (!selectedStudy) return [];
        let docs = [...selectedStudy.documents];

        if (categoryFilter !== 'All Documents') {
            const catMap: Record<string, string> = {
                'Regulatory': 'Regulatory',
                'Protocol': 'Protocol',
                'Consent': 'Consent',
                'Reports': 'Reports',
                'External Links': 'External'
            };
            docs = docs.filter(d => d.category === catMap[categoryFilter]);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            docs = docs.filter(d => d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
        }

        if (sortMode === 'Newest First') docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (sortMode === 'Oldest First') docs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (sortMode === 'A–Z') docs.sort((a, b) => a.title.localeCompare(b.title));
        if (sortMode === 'By Category') docs.sort((a, b) => a.category.localeCompare(b.category));

        return docs;
    }, [selectedStudy, categoryFilter, searchQuery, sortMode]);

    const handleSelectStudy = () => {
        if (!studySelectValue) {
            setSelectionError('Please select a study to continue');
            return;
        }
        setSelectionError('');
        setSelectedStudyId(studySelectValue);
        showToast(`Document stream initialized for ${studySelectValue}`, 'success');
    };

    const handleDownloadAll = () => {
        showToast(`Preparing ZIP download for ${selectedStudy?.title} documents...`, 'info');
        setTimeout(() => {
            showToast(`Download started: ${selectedStudy?.id}_documents.zip`, 'success');
            mockDownloadBlob(`${selectedStudy?.id}_package.zip`, "Mock ZIP content for document bundle");
        }, 1500);
    };

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setViewerOpen(false);
                setProtocolVersionsOpen(false);
                setConsentVersionsOpen(false);
                setReportsModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    // --- RENDER SECTIONS ---

    const renderViewer = () => {
        if (!viewerDoc) return null;
        const pages = Array.from({ length: viewerDoc.pageCount || 1 }, (_, i) => i + 1);

        return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(15px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }} onClick={() => setViewerOpen(false)}>
                <div style={{ width: '900px', height: '90vh', background: '#0b1221', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 90px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.05)' }} onClick={e => e.stopPropagation()}>
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'white', margin: 0 }}>{viewerDoc.title}</h3>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '6px', alignItems: 'center' }}>
                                <span style={{ ...STYLES.badge, background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>🔒 Read-Only</span>
                                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Version: {viewerDoc.version} · {viewerDoc.date}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                onClick={() => mockDownloadBlob(`${viewerDoc.title.replace(/\s+/g, '_')}.pdf`, `Mock PDF Content for ${viewerDoc.title}`)}
                                style={{ ...STYLES.buttonGhost, padding: '10px 20px', fontSize: '13px' }}
                            >
                                <Icons.Download size={16} /> Download
                            </button>
                            <button onClick={() => setViewerOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <Icons.X size={24} color="white" />
                            </button>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', background: '#060a14', padding: '40px 0' }} ref={viewerScrollRef}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
                            {pages.map(p => (
                                <div key={p} style={{ width: `${viewerZoom}%`, background: 'white', aspectRatio: '1/1.41', boxShadow: '0 4px 40px rgba(0,0,0,0.5)', position: 'relative', padding: '60px', borderRadius: '4px' }}>
                                    <div style={{ position: 'absolute', top: '24px', right: '24px', fontSize: '12px', fontWeight: 800, color: '#e2e8f0' }}>PAGE {p}</div>
                                    {p === 1 && (
                                        <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '24px', marginBottom: '40px' }}>
                                            <div style={{ color: '#2563eb', fontWeight: 900, letterSpacing: '2px', fontSize: '14px', marginBottom: '8px' }}>MUSB RESEARCH | SPONSOR PORTAL</div>
                                            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>{viewerDoc.title}</h1>
                                            <div style={{ marginTop: '24px', display: 'flex', gap: '20px' }}>
                                                <div><label style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Protocol ID</label><div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{selectedStudy?.id}</div></div>
                                                <div><label style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Version</label><div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{viewerDoc.version}</div></div>
                                                <div><label style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Release Date</label><div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{viewerDoc.date}</div></div>
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        {Array.from({ length: 12 }).map((_, li) => (
                                            <div key={li} style={{ height: '14px', background: '#f1f5f9', width: `${40 + Math.random() * 60}%`, borderRadius: '4px', marginBottom: '16px' }} />
                                        ))}
                                    </div>
                                    {p === viewerDoc.pageCount && (
                                        <div style={{ marginTop: '80px', borderTop: '1px solid #e2e8f0', paddingTop: '40px' }}>
                                            <div style={{ width: '200px', height: '2px', background: '#0f172a', marginBottom: '8px' }} />
                                            <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Authorized Signatory Block</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ padding: '16px 32px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(11, 18, 33, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', boxShadow: '0 -10px 30px rgba(0,0,0,0.3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <button onClick={() => setViewerZoom(z => Math.max(50, z - 10))} style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', width: '36px', height: '36px', borderRadius: '8px', fontWeight: 900 }}>−</button>
                            <span style={{ fontSize: '13px', fontWeight: 800, width: '40px', textAlign: 'center', color: 'white' }}>{viewerZoom}%</span>
                            <button onClick={() => setViewerZoom(z => Math.min(100, z + 10))} style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', width: '36px', height: '36px', borderRadius: '8px', fontWeight: 900 }}>+</button>
                        </div>
                        <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                        <button onClick={() => { window.print(); showToast('Preparing printable document layout...', 'info'); }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Print Document</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderStudySelection = () => (
        <div style={{ ...STYLES.innerContent, padding: '80px 24px' }}>
            <div style={{ ...STYLES.card, maxWidth: '520px', margin: '0 auto', textAlign: 'center', padding: '60px' }}>
                <div style={{ marginBottom: '32px' }}><Icons.Folder size={80} /></div>
                <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Secure Document Portal</h2>
                <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '40px', lineHeight: 1.6 }}>Access IRB protocols, regulatory filings, and study reports for your authorized portfolio.</p>
                
                <div style={{ textAlign: 'left', marginBottom: '40px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '12px' }}>Protocol Registry</label>
                    <select 
                        style={{ width: '100%', padding: '16px', borderRadius: '14px', border: `2px solid ${selectionError ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, background: 'rgba(255,255,255,0.03)', fontSize: '16px', fontWeight: 600, color: 'white', outline: 'none' }}
                        value={studySelectValue}
                        onChange={e => { setStudySelectValue(e.target.value); setSelectionError(''); }}
                    >
                        <option value="" style={{ background: '#0f172a' }}>— Select a Study —</option>
                        {MOCK_STUDIES.map(s => <option key={s.id} value={s.id} style={{ background: '#0f172a' }}>{s.title} ({s.id})</option>)}
                    </select>
                    {selectionError && <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 700, marginTop: '8px' }}>{selectionError}</div>}
                </div>

                <button style={{ ...STYLES.buttonPrimary, width: '100%', padding: '18px' }} onClick={handleSelectStudy}>Initialize Document Stream</button>
                <div style={{ marginTop: '32px', color: '#94a3b8', fontSize: '12px', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span>🔒 Compliance Seal: Restricted Read-Only Mode Active</span>
                </div>
            </div>
        </div>
    );

    const renderContent = () => (
        <div style={STYLES.innerContent}>
            {/* Header / Sticky Filter */}
            <div style={{ position: 'sticky', top: '73px', background: 'rgba(6,10,20,0.9)', backdropFilter: 'blur(10px)', zIndex: 30, padding: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {['All Documents', 'Regulatory', 'Protocol', 'Consent', 'Reports', 'External Links'].map(cat => {
                        const isActive = categoryFilter === cat;
                        const count = cat === 'All Documents' 
                            ? selectedStudy?.documents.length 
                            : selectedStudy?.documents.filter(d => d.category === (cat === 'External Links' ? 'External' : cat)).length;

                        return (
                            <button 
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '12px',
                                    border: `1px solid ${isActive ? '#2563eb' : 'rgba(255,255,255,0.1)'}`,
                                    background: isActive ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.02)',
                                    color: isActive ? '#2563eb' : '#94a3b8',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {cat}
                                <span style={{ background: isActive ? '#2563eb' : 'rgba(255,255,255,0.05)', color: isActive ? 'white' : '#64748b', padding: '2px 8px', borderRadius: '6px', fontSize: '11px' }}>{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Grid */}
            {filteredDocuments.length === 0 ? (
                <div style={{ padding: '100px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ opacity: 0.2, marginBottom: '24px' }}><Icons.Folder size={64} /></div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#64748b' }}>No documents matching criteria</h3>
                    <button 
                        onClick={() => { setCategoryFilter('All Documents'); setSearchQuery(''); }}
                        style={{ ...STYLES.buttonGhost, marginTop: '24px', padding: '10px 20px' }}
                    >
                        Clear All Filters
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px', marginTop: '32px' }}>
                    {filteredDocuments.map(doc => {
                        const config: any = {
                            Regulatory: { color: '#6366f1', icon: Icons.Stamp },
                            Protocol: { color: '#2563eb', icon: Icons.Protocol },
                            Consent: { color: '#10b981', icon: Icons.Consent },
                            Reports: { color: '#f59e0b', icon: Icons.Report },
                            External: { color: '#64748b', icon: Icons.External }
                        }[doc.category] || { color: '#2563eb', icon: Icons.Document };

                        return (
                            <div key={doc.id} style={{ ...STYLES.card, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ height: '6px', background: config.color }} />
                                <div style={{ padding: '28px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                        <config.icon color={config.color} />
                                        <div style={{ ...STYLES.badge, background: `${config.color}15`, color: config.color }}>{doc.category}</div>
                                    </div>
                                    <h4 style={{ fontSize: '20px', fontWeight: 800, color: 'white', margin: '0 0 8px 0' }}>{doc.title}</h4>
                                    <p style={{ fontSize: '15px', color: '#94a3b8', margin: '0 0 20px 0', lineHeight: 1.5 }}>{doc.description}</p>
                                    
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                                        <div style={STYLES.badge}>v{doc.version}</div>
                                        <div style={STYLES.badge}>{doc.date}</div>
                                        {doc.irbNumber && <div style={STYLES.badge}>IRB: {doc.irbNumber}</div>}
                                    </div>

                                    <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
                                        {doc.category === 'External' ? (
                                            <button 
                                                onClick={() => { window.open('https://clinicaltrials.gov', '_blank'); showToast('Redirecting to ClinicalTrials.gov...', 'info'); }}
                                                style={{ ...STYLES.buttonPrimary, flex: 1 }}
                                            >
                                                Open Registry Listing
                                            </button>
                                        ) : (
                                            <>
                                                <button 
                                                    onClick={() => { setViewerDoc(doc); setViewerOpen(true); }}
                                                    style={{ ...STYLES.buttonGhost, flex: 1, padding: '10px' }}
                                                >
                                                    <Icons.Eye size={16} /> View
                                                </button>
                                                <button 
                                                    onClick={() => { showToast(`Downloading ${doc.title}...`, 'info'); mockDownloadBlob(`${doc.title}.pdf`, `Mock content for ${doc.id}`); }}
                                                    style={{ ...STYLES.buttonPrimary, flex: 1, padding: '10px' }}
                                                >
                                                    <Icons.Download size={16} /> Download
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    return (
        <div style={STYLES.container}>
            {/* Sticky Top Bar */}
            <div style={STYLES.topBar}>
                <div style={{ ...STYLES.innerContent, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '42px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>Document <span style={{ color: '#2563eb' }}>Center</span></div>
                        <div style={{ fontSize: '15px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>Sponsor Portal</span> <Icons.ChevronRight size={12} /> <span>Security Repository</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {selectedStudyId && (
                            <div style={{ position: 'relative', width: '320px' }}>
                                <Icons.Search style={{ position: 'absolute', left: '16px', top: '12px' }} />
                                <input 
                                    type="text"
                                    placeholder="Search study documents..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ width: '100%', padding: '10px 16px 10px 44px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', fontSize: '14px', color: 'white', outline: 'none' }}
                                />
                            </div>
                        )}
                        <div style={{ ...STYLES.badge, background: 'rgba(245,158,11,0.1)', color: '#fbbf24', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>🔒 READ-ONLY ACCESS</div>
                    </div>
                </div>
            </div>

            {/* Selection or Main Content */}
            {!selectedStudyId ? renderStudySelection() : (
                <>
                    {/* Study Sticky Header */}
                    <div style={{ background: 'rgba(6,10,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: '72px', zIndex: 40, padding: '20px 0', backdropFilter: 'blur(10px)' }}>
                        <div style={{ ...STYLES.innerContent, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: 'white' }}>{selectedStudy?.title}</h1>
                                <code style={{ fontSize: '15px', color: '#2563eb', fontWeight: 700 }}>{selectedStudy?.id}</code>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <button onClick={() => setSelectedStudyId(null)} style={{ border: 'none', background: 'transparent', color: '#94a3b8', fontWeight: 700, cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>Change Study</button>
                                <button onClick={handleDownloadAll} style={{ ...STYLES.buttonGhost, padding: '8px 20px', fontSize: '13px' }}>Download All (.zip)</button>
                            </div>
                        </div>
                    </div>
                    {renderContent()}
                </>
            )}

            {/* Modal Layer */}
            {viewerOpen && renderViewer()}

            {/* Toast System */}
            <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 2000, pointerEvents: 'none' }}>
                {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />)}
            </div>
            
            <style>{`
                @keyframes toast-progress { from { width: 100%; } to { width: 0%; } }
                body { margin: 0; padding: 0; background: #f8fafc; }
            `}</style>
        </div>
    );
}

