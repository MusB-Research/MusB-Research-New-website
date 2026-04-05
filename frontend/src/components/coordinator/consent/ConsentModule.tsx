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
    const [uploadForm, setUploadForm] = useState({ title: '', study: '', type: 'Main Consent', version: '1.0', irbNumber: '', irbApprovalDate: '', effectiveDate: '', expirationDate: '', language: 'English', notes: '', file: null });

    const [toasts, setToasts] = useState<{ id: string, type: string, message: string }[]>([]);
    const [confirmModal, setConfirmModal] = useState<{ message: string, onConfirm: () => void, type?: string, confirmLabel?: string } | null>(null);

    // Derived Data
    const activeConsent = useMemo(() => consents.find(c => c.id === activeConsentId), [consents, activeConsentId]);
    const activeRecord = useMemo(() => consentRecords.find(r => r.id === activeRecordId), [consentRecords, activeRecordId]);

    // Initial Data Load
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const queryStr = selectedStudyId ? `?study_id=${selectedStudyId}` : '';
                const [templatesRes, recordsRes, studiesRes] = await Promise.all([
                    authFetch(`${API}/api/consent-templates/${queryStr}`).then(res => res.json()),
                    authFetch(`${API}/api/consent/${queryStr}`).then(res => res.json()),
                    authFetch(`${API}/api/studies/`).then(res => res.json())
                ]);
                
                const correctedTemplates = (templatesRes || []).map((t: any) => ({
                    ...t,
                    id: t.id || t._id, // Handle Mongo ID variations
                    title: t.title?.replace(/Baet/g, 'Beat') || 'Untitled Protocol',
                    signatureRequirements: t.signatureRequirements || {
                        participantSignature: true,
                        participantDate: true,
                        ccSignature: true,
                        piVerification: true
                    },
                    placedFields: t.placedFields || t.placed_fields || []
                }));
                
                setConsents(correctedTemplates);
                setConsentRecords((recordsRes || []).map((r: any) => ({ ...r, id: r.id || r._id })));
                setStudies((studiesRes || []).map((s: any) => ({ ...s, id: s.id || s._id })));
                
                if (correctedTemplates.length > 0 && !activeConsentId) {
                    setActiveConsentId(correctedTemplates[0].id);
                }
            } catch (err) {
                console.error("Failed to fetch consent data:", err);
                setError("Clinical data connection failed. Check backend status.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedStudyId]);

    const addToast = useCallback((message: string, type = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev.slice(-2), { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    const handleUpload = async () => {
        try {
            const res = await authFetch(`${API}/api/consent-templates/`, {
                method: 'POST',
                body: JSON.stringify({
                    title: uploadForm.title,
                    study: uploadForm.study,
                    version: uploadForm.version,
                    status: 'DRAFT',
                    irb_number: uploadForm.irbNumber,
                    placed_fields: []
                })
            });
            if (res.ok) {
                const newTemplate = await res.json();
                setConsents([newTemplate, ...consents]);
                setActiveConsentId(newTemplate.id);
                setUploadModalOpen(false);
                addToast('Protocol record initialized in secure vault', 'success');
            }
        } catch (err) {
            console.error("Upload failed:", err);
            addToast("Sync Error", "error");
        }
    };

    const handleVerify = async () => {
        if (!activeRecord) return;
        try {
            const res = await authFetch(`${API}/api/consent/${activeRecord.id}/`, {
                method: 'PATCH',
                body: JSON.stringify({ pi_verified: true, notes: piNotes })
            });
            if (res.ok) {
                const updated = await res.json();
                setConsentRecords(consentRecords.map(r => r.id === updated.id ? { ...updated, piVerified: updated.pi_verified } : r));
                setActiveView('records');
                addToast('Protocol verified and locked for clinical entry', 'success');
            } else {
                const errData = await res.json();
                addToast(errData.detail || 'Verification sync failed', 'error');
            }
        } catch (err) {
            console.error("Verification failed:", err);
            addToast("Record sync failed", "error");
        }
    };

    const handleUpdateTemplate = async (templateId: string, updates: any) => {
        try {
            const res = await authFetch(`${API}/api/consent-templates/${templateId}/`, {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                const updated = await res.json();
                const processed = {
                    ...updated,
                    id: updated.id || updated._id,
                    placedFields: updated.placedFields || updated.placed_fields || []
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
        badge: (c: string) => ({ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30`, padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' as const, display: 'inline-flex', alignItems: 'center', gap: '4px' }),
        btnIndigo: { backgroundColor: COLORS.accent, color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)' },
        btnGhost: { backgroundColor: 'transparent', color: 'white', border: COLORS.border, padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }
    };

    if (loading) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#060a14] min-h-[800px]">
            <RefreshCw size={40} className="text-indigo-500 animate-spin mb-6" />
            <h1 style={S.title}>Synchronizing Consent Repository...</h1>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#0B101B]">
            {/* MODULE TAB NAV */}
            <div className="px-6 lg:px-10 py-6 lg:py-8 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#0B101B] sticky top-0 z-40">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <FileText size={28} />
                    </div>
                    <div>
                        <h1 style={S.title}>Informed <span className="text-indigo-400">Consent</span></h1>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 italic">Protocol Regulatory & E-Signature Command</p>
                    </div>
                </div>
                <div className="flex items-center bg-white/5 p-2 rounded-2xl border border-white/10 w-full md:w-auto">
                    {[
                        { id: 'builder', label: 'Protocol Builder', icon: Columns },
                        { id: 'records', label: 'Registry Logs', icon: ClipboardList }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveView(tab.id)}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeView === tab.id || (activeView === 'signature-setup' && tab.id === 'builder') ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                        >
                            <tab.icon size={16} /> {tab.label}
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
                        setAuditDrawerRecordId={setActiveRecordId /* reuse */}
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
                        <motion.div key={t.id} initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} style={{ padding: '1.25rem 2.5rem', backgroundColor: t.type === 'error' ? COLORS.danger : t.type === 'warning' ? COLORS.warning : COLORS.success, color: 'white', borderRadius: '12px', fontWeight: 900, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.1em', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
