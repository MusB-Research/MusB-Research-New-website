import React from 'react';
import { ArrowLeft, Clock, ShieldCheck, CheckSquare, MousePointer2 } from 'lucide-react';
import { COLORS } from '../ConsentConstants';
import { PDFPage } from '../components/PDFPage';

interface VerifyProps {
    activeRecord: any;
    activeConsent: any;
    setActiveView: (v: string) => void;
    piDocTab: string;
    setPiDocTab: (t: string) => void;
    piSignature: boolean;
    setPiSignature: (s: boolean) => void;
    addToast: (msg: string, type?: string) => void;
}

const S = {
    badge: (c: string) => ({ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30`, padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '11px', fontWeight: 900 as const, textTransform: 'uppercase' as const, display: 'inline-flex', alignItems: 'center', gap: '4px' }),
    title: { fontSize: '22px', fontWeight: 900 as const, fontStyle: 'italic' as const, textTransform: 'uppercase' as const, letterSpacing: '-0.02em', color: 'white' },
    label: { fontSize: '12px', fontWeight: 900 as const, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: COLORS.text, opacity: 0.6 },
    btnIndigo: { backgroundColor: COLORS.accent, color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900 as const, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)' },
    btnGhost: { backgroundColor: 'transparent', color: 'white', border: COLORS.border, padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900 as const, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }
};

export const PIVerifyView: React.FC<VerifyProps> = (props) => {
    const { 
        activeRecord, activeConsent, setActiveView, piDocTab, setPiDocTab, piSignature, setPiSignature, addToast 
    } = props;

    return (
        <div style={{ flex: 1, display: 'flex', backgroundColor: '#060a14' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem 3rem', borderBottom: COLORS.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bg }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <button style={S.btnGhost} onClick={() => setActiveView('records')}><ArrowLeft size={16} /> Back to Registry</button>
                        <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.25rem' }}>
                            <button onClick={() => setPiDocTab('signed')} className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest ${piDocTab === 'signed' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Signed Record</button>
                            <button onClick={() => setPiDocTab('original')} className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest ${piDocTab === 'original' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>IRB Original</button>
                        </div>
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }} className="p-20 flex justify-center custom-scrollbar">
                    <PDFPage pageNumber={12} placedFields={activeConsent?.placedFields || []} width="800px" signedFields={['Participant Signature', 'Participant Date', 'CC Signature']} activeRecord={activeRecord} />
                </div>
            </div>

            <div style={{ width: '440px', borderLeft: COLORS.border, padding: '3.5rem', display: 'flex', flexDirection: 'column', gap: '3.5rem', backgroundColor: COLORS.bg, overflowY: 'auto' }} className="custom-scrollbar shadow-2xl">
                <div>
                    <h2 style={{ ...S.title, fontSize: '26px' }}>Protocol Verification</h2>
                    <div className="mt-4 flex gap-4">
                        <span style={S.label}>Participant:</span>
                        <span className="text-[12px] font-black text-indigo-400 italic bg-indigo-400/5 px-2 rounded-md tracking-tighter">{activeRecord?.full_name || activeRecord?.participantId}</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <label style={S.label}>Governance Checklist</label>
                    <div className="flex flex-col gap-3">
                        {[
                            { l: 'Protocol v1.0 Integrity Confirmed', v: true },
                            { l: 'Participant Identity Verified', v: true },
                            { l: 'CC Signature Node Authenticated', v: true },
                            { l: 'Manual Sign-off Capture Enabled', v: true }
                        ].map(row => (
                            <div key={row.l} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-xl"><CheckSquare size={18} color={COLORS.success} /><span className="text-[13px] font-bold text-white tracking-tight">{row.l}</span></div>
                        ))}
                    </div>
                </div>

                <div onClick={() => { setPiSignature(!piSignature); if(!piSignature) addToast('PI Verification captured'); }} className={`py-12 border-2 ${piSignature ? 'border-indigo-600 bg-indigo-600/5' : 'border-dashed border-white/10'} rounded-2xl text-center cursor-pointer transition-all hover:scale-[1.02] active:scale-95`}>
                    {piSignature ? (
                        <div className="flex flex-col items-center gap-3">
                            <div style={{ fontFamily: 'cursive', fontSize: '32px', color: COLORS.accent }}>Dr. Yadav — PI</div>
                            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] italic">Validated {new Date().toLocaleTimeString()}</div>
                        </div>
                    ) : (
                        <div className="opacity-30 group flex flex-col items-center gap-4">
                            <div className="p-4 rounded-full border border-white/20 group-hover:scale-110 transition-transform"><MousePointer2 size={32} /></div>
                            <div style={S.label}>Apply PI Sign-off</div>
                        </div>
                    )}
                </div>

                {piSignature && (
                    <button style={{ ...S.btnIndigo, width: '100%', padding: '1.25rem', justifyContent: 'center' }} onClick={() => { addToast('Protocol finalized and encrypted'); setActiveView('records'); }}>COMMIT TO AUDIT LOG</button>
                )}
            </div>
        </div>
    );
};
