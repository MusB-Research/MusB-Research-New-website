import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    RefreshCw, 
    Search, 
    FileText, 
    ClipboardList, 
    Columns, 
    CheckCircle2, 
    X,
    Filter,
    Upload,
    Download
} from 'lucide-react';
import { authFetch, API } from '../../../utils/auth';
import { COLORS, ConsentTemplate, ConsentRecord, AuditEntry } from './ConsentConstants';
import { ConsentBuilder } from './views/ConsentBuilder';
import { ConsentRegistry } from './views/ConsentRegistry';
import { SignatureConfiguration } from './views/SignatureConfiguration';
import { PIVerification } from './views/PIVerification';
import { ParticipantSignView } from './views/ParticipantSignView';
import { UploadConsentModal } from './components/UploadConsentModal';
import { AuditDrawer } from './components/AuditDrawer';

export default function ConsentModule({ selectedStudyId, preloadedStudies }: { selectedStudyId?: string, preloadedStudies?: any[] }) {
    // API State
    const [consents, setConsents] = useState<ConsentTemplate[]>([]);
    const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
    const [studies, setStudies] = useState<any[]>(preloadedStudies || []);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sync studies with preloaded data
    useEffect(() => {
        if (preloadedStudies) {
            setStudies(preloadedStudies.map((s: any) => ({ ...s, id: s.id || s._id })));
        }
    }, [preloadedStudies]);

    // Filter/View State
    const [activeView, setActiveView] = useState('builder');
    const [activeConsentId, setActiveConsentId] = useState<string | null>(null);
    const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
    const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
    const [leftSearch, setLeftSearch] = useState('');
    const [leftFilter, setLeftFilter] = useState('All');
    const [recordsSearch, setRecordsSearch] = useState('');
    const [recordsFilter, setRecordsFilter] = useState('All');
    const [currentViewerPage, setCurrentViewerPage] = useState(1);
    const [viewerZoom, setViewerZoom] = useState(85);
    const [thumbnailOpen, setThumbnailOpen] = useState(true);

    const [signatureActiveField, setSignatureActiveField] = useState<string | null>(null);
    const [piDocTab, setPiDocTab] = useState('signed');
    const [piSignature, setPiSignature] = useState(false);
    const [piNotes, setPiNotes] = useState('');
    
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadForm, setUploadForm] = useState<any>({ title: '', study: '', type: 'Main Consent', version: '1.0', irbNumber: '', irbApprovalDate: '', effectiveDate: '', expirationDate: '', language: 'English', terms_content: '', notes: '', file: null });

    const [toasts, setToasts] = useState<{ id: string, type: string, message: string }[]>([]);
    const [confirmModal, setConfirmModal] = useState<{ message: string, onConfirm: () => void, type?: string, confirmLabel?: string } | null>(null);

    // Derived Data
    const activeConsent = useMemo(() => consents.find(c => c.id === activeConsentId), [consents, activeConsentId]);
    const activeRecord = useMemo(() => consentRecords.find(r => r.id === activeRecordId), [consentRecords, activeRecordId]);

    // Initial Data Load
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const queryStr = selectedStudyId ? `?study_id=${selectedStudyId}` : '';
            const [templatesRes, recordsRes] = await Promise.all([
                authFetch(`${API}/api/consent-templates/${queryStr}`).then(res => res.json()),
                authFetch(`${API}/api/consent/${queryStr}`).then(res => res.json())
            ]);
            
            const rawTemplates = templatesRes.results || templatesRes || [];
            const rawRecords = recordsRes.results || recordsRes || [];

            const correctedTemplates = rawTemplates.map((t: any) => ({
                ...t,
                id: t.id || t._id,
                title: t.title?.replace(/Baet/g, 'Beat').replace(/CONCENT/g, 'CONSENT') || 'Untitled Protocol',
                signatureRequirements: t.signatureRequirements || {
                    participantSignature: true,
                    participantDate: true,
                    ccSignature: true,
                    piVerification: true
                },
                placedFields: typeof t.placed_fields === 'string' 
                    ? JSON.parse(t.placed_fields) 
                    : (t.placed_fields || t.placedFields || [])
            }));
            
            setConsents(correctedTemplates);
            setConsentRecords(rawRecords.map((r: any) => ({ ...r, id: r.id || r._id })));
            
            if (correctedTemplates.length > 0 && !activeConsentId) {
                setActiveConsentId(correctedTemplates[0].id);
            }
        } catch (err) {
            console.error("Failed to fetch consent data:", err);
            setError("Clinical data connection failed. Check backend status.");
        } finally {
            setLoading(false);
        }
    }, [selectedStudyId, activeConsentId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addToast = useCallback((message: string, type = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev.slice(-2), { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    const handleUpload = async () => {
        if (!uploadForm.file) {
            addToast('Please attach a protocol PDF first', 'error');
            return;
        }

        if (!uploadForm.title.trim()) {
            addToast('Protocol Identity is required', 'error');
            return;
        }

        if (!uploadForm.study) {
            addToast('Study Cluster assignment is required', 'error');
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('title', uploadForm.title);
            formData.append('study', uploadForm.study);
            formData.append('version', uploadForm.version);
            formData.append('irb_number', uploadForm.irbNumber);
            formData.append('file', uploadForm.file);
            formData.append('status', 'DRAFT');

            // Format date for backend (YYYY-MM-DD) from UI format (MM/DD/YYYY)
            let backendDate = '';
            if (uploadForm.effectiveDate && uploadForm.effectiveDate.includes('/')) {
                const parts = uploadForm.effectiveDate.split('/');
                if (parts.length === 3) {
                    const [m, d, y] = parts;
                    backendDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                }
            }
            
            formData.append('effective_date', backendDate);
            formData.append('terms_content', uploadForm.terms_content || '');
            formData.append('notes', uploadForm.notes || '');
            formData.append('placed_fields', JSON.stringify([]));

            const res = await authFetch(`${API}/api/consent-templates/`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const newTemplate = await res.json();
                const processed = {
                    ...newTemplate,
                    id: newTemplate.id || newTemplate._id,
                    title: newTemplate.title?.replace(/CONCENT/g, 'CONSENT') || 'Untitled Protocol',
                    placedFields: typeof newTemplate.placed_fields === 'string' 
                        ? JSON.parse(newTemplate.placed_fields) 
                        : (newTemplate.placed_fields || [])
                };
                setConsents([processed, ...consents]);
                setActiveConsentId(processed.id);
                setUploadModalOpen(false);
                setUploadForm({ title: '', study: '', type: 'Main Consent', version: '1.0', irbNumber: '', effectiveDate: '', terms_content: '', notes: '', file: null });
                addToast('Protocol record initialized in secure vault', 'success');
            } else {
                const err = await res.json();
                addToast(err.detail || 'Failed to initialize registry record', 'error');
            }
        } catch (err) {
            console.error("Upload failed:", err);
            addToast("Sync Error", "error");
        }
    };

    const handleUpdateTemplate = async (templateId: string, updates: any) => {
        const backendUpdates: any = { ...updates };
        if (updates.placedFields) {
            backendUpdates.placed_fields = updates.placedFields;
            delete backendUpdates.placedFields;
        }

        try {
            const res = await authFetch(`${API}/api/consent-templates/${templateId}/`, {
                method: 'PATCH',
                body: JSON.stringify(backendUpdates)
            });
            if (res.ok) {
                const updated = await res.json();
                const processed = {
                    ...updated,
                    id: updated.id || updated._id,
                    placedFields: updated.placed_fields || []
                };
                setConsents(consents.map(c => c.id === processed.id ? processed : c));
                addToast('Protocol structure committed to secure vault', 'success');
            } else {
                const errData = await res.json();
                addToast(errData.detail || 'Sync failed', 'error');
            }
        } catch (err) {
            console.error("Template update failed:", err);
            addToast("Vault communication error", "error");
        }
    };

    const handleVerify = async (mode: 'COORDINATOR' | 'PI' = 'PI', signature?: string, name?: string) => {
        if (!activeRecord) return;
        try {
            const action = mode === 'COORDINATOR' ? 'coordinator_sign' : 'pi_verify';
            const payload: any = { 
                notes: piNotes,
                signature_data: signature,
                signer_name: name
            };

            const res = await authFetch(`${API}/api/consent/${activeRecord.id}/${action}/`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const updated = await res.json();
                setConsentRecords(consentRecords.map(r => r.id === updated.id ? { 
                    ...updated, 
                    piVerified: updated.pi_verified,
                    cc_signature: updated.cc_signature,
                    cc_name: updated.cc_name,
                    pi_name: updated.pi_name
                } : r));
                
                if (mode === 'COORDINATOR') {
                    addToast('Coordinator Signature captured and archived in PDF.', 'success');
                } else {
                    setActiveView('records');
                    addToast('PI Oversight verified. Protocol transition to FULLY_SIGNED.', 'success');
                }
            } else {
                const err = await res.json();
                addToast(err.detail || 'Verification sync failed', 'error');
            }
        } catch (err) {
            console.error("Verification failed:", err);
            addToast("Record sync failed", "error");
        }
    };

    const handleReject = async () => {
        if (!activeRecord) return;
        try {
            const res = await authFetch(`${API}/api/consent/${activeRecord.id}/reject/`, {
                method: 'POST',
                body: JSON.stringify({ reason: piNotes || 'Coordinator/PI Rejection' })
            });
            if (res.ok) {
                setConsentRecords(consentRecords.map(r => r.id === activeRecord.id ? { ...r, status: 'REJECTED', pi_verified: false } : r));
                setActiveView('records');
                addToast('Consent record successfully rejected and flagged', 'warning');
            }
        } catch (err) {
            console.error("Rejection failed:", err);
            addToast("Sync Error during rejection", "error");
        }
    };

    const S = {
        title: { fontSize: '22px', fontWeight: 900, fontStyle: 'italic' as const, textTransform: 'uppercase' as const, letterSpacing: '-0.02em', color: 'white' },
        badge: (c: string) => ({ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30`, padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, display: 'inline-flex', alignItems: 'center', gap: '4px' }),
        btnIndigo: { backgroundColor: COLORS.accent, color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)' },
        btnGhost: { backgroundColor: 'transparent', color: 'white', border: COLORS.border, padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }
    };

    if (loading && consents.length === 0) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#060a14] min-h-[800px]">
            <RefreshCw size={40} className="text-indigo-500 animate-spin mb-6" />
            <h1 style={S.title}>Synchronizing Consent Repository...</h1>
        </div>
    );

    // --- NEW ROLE-BASED STATE ---
    const [activeRole, setActiveRole] = useState<'participant' | 'coordinator' | 'pi' | 'super-admin'>('coordinator');
    const [activeSubTab, setActiveSubTab] = useState<'pending' | 'paper' | 'archive'>('pending');
    const [participantSubTab, setParticipantSubTab] = useState<'flow' | 'lar' | 'after-signing'>('after-signing');

    return (
        <div className="flex flex-col h-full bg-[#0B101B] overflow-hidden">
            {/* ... rest of header ... */}
            {/* --- NEW HEADER LAYOUT (Matching Images) --- */}
            <div className="p-6 lg:p-8 flex flex-col gap-8 bg-[#0B101B]">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 style={{ ...S.title, fontSize: '26px', margin: 0 }}>Informed <span className="text-white">consent</span></h1>
                            <div className="bg-orange-950/40 text-orange-200 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border border-orange-500/30">
                                Awaiting consent
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm font-medium">
                            {activeRecord?.study_title || 'Beat the Bloat Study'} - {activeRecord?.decrypted_name || 'Maria Johnson'} - <span className="text-white">Step 2 of enrollment</span>
                        </p>
                    </div>

                    {/* --- PROGRESS BAR (1-5) --- */}
                    <div className="flex items-center gap-4 lg:gap-8 overflow-x-auto pb-2 lg:pb-0">
                        {[
                            { step: 1, label: 'Eligibility confirmed' },
                            { step: 2, label: 'Consent sent' },
                            { step: 3, label: 'Participant signs' },
                            { step: 4, label: 'Coordinator co-signs' },
                            { step: 5, label: 'Archived & enrolled' }
                        ].map((s, idx) => (
                            <div key={s.step} className="flex items-center gap-4 shrink-0">
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${s.step < 3 ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : s.step === 3 ? 'bg-white/10 text-white border border-white/20' : 'bg-white/5 text-slate-600'}`}>
                                        {s.step}
                                    </div>
                                    <span className={`text-[9px] uppercase tracking-tighter font-bold text-center max-w-[70px] leading-tight ${s.step <= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {idx < 4 && <div className="w-8 lg:w-12 h-[1px] bg-white/10 mb-6" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- ROLE TABS --- */}
                <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 overflow-hidden">
                    {['participant', 'coordinator', 'pi', 'super-admin'].map((role) => (
                        <button
                            key={role}
                            onClick={() => setActiveRole(role as any)}
                            className={`flex-1 py-3 px-4 text-[10px] lg:text-[11px] font-black uppercase tracking-widest transition-all ${activeRole === role ? 'bg-emerald-500 text-black shadow-xl shadow-emerald-500/20 rounded-xl' : 'text-slate-400 hover:text-white'}`}
                        >
                            {role.replace('-', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden px-6 lg:px-8 pb-8">
                {activeRole === 'participant' && (
                    <div className="flex flex-col h-full gap-6">
                        {/* PARTICIPANT SUB-TABS */}
                        <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                            {[
                                { id: 'flow', label: 'E-consent flow' },
                                { id: 'lar', label: 'Minor / LAR flow' },
                                { id: 'after-signing', label: 'After signing' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setParticipantSubTab(tab.id as any)}
                                    className={`px-8 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${participantSubTab === tab.id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:text-white'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {participantSubTab === 'after-signing' && (
                                <div className="max-w-3xl mx-auto py-10">
                                    <div className="p-12 bg-white/5 border border-white/10 rounded-[40px] flex flex-col items-center text-center">
                                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-8">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <h2 className="text-white text-2xl font-black mb-3">Consent signed</h2>
                                        <p className="text-slate-400 text-sm mb-10 max-w-md">Your consent form has been submitted. The coordinator will co-sign and you will receive a copy by email.</p>
                                        
                                        <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                                            <div className="flex justify-between pb-4 border-b border-white/5">
                                                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Signed by</span>
                                                <span className="text-white font-bold">{activeRecord?.decrypted_name || 'Maria A. Johnson'}</span>
                                            </div>
                                            <div className="flex justify-between pb-4 border-b border-white/5">
                                                <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Date</span>
                                                <span className="text-white font-bold">Apr 24, 2026</span>
                                            </div>
                                            <div className="flex justify-between pb-4 border-b border-white/5">
                                                <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Co-sign status</span>
                                                <span className="text-orange-400 font-bold uppercase tracking-widest text-[10px]">Awaiting coordinator</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Document</span>
                                                <button className="text-indigo-400 font-bold text-xs hover:underline flex items-center gap-2"><Download size={14} /> Download PDF</button>
                                            </div>
                                        </div>
                                        
                                        <p className="mt-10 text-slate-500 text-[10px] font-medium tracking-tight uppercase">Document reference: ICF-BTB-2026-MJ-001 - Archived securely in MusB Research systems</p>
                                    </div>
                                </div>
                            )}

                            {participantSubTab === 'lar' && (
                                <div className="max-w-3xl mx-auto py-10">
                                    <div className="p-10 bg-white/5 border border-white/10 rounded-[40px]">
                                        <h3 className="text-white text-xl font-bold mb-2">Consent on behalf of a participant</h3>
                                        <p className="text-slate-400 text-xs mb-10 leading-relaxed italic">For minors, individuals with cognitive impairments, or those unable to consent independently. A legally authorized representative (LAR) must complete this form.</p>
                                        
                                        <div className="space-y-8">
                                            {/* PARTICIPANT INFO SECTION */}
                                            <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Participant Information</p>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Participant's full name</label>
                                                        <input type="text" placeholder="Full legal name" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-600" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date of birth</label>
                                                        <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-emerald-500/50 transition-all" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reason LAR consent is required</label>
                                                    <select className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-emerald-500/50 transition-all">
                                                        <option>Participant is a minor (under 18)</option>
                                                        <option>Cognitive impairment</option>
                                                        <option>Physical inability to sign</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* LAR SIGNATURE SECTION */}
                                            <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">LAR Signature</p>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">LAR full name</label>
                                                        <input type="text" placeholder="Legal name of representative" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-600" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Relationship to participant</label>
                                                        <input type="text" placeholder="e.g. Parent, Legal guardian" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-600" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Signature (type full name)</label>
                                                    <input type="text" placeholder="Type signature name here" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-600" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date</label>
                                                        <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-emerald-500/50 transition-all" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">City / location</label>
                                                        <input type="text" placeholder="Tampa, FL" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-600" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                                <input type="checkbox" className="mt-1" />
                                                <p className="text-slate-400 text-[11px] leading-relaxed">I confirm I am the legally authorized representative for the above participant, and I consent on their behalf to participate in this study.</p>
                                            </div>

                                            <button className="w-full py-5 bg-white/10 hover:bg-white/20 text-white font-black uppercase text-[12px] tracking-[0.2em] rounded-2xl transition-all border border-white/5 shadow-2xl">
                                                Submit LAR consent
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {participantSubTab === 'flow' && (
                                <ParticipantSignView 
                                    activeConsent={activeConsent}
                                    setActiveView={setActiveView}
                                    addToast={addToast}
                                />
                            )}
                        </div>
                    </div>
                )}
                {activeRole === 'coordinator' && (
                    <div className="flex flex-col h-full gap-6">
                        {/* COORDINATOR SUB-TABS */}
                        <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                            {[
                                { id: 'pending', label: 'Pending co-sign' },
                                { id: 'paper', label: 'Paper consent upload' },
                                { id: 'archive', label: 'Consent archive' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveSubTab(tab.id as any)}
                                    className={`px-8 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab.id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:text-white'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {activeSubTab === 'pending' && (
                                <div className="space-y-4">
                                    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Awaiting Coordinator Co-Signature</p>
                                        {consentRecords.filter(r => r.signing_status === 'AWAITING_COORDINATOR').map(record => (
                                            <div key={record.id} className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                                                        {record.decrypted_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-bold">{record.decrypted_name} — e-consent signed Apr 24, 2026</h4>
                                                        <p className="text-slate-500 text-xs">{record.study_title} - {record.protocol_id}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => { setActiveRecordId(record.id); setActiveView('pi-verify'); }} className="px-6 py-3 border border-white/20 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/5">Review form</button>
                                                    <button onClick={() => { setActiveRecordId(record.id); setActiveView('pi-verify'); }} className="px-6 py-3 bg-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/20">Co-sign now</button>
                                                </div>
                                            </div>
                                        ))}
                                        {consentRecords.filter(r => r.signing_status === 'AWAITING_COORDINATOR').length === 0 && (
                                            <div className="py-20 text-center text-slate-500 italic">No pending co-signatures</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeSubTab === 'archive' && (
                                <div className="space-y-4">
                                    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl">
                                        <div className="flex items-center justify-between mb-8">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Consent Document Archive — Beat the Bloat Study</p>
                                            <div className="flex gap-2">
                                                <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-2"><Download size={12} /> Export all</button>
                                                <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-2"><ClipboardList size={12} /> Download audit log</button>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {consentRecords.map(record => (
                                                <div key={record.id} className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.07] transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                                                            {record.decrypted_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-white font-bold text-sm">{record.decrypted_name}</h4>
                                                            <p className="text-slate-500 text-[10px]">{record.protocol_id} - E-consent - Signed Apr 24, 2026</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${record.signing_status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                                                            {record.signing_status === 'COMPLETED' ? 'Complete' : 'Pending'}
                                                        </span>
                                                        <button onClick={() => { setActiveRecordId(record.id); setActiveView('pi-verify'); }} className="px-6 py-2.5 bg-white/10 rounded-lg text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/20">View</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSubTab === 'paper' && (
                                <div className="max-w-3xl mx-auto py-10">
                                    <div className="p-10 bg-white/5 border border-white/10 rounded-[40px]">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Upload Signed Paper Consent Form</p>
                                        <p className="text-slate-400 text-xs mb-8 italic">For in-person studies where the participant signed a physical consent form on-site.</p>
                                        
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Participant</label>
                                                <select className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-emerald-500/50 transition-all">
                                                    <option>Maria Johnson</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date consent was signed (in person)</label>
                                                <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-emerald-500/50 transition-all" />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Witnessed by</label>
                                                <input type="text" placeholder="Name of coordinator or PI present" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-600" />
                                            </div>

                                            <div className="group relative py-12 border-2 border-dashed border-white/10 rounded-[30px] hover:border-emerald-500/30 transition-all cursor-pointer flex flex-col items-center justify-center bg-white/[0.01] hover:bg-emerald-500/[0.02]">
                                                <Upload className="text-slate-600 group-hover:text-emerald-400 mb-4 transition-all" size={24} />
                                                <p className="text-white text-xs font-bold mb-1">Upload scanned consent form (PDF or image)</p>
                                                <p className="text-slate-500 text-[10px]">Max 20 MB • PDF, JPG, PNG</p>
                                            </div>

                                            <div className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                                <input type="checkbox" className="mt-1" />
                                                <p className="text-slate-400 text-[11px] leading-relaxed">I confirm this is a complete, signed, and unaltered copy of the original paper consent form.</p>
                                            </div>

                                            <button className="w-full py-5 bg-white/10 hover:bg-white/20 text-white font-black uppercase text-[12px] tracking-[0.2em] rounded-2xl transition-all border border-white/5 shadow-2xl">
                                                Upload & Archive
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeRole === 'pi' && (
                    <div className="flex flex-col h-full gap-8 overflow-y-auto pr-2 custom-scrollbar">
                        {/* PI STATS */}
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Consent Status — All Participants</p>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Consented', value: '38', color: 'text-emerald-400' },
                                    { label: 'Awaiting co-sign', value: '3', color: 'text-orange-400' },
                                    { label: 'Paper pending', value: '1', color: 'text-rose-500' },
                                    { label: 'LAR consent', value: '2', color: 'text-white' }
                                ].map(stat => (
                                    <div key={stat.label} className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                        <h2 className={`text-2xl font-black mb-1 ${stat.color}`}>{stat.value}</h2>
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PI ATTENTION */}
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Consent Requiring PI Attention</p>
                            <div className="space-y-3">
                                {[
                                    { name: 'Maria Johnson', detail: 'participant has signed', sub: 'Awaiting coordinator co-signature', tag: 'ICF-BTB-2026-MJ-001', type: 'CO-SIGN' },
                                    { name: 'Anika Patel', detail: 'LAR consent (parent)', sub: 'Coordinator co-signed • Awaiting PI acknowledgment', tag: '', type: 'ACK' }
                                ].map(item => (
                                    <div key={item.name} className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-3xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                                                {item.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold">{item.name} — <span className="text-slate-400 font-normal italic">{item.detail}</span></h4>
                                                <p className="text-slate-500 text-[10px]">{item.sub} {item.tag && <span className="ml-2 font-mono text-[9px] px-1.5 py-0.5 bg-white/5 rounded border border-white/10">{item.tag}</span>}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {item.type === 'CO-SIGN' ? (
                                                <>
                                                    <button className="px-6 py-3 bg-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/20">Co-sign as PI</button>
                                                    <button className="px-6 py-3 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white">Return to coordinator</button>
                                                </>
                                            ) : (
                                                <button className="px-8 py-3 bg-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/20">Acknowledge</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PI LOGS */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="p-8 bg-white/5 border border-white/10 rounded-[32px]">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Consent Amendment Log</p>
                                <p className="text-slate-500 text-xs italic mb-8 leading-relaxed">No amendments to the consent form have been issued for this study. If a protocol change requires re-consent, PI can initiate re-consent from this panel.</p>
                                <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white flex items-center gap-3 ml-auto">
                                    Initiate re-consent
                                </button>
                            </div>
                            <div className="p-8 bg-white/5 border border-white/10 rounded-[32px]">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Audit Trail</p>
                                <div className="space-y-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
                                    {[
                                        { action: 'Maria Johnson signed e-consent', date: 'Apr 24, 2026 - 10:42 AM', sub: 'IP 68.184.xx.xx - Verified', status: 'emerald' },
                                        { action: 'Consent form sent to Maria Johnson', date: 'Apr 24, 2026 - 9:15 AM', sub: 'Sent by Jamie Lopez', status: 'emerald' },
                                        { action: 'Thomas Kim — e-consent complete (both signatures)', date: 'Apr 20, 2026', sub: 'Archived as ICF-BTB-2026-TK-002', status: 'emerald' },
                                        { action: 'Robert Walsh — paper consent upload pending', date: 'Apr 22, 2026', sub: 'Flagged for coordinator action', status: 'orange' }
                                    ].map(log => (
                                        <div key={log.action} className="pl-8 relative">
                                            <div className={`absolute left-1.5 top-1.5 w-2 h-2 rounded-full ring-4 ring-bg ${log.status === 'emerald' ? 'bg-emerald-400' : 'bg-orange-500'}`} />
                                            <h5 className="text-white font-bold text-[13px] mb-1">{log.action}</h5>
                                            <p className="text-slate-500 text-[10px] font-medium tracking-tight">{log.date} • {log.sub}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeRole === 'super-admin' && (
                    <div className="flex flex-col h-full gap-8 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="p-10 bg-white/5 border border-white/10 rounded-[40px]">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">All Studies — Consent Overview</p>
                            <div className="space-y-6">
                                {[
                                    { title: 'Beat the Bloat Study', sub: '38 of 42 enrolled - All consent forms on file - 1 paper pending' },
                                    { title: 'CardioWatch Study', sub: '22 of 22 enrolled - All consent forms complete' }
                                ].map(study => (
                                    <div key={study.title} className="flex items-center justify-between pb-6 border-b border-white/5 last:border-0 last:pb-0">
                                        <div>
                                            <h4 className="text-white font-bold text-lg mb-1">{study.title}</h4>
                                            <p className="text-slate-500 text-xs">{study.sub}</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">Compliant</span>
                                            <button className="px-8 py-3 bg-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/20">Report</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-10 bg-white/5 border border-white/10 rounded-[40px]">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">System-wide Consent Archive Controls</p>
                            <div className="space-y-8">
                                {[
                                    { label: 'Retention policy', val: 'All signed consent documents retained permanently - HIPAA-compliant storage', status: 'Configured', btn: 'Export' },
                                    { label: 'Encryption', val: 'AES-256 at rest - TLS 1.3 in transit - Access logged', status: 'Active', btn: 'Export' },
                                    { label: 'Audit log export', val: 'Full timestamp, IP, and user record for every consent action', status: '', btn: 'Export' },
                                    { label: 'Consent template management', val: 'Upload, version, and assign consent templates per study', status: '', btn: 'Manage' }
                                ].map(item => (
                                    <div key={item.label} className="flex items-center justify-between">
                                        <div>
                                            <h5 className="text-white font-bold text-base mb-1">{item.label}</h5>
                                            <p className="text-slate-500 text-xs">{item.val}</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            {item.status && <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${item.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>{item.status}</span>}
                                            <button className="px-8 py-3 bg-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/20 min-w-[120px]">{item.btn}</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <UploadConsentModal 
                isOpen={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                uploadForm={uploadForm}
                setUploadForm={setUploadForm}
                studies={studies}
                handleUpload={handleUpload}
            />

            <AuditDrawer
                isOpen={auditDrawerOpen}
                onClose={() => setAuditDrawerOpen(false)}
                record={activeRecord}
            />

            {/* TOAST SYSTEM */}
            <div className="fixed bottom-10 right-10 z-[200] flex flex-col gap-4">
                <AnimatePresence>
                    {toasts.map(t => (
                        <motion.div key={t.id} initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} style={{ padding: '1.25rem 2.5rem', backgroundColor: t.type === 'error' ? COLORS.danger : t.type === 'warning' ? COLORS.warning : COLORS.success, color: 'white', borderRadius: '12px', fontWeight: 900, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {t.type === 'success' ? <CheckCircle2 size={16} /> : <Filter size={16} />}
                            {t.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* CONFIRMATION MODAL */}
            <AnimatePresence>
                {confirmModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '100%', maxWidth: '500px', backgroundColor: COLORS.bg, border: COLORS.border, borderRadius: '24px', padding: '3rem', textAlign: 'center' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)', border: COLORS.border, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: COLORS.warning }}><RefreshCw size={32} /></div>
                            <h3 style={{ ...S.title, fontSize: '20px', marginBottom: '1rem' }}>Clinical Governance Action</h3>
                            <p style={{ color: COLORS.text, fontSize: '15px', lineHeight: '1.6', marginBottom: '2.5rem' }}>{confirmModal.message}</p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button style={{ ...S.btnGhost, flex: 1 }} onClick={() => setConfirmModal(null)}>Cancel</button>
                                <button style={{ ...S.btnIndigo, flex: 1, backgroundColor: confirmModal.type === 'danger' ? COLORS.danger : COLORS.accent }} onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }}>Confirm Action</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
