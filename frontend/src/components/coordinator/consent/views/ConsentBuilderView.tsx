import React from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, ZoomOut, ZoomIn, MousePointer2, User, ShieldCheck, Edit3 } from 'lucide-react';
import { COLORS } from '../ConsentConstants';
import { PDFPage } from '../components/PDFPage';

interface BuilderProps {
    consents: any[];
    setConsents: (c: any[]) => void;
    activeConsentId: string | null;
    setActiveConsentId: (id: string | null) => void;
    leftSearch: string;
    setLeftSearch: (s: string) => void;
    leftFilter: string;
    setLeftFilter: (f: string) => void;
    currentViewerPage: number;
    setCurrentViewerPage: (p: any) => void;
    viewerZoom: number;
    setViewerZoom: (z: any) => void;
    setActiveView: (v: string) => void;
    setUploadModalOpen: (o: boolean) => void;
    thumbnailOpen: boolean;
    activeConsent: any;
    filteredConsents: any[];
    addToast: (msg: string, type?: string) => void;
    setConfirmModal: (m: any) => void;
    studies: any[];
}

const S = {
    badge: (c: string) => ({ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30`, padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '11px', fontWeight: 900 as const, textTransform: 'uppercase' as const, display: 'inline-flex', alignItems: 'center', gap: '4px' }),
    title: { fontSize: '22px', fontWeight: 900 as const, fontStyle: 'italic' as const, textTransform: 'uppercase' as const, letterSpacing: '-0.02em', color: 'white' },
    label: { fontSize: '12px', fontWeight: 900 as const, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: COLORS.text, opacity: 0.6 },
    btnIndigo: { backgroundColor: COLORS.accent, color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900 as const, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)' },
    btnGhost: { backgroundColor: 'transparent', color: 'white', border: COLORS.border, padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900 as const, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    input: { backgroundColor: 'rgba(255,255,255,0.03)', border: COLORS.border, borderRadius: '8px', padding: '1rem 1.5rem', color: 'white', fontSize: '16px', outline: 'none' }
};

export const ConsentBuilderView: React.FC<BuilderProps> = (props) => {
    const { 
        consents, setConsents, activeConsentId, setActiveConsentId, leftSearch, setLeftSearch, leftFilter, setLeftFilter, 
        currentViewerPage, setCurrentViewerPage, viewerZoom, setViewerZoom, setActiveView, setUploadModalOpen, 
        thumbnailOpen, activeConsent, filteredConsents, addToast, setConfirmModal, studies 
    } = props;

    return (
        <div className="flex flex-col 2xl:flex-row flex-1 overflow-visible 2xl:overflow-hidden h-full">
            {/* LEFT PANEL */}
            <div className="w-full 2xl:w-[320px] border-b 2xl:border-b-0 2xl:border-r border-white/10 flex flex-col">
                <div style={{ padding: '1.5rem', borderBottom: COLORS.border }}>
                    <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                        <Search size={14} color={COLORS.label} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input style={{ ...S.input, width: '100%', paddingLeft: '2.25rem' }} placeholder="Search Consents..." value={leftSearch} onChange={e => setLeftSearch(e.target.value)} />
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
                <div className="p-6 border-t border-white/10 bg-[#0B101B]/50 mt-auto">
                    <button style={{ ...S.btnIndigo, width: '100%' }} onClick={() => setUploadModalOpen(true)}>
                        <Plus size={18} className="mr-2" /> NEW CONSENT PDF
                    </button>
                </div>
            </div>

            {/* CENTER PANEL */}
            <div className="flex-1 bg-[#060a14] flex flex-col min-h-[700px] 2xl:min-h-0">
                <div className="px-6 lg:px-10 py-6 lg:py-8 border-b border-white/10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-[#0B101B]/80 backdrop-blur-xl sticky top-0 z-30">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 lg:gap-10 w-full xl:w-auto">
                        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/10 w-full md:w-auto justify-center md:justify-start font-mono">
                            <button style={{ ...S.btnGhost, padding: '0.6rem' }} onClick={() => setCurrentViewerPage((p: number) => Math.max(1, p-1))}><ChevronLeft size={16} /></button>
                            <span className="text-[12px] font-black uppercase tracking-widest text-white italic min-w-[120px] text-center">PAGE {currentViewerPage} / {activeConsent?.pageCount || 0}</span>
                            <button style={{ ...S.btnGhost, padding: '0.6rem' }} onClick={() => setCurrentViewerPage((p: number) => Math.min(activeConsent?.pageCount || 1, p+1))}><ChevronRight size={16} /></button>
                        </div>
                        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/10 w-full md:w-auto justify-center md:justify-start">
                            <button style={{ ...S.btnGhost, padding: '0.6rem' }} onClick={() => setViewerZoom((z: number) => Math.max(60, z-5))}><ZoomOut size={16} /></button>
                            <span className="text-[12px] font-black text-indigo-400 min-w-[50px] text-center font-mono">{viewerZoom}%</span>
                            <button style={{ ...S.btnGhost, padding: '0.6rem' }} onClick={() => setViewerZoom((z: number) => Math.min(100, z+5))}><ZoomIn size={16} /></button>
                        </div>
                    </div>
                    <div className="w-full xl:w-auto grid grid-cols-2 md:grid-cols-3 xl:flex items-center gap-4 lg:gap-5">
                        <button style={{ ...S.btnIndigo, width: '100%' }} onClick={() => setActiveView('signature-setup')}>
                            <MousePointer2 size={18} /> <span className="hidden md:inline">Setup Signatures</span><span className="md:hidden">Setup</span>
                        </button>
                        <button style={{ ...S.btnGhost, width: '100%' }} onClick={() => setActiveView('participant-sign')}>
                            <User size={18} /> <span className="hidden md:inline">Preview Signing</span><span className="md:hidden">Preview</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {thumbnailOpen && (
                        <div className="w-full 2xl:w-[180px] bg-black/30 border-b border-white/10 overflow-x-auto p-6 flex 2xl:flex-col gap-6 custom-scrollbar">
                            {activeConsent && Array.from({ length: activeConsent.pageCount }).map((_, i) => (
                                <div key={i} onClick={() => setCurrentViewerPage(i + 1)} className={`shrink-0 mb-0 2xl:mb-4 opacity-${currentViewerPage === i + 1 ? '100' : '40'} border-2 border-${currentViewerPage === i + 1 ? 'indigo-500' : 'transparent'}`}>
                                    <PDFPage pageNumber={i + 1} isThumbnail={true} placedFields={activeConsent?.placedFields || []} />
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-10 2xl:p-20 flex flex-col items-center gap-10 bg-[#060a14]/50">
                        {activeConsent ? (
                            <PDFPage pageNumber={currentViewerPage} placedFields={activeConsent.placedFields} width={`${viewerZoom}%`} />
                        ) : (
                            <div className="mt-[20vh] flex flex-col items-center text-slate-500 opacity-20"><Plus size={80} /> <h2 style={S.title}>No Protocol Selected</h2></div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="w-full 2xl:w-[380px] border-t 2xl:border-t-0 2xl:border-l border-white/10 p-10 2xl:p-8 flex flex-col gap-10 overflow-y-auto custom-scrollbar bg-[#0B101B]/30">
                <div>
                   <label style={S.label}>Protocol Metadata</label>
                   <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div><span style={{ fontSize: '12px', color: COLORS.text, opacity: 0.5 }}>Title</span><div style={{ fontSize: '15px', color: 'white', fontWeight: 900, marginTop: '0.6rem' }}>{activeConsent?.title}</div></div>
                        <div className="grid grid-cols-2 gap-6">
                            <div><span style={{ fontSize: '12px', color: COLORS.text, opacity: 0.5 }}>Study ID</span><div style={{ fontSize: '13px', color: 'white', marginTop: '0.6rem', fontWeight: 900 }}>{activeConsent?.study}</div></div>
                            <div><span style={{ fontSize: '12px', color: COLORS.text, opacity: 0.5 }}>IRB Approval</span><div style={{ fontSize: '13px', color: 'white', marginTop: '0.6rem', fontWeight: 900 }}>{activeConsent?.irbApprovalDate}</div></div>
                        </div>
                    </div>
                </div>

                <div>
                    <label style={S.label}>Signatory Guard Matrix</label>
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { l: 'Participant Signature', v: activeConsent?.signatureRequirements.participantSignature, db: 'require_participant_sig' },
                            { l: 'CC Verification', v: activeConsent?.signatureRequirements.ccSignature, db: 'require_cc_verification' },
                            { l: 'PI Final Sign-off', v: activeConsent?.signatureRequirements.piVerification, db: 'require_pi_signoff' }
                        ].map(row => (
                            <div key={row.l} className="flex justify-between items-center bg-white/[0.02] p-3 rounded-lg"><span style={{ fontSize: '14px', color: 'white', fontWeight: 'bold' }}>{row.l}</span>{row.v ? <ShieldCheck size={20} color={COLORS.success} /> : <Plus size={20} color={COLORS.danger} />}</div>
                        ))}
                    </div>
                </div>

                <div className="mt-auto border-t border-white/10 pt-8 flex flex-col gap-4">
                    <button style={{ ...S.btnIndigo, width: '100%', justifyContent: 'center' }} onClick={() => addToast('Governance settings committed')}>COMMIT CHANGES</button>
                    <button style={{ ...S.btnGhost, width: '100%', borderColor: COLORS.success, color: COLORS.success, justifyContent: 'center' }} onClick={() => {
                        if (!activeConsent) return;
                        setConfirmModal({
                            message: `Publishing will activate version ${activeConsent.version} globally. Proceed?`,
                            onConfirm: () => addToast('Protocol Publish Initiated', 'success')
                        });
                    }}>PUBLISH PROTOCOL v{activeConsent?.version}</button>
                </div>
            </div>
        </div>
    );
};
