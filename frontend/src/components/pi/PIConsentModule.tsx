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
        title: { fontSize: '15px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' as const, letterSpacing: '-0.02em', color: 'white' },
        label: { fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: COLORS.label },
        badge: (c: string) => ({ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30`, padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' as const, display: 'inline-flex', alignItems: 'center', gap: '4px' }),
        btnIndigo: { backgroundColor: COLORS.accent, color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '4px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
        btnGhost: { backgroundColor: 'transparent', color: COLORS.text, border: COLORS.border, padding: '0.6rem 1.25rem', borderRadius: '4px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
        input: { backgroundColor: 'rgba(255,255,255,0.03)', border: COLORS.border, borderRadius: '6px', padding: '0.7rem 1rem', color: 'white', fontSize: '13px', outline: 'none' }
    };

    // === SUB-COMPONENTS ===
    const PDFPage = ({ pageNumber, placedFields, width = '100%', isThumbnail = false, signedFields = [] as string[] }: any) => (
        <div style={{ backgroundColor: 'rgba(255,255,255,0.92)', width, aspectRatio: '1/1.414', position: 'relative', padding: isThumbnail ? '1rem' : '5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', cursor: isThumbnail ? 'pointer' : 'default', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: isThumbnail ? '0.5rem' : '1.5rem', right: isThumbnail ? '0.5rem' : '2.5rem', ...S.badge(COLORS.label), backgroundColor: 'transparent', border: 'none' }}>PAGE {pageNumber}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isThumbnail ? '0.5rem' : '1.5rem' }}>
                <div style={{ height: isThumbnail ? '4px' : '20px', backgroundColor: '#e2e8f0', width: '60%', borderRadius: '4px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: isThumbnail ? '2px' : '0.75rem' }}>
                    {[80, 95, 88, 70, 40].map((w, i) => (
                        <div key={i} style={{ height: isThumbnail ? '2px' : '10px', backgroundColor: '#f1f5f9', width: `${w}%`, borderRadius: '2px' }} />
                    ))}
                </div>
                <div style={{ height: isThumbnail ? '4px' : '16px', backgroundColor: '#cbd5e1', width: '40%', borderRadius: '4px', marginTop: isThumbnail ? '4px' : '2rem' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: isThumbnail ? '2px' : '0.75rem' }}>
                    {[90, 85, 95, 60].map((w, i) => (
                        <div key={i} style={{ height: isThumbnail ? '2px' : '10px', backgroundColor: '#f1f5f9', width: `${w}%`, borderRadius: '2px' }} />
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
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* LEFT PANEL */}
            <div style={{ width: '280px', borderRight: COLORS.border, display: 'flex', flexDirection: 'column' }}>
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
                <button style={{ ...S.btnIndigo, margin: '1rem', borderRadius: '8px', padding: '1rem' }} onClick={() => setUploadModalOpen(true)}><Plus size={16} /> New Consent PDF</button>
            </div>

            {/* CENTER PANEL */}
            <div style={{ flex: 1, backgroundColor: COLORS.bgDark, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem 2rem', borderBottom: COLORS.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bg }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button style={S.btnGhost} onClick={() => setCurrentViewerPage(p => Math.max(1, p-1))}><ChevronLeft size={14} /></button>
                            <span style={{ fontSize: '12px', fontWeight: 900 }}>PAGE {currentViewerPage} / {activeConsent?.pageCount || 0}</span>
                            <button style={S.btnGhost} onClick={() => setCurrentViewerPage(p => Math.min(activeConsent?.pageCount || 1, p+1))}><ChevronRight size={14} /></button>
                        </div>
                        <div style={{ height: '16px', width: '1px', backgroundColor: COLORS.border }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button style={S.btnGhost} onClick={() => setViewerZoom(z => Math.max(60, z-5))}><ZoomOut size={14} /></button>
                            <span style={{ fontSize: '11px' }}>{viewerZoom}%</span>
                            <button style={S.btnGhost} onClick={() => setViewerZoom(z => Math.min(100, z+5))}><ZoomIn size={14} /></button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button style={S.btnIndigo} onClick={() => setActiveView('signature-setup')}><MousePointer2 size={14} /> Setup Signatures</button>
                        <button style={S.btnGhost} onClick={() => setActiveView('participant-sign')}><User size={14} /> Preview Signing</button>
                        {activeConsent?.status === 'Active' && <span style={S.badge(COLORS.success)}><ShieldCheck size={12} /> READ ONLY</span>}
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', height: '100%' }}>
                    {thumbnailOpen && (
                        <div style={{ width: '160px', backgroundColor: 'rgba(0,0,0,0.3)', borderRight: COLORS.border, overflowY: 'auto', padding: '1rem' }} className="custom-scrollbar">
                            {activeConsent && Array.from({ length: activeConsent.pageCount }).map((_, i) => (
                                <div key={i} onClick={() => setCurrentViewerPage(i + 1)} style={{ marginBottom: '1rem', opacity: currentViewerPage === i + 1 ? 1 : 0.4, border: currentViewerPage === i + 1 ? `2px solid ${COLORS.accent}` : 'none' }}>
                                    <PDFPage pageNumber={i + 1} isThumbnail={true} />
                                </div>
                            ))}
                        </div>
                    )}
                    <div ref={viewerScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '4rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4rem' }} className="custom-scrollbar">
                        {activeConsent ? (
                            <PDFPage pageNumber={currentViewerPage} placedFields={activeConsent.placedFields} width={`${viewerZoom}%`} />
                        ) : (
                            <div style={{ marginTop: '20vh', display: 'flex', flexDirection: 'column', alignItems: 'center', color: COLORS.label }}>
                                <FileSearch size={64} style={{ opacity: 0.1, marginBottom: '2rem' }} />
                                <span style={S.title}>Select a protocol to preview</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div style={{ width: '320px', borderLeft: COLORS.border, padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem', overflowY: 'auto' }} className="custom-scrollbar">
                <div>
                    <label style={S.label}>Protocol Metadata</label>
                    <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <span style={{ fontSize: '11px', color: COLORS.label }}>Title</span>
                            <div style={{ fontSize: '13px', color: 'white', fontWeight: 900, marginTop: '0.4rem' }}>{activeConsent?.title}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <span style={{ fontSize: '11px', color: COLORS.label }}>Study ID</span>
                                <div style={{ fontSize: '11px', color: 'white', marginTop: '0.4rem' }}>{activeConsent?.study}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: COLORS.label }}>IRB Approval</span>
                                <div style={{ fontSize: '11px', color: 'white', marginTop: '0.4rem' }}>{activeConsent?.irbApprovalDate}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <label style={S.label}>Signatory Guard Matrix</label>
                    <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { l: 'Participant Signature', v: activeConsent?.signatureRequirements.participantSignature },
                            { l: 'CC Verification', v: activeConsent?.signatureRequirements.ccSignature },
                            { l: 'PI Final Sign-off', v: activeConsent?.signatureRequirements.piVerification },
                            { l: 'Initials on Key Sections', v: activeConsent?.signatureRequirements.initialKeySections }
                        ].map(row => (
                            <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: COLORS.text }}>{row.l}</span>
                                {row.v ? <CheckCircle2 size={16} color={COLORS.success} /> : <X size={16} color={COLORS.danger} />}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginTop: 'auto', borderTop: COLORS.border, paddingTop: '2rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <label style={S.label}>Readiness Score</label>
                            <span style={{ fontSize: '11px', fontWeight: 900, color: COLORS.success }}>85%</span>
                        </div>
                        <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: '85%', backgroundColor: COLORS.success }} />
                        </div>
                    </div>
                    <button style={{ ...S.btnIndigo, width: '100%', padding: '1rem' }} onClick={() => addToast('Draft settings updated')}><Save size={14} /> Commit Settings</button>
                    <button style={{ ...S.btnGhost, width: '100%', marginTop: '0.75rem', borderColor: COLORS.success, color: COLORS.success }} onClick={() => setConfirmModal({ message: 'Publishing will activate this protocol and notify study coordinators. Continue?', onConfirm: () => addToast('Protocol Publish Protocol Active') })}><ShieldCheck size={14} /> Publish Protocol v{activeConsent?.version}</button>
                </div>
            </div>
        </div>
    );

    const renderRecords = () => (
        <div style={{ flex: 1, padding: '3rem', backgroundColor: COLORS.bgDark, overflowY: 'auto' }} className="custom-scrollbar">
            {/* STATS STRIP */}
            <div style={{ ...S.glass, borderRadius: '16px', padding: '1.5rem', display: 'flex', marginBottom: '3rem', alignItems: 'center' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: 'white' }}>{recordStats.total}</div>
                    <div style={S.label}>Total Records</div>
                </div>
                <div style={{ width: '1px', height: '40px', backgroundColor: COLORS.border }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: COLORS.warning }}>{recordStats.pending}</div>
                    <div style={S.label}>Pending PI</div>
                </div>
                <div style={{ width: '1px', height: '40px', backgroundColor: COLORS.border }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: COLORS.success }}>{recordStats.verified}</div>
                    <div style={S.label}>Verified</div>
                </div>
                <div style={{ width: '1px', height: '40px', backgroundColor: COLORS.border }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: COLORS.danger }}>{recordStats.rejected}</div>
                    <div style={S.label}>Rejected</div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <h2 style={{ ...S.title, fontSize: '20px' }}>Transaction Registry</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['All', 'Pending', 'Verified', 'Rejected'].map(f => (
                            <button key={f} onClick={() => setRecordsFilter(f)} style={{ ...S.badge(recordsFilter === f ? COLORS.accent : COLORS.label), padding: '0.4rem 1rem', cursor: 'pointer' }}>{f}</button>
                        ))}
                    </div>
                </div>
                <div style={{ position: 'relative', width: '320px' }}>
                    <Search size={14} color={COLORS.label} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input style={{ ...S.input, width: '100%', paddingLeft: '2.5rem', borderRadius: '100px' }} placeholder="Search Participant IDs..." value={recordsSearch} onChange={e => setRecordsSearch(e.target.value)} />
                </div>
            </div>

            <div style={{ ...S.glass, borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: COLORS.border }}>
                            {['Participant ID', 'Study Assignment', 'Version', 'Signed Date', 'Status', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '1.25rem 2rem', textAlign: 'left', ...S.label }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {consentRecords.map(r => (
                            <tr key={r.id} style={{ borderBottom: COLORS.border, transition: '0.2s' }}>
                                <td style={{ padding: '1.25rem 2rem', fontWeight: 900, color: 'white', fontFamily: 'monospace', fontSize: '14px' }}>{r.participantId}</td>
                                <td style={{ padding: '1.25rem 2rem', fontSize: '13px', color: COLORS.text }}>{r.study}</td>
                                <td style={{ padding: '1.25rem 2rem' }}><span style={S.badge(COLORS.accent)}>1.0</span></td>
                                <td style={{ padding: '1.25rem 2rem', fontSize: '12px', color: COLORS.label }}>{r.participantSignedDate || '—'}</td>
                                <td style={{ padding: '1.25rem 2rem' }}>
                                    <span style={S.badge(r.status.includes('Pending') ? COLORS.warning : r.status === 'Verified' ? COLORS.success : COLORS.label)}>{r.status}</span>
                                </td>
                                <td style={{ padding: '1.25rem 2rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button style={{ ...S.btnGhost, padding: '0.4rem' }} onClick={() => addToast('Signed PDF Loaded')}><Eye size={14} /></button>
                                        {r.status === 'Pending PI Verification' && (
                                            <button style={{ ...S.btnIndigo, padding: '0.4rem 0.8rem' }} onClick={() => { setActiveRecordId(r.id); setActiveView('pi-verify'); }}><ShieldCheck size={14} /> Verify</button>
                                        )}
                                        <button style={{ ...S.btnGhost, padding: '0.4rem' }} onClick={() => { setAuditDrawerRecordId(r.id); setAuditDrawerOpen(true); }}><History size={14} /></button>
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

    const renderParticipantSign = () => (
        <div style={{ flex: 1, backgroundColor: COLORS.bgDark, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0' }} className="custom-scrollbar" ref={participantScrollRef} onScroll={(e: any) => { if (e.target.scrollHeight - e.target.scrollTop < e.target.clientHeight + 50) setHasScrolledFull(true); }}>
            <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                    {[1, 2, 3, 4, 5].map(s => (
                        <div key={s} style={{ flex: 1, height: '6px', borderRadius: '100px', backgroundColor: s < participantSignStep ? COLORS.success : s === participantSignStep ? COLORS.accent : COLORS.border, transition: '0.3s' }} />
                    ))}
                </div>

                {participantSignStep === 1 && (
                    <div style={{ ...S.glass, padding: '4rem', borderRadius: '24px' }}>
                        <h2 style={{ ...S.title, fontSize: '24px', marginBottom: '1rem' }}>Protocol Review</h2>
                        <p style={{ color: COLORS.text, fontSize: '15px', marginBottom: '3rem' }}>Please read the following {activeConsent?.title} document in its entirety before proceeding to the signature step.</p>
                        <div style={{ padding: '3rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', height: '500px', overflowY: 'auto' }} className="custom-scrollbar">
                            <PDFPage pageNumber={1} width="100%" />
                            <div style={{ height: '1000px', backgroundColor: '#f8fafc', marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '12px' }}>[ DOCUMENT CONTENT SIMULATION ]</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem' }}>
                            <button 
                                style={{ ...S.btnIndigo, padding: '1.25rem 3rem' }} 
                                disabled={!hasScrolledFull && activeConsent?.completionRules.mustScrollFull}
                                onClick={() => setParticipantSignStep(2)}
                            >
                                {hasScrolledFull ? 'I HAVE READ THE FULL PROTOCOL' : 'SCROLL TO BOTTOM TO CONTINUE'}
                            </button>
                        </div>
                    </div>
                )}

                {participantSignStep === 2 && (
                    <div style={{ ...S.glass, padding: '4rem', borderRadius: '24px' }}>
                        <h2 style={{ ...S.title, fontSize: '24px', marginBottom: '1rem' }}>Confirm Understanding</h2>
                        <p style={{ color: COLORS.text, marginBottom: '3rem' }}>Please check the following boxes to confirm your agreement with the study terms.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {[
                                { k: 'read', l: 'I have read and understood this consent form' },
                                { k: 'questions', l: 'I had the opportunity to ask questions and receive answers' },
                                { k: 'voluntary', l: 'I agree to participate voluntarily and may withdraw at any time' }
                            ].map(item => (
                                <div key={item.k} onClick={() => setParticipantAgreements({ ...participantAgreements, [item.k]: !participantAgreements[item.k as keyof typeof participantAgreements] })} style={{ padding: '1.5rem 2rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: `1px solid ${participantAgreements[item.k as keyof typeof participantAgreements] ? COLORS.accent : COLORS.border}`, display: 'flex', alignItems: 'center', gap: '1.5rem', cursor: 'pointer' }}>
                                    {participantAgreements[item.k as keyof typeof participantAgreements] ? <CheckCircle size={24} color={COLORS.accent} /> : <div style={{ width: '24px', height: '24px', borderRadius: '6px', border: `2px solid ${COLORS.label}` }} />}
                                    <span style={{ fontSize: '15px', color: 'white' }}>{item.l}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                            <button style={{ ...S.btnGhost, flex: 1 }} onClick={() => setParticipantSignStep(1)}>Back</button>
                            <button style={{ ...S.btnIndigo, flex: 2, padding: '1.25rem' }} disabled={!participantAgreements.read || !participantAgreements.questions || !participantAgreements.voluntary} onClick={() => setParticipantSignStep(activeConsent?.completionRules.mustAnswerComprehension ? 3 : 4)}>CONTINUE TO {activeConsent?.completionRules.mustAnswerComprehension ? 'QUIZ' : 'SIGNING'}</button>
                        </div>
                    </div>
                )}

                {participantSignStep === 3 && (
                    <div style={{ ...S.glass, padding: '4rem', borderRadius: '24px' }}>
                        <h2 style={{ ...S.title, fontSize: '24px', marginBottom: '1rem' }}>Comprehension Check</h2>
                        <p style={{ color: COLORS.text, marginBottom: '3rem' }}>To ensure patient safety, please answer the following questions based on the document you just read.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                            {COMPREHENSION_QUESTIONS.map(q => (
                                <div key={q.id}>
                                    <p style={{ fontSize: '15px', color: 'white', marginBottom: '1.25rem', fontWeight: 900 }}>{q.question}</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {q.options.map(opt => (
                                            <div key={opt} onClick={() => setComprehensionAnswers({ ...comprehensionAnswers, [q.id]: opt })} style={{ padding: '1rem 1.5rem', backgroundColor: comprehensionAnswers[q.id] === opt ? `${COLORS.accent}20` : 'rgba(255,255,255,0.01)', border: `1px solid ${comprehensionAnswers[q.id] === opt ? COLORS.accent : COLORS.border}`, borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>{opt}</div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '4rem' }}>
                            <button style={{ ...S.btnGhost, flex: 1 }} onClick={() => setParticipantSignStep(2)}>Back</button>
                            <button style={{ ...S.btnIndigo, flex: 2, padding: '1.25rem' }} onClick={() => { if(Object.keys(comprehensionAnswers).length === 3) setParticipantSignStep(4); else addToast('Please answer all questions', 'warning'); }}>CHECK ANSWERS & CONTINUE</button>
                        </div>
                    </div>
                )}

                {participantSignStep === 4 && (
                    <div style={{ ...S.glass, padding: '4rem', borderRadius: '24px', textAlign: 'center' }}>
                        <h2 style={{ ...S.title, fontSize: '24px', marginBottom: '1rem' }}>Electronic Authorization</h2>
                        <p style={{ color: COLORS.text, marginBottom: '4rem' }}>Applying your signature constitutes a legally binding agreement to participate in clinical research.</p>
                        <div style={{ height: '300px', backgroundColor: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px dashed ${participantSigned ? COLORS.success : '#e2e8f0'}`, cursor: 'pointer', transition: '0.3s' }} onClick={() => setParticipantSigned(true)}>
                            {participantSigned ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ fontFamily: 'cursive', fontSize: '48px', color: COLORS.accent }}>{activeRecord?.participantId || 'Signed User'}</div>
                                    <div style={S.badge(COLORS.success)}><CheckCircle size={14} /> SIGNATURE APPLIED</div>
                                </div>
                            ) : (
                                <div style={{ color: '#cbd5e1', fontSize: '20px', fontWeight: 900, textTransform: 'uppercase' }}>CLICK HERE TO SIGN</div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '4rem' }}>
                            <button style={{ ...S.btnGhost, flex: 1 }} onClick={() => setParticipantSignStep(activeConsent?.completionRules.mustAnswerComprehension ? 3 : 2)}>Back</button>
                            <button style={{ ...S.btnIndigo, flex: 2, padding: '1.25rem' }} disabled={!participantSigned} onClick={() => setParticipantSignStep(5)}>REVIEW FOR SUBMISSION</button>
                        </div>
                    </div>
                )}

                {participantSignStep === 5 && (
                    <div style={{ ...S.glass, padding: '4rem', borderRadius: '24px', textAlign: 'center' }}>
                        <ShieldCheck size={64} color={COLORS.success} style={{ marginBottom: '2rem' }} />
                        <h2 style={{ ...S.title, fontSize: '28px', marginBottom: '1rem' }}>Protocol Ready</h2>
                        <p style={{ color: COLORS.text, fontSize: '15px', marginBottom: '4rem' }}>Your signed consent v{activeConsent?.version} is ready for submission to the PI for final verification.</p>
                        <button style={{ ...S.btnIndigo, width: '100%', padding: '1.5rem', backgroundColor: COLORS.success }} onClick={() => setConfirmModal({ message: 'By submitting, you confirm your electronic signature is legally binding on this consent document.', onConfirm: () => { setActiveView('builder'); addToast('Signed Protocol Transmitted'); } })}>SUBMIT SEALED CONSENT</button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderCCReview = () => (
        <div style={{ flex: 1, display: 'flex', backgroundColor: COLORS.bgDark }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: COLORS.border }}>
                <div style={{ padding: '1.5rem 3rem', backgroundColor: COLORS.bg, borderBottom: COLORS.border, display: 'flex', justifyContent: 'space-between' }}>
                   <div style={S.title}>Staff Quality Review Mode</div>
                   <div style={S.badge(COLORS.accent)}>Record ID: {activeRecordId}</div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '4rem 0', display: 'flex', justifyContent: 'center' }} className="custom-scrollbar">
                    <PDFPage pageNumber={12} width="800px" signedFields={['Participant Signature', 'Participant Date']} />
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', backgroundColor: COLORS.bg, color: 'white', overflow: 'hidden' }}>
            {/* TOP BAR */}
            <header style={{ ...S.glass, padding: '1.25rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: COLORS.border, zIndex: 1000 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <ShieldCheck size={24} color={COLORS.success} />
                        <h1 style={{ ...S.title, fontSize: '18px' }}>Consent Management</h1>
                    </div>
                    <div style={{ ...S.label, color: COLORS.label, marginTop: '4px', fontSize: '9px' }}>
                        GOVERNANCE OVERLAY {' > '} <span style={{ color: COLORS.accent }}>{activeView.toUpperCase()} MODE</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                        <button style={S.btnGhost} onClick={() => setTemplateOpen(!templateOpen)}>
                            <FileType size={14} /> Templates <ChevronDown size={12} />
                        </button>
                        {templateOpen && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', width: '220px', backgroundColor: '#161d2b', border: COLORS.border, borderRadius: '8px', padding: '0.5rem', zIndex: 10000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                                {['Main Informed Consent', 'HIPAA Authorization', 'Screening Consent'].map(t => (
                                    <div key={t} onClick={() => applyTemplate(t)} style={{ padding: '0.75rem 1rem', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        {t}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <button style={{ ...S.btnGhost, borderColor: activeView === 'records' ? COLORS.accent : COLORS.border, background: activeView === 'records' ? `${COLORS.accent}10` : 'transparent', color: activeView === 'records' ? 'white' : COLORS.text }} onClick={() => setActiveView('records')}>
                        <ClipboardList size={14} /> Transaction Registry
                    </button>
                    <button style={{ ...S.btnGhost, borderColor: activeView === 'builder' ? COLORS.accent : COLORS.border, background: activeView === 'builder' ? `${COLORS.accent}10` : 'transparent', color: activeView === 'builder' ? 'white' : COLORS.text }} onClick={() => setActiveView('builder')}>
                        <Monitor size={14} /> Protocol Builder
                    </button>
                </div>
            </header>

            {/* MAIN AREA */}
            <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
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
