import React from 'react';
import { User, Shield, Edit2, Lock, Unlock, Trash2, MoreVertical, ChevronRight } from 'lucide-react';
import { COLORS, TeamMember } from '../TeamConstants';

interface TeamCardProps {
    member: TeamMember;
    onEdit: (member: TeamMember) => void;
    onDelete: (member: TeamMember) => void;
    onStatusToggle: (member: TeamMember) => void;
    onResendInvite: (member: TeamMember) => void;
    activeRowMenu: string | null;
    setActiveRowMenu: (id: string | null) => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({
    member,
    onEdit,
    onDelete,
    onStatusToggle,
    onResendInvite,
    activeRowMenu,
    setActiveRowMenu
}) => {
    const isMusB = member.type === 'MusB';
    const isPending = member.status === 'Draft' || member.status === 'PENDING';

    return (
        <tr className="hover:bg-white/[0.03] transition-all group relative">
            <td className="px-6 py-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center transition-all group-hover:border-blue-500/30 group-hover:bg-blue-500/10 shrink-0">
                        <User size={20} className="text-slate-500 group-hover:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-black text-white group-hover:text-blue-400 transition-colors truncate uppercase italic tracking-tight">{member.name}</div>
                        <div className="text-[11px] text-slate-500 font-bold mt-1 truncate uppercase tracking-widest">{member.email}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-6">
                <div className="text-sm font-black text-slate-300 uppercase tracking-widest leading-none">{member.role}</div>
                {member.expertise && <div className="text-[11px] text-slate-500 mt-2 font-bold uppercase tracking-wider opacity-60 leading-none">{member.expertise}</div>}
            </td>
            <td className="px-6 py-6">
                <div className="flex flex-wrap gap-2">
                    {member.assignedStudies.length > 0 ? member.assignedStudies.map(s => (
                        <span key={s} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{s}</span>
                    )) : <span className="text-[11px] text-slate-600 font-black uppercase tracking-widest opacity-60">no assignments</span>}
                </div>
            </td>
            <td className="px-6 py-6">
                <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border ${
                    member.status === 'Active' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : isPending
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-white/5 text-slate-500 border-white/5'
                }`}>
                    {member.status}
                </span>
            </td>
            <td className="px-6 py-8 text-right">
                <div className="flex justify-end gap-3 position-relative">
                    {!isMusB ? (
                        <div className="relative">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setActiveRowMenu(activeRowMenu === member.id ? null : member.id); }}
                                className={`p-2 rounded-lg border transition-all ${
                                    activeRowMenu === member.id 
                                    ? 'bg-blue-600/20 border-blue-500/30 text-white shadow-lg' 
                                    : 'bg-white/5 border-white/5 text-slate-600 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <MoreVertical size={16} />
                            </button>

                            {activeRowMenu === member.id && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setActiveRowMenu(null)} />
                                    <div className="absolute right-0 top-full mt-2 bg-[#1E293B] border border-white/10 rounded-xl z-50 w-52 shadow-2xl overflow-hidden py-1">
                                        {isPending ? (
                                            <button 
                                                className="w-full px-5 py-4 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-300 hover:bg-white/5 hover:text-white transition-all text-left"
                                                onClick={() => { onResendInvite(member); setActiveRowMenu(null); }}
                                            >
                                                <RefreshCcw size={16} className="text-blue-400" /> Resend invitation
                                            </button>
                                        ) : (
                                            <button 
                                                className="w-full px-5 py-4 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-300 hover:bg-white/5 hover:text-white transition-all text-left"
                                                onClick={() => { onEdit(member); setActiveRowMenu(null); }}
                                            >
                                                <Edit2 size={16} className="text-blue-400" /> Edit record
                                            </button>
                                        )}
                                        
                                        {!isPending && (
                                            <button 
                                                className="w-full px-5 py-4 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-300 hover:bg-white/5 hover:text-white transition-all text-left"
                                                onClick={() => { onStatusToggle(member); setActiveRowMenu(null); }}
                                            >
                                                {member.status === 'Inactive' ? <><Unlock size={16} className="text-emerald-400" /> Activate access</> : <><Lock size={16} className="text-amber-400" /> Suspend access</>}
                                            </button>
                                        )}
                                        
                                        <div className="h-px bg-white/5 mx-2 my-1" />
                                        <button 
                                            className="w-full px-5 py-4 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-rose-400 hover:bg-rose-500/10 transition-all text-left"
                                            onClick={() => { onDelete(member); setActiveRowMenu(null); }}
                                        >
                                            <Trash2 size={16} /> Remove member
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-500/5 border border-blue-500/10 text-[10px] font-black uppercase tracking-widest text-blue-400/70">
                            <Shield size={14} /> Network
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};
