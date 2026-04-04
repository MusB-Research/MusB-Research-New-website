import React from 'react';
import { ArrowLeft, Trash2, Save } from 'lucide-react';
import { COLORS } from '../ConsentConstants';
import { PDFPage } from '../components/PDFPage';

interface SetupProps {
    activeConsent: any;
    setConsents: (c: any[]) => void;
    consents: any[];
    signatureActiveField: string | null;
    setSignatureActiveField: (s: string | null) => void;
    currentViewerPage: number;
    addToast: (msg: string, type?: string) => void;
    setConfirmModal: (m: any) => void;
    setActiveView: (v: string) => void;
}

const S = {
    title: { fontSize: '22px', fontWeight: 900 as const, fontStyle: 'italic' as const, textTransform: 'uppercase' as const, letterSpacing: '-0.02em', color: 'white' },
    label: { fontSize: '12px', fontWeight: 900 as const, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: COLORS.text, opacity: 0.6 },
    btnIndigo: { backgroundColor: COLORS.accent, color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900 as const, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)' },
    btnGhost: { backgroundColor: 'transparent', color: 'white', border: COLORS.border, padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900 as const, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }
};

export const SignatureSetupView: React.FC<SetupProps> = (props) => {
    const { 
        activeConsent, setConsents, consents, signatureActiveField, setSignatureActiveField, 
        currentViewerPage, addToast, setConfirmModal, setActiveView 
    } = props;

    return (
        <div className="flex flex-col flex-1 h-full">
            <div className="px-12 py-6 border-b border-white/5 flex justify-between items-center bg-[#0B101B]">
                <div className="flex items-center gap-6">
                    <button style={S.btnGhost} onClick={() => setActiveView('builder')}><ArrowLeft size={16} /> Back to Builder</button>
                    <div className="h-6 w-px bg-white/10" />
                    <h2 style={S.title}>Signature Configuration Engine</h2>
                </div>
                <div className="flex gap-4">
                    <button style={{ ...S.btnGhost, color: COLORS.danger, borderColor: COLORS.danger }} onClick={() => setConfirmModal({ message: 'Wipe all fields?', onConfirm: () => addToast('Cleared', 'warning') })}><Trash2 size={16} /> Clear All</button>
                    <button style={S.btnIndigo} onClick={() => { setActiveView('builder'); addToast('Signature mappings committed'); }}><Save size={16} /> Save Mappings</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-[280px] border-r border-white/5 p-8 bg-black/20 overflow-y-auto">
                    <label style={S.label}>Field Registry</label>
                    <div className="mt-8 flex flex-col gap-3">
                        {[
                            { l: 'Participant Signature', c: COLORS.success },
                            { l: 'Participant Date', c: COLORS.info },
                            { l: 'Participant Initials', c: COLORS.warning },
                            { l: 'CC Signature', c: COLORS.accent },
                            { l: 'PI Verification', c: '#f43f5e' }
                        ].map(tool => (
                            <button 
                                key={tool.l}
                                onClick={() => setSignatureActiveField(tool.l)}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all border ${signatureActiveField === tool.l ? 'bg-indigo-500/10 border-indigo-500' : 'bg-white/5 border-transparent'} group`}
                            >
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: tool.c }} />
                                <span className={`text-[11px] font-black uppercase tracking-widest ${signatureActiveField === tool.l ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}>{tool.l}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 bg-[#060a14] overflow-y-auto p-20 flex justify-center custom-scrollbar">
                    <div 
                        onClick={(e) => {
                            if (!signatureActiveField || !activeConsent) return;
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                            const y = ((e.clientY - rect.top) / rect.height) * 100;
                            const newField = { id: 'f' + Date.now(), type: signatureActiveField, page: currentViewerPage, x, y };
                            const updated = { ...activeConsent, placedFields: [...activeConsent.placedFields, newField] };
                            setConsents(consents.map(c => c.id === updated.id ? updated : c));
                            addToast(`Mapped [${signatureActiveField}] at ${Math.round(x)}% x ${Math.round(y)}%`, 'info');
                        }}
                        className="relative cursor-crosshair shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                    >
                        <PDFPage pageNumber={currentViewerPage} placedFields={activeConsent?.placedFields || []} width="800px" />
                    </div>
                </div>

                <div className="w-[320px] border-l border-white/5 p-8 overflow-y-auto custom-scrollbar">
                    <label style={S.label}>Coordinate Stack</label>
                    <div className="mt-8 flex flex-col gap-3">
                        {activeConsent?.placedFields.filter((f: any) => f.page === currentViewerPage).map((f: any) => (
                            <div key={f.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center group">
                                <div><div className="text-[11px] font-black text-white uppercase italic">{f.type}</div><div className="text-[9px] text-slate-500 uppercase tracking-widest">P{f.page} · {Math.round(f.x)}%:{Math.round(f.y)}%</div></div>
                                <button className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                                    const updated = { ...activeConsent, placedFields: activeConsent.placedFields.filter((field: any) => field.id !== f.id) };
                                    setConsents(consents.map(c => c.id === updated.id ? updated : c));
                                }}><Trash2 size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
