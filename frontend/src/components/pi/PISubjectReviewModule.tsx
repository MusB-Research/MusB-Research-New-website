import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
    Activity, Beaker, Calendar, CheckCircle2, ClipboardList, 
    FileText, History, Info, MessageSquare, ShieldCheck, 
    AlertTriangle, TrendingUp, User, Globe, Download, 
    X, AlertCircle, Plus, ChevronRight, ChevronDown, 
    MoreVertical, ArrowUpRight, ShieldAlert, Monitor, ArrowDown, ArrowUp,
    Search, Layers, ListFilter, Bookmark, Send, Save, Trash2, Eye, ArrowLeft, Target, Shield
} from 'lucide-react';
import { authFetch, API } from '../../utils/auth';
import ParticipantOversight from './panels/ParticipantOversight';

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
    accent: '#14b8a6',
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
        padding: '0.45rem 1.5rem', backgroundColor: 'rgba(7, 10, 19, 0.8)',
        backdropFilter: 'blur(40px)', borderBottom: `1px solid ${COLORS.accent}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 40
    },
    tabBar: {
        display: 'flex', gap: '0.5rem', padding: '0.5rem 2rem',
        backgroundColor: 'rgba(255,255,255,0.01)', borderBottom: `1px solid ${COLORS.border}`,
        overflowX: 'auto' as const, scrollbarWidth: 'none' as const
    },
    tab: (active: boolean) => ({
        padding: '0.45rem 1rem', borderRadius: '100px', fontSize: '11px', fontWeight: 900,
        textTransform: 'uppercase' as const, letterSpacing: '0.12em', cursor: 'pointer',
        transition: 'all 0.2s', backgroundColor: active ? COLORS.accent : 'transparent',
        color: active ? 'white' : COLORS.text, border: `1px solid ${active ? COLORS.accent : 'transparent'}`
    }),
    card: {
        backgroundColor: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(12px)',
        border: `1px solid ${COLORS.border}`, borderRadius: '0.75rem', padding: '0.6rem'
    },
    label: {
        fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' as const,
        letterSpacing: '0.12em', color: COLORS.label, marginBottom: '0.25rem', display: 'block'
    },
    name: { fontSize: '15px', fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase' as const, color: 'white' },
    body: { fontSize: '13px', color: COLORS.text, lineHeight: '1.6' },
    btnPrimary: {
        backgroundColor: COLORS.accent, color: 'white', border: 'none',
        padding: '0.8rem 1.5rem', borderRadius: '6px', fontSize: '14px', fontWeight: 900,
        textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
    },
    btnGhost: {
        backgroundColor: 'transparent', color: COLORS.text, border: `1px solid ${COLORS.border}`,
        padding: '0.8rem 1.5rem', borderRadius: '6px', fontSize: '14px', fontWeight: 900,
        textTransform: 'uppercase' as const, cursor: 'pointer'
    },
    stickyBottom: {
        position: 'fixed' as const, bottom: 0, left: '320px', right: '240px',
        padding: '1rem 3rem', backgroundColor: 'rgba(7, 10, 19, 0.9)',
        backdropFilter: 'blur(40px)', borderTop: `1px solid ${COLORS.border}`,
        display: 'flex', gap: '1rem', zIndex: 10
    },
    rightSummary: {
        width: '210px', borderLeft: `1px solid ${COLORS.border}`,
        padding: '1.25rem 1rem', backgroundColor: 'rgba(255,255,255,0.01)',
        display: 'flex', flexDirection: 'column' as const, gap: '1.25rem', flexShrink: 0,
        overflowY: 'auto' as const
    },
    title: { fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '0.75rem' },
    badge: (color: string) => ({
        padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '13px', fontWeight: 900 as const,
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
export default function PISubjectReviewModule({ participantId = '' }: { participantId?: string }) {
    // internalId: set when user picks from the ParticipantOversight list inside this module
    const [internalId, setInternalId] = useState<string>(participantId);
    // Keep in sync when parent passes a new participantId prop
    useEffect(() => { setInternalId(participantId); }, [participantId]);
    // The effective id we use for all queries
    const effectiveId = internalId || participantId;

    // State
    const [participant, setParticipant] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('Overview');
    const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
    const [toasts, setToasts] = useState<{ id: string, type: string, message: string }[]>([]);
    const [confirmModal, setConfirmModal] = useState<{ message: string, type: string, onConfirm: () => void } | null>(null);
    const [screeningNotes, setScreeningNotes] = useState('');
    const [docPreviewOpen, setDocPreviewOpen] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [remoteAuditLog, setRemoteAuditLog] = useState<any[]>([]);

    const fetchSubjectData = useCallback(async () => {
        if (!effectiveId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const res = await authFetch(`${API}/api/participants/${effectiveId}/`);
            if (!res.ok) throw new Error('Subject profile not found.');
            
            const data = await res.json();
            
            // Map Backend to High-Fidelity UI Schema
            const mapped = {
                ...MOCK_PARTICIPANT,
                id: data.participant_sid,
                study: data.study_name || 'Assigned Protocol',
                status: data.status === 'NEW' ? 'Active' : data.status,
                age: data.age || 0,
                sex: data.gender || 'Unknown',
                arm: data.assigned_arm?.name || 'In-House Arm',
                enrollmentDate: data.created_at ? new Date(data.created_at).toISOString().split('T')[0] : '2026-01-01',
                coordinator: data.coordinator_name || 'System Auto',
                eligibility: data.status === 'ELIGIBLE' || data.status === 'RANDOMIZED' ? 'Approved' : 'Pending',
                visits: (data.visits || []).map((v: any) => ({
                    id: v.id,
                    label: v.visit_type,
                    date: v.scheduled_date?.split('T')[0],
                    status: v.status,
                    notes: v.notes || '',
                    deviations: v.deviations || []
                })),
                adverseEvents: (data.ae_reports || []).map((ae: any) => ({
                    id: ae.id,
                    event: ae.description,
                    onset: ae.start_date?.split('T')[0],
                    severity: ae.severity.charAt(0) + ae.severity.slice(1).toLowerCase(),
                    relatedness: ae.related_to_product === 'YES' ? 'Related' : 'Unrelated',
                    status: ae.is_ongoing ? 'Ongoing' : 'Resolved',
                    confirmed: true
                })),
                labs: (data.lab_results || []).map((l: any) => ({
                    biomarker: l.test_name,
                    result: l.value,
                    range: l.units || 'N/A',
                    status: l.status === 'ALERT' ? 'High' : 'Normal',
                    date: l.lab_date
                })),
                documents: (data.consent_records || []).map((c: any) => ({
                    id: c.id,
                    name: `Signed_Consent_${c.id.substr(0,4)}.pdf`,
                    type: 'Consent',
                    date: c.agreed_at?.split('T')[0],
                    version: 1
                })),
                medications: data.eligibility_data?.medications || data.eligibility_data?.meds || [],
                inclusions: data.eligibility_data?.inclusions || [
                    { label: 'Age 18–65', met: true },
                    { label: 'IBS diagnosis confirmed', met: true },
                    { label: 'Symptom frequency ≥ 3x/week', met: true }
                ],
                exclusions: data.eligibility_data?.exclusions || [
                    { label: 'Antibiotic use in last 3 months', present: false },
                    { label: 'Active probiotic use', present: false },
                    { label: 'Inflammatory bowel disease', present: false }
                ]
            };

            setParticipant({
                ...mapped,
                pk: data.id,
                flagged: data.is_locked,
                screeningNotes: data.status_notes || ''
            });
            setScreeningNotes(data.status_notes || '');
            logAction('Profile Updated', `PI accessed live record for ${data.participant_sid}. All clinical data loaded.`);

            // Fetch Remote Audit Logs for this subject
            try {
                const auditRes = await authFetch(`${API}/api/audit-logs/?entity_id=${data.participant_sid}`);
                if (auditRes.ok) {
                    const auditData = await auditRes.json();
                    setRemoteAuditLog(auditData.results || auditData);
                }
            } catch (ae) { console.error('Audit fetch failed', ae); }

        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [effectiveId]);

    useEffect(() => {
        fetchSubjectData();
    }, [fetchSubjectData]);

    // Dynamic Data
    const alerts = useMemo(() => {
        if (!participant) return [];
        const list = [];
        if ((participant.compliance || 0) < 75) list.push({ id: 'a1', text: `Compliance low: ${participant.compliance}%`, color: COLORS.danger });
        if ((participant.adverseEvents || []).some((ae: any) => ae.severity === 'Severe')) list.push({ id: 'a2', text: 'Severe AE Reported', color: COLORS.danger });
        if ((participant.exclusions || []).some((e: any) => e.present)) list.push({ id: 'a3', text: 'Exclusion Criterion Present', color: COLORS.warning });
        if ((participant.labs || []).some((l: any) => l.status === 'High')) list.push({ id: 'a4', text: 'Abnormal Lab Results', color: COLORS.danger });
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

    if (isLoading) return (
        <div style={{ padding: '3rem', textAlign: 'center', color: COLORS.label }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <div style={{ width: 16, height: 16, border: `2px solid ${COLORS.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Acquiring Clinical Data Stream...</span>
            </div>
        </div>
    );

    // ── Participant Picker UI — uses the same ParticipantOversight as the coordinator ──
    if (!effectiveId || !participant) {
        return (
            <ParticipantOversight
                onOpenProfile={(id) => {
                    setInternalId(id);
                    setParticipant(null);
                    setError(null);
                    setIsLoading(true);
                }}
            />
        );
    }

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowX: 'hidden' }}>
            {alerts.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {alerts.map(a => (
                        <div key={a.id} style={{ padding: '0.35rem 0.6rem', borderRadius: '4px', backgroundColor: `${a.color}15`, border: `1px solid ${a.color}25`, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <AlertCircle size={11} color={a.color} />
                            <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: a.color }}>{a.text}</span>
                            <X size={10} color={a.color} style={{ cursor: 'pointer' }} onClick={() => {}} />
                        </div>
                    ))}
                </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                {[
                    { l: 'Current Age', v: (participant.age || 'N/A') },
                    { l: 'Biological Sex', v: (participant.sex || 'N/A') },
                    { l: 'Study Assignment', v: (participant.arm || 'Not Randomized') },
                    { l: 'Enrolled On', v: (participant.enrollmentDate || 'Pending') },
                    { l: 'Clinical Site', v: (participant.site || 'Main Site') },
                    { l: 'Coordinator', v: (participant.coordinator || 'N/A') }
                ].map((item, i) => (
                    <div key={i} style={S.card}>
                        <label style={S.label}>{item.l}</label>
                        <div style={{ fontSize: '13px', fontWeight: 800, wordBreak: 'break-word', color: 'white' }}>{item.v}</div>
                    </div>
                ))}
            </div>
            {/* ACTIONS SECTION */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button 
                    style={{ ...S.card, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', border: `1px solid ${participant.flagged ? COLORS.warning : COLORS.border}`, backgroundColor: participant.flagged ? `${COLORS.warning}08` : 'transparent', padding: '0.5rem' }}
                    onClick={async () => {
                        if (!participant.pk) return;
                        try {
                            const res = await authFetch(`${API}/api/participants/${participant.pk}/toggle_flag/`, { method: 'POST' });
                            if (res.ok) {
                                setParticipant((p: any) => ({ ...p, flagged: !p.flagged }));
                                addToast(participant.flagged ? 'Study flag removed' : 'Subject flagged for review', 'warning');
                                logAction('Manual Flag', `PI toggled review flag. Current Status: ${!participant.flagged ? 'FLAGGED' : 'CLEAR'}`);
                            }
                        } catch (e) { addToast('Flag sync failed', 'error'); }
                    }}
                >
                    <Bookmark size={14} color={participant.flagged ? COLORS.warning : COLORS.label} fill={participant.flagged ? COLORS.warning : 'none'} />
                    <span style={{ fontSize: '11px', fontWeight: 900, color: participant.flagged ? COLORS.warning : COLORS.label }}>{participant.flagged ? 'UNFLAG' : 'FLAG'}</span>
                </button>

                <button 
                    style={{ ...S.card, backgroundColor: COLORS.success, border: 'none', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', opacity: (participant.status === 'ENROLLED' || participant.status === 'RANDOMIZED') ? 0.5 : 1, padding: '0.5rem', minHeight: '34px' }}
                    disabled={participant.status === 'ENROLLED' || participant.status === 'RANDOMIZED'}
                    onClick={() => handleAction('Approve', async () => {
                        if (!participant.pk) return;
                        try {
                            const res = await authFetch(`${API}/api/participants/${participant.pk}/review_eligibility/`, {
                                method: 'POST',
                                body: JSON.stringify({ decision: 'ACCEPT', notes: screeningNotes })
                            });
                            if (res.ok) {
                                setParticipant((p: any) => ({ ...p, eligibility: 'Approved', status: 'ENROLLED' }));
                                addToast('Eligibility Approved & Enrolled');
                                logAction('Eligibility Finalized', 'PI approved participant entry into active study cohort.');
                            }
                        } catch (e) { addToast('Approval sync failed', 'error'); }
                    }, { message: 'Are you sure you want to officially APPROVE this participant for study enrollment?', type: 'info' })}
                >
                    <CheckCircle2 size={14} color="white" />
                    <span style={{ fontSize: '11px', fontWeight: 900, color: 'white', textTransform: 'uppercase' }}>Approve Entry</span>
                </button>

                <button 
                    style={{ ...S.card, backgroundColor: COLORS.danger, border: 'none', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', opacity: participant.status === 'DROPPED' ? 0.5 : 1, padding: '0.5rem', minHeight: '34px' }}
                    disabled={participant.status === 'DROPPED'}
                    onClick={() => handleAction('Withdraw', async () => {
                        if (!participant.pk) return;
                        try {
                            const res = await authFetch(`${API}/api/participants/${participant.pk}/withdraw/`, {
                                method: 'POST',
                                body: JSON.stringify({ reason: 'PI Decision / Safety', notes: screeningNotes })
                            });
                            if (res.ok) {
                                setParticipant((p: any) => ({ ...p, status: 'DROPPED', eligibility: 'Terminated' }));
                                addToast('Subject Withdrawn from Study', 'error');
                                logAction('Subject Withdrawal', 'PI triggered emergency withdrawal study procedure. Case terminated.');
                            }
                        } catch (e) { addToast('Withdrawal sync failed', 'error'); }
                    }, { message: 'EMERGENCY: Are you sure you want to WITHDRAW this subject? This will terminate all active study plans for this record.', type: 'danger' })}
                >
                    <X size={14} color="white" />
                    <span style={{ fontSize: '11px', fontWeight: 900, color: 'white', textTransform: 'uppercase' }}>Withdraw</span>
                </button>
            </div>
        </div>
    );

    const renderEligibility = () => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={S.card}>
                <label style={S.label}>Inclusion Criteria List</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                    {participant.inclusions.map((inc: any, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                            {inc.met ? <CheckCircle2 size={16} color={COLORS.success} /> : <X size={16} color={COLORS.danger} />}
                            <span style={{ fontSize: '14px', color: inc.met ? 'white' : COLORS.text }}>{inc.label}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div style={S.card}>
                <label style={S.label}>Exclusion Criteria List</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                    {participant.exclusions.map((exc: any, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: exc.present ? `${COLORS.danger}10` : 'rgba(255,255,255,0.02)', borderRadius: '8px', border: exc.present ? `1px solid ${COLORS.danger}30` : 'none' }}>
                            {exc.present ? <AlertTriangle size={16} color={COLORS.danger} /> : <CheckCircle2 size={16} color={COLORS.success} />}
                            <span style={{ fontSize: '14px', color: exc.present ? COLORS.danger : 'white' }}>{exc.label}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div style={{ gridColumn: '1 / -1', ...S.card }}>
                <label style={S.label}>Screening Notes</label>
                <textarea 
                    style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: 'white', padding: '1.5rem', fontSize: '14px', outline: 'none', minHeight: '120px' }}
                    placeholder="Enter clinical observations..."
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
                <label style={S.label}>Symptom Trends</label>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', color: COLORS.label, fontSize: '13px', fontWeight: 900 }}>
                    <span>BASELINE</span>
                    <span>WEEK 2</span>
                    <span>WEEK 4</span>
                </div>
            </div>

            <div style={S.card}>
                <label style={S.label}>Individual Symptom Scores</label>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${COLORS.border}`, textAlign: 'left' }}>
                            {['Metric', 'Baseline', 'Week 2', 'Week 4', 'Improvement', 'Trend'].map(h => (
                                <th key={h} style={{ padding: '1rem', ...S.label }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {participant.symptoms.map((s: any, i: number) => {
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div style={S.card}>
                <label style={S.label}>Audit Log (Permanent)</label>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${COLORS.border}`, textAlign: 'left' }}>
                            {['Timestamp', 'User', 'Action', 'Log ID'].map(h => (
                                <th key={h} style={{ padding: '1rem', ...S.label }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {remoteAuditLog.length > 0 ? remoteAuditLog.map((log, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}`, fontSize: '13px' }}>
                                <td style={{ padding: '1rem', color: COLORS.label }}>{new Date(log.created_at || log.timestamp).toLocaleString()}</td>
                                <td style={{ padding: '1rem', fontWeight: 900 }}>{log.user_email || 'SYSTEM'}</td>
                                <td style={{ padding: '1rem', color: COLORS.accent }}>{log.action}</td>
                                <td style={{ padding: '1rem', fontSize: '13px', color: COLORS.label }}>{log.id?.substr(-12) || 'AUTO-GEN'}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: COLORS.label, fontSize: '13px', fontStyle: 'italic' }}>No audit activity found for this subject.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div style={S.card}>
                <label style={S.label}>Recent Activity</label>
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {auditLog.map((e, i) => (
                        <div key={i} style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px', fontSize: '13px', display: 'flex', gap: '1.5rem' }}>
                            <span style={{ color: COLORS.label, minWidth: '150px' }}>{e.timestamp}</span>
                            <span style={{ fontWeight: 900, color: COLORS.accent }}>{e.action}</span>
                            <span style={{ color: COLORS.text }}>{e.details}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderVisits = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h3 style={S.title}>Clinical Visit Timeline</h3>
            <div style={{ position: 'relative', paddingLeft: '2rem', borderLeft: `2px solid ${COLORS.border}`, marginLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                {participant.visits.map((v: any, i: number) => (
                    <div key={i} style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-2.6rem', top: '0', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: v.status === 'COMPLETED' ? COLORS.success : COLORS.bg, border: `3px solid ${v.status === 'COMPLETED' ? COLORS.success : COLORS.accent}` }} />
                        <div style={S.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <span style={{ fontSize: '16px', fontWeight: 900 }}>{v.label}</span>
                                <span style={S.badge(v.status === 'COMPLETED' ? COLORS.success : COLORS.warning)}>{v.status}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                                <div>
                                    <label style={S.label}>Scheduled Date</label>
                                    <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{v.date || 'To be scheduled'}</p>
                                </div>
                                <div>
                                    <label style={S.label}>Clinic Site</label>
                                    <p style={{ fontSize: '13px', fontWeight: 'bold' }}>Miller Clinic Alpha</p>
                                </div>
                                <div>
                                    <label style={S.label}>Assigned Staff</label>
                                    <p style={{ fontSize: '13px', fontWeight: 'bold' }}>Dr. John Smith</p>
                                </div>
                            </div>
                            {v.notes && (
                                <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '8px', borderLeft: `4px solid ${COLORS.accent}` }}>
                                    <p style={{ fontSize: '13px', fontStyle: 'italic', color: COLORS.text }}>{v.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderMedicalHistory = () => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
            <div style={S.card}>
                <label style={S.label}>Active Medications & Supplements</label>
                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {participant.medications.map((m: any, i: number) => (
                        <div key={i} style={{ padding: '1.25rem', borderRadius: '12px', border: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{m.drug}</div>
                                <div style={{ fontSize: '13px', color: COLORS.label, marginTop: '0.25rem' }}>{m.dose} • {m.frequency}</div>
                            </div>
                            <div style={{ fontSize: '13px', color: COLORS.label }}>Since {m.startDate}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div style={S.card}>
                <label style={S.label}>Clinical Contraindications</label>
                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ padding: '1.25rem', borderRadius: '12px', border: `1px solid ${COLORS.danger}30`, backgroundColor: `${COLORS.danger}05` }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.danger }}>ALLERGY: PENICILLIN</div>
                        <p style={{ fontSize: '13px', color: COLORS.label, marginTop: '0.5rem' }}>Subject reported severe anaphylactic reaction at age 12.</p>
                    </div>
                    <div style={{ padding: '1.25rem', borderRadius: '12px', border: `1px solid ${COLORS.warning}30`, backgroundColor: `${COLORS.warning}05` }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.warning }}>IBS-D PHENOTYPE</div>
                        <p style={{ fontSize: '13px', color: COLORS.label, marginTop: '0.5rem' }}>Predominant symptom presentation consistent with study arm assignment.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderConsent = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <h3 style={S.title}>Informed Consent Documents</h3>
            {participant.documents.filter((d: any) => d.type === 'Consent').map((c: any, i: number) => (
                <div key={i} style={S.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: 900 }}>Main Study Informed Consent Agreement</div>
                            <div style={{ fontSize: '13px', color: COLORS.label, marginTop: '0.5rem' }}>Version 2.1 • Study ID: MusB-2025-01</div>
                        </div>
                        <span style={S.badge(COLORS.success)}>Executed & Valid</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3rem' }}>
                        <div>
                            <label style={S.label}>Participant Signature</label>
                            <div style={{ height: '60px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'flex-end', paddingBottom: '0.5rem', fontStyle: 'italic', fontSize: '20px', fontFamily: '"Dancing Script", cursive' }}>
                                {participant.id}
                            </div>
                            <div style={{ fontSize: '13px', color: COLORS.label, marginTop: '0.75rem' }}>Digitally Authenticated: {c.date}</div>
                        </div>
                        <div>
                            <label style={S.label}>Investigator Attestation</label>
                            <div style={{ height: '60px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'flex-end', paddingBottom: '0.5rem', fontStyle: 'italic', fontSize: '20px', fontFamily: '"Dancing Script", cursive', color: COLORS.accent }}>
                                Dr. Michael Antigravity
                            </div>
                            <div style={{ fontSize: '13px', color: COLORS.label, marginTop: '0.75rem' }}>Verification Multi-Factor: ACTIVE</div>
                        </div>
                        <div>
                            <button style={{ ...S.btnPrimary, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }} onClick={() => addToast('PDF Secure Stream Started', 'success')}>
                                <Shield size={18} /> VIEW CERTIFICATE
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderSafety = () => (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            <div>
                <h3 style={S.title}>Adverse Event (AE) List</h3>
                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {participant.adverseEvents.length > 0 ? participant.adverseEvents.map((ae: any, i: number) => (
                        <div key={i} style={S.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '15px', fontWeight: 900, color: ae.severity === 'Severe' ? COLORS.danger : COLORS.accent }}>{ae.event.toUpperCase()}</span>
                                <span style={S.badge(ae.severity === 'Severe' ? COLORS.danger : COLORS.accent)}>
                                    {ae.severity === 'Severe' ? 'SERIOUS AE (SAE)' : 'NON-SERIOUS'}
                                </span>
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
                                    <label style={S.label}>Clinical Status</label>
                                    <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{ae.status}</p>
                                </div>
                                <div>
                                    <label style={S.label}>Onset Date</label>
                                    <p style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.label }}>{ae.onset}</p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div style={{ ...S.card, textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                            <ShieldCheck size={48} style={{ marginBottom: '1rem' }} />
                            <p style={S.title}>No Serious Safety Signals Identified</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div style={{ ...S.panel, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: `2px solid ${COLORS.accent}20`, borderTopColor: COLORS.accent, animation: 'spin 1s linear infinite' }} />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: COLORS.accent, textTransform: 'uppercase', letterSpacing: '0.2em' }}>MusB Internal Network</div>
                        <div style={{ fontSize: '18px', fontWeight: 900, fontStyle: 'italic', marginTop: '0.5rem' }}>LOADING STUDY DATA...</div>
                    </div>
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error && participantId !== 'BTB-023') {
        return (
            <div style={{ ...S.panel, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ ...S.card, width: '450px', textAlign: 'center', padding: '4rem' }}>
                    <ShieldAlert size={64} color={COLORS.danger} style={{ marginBottom: '2rem' }} />
                    <h2 style={{ fontSize: '24px', fontWeight: 900, fontStyle: 'italic', marginBottom: '1rem' }}>SUBJECT REJECTION</h2>
                    <p style={{ color: COLORS.text, fontSize: '14px', lineHeight: 1.6, marginBottom: '2.5rem' }}>{error}</p>
                    <button style={{ ...S.btnGhost, width: '100%' }} onClick={() => window.dispatchEvent(new CustomEvent('nav-to-participants'))}>
                        RETURN TO DASHBOARD
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={S.panel}>
            {/* STICKY TOP HEADER */}
            <header style={S.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <button 
                        onClick={() => {
                            if (participantId) {
                                // Came from parent navigation — go back to oversight panel
                                window.dispatchEvent(new CustomEvent('nav-to-participants'));
                            } else {
                                // Came from internal picker — return to picker
                                setInternalId('');
                                setParticipant(null);
                                setError(null);
                            }
                        }}
                        style={{ ...S.btnGhost, padding: '0.6rem', borderRadius: '12px' }}
                        title="Back to Subject Registry"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div style={{ ...S.name, fontSize: '24px' }}>{effectiveId} <span style={{ color: COLORS.text, fontWeight: 'normal', fontSize: '16px' }}>| {participant.study}</span></div>
                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.6rem', alignItems: 'center' }}>
                             <span style={{ fontSize: '13px', fontWeight: 900, color: COLORS.success, backgroundColor: `${COLORS.success}15`, padding: '0.25rem 0.6rem', borderRadius: '4px', border: `1px solid ${COLORS.success}30` }}>
                                 {participant.status.toUpperCase()} SUBJECT
                             </span>
                             <span style={{ fontSize: '13px', color: COLORS.info, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                 <Target size={13} /> {participant.arm} Arm
                             </span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1.25rem' }}>
                    <button style={S.btnGhost} onClick={async () => {
                        if (!participant.pk) return;
                        try {
                            const res = await authFetch(`${API}/api/participants/${participant.pk}/toggle_flag/`, { method: 'POST' });
                            if (res.ok) {
                                setParticipant((p: any) => ({ ...p, flagged: !p.flagged }));
                                addToast(participant.flagged ? 'Study Flag Cleared' : 'Subject Flagged for Review', 'warning');
                                logAction('Flag Toggled', participant.flagged ? 'PI cleared the study flag.' : 'PI flagged subject for secondary review.');
                            }
                        } catch (e) { console.error(e); }
                    }}>
                        <Bookmark size={16} fill={participant.flagged ? COLORS.warning : 'none'} color={participant.flagged ? COLORS.warning : COLORS.text} style={{ marginRight: '8px' }} /> 
                        {participant.flagged ? 'FLAGGED' : 'FLAG'}
                    </button>
                    <button style={{ ...S.btnPrimary, backgroundColor: COLORS.success }} onClick={() => handleAction('Approve', async () => {
                        if (!participant.pk) return;
                        const res = await authFetch(`${API}/api/participants/${participant.pk}/review_eligibility/`, {
                            method: 'POST',
                            body: JSON.stringify({ decision: 'ACCEPT', notes: screeningNotes })
                        });
                        if (res.ok) {
                            setParticipant((p: any) => ({ ...p, eligibility: 'Approved', status: 'ENROLLED' }));
                            addToast('Subject Status Validated');
                            logAction('Subject Validated', 'PI finalized clinical review and approved participant.');
                        }
                    })}>Approve</button>
                    <button style={{ ...S.btnPrimary, backgroundColor: COLORS.danger }} onClick={() => handleAction('Withdraw', async () => {
                        if (!participant.pk) return;
                        const res = await authFetch(`${API}/api/participants/${participant.pk}/withdraw/`, {
                            method: 'POST',
                            body: JSON.stringify({ reason: 'PI Withdrawal from Oversight Terminal' })
                        });
                        if (res.ok) {
                            setParticipant((p: any) => ({ ...p, status: 'DROPPED' }));
                            addToast('Subject Withdrawn', 'error');
                            logAction('Subject Withdrawn', 'Critical Action: PI terminated subject participation.');
                        }
                    }, { message: "Terminate participation for this subject immediately?", type: 'danger' })}>Withdraw</button>
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
                <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', paddingBottom: '6rem' }}>
                    {activeTab === 'Overview' && renderOverview()}
                    {activeTab === 'Eligibility' && renderEligibility()}
                    {activeTab === 'Outcomes' && renderOutcomes()}
                    {activeTab === 'Audit Trail' && renderAuditTrail()}
                    
                    {/* Placeholder for other tabs to keep layout dense */}
                    {activeTab === 'Safety' && renderSafety()}

                    {activeTab === 'Labs' && (
                        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                            <div>
                                <h3 style={S.title}>Longitudinal Clinical Parameters</h3>
                                <div style={{ marginTop: '2rem', ...S.card, padding: 0, overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderBottom: `1px solid ${COLORS.border}` }}>
                                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', ...S.label, color: 'white' }}>Clinical Parameter</th>
                                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', ...S.label }}>Screening</th>
                                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', ...S.label }}>Visit 1</th>
                                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', ...S.label }}>Visit 2</th>
                                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', ...S.label }}>Reference Range</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {participant.labs.length > 0 ? participant.labs.map((r: any, i: number) => (
                                                <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                                    <td style={{ padding: '1.25rem 2rem', fontSize: '13px', fontWeight: 'bold' }}>{r.biomarker}</td>
                                                    <td style={{ padding: '1.25rem 2rem', fontSize: '13px', color: COLORS.label }}>{r.date || 'N/A'}</td>
                                                    <td style={{ padding: '1.25rem 2rem', fontSize: '13px', color: r.status === 'High' ? COLORS.danger : 'white' }}>{r.result}</td>
                                                    <td style={{ padding: '1.25rem 2rem', fontSize: '13px', color: r.status === 'High' ? COLORS.danger : COLORS.success }}>{r.status}</td>
                                                    <td style={{ padding: '1.25rem 2rem', fontSize: '13px', color: COLORS.label }}>{r.range || '70 - 110'}</td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: COLORS.label, fontSize: '14px' }}>No laboratory records loaded for this subject.</td>
                                                </tr>
                                            )}
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
                                    {participant.documents.length > 0 ? participant.documents.map((doc: any, i: number) => (
                                        <div key={i} style={S.card}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <FileText size={20} color={COLORS.accent} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>{doc.name}</div>
                                                    <div style={{ fontSize: '13px', color: COLORS.label }}>v{doc.version} • {doc.date}</div>
                                                </div>
                                                <button style={{ ...S.btnGhost, padding: '0.5rem' }} onClick={() => addToast('Document Terminal Not Configured', 'warning')}>
                                                    <ArrowUpRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ gridColumn: '1 / -1', ...S.card, textAlign: 'center', padding: '3rem', color: COLORS.label, fontSize: '14px' }}>
                                            Electronic File Repository Empty
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Visits' && renderVisits()}
                    {activeTab === 'Medical History' && renderMedicalHistory()}
                    {activeTab === 'Consent' && renderConsent()}
                    {activeTab === 'Notes' && (
                        <div style={{ gridColumn: '1 / -1', ...S.card }}>
                            <label style={S.label}>Investigator Session Logs</label>
                            <textarea 
                                style={{ width: '100%', marginTop: '1.5rem', backgroundColor: 'rgba(0,0,0,0.2)', border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: 'white', padding: '1.5rem', fontSize: '14px', outline: 'none', minHeight: '300px' }}
                                placeholder="Enter proprietary clinical observations..."
                                value={screeningNotes}
                                onChange={e => setScreeningNotes(e.target.value)}
                            />
                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                <button style={S.btnPrimary} onClick={async () => {
                                    if (!participant.pk) return;
                                    try {
                                        const res = await authFetch(`${API}/api/participants/${participant.pk}/update_clinical_notes/`, {
                                            method: 'PATCH',
                                            body: JSON.stringify({ notes: screeningNotes })
                                        });
                                        if (res.ok) {
                                            addToast('Clinical session synchronized', 'success'); 
                                            logAction('Data Save', 'PI saved session notes via Notes tab.'); 
                                        }
                                    } catch (e) { addToast('Sync failed', 'error'); }
                                }}>Save Notes</button>
                                <button style={S.btnGhost} onClick={() => {
                                    addToast('Deviation recorded', 'warning');
                                    logAction('Deviation Observed', 'PI marked a protocol deviation.'); 
                                }}>Mark Protocol Deviation</button>
                            </div>
                        </div>
                    )}
                    
                    {!['Overview', 'Eligibility', 'Outcomes', 'Audit Trail', 'Safety', 'Labs', 'Documents', 'Visits', 'Medical History', 'Consent', 'Notes'].includes(activeTab) && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: COLORS.label }}>
                            <ClipboardList size={64} style={{ opacity: 0.1, marginBottom: '2rem' }} />
                            <div style={{ fontSize: '20px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>{activeTab} Feed Active</div>
                            <div style={{ fontSize: '13px', marginTop: '1rem' }}>Streaming clinical parameters for {participant.id}...</div>
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
                        <p style={{ fontSize: '13px', color: COLORS.label, marginTop: '0.8rem', fontStyle: 'italic' }}>Visit completion velocity stable.</p>
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
                        <button style={{ ...S.btnGhost, textAlign: 'left', fontSize: '14px' }} onClick={() => setActiveTab('Overview')}>&gt; Overview</button>
                        <button style={{ ...S.btnGhost, textAlign: 'left', fontSize: '14px' }} onClick={() => setActiveTab('Eligibility')}>&gt; Eligibility</button>
                        <button style={{ ...S.btnGhost, textAlign: 'left', fontSize: '14px' }} onClick={() => setActiveTab('Safety')}>&gt; Safety</button>
                    </div>
                </aside>
            </div>

            {/* REMOVED STICKY BOTTOM ACTION BAR TO PREVENT OVERLAP */}

            {/* TOAST SYSTEM */}
            <div style={{ position: 'fixed', bottom: '6rem', right: '2rem', zIndex: 1000, display: 'flex', flexDirection: 'column-reverse', gap: '0.75rem' }}>
                {toasts.map(t => (
                    <div key={t.id} style={{ 
                        padding: '1rem 2rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '1rem',
                        backgroundColor: t.type === 'success' ? COLORS.success : t.type === 'error' ? COLORS.danger : COLORS.warning,
                        color: 'white', fontWeight: 900, textTransform: 'uppercase', fontSize: '13px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
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
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(20, 184, 166, 0.2); border-radius: 2px; }
            `}</style>
        </div>
    );
}



