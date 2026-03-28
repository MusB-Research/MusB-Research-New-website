import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
    Activity, Beaker, Calendar, CheckCircle2, ClipboardList, 
    FileText, History, Info, MessageSquare, ShieldCheck, 
    AlertTriangle, TrendingUp, User, Globe, Download, 
    X, AlertCircle, Plus, ChevronRight, ChevronDown, 
    MoreVertical, ArrowUpRight, ShieldAlert, Monitor, ArrowDown, ArrowUp,
    Search, Layers, ListFilter, Bookmark, Send, Save, Trash2, Eye, ArrowLeft, Target
} from 'lucide-react';

// --- TYPES ---
interface AE {
    id: string;
    event: string;
    onset: string;
    severity: 'Mild' | 'Moderate' | 'Severe';
    relatedness: string;
    action: string;
    status: string;
    confirmed: boolean;
    term?: string;         // Alias for event to fix TS error
    relationship?: string; // Alias for relatedness to fix TS error
    outcome?: string;      // Alias for status to fix TS error
    date?: string;         // Alias for onset to fix TS error
}

interface Doc {
    id: string;
    name: string;
    type: string;
    date: string;
    version: number;
}

interface AuditEntry {
    timestamp: string;
    user: string;
    role: string;
    action: string;
    details: string;
}

