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
        td: { padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.04)' },
        name: { fontSize: '14px', fontWeight: 900, fontStyle: 'italic' as const, textTransform: 'uppercase' as const, color: 'white', marginBottom: '6px', letterSpacing: '-0.02em' },
        badge: (c: string) => ({ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30`, padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' as const, display: 'inline-flex', alignItems: 'center', gap: '4px' }),
        btnGhost: { backgroundColor: 'transparent', color: COLORS.text, border: `1px solid ${COLORS.border}`, padding: '0.6rem 1rem', borderRadius: '4px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer' }
    };

    return (
        <tr className="hover:bg-white/[0.02] transition-colors relative">
            <td style={S.td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={20} color={COLORS.label} />
                    </div>
                    <div>
                        <div style={S.name}>{member.name}</div>
                        <div style={{ fontSize: '11px', color: COLORS.text, fontWeight: 'bold' }}>{member.email}</div>
                    </div>
                </div>
            </td>
            <td style={S.td}>
                <div style={{ fontSize: '12px', fontWeight: 900, color: COLORS.text, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{member.role}</div>
                {member.expertise && <div style={{ fontSize: '11px', color: COLORS.accent, marginTop: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}>{member.expertise}</div>}
            </td>
            <td style={S.td}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                    {member.assignedStudies.length > 0 ? member.assignedStudies.map(s => (
                        <span key={s} style={{ ...S.badge(COLORS.accent), padding: '0.4rem 0.8rem' }}>{s}</span>
                    )) : <span style={{ fontSize: '14px', color: COLORS.label, fontWeight: 900 }}>NO ASSIGNMENTS</span>}
                </div>
            </td>
            <td style={{ ...S.td, textAlign: 'center' }}>
                <span style={S.badge(member.status === 'Active' ? COLORS.success : COLORS.label)}>{member.status}</span>
            </td>
            <td style={{ ...S.td, textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', position: 'relative' }}>
                    {!isMusB ? (
                        <div>
                            <button 
                                style={{ ...S.btnGhost, padding: '0.5rem' }} 
                                onClick={(e) => { e.stopPropagation(); setActiveRowMenu(activeRowMenu === member.id ? null : member.id); }}
                            >
                                <MoreVertical size={16} />
                            </button>

                            {activeRowMenu === member.id && (
                                <div style={{
                                    position: 'absolute', right: 0, top: '100%',
                                    backgroundColor: COLORS.bgDark, border: `1px solid ${COLORS.border}`,
                                    borderRadius: '8px', zIndex: 50, width: '220px',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.6)', marginTop: '0.5rem', overflow: 'hidden'
                                }}>
                                    <button 
                                        className="w-full p-4 flex items-center gap-3 text-[11px] font-black uppercase text-white hover:bg-white/10 transition-colors"
                                        onClick={() => { onEdit(member); setActiveRowMenu(null); }}
                                    >
                                        <Edit2 size={14} className="text-indigo-400" /> Edit Personnel
                                    </button>
                                    <button 
                                        className="w-full p-4 flex items-center gap-3 text-[11px] font-black uppercase text-white hover:bg-white/10 transition-colors"
                                        onClick={() => { onStatusToggle(member); setActiveRowMenu(null); }}
                                    >
                                        {member.status === 'Inactive' ? <><Unlock size={14} className="text-emerald-400" /> Activate User</> : <><Lock size={14} className="text-amber-400" /> Lock Access</>}
                                    </button>
                                    <button 
                                        className="w-full p-4 flex items-center gap-3 text-[11px] font-black uppercase text-rose-400 hover:bg-rose-400/10 transition-colors"
                                        onClick={() => { onDelete(member); setActiveRowMenu(null); }}
                                    >
                                        <Trash2 size={14} /> Remove Member
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={S.badge(COLORS.label)}><Shield size={14} /> Managed by Network</div>
                    )}
                </div>
            </td>
        </tr>
    );
};
