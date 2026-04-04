import React from 'react';
import { Search, Eye, History, ShieldCheck, RefreshCw } from 'lucide-react';
import { COLORS } from '../ConsentConstants';

interface RecordsProps {
    consentRecords: any[];
    recordsSearch: string;
    setRecordsSearch: (s: string) => void;
    recordsFilter: string;
    setRecordsFilter: (f: string) => void;
    setActiveRecordId: (id: string | null) => void;
    setActiveView: (v: string) => void;
    setAuditDrawerRecordId: (id: string | null) => void;
    setAuditDrawerOpen: (o: boolean) => void;
    recordStats: { total: number; pending: number; verified: number; rejected: number; expiring: number };
}

const S = {
    badge: (c: string) => ({ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30`, padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '11px', fontWeight: 900 as const, textTransform: 'uppercase' as const, display: 'inline-flex', alignItems: 'center', gap: '4px' }),
    title: { fontSize: '22px', fontWeight: 900 as const, fontStyle: 'italic' as const, textTransform: 'uppercase' as const, letterSpacing: '-0.02em', color: 'white' },
    input: { backgroundColor: 'rgba(255,255,255,0.03)', border: COLORS.border, borderRadius: '8px', padding: '1rem 1.5rem', color: 'white', fontSize: '16px', outline: 'none' }
};

export const ConsentRecordsView: React.FC<RecordsProps> = (props) => {
    const { 
        consentRecords, recordsSearch, setRecordsSearch, recordsFilter, setRecordsFilter, 
        setActiveRecordId, setActiveView, setAuditDrawerRecordId, setAuditDrawerOpen, recordStats 
    } = props;

    return (
        <div className="flex-1 p-6 lg:p-12 2xl:p-20 bg-[#060a14] overflow-y-auto custom-scrollbar">
            {/* STATS STRIP */}
            <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 2xl:p-10 grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12 2xl:mb-16">
                <div className="text-center group">
                    <div className="text-3xl lg:text-4xl font-black text-white group-hover:scale-110 transition-transform">{recordStats.total}</div>
                    <div className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500 mt-3 italic">Total Records</div>
                </div>
                <div className="text-center group border-l border-white/5">
                    <div className="text-3xl lg:text-4xl font-black text-amber-500 group-hover:scale-110 transition-transform">{recordStats.pending}</div>
                    <div className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500 mt-3 italic">Pending Verification</div>
                </div>
                <div className="text-center group border-l border-white/5">
                    <div className="text-3xl lg:text-4xl font-black text-emerald-500 group-hover:scale-110 transition-transform">{recordStats.verified}</div>
                    <div className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500 mt-3 italic">Verified Complete</div>
                </div>
                <div className="text-center group border-l border-white/5">
                    <div className="text-3xl lg:text-4xl font-black text-rose-500 group-hover:scale-110 transition-transform">{recordStats.rejected}</div>
                    <div className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500 mt-3 italic">Audit Rejections</div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-10">
                <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                    <h2 style={{ ...S.title, fontSize: '28px' }}>Transaction Registry</h2>
                    <div className="flex gap-3 overflow-x-auto pb-4 lg:pb-0 custom-scrollbar-horizontal w-full lg:w-auto">
                        {['All', 'Pending', 'Verified', 'Rejected'].map(f => (
                            <button key={f} onClick={() => setRecordsFilter(f)} style={{ ...S.badge(recordsFilter === f ? COLORS.accent : COLORS.label), padding: '0.6rem 1.5rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>{f}</button>
                        ))}
                    </div>
                </div>
                <div className="relative w-full lg:w-[400px]">
                    <Search size={18} className="text-slate-500 absolute left-5 top-1/2 -translate-y-1/2" />
                    <input style={{ ...S.input, width: '100%', paddingLeft: '3.5rem', borderRadius: '100px' }} placeholder="Search Participant IDs..." value={recordsSearch} onChange={e => setRecordsSearch(e.target.value)} />
                </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-x-auto custom-scrollbar-horizontal shadow-2xl">
                <table className="w-full border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="bg-white/[0.03] border-b border-white/5">
                            {['Participant ID', 'Study Assignment', 'Version', 'Signed Date', 'Status', 'Actions'].map(h => (
                                <th key={h} className="p-8 text-left uppercase tracking-[0.2em] text-[12px] font-black text-slate-500 italic">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {consentRecords.map((r: any) => (
                            <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                <td className="p-8 font-black text-white text-xl tracking-tighter italic">{r.full_name}</td>
                                <td className="p-8 text-lg font-black text-indigo-400 italic">{r.study_title || r.protocol_id}</td>
                                <td className="p-8"><span style={S.badge(COLORS.accent)}>{r.template_version}</span></td>
                                <td className="p-8 text-sm text-slate-400 font-bold">{r.agreed_at ? new Date(r.agreed_at).toLocaleDateString() : '—'}</td>
                                <td className="p-8"><span style={{ ...S.badge(r.pi_verified ? COLORS.success : COLORS.warning), fontSize: '14px', padding: '0.6rem 1.5rem' }}>{r.pi_verified ? 'VERIFIED' : 'PENDING PI'}</span></td>
                                <td className="p-8">
                                    <div className="flex gap-4">
                                        <button className="p-4 bg-white/5 border border-white/10 text-slate-400 rounded-xl hover:text-white transition-all"><Eye size={18} /></button>
                                        {!r.pi_verified && (
                                            <button className="px-6 py-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl font-black uppercase tracking-widest text-[11px] italic hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-3" onClick={() => { setActiveRecordId(r.id); setActiveView('pi-verify'); }}><ShieldCheck size={18} /> Verify</button>
                                        )}
                                        <button className="p-4 bg-white/5 border border-white/10 text-slate-400 rounded-xl hover:text-white transition-all" onClick={() => { setAuditDrawerRecordId(r.id); setAuditDrawerOpen(true); }}><History size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
