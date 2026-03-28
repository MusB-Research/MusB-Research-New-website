import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
    Search, Plus, FileText, CheckCircle2, AlertCircle, 
    ChevronRight, ChevronDown, MoreVertical, X, 
    ArrowLeft, Eye, Download, ShieldCheck, Clock, 
    User, MousePointer2, ClipboardList, Info, 
    ArrowUpRight, Trash2, Send, Save, Lock, Unlock, 
    RefreshCw, CheckSquare, ListFilter, Monitor, Target,
    Calendar, CheckCircle, Fingerprint, FileSearch, ShieldAlert,
    Layout, ZoomIn, ZoomOut, FileType, Columns, CreditCard,
    History, MessageSquare, ChevronLeft
} from 'lucide-react';

// === CONSTANTS ===
const COLORS = {
    bg: '#0B101B',
    bgDark: '#060a14',
    accent: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#38bdf8',
    text: '#94a3b8',
    label: '#475569',
    glass: 'rgba(255,255,255,0.025)',
    border: 'rgba(255,255,255,0.06)',
    modalOverlay: 'rgba(0,0,0,0.75)'
};

const COMPREHENSION_QUESTIONS = [
    { id: 'q1', question: 'You may withdraw from this study at any time without penalty.', options: ['True', 'False', 'Only with PI approval'], correct: 'True' },
    { id: 'q2', question: 'Your personal health information may be shared with the study sponsor.', options: ['Never', 'Only if required by law', 'Yes, as described in the consent'], correct: 'Yes, as described in the consent' },
    { id: 'q3', question: 'Participation in this study is completely voluntary.', options: ['True', 'False', 'Depends on your insurance'], correct: 'True' }
];

const MOCK_STUDIES = ['Beat the Bloat', 'Menopause Study', 'NR-009 Neuro Study'];
const MOCK_PARTICIPANTS = ['BTB-023', 'BTB-017', 'BTB-031', 'MS-044', 'MS-052', 'NR-009-001'];

// === MOCK DATA ===
const MOCK_CONSENTS = [
    { 
        id: 'c1', title: 'BTB Main Consent', shortName: 'BTB-MC', study: 'Beat the Bloat', type: 'Main Consent', version: '1.0', irbNumber: '25-028', irbApprovalDate: '2026-03-20', effectiveDate: '2026-04-01', expirationDate: '2027-03-31', language: 'English', status: 'Active', notes: 'IRB approved March 2026', pageCount: 12, 
        signatureRequirements: { participantSignature: true, participantDate: true, larSignature: false, witnessSignature: false, ccSignature: true, piVerification: true, initialEachPage: false, initialKeySections: true }, 
        completionRules: { mustScrollFull: true, mustAnswerComprehension: true, mustCheckAgreements: true, allowRemote: true, allowInPerson: true, requireCCBeforePI: true }, 
        placedFields: [ { id: 'f1', type: 'Participant Signature', page: 12, x: 15, y: 82 }, { id: 'f2', type: 'Participant Date', page: 12, x: 55, y: 82 }, { id: 'f3', type: 'CC Signature', page: 12, x: 15, y: 90 } ], 
        auditLog: [ { time: '2026-03-20 09:00', user: 'Dr. Yadav', role: 'PI', action: 'Consent PDF uploaded' }, { time: '2026-03-20 09:30', user: 'Dr. Yadav', role: 'PI', action: 'Signature fields configured — 3 fields placed' }, { time: '2026-03-21 10:00', user: 'Dr. Yadav', role: 'PI', action: 'Consent published — v1.0 activated' } ] 
    },
    { 
        id: 'c2', title: 'Menopause Study Consent', shortName: 'MS-MC', study: 'Menopause Study', type: 'Main Consent', version: '2.1', irbNumber: '25-041', irbApprovalDate: '2026-02-15', effectiveDate: '2026-03-01', expirationDate: '2027-02-28', language: 'English', status: 'Active', notes: '', pageCount: 10, 
        signatureRequirements: { participantSignature: true, participantDate: true, larSignature: false, witnessSignature: true, ccSignature: true, piVerification: true, initialEachPage: true, initialKeySections: false }, 
        completionRules: { mustScrollFull: true, mustAnswerComprehension: false, mustCheckAgreements: true, allowRemote: true, allowInPerson: true, requireCCBeforePI: true }, 
        placedFields: [], 
        auditLog: [ { time: '2026-02-15 11:00', user: 'Dr. Yadav', role: 'PI', action: 'Consent v2.1 uploaded and published' } ] 
    },
    { 
        id: 'c3', title: 'BTB HIPAA Authorization', shortName: 'BTB-HIPAA', study: 'Beat the Bloat', type: 'HIPAA Authorization', version: '1.0', irbNumber: '25-028', irbApprovalDate: '2026-03-20', effectiveDate: '2026-04-01', expirationDate: null, language: 'English', status: 'Draft', notes: 'Pending final review', pageCount: 4, 
        signatureRequirements: { participantSignature: true, participantDate: true, larSignature: false, witnessSignature: false, ccSignature: false, piVerification: false, initialEachPage: false, initialKeySections: false }, 
        completionRules: { mustScrollFull: false, mustAnswerComprehension: false, mustCheckAgreements: true, allowRemote: true, allowInPerson: true, requireCCBeforePI: false }, 
        placedFields: [], 
        auditLog: [ { time: '2026-03-22 08:00', user: 'Dr. Yadav', role: 'PI', action: 'Draft created' } ] 
    }
];

const MOCK_CONSENT_RECORDS = [
    { id: 'r1', participantId: 'BTB-023', study: 'Beat the Bloat', consentId: 'c1', version: '1.0', sentDate: '2026-04-02', participantSigned: true, participantSignedDate: '2026-04-10 10:21', ccReviewed: true, ccReviewedDate: '2026-04-10 11:05', piVerified: false, piVerifiedDate: null, status: 'Pending PI Verification', locked: false, auditLog: [ { time: '2026-04-02 09:00', user: 'Dr. Yadav', role: 'PI', action: 'Consent sent to participant' }, { time: '2026-04-10 10:21', user: 'BTB-023', role: 'Participant', action: 'Participant signed consent electronically' }, { time: '2026-04-10 11:05', user: 'John Doe', role: 'CC', action: 'CC review completed — forwarded for PI verification' } ] },
    { id: 'r2', participantId: 'BTB-017', study: 'Beat the Bloat', consentId: 'c1', version: '1.0', sentDate: '2026-04-02', participantSigned: true, participantSignedDate: '2026-04-05 14:30', ccReviewed: true, ccReviewedDate: '2026-04-06 09:00', piVerified: true, piVerifiedDate: '2026-04-07 10:00', status: 'Verified', locked: true, auditLog: [ { time: '2026-04-02 09:00', user: 'Dr. Yadav', role: 'PI', action: 'Consent sent' }, { time: '2026-04-05 14:30', user: 'BTB-017', role: 'Participant', action: 'Participant signed' }, { time: '2026-04-06 09:00', user: 'Sarah Lee', role: 'CC', action: 'CC reviewed' }, { time: '2026-04-07 10:00', user: 'Dr. Yadav', role: 'PI', action: 'PI verified and locked' } ] },
    { id: 'r3', participantId: 'MS-044', study: 'Menopause Study', consentId: 'c2', version: '2.1', sentDate: '2026-03-25', participantSigned: false, participantSignedDate: null, ccReviewed: false, ccReviewedDate: null, piVerified: false, piVerifiedDate: null, status: 'Sent to Participant', locked: false, auditLog: [ { time: '2026-03-25 10:00', user: 'Dr. Yadav', role: 'PI', action: 'Consent sent to participant' } ] }
];

// === HELPERS ===
const suggestNextVersion = (consents: any[], title: string) => {
    const existing = consents.filter(c => c.title === title);
    if (existing.length === 0) return '1.0';
    const versions = existing.map(e => parseFloat(e.version));
    const max = Math.max(...versions);
    return (max + 1.0).toFixed(1);
};

