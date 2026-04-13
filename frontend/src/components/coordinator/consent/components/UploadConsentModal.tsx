import React, { useState } from 'react';
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

                        {/* LEFT COLUMN */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div>
                                <label style={S.label}>Form Name</label>
                                <input style={S.input} placeholder="e.g. Main Consent" value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={S.label}>Assign to Study</label>
                                    <select style={S.input} value={uploadForm.study} onChange={e => setUploadForm({ ...uploadForm, study: e.target.value })}>
                                        <option value="">Select a study...</option>
                                        {Array.isArray(studies) && studies.map(s => (
                                            <option key={s?.id} value={s?.id || s?.protocol_id} className="bg-[#0f172a]">
                                                {s?.protocol_id ? `${s.protocol_id} - ` : ''}{s?.title || 'Untitled Study'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={S.label}>Form Type</label>
                                    <select style={S.input} value={uploadForm.type} onChange={e => setUploadForm({ ...uploadForm, type: e.target.value })}>
                                        <option value="Main Consent">Main Consent</option>
                                        <option value="Amendment">Amendment</option>
                                        <option value="Assent Form">Assent Form</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={S.label}>Version</label>
                                    <input style={{ ...S.input, textAlign: 'center' }} value={uploadForm.version} onChange={e => setUploadForm({ ...uploadForm, version: e.target.value })} />
                                </div>
                                <div>
                                    <label style={S.label}>IRB ID Number</label>
                                    <input style={S.input} placeholder="e.g. 25-028" value={uploadForm.irbNumber} onChange={e => setUploadForm({ ...uploadForm, irbNumber: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div style={S.iconInputOuter} onClick={() => {
                                    if (hiddenDateRef.current && typeof (hiddenDateRef.current as any).showPicker === 'function') {
                                        (hiddenDateRef.current as any).showPicker();
                                    } else {
                                        hiddenDateRef.current?.click();
                                    }
                                }}>
                                    <Calendar size={16} style={{ position: 'absolute', left: '1rem', color: '#6366f1' }} />
                                    <input
                                        type="text"
                                        placeholder="MM/DD/YYYY"
                                        style={{ ...S.input, paddingLeft: '2.75rem' }}
                                        value={uploadForm.effectiveDate}
                                        onChange={e => setUploadForm({ ...uploadForm, effectiveDate: e.target.value })}
                                        readOnly
                                    />
                                    <input
                                        type="date"
                                        ref={hiddenDateRef}
                                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                                        onChange={handlePickerChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={S.label}>Language</label>
                                <select style={S.input} value={uploadForm.language} onChange={e => setUploadForm({ ...uploadForm, language: e.target.value })}>
                                    <option value="English">English</option>
                                    <option value="Spanish">Spanish</option>
                                </select>
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="application/pdf" />
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    backgroundColor: uploadForm.file ? 'rgba(34, 197, 94, 0.05)' : 'rgba(30, 41, 59, 0.5)',
                                    border: `2px dashed ${uploadForm.file ? '#22c55e' : '#334155'}`,
                                    borderRadius: '20px',
                                    padding: '3rem 1.5rem',
                                    textAlign: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: uploadForm.file ? 'rgba(34, 197, 94, 0.1)' : 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: uploadForm.file ? '#22c55e' : '#6366f1' }}>
                                    {uploadForm.file ? <CheckCircle2 size={32} /> : <Plus size={32} />}
                                </div>
                                <div style={{ fontSize: '15px', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                                    {uploadForm.file ? uploadForm.file.name : 'Upload PDF File'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                    Max file size: 50MB
                                </div>
                            </div>

                            <div>
                                <label style={S.label}>Protocol Terms Content</label>
                                <textarea
                                    style={{ ...S.input, height: '180px', resize: 'none', marginBottom: '1.5rem' }}
                                    placeholder="Paste the actual clinical consent terms here... participants will review this text before signing."
                                    value={uploadForm.terms_content || ''}
                                    onChange={e => setUploadForm({ ...uploadForm, terms_content: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={S.label}>Short Notes (Internal Only)</label>
                                <textarea style={{ ...S.input, height: '100px', resize: 'none' }} placeholder="Additional internal details..." value={uploadForm.notes} onChange={e => setUploadForm({ ...uploadForm, notes: e.target.value })} />
                            </div>
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
