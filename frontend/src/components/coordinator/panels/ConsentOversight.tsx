import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileSignature, Search, CheckCircle2, Clock, AlertTriangle,
    Download, ShieldCheck, Eye, RefreshCw, FileDown,
    XCircle, Shield, X, ZoomIn, ZoomOut, ExternalLink, User
} from 'lucide-react';
import { authFetch, API } from '../../../utils/auth';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ConsentRow {
    id: string;
    participantName: string;
    participantSid: string;
    studyTitle: string;
    protocolId: string;
    signingStatus: string;
    participantSigned: boolean;
    participantSignedAt: string | null;
    coordinatorSigned: boolean;
    coordinatorSignedAt: string | null;
    piSigned: boolean;
    piSignedAt: string | null;
    signedPdfUrl: string | null;
}

// ─── PDF Preview Modal ────────────────────────────────────────────────────────
function PreviewModal({ record, onClose }: { record: ConsentRow; onClose: () => void }) {
    const [zoom, setZoom] = useState(100);
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#0B101B] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Consent Record</p>
                        <h3 className="text-base font-black text-white uppercase tracking-tight">{record.participantName}</h3>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase">{record.participantSid} · {record.protocolId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all"><X size={16} /></button>
                </div>

                {/* Toolbar */}
                {record.signedPdfUrl && (
                    <div className="flex items-center justify-between px-6 py-2 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setZoom(z => Math.max(60, z - 20))} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"><ZoomOut size={13} /></button>
                            <span className="text-[10px] font-black text-slate-500 w-10 text-center">{zoom}%</span>
                            <button onClick={() => setZoom(z => Math.min(200, z + 20))} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"><ZoomIn size={13} /></button>
                        </div>
                        <div className="flex items-center gap-2">
                            <a href={record.signedPdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-all">
                                <ExternalLink size={11} /> Open
                            </a>
                            <a href={record.signedPdfUrl} download className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-[10px] font-black text-white uppercase tracking-widest transition-all">
                                <Download size={11} /> Download
                            </a>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                    {record.signedPdfUrl ? (
                        <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
                            <iframe
                                src={`${record.signedPdfUrl}#toolbar=0&navpanes=0`}
                                className="w-full rounded-xl border border-white/10"
                                style={{ height: '65vh', minHeight: 400 }}
                                title="Signed Consent PDF"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <FileSignature className="w-10 h-10 text-slate-700" />
                            <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest">No signed PDF available yet</p>
                            <p className="text-[10px] text-slate-600 uppercase tracking-widest text-center max-w-xs">The signed document will appear here once all required parties have completed signing.</p>
                        </div>
                    )}
                </div>

                {/* Signature Summary */}
                <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-6">
                        <SignBadge label="Participant" signed={record.participantSigned} date={record.participantSignedAt} />
                        <SignBadge label="Coordinator" signed={record.coordinatorSigned} date={record.coordinatorSignedAt} />
                        <SignBadge label="PI" signed={record.piSigned} date={record.piSignedAt} />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

function SignBadge({ label, signed, date }: { label: string; signed: boolean; date: string | null }) {
    return (
        <div className="flex items-center gap-2">
            {signed
                ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                : <Clock size={14} className="text-amber-400 shrink-0" />
            }
            <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
                <p className={`text-[10px] font-black uppercase ${signed ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {signed ? (date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Signed') : 'Pending'}
                </p>
            </div>
        </div>
    );
}

// ─── Status Helpers ───────────────────────────────────────────────────────────
function getStatusConfig(status: string) {
    switch (status) {
        case 'FULLY_SIGNED':   return { label: 'Fully Signed',    cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <ShieldCheck size={11} /> };
        case 'AWAITING_PI':    return { label: 'Awaiting PI',     cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20',         icon: <Shield size={11} /> };
        case 'AWAITING_CC':
        case 'PARTIALLY_SIGNED': return { label: 'Awaiting CC',  cls: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',   icon: <Clock size={11} /> };
        case 'PENDING':        return { label: 'Not Signed',      cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20',      icon: <Clock size={11} /> };
        case 'EXPIRED':
        case 'REJECTED':       return { label: 'Expired/Rejected', cls: 'text-red-400 bg-red-500/10 border-red-500/20',          icon: <XCircle size={11} /> };
        default:               return { label: status || 'Unknown', cls: 'text-slate-400 bg-white/5 border-white/10',            icon: <Clock size={11} /> };
    }
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportToCSV(rows: ConsentRow[]) {
    const header = ['Participant Name', 'Participant ID', 'Study', 'Protocol ID', 'Status', 'Participant Signed', 'Participant Date', 'Coordinator Signed', 'Coordinator Date', 'PI Signed', 'PI Date'];
    const csvRows = rows.map(r => [
        r.participantName, r.participantSid, r.studyTitle, r.protocolId,
        r.signingStatus,
        r.participantSigned ? 'Yes' : 'No', r.participantSignedAt ? new Date(r.participantSignedAt).toLocaleDateString() : '—',
        r.coordinatorSigned ? 'Yes' : 'No', r.coordinatorSignedAt ? new Date(r.coordinatorSignedAt).toLocaleDateString() : '—',
        r.piSigned ? 'Yes' : 'No', r.piSignedAt ? new Date(r.piSignedAt).toLocaleDateString() : '—',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([[header.join(','), ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `consent_tracker_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ConsentOversight({ selectedStudyId }: { selectedStudyId?: string }) {
    const [rows, setRows]           = useState<ConsentRow[]>([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [filter, setFilter]       = useState<string>('All');
    const [preview, setPreview]     = useState<ConsentRow | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const qs = selectedStudyId && selectedStudyId !== 'all' ? `?study_id=${selectedStudyId}` : '';
            const res = await authFetch(`${API}/api/consent/${qs}`);
            const json = await res.json();
            const data: any[] = Array.isArray(json) ? json : json.results || [];
            setRows(data.map((item: any): ConsentRow => ({
                id:                  String(item.id),
                participantName:     item.decrypted_name || item.full_name || 'Anonymous',
                participantSid:      item.participant_sid || item.participant || '—',
                studyTitle:          item.study_title || '—',
                protocolId:          item.protocol_id || '—',
                signingStatus:       item.signing_status || 'PENDING',
                participantSigned:   !!item.participant_signed_at,
                participantSignedAt: item.participant_signed_at || null,
                coordinatorSigned:   !!item.cc_verified,
                coordinatorSignedAt: item.cc_verified_at || null,
                piSigned:            !!item.pi_verified,
                piSignedAt:          item.pi_verified_at || null,
                signedPdfUrl:        item.signed_pdf_url || null,
            })));
        } catch (e) {
            console.error('ConsentOversight fetch error:', e);
        } finally {
            setLoading(false);
        }
    }, [selectedStudyId]);

    useEffect(() => { load(); }, [load]);

    const filtered = rows.filter(r => {
        const q = search.toLowerCase();
        const matchesSearch = r.participantName.toLowerCase().includes(q) || r.participantSid.toLowerCase().includes(q) || r.protocolId.toLowerCase().includes(q);
        const matchesFilter =
            filter === 'All'         ? true :
            filter === 'Signed'      ? r.signingStatus === 'FULLY_SIGNED' :
            filter === 'Pending'     ? r.signingStatus === 'PENDING' :
            filter === 'In Progress' ? ['AWAITING_PI', 'AWAITING_CC', 'PARTIALLY_SIGNED'].includes(r.signingStatus) :
            filter === 'Not Signed'  ? !r.participantSigned : true;
        return matchesSearch && matchesFilter;
    });

    const stats = {
        total:   rows.length,
        signed:  rows.filter(r => r.signingStatus === 'FULLY_SIGNED').length,
        pending: rows.filter(r => !r.participantSigned).length,
        inProg:  rows.filter(r => r.participantSigned && r.signingStatus !== 'FULLY_SIGNED').length,
    };

    const FILTERS = ['All', 'Signed', 'In Progress', 'Pending', 'Not Signed'];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pt-2">
            <AnimatePresence>
                {preview && <PreviewModal record={preview} onClose={() => setPreview(null)} />}
            </AnimatePresence>

            {/* KPI Row */}
            <div className="flex flex-wrap gap-4">
                {[
                    { label: 'Total Consents', value: stats.total, icon: <FileSignature size={16} />, cls: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
                    { label: 'Fully Signed',   value: stats.signed, icon: <ShieldCheck size={16} />, cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                    { label: 'In Progress',    value: stats.inProg, icon: <Shield size={16} />, cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                    { label: 'Not Signed',     value: stats.pending, icon: <AlertTriangle size={16} />, cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                ].map(k => (
                    <div key={k.label} className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${k.cls} flex-1 min-w-[150px]`}>
                        <span className={k.cls.split(' ')[0]}>{k.icon}</span>
                        <div>
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{k.label}</p>
                            <p className="text-xl font-black text-white">{String(k.value).padStart(2, '0')}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Filter pills */}
                <div className="flex flex-wrap gap-2">
                    {FILTERS.map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                            {f}
                        </button>
                    ))}
                </div>
                <div className="flex-1" />
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search name, ID, protocol..."
                        className="bg-white/5 border border-white/10 rounded-2xl pl-10 pr-5 py-2.5 text-[12px] text-white font-bold outline-none focus:border-indigo-500/50 transition-all w-64 placeholder:text-slate-700 uppercase tracking-wide" />
                </div>
                {/* Buttons */}
                <button onClick={load} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all" title="Refresh">
                    <RefreshCw size={14} />
                </button>
                <button onClick={() => exportToCSV(filtered)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
                    <FileDown size={13} /> Export CSV
                </button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center border border-white/5 rounded-3xl">
                    <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Loading Consent Ledger...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl">
                    <FileSignature className="w-10 h-10 text-slate-700 mb-4" />
                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest">No consent records found</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto rounded-3xl border border-white/5">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    {['Participant', 'Study / Protocol', 'Status', 'Participant', 'Coordinator', 'PI', 'Actions'].map(h => (
                                        <th key={h} className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence initial={false}>
                                    {filtered.map((r, i) => {
                                        const status = getStatusConfig(r.signingStatus);
                                        return (
                                            <motion.tr key={r.id}
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'}`}>

                                                {/* Participant */}
                                                <td className="px-5 py-4">
                                                    <p className="text-sm font-black text-white uppercase tracking-tight">{r.participantName}</p>
                                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{r.participantSid}</p>
                                                </td>

                                                {/* Study */}
                                                <td className="px-5 py-4">
                                                    <p className="text-[11px] font-bold text-white truncate max-w-[180px]">{r.studyTitle}</p>
                                                    <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">{r.protocolId}</p>
                                                </td>

                                                {/* Overall status */}
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${status.cls}`}>
                                                        {status.icon} {status.label}
                                                    </span>
                                                </td>

                                                {/* Participant Signed */}
                                                <td className="px-5 py-4">
                                                    <SignCell signed={r.participantSigned} date={r.participantSignedAt} />
                                                </td>

                                                {/* Coordinator Signed */}
                                                <td className="px-5 py-4">
                                                    <SignCell signed={r.coordinatorSigned} date={r.coordinatorSignedAt} />
                                                </td>

                                                {/* PI Signed */}
                                                <td className="px-5 py-4">
                                                    <SignCell signed={r.piSigned} date={r.piSignedAt} />
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => setPreview(r)}
                                                            title="Preview"
                                                            className="p-2 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 rounded-xl text-indigo-400 hover:text-white transition-all active:scale-95">
                                                            <Eye size={13} />
                                                        </button>
                                                        {r.signedPdfUrl && (
                                                            <a href={r.signedPdfUrl} download
                                                                title="Download PDF"
                                                                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95">
                                                                <Download size={13} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile/Tablet Card Layout */}
                    <div className="lg:hidden space-y-4">
                        <AnimatePresence mode="popLayout">
                            {filtered.map((r) => {
                                const status = getStatusConfig(r.signingStatus);
                                return (
                                    <motion.div key={r.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                                        className={`p-5 rounded-[1.5rem] border ${r.signingStatus === 'AWAITING_PI' ? 'bg-amber-500/[0.03] border-amber-500/20' : 'bg-white/[0.02] border-white/5'} space-y-4`}>
                                        
                                        {/* Card Header: Participant & Status */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-11 h-11 flex items-center justify-center rounded-2xl border ${r.signingStatus === 'AWAITING_PI' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[14px] font-black text-white italic uppercase tracking-tight group-hover:text-blue-400 transition-colors">{r.participantName}</span>
                                                        {r.signingStatus === 'AWAITING_PI' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 mt-1">
                                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em]">{r.studyTitle}</span>
                                                        <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest">{r.protocolId}</span>
                                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{r.participantSid}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${status.cls}`}>
                                                {status.icon} {status.label}
                                            </span>
                                        </div>

                                        {/* Signatures Grid */}
                                        <div className="grid grid-cols-3 gap-4 py-3 border-y border-white/5">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Participant</p>
                                                <SignCell signed={r.participantSigned} date={r.participantSignedAt} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Coordinator</p>
                                                <SignCell signed={r.coordinatorSigned} date={r.coordinatorSignedAt} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">PI</p>
                                                <SignCell signed={r.piSigned} date={r.piSignedAt} />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setPreview(r)}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-xl text-indigo-400 font-black text-[10px] uppercase tracking-widest transition-all">
                                                <Eye size={14} /> Preview
                                            </button>
                                            {r.signedPdfUrl && (
                                                <a href={r.signedPdfUrl} download
                                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-black text-[10px] uppercase tracking-widest transition-all">
                                                    <Download size={14} /> Download
                                                </a>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </>
            )}

            {/* Footer */}
            {!loading && filtered.length > 0 && (
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest text-right">
                    Showing {filtered.length} of {rows.length} records
                </p>
            )}
        </motion.div>
    );
}

// Small helper cell
function SignCell({ signed, date }: { signed: boolean; date: string | null }) {
    return (
        <div className="flex items-center gap-1.5">
            {signed
                ? <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                : <Clock size={13} className="text-amber-400 shrink-0" />
            }
            <div>
                <p className={`text-[9px] font-black uppercase ${signed ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {signed ? 'Signed' : 'Pending'}
                </p>
                {date && <p className="text-[8px] text-slate-600 font-bold">{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>}
            </div>
        </div>
    );
}
