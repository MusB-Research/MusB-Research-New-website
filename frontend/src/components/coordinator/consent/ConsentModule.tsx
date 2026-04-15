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
    Filter
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

export default function ConsentModule({ selectedStudyId }: { selectedStudyId?: string }) {
    // API State
    const [consents, setConsents] = useState<ConsentTemplate[]>([]);
    const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
    const [studies, setStudies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            const [templatesRes, recordsRes, studiesRes] = await Promise.all([
                authFetch(`${API}/api/consent-templates/${queryStr}`).then(res => res.json()),
                authFetch(`${API}/api/consent/${queryStr}`).then(res => res.json()),
                authFetch(`${API}/api/studies/`).then(res => res.json())
            ]);
            
            const rawTemplates = templatesRes.results || templatesRes || [];
            const rawRecords = recordsRes.results || recordsRes || [];
            const rawStudies = studiesRes.results || studiesRes || [];

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
            setStudies(rawStudies.map((s: any) => ({ ...s, id: s.id || s._id })));
            
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

    return (
        <div className="flex flex-col h-full bg-[#0B101B]">
            {/* MODULE TAB NAV */}
            <div className="py-4 lg:py-6 px-4 md:px-6 lg:px-10 2xl:px-14 border-b border-white/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[#0B101B] sticky top-0 z-40">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <FileText size={24} className="lg:w-7 lg:h-7" />
                    </div>
                    <div>
                        <h1 style={{ ...S.title, fontSize: '18px' }} className="lg:text-[22px]">Informed <span className="text-indigo-400">Consent</span></h1>
                        <p className="text-[10px] lg:text-[12px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 italic leading-none">Protocol Regulatory & E-Signature Command</p>
                    </div>
                </div>
                <div className="flex items-center bg-white/5 p-1.5 md:p-2 rounded-2xl border border-white/10 w-full lg:w-auto">
                    {[
                        { id: 'builder', label: 'Protocol Builder', icon: Columns },
                        { id: 'records', label: 'Registry Logs', icon: ClipboardList }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveView(tab.id)}
                            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 lg:px-8 py-2.5 md:py-3 rounded-xl text-[11px] md:text-[12px] font-black uppercase tracking-widest transition-all ${activeView === tab.id || (activeView === 'signature-setup' && tab.id === 'builder') ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                        >
                            <tab.icon size={14} className="md:w-4 md:h-4" /> <span className="whitespace-nowrap">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                {activeView === 'builder' && (
                    <ConsentBuilder 
                        consents={consents}
                        activeConsentId={activeConsentId}
                        setActiveConsentId={setActiveConsentId}
                        leftSearch={leftSearch}
                        setLeftSearch={setLeftSearch}
                        leftFilter={leftFilter}
                        setLeftFilter={setLeftFilter}
                        currentViewerPage={currentViewerPage}
                        setCurrentViewerPage={setCurrentViewerPage}
                        viewerZoom={viewerZoom}
                        setViewerZoom={setViewerZoom}
                        thumbnailOpen={thumbnailOpen}
                        setActiveView={setActiveView}
                        setUploadModalOpen={setUploadModalOpen}
                        handleUpdateTemplate={handleUpdateTemplate}
                        addToast={addToast}
                    />
                )}

                {activeView === 'records' && (
                    <ConsentRegistry 
                        consentRecords={consentRecords}
                        recordsFilter={recordsFilter}
                        setRecordsFilter={setRecordsFilter}
                        recordsSearch={recordsSearch}
                        setRecordsSearch={setRecordsSearch}
                        setActiveRecordId={setActiveRecordId}
                        setActiveView={setActiveView}
                        setAuditDrawerRecordId={setActiveRecordId}
                        setAuditDrawerOpen={setAuditDrawerOpen}
                    />
                )}

                {activeView === 'signature-setup' && (
                    <SignatureConfiguration 
                        activeConsent={activeConsent}
                        setActiveView={setActiveView}
                        setConfirmModal={setConfirmModal}
                        addToast={addToast}
                        signatureActiveField={signatureActiveField}
                        setSignatureActiveField={setSignatureActiveField}
                        currentViewerPage={currentViewerPage}
                        consents={consents}
                        setConsents={setConsents}
                        handleUpdateTemplate={handleUpdateTemplate}
                    />
                )}

                {activeView === 'pi-verify' && (
                    <PIVerification 
                        activeRecord={activeRecord}
                        activeConsent={activeConsent}
                        setActiveView={setActiveView}
                        piDocTab={piDocTab}
                        setPiDocTab={setPiDocTab}
                        piSignature={piSignature}
                        setPiSignature={setPiSignature}
                        piNotes={piNotes}
                        setPiNotes={setPiNotes}
                        handleVerify={handleVerify}
                        handleReject={handleReject}
                        addToast={addToast}
                    />
                )}

                {activeView === 'participant-sign' && (
                    <ParticipantSignView 
                        activeConsent={activeConsent}
                        setActiveView={setActiveView}
                        addToast={addToast}
                    />
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
