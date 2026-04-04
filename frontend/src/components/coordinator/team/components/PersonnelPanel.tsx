import React from 'react';
import { X, Upload, CheckCircle2, ShieldCheck } from 'lucide-react';
import { COLORS, TeamMember, ROLE_DOCS, PROTOCOLS } from '../TeamConstants';

interface PersonnelPanelProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'add' | 'edit';
    editedMember: Partial<TeamMember>;
    setEditedMember: (member: Partial<TeamMember>) => void;
    handleSave: () => void;
    handleActivate: () => void;
    triggerUpload: (docId: string) => void;
}

export const PersonnelPanel: React.FC<PersonnelPanelProps> = ({
    isOpen,
    onClose,
    mode,
    editedMember,
    setEditedMember,
    handleSave,
    handleActivate,
    triggerUpload
}) => {
    const S = {
        title: { fontSize: '22px', fontWeight: 900, fontStyle: 'italic' as const, textTransform: 'uppercase' as const, letterSpacing: '-0.02em', color: 'white' },
        label: { fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: COLORS.label },
        input: { width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', border: COLORS.border, borderRadius: '4px', padding: '1rem', color: 'white', fontSize: '12px', outline: 'none', marginTop: '0.5rem' },
        btnIndigo: { backgroundColor: COLORS.accent, color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)' },
        btnGhost: { backgroundColor: 'transparent', color: 'white', border: COLORS.border, padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
        badge: (c: string) => ({ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30`, padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' as const, display: 'inline-flex', alignItems: 'center', gap: '4px' }),
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, pointerEvents: isOpen ? 'auto' : 'none' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', opacity: isOpen ? 1 : 0, transition: 'opacity 0.4s' }} onClick={onClose} />
            <div style={{ position: 'absolute', right: 0, top: 0, width: '720px', height: '100%', backgroundColor: COLORS.bgDark, borderLeft: `1px solid ${COLORS.accent}30`, transform: isOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '2rem 3rem', borderBottom: COLORS.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={S.title}>{mode === 'add' ? 'INITIALIZE PERSONNEL NODE' : 'MODIFY TEAM MEMBER'}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: COLORS.text, cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '3.5rem' }} className="custom-scrollbar">
                    <section style={{ marginBottom: '3.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ width: '4px', height: '18px', backgroundColor: COLORS.accent, borderRadius: '2px' }} />
                            <h4 style={{ ...S.title, fontSize: '15px' }}>Identity & Domain</h4>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <label style={S.label}>Full Identity Name</label>
                                <input style={S.input} value={editedMember.name || ''} onChange={e => setEditedMember({ ...editedMember, name: e.target.value })} />
                            </div>
                            <div>
                                <label style={S.label}>Functional Role</label>
                                <select style={{ ...S.input, fontSize: '15px', fontWeight: 900, textTransform: 'uppercase' }} value={editedMember.role} onChange={e => {
                                    const role = e.target.value;
                                    setEditedMember({
                                        ...editedMember,
                                        role,
                                        documents: (ROLE_DOCS[role] || ['CV']).map(name => ({
                                            id: Math.random().toString(36).substr(2, 9),
                                            name, status: 'Missing', isRequired: true
                                        }))
                                    });
                                }}>
                                    {Object.keys(ROLE_DOCS).map(r => <option key={r} value={r} style={{ backgroundColor: '#0B101B', color: 'white' }}>{r.toUpperCase()}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={S.label}>Communications (Email)</label>
                                <input style={S.input} value={editedMember.email || ''} onChange={e => setEditedMember({ ...editedMember, email: e.target.value })} />
                            </div>
                            <div>
                                <label style={S.label}>Encrypted Direct Line</label>
                                <input style={S.input} value={editedMember.phone || ''} onChange={e => setEditedMember({ ...editedMember, phone: e.target.value })} />
                            </div>
                        </div>
                    </section>

                    <section style={{ marginBottom: '3.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ width: '4px', height: '18px', backgroundColor: COLORS.accent, borderRadius: '2px' }} />
                            <h4 style={{ ...S.title, fontSize: '15px' }}>Authorization & Scope</h4>
                        </div>
                        <label style={{ ...S.label, marginBottom: '1rem' }}>Protocol Assignment Nodes</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2.5rem' }}>
                            {PROTOCOLS.map(p => {
                                const selected = editedMember.assignedStudies?.includes(p);
                                return (
                                    <button key={p}
                                        onClick={() => setEditedMember({
                                            ...editedMember,
                                            assignedStudies: selected
                                                ? editedMember.assignedStudies?.filter(s => s !== p)
                                                : [...(editedMember.assignedStudies || []), p]
                                        })}
                                        style={{
                                            ...S.btnGhost, padding: '0.6rem 1.25rem',
                                            border: `1px solid ${selected ? COLORS.accent : COLORS.border}`,
                                            backgroundColor: selected ? `${COLORS.accent}20` : 'transparent',
                                            color: selected ? 'white' : COLORS.text, fontSize: '10px'
                                        }}
                                    >{p}</button>
                                );
                            })}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <label style={S.label}>Encryption Clearance</label>
                                <select style={S.input} value={editedMember.permissionLevel} onChange={e => setEditedMember({ ...editedMember, permissionLevel: e.target.value as any })}>
                                    <option value="Full">LEVEL 3: FULL ACCESS</option>
                                    <option value="Limited">LEVEL 2: WRITE ACCESS</option>
                                    <option value="Read-only">LEVEL 1: READ ONLY</option>
                                </select>
                            </div>
                            <div>
                                <label style={S.label}>Clinical Expertise</label>
                                <input style={S.input} value={editedMember.expertise || ''} onChange={e => setEditedMember({ ...editedMember, expertise: e.target.value })} />
                            </div>
                        </div>
                    </section>

                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ width: '4px', height: '18px', backgroundColor: COLORS.accent, borderRadius: '2px' }} />
                            <h4 style={{ ...S.title, fontSize: '15px' }}>Credentials Vault ({editedMember.documents?.filter(d => d.status === 'Valid').length}/{editedMember.documents?.length})</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {editedMember.documents?.map(doc => (
                                <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: COLORS.border }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        {doc.status === 'Valid' ? <CheckCircle2 size={18} color={COLORS.success} /> : <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px dashed ${COLORS.label}` }} />}
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 900, color: 'white' }}>{doc.name}</div>
                                            <div style={{ fontSize: '10px', color: COLORS.label }}>{doc.status === 'Valid' ? `Uploaded: ${doc.uploadDate}` : 'Pending Verification'}</div>
                                        </div>
                                    </div>
                                    <button style={{ ...S.btnGhost, padding: '0.5rem 1.25rem', borderColor: doc.status === 'Valid' ? COLORS.success : COLORS.accent, color: doc.status === 'Valid' ? COLORS.success : 'white' }} onClick={() => triggerUpload(doc.id)}>
                                        <Upload size={14} style={{ marginRight: '8px' }} /> {doc.status === 'Valid' ? 'REPLACE' : 'UPLOAD'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div style={{ padding: '2rem 3.5rem', borderTop: COLORS.border, background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '1rem' }}>
                    <button style={{ ...S.btnGhost, flex: 1 }} onClick={onClose}>ABORT</button>
                    {editedMember.status === 'Draft' && (mode === 'edit' || true) && (
                        <button style={{ ...S.btnGhost, flex: 1, borderColor: COLORS.success, color: COLORS.success }} onClick={handleActivate}>ACTIVATE NODE</button>
                    )}
                    <button style={{ ...S.btnIndigo, flex: 2 }} onClick={handleSave}><ShieldCheck size={18} /> COMMIT TO REGISTRY</button>
                </div>
            </div>
        </div>
    );
};
