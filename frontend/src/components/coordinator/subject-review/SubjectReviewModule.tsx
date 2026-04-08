import React, { useState, useMemo, useCallback } from 'react';
import { authFetch, API } from '../../../utils/auth';
import { 
    AlertCircle, Info, ShieldAlert, Bookmark, ArrowLeft, Target 
} from 'lucide-react';
import { COLORS, S } from './SubRevConstants';
import { SubjectOverview } from './views/SubjectOverview';
import { EligibilityAudit } from './views/EligibilityAudit';
import { ClinicalOutcomes } from './views/ClinicalOutcomes';
import { SafetySignals } from './views/SafetySignals';
import { LabParameters } from './views/LabParameters';
import { DocumentRegistry } from './views/DocumentRegistry';
import { SubjectAuditTrail } from './views/SubjectAuditTrail';
import { SummaryPanel } from './components/SummaryPanel';
import { ActionFooter } from './components/ActionFooter';

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
}

interface AuditEntry {
    timestamp: string;
    user: string;
    role: string;
    action: string;
    details: string;
}

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
export default function CCC_SubjectReviewModule({ participantId = 'BTB-023', selectedStudyId }: { participantId?: string, selectedStudyId?: string }) {
    // State
    const [participant, setParticipant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview');
    const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
    const [toasts, setToasts] = useState<{ id: string, type: string, message: string }[]>([]);
    const [confirmModal, setConfirmModal] = useState<{ message: string, type: string, onConfirm: () => void } | null>(null);
    const [screeningNotes, setScreeningNotes] = useState('');

    const fetchData = useCallback(async () => {
        if (!participantId || participantId === 'BTB-023') {
            setParticipant(MOCK_PARTICIPANT);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await authFetch(`${API}/api/participants/${participantId}/`);
            if (res.ok) {
                const data = await res.json();
                setParticipant(data);
            }
        } catch (err) {
            console.error("Failed to fetch participant:", err);
        } finally {
            setLoading(false);
        }
    }, [participantId]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Helpers
    const addToast = useCallback((message: string, type: string = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev.slice(-2), { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    const logAction = useCallback((action: string, details: string) => {
        const entry: AuditEntry = {
            timestamp: new Date().toLocaleString(),
            user: 'Coordinator', role: 'Coordinator', action, details
        };
        setAuditLog(prev => [entry, ...prev]);
    }, []);

    const handleReviewDecision = async (decision: string) => {
        try {
            const res = await authFetch(`${API}/api/participants/${participantId}/review_eligibility/`, {
                method: 'POST',
                body: JSON.stringify({ decision, notes: screeningNotes })
            });
            if (res.ok) {
                addToast(`Subject Eligibility: ${decision}`);
                fetchData();
            }
        } catch (err) {
            console.error("Review failed:", err);
        }
    };

    const handleWithdraw = async (reason: string) => {
        try {
            const res = await authFetch(`${API}/api/participants/${participantId}/withdraw/`, {
                method: 'POST',
                body: JSON.stringify({ reason })
            });
            if (res.ok) {
                addToast('Subject Withdrawn', 'error');
                fetchData();
            }
        } catch (err) {
             console.error("Withdrawal failed:", err);
        }
    };

    const handleToggleFlag = async () => {
        try {
            const res = await authFetch(`${API}/api/participants/${participantId}/toggle_flag/`, {
                method: 'POST'
            });
            if (res.ok) {
                const updated = await res.json();
                addToast(updated.is_flagged ? 'Subject Flagged' : 'Flag Cleared', 'warning');
                fetchData();
            }
        } catch (err) {
            console.error("Flag toggle failed:", err);
        }
    };

    if (loading || !participant) return (
        <div style={{ ...S.panel, justifyContent: 'center', alignItems: 'center' }}>
            <Target size={48} className="animate-pulse text-indigo-500 mb-6" />
            <h1 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '0.05em' }}>Loading Clinical Profile...</h1>
        </div>
    );

    const alerts: any[] = []; // In a real app, derive from participant.ae_reports etc.

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
                        <div style={{ ...S.name, fontSize: '24px' }}>{participant.participant_sid} <span style={{ color: COLORS.text, fontWeight: 'normal', fontSize: '16px' }}>| {participant.study_name}</span></div>
                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.6rem', alignItems: 'center' }}>
                             <span style={{ fontSize: '12px', fontWeight: 900, color: COLORS.success, backgroundColor: `${COLORS.success}15`, padding: '0.25rem 0.6rem', borderRadius: '4px', border: `1px solid ${COLORS.success}30` }}>
                                 {participant.status.toUpperCase()} SUBJECT
                             </span>
                             <span style={{ fontSize: '12px', color: COLORS.info, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                 <Target size={12} /> {participant.assigned_arm || 'Discovery'} Arm
                             </span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1.25rem' }}>
                    <button style={S.btnGhost} onClick={handleToggleFlag}>
                        <Bookmark size={16} fill={participant.is_flagged ? COLORS.warning : 'none'} color={participant.is_flagged ? COLORS.warning : COLORS.text} style={{ marginRight: '8px' }} /> 
                        {participant.is_flagged ? 'FLAGGED' : 'FLAG'}
                    </button>
                    <button style={{ ...S.btnPrimary, backgroundColor: COLORS.success }} onClick={() => handleReviewDecision('ELIGIBLE')}>Approve</button>
                    <button style={{ ...S.btnPrimary, backgroundColor: COLORS.danger }} onClick={() => setConfirmModal({
                        message: `Terminate participation for ${participant.participant_sid} immediately?`,
                        type: 'danger',
                        onConfirm: () => handleWithdraw('PI decision during subject review.')
                    })}>Withdraw</button>
                </div>
            </header>

            {/* TAB BAR */}
            <div style={S.tabBar}>
                {['Overview', 'Eligibility', 'Medical History', 'Consent', 'Visits', 'Outcomes', 'Safety', 'Labs', 'Documents', 'Notes', 'Audit Trail'].map(tab => {
                    const hasAlert = (tab === 'Safety' && participant.ae_reports?.length > 0) || (tab === 'Labs' && participant.lab_results?.some((l: any) => l.status === 'High'));
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
                    {activeTab === 'Overview' && <SubjectOverview {...{ participant, alerts, setParticipant, addToast, logAction }} />}
                    {activeTab === 'Eligibility' && <EligibilityAudit {...{ participant, screeningNotes, setScreeningNotes, logAction }} />}
                    {activeTab === 'Outcomes' && <ClinicalOutcomes {...{ participant }} />}
                    {activeTab === 'Audit Trail' && <SubjectAuditTrail {...{ auditLog }} />}
                    {activeTab === 'Safety' && <SafetySignals {...{ participant }} />}
                    {activeTab === 'Labs' && <LabParameters {...{ participant }} />}
                    {activeTab === 'Documents' && <DocumentRegistry {...{ participant }} />}
                    
                    {!['Overview', 'Eligibility', 'Outcomes', 'Audit Trail', 'Safety', 'Labs', 'Documents'].includes(activeTab) && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: COLORS.label }}>
                            <AlertCircle size={64} style={{ opacity: 0.1, marginBottom: '2rem' }} />
                            <div style={{ fontSize: '20px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>{activeTab} Feed Active</div>
                            <div style={{ fontSize: '14px', marginTop: '1rem' }}>Streaming clinical parameters for {participant.participant_sid}...</div>
                        </div>
                    )}
                </main>

                <SummaryPanel participant={participant} setActiveTab={setActiveTab} />
            </div>

            <ActionFooter addToast={addToast} logAction={logAction} />

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





