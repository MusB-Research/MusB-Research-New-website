import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Save, CheckCircle2, Calendar, Globe, Tag } from 'lucide-react';
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
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const hiddenDateRef = React.useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const S = {
        title: { fontSize: '24px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '-0.02em', color: 'white' },
        label: { fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '8px', display: 'block' },
        btnIndigo: { backgroundColor: '#6366f1', color: 'white', border: 'none', padding: '1.25rem 2.5rem', borderRadius: '12px', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
        btnGhost: { backgroundColor: 'transparent', color: '#64748b', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' as const, cursor: 'pointer' },
        input: { width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1rem 1.25rem', color: 'white', fontSize: '15px', outline: 'none' },
        iconInputOuter: { position: 'relative' as const, display: 'flex', alignItems: 'center' }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadForm({ ...uploadForm, file: e.target.files[0] });
        }
    };

    const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isoV = e.target.value;
        if (isoV) {
            const [y, m, d] = isoV.split('-');
            setUploadForm({ ...uploadForm, effectiveDate: `${m}/${d}/${y}` });
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ width: '100%', maxWidth: '950px', backgroundColor: '#0f172a', borderRadius: '24px', border: '1px solid #1e293b', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>

                {/* HEADER */}
                <div style={{ padding: '2rem 3rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={S.title}>Upload Consent Form</h3>
                        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Add a new consent document to the system</p>
                    </div>
                    <button onClick={onClose} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                {/* BODY */}
                <div style={{ padding: '3rem', flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 350px', gap: '3rem' }}>

                        {/* LEFT COLUMN: IDENTIFICATION (SIMPLIFIED) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div>
                                <label style={S.label}>Assign to Study</label>
                                <select 
                                    style={S.input} 
                                    value={uploadForm.study} 
                                    onChange={e => {
                                        const selectedStudy = studies.find(s => String(s.id) === String(e.target.value));
                                        setUploadForm({ 
                                            ...uploadForm, 
                                            study: e.target.value,
                                            title: selectedStudy ? `CONSENT - ${selectedStudy.protocol_id || selectedStudy.title}` : uploadForm.title
                                        });
                                    }}
                                >
                                    <option value="">Select a study...</option>
                                    {Array.isArray(studies) && studies.map(s => (
                                        <option key={s?.id} value={s?.id || s?.protocol_id} className="bg-[#0f172a]">
                                            {s?.protocol_id ? `${s.protocol_id} - ` : ''}{s?.title || 'Untitled Study'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ padding: '2rem', backgroundColor: '#1E293B', borderRadius: '16px', border: '1px solid #334155' }}>
                                <p style={{ fontSize: '11px', fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1.5rem', fontStyle: 'italic' }}>Automated Clinical Registry</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #ffffff05' }}>
                                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Registry Identity:</span>
                                        <span style={{ fontSize: '13px', color: 'white', fontWeight: 800, fontStyle: 'italic' }}>{uploadForm.title || '(PENDING STUDY SELECTION)'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #ffffff05' }}>
                                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Protocol Map:</span>
                                        <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 800 }}>ACTIVE PROTOCOL v1.0</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Access Tier:</span>
                                        <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 800 }}>SECURED ACCESS</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: REPOSITORY & EXTRACTION */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="application/pdf" />
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    backgroundColor: uploadForm.file ? 'rgba(34, 197, 94, 0.05)' : 'rgba(30, 41, 59, 0.5)',
                                    border: `2px dashed ${uploadForm.file ? '#22c55e' : '#334155'}`,
                                    borderRadius: '20px',
                                    padding: '4rem 2rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                className="group hover:bg-white/[0.02]"
                            >
                                <div style={{ width: '64px', height: '64px', borderRadius: '22px', backgroundColor: uploadForm.file ? 'rgba(34, 197, 94, 0.1)' : 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: uploadForm.file ? '#22c55e' : '#6366f1' }}>
                                    {uploadForm.file ? <CheckCircle2 size={32} /> : <Plus size={32} />}
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {uploadForm.file ? uploadForm.file.name : 'Upload Consent PDF'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                                    {uploadForm.file ? 'PDF Secured & Ready for Parsing' : 'High-fidelity text extraction will occur automatically'}
                                </div>
                            </div>

                            {uploadForm.file && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{ padding: '1.5rem', backgroundColor: '#0f172a', border: '1px solid #22c55e/30', borderRadius: '16px' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <Tag size={14} className="text-emerald-400" />
                                        <span style={{ fontSize: '11px', fontWeight: 900, color: '#22c55e', textTransform: 'uppercase' }}>Protocol Terms Extraction</span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
                                        System is extracting exact text packets... Participant will review the high-fidelity render of this document during the eConsent sequence.
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div style={{ padding: '2rem 3rem', backgroundColor: '#0f172a', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'flex-end', gap: '1.5rem' }}>
                    <button style={S.btnGhost} onClick={onClose}>Cancel</button>
                    <button style={S.btnIndigo} onClick={handleUpload}><Save size={20} /> Save Form</button>
                </div>
            </div>
        </div>
    );
};
