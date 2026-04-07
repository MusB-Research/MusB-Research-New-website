import React from 'react';
import { User, Shield, Edit2, Lock, Unlock, Trash2, MoreVertical } from 'lucide-react';
import { COLORS, TeamMember } from '../TeamConstants';

interface TeamCardProps {
    member: TeamMember;
    onEdit: (member: TeamMember) => void;
    onDelete: (member: TeamMember) => void;
    onStatusToggle: (member: TeamMember) => void;
    activeRowMenu: string | null;
    setActiveRowMenu: (id: string | null) => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({
    member,
    onEdit,
    onDelete,
    onStatusToggle,
    activeRowMenu,
    setActiveRowMenu
}) => {
    const isMusB = member.type === 'MusB';

    const S = {
        td: { padding: '2rem', backgroundColor: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.06)' },
        name: { fontSize: '15px', fontWeight: 900, fontStyle: 'italic' as const, textTransform: 'uppercase' as const, color: 'white', marginBottom: '8px', letterSpacing: '-0.01em' },
        badge: (c: string) => ({ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30`, padding: '0.5rem 1.25rem', borderRadius: '4px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, display: 'inline-flex', alignItems: 'center', gap: '6px' }),
        btnGhost: { backgroundColor: 'transparent', color: COLORS.text, border: `1px solid ${COLORS.border}`, padding: '0.75rem 1.25rem', borderRadius: '6px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer' }
    };

    return (
        <tr className="hover:bg-white/[0.03] transition-all group relative">
            <td style={S.td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }} className="group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10">
                        <User size={24} className="text-slate-400 group-hover:text-indigo-400" />
                    </div>
                    <div>
                        <div style={S.name}>{member.name}</div>
                        <div style={{ fontSize: '12px', color: COLORS.text, fontWeight: 700, letterSpacing: '0.02em' }}>{member.email}</div>
                    </div>
                </div>
            </td>
            <td style={S.td}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{member.role}</div>
                {member.expertise && <div style={{ fontSize: '12px', color: COLORS.accent, marginTop: '8px', fontWeight: 800, textTransform: 'uppercase', fontStyle: 'italic' }}>{member.expertise}</div>}
            </td>
            <td style={S.td}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {member.assignedStudies.length > 0 ? member.assignedStudies.map(s => (
                        <span key={s} style={{ ...S.badge(COLORS.accent), padding: '0.5rem 1rem' }}>{s}</span>
                    )) : <span style={{ fontSize: '13px', color: COLORS.label, fontWeight: 900, letterSpacing: '0.1em' }}>NO ACTIVE ASSIGNMENTS</span>}
                </div>
            </td>
            <td style={{ ...S.td }}>
                <span style={S.badge(member.status === 'Active' ? COLORS.success : COLORS.danger)}>{member.status}</span>
            </td>
            <td style={{ ...S.td, textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', position: 'relative' }}>
                    {!isMusB ? (
                        <div className="relative">
                            <button 
                                style={{ ...S.btnGhost, padding: '0.75rem' }} 
                                onClick={(e) => { e.stopPropagation(); setActiveRowMenu(activeRowMenu === member.id ? null : member.id); }}
                                className="hover:bg-white/10 hover:text-white transition-all flex items-center justify-center border border-white/10 rounded-lg"
                            >
                                <MoreVertical size={18} />
                            </button>

                            {activeRowMenu === member.id && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-40" 
                                        onClick={() => setActiveRowMenu(null)}
                                    />
                                    <div style={{
                                        position: 'absolute', right: 0, top: '120%',
                                        backgroundColor: '#0B101B', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px', zIndex: 50, width: '240px',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden'
                                    }}>
                                        <button 
                                            className="w-full p-5 flex items-center gap-4 text-[12px] font-black uppercase text-slate-300 hover:bg-white/5 hover:text-white transition-all text-left border-b border-white/5"
                                            onClick={() => { onEdit(member); setActiveRowMenu(null); }}
                                        >
                                            <Edit2 size={16} className="text-indigo-400" /> Edit Personnel
                                        </button>
                                        <button 
                                            className="w-full p-5 flex items-center gap-4 text-[12px] font-black uppercase text-slate-300 hover:bg-white/5 hover:text-white transition-all text-left border-b border-white/5"
                                            onClick={() => { onStatusToggle(member); setActiveRowMenu(null); }}
                                        >
                                            {member.status === 'Inactive' ? <><Unlock size={16} className="text-emerald-400" /> Activate Access</> : <><Lock size={16} className="text-amber-400" /> Revoke Access</>}
                                        </button>
                                        <button 
                                            className="w-full p-5 flex items-center gap-4 text-[12px] font-black uppercase text-rose-400 hover:bg-rose-500/10 transition-all text-left"
                                            onClick={() => { onDelete(member); setActiveRowMenu(null); }}
                                        >
                                            <Trash2 size={16} /> Registry Purge
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div style={S.badge(COLORS.label)} className="opacity-60 bg-white/5 border border-white/10"><Shield size={16} /> Network Node</div>
                    )}
                </div>
            </td>
        </tr>
    );
};



