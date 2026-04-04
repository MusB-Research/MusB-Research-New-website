import React from 'react';
import { X, Plus, Save } from 'lucide-react';
import { COLORS } from '../ConsentConstants';

interface UploadConsentModalProps {
    isOpen: boolean;
    onClose: () => void;
    uploadForm: any;
    setUploadForm: (form: any) => void;
    studies: any[];
    handleUpload: () => void;
}

export const UploadConsentModal: React.FC<UploadConsentModalProps> = ({
    isOpen,
    onClose,
    uploadForm,
    setUploadForm,
    studies,
    handleUpload
}) => {
    if (!isOpen) return null;

    const S = {
        title: { fontSize: '22px', fontWeight: 900, fontStyle: 'italic' as const, textTransform: 'uppercase' as const, letterSpacing: '-0.02em', color: 'white' },
        label: { fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: COLORS.text, opacity: 0.6 },
        btnIndigo: { backgroundColor: COLORS.accent, color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)' },
        btnGhost: { backgroundColor: 'transparent', color: 'white', border: COLORS.border, padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
        input: { width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', border: COLORS.border, borderRadius: '8px', padding: '1rem 1.5rem', color: 'white', fontSize: '16px', outline: 'none' }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: COLORS.modalOverlay, backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ width: '100%', maxWidth: '900px', backgroundColor: COLORS.bg, borderRadius: '24px', border: COLORS.border, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 100px rgba(0,0,0,0.8)' }}>
                <div style={{ padding: '2rem 3rem', borderBottom: COLORS.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={S.title}>Informed Consent Registry Node</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: COLORS.text, cursor: 'pointer' }}><X size={24} /></button>
                </div>
                
                <div style={{ padding: '3rem', flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label style={S.label}>Protocol Identity</label>
                                <input style={S.input} placeholder="e.g. Main Informed Consent" value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label style={S.label}>Functional Assignment</label>
                                <select 
                                    style={S.input} 
                                    value={uploadForm.study} 
                                    onChange={e => setUploadForm({...uploadForm, study: e.target.value})}
                                >
                                    <option value="">Select Study Cluster...</option>
                                    {studies.map(s => <option key={s.id} value={s.id || s.protocol_id}>{s.title || s.protocol_id}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <label style={S.label}>Version</label>
                                    <input style={S.input} value={uploadForm.version} onChange={e => setUploadForm({...uploadForm, version: e.target.value})} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <label style={S.label}>IRB Cluster ID</label>
                                    <input style={S.input} placeholder="e.g. 25-028" value={uploadForm.irbNumber} onChange={e => setUploadForm({...uploadForm, irbNumber: e.target.value})} />
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ backgroundColor: 'rgba(99,102,241,0.05)', border: `2px dashed ${COLORS.accent}`, borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', cursor: 'pointer' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.accent }}>
                                    <Plus size={32} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '15px', fontWeight: 900, color: 'white', marginBottom: '0.5rem' }}>LOAD PROTOCOL PDF</div>
                                    <div style={{ fontSize: '12px', color: COLORS.label, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Max Encrypted Payload: 50MB</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label style={S.label}>Governance Traceability Notes</label>
                                <textarea style={{ ...S.input, height: '120px', resize: 'none' }} placeholder="Functional revision notes..." value={uploadForm.notes} onChange={e => setUploadForm({...uploadForm, notes: e.target.value})} />
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '2rem 3rem', borderTop: COLORS.border, background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'flex-end', gap: '1.5rem' }}>
                    <button style={S.btnGhost} onClick={onClose}>Abandon Node</button>
                    <button style={S.btnIndigo} onClick={handleUpload}><Save size={18} /> Initialize Record</button>
                </div>
            </div>
        </div>
    );
};
