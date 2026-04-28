import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch, API } from '../../../utils/auth';
import { 
    AlertCircle, Info, ShieldAlert, Bookmark, ArrowLeft, Loader2, Target, Activity,
    ChevronDown
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
import LifecycleTracker from './clinical/LifecycleTracker';
import ApprovalStatus from './clinical/ApprovalStatus';
import PIIRevealButton from './clinical/PIIRevealButton';
import ClinicalAuditTrail from './clinical/ClinicalAuditTrail';
import ClinicalEnrollmentWorkflow from './clinical/ClinicalEnrollmentWorkflow';
import InformedConsentWorkflow from './clinical/InformedConsentWorkflow';

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
    visits: [],
    symptoms: [],
    adverseEvents: [],
    labs: [],
    documents: [],
    inclusions: [],
    exclusions: []
};

// --- COMPONENT ---
export default function CCC_SubjectReviewModule({ 
    participantId, 
    selectedStudyId, 
    preloadedTracking,
    initialTab = 'Overview'
}: { 
    participantId?: string, 
    selectedStudyId?: string, 
    preloadedTracking?: any,
    initialTab?: string 
}) {
    // State
    const [participant, setParticipant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(initialTab);

    // Sync if initialTab changes (e.g. navigation update)
    useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
    }, [initialTab]);
    const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
    const [toasts, setToasts] = useState<{ id: string, type: string, message: string }[]>([]);
    const [confirmModal, setConfirmModal] = useState<{ message: string, type: string, onConfirm: () => void } | null>(null);
    const [screeningNotes, setScreeningNotes] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [clinicalLogs, setClinicalLogs] = useState<any[]>([]);
    const [piiLogs, setPiiLogs] = useState<any[]>([]);
    const [isApproving, setIsApproving] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const fetchData = useCallback(async () => {
        if (!participantId) {
            setParticipant(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await authFetch(`${API}/api/participants/${participantId}/`);
            if (res.ok) {
                const data = await res.json();
                // Ensure critical nested objects exist to prevent crashes
                setParticipant({
                    ...data,
                    consent: data.consent || { status: 'Unknown' },
                    adverseEvents: data.adverseEvents || [],
                    symptoms: data.symptoms || [],
                    documents: data.documents || [],
                    lab_results: data.lab_results || data.labs || []
                });
            } else {
                // If ID exists but fetch fails, fallback to something safe or show error
                setParticipant(null);
            }
        } catch (err) {
            console.error("Failed to fetch participant:", err);
            setParticipant(null);
        } finally {
            setLoading(false);
        }
    }, [participantId]);

    const fetchAuditLogs = useCallback(async () => {
        if (!participantId) return;
        try {
            const res = await authFetch(`${API}/api/participants/${participantId}/audit_logs/`);
            if (res.ok) {
                const data = await res.json();
                setClinicalLogs(data.clinical_logs || []);
                setPiiLogs(data.pii_access_logs || []);
            }
        } catch (err) {
            console.error("Failed to fetch audit logs:", err);
        }
    }, [participantId]);

    useEffect(() => {
        fetchData();
        fetchAuditLogs();
    }, [fetchData, fetchAuditLogs]);

    const handleDualApproval = async (type: 'coordinator' | 'pi', signature: string) => {
        setIsApproving(true);
        try {
            const res = await authFetch(`${API}/api/participants/${participantId}/approve_dual/`, {
                method: 'POST',
                body: JSON.stringify({ type, signature })
            });
            if (res.ok) {
                addToast(`${type.toUpperCase()} signature recorded successfully.`);
                fetchData();
                fetchAuditLogs();
            } else {
                const err = await res.json();
                addToast(err.error || "Approval failed.", "error");
            }
        } catch (err) {
            addToast("Network error during approval.", "error");
        } finally {
            setIsApproving(false);
        }
    };

    const handlePIIReveal = async (field: string, reason: string) => {
        try {
            const res = await authFetch(`${API}/api/participants/${participantId}/reveal_pii/`, {
                method: 'POST',
                body: JSON.stringify({ field, reason })
            });
            if (res.ok) {
                const data = await res.json();
                fetchAuditLogs(); // Refresh logs after reveal
                return data.value;
            }
            return "Error revealing data";
        } catch (err) {
            return "Connection error";
        }
    };

    const [screenerSchema, setScreenerSchema] = useState<any>(null);
    useEffect(() => {
        const fetchSchema = async () => {
            if (!selectedStudyId) return;
            try {
                const res = await authFetch(`${API}/api/forms/?study_id=${selectedStudyId}&public=true`);
                if (res.ok) {
                    const data = await res.json();
                    const forms = Array.isArray(data) ? data : (data.results || []);
                    if (forms.length > 0) {
                        setScreenerSchema(forms[0].schema);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch schema:", err);
            }
        };
        fetchSchema();
    }, [selectedStudyId]);

    const processedParticipant = useMemo(() => {
        if (!participant) return null;
        
        let inclusions: any[] = [];
        let exclusions: any[] = [];
        
        let autoAge = participant.age;
        let autoSex = participant.gender || participant.sex;
        let autoArm = participant.assigned_arm_name || (typeof participant.assigned_arm === 'string' ? participant.assigned_arm : participant.assigned_arm?.name);
        let autoName = participant.user_details?.decrypted_name || participant.user_details?.full_name;

        if (participant.eligibility_data && screenerSchema) {
            const questions = Array.isArray(screenerSchema.questions) ? screenerSchema.questions : [];
            let firstName = '';
            let lastName = '';

            Object.entries(participant.eligibility_data).forEach(([key, value]) => {
                const q = questions.find((quest: any) => quest.id === key || quest.key === key);
                const label = q ? q.label : key;
                const lowLabel = label.toLowerCase();
                
                // Try to auto-populate missing fields from screener data
                if (!autoAge && (lowLabel.includes('age') || lowLabel.includes('old') || lowLabel.includes('birth') || lowLabel.includes('dob'))) {
                    // If it's a date string, calculate age
                    if (typeof value === 'string' && value.includes('-')) {
                        const birthDate = new Date(value);
                        if (!isNaN(birthDate.getTime())) {
                            const today = new Date();
                            let age = today.getFullYear() - birthDate.getFullYear();
                            const m = today.getMonth() - birthDate.getMonth();
                            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                            autoAge = age;
                        } else {
                            autoAge = value;
                        }
                    } else {
                        autoAge = value;
                    }
                }
                if (!autoSex && (lowLabel.includes('sex') || lowLabel.includes('gender'))) autoSex = value;
                if (!autoArm && (lowLabel.includes('arm') || lowLabel.includes('group') || lowLabel.includes('cohort'))) autoArm = value;

                // Extract Name if missing
                if (!autoName) {
                    if (lowLabel.includes('first name') || lowLabel.includes('given name')) firstName = String(value);
                    if (lowLabel.includes('last name') || lowLabel.includes('surname') || lowLabel.includes('family name')) lastName = String(value);
                    if (lowLabel === 'name' || lowLabel === 'full name') autoName = String(value);
                }

                const isExclusion = lowLabel.includes('exclusion');
                
                const entry = {
                    label: label,
                    met: value === 'Yes' || value === true || value === 'Eligible',
                    present: value === 'Yes' || value === true || value === 'Present'
                };
                
                if (isExclusion) exclusions.push(entry);
                else inclusions.push(entry);
            });

            if (!autoName && firstName) {
                autoName = firstName + (lastName ? ' ' + lastName : '');
            }
        }
        
        // Fallback if schema doesn't exist but data does
        if (inclusions.length === 0 && exclusions.length === 0 && participant.eligibility_data) {
             let firstName = '';
             let lastName = '';

             Object.entries(participant.eligibility_data).forEach(([key, value]) => {
                const lowKey = key.toLowerCase();
                if (!autoAge && (lowKey.includes('age') || lowKey.includes('old') || lowKey.includes('birth') || lowKey.includes('dob'))) {
                    if (typeof value === 'string' && value.includes('-')) {
                        const birthDate = new Date(value);
                        if (!isNaN(birthDate.getTime())) {
                            const today = new Date();
                            let age = today.getFullYear() - birthDate.getFullYear();
                            const m = today.getMonth() - birthDate.getMonth();
                            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                            autoAge = age;
                        } else {
                            autoAge = value;
                        }
                    } else {
                        autoAge = value;
                    }
                }
                if (!autoSex && (lowKey.includes('sex') || lowKey.includes('gender'))) autoSex = value;
                if (!autoArm && (lowKey.includes('arm') || lowKey.includes('group') || lowKey.includes('cohort'))) autoArm = value;
                
                if (!autoName) {
                    if (lowKey.includes('first_name') || lowKey.includes('firstname')) firstName = String(value);
                    if (lowKey.includes('last_name') || lowKey.includes('lastname')) lastName = String(value);
                    if (lowKey === 'name' || lowKey === 'full_name') autoName = String(value);
                }

                inclusions.push({
                    label: key.replace(/_/g, ' ').toUpperCase(),
                    met: value === 'Yes' || value === true || value === 'Eligible'
                });
             });

             if (!autoName && firstName) {
                autoName = firstName + (lastName ? ' ' + lastName : '');
            }
        }

        return {
            ...participant,
            display_name: autoName,
            age: autoAge,
            sex: autoSex,
            assigned_arm_name: autoArm,
            inclusions: inclusions,
            exclusions: exclusions
        };
    }, [participant, screenerSchema]);

    useEffect(() => {
        // Handled by consolidated useEffect above
    }, [fetchData]);

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

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#0F172A]">
            <Loader2 size={40} className="animate-spin text-blue-500 mb-6" />
            <h1 className="text-xl font-bold text-slate-500 uppercase tracking-widest">Synchronizing Database...</h1>
        </div>
    );

    if (!participantId) return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#0F172A] text-center p-10">
            <Target size={64} className="text-blue-500 mb-8 opacity-20" />
            <h1 className="text-2xl font-bold text-white mb-2">No Subject Selected</h1>
            <p className="text-slate-500 max-w-md mx-auto mb-8">Select a participant from the Oversight dashboard to view their clinical profile and eligibility status.</p>
            <button 
                onClick={() => window.dispatchEvent(new CustomEvent('nav-to-participants'))}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all uppercase tracking-widest text-xs"
            >
                Go to Oversight
            </button>
        </div>
    );

    if (!participant) return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#0F172A] text-center p-10">
            <AlertCircle size={64} className="text-rose-500 mb-8 opacity-20" />
            <h1 className="text-2xl font-bold text-white mb-2">Subject Record Unreachable</h1>
            <p className="text-slate-500 max-w-md mx-auto mb-8">The requested clinical profile could not be retrieved from the central repository. Please verify the Subject ID and your network connection.</p>
            <button 
                onClick={() => window.dispatchEvent(new CustomEvent('nav-to-participants'))}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all uppercase tracking-widest text-xs"
            >
                Return to Oversight
            </button>
        </div>
    );

    const alerts: any[] = []; 
    const tabs = ['Overview', 'Enrollment Workflow', 'Informed Consent', 'Screening Review', 'Outcomes', 'Safety', 'Core Diagnostics', 'Artifacts', 'Audit'];

    return (
        <div style={{...S.panel, backgroundColor: '#0B1221', color: '#CBD5E1'}}>
            <header className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-8 py-6 border-b border-[#1F2937] bg-[#0B1221] gap-6">
                <div className="flex items-center gap-4 md:gap-6">
                    <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('nav-to-participants'))}
                        className="p-2 border border-[#1F2937] rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all shrink-0"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="text-xl font-black text-white uppercase tracking-tight italic">
                            {processedParticipant.display_name || processedParticipant.participant_sid || 'AWAITING ID'}
                            <span className="text-slate-600 font-bold text-[11px] ml-3 uppercase tracking-[0.2em] italic">/ {participant.study_name || 'PROTOCOL UNSPECIFIED'}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{processedParticipant.status || 'ACTIVE SUBJECT'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Activity size={12} className="text-slate-500" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{processedParticipant.assigned_arm_name || 'GENERAL COHORT'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <button 
                        onClick={handleToggleFlag}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 border rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all ${participant.is_flagged ? 'bg-amber-500 text-white border-amber-500' : 'bg-transparent border-[#1F2937] text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Bookmark size={14} fill={participant.is_flagged ? "currentColor" : "none"} /> 
                        {participant.is_flagged ? 'FLAGGED' : 'FLAG'}
                    </button>
                    <button 
                        onClick={() => handleReviewDecision('ELIGIBLE')}
                        className="flex-1 md:flex-none px-4 md:px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-emerald-900/10"
                    >
                        Approve
                    </button>
                    <button 
                        onClick={() => setConfirmModal({
                            message: `Terminate participation for ${participant.participant_sid}? This action is irreversible.`,
                            type: 'danger',
                            onConfirm: () => handleWithdraw('PI decision during subject review.')
                        })}
                        className="flex-1 md:flex-none px-4 md:px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-rose-900/10"
                    >
                        Withdraw
                    </button>
                </div>
            </header>

            {/* Navigation Section */}
            {isMobile ? (
                <nav className="px-4 py-4 border-b border-[#1F2937] bg-[#0B1221]">
                    <div className="relative">
                        <select 
                            value={activeTab}
                            onChange={(e) => setActiveTab(e.target.value)}
                            className="w-full bg-[#111827] border border-[#1F2937] text-white px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer shadow-2xl"
                        >
                            {tabs.map((tab) => (
                                <option key={tab} value={tab}>{tab}</option>
                            ))}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500">
                            <ChevronDown size={18} />
                        </div>
                    </div>
                </nav>
            ) : (
                <nav className="flex items-center px-8 border-b border-[#1F2937] bg-[#0B1221] overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.25em] transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                            )}
                        </button>
                    ))}
                </nav>
            )}

            <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden custom-scrollbar bg-[#0B1221]">
                <main className="w-full md:flex-1 p-4 md:p-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >                             {activeTab === 'Enrollment Workflow' && (
                                <ClinicalEnrollmentWorkflow 
                                    participant={processedParticipant} 
                                    onApprove={handleDualApproval}
                                    onRandomize={async () => {
                                        try {
                                            const res = await authFetch(`${API}/api/participants/${participantId}/randomize/`, { method: 'POST' });
                                            if (res.ok) {
                                                addToast("Participant randomized successfully.");
                                                fetchData();
                                            }
                                        } catch (err) {
                                            addToast("Randomization failed.", "error");
                                        }
                                    }}
                                    addToast={addToast}
                                />
                            )}
                            {activeTab === 'Informed Consent' && (
                                <InformedConsentWorkflow 
                                    participant={processedParticipant} 
                                />
                            )}

                            {activeTab === 'Overview' && (
                                <SubjectOverview 
                                    participant={processedParticipant} 
                                    alerts={[]} 
                                    addToast={addToast} 
                                    logAction={logAction} 
                                    setParticipant={setParticipant}
                                    onApprove={handleDualApproval}
                                    onReveal={handlePIIReveal}
                                    isApproving={isApproving}
                                />
                            )}
                            {activeTab === 'Screening Review' && <EligibilityAudit participant={processedParticipant} screeningNotes={screeningNotes} setScreeningNotes={setScreeningNotes} logAction={logAction} />}
                            {activeTab === 'Outcomes' && <ClinicalOutcomes participant={processedParticipant} />}
                            {activeTab === 'Safety' && <SafetySignals participant={processedParticipant} />}
                            {activeTab === 'Core Diagnostics' && <LabParameters participant={processedParticipant} />}
                            {activeTab === 'Artifacts' && <DocumentRegistry participant={processedParticipant} />}
                            {activeTab === 'Audit' && (
                                <ClinicalAuditTrail 
                                    clinicalLogs={clinicalLogs} 
                                    piiLogs={piiLogs} 
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>

                <aside className="w-full md:w-[320px] bg-[#0B1221]/50 border-t md:border-t-0 md:border-l border-[#1F2937] flex flex-col shrink-0">
                    <SummaryPanel participant={processedParticipant} setActiveTab={setActiveTab} />
                    <ActionFooter 
                        addToast={addToast} 
                        logAction={logAction} 
                    />
                </aside>
            </div>

            <div className="fixed bottom-24 right-8 z-[1000] flex flex-col-reverse gap-3">
                <AnimatePresence>
                    {toasts.map(t => (
                        <motion.div 
                            key={t.id} 
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 100, opacity: 0 }}
                            className={`px-6 py-3 rounded-lg flex items-center gap-3 text-xs font-bold uppercase tracking-wide shadow-2xl border ${
                                t.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 
                                t.type === 'error' ? 'bg-rose-600 border-rose-500 text-white' : 
                                'bg-amber-600 border-amber-500 text-white'
                            }`}
                        >
                            <Info size={14} /> {t.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {confirmModal && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmModal(null)} 
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0B1221] border border-white/10 w-full max-w-md rounded-2xl p-8 relative z-10 shadow-2xl"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${confirmModal.type === 'danger' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                <ShieldAlert size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Confirm Action</h3>
                            <p className="text-sm text-slate-400 leading-relaxed mb-8">{confirmModal.message}</p>
                            <div className="flex gap-3">
                                <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all uppercase tracking-widest">Abort</button>
                                <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className={`flex-1 py-3 text-white rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${confirmModal.type === 'danger' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-blue-600 hover:bg-blue-500'}`}>Confirm</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