// --- STYLES CONST ---
const COLORS = {
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

const S = {
    panel: {
        display: 'flex', flexDirection: 'column' as const, height: '100vh', width: '100%',
        backgroundColor: COLORS.bg, color: 'white', overflow: 'hidden', position: 'relative' as const
    },
    header: {
        padding: '1.5rem 3rem', backgroundColor: 'rgba(7, 10, 19, 0.8)',
        backdropFilter: 'blur(40px)', borderBottom: `1px solid ${COLORS.accent}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100
    },
    tabBar: {
        display: 'flex', gap: '0.5rem', padding: '0.75rem 3rem',
        backgroundColor: 'rgba(255,255,255,0.01)', borderBottom: `1px solid ${COLORS.border}`,
        overflowX: 'auto' as const, scrollbarWidth: 'none' as const
    },
    tab: (active: boolean) => ({
        padding: '0.6rem 1.25rem', borderRadius: '100px', fontSize: '11px', fontWeight: 900,
        textTransform: 'uppercase' as const, letterSpacing: '0.15em', cursor: 'pointer',
        transition: 'all 0.2s', backgroundColor: active ? COLORS.accent : 'transparent',
        color: active ? 'white' : COLORS.text, border: `1px solid ${active ? COLORS.accent : 'transparent'}`
    }),
    card: {
        backgroundColor: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(12px)',
        border: `1px solid ${COLORS.border}`, borderRadius: '1rem', padding: '1.5rem'
    },
    label: {
        fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' as const,
        letterSpacing: '0.15em', color: COLORS.label, marginBottom: '0.5rem', display: 'block'
    },
    name: { fontSize: '18px', fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase' as const, color: 'white' },
    body: { fontSize: '13px', color: COLORS.text, lineHeight: '1.6' },
    btnPrimary: {
        backgroundColor: COLORS.accent, color: 'white', border: 'none',
        padding: '0.8rem 1.5rem', borderRadius: '6px', fontSize: '12px', fontWeight: 900,
        textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
    },
    btnGhost: {
        backgroundColor: 'transparent', color: COLORS.text, border: `1px solid ${COLORS.border}`,
        padding: '0.8rem 1.5rem', borderRadius: '6px', fontSize: '12px', fontWeight: 900,
        textTransform: 'uppercase' as const, cursor: 'pointer'
    },
    stickyBottom: {
        position: 'fixed' as const, bottom: 0, left: '320px', right: '240px',
        padding: '1rem 3rem', backgroundColor: 'rgba(7, 10, 19, 0.9)',
        backdropFilter: 'blur(40px)', borderTop: `1px solid ${COLORS.border}`,
        display: 'flex', gap: '1rem', zIndex: 10
    },
    rightSummary: {
        width: '240px', borderLeft: `1px solid ${COLORS.border}`,
        padding: '2rem 1.5rem', backgroundColor: 'rgba(255,255,255,0.01)',
        display: 'flex', flexDirection: 'column' as const, gap: '2rem', flexShrink: 0,
        overflowY: 'auto' as const
    },
    title: { fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '1rem' },
    badge: (color: string) => ({
        padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '10px', fontWeight: 900 as const,
        backgroundColor: `${color}20`, color: color, border: `1px solid ${color}40`, textTransform: 'uppercase' as const
    })
} as Record<string, any>;

// --- MOCK DATA ---
const MOCK_PARTICIPANT = {
    id: 'BTB-023',
    study: 'Beat the Bloat Study',
    status: 'Active',
    age: 42,
    sex: 'Female',
    arm: 'Intervention',
    enrollmentDate: '2025-11-01',
    site: 'Miller Clinic — Tampa, FL',
    coordinator: 'John Doe',
    eligibility: 'Pending',
    flagged: false,
    consent: { status: 'Signed', method: 'eConsent', date: '2025-10-28', version: '2.1' },
    compliance: 85,
    visits: [
        { id: 'v1', label: 'Visit 1 — Screening', date: '2025-11-01', status: 'Completed', notes: 'All assessments completed', deviations: [] },
        { id: 'v2', label: 'Visit 2 — Baseline', date: '2025-11-15', status: 'Completed', notes: 'BP slightly elevated, noted', deviations: ['BP not rechecked'] },
        { id: 'v3', label: 'Visit 3 — Week 4', date: '2025-12-13', status: 'Pending', notes: '', deviations: [] }
    ],
    symptoms: [
        { name: 'Bloating Score', baseline: 8, week2: 6, week4: 4 },
        { name: 'Gas Frequency', baseline: 7, week2: 5, week4: 3 },
        { name: 'Indigestion', baseline: 6, week2: 5, week4: 4 }
    ],
    adverseEvents: [
        { id: 'ae1', event: 'Mild Nausea', onset: '2025-11-20', severity: 'Mild', relatedness: 'Possibly Related', action: 'Monitored', status: 'Resolved', confirmed: false } as AE
    ],
    labs: [
        { biomarker: 'Glucose', result: '95 mg/dL', range: '70–100', status: 'Normal', date: '2025-11-15' },
        { biomarker: 'CRP', result: '8.2 mg/L', range: '0–5', status: 'High', date: '2025-11-15' },
        { biomarker: 'Microbiome Diversity', result: '3.4', range: '3.0–5.0', status: 'Normal', date: '2025-11-15' }
    ],
    documents: [
        { id: 'd1', name: 'Signed_Consent_v2.1.pdf', type: 'Consent', date: '2025-10-28', version: 1 },
        { id: 'd2', name: 'Lab_Report_Visit2.pdf', type: 'Lab', date: '2025-11-15', version: 1 }
    ] as Doc[],
    notes: [
        { id: 'n1', author: 'John Doe', role: 'Coordinator', time: '2025-11-20 10:32', text: 'Participant reported increased bloating after dose 3. Advised to continue and monitor.', status: 'Open', piResponse: '' }
    ],
    medications: [
        { drug: 'Metformin', dose: '500mg', frequency: 'Twice daily', startDate: '2024-01-01', flagged: false },
        { drug: 'Probiotic supplement', dose: '1 capsule', frequency: 'Daily', startDate: '2025-09-01', flagged: true }
    ],
    inclusions: [
        { label: 'Age 18–65', met: true },
        { label: 'IBS diagnosis confirmed', met: true },
        { label: 'Symptom frequency ≥ 3x/week', met: true }
    ],
    exclusions: [
        { label: 'Antibiotic use in last 3 months', present: false },
        { label: 'Active probiotic use', present: true },
        { label: 'Inflammatory bowel disease', present: false }
    ]
};

// --- COMPONENT ---
export default function PISubjectReviewModule({ participantId = 'BTB-023' }: { participantId?: string }) {
    // State
    const [participant, setParticipant] = useState(MOCK_PARTICIPANT);
    const [activeTab, setActiveTab] = useState('Overview');
    const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
    const [toasts, setToasts] = useState<{ id: string, type: string, message: string }[]>([]);
    const [confirmModal, setConfirmModal] = useState<{ message: string, type: string, onConfirm: () => void } | null>(null);
    const [screeningNotes, setScreeningNotes] = useState('');
    const [docPreviewOpen, setDocPreviewOpen] = useState<string | null>(null);

    // Dynamic Data
    const alerts = useMemo(() => {
        const list = [];
        if (participant.compliance < 75) list.push({ id: 'a1', text: `Compliance low: ${participant.compliance}%`, color: COLORS.danger });
        if (participant.adverseEvents.some(ae => ae.severity === 'Severe')) list.push({ id: 'a2', text: 'Severe AE Reported', color: COLORS.danger });
        if (participant.exclusions.some(e => e.present)) list.push({ id: 'a3', text: 'Exclusion Criterion Present', color: COLORS.warning });
        if (participant.labs.some(l => l.status === 'High')) list.push({ id: 'a4', text: 'Abnormal Lab Results', color: COLORS.danger });
        return list;
    }, [participant]);

    // Helpers
    const addToast = useCallback((message: string, type: string = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev.slice(-2), { id, message, type }]); // Max 3
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    const logAction = useCallback((action: string, details: string) => {
        const entry: AuditEntry = {
            timestamp: new Date().toLocaleString(),
            user: 'PI (You)', role: 'PI', action, details
        };
        setAuditLog(prev => [entry, ...prev]);
    }, []);

    const handleAction = (label: string, executor: () => void, modalConfig?: { message: string, type: string }) => {
        if (modalConfig) {
            setConfirmModal({
                message: modalConfig.message,
                type: modalConfig.type,
                onConfirm: () => {
                    executor();
                    setConfirmModal(null);
                }
            });
        } else {
            executor();
        }
    };

    // --- RENDERERS ---

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {alerts.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {alerts.map(a => (
                        <div key={a.id} style={{ padding: '0.6rem 1rem', borderRadius: '4px', backgroundColor: `${a.color}15`, border: `1px solid ${a.color}30`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <AlertCircle size={14} color={a.color} />
                            <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: a.color }}>{a.text}</span>
                            <X size={12} color={a.color} style={{ cursor: 'pointer' }} />
                        </div>
                    ))}
                </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                {[
                    { l: 'Participant Age', v: participant.age },
                    { l: 'Biological Sex', v: participant.sex },
                    { l: 'Assigned Study Arm', v: participant.arm },
                    { l: 'Enrollment Date', v: participant.enrollmentDate },
                    { l: 'Study Node', v: participant.site },
                    { l: 'Assigned Coordinator', v: participant.coordinator }
                ].map((item, i) => (
                    <div key={i} style={S.card}>
                        <label style={S.label}>{item.l}</label>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{item.v}</div>
                    </div>
                ))}
            </div>
            <div style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${COLORS.accent}30` }}>
                <div>
                    <label style={S.label}>Enrollment Readiness</label>
                    <div style={{ fontSize: '24px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>{participant.eligibility} Verification</div>
                </div>
                <button style={S.btnPrimary} onClick={() => {
                    setParticipant(p => ({ ...p, eligibility: 'Approved' }));
                    addToast('Participant Eligibility Approved');
                    logAction('Eligibility Approved', 'PI manually verified and approved participant entry.');
                }}>Approve Eligibility</button>
            </div>
        </div>
    );

    const renderEligibility = () => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={S.card}>
                <label style={S.label}>Inclusion Criteria Registry</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                    {participant.inclusions.map((inc, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                            {inc.met ? <CheckCircle2 size={16} color={COLORS.success} /> : <X size={16} color={COLORS.danger} />}
                            <span style={{ fontSize: '14px', color: inc.met ? 'white' : COLORS.text }}>{inc.label}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div style={S.card}>
                <label style={S.label}>Exclusion Criteria Registry</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                    {participant.exclusions.map((exc, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: exc.present ? `${COLORS.danger}10` : 'rgba(255,255,255,0.02)', borderRadius: '8px', border: exc.present ? `1px solid ${COLORS.danger}30` : 'none' }}>
                            {exc.present ? <AlertTriangle size={16} color={COLORS.danger} /> : <CheckCircle2 size={16} color={COLORS.success} />}
                            <span style={{ fontSize: '14px', color: exc.present ? COLORS.danger : 'white' }}>{exc.label}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div style={{ gridColumn: '1 / -1', ...S.card }}>
                <label style={S.label}>Screening Methodology Notes</label>
                <textarea 
                    style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: 'white', padding: '1.5rem', fontSize: '14px', outline: 'none', minHeight: '120px' }}
                    placeholder="Enter proprietary clinical observations..."
                    value={screeningNotes}
                    onBlur={() => logAction('Note Saved', 'PI updated screening methodology notes.')}
                    onChange={e => setScreeningNotes(e.target.value)}
                />
            </div>
        </div>
    );

    const renderOutcomes = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Trend Graph - Raw SVG */}
            <div style={{ ...S.card, height: '300px', display: 'flex', flexDirection: 'column' }}>
                <label style={S.label}>Aggregate Symptom Velocity</label>
                <svg width="100%" height="100%" viewBox="0 0 1000 200" preserveAspectRatio="none">
                    {/* Gridlines */}
                    {[0, 50, 100, 150].map(y => <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />)}
                    {/* Baseline Line */}
                    <path d="M 0 160 L 500 160 L 1000 160" fill="none" stroke="rgba(255,255,255,0.1)" strokeLinecap="round" strokeDasharray="5,5" />
                    {/* Actual Trend Line */}
                    <path 
                        d="M 50 160 L 500 120 L 950 80" 
                        fill="none" stroke={COLORS.accent} strokeWidth="3" strokeLinejoin="round" />
                    {/* Data Points */}
                    <circle cx="50" cy="160" r="6" fill={COLORS.accent} />
                    <circle cx="500" cy="120" r="6" fill={COLORS.accent} />
                    <circle cx="950" cy="80" r="6" fill={COLORS.accent} />
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', color: COLORS.label, fontSize: '10px', fontWeight: 900 }}>
                    <span>BASELINE</span>
                    <span>WEEK 2</span>
                    <span>WEEK 4</span>
                </div>
            </div>

            <div style={S.card}>
                <label style={S.label}>Individual Symptom Matrics</label>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${COLORS.border}`, textAlign: 'left' }}>
                            {['Metric', 'Baseline', 'Week 2', 'Week 4', 'Improvement', 'Trend'].map(h => (
                                <th key={h} style={{ padding: '1rem', ...S.label }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {participant.symptoms.map((s, i) => {
                            const improvement = ((s.baseline - s.week4) / s.baseline * 100).toFixed(0);
                            return (
                                <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{s.name}</td>
                                    <td style={{ padding: '1rem' }}>{s.baseline}</td>
                                    <td style={{ padding: '1rem' }}>{s.week2}</td>
                                    <td style={{ padding: '1rem' }}>{s.week4}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ color: COLORS.success, fontWeight: 900 }}>-{improvement}%</span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <svg width="60" height="20">
                                            <path 
                                                d={`M 0 20 L 30 ${20 - (s.baseline - s.week2)*2} L 60 ${20 - (s.baseline - s.week4)*2}`} 
                                                fill="none" stroke={COLORS.success} strokeWidth="2" />
                                        </svg>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderAuditTrail = () => (
        <div style={S.card}>
            <label style={S.label}>Node Transaction Log</label>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: `1px solid ${COLORS.border}`, textAlign: 'left' }}>
                        {['Timestamp', 'Entity', 'Operation', 'Trace Details'].map(h => (
                            <th key={h} style={{ padding: '1rem', ...S.label }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {auditLog.map((e, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}`, fontSize: '12px' }}>
                            <td style={{ padding: '1rem', color: COLORS.label }}>{e.timestamp}</td>
                            <td style={{ padding: '1rem', fontWeight: 900, color: COLORS.accent }}>{e.user} [{e.role}]</td>
                            <td style={{ padding: '1rem', color: 'white' }}>{e.action}</td>
                            <td style={{ padding: '1rem', color: COLORS.text }}>{e.details}</td>
                        </tr>
                    ))}
                    {auditLog.length === 0 && (
                        <tr>
                            <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: COLORS.label, fontStyle: 'italic' }}>No audit transactions recorded for this session.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div style={S.panel}>
            {/* STICKY TOP HEADER */}
            <header style={S.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('nav-to-participants'))}
                        style={{ ...S.btnGhost, padding: '0.6rem', borderRadius: '12px' }}
                        title="Back to Participant Oversight"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div style={{ ...S.name, fontSize: '24px' }}>{participantId} <span style={{ color: COLORS.text, fontWeight: 'normal', fontSize: '16px' }}>| {participant.study}</span></div>
                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.6rem', alignItems: 'center' }}>
                             <span style={{ fontSize: '11px', fontWeight: 900, color: COLORS.success, backgroundColor: `${COLORS.success}15`, padding: '0.25rem 0.6rem', borderRadius: '4px', border: `1px solid ${COLORS.success}30` }}>
                                 {participant.status.toUpperCase()} SUBJECT
                             </span>
                             <span style={{ fontSize: '11px', color: COLORS.info, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                 <Target size={12} /> {participant.arm} Arm
                             </span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1.25rem' }}>
                    <button style={S.btnGhost} onClick={() => {
                        setParticipant(p => ({ ...p, flagged: !p.flagged }));
                        addToast(participant.flagged ? 'Protocol Flag Cleared' : 'Subject Flagged for Review', 'warning');
                        logAction('Flag Toggled', participant.flagged ? 'PI cleared the protocol flag.' : 'PI flagged subject for secondary review.');
                    }}>
                        <Bookmark size={16} fill={participant.flagged ? COLORS.warning : 'none'} color={participant.flagged ? COLORS.warning : COLORS.text} style={{ marginRight: '8px' }} /> 
                        {participant.flagged ? 'FLAGGED' : 'FLAG'}
                    </button>
                    <button style={{ ...S.btnPrimary, backgroundColor: COLORS.success }} onClick={() => handleAction('Approve', () => {
                        setParticipant(p => ({ ...p, eligibility: 'Approved' }));
                        addToast('Subject Status Validated');
                        logAction('Subject Validated', 'PI finalized clinical review and approved participant.');
                    })}>Approve</button>
                    <button style={{ ...S.btnPrimary, backgroundColor: COLORS.danger }} onClick={() => handleAction('Withdraw', () => {
                        setParticipant(p => ({ ...p, status: 'Withdrawn' }));
                        addToast('Subject Withdrawn', 'error');
                        logAction('Subject Withdrawn', 'Critical Action: PI terminated subject participation.');
                    }, { message: "Terminate participation for BTB-023 immediately?", type: 'danger' })}>Withdraw</button>
                </div>
            </header>

            {/* TAB BAR */}
            <div style={S.tabBar}>
                {['Overview', 'Eligibility', 'Medical History', 'Consent', 'Visits', 'Outcomes', 'Safety', 'Labs', 'Documents', 'Notes', 'Audit Trail'].map(tab => {
                    const hasAlert = (tab === 'Safety' && participant.adverseEvents.length > 0) || (tab === 'Labs' && alerts.length > 0);
                    return (
                        <div key={tab} style={{ position: 'relative' }}>
                            <button onClick={() => setActiveTab(tab)} style={S.tab(activeTab === tab)}>{tab}</button>
                            {hasAlert && <div style={{ position: 'absolute', top: -4, right: -4, width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS.danger, border: `2px solid ${COLORS.bg}` }} />}
                        </div>
                    );
                })}
            </div>

            {/* MAIN CONTENT AREA */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <main style={{ flex: 1, overflowY: 'auto', padding: '3rem', paddingBottom: '8rem' }}>
                    {activeTab === 'Overview' && renderOverview()}
                    {activeTab === 'Eligibility' && renderEligibility()}
                    {activeTab === 'Outcomes' && renderOutcomes()}
                    {activeTab === 'Audit Trail' && renderAuditTrail()}
                    
                    {/* Placeholder for other tabs to keep layout dense */}
                    {activeTab === 'Safety' && (
                        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                            <div>
                                <h3 style={S.title}>Adverse Event Registry</h3>
                                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {participant.adverseEvents.map((ae, i) => (
                                        <div key={i} style={S.card}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                <span style={{ fontSize: '15px', fontWeight: 900, color: COLORS.danger }}>{ae.event.toUpperCase()}</span>
                                                <span style={S.badge(COLORS.danger)}>SERIOUS AE (SAE)</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
                                                <div>
                                                    <label style={S.label}>Severity</label>
                                                    <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{ae.severity}</p>
                                                </div>
                                                <div>
                                                    <label style={S.label}>Relatedness</label>
                                                    <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{ae.relatedness}</p>
                                                </div>
                                                <div>
                                                    <label style={S.label}>Status</label>
                                                    <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{ae.status}</p>
                                                </div>
                                                <div>
                                                    <label style={S.label}>Onset Date</label>
                                                    <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{ae.onset}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {participant.adverseEvents.length === 0 && (
                                        <div style={{ ...S.card, textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                                            <ShieldAlert size={48} style={{ marginBottom: '1rem' }} />
                                            <p style={S.title}>No Safety Signals Detected</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Labs' && (
                        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                            <div>
                                <h3 style={S.title}>Longitudinal Clinical Parameters</h3>
                                <div style={{ marginTop: '2rem', ...S.card, padding: 0, overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${COLORS.border}` }}>
                                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', ...S.label }}>Parameter</th>
                                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', ...S.label }}>Screening</th>
                                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', ...S.label }}>Visit 1</th>
                                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', ...S.label }}>Visit 2</th>
                                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', ...S.label }}>Reference</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {[
                                                { p: 'Hemoglobin (g/dL)', v1: '14.2', v2: '13.8', v3: '14.0', ref: '12.0 - 16.0' },
                                                { p: 'Glucose (mg/dL)', v1: '92', v2: '105', v3: '98', ref: '70 - 110', alert: true },
                                                { p: 'AST (U/L)', v1: '22', v2: '25', v3: '24', ref: '10 - 40' },
                                                { p: 'ALT (U/L)', v1: '28', v2: '30', v3: '29', ref: '7 - 56' }
                                            ].map((r, i) => (
                                                <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                                    <td style={{ padding: '1.25rem 2rem', fontSize: '13px', fontWeight: 'bold' }}>{r.p}</td>
                                                    <td style={{ padding: '1.25rem 2rem', fontSize: '13px' }}>{r.v1}</td>
                                                    <td style={{ padding: '1.25rem 2rem', fontSize: '13px', color: r.alert ? COLORS.warning : 'white' }}>{r.v2}</td>
                                                    <td style={{ padding: '1.25rem 2rem', fontSize: '13px' }}>{r.v3}</td>
                                                    <td style={{ padding: '1.25rem 2rem', fontSize: '11px', color: COLORS.label }}>{r.ref}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Documents' && (
                        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                            <div>
                                <h3 style={S.title}>Participant Document Repository</h3>
                                <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                    {[
                                        { n: 'Signed Informed Consent', d: '2026-04-01', v: '1.0', t: 'PDF' },
                                        { n: 'Medical History Report', d: '2026-03-28', v: '2.1', t: 'PDF' },
                                        { n: 'Lab Results - Visit 2', d: '2026-04-10', v: '1.0', t: 'XLSX' },
                                        { n: 'ECG Recording', d: '2026-04-10', v: '1.0', t: 'EDF' }
                                    ].map((doc, i) => (
                                        <div key={i} style={S.card} className="group">
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <FileText size={20} color={COLORS.accent} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>{doc.n}</div>
                                                    <div style={{ fontSize: '11px', color: COLORS.label }}>v{doc.v} • {doc.d}</div>
                                                </div>
                                                <button style={{ ...S.btnGhost, padding: '0.5rem', opacity: 0.5 }} className="group-hover:opacity-100 transition-opacity">
                                                    <ArrowUpRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {!['Overview', 'Eligibility', 'Outcomes', 'Audit Trail', 'Safety', 'Labs', 'Documents'].includes(activeTab) && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: COLORS.label }}>
                            <ClipboardList size={64} style={{ opacity: 0.1, marginBottom: '2rem' }} />
                            <div style={{ fontSize: '20px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>{activeTab} Feed Active</div>
                            <div style={{ fontSize: '12px', marginTop: '1rem' }}>Streaming clinical parameters for {participant.id}...</div>
                        </div>
                    )}
                </main>

                {/* RIGHT SUMMARY PANEL */}
                <aside style={S.rightSummary}>
                    <div>
                        <label style={S.label}>Clinical Triage</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ color: COLORS.label }}>Eligibility</span>
                                <span style={{ color: participant.eligibility === 'Approved' ? COLORS.success : COLORS.warning, fontWeight: 'bold' }}>{participant.eligibility}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ color: COLORS.label }}>Consent</span>
                                <span style={{ color: COLORS.success, fontWeight: 'bold' }}>{participant.consent.status}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ color: COLORS.label }}>Compliance</span>
                                <span style={{ color: COLORS.accent, fontWeight: 'bold' }}>{participant.compliance}%</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: '2rem' }}>
                        <label style={S.label}>Compliance Vector</label>
                        <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginTop: '1rem', overflow: 'hidden' }}>
                            <div style={{ width: `${participant.compliance}%`, height: '100%', backgroundColor: COLORS.accent, boxShadow: `0 0 10px ${COLORS.accent}40` }} />
                        </div>
                        <p style={{ fontSize: '11px', color: COLORS.label, marginTop: '0.8rem', fontStyle: 'italic' }}>Visit completion velocity stable.</p>
                    </div>

                    <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: '2rem' }}>
                        <label style={S.label}>Safety Status</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '1rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: participant.adverseEvents.length > 0 ? COLORS.danger : COLORS.success }} />
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: participant.adverseEvents.length > 0 ? COLORS.danger : COLORS.success }}>
                                {participant.adverseEvents.length > 0 ? `${participant.adverseEvents.length} AE Reported` : 'No Issues'}
                            </span>
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button style={{ ...S.btnGhost, textAlign: 'left', fontSize: '10px' }} onClick={() => setActiveTab('Overview')}>&gt; Overview</button>
                        <button style={{ ...S.btnGhost, textAlign: 'left', fontSize: '10px' }} onClick={() => setActiveTab('Eligibility')}>&gt; Eligibility</button>
                        <button style={{ ...S.btnGhost, textAlign: 'left', fontSize: '10px' }} onClick={() => setActiveTab('Safety')}>&gt; Safety</button>
                    </div>
                </aside>
            </div>

            {/* STICKY BOTTOM ACTION BAR */}
            <footer style={S.stickyBottom}>
                <button style={S.btnPrimary} onClick={() => { addToast('Notes synchronized'); logAction('Data Save', 'PI globally saved all session notes.'); }}>Save Session Notes</button>
                <button style={S.btnGhost} onClick={() => logAction('Deviation Observed', 'PI marked a protocol deviation in the clinical log.')}>Mark Protocol Deviation</button>
                <div style={{ flex: 1 }} />
                <div style={{ fontSize: '11px', color: COLORS.label, fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
                    Clinical Node: Miller Clinic Alpha • Status: Synchronized
                </div>
            </footer>

            {/* TOAST SYSTEM */}
            <div style={{ position: 'fixed', bottom: '6rem', right: '2rem', zIndex: 1000, display: 'flex', flexDirection: 'column-reverse', gap: '0.75rem' }}>
                {toasts.map(t => (
                    <div key={t.id} style={{ 
                        padding: '1rem 2rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '1rem',
                        backgroundColor: t.type === 'success' ? COLORS.success : t.type === 'error' ? COLORS.danger : COLORS.warning,
                        color: 'white', fontWeight: 900, textTransform: 'uppercase', fontSize: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        animation: 'slideIn 0.3s forwards'
                    }}>
                        <Info size={16} /> {t.message}
                    </div>
                ))}
            </div>

            {/* CONFIRM MODAL */}
            {confirmModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)' }} onClick={() => setConfirmModal(null)} />
                    <div style={{ ...S.card, width: '400px', padding: '3rem', position: 'relative', textAlign: 'center' }}>
                        <ShieldAlert size={48} color={confirmModal.type === 'danger' ? COLORS.danger : COLORS.accent} style={{ marginBottom: '1.5rem' }} />
                        <p style={{ fontSize: '16px', fontWeight: 'bold', lineHeight: 1.6, marginBottom: '2.5rem' }}>{confirmModal.message}</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button style={{ ...S.btnGhost, flex: 1 }} onClick={() => setConfirmModal(null)}>ABORT</button>
                            <button style={{ ...S.btnPrimary, flex: 1, backgroundColor: confirmModal.type === 'danger' ? COLORS.danger : COLORS.accent }} onClick={confirmModal.onConfirm}>CONFIRM</button>
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 2px; }
            `}</style>
        </div>
    );
}

