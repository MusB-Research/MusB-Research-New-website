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
import { COLORS, ConsentTemplate, ConsentRecord, AuditEntry } from './ConsentConstants';
import { ConsentBuilder } from './views/ConsentBuilder';
import { ConsentRegistry } from './views/ConsentRegistry';
import { SignatureConfiguration } from './views/SignatureConfiguration';
import { PIVerification } from './views/PIVerification';
import { UploadConsentModal } from './components/UploadConsentModal';

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
                const [templatesRes, recordsRes, studiesRes] = await Promise.all([
                    fetch('/api/consent-templates/').then(res => res.json()),
                    fetch('/api/consent/').then(res => res.json()),
                    fetch('/api/studies/').then(res => res.json())
                ]);
                
                const correctedTemplates = (templatesRes || []).map((t: any) => ({
                    ...t,
                    title: t.title?.replace(/Baet/g, 'Beat') || 'Untitled Protocol',
                    signatureRequirements: t.signatureRequirements || {
                        participantSignature: true,
                        participantDate: true,
                        ccSignature: true,
                        piVerification: true
                    },
                    placedFields: t.placed_fields || []
                }));
                
                setConsents(correctedTemplates);
                setConsentRecords(recordsRes || []);
                setStudies(studiesRes || []);
                
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
    }, []);

    const addToast = useCallback((message: string, type = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev.slice(-2), { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    const handleUpload = async () => {
        try {
            const res = await fetch('/api/consent-templates/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
            const res = await fetch(`/api/consent/${activeRecord.id}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pi_verified: true, notes: piNotes })
            });
            if (res.ok) {
                const updated = await res.json();
                setConsentRecords(consentRecords.map(r => r.id === updated.id ? updated : r));
                setActiveView('records');
                addToast('Protocol verified and locked for clinical entry', 'success');
            }
        } catch (err) {
            console.error("Verification failed:", err);
            addToast("Record sync failed", "error");
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
                        setAuditDrawerOpen={() => {}} /* placeholder */
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
                        handleReject={() => addToast('Rejection logic pending', 'warning')}
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