const validateRecord = (record: any, consent: any) => {
    const missing: string[] = [];
    if (!record.participantSigned) missing.push('Participant Signature');
    if (consent.signatureRequirements.ccSignature && !record.ccReviewed) missing.push('Coordinator Review');
    if (!record.piVerified) missing.push('PI Verification');
    return { valid: missing.length === 0, missing };
};

// === MAIN COMPONENT ===
export default function PIConsentModule() {
    // State
    const [consents, setConsents] = useState(MOCK_CONSENTS);
    const [consentRecords, setConsentRecords] = useState(MOCK_CONSENT_RECORDS);
    const [activeView, setActiveView] = useState('builder');
    const [activeConsentId, setActiveConsentId] = useState('c1');
    const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
    const [leftSearch, setLeftSearch] = useState('');
    const [leftFilter, setLeftFilter] = useState('All');
    const [recordsSearch, setRecordsSearch] = useState('');
    const [recordsFilter, setRecordsFilter] = useState('All');
    const [currentViewerPage, setCurrentViewerPage] = useState(1);
    const [viewerZoom, setViewerZoom] = useState(85);
    const [thumbnailOpen, setThumbnailOpen] = useState(false);
    const [signatureActiveField, setSignatureActiveField] = useState<string | null>(null);
    const [signatureEditorPage, setSignatureEditorPage] = useState(1);
    const [participantSignStep, setParticipantSignStep] = useState(1);
    const [hasScrolledFull, setHasScrolledFull] = useState(false);
    const [participantAgreements, setParticipantAgreements] = useState({ read: false, questions: false, voluntary: false });
    const [comprehensionAnswers, setComprehensionAnswers] = useState<Record<string, string>>({});
    const [comprehensionChecked, setComprehensionChecked] = useState(false);
    const [participantSigned, setParticipantSigned] = useState(false);
    const [participantInitialed, setParticipantInitialed] = useState(false);
    const [ccChecklist, setCcChecklist] = useState({ identityConfirmed: false, discussionCompleted: false, allFieldsSigned: false, correctVersion: false });
    const [ccSignature, setCcSignature] = useState(false);
    const [ccWitnessSignature, setCcWitnessSignature] = useState(false);
    const [ccNotes, setCcNotes] = useState('');
    const [ccStatus, setCcStatus] = useState('Pending PI Verification');
    const [piSignature, setPiSignature] = useState(false);
    const [piNotes, setPiNotes] = useState('');
    const [piDocTab, setPiDocTab] = useState('signed');
    const [piAddNoteMode, setPiAddNoteMode] = useState(false);
    const [piRejectMode, setPiRejectMode] = useState(false);
    const [piRejectNote, setPiRejectNote] = useState('');
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadForm, setUploadForm] = useState({ title: '', study: '', type: 'Main Consent', version: '1.0', irbNumber: '', irbApprovalDate: '', effectiveDate: '', expirationDate: '', language: 'English', notes: '', file: null });
    const [templateOpen, setTemplateOpen] = useState(false);

    const applyTemplate = (name: string) => {
        const templates: any = {
            'Main Informed Consent': { title: 'Main Informed Consent', type: 'Main Consent', irbNumber: '25-028', version: suggestNextVersion(consents, 'Main Informed Consent') },
            'HIPAA Authorization': { title: 'HIPAA Authorization', type: 'HIPAA Authorization', irbNumber: '25-028', version: '1.0' },
            'Screening Consent': { title: 'Screening Consent', type: 'Screening Consent', irbNumber: '25-028', version: '1.0' }
        };
        setUploadForm({ ...uploadForm, ...templates[name] });
        setUploadModalOpen(true);
        setTemplateOpen(false);
    };
    const [sendModalOpen, setSendModalOpen] = useState(false);
    const [sendSelectedParticipants, setSendSelectedParticipants] = useState<string[]>([]);
    const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
    const [auditDrawerRecordId, setAuditDrawerRecordId] = useState<string | null>(null);
    const [pdfOverlayOpen, setPdfOverlayOpen] = useState(false);
    const [toasts, setToasts] = useState<{ id: string, type: string, message: string }[]>([]);
    const [confirmModal, setConfirmModal] = useState<{ message: string, onConfirm: () => void, type?: string, confirmLabel?: string } | null>(null);
    
    // Refs
    const viewerScrollRef = useRef<HTMLDivElement>(null);
    const participantScrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Derived Data
    const activeConsent = useMemo(() => consents.find(c => c.id === activeConsentId), [consents, activeConsentId]);
    const activeRecord = useMemo(() => consentRecords.find(r => r.id === activeRecordId), [consentRecords, activeRecordId]);

    const filteredConsents = useMemo(() => {
        return consents.filter(c => {
            const matchesSearch = c.title.toLowerCase().includes(leftSearch.toLowerCase()) || c.study.toLowerCase().includes(leftSearch.toLowerCase());
            const matchesFilter = leftFilter === 'All' || c.status === leftFilter;
            return matchesSearch && matchesFilter;
        });
    }, [consents, leftSearch, leftFilter]);

    const recordStats = useMemo(() => {
        return {
            total: consentRecords.length,
            pending: consentRecords.filter(r => r.status.includes('Pending')).length,
            verified: consentRecords.filter(r => r.piVerified).length,
            rejected: consentRecords.filter(r => r.status === 'Rejected').length,
            expiring: 2 // Mock
        };
    }, [consentRecords]);

    // Helpers
    const addToast = useCallback((message: string, type = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev.slice(-2), { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    const apppendAudit = useCallback((recordIdOrConsentId: string, user: string, role: string, action: string, type: 'consent' | 'record' = 'consent') => {
        const entry = { time: new Date().toLocaleTimeString(), user, role, action };
        if (type === 'consent') {
            setConsents(prev => prev.map(c => c.id === recordIdOrConsentId ? { ...c, auditLog: [entry, ...c.auditLog] } : c));
        } else {
            setConsentRecords(prev => prev.map(r => r.id === recordIdOrConsentId ? { ...r, auditLog: [entry, ...r.auditLog] } : r));
        }
    }, []);

    // Effect: Auto-scroll PDF on content change
    useEffect(() => {
        if (viewerScrollRef.current) viewerScrollRef.current.scrollTop = 0;
        setCurrentViewerPage(1);
    }, [activeConsentId]);

    // === STYLES ===
    const S = {
        glass: { backgroundColor: COLORS.glass, backdropFilter: 'blur(12px)', border: COLORS.border },
        title: { fontSize: '22px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' as const, letterSpacing: '-0.02em', color: 'white' },
        label: { fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: COLORS.text, opacity: 0.6 },
        badge: (c: string) => ({ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30`, padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' as const, display: 'inline-flex', alignItems: 'center', gap: '4px' }),
        btnIndigo: { backgroundColor: COLORS.accent, color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)' },
        btnGhost: { backgroundColor: 'transparent', color: 'white', border: COLORS.border, padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
        input: { backgroundColor: 'rgba(255,255,255,0.03)', border: COLORS.border, borderRadius: '8px', padding: '1rem 1.5rem', color: 'white', fontSize: '16px', outline: 'none' }
    };

    // === SUB-COMPONENTS ===
    const PDFPage = ({ pageNumber, placedFields, width = '100%', isThumbnail = false, signedFields = [] as string[] }: any) => (
        <div style={{ backgroundColor: '#0F172A', width, aspectRatio: '1/1.414', position: 'relative', padding: isThumbnail ? '1rem' : '5rem', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', cursor: isThumbnail ? 'pointer' : 'default', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: isThumbnail ? '0.5rem' : '1.5rem', right: isThumbnail ? '0.5rem' : '2.5rem', ...S.badge(COLORS.accent), color: 'white', backgroundColor: 'rgba(99,102,241,0.2)', border: 'none', fontSize: '13px' }}>PAGE {pageNumber}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isThumbnail ? '0.5rem' : '1.5rem' }}>
                <div style={{ height: isThumbnail ? '4px' : '20px', backgroundColor: 'rgba(99,102,241,0.2)', width: '60%', borderRadius: '4px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: isThumbnail ? '2px' : '0.75rem' }}>
                    {[80, 95, 88, 70, 40].map((w, i) => (
                        <div key={i} style={{ height: isThumbnail ? '2px' : '10px', backgroundColor: 'rgba(255,255,255,0.03)', width: `${w}%`, borderRadius: '2px' }} />
                    ))}
                </div>
                <div style={{ height: isThumbnail ? '4px' : '16px', backgroundColor: 'rgba(99,102,241,0.1)', width: '40%', borderRadius: '4px', marginTop: isThumbnail ? '4px' : '2rem' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: isThumbnail ? '2px' : '0.75rem' }}>
                    {[90, 85, 95, 60].map((w, i) => (
                        <div key={i} style={{ height: isThumbnail ? '2px' : '10px', backgroundColor: 'rgba(255,255,255,0.03)', width: `${w}%`, borderRadius: '2px' }} />
                    ))}
                </div>
            </div>

            {!isThumbnail && placedFields.filter((f: any) => f.page === pageNumber).map((f: any) => {
                const colorMap: any = { 'Participant Signature': COLORS.success, 'Participant Date': COLORS.info, 'Participant Initials': COLORS.warning, 'CC Signature': COLORS.accent, 'Witness Signature': '#a855f7', 'PI Verification': '#f43f5e' };
                const isSigned = signedFields.includes(f.type);
                return (
                    <div 
                        key={f.id} 
                        style={{ 
                            position: 'absolute', top: `${f.y}%`, left: `${f.x}%`, transform: 'translate(-50%, -50%)',
                            border: `2px ${isSigned ? 'solid' : 'dashed'} ${colorMap[f.type] || COLORS.label}`,
                            backgroundColor: isSigned ? `${colorMap[f.type]}15` : 'transparent',
                            padding: '0.6rem 1.2rem', borderRadius: '4px', color: colorMap[f.type] || COLORS.label, fontSize: '10px', fontWeight: 900, textTransform: 'uppercase'
                        }}
                    >
                        {isSigned ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ fontFamily: 'cursive', fontSize: '18px', marginBottom: '4px' }}>{activeRecord?.participantId || 'Signed'}</div>
                                <div style={{ fontSize: '8px', opacity: 0.7 }}>{new Date().toLocaleDateString()}</div>
                            </div>
                        ) : `[${f.type}]`}
                    </div>
                );
            })}
        </div>
    );

    // === SUB-VIEWS ===
    const renderBuilder = () => (
        <div className="flex flex-col 2xl:flex-row flex-1 overflow-visible 2xl:overflow-hidden">
            {/* LEFT PANEL */}
            <div className="w-full 2xl:w-[320px] border-b 2xl:border-b-0 2xl:border-r border-white/10 flex flex-col">
                <div style={{ padding: '1.5rem', borderBottom: COLORS.border }}>
                    <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                        <Search size={14} color={COLORS.label} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input style={{ ...S.input, width: '100%', paddingLeft: '2.25rem' }} placeholder="Search Consents..." value={leftSearch} onChange={e => setLeftSearch(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {['All', 'Active', 'Draft', 'Archived'].map(f => (
                            <button key={f} onClick={() => setLeftFilter(f)} style={{ ...S.badge(leftFilter === f ? COLORS.accent : COLORS.label), background: leftFilter === f ? `${COLORS.accent}20` : 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>{f}</button>
                        ))}
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                    {filteredConsents.map(c => (
                        <div key={c.id} onClick={() => setActiveConsentId(c.id)} style={{ padding: '1.5rem', borderBottom: COLORS.border, cursor: 'pointer', borderLeft: `3px solid ${activeConsentId === c.id ? COLORS.accent : 'transparent'}`, backgroundColor: activeConsentId === c.id ? 'rgba(99,102,241,0.08)' : 'transparent', transition: 'all 0.2s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <span style={{ ...S.title, fontSize: '13px' }}>{c.title}</span>
                                <span style={S.badge(COLORS.accent)}>{c.version}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: COLORS.label, marginBottom: '1rem' }}>{c.study}</div>
                            <div style={S.badge(c.status === 'Active' ? COLORS.success : c.status === 'Draft' ? COLORS.label : COLORS.warning)}>{c.status}</div>
                        </div>
                    ))}
                </div>
                <div className="p-6 lg:p-10 border-t border-white/10 bg-[#0B101B]/50 mt-auto">
                    <button style={{ ...S.btnIndigo, width: '100%', padding: '1.25rem' }} onClick={() => setUploadModalOpen(true)} className="hover:scale-[1.02] transition-transform shadow-xl shadow-indigo-500/10">
                        <Plus size={20} className="mr-3" /> NEW CONSENT PDF
                    </button>
                </div>
            </div>

            {/* CENTER PANEL */}
            <div className="flex-1 bg-[#060a14] flex flex-col min-h-[700px] 2xl:min-h-0">
                <div className="px-6 lg:px-10 py-6 lg:py-8 border-b border-white/10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-[#0B101B]/80 backdrop-blur-xl sticky top-0 z-30">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 lg:gap-10 w-full xl:w-auto">
                        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/10 w-full md:w-auto justify-center md:justify-start">
                            <button style={{ ...S.btnGhost, padding: '0.6rem' }} onClick={() => setCurrentViewerPage(p => Math.max(1, p-1))}><ChevronLeft size={16} /></button>
                            <span className="text-[12px] font-black uppercase tracking-widest text-white italic min-w-[120px] text-center">PAGE {currentViewerPage} / {activeConsent?.pageCount || 0}</span>
                            <button style={{ ...S.btnGhost, padding: '0.6rem' }} onClick={() => setCurrentViewerPage(p => Math.min(activeConsent?.pageCount || 1, p+1))}><ChevronRight size={16} /></button>
                        </div>
                        <div className="hidden md:block h-8 w-px bg-white/10" />
                        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/10 w-full md:w-auto justify-center md:justify-start">
                            <button style={{ ...S.btnGhost, padding: '0.6rem' }} onClick={() => setViewerZoom(z => Math.max(60, z-5))}><ZoomOut size={16} /></button>
                            <span className="text-[12px] font-black text-indigo-400 min-w-[50px] text-center font-mono">{viewerZoom}%</span>
                            <button style={{ ...S.btnGhost, padding: '0.6rem' }} onClick={() => setViewerZoom(z => Math.min(100, z+5))}><ZoomIn size={16} /></button>
                        </div>
                    </div>
                    <div className="w-full xl:w-auto grid grid-cols-2 md:grid-cols-3 xl:flex items-center gap-4 lg:gap-5">
                        <button style={{ ...S.btnIndigo, width: '100%' }} onClick={() => setActiveView('signature-setup')} className="hover:scale-[1.02] transition-transform">
                            <MousePointer2 size={18} /> <span className="hidden md:inline">Setup Signatures</span><span className="md:hidden">Setup</span>
                        </button>
                        <button style={{ ...S.btnGhost, width: '100%' }} onClick={() => setActiveView('participant-sign')} className="hover:bg-white/5 transition-colors">
                            <User size={18} /> <span className="hidden md:inline">Preview Signing</span><span className="md:hidden">Preview</span>
                        </button>
                        {activeConsent?.status === 'Active' && (
                            <div className="md:col-span-1 border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 px-6 py-4 rounded-xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest italic animate-pulse">
                                <ShieldCheck size={18} /> READ ONLY
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col 2xl:flex-row h-full">
                    {thumbnailOpen && (
                        <div className="w-full 2xl:w-[180px] bg-black/30 border-b 2xl:border-b-0 2xl:border-r border-white/10 overflow-x-auto 2xl:overflow-y-auto p-6 flex 2xl:flex-col gap-6 custom-scrollbar">
                            {activeConsent && Array.from({ length: activeConsent.pageCount }).map((_, i) => (
                                <div key={i} onClick={() => setCurrentViewerPage(i + 1)} className={`shrink-0 mb-0 2xl:mb-4 opacity-${currentViewerPage === i + 1 ? '100' : '40'} border-2 border-${currentViewerPage === i + 1 ? 'indigo-500' : 'transparent'}`}>
                                    <PDFPage pageNumber={i + 1} isThumbnail={true} placedFields={activeConsent?.placedFields || []} />
                                </div>
                            ))}
                        </div>
                    )}
                    <div ref={viewerScrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-10 2xl:p-20 flex flex-col items-center gap-10 range-min-h-[600px] 2xl:min-h-0 bg-[#060a14]/50">
                        {activeConsent ? (
                            <PDFPage pageNumber={currentViewerPage} placedFields={activeConsent.placedFields} width={`${viewerZoom}%`} />
                        ) : (
                            <div className="mt-[20vh] flex flex-col items-center text-slate-500">
                                <FileSearch size={80} className="opacity-10 mb-8" />
                                <span style={S.title}>Select a protocol to preview</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="w-full 2xl:w-[380px] border-t 2xl:border-t-0 2xl:border-l border-white/10 p-10 2xl:p-8 flex flex-col gap-10 overflow-y-auto custom-scrollbar">
                <div>
                    <label style={S.label}>Protocol Metadata</label>
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <span style={{ fontSize: '12px', color: COLORS.text, opacity: 0.5 }}>Title</span>
                            <div style={{ fontSize: '15px', color: 'white', fontWeight: 900, marginTop: '0.6rem' }}>{activeConsent?.title}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <span style={{ fontSize: '12px', color: COLORS.text, opacity: 0.5 }}>Study ID</span>
                                <div style={{ fontSize: '13px', color: 'white', marginTop: '0.6rem', fontWeight: 900 }}>{activeConsent?.study}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '12px', color: COLORS.text, opacity: 0.5 }}>IRB Approval</span>
                                <div style={{ fontSize: '13px', color: 'white', marginTop: '0.6rem', fontWeight: 900 }}>{activeConsent?.irbApprovalDate}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <label style={S.label}>Signatory Guard Matrix</label>
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {[
                            { l: 'Participant Signature', v: activeConsent?.signatureRequirements.participantSignature },
                            { l: 'CC Verification', v: activeConsent?.signatureRequirements.ccSignature },
                            { l: 'PI Final Sign-off', v: activeConsent?.signatureRequirements.piVerification },
                            { l: 'Initials on Key Sections', v: activeConsent?.signatureRequirements.initialKeySections }
                        ].map(row => (
                            <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '14px', color: 'white', fontWeight: 'bold' }}>{row.l}</span>
                                {row.v ? <CheckCircle2 size={20} color={COLORS.success} /> : <X size={20} color={COLORS.danger} />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-auto border-t border-white/10 pt-10">
                    <div className="mb-8">
                        <div className="flex justify-between mb-4">
                            <label style={S.label}>Readiness Score</label>
                            <span style={{ fontSize: '14px', fontWeight: 900, color: COLORS.success }}>85%</span>
                        </div>
                        <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: '85%', backgroundColor: COLORS.success }} />
                        </div>
                    </div>
                    <button style={{ ...S.btnIndigo, width: '100%', padding: '1.25rem' }} onClick={() => addToast('Draft settings updated')}><Save size={18} /> Commit Settings</button>
                    <button style={{ ...S.btnGhost, width: '100%', marginTop: '1rem', borderColor: COLORS.success, color: COLORS.success }} onClick={() => setConfirmModal({ message: 'Publishing will activate this protocol and notify study coordinators. Continue?', onConfirm: () => addToast('Protocol Publish Protocol Active') })}><ShieldCheck size={18} /> Publish Protocol v{activeConsent?.version}</button>
                </div>
            </div>
        </div>
    );

    const renderRecords = () => (
        <div className="flex-1 p-6 lg:p-12 2xl:p-20 bg-[#060a14] overflow-y-auto custom-scrollbar">
            {/* STATS STRIP */}
            <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 2xl:p-10 grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12 2xl:mb-16">
                <div className="text-center group">
                    <div className="text-3xl lg:text-4xl font-black text-white group-hover:scale-110 transition-transform">{recordStats.total}</div>
                    <div className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500 mt-3 italic">Total Records</div>
                </div>
                <div className="text-center group border-l border-white/5">
                    <div className="text-3xl lg:text-4xl font-black text-amber-500 group-hover:scale-110 transition-transform">{recordStats.pending}</div>
                    <div className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500 mt-3 italic">Pending PI</div>
                </div>
                <div className="text-center group border-l border-white/5">
                    <div className="text-3xl lg:text-4xl font-black text-emerald-500 group-hover:scale-110 transition-transform">{recordStats.verified}</div>
                    <div className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500 mt-3 italic">Verified</div>
                </div>
                <div className="text-center group border-l border-white/5">
                    <div className="text-3xl lg:text-4xl font-black text-rose-500 group-hover:scale-110 transition-transform">{recordStats.rejected}</div>
                    <div className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500 mt-3 italic">Rejected</div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-10">
                <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                    <h2 style={{ ...S.title, fontSize: '28px' }}>Transaction Registry</h2>
                    <div className="flex gap-3 overflow-x-auto pb-4 lg:pb-0 custom-scrollbar-horizontal w-full lg:w-auto">
                        {['All', 'Pending', 'Verified', 'Rejected'].map(f => (
                            <button key={f} onClick={() => setRecordsFilter(f)} style={{ ...S.badge(recordsFilter === f ? COLORS.accent : COLORS.label), padding: '0.6rem 1.5rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>{f}</button>
                        ))}
                    </div>
                </div>
                <div className="relative w-full lg:w-[400px]">
                    <Search size={18} className="text-slate-500 absolute left-5 top-1/2 -translate-y-1/2" />
                    <input style={{ ...S.input, width: '100%', paddingLeft: '3.5rem', borderRadius: '100px' }} placeholder="Search Participant IDs..." value={recordsSearch} onChange={e => setRecordsSearch(e.target.value)} />
                </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-x-auto custom-scrollbar-horizontal">
                <table className="w-full border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="bg-white/[0.03] border-b border-white/5">
                            {['Participant ID', 'Study Assignment', 'Version', 'Signed Date', 'Status', 'Actions'].map(h => (
                                <th key={h} className="p-8 text-left uppercase tracking-[0.2em] text-[12px] font-black text-slate-500 italic">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {consentRecords.map(r => (
                            <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                <td className="p-8 font-black text-white text-xl tracking-tighter italic">{r.participantId}</td>
                                <td className="p-8 text-lg font-black text-indigo-400 italic">{r.study}</td>
                                <td className="p-8"><span style={S.badge(COLORS.accent)}>1.0</span></td>
                                <td className="p-8 text-sm text-slate-400 font-bold">{r.participantSignedDate || '—'}</td>
                                <td className="p-8">
                                    <span style={{ ...S.badge(r.status.includes('Pending') ? COLORS.warning : r.status === 'Verified' ? COLORS.success : COLORS.label), fontSize: '14px', padding: '0.6rem 1.5rem' }}>{r.status}</span>
                                </td>
                                <td className="p-8">
                                    <div className="flex gap-4">
                                        <button className="p-4 bg-white/5 border border-white/10 text-slate-400 rounded-xl hover:text-white transition-all" onClick={() => addToast('Signed PDF Loaded')}><Eye size={18} /></button>
                                        {r.status === 'Pending PI Verification' && (
                                            <button className="px-6 py-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl font-black uppercase tracking-widest text-[11px] italic hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-3" onClick={() => { setActiveRecordId(r.id); setActiveView('pi-verify'); }}><ShieldCheck size={18} /> Verify</button>
                                        )}
                                        <button className="p-4 bg-white/5 border border-white/10 text-slate-400 rounded-xl hover:text-white transition-all" onClick={() => { setAuditDrawerRecordId(r.id); setAuditDrawerOpen(true); }}><History size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderSignatureSetup = () => (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem 3rem', borderBottom: COLORS.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button style={S.btnGhost} onClick={() => setActiveView('builder')}><ArrowLeft size={14} /> Back to Builder</button>
                    <div style={{ height: '24px', width: '1px', backgroundColor: COLORS.border }} />
                    <span style={S.title}>Signature Configuration Engine</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button style={{ ...S.btnGhost, color: COLORS.danger, borderColor: COLORS.danger }} onClick={() => setConfirmModal({ message: 'Wipe all signature fields from this protocol?', onConfirm: () => addToast('Field registry cleared', 'warning') })}><Trash2 size={14} /> Clear All</button>
                    <button style={S.btnIndigo} onClick={() => { setActiveView('builder'); addToast('Signature mappings committed'); }}><Save size={14} /> Commit Changes</button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: '240px', borderRight: COLORS.border, padding: '2rem 1.5rem', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <label style={S.label}>Field Library</label>
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                            { l: 'Participant Signature', c: COLORS.success },
                            { l: 'Participant Date', c: COLORS.info },
                            { l: 'Participant Initials', c: COLORS.warning },
                            { l: 'CC Signature', c: COLORS.accent },
                            { l: 'Witness Signature', c: '#a855f7' },
                            { l: 'PI Verification', c: '#f43f5e' }
                        ].map(tool => (
                            <button 
                                key={tool.l}
                                onClick={() => setSignatureActiveField(tool.l)}
                                style={{ 
                                    ...S.btnGhost, padding: '0.75rem', textAlign: 'left', justifyContent: 'flex-start',
                                    border: `1px solid ${signatureActiveField === tool.l ? tool.c : COLORS.border}`,
                                    backgroundColor: signatureActiveField === tool.l ? `${tool.c}10` : 'transparent',
                                    color: signatureActiveField === tool.l ? 'white' : COLORS.text
                                }}
                            >
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: tool.c }} />
                                {tool.l}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1, backgroundColor: COLORS.bgDark, overflowY: 'auto', padding: '4rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="custom-scrollbar">
                    <div 
                        onClick={(e) => {
                            if (!signatureActiveField) return;
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                            const y = ((e.clientY - rect.top) / rect.height) * 100;
                            // Logic: Add field to state
                            addToast(`Mapped [${signatureActiveField}] to protocol`, 'info');
                        }}
                        style={{ position: 'relative', cursor: signatureActiveField ? 'crosshair' : 'default' }}
                    >
                        <PDFPage pageNumber={1} placedFields={activeConsent?.placedFields || []} width="800px" />
                    </div>
                </div>

                <div style={{ width: '280px', borderLeft: COLORS.border, padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <label style={S.label}>Assigned Nodes</label>
                    <div style={{ marginTop: '1.5rem', flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                        {activeConsent?.placedFields.map(f => (
                            <div key={f.id} style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: COLORS.border }}>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 900 }}>{f.type}</div>
                                    <div style={{ fontSize: '9px', color: COLORS.label }}>Page {f.page} · {Math.round(f.x)}% x {Math.round(f.y)}%</div>
                                </div>
                                <button style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer' }}><Trash2 size={12} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPIVerify = () => (
        <div style={{ flex: 1, display: 'flex', backgroundColor: COLORS.bgDark }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem 3rem', borderBottom: COLORS.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bg }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <button style={S.btnGhost} onClick={() => setActiveView('records')}><ArrowLeft size={14} /> Back to Registry</button>
                        <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.25rem' }}>
                            <button onClick={() => setPiDocTab('signed')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 900, backgroundColor: piDocTab === 'signed' ? COLORS.accent : 'transparent', color: 'white', cursor: 'pointer' }}>Signed Record</button>
                            <button onClick={() => setPiDocTab('original')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 900, backgroundColor: piDocTab === 'original' ? COLORS.accent : 'transparent', color: 'white', cursor: 'pointer' }}>IRB Original</button>
                        </div>
                    </div>
                    <div style={S.badge(COLORS.accent)}><Clock size={12} /> Received: {activeRecord?.participantSignedDate}</div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '4rem 0', display: 'flex', justifyContent: 'center' }} className="custom-scrollbar">
                    <PDFPage pageNumber={12} placedFields={activeConsent?.placedFields || []} width="800px" signedFields={['Participant Signature', 'Participant Date', 'CC Signature']} />
                </div>
            </div>

            <div style={{ width: '440px', borderLeft: COLORS.border, padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem', backgroundColor: COLORS.bg, overflowY: 'auto' }} className="custom-scrollbar">
                <div>
                    <h2 style={{ ...S.title, fontSize: '20px' }}>Protocol Verification</h2>
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                        <span style={S.label}>Participant:</span>
                        <span style={{ fontSize: '11px', fontWeight: 900, color: 'white' }}>{activeRecord?.participantId}</span>
                    </div>
                </div>

                <div>
                    <label style={S.label}>Validation Checklist</label>
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { l: 'Correct Protocol Version (v1.0)', v: true },
                            { l: 'Participant Identity Verification', v: true },
                            { l: 'All Signature Nodes Captured', v: true },
                            { l: 'Clinical Coordinator Sign-off', v: true },
                            { l: 'IRB Metadata Synchronized', v: true }
                        ].map(row => (
                            <div key={row.l} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                <CheckSquare size={18} color={COLORS.success} />
                                <span style={{ fontSize: '13px', color: 'white' }}>{row.l}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ padding: '2rem', border: `2px dashed ${COLORS.accent}`, borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setPiSignature(!piSignature)}>
                    {piSignature ? (
                        <div>
                            <div style={{ fontFamily: 'cursive', fontSize: '28px', color: COLORS.accent }}>Dr. Yadav — PI</div>
                            <div style={{ fontSize: '10px', color: COLORS.label, marginTop: '0.5rem' }}>TIMESTAMP: {new Date().toLocaleString()}</div>
                        </div>
                    ) : (
                        <div style={{ opacity: 0.3 }}>
                            <MousePointer2 size={32} style={{ marginBottom: '1rem' }} />
                            <div style={S.label}>Click to apply PI Signature</div>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button 
                        style={{ ...S.btnIndigo, width: '100%', padding: '1.5rem', backgroundColor: piSignature ? COLORS.success : COLORS.accent }}
                        disabled={!piSignature}
                        onClick={() => setConfirmModal({ message: 'Verifying will permanently seal this clinical record. Continue?', onConfirm: () => { setActiveView('records'); addToast('Transaction Sealed & Locked'); } })}
                    >
                        <ShieldCheck size={20} /> SEAL & VERIFY PROTOCOL
                    </button>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button style={{ ...S.btnGhost, flex: 1, borderColor: COLORS.danger, color: COLORS.danger }}><Trash2 size={14} /> Reject</button>
                        <button style={{ ...S.btnGhost, flex: 1 }}><RefreshCw size={14} /> Request Re-sign</button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderParticipantSign = () => {
        if (!activeConsent) return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#060a14] text-slate-500">
                <ShieldAlert size={80} className="opacity-10 mb-8" />
                <h3 style={S.title}>No Protocol Selected</h3>
            </div>
        );

        return (
            <div 
                className="flex-1 min-h-[1000px] bg-[#060a14] overflow-y-auto custom-scrollbar flex flex-col items-center p-6 lg:p-20" 
                ref={participantScrollRef} 
                onScroll={(e: any) => { 
                    if (e.target.scrollHeight - e.target.scrollTop < e.target.clientHeight + 50) setHasScrolledFull(true); 
                }}
            >
                <div className="w-full max-w-[900px] flex flex-col gap-12 lg:gap-16">
                    <div className="flex gap-2 lg:gap-3 mb-8 lg:mb-12">
                        {[1, 2, 3, 4, 5].map(s => (
                            <div key={s} className={`flex-1 h-2 rounded-full transition-all duration-500 ${s < participantSignStep ? 'bg-emerald-500' : s === participantSignStep ? 'bg-indigo-500' : 'bg-white/10'}`} />
                        ))}
                    </div>

                    {participantSignStep === 1 && (
                        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-8 lg:p-16 rounded-[2.5rem] lg:rounded-[3.5rem]">
                            <h2 style={{ ...S.title, fontSize: '32px', marginBottom: '1.5rem' }}>Protocol Review</h2>
                            <p className="text-slate-400 text-lg lg:text-xl leading-relaxed mb-10 lg:mb-16">
                                Please read the following <span className="text-white font-black italic">{activeConsent?.title}</span> document in its entirety before proceeding to the signature step.
                            </p>
                            <div className="p-8 lg:p-16 bg-white rounded-3xl h-[600px] overflow-y-auto custom-scrollbar shadow-2xl shadow-black/50 text-slate-800">
                                {/* DUMMY PROTOCOL CONTENT */}
                                <div className="space-y-12">
                                    <div className="text-center pb-8 border-b border-slate-100">
                                        <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">MusB Clinical Protocol v1.4.2</h1>
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">Beat the Bloat Study • IRB #25-028</p>
                                    </div>
                                    
                                    <section>
                                        <h3 className="text-xl font-black uppercase italic mb-4">1.0 Study Purpose</h3>
                                        <p className="text-slate-600 leading-relaxed">
                                            The purpose of this clinical trial is to evaluate the efficacy of the MusB-GI HyperImmunity Probiotic in reducing chronic gastrointestinal discomfort. You are being asked to participate because you meet the diagnostic criteria for Grade II bloating.
                                        </p>
                                    </section>

                                    <section>
                                        <h3 className="text-xl font-black uppercase italic mb-4">2.0 Potential Risks</h3>
                                        <p className="text-slate-600 leading-relaxed mb-4">
                                            While the probiotic strain is generally considered safe, some participants may experience the following:
                                        </p>
                                        <ul className="list-disc pl-6 space-y-2 text-slate-600 italic">
                                            <li>Mild abdominal cramping during the first 3 days of administration.</li>
                                            <li>Temporary changes in bowel frequency.</li>
                                            <li>A metallic taste in the mouth (reported in &lt; 0.5% of subjects).</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h3 className="text-xl font-black uppercase italic mb-4">3.0 Ethical Safeguards</h3>
                                        <p className="text-slate-600 leading-relaxed">
                                            Your participation is 100% voluntary. You may withdraw at any time for any reason. Your clinical data will be de-identified and stored on the MusB secure blockchain node for maximum data privacy and integrity.
                                        </p>
                                    </section>

                                    <div className="h-[200px] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-10 text-center gap-4">
                                        <ShieldCheck size={40} className="text-indigo-200" />
                                        <div>
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">Authenticated Regulatory Node</p>
                                            <p className="text-slate-300 text-[11px] italic">Verified IRB Approval Stamp: MAR-2026-X88</p>
                                        </div>
                                    </div>

                                    <PDFPage pageNumber={12} width="100%" placedFields={activeConsent?.placedFields || []} />
                                </div>
                            </div>
                            <div className="flex justify-end mt-12 lg:mt-16">
                                <button 
                                    style={{ ...S.btnIndigo, padding: '1.5rem 4rem' }} 
                                    disabled={!hasScrolledFull && activeConsent?.completionRules.mustScrollFull}
                                    onClick={() => setParticipantSignStep(2)}
                                    className="hover:scale-[1.02] transition-transform shadow-2xl shadow-indigo-500/20"
                                >
                                    {hasScrolledFull ? 'I HAVE READ THE FULL PROTOCOL' : 'SCROLL TO BOTTOM TO CONTINUE'}
                                </button>
                            </div>
                        </div>
                    )}

                    {participantSignStep === 2 && (
                        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-8 lg:p-16 rounded-[2.5rem] lg:rounded-[3.5rem]">
                            <h2 style={{ ...S.title, fontSize: '32px', marginBottom: '1.5rem' }}>Confirm Understanding</h2>
                            <p className="text-slate-400 text-lg lg:text-xl mb-12 lg:mb-16">Please verify the following clinical prerequisites to continue.</p>
                            <div className="flex flex-col gap-5 lg:gap-6">
                                {[
                                    { k: 'read', l: 'I have read and understood this consent form' },
                                    { k: 'questions', l: 'I had the opportunity to ask questions and receive answers' },
                                    { k: 'voluntary', l: 'I agree to participate voluntarily and may withdraw at any time' }
                                ].map(item => (
                                    <div 
                                        key={item.k} 
                                        onClick={() => setParticipantAgreements({ ...participantAgreements, [item.k]: !participantAgreements[item.k as keyof typeof participantAgreements] })} 
                                        className={`p-6 lg:p-8 bg-white/[0.02] rounded-3xl border transition-all cursor-pointer flex items-center gap-6 lg:gap-8 ${participantAgreements[item.k as keyof typeof participantAgreements] ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/5' : 'border-white/10'}`}
                                    >
                                        {participantAgreements[item.k as keyof typeof participantAgreements] ? (
                                            <CheckCircle size={32} className="text-indigo-400 shrink-0" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-xl border-2 border-slate-600 shrink-0" />
                                        )}
                                        <span className="text-lg lg:text-xl font-bold text-white">{item.l}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-6 mt-16 lg:mt-24">
                                <button style={{ ...S.btnGhost, flex: 1, padding: '1.5rem' }} onClick={() => setParticipantSignStep(1)}>Back</button>
                                <button 
                                    style={{ ...S.btnIndigo, flex: 2, padding: '1.5rem' }} 
                                    disabled={!participantAgreements.read || !participantAgreements.questions || !participantAgreements.voluntary} 
                                    onClick={() => setParticipantSignStep(activeConsent?.completionRules.mustAnswerComprehension ? 3 : 4)}
                                    className="shadow-2xl shadow-indigo-500/20"
                                >
                                    CONTINUE TO {activeConsent?.completionRules.mustAnswerComprehension ? 'QUIZ' : 'SIGNING'}
                                </button>
                            </div>
                        </div>
                    )}

                    {participantSignStep === 3 && (
                        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-8 lg:p-16 rounded-[2.5rem] lg:rounded-[3.5rem]">
                            <h2 style={{ ...S.title, fontSize: '32px', marginBottom: '1.5rem' }}>Comprehension Check</h2>
                            <p className="text-slate-400 text-lg lg:text-xl mb-12 lg:mb-16">Ensure your safety by answering these protocol-specific questions.</p>
                            <div className="flex flex-col gap-10 lg:gap-12">
                                {COMPREHENSION_QUESTIONS.map(q => (
                                    <div key={q.id}>
                                        <p className="text-xl lg:text-2xl font-black text-white italic mb-6 lg:mb-8">{q.question}</p>
                                        <div className="flex flex-col gap-4">
                                            {q.options.map(opt => (
                                                <div 
                                                    key={opt} 
                                                    onClick={() => setComprehensionAnswers({ ...comprehensionAnswers, [q.id]: opt })} 
                                                    className={`p-6 bg-white/[0.01] border rounded-2xl cursor-pointer text-lg font-bold transition-all ${comprehensionAnswers[q.id] === opt ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-white/5 text-slate-400 hover:border-white/20'}`}
                                                >
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-6 mt-16 lg:mt-24">
                                <button style={{ ...S.btnGhost, flex: 1, padding: '1.5rem' }} onClick={() => setParticipantSignStep(2)}>Back</button>
                                <button 
                                    style={{ ...S.btnIndigo, flex: 2, padding: '1.5rem' }} 
                                    onClick={() => { 
                                        if(Object.keys(comprehensionAnswers).length === 3) setParticipantSignStep(4); 
                                        else addToast('Please answer all questions', 'warning'); 
                                    }}
                                    className="shadow-2xl shadow-indigo-500/20"
                                >
                                    CHECK ANSWERS & CONTINUE
                                </button>
                            </div>
                        </div>
                    )}

                    {participantSignStep === 4 && (
                        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-8 lg:p-16 rounded-[2.5rem] lg:rounded-[3.5rem] text-center">
                            <h2 style={{ ...S.title, fontSize: '32px', marginBottom: '1.5rem' }}>Electronic Authorization</h2>
                            <p className="text-slate-400 text-lg lg:text-xl mb-12 lg:mb-20">Applying your signature constitutes a legally binding agreement to participate in clinical research.</p>
                            <div 
                                className={`h-[400px] bg-white rounded-[2rem] flex flex-col items-center justify-center border-4 border-dashed transition-all cursor-pointer shadow-inner ${participantSigned ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-indigo-400 bg-slate-50'}`} 
                                onClick={() => setParticipantSigned(true)}
                            >
                                {participantSigned ? (
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="font-['Yellowtail'] text-7xl lg:text-8xl text-indigo-900 drop-shadow-lg">{activeRecord?.participantId || 'Signed User'}</div>
                                        <span style={S.badge(COLORS.success)} className="scale-125"><CheckCircle size={18} /> SIGNATURE APPLIED</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-6 text-slate-300">
                                        <MousePointer2 size={64} className="animate-bounce" />
                                        <div className="text-2xl font-black uppercase tracking-[0.2em] italic">CLICK HERE TO SIGN</div>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-6 mt-16 lg:mt-24">
                                <button style={{ ...S.btnGhost, flex: 1, padding: '1.5rem' }} onClick={() => setParticipantSignStep(activeConsent?.completionRules.mustAnswerComprehension ? 3 : 2)}>Back</button>
                                <button 
                                    style={{ ...S.btnIndigo, flex: 2, padding: '1.5rem' }} 
                                    disabled={!participantSigned} 
                                    onClick={() => setParticipantSignStep(5)}
                                    className="shadow-2xl shadow-indigo-500/20"
                                >
                                    REVIEW FOR SUBMISSION
                                </button>
                            </div>
                        </div>
                    )}

                    {participantSignStep === 5 && (
                        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-12 lg:p-24 rounded-[2.5rem] lg:rounded-[3.5rem] text-center flex flex-col items-center gap-10">
                            <div className="w-32 h-32 rounded-full bg-emerald-500/20 flex items-center justify-center border-4 border-emerald-500 shadow-2xl shadow-emerald-500/20">
                                <ShieldCheck size={64} className="text-emerald-500" />
                            </div>
                            <div>
                                <h2 style={{ ...S.title, fontSize: '40px', marginBottom: '1.5rem' }}>Protocol Ready</h2>
                                <p className="text-slate-400 text-xl leading-relaxed">Your signed consent <span className="text-white font-bold">v{activeConsent?.version}</span> is ready for submission to the PI for final verification.</p>
                            </div>
                            <button 
                                style={{ ...S.btnIndigo, width: '100%', padding: '1.75rem', backgroundColor: COLORS.success }} 
                                onClick={() => setConfirmModal({ 
                                    message: 'By submitting, you confirm your electronic signature is legally binding on this consent document.', 
                                    onConfirm: () => { setActiveView('builder'); addToast('Signed Protocol Transmitted'); } 
                                })}
                                className="shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] transition-transform"
                            >
                                SUBMIT SEALED CONSENT
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderCCReview = () => (
        <div style={{ flex: 1, display: 'flex', backgroundColor: COLORS.bgDark }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: COLORS.border }}>
                <div style={{ padding: '1.5rem 3rem', backgroundColor: COLORS.bg, borderBottom: COLORS.border, display: 'flex', justifyContent: 'space-between' }}>
                   <div style={S.title}>Staff Quality Review Mode</div>
                   <div style={S.badge(COLORS.accent)}>Record ID: {activeRecordId}</div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '4rem 0', display: 'flex', justifyContent: 'center' }} className="custom-scrollbar">
                    <PDFPage pageNumber={12} width="800px" placedFields={activeConsent?.placedFields || []} signedFields={['Participant Signature', 'Participant Date']} />
                </div>
            </div>
            <div style={{ width: '420px', backgroundColor: COLORS.bg, padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                <div>
                   <label style={S.label}>Verification Checklist</label>
                   <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                       {[
                           { k: 'id', l: 'Participant identity confirmed' },
                           { k: 'disc', l: 'Consent discussion completed' },
                           { k: 'fields', l: 'All required fields are signed' },
                           { k: 'ver', l: 'Correct consent version used' }
                       ].map(item => (
                           <div key={item.k} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                               <CheckSquare size={20} color={COLORS.success} />
                               <span style={{ fontSize: '13px', color: COLORS.text }}>{item.l}</span>
                           </div>
                       ))}
                   </div>
                </div>
                <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '2rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => setCcSignature(!ccSignature)}>
                    {ccSignature ? <div style={{ fontFamily: 'cursive', fontSize: '24px', color: COLORS.success }}>John Doe — Coordinator</div> : <div style={{ color: COLORS.label, fontSize: '11px', fontWeight: 900 }}>CLICK TO APPLY STAFF SIGNATURE</div>}
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button style={{ ...S.btnIndigo, width: '100%', padding: '1.25rem' }} onClick={() => addToast('Review submitted for PI')}><Fingerprint size={16} /> FORWARD TO PI</button>
                    <button style={{ ...S.btnGhost, width: '100%' }} onClick={() => setActiveView('records')}>Cancel Review</button>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '1200px', backgroundColor: COLORS.bg, color: 'white' }}>
            {/* TOP BAR */}
            <header className="flex-shrink-0 bg-[#0B101B]/80 backdrop-blur-3xl border-b border-white/5 z-[1000] px-6 lg:px-12 py-8 2xl:py-10">
                <div className="flex flex-col 2xl:flex-row items-start 2xl:items-center justify-between gap-10 2xl:gap-6">
                    <div className="flex items-center gap-6">
                        <ShieldCheck size={36} color={COLORS.success} />
                        <div>
                            <h1 style={{ ...S.title, fontSize: '24px' }}>Consent Management</h1>
                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 mt-2 italic">
                                GOVERNANCE OVERLAY {' > '} <span className="text-white">{activeView.toUpperCase()} MODE</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full 2xl:w-auto grid grid-cols-1 md:grid-cols-3 2xl:flex items-center gap-5">
                        <div className="relative">
                            <button style={{ ...S.btnGhost, width: '100%', justifyContent: 'center' }} onClick={() => setTemplateOpen(!templateOpen)}>
                                <FileType size={18} /> Templates <ChevronDown size={14} />
                            </button>
                            {templateOpen && (
                                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', width: '260px', backgroundColor: '#161d2b', border: COLORS.border, borderRadius: '12px', padding: '0.75rem', zIndex: 10000, boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
                                    {['Main Informed Consent', 'HIPAA Authorization', 'Screening Consent'].map(t => (
                                        <div key={t} onClick={() => applyTemplate(t)} style={{ padding: '1rem 1.25rem', fontSize: '14px', cursor: 'pointer', borderRadius: '8px', transition: '0.2s', fontWeight: 'bold' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            {t}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button style={{ ...S.btnGhost, width: '100%', justifyContent: 'center', borderColor: activeView === 'records' ? COLORS.accent : COLORS.border, background: activeView === 'records' ? `${COLORS.accent}10` : 'transparent', color: activeView === 'records' ? 'white' : COLORS.text }} onClick={() => setActiveView('records')}>
                            <ClipboardList size={18} /> <span className="hidden md:inline">Transaction Registry</span><span className="md:hidden">Registry</span>
                        </button>
                        <button style={{ ...S.btnGhost, width: '100%', justifyContent: 'center', borderColor: activeView === 'builder' ? COLORS.accent : COLORS.border, background: activeView === 'builder' ? `${COLORS.accent}10` : 'transparent', color: activeView === 'builder' ? 'white' : COLORS.text }} onClick={() => setActiveView('builder')}>
                            <Monitor size={18} /> <span className="hidden md:inline">Protocol Builder</span><span className="md:hidden">Builder</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN AREA */}
            <main className="flex-1 flex flex-col min-h-[1000px] lg:min-h-[800px]" style={{ display: 'flex', backgroundColor: '#060a14' }}>
                {activeView === 'builder' && renderBuilder()}
                {activeView === 'records' && renderRecords()}
                {activeView === 'signature-setup' && renderSignatureSetup()}
                {activeView === 'pi-verify' && renderPIVerify()}
                {activeView === 'participant-sign' && renderParticipantSign()}
                {activeView === 'cc-review' && renderCCReview()}
            </main>

            {/* MODALS & OVERLAYS */}
            {uploadModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: COLORS.modalOverlay, backdropFilter: 'blur(8px)' }} onClick={() => setUploadModalOpen(false)} />
                    <div style={{ ...S.glass, width: '600px', padding: '3rem', borderRadius: '24px', position: 'relative', backgroundColor: 'rgba(11,16,27,0.85)' }}>
                        <h2 style={{ ...S.title, fontSize: '20px', marginBottom: '2.5rem' }}>Upload Consent Protocol</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={S.label}>Consent Type Header</label>
                                <input style={{ ...S.input, width: '100%', marginTop: '0.5rem' }} placeholder="e.g. Main Informed Consent" />
                            </div>
                            <div>
                                <label style={S.label}>Study Repository</label>
                                <select style={{ ...S.input, width: '100%', marginTop: '0.5rem', appearance: 'none' }}>
                                    {MOCK_STUDIES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={S.label}>Version Tag</label>
                                <input style={{ ...S.input, width: '100%', marginTop: '0.5rem' }} value="1.0" readOnly />
                            </div>
                        </div>
                        <div style={{ border: `2px dashed ${COLORS.border}`, borderRadius: '12px', padding: '4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }} onClick={() => addToast('consent_v1.pdf staging successful', 'info')}>
                            <ArrowUpRight size={32} color={COLORS.accent} style={{ marginBottom: '1rem' }} />
                            <span style={S.label}>Drop Protocol PDF here</span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                            <button style={{ ...S.btnGhost, flex: 1, padding: '1rem' }} onClick={() => setUploadModalOpen(false)}>Abort</button>
                            <button style={{ ...S.btnIndigo, flex: 2, padding: '1rem' }} onClick={() => { setUploadModalOpen(false); addToast('Draft created successfully'); }}>Commit Draft</button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST SYSTEM */}
            <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 4000, display: 'flex', flexDirection: 'column-reverse', gap: '0.75rem' }}>
                {toasts.map(t => (
                    <div key={t.id} style={{ 
                        padding: '1rem 2.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1.25rem',
                        backgroundColor: t.type === 'success' ? COLORS.success : t.type === 'error' ? COLORS.danger : COLORS.warning,
                        color: 'white', fontWeight: 900, textTransform: 'uppercase', fontSize: '11px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        animation: 'slideIn 0.3s forwards', position: 'relative', overflow: 'hidden'
                    }}>
                        <Info size={16} /> <span>{t.message}</span>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', backgroundColor: 'rgba(255,255,255,0.3)', width: '100%', animation: 'shrink 3s linear forwards' }} />
                    </div>
                ))}
            </div>

            {confirmModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: COLORS.modalOverlay, backdropFilter: 'blur(8px)' }} onClick={() => setConfirmModal(null)} />
                    <div style={{ ...S.glass, width: '400px', padding: '3rem', borderRadius: '24px', position: 'relative', textAlign: 'center' }}>
                        <ShieldAlert size={48} color={COLORS.warning} style={{ marginBottom: '1.5rem' }} />
                        <h3 style={{ ...S.title, fontSize: '18px', marginBottom: '1rem' }}>Final Authorization</h3>
                        <p style={{ fontSize: '14px', color: COLORS.text, lineHeight: 1.6, marginBottom: '2.5rem' }}>{confirmModal.message}</p>
                        <div style={{ display: 'flex', gap: '1.25rem' }}>
                            <button style={{ ...S.btnGhost, flex: 1, padding: '0.8rem' }} onClick={() => setConfirmModal(null)}>Cancel</button>
                            <button style={{ ...S.btnIndigo, flex: 1, padding: '0.8rem' }} onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* AUDIT TRAIL DRAWER */}
            {auditDrawerOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 6000 }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={() => setAuditDrawerOpen(false)} />
                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '400px', backgroundColor: COLORS.bg, borderLeft: COLORS.border, padding: '3rem 2rem', boxShadow: '-20px 0 50px rgba(0,0,0,0.5)', animation: 'slideIn 0.3s forwards', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                            <h2 style={S.title}>Transaction Audit Log</h2>
                            <button style={S.btnGhost} onClick={() => setAuditDrawerOpen(false)}><X size={16} /></button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                            {(consentRecords.find(r => r.id === auditDrawerRecordId)?.auditLog || []).map((log, i) => (
                                <div key={i} style={{ padding: '1.25rem', borderLeft: `2px solid ${log.role === 'PI' ? COLORS.accent : log.role === 'CC' ? COLORS.success : COLORS.warning}`, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0 8px 8px 0', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 900, color: 'white' }}>{log.user.toUpperCase()} · {log.role}</span>
                                        <span style={{ fontSize: '10px', color: COLORS.label }}>{log.time}</span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: COLORS.text, lineHeight: 1.4 }}>{log.action}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* SEND FOR SIGNATURE MODAL */}
            {sendModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 7000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: COLORS.modalOverlay, backdropFilter: 'blur(8px)' }} onClick={() => setSendModalOpen(false)} />
                    <div style={{ ...S.glass, width: '500px', padding: '3.5rem', borderRadius: '32px', position: 'relative', backgroundColor: 'rgba(11,16,27,0.95)' }}>
                        <h2 style={{ ...S.title, fontSize: '22px', marginBottom: '1rem' }}>Transmit Protocol</h2>
                        <p style={{ color: COLORS.text, fontSize: '14px', marginBottom: '2.5rem' }}>Select study participants to receive this consent protocol electronically.</p>
                        
                        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '1rem' }} className="custom-scrollbar">
                            {MOCK_PARTICIPANTS.map(p => (
                                <div key={p} 
                                    onClick={() => setSendSelectedParticipants(prev => prev.includes(p) ? prev.filter(id => id !== p) : [...prev, p])}
                                    style={{ padding: '1.25rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: `1px solid ${sendSelectedParticipants.includes(p) ? COLORS.accent : COLORS.border}`, display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                                >
                                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${sendSelectedParticipants.includes(p) ? COLORS.accent : COLORS.label}`, backgroundColor: sendSelectedParticipants.includes(p) ? COLORS.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {sendSelectedParticipants.includes(p) && <CheckSquare size={14} color="white" />}
                                    </div>
                                    <span style={{ fontSize: '14px', color: 'white', fontWeight: 500 }}>{p}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '3rem', display: 'flex', gap: '1.25rem' }}>
                            <button style={{ ...S.btnGhost, flex: 1 }} onClick={() => setSendModalOpen(false)}>Cancel</button>
                            <button 
                                style={{ ...S.btnIndigo, flex: 2, padding: '1.25rem' }} 
                                disabled={sendSelectedParticipants.length === 0}
                                onClick={() => { setSendModalOpen(false); addToast(`Sent to ${sendSelectedParticipants.length} participants`); }}
                            >
                                <Send size={16} /> TRANSMIT TO {sendSelectedParticipants.length} SELECTED
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
