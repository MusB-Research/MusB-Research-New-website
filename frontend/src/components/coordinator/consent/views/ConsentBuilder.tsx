import React from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, ZoomOut, ZoomIn, MousePointer2, User, ShieldCheck, FileSearch, Edit3 } from 'lucide-react';
import { COLORS, ConsentTemplate } from '../ConsentConstants';
import { PDFPage } from '../components/PDFPage';

interface ConsentBuilderProps {
    consents: ConsentTemplate[];
    activeConsentId: string | null;
    setActiveConsentId: (id: string) => void;
    leftSearch: string;
    setLeftSearch: (s: string) => void;
    leftFilter: string;
    setLeftFilter: (f: string) => void;
    currentViewerPage: number;
    setCurrentViewerPage: (p: (prev: number) => number | number) => void;
    viewerZoom: number;
    setViewerZoom: (z: (prev: number) => number | number) => void;
    thumbnailOpen: boolean;
    setActiveView: (view: string) => void;
    setUploadModalOpen: (open: boolean) => void;
    addToast: (msg: string, type?: string) => void;
}

export const ConsentBuilder: React.FC<ConsentBuilderProps> = ({
    consents,
    activeConsentId,
    setActiveConsentId,
    leftSearch,
    setLeftSearch,
    leftFilter,
    setLeftFilter,
    currentViewerPage,
    setCurrentViewerPage,
    viewerZoom,
    setViewerZoom,
    thumbnailOpen,
    setActiveView,
    setUploadModalOpen,
    addToast
}) => {
    const activeConsent = consents.find(c => c.id === activeConsentId);
    
    const filteredConsents = consents.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(leftSearch.toLowerCase()) || c.study.toLowerCase().includes(leftSearch.toLowerCase());
        const matchesFilter = leftFilter === 'All' || c.status.toUpperCase() === leftFilter.toUpperCase();
        return matchesSearch && matchesFilter;
    });

    const S = {
        title: { fontSize: '22px', fontWeight: 900, fontStyle: 'italic' as const, textTransform: 'uppercase' as const, letterSpacing: '-0.02em', color: 'white' },
        label: { fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: COLORS.text, opacity: 0.6 },
        badge: (c: string) => ({ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30`, padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' as const, display: 'inline-flex', alignItems: 'center', gap: '4px' }),
        btnIndigo: { backgroundColor: COLORS.accent, color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)' },
        btnGhost: { backgroundColor: 'transparent', color: 'white', border: COLORS.border, padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
        input: { backgroundColor: 'rgba(255,255,255,0.03)', border: COLORS.border, borderRadius: '8px', padding: '1rem 1.5rem', color: 'white', fontSize: '16px', outline: 'none' }
    };

    return (
        <div className="flex flex-col 2xl:flex-row flex-1 overflow-visible 2xl:overflow-hidden">
            {/* LEFT PANEL */}
            <div className="w-full 2xl:w-[320px] border-b 2xl:border-b-0 2xl:border-r border-white/10 flex flex-col">
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
                <div className="p-6 lg:p-10 border-t border-white/10 bg-[#0B101B]/50 mt-auto">
                    <button style={{ ...S.btnIndigo, width: '100%', padding: '1.25rem' }} onClick={() => setUploadModalOpen(true)} className="hover:scale-[1.02] transition-transform shadow-xl shadow-indigo-500/10">
                        <Plus size={20} className="mr-3" /> NEW CONSENT PDF
                    </button>
                </div>
            </div>

            {/* CENTER PANEL */}
            <div className="flex-1 bg-[#060a14] flex flex-col min-h-[700px] 2xl:min-h-0">
                <div className="px-6 lg:px-10 py-6 lg:py-8 border-b border-white/10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-[#0B101B]/80 backdrop-blur-xl sticky top-0 z-30">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 lg:gap-10 w-full xl:w-auto">
                        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/10 w-full md:w-auto justify-center md:justify-start">
                            <button style={{ ...S.btnGhost, padding: '0.6rem' }} onClick={() => setCurrentViewerPage(p => Math.max(1, p-1))}><ChevronLeft size={16} /></button>
                            <span className="text-[12px] font-black uppercase tracking-widest text-white italic min-w-[120px] text-center">PAGE {currentViewerPage} / {activeConsent?.pageCount || 0}</span>
                            <button style={{ ...S.btnGhost, padding: '0.6rem' }} onClick={() => setCurrentViewerPage(p => Math.min(activeConsent?.pageCount || 1, p+1))}><ChevronRight size={16} /></button>
                        </div>
                        <div className="hidden md:block h-8 w-px bg-white/10" />
                        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/10 w-full md:w-auto justify-center md:justify-start">
                            <button style={{ ...S.btnGhost, padding: '0.6rem' }} onClick={() => setViewerZoom(z => Math.max(60, z-5))}><ZoomOut size={16} /></button>
                            <span className="text-[12px] font-black text-indigo-400 min-w-[50px] text-center font-mono">{viewerZoom}%</span>
                            <button style={{ ...S.btnGhost, padding: '0.6rem' }} onClick={() => setViewerZoom(z => Math.min(100, z+5))}><ZoomIn size={16} /></button>
                        </div>
                    </div>
                    <div className="w-full xl:w-auto grid grid-cols-2 md:grid-cols-3 xl:flex items-center gap-4 lg:gap-5">
                        <button style={{ ...S.btnIndigo, width: '100%' }} onClick={() => setActiveView('signature-setup')} className="hover:scale-[1.02] transition-transform">
                            <MousePointer2 size={18} /> <span className="hidden md:inline">Setup Signatures</span><span className="md:hidden">Setup</span>
                        </button>
                        <button style={{ ...S.btnGhost, width: '100%' }} onClick={() => setActiveView('participant-sign')} className="hover:bg-white/5 transition-colors">
                            <User size={18} /> <span className="hidden md:inline">Preview Signing</span><span className="md:hidden">Preview</span>
                        </button>
                        {activeConsent?.status === 'Active' && (
                            <div className="md:col-span-1 border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 px-6 py-4 rounded-xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest italic animate-pulse">
                                <ShieldCheck size={18} /> READ ONLY
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col 2xl:flex-row h-full">
                    {thumbnailOpen && (
                        <div className="w-full 2xl:w-[180px] bg-black/30 border-b 2xl:border-b-0 2xl:border-r border-white/10 overflow-x-auto 2xl:overflow-y-auto p-6 flex 2xl:flex-col gap-6 custom-scrollbar">
                            {activeConsent && Array.from({ length: activeConsent.pageCount }).map((_, i) => (
                                <div key={i} onClick={() => setCurrentViewerPage(i + 1)} className={`shrink-0 mb-0 2xl:mb-4 opacity-${currentViewerPage === i + 1 ? '100' : '40'} border-2 border-${currentViewerPage === i + 1 ? 'indigo-500' : 'transparent'}`}>
                                    <PDFPage pageNumber={i + 1} isThumbnail={true} placedFields={activeConsent?.placedFields || []} />
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-10 2xl:p-20 flex flex-col items-center gap-10 range-min-h-[600px] 2xl:min-h-0 bg-[#060a14]/50">
                        {activeConsent ? (
                            <PDFPage pageNumber={currentViewerPage} placedFields={activeConsent.placedFields} width={`${viewerZoom}%`} />
                        ) : (
                            <div className="mt-[20vh] flex flex-col items-center text-slate-500">
                                <FileSearch size={80} className="opacity-10 mb-8" />
                                <span style={{ ...S.title, display: 'block' }}>Select a protocol to preview</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
