import React, { useState, useEffect } from 'react';
import { authFetch, API } from '../../utils/auth';
import {
    AlertTriangle, CheckCircle2, Clock, Calendar, Activity,
    ChevronDown, ChevronUp, X, FileText, Filter, RefreshCcw,
    Pill, Heart, Search, AlertCircle
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DailyLog {
    id: string;
    participant: string;
    participant_sid: string;
    participant_name: string;
    date: string;
    took_medicine: boolean;
    time_taken: string;
    full_dose: boolean;
    dose_amount: string;
    reason_missed: string;
    noticed_side_effects: boolean;
    side_effect_description: string;
    side_effect_start_time: string;
    side_effect_ongoing: boolean;
    severity: string;
    interfered_daily_activities: boolean;
    sought_medical_care: boolean;
    ae_additional_comments: string;
    overall_feeling: string;
    health_updates: string;
    supporting_file_url: string | null;
    is_draft: boolean;
    created_at: string;
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
const LogDetailModal = ({ log, onClose }: { log: DailyLog; onClose: () => void }) => {
    const severityColor = log.severity === 'SEVERE' ? '#ef4444' : log.severity === 'MODERATE' ? '#f59e0b' : '#10b981';
    const feelingLabel: Record<string, string> = { VERY_GOOD: 'Very Good', GOOD: 'Good', FAIR: 'Fair', POOR: 'Poor' };

    const Row = ({ label, value, accent }: { label: string; value: any; accent?: string }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: accent || '#f1f5f9' }}>{value || '—'}</span>
        </div>
    );

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
            <div style={{ backgroundColor: '#0B101B', border: '1px solid rgba(20,184,166,0.3)', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
                {/* Header */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', color: 'white' }}>
                            {log.participant_sid} — {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginTop: 2 }}>{log.participant_name}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {log.noticed_side_effects && (
                            <span style={{ backgroundColor: `${severityColor}20`, color: severityColor, border: `1px solid ${severityColor}40`, borderRadius: 20, padding: '0.2rem 0.75rem', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>
                                ⚠️ AE — {log.severity || 'Mild'}
                            </span>
                        )}
                        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', padding: '0.4rem' }}>
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Medicine Intake */}
                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
                            <Pill size={14} color="#14b8a6" />
                            <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#14b8a6' }}>Medicine Intake</span>
                        </div>
                        <Row label="Took Medicine" value={log.took_medicine ? '✅ Yes' : '❌ No'} accent={log.took_medicine ? '#10b981' : '#ef4444'} />
                        {log.took_medicine && <Row label="Time Taken" value={log.time_taken} />}
                        {log.took_medicine && <Row label="Full Dose" value={log.full_dose ? 'Yes' : 'No'} />}
                        {log.took_medicine && !log.full_dose && <Row label="Dose Amount" value={log.dose_amount} />}
                        {!log.took_medicine && <Row label="Reason Missed" value={log.reason_missed} accent="#f59e0b" />}
                    </section>

                    {/* Adverse Events */}
                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
                            <AlertTriangle size={14} color={log.noticed_side_effects ? '#ef4444' : '#64748b'} />
                            <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: log.noticed_side_effects ? '#ef4444' : '#64748b' }}>Adverse Events</span>
                        </div>
                        {log.noticed_side_effects ? (
                            <>
                                <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
                                    <p style={{ fontSize: 13, color: '#fca5a5', lineHeight: 1.6, margin: 0 }}>{log.side_effect_description}</p>
                                </div>
                                <Row label="Severity" value={log.severity} accent={severityColor} />
                                <Row label="Onset Time" value={log.side_effect_start_time} />
                                <Row label="Ongoing" value={log.side_effect_ongoing ? 'Yes' : 'No'} />
                                <Row label="Interfered Daily Activities" value={log.interfered_daily_activities ? 'Yes' : 'No'} />
                                <Row label="Sought Medical Care" value={log.sought_medical_care ? 'Yes' : 'No'} accent={log.sought_medical_care ? '#f59e0b' : undefined} />
                                {log.ae_additional_comments && <Row label="Additional Comments" value={log.ae_additional_comments} />}
                            </>
                        ) : (
                            <div style={{ backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CheckCircle2 size={14} color="#10b981" />
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>No adverse events reported</span>
                            </div>
                        )}
                    </section>

                    {/* General Health */}
                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
                            <Heart size={14} color="#6366f1" />
                            <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6366f1' }}>General Health</span>
                        </div>
                        <Row label="Overall Feeling" value={feelingLabel[log.overall_feeling] || log.overall_feeling} />
                        {log.health_updates && (
                            <div style={{ backgroundColor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '0.75rem 1rem', marginTop: '0.5rem' }}>
                                <p style={{ fontSize: 11, color: '#818cf8', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Health Notes</p>
                                <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>{log.health_updates}</p>
                            </div>
                        )}
                        {log.supporting_file_url && (
                            <a href={log.supporting_file_url} target="_blank" rel="noreferrer"
                                style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: '0.75rem', padding: '0.6rem 1rem', backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, color: '#fbbf24', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
                                <FileText size={14} /> View Uploaded File
                            </a>
                        )}
                    </section>

                    {/* Footer meta */}
                    <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Submitted: {new Date(log.created_at).toLocaleString()}</span>
                        {log.is_draft && <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 900, textTransform: 'uppercase', backgroundColor: 'rgba(245,158,11,0.1)', padding: '0.2rem 0.6rem', borderRadius: 4 }}>Draft</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────
interface Props {
    selectedStudyId?: string;
    preloadedStudies?: any[];
    preloadedParticipants?: any[];
}

export default function ParticipantLogsPanel({ 
    selectedStudyId, 
    preloadedStudies = [], 
    preloadedParticipants = [] 
}: Props) {
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null);
    const [search, setSearch] = useState('');
    const [filterAE, setFilterAE] = useState<'all' | 'ae' | 'normal'>('all');
    const [filterDate, setFilterDate] = useState('');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const [filterStudy, setFilterStudy] = useState(selectedStudyId && selectedStudyId !== 'all' ? selectedStudyId : 'all');
    const [filterParticipant, setFilterParticipant] = useState('all');

    useEffect(() => {
        if (selectedStudyId) {
            setFilterStudy(selectedStudyId);
        }
    }, [selectedStudyId]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterStudy && filterStudy !== 'all') params.append('study', filterStudy);
            const res = await authFetch(`${API}/api/daily-medication-logs/?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                const raw: DailyLog[] = Array.isArray(data) ? data : (data.results || []);
                setLogs(raw.filter(l => !l.is_draft));
            }
        } catch (e) {
            console.error('Failed to load logs', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, [filterStudy]);

    const availableStudies = preloadedStudies.length > 0 
        ? preloadedStudies.map((s: any) => ({ id: s.id, display: s.protocol_id || s.title }))
        : Array.from(new Map(preloadedParticipants.filter((p: any) => p.study).map((p: any) => [p.study, p.study_name || p.protocol_id || p.study])).entries()).map(([id, display]) => ({ id, display }));

    const availableParticipants = preloadedParticipants.filter((p: any) => filterStudy === 'all' || p.study === filterStudy || (p.study?.id === filterStudy));

    // Fallback if preloadedParticipants is missing or empty
    const logsParticipants = Array.from(new Map(logs.map(l => [l.participant, { id: l.participant, display_name: l.participant_name, participant_sid: l.participant_sid }])).values());
    const finalParticipants = availableParticipants.length > 0 ? availableParticipants : logsParticipants;

    const filtered = logs
        .filter(l => {
            const q = search.toLowerCase();
            const matchSearch = !q || l.participant_sid?.toLowerCase().includes(q) || l.participant_name?.toLowerCase().includes(q);
            const matchAE = filterAE === 'all' || (filterAE === 'ae' && l.noticed_side_effects) || (filterAE === 'normal' && !l.noticed_side_effects);
            const matchDate = !filterDate || l.date === filterDate;
            const matchParticipant = filterParticipant === 'all' || l.participant === filterParticipant;
            return matchSearch && matchAE && matchDate && matchParticipant;
        })
        .sort((a, b) => {
            const da = new Date(a.date).getTime(), db = new Date(b.date).getTime();
            return sortDir === 'desc' ? db - da : da - db;
        });

    const aeCount = logs.filter(l => l.noticed_side_effects).length;
    const todayCount = logs.filter(l => l.date === new Date().toISOString().split('T')[0]).length;

    const severityBadge = (s: string) => {
        if (s === 'SEVERE') return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', text: 'Severe' };
        if (s === 'MODERATE') return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', text: 'Moderate' };
        return { bg: 'rgba(16,185,129,0.15)', color: '#10b981', text: 'Mild' };
    };

    const G = {
        card: { backgroundColor: 'rgba(7,10,19,0.85)', backdropFilter: 'blur(40px)', border: '1px solid rgba(20,184,166,0.15)', borderRadius: 12 },
        label: { fontSize: 10, fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#64748b' },
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '80vh' }}>
            {/* Compact Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '0.5rem' }}>
                {[
                    { label: 'Total Logs', value: logs.length, color: '#14b8a6', icon: <Activity size={14} /> },
                    { label: 'AE Reports', value: aeCount, color: '#ef4444', icon: <AlertTriangle size={14} /> },
                    { label: "Today's", value: todayCount, color: '#6366f1', icon: <Calendar size={14} /> },
                    { label: 'Subjects', value: new Set(logs.map(l => l.participant)).size, color: '#f59e0b', icon: <Heart size={14} /> },
                ].map(stat => (
                    <div key={stat.label} style={{ ...G.card, padding: '0.6rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ color: stat.color }}>{stat.icon}</div>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: 'white', lineHeight: 1 }}>{stat.value}</div>
                            <div style={{ ...G.label, fontSize: 8 }}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters - Study -> Participant Flow */}
            <div style={{ ...G.card, padding: '0.5rem 0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '0.5rem' }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#14b8a6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>1. Study:</span>
                    <select 
                        value={filterStudy} 
                        onChange={e => { setFilterStudy(e.target.value); setFilterParticipant('all'); }}
                        style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'white', fontSize: 11, padding: '0.3rem 0.5rem', outline: 'none', maxWidth: 140 }}
                    >
                        <option value="all" style={{color: '#000'}}>All Protocols</option>
                        {availableStudies.map(s => (
                            <option key={s.id} value={s.id} style={{color: '#000'}}>{s.display}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '0.5rem' }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#14b8a6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>2. Subject:</span>
                    <select 
                        value={filterParticipant} 
                        onChange={e => setFilterParticipant(e.target.value)}
                        style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'white', fontSize: 11, padding: '0.3rem 0.5rem', outline: 'none', maxWidth: 140 }}
                    >
                        <option value="all" style={{color: '#000'}}>All Subjects</option>
                        {finalParticipants.map((p: any) => (
                            <option key={p.id} value={p.id} style={{color: '#000'}}>{p.display_name} ({p.participant_sid})</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', flex: 1, minWidth: 150, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '0 0.6rem', alignItems: 'center', gap: 6 }}>
                    <Search size={12} color="#64748b" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search participant..." style={{ background: 'transparent', border: 'none', color: 'white', fontSize: 12, outline: 'none', padding: '0.4rem 0', width: '100%' }} />
                </div>
                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'white', fontSize: 12, padding: '0.4rem 0.6rem', outline: 'none' }} />
                {(['all', 'ae', 'normal'] as const).map(f => (
                    <button key={f} onClick={() => setFilterAE(f)} style={{ backgroundColor: filterAE === f ? 'rgba(20,184,166,0.15)' : 'transparent', color: filterAE === f ? '#14b8a6' : '#64748b', border: `1px solid ${filterAE === f ? '#14b8a6' : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, padding: '0.35rem 0.75rem', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }}>
                        {f === 'all' ? 'All' : f === 'ae' ? '⚠️ AE Only' : 'Normal'}
                    </button>
                ))}
                <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', padding: '0.35rem 0.6rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {sortDir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    <span style={{ fontSize: 11, fontWeight: 900 }}>Date</span>
                </button>
                <button onClick={fetchLogs} style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', padding: '0.35rem 0.6rem' }}>
                    <RefreshCcw size={14} />
                </button>
            </div>

            {/* Table */}
            <div style={{ ...G.card, overflow: 'hidden', flex: 1 }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                        <Activity size={32} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase' }}>Loading logs...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                        <FileText size={40} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                        <p style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase' }}>No logs found</p>
                        <p style={{ fontSize: 11, marginTop: '0.5rem' }}>Adjust your filters or wait for participants to submit logs</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {['Date', 'Participant', 'Medicine', 'Feeling', 'AE Status', 'Severity', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', ...G.label }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(log => {
                                    const badge = log.noticed_side_effects ? severityBadge(log.severity) : null;
                                    const feelingColor: Record<string, string> = { VERY_GOOD: '#10b981', GOOD: '#22d3ee', FAIR: '#f59e0b', POOR: '#ef4444' };
                                    return (
                                        <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s', cursor: 'pointer' }}
                                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                                            <td style={{ padding: '0.8rem 1rem', fontSize: 12, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                                {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '0.8rem 1rem' }}>
                                                <div style={{ fontSize: 12, fontWeight: 900, color: 'white' }}>{log.participant_sid}</div>
                                                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{log.participant_name}</div>
                                            </td>
                                            <td style={{ padding: '0.8rem 1rem' }}>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: log.took_medicine ? '#10b981' : '#ef4444' }}>
                                                    {log.took_medicine ? '✅ Yes' : '❌ No'}
                                                </span>
                                                {log.took_medicine && !log.full_dose && <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 2 }}>Partial dose</div>}
                                            </td>
                                            <td style={{ padding: '0.8rem 1rem', fontSize: 12, fontWeight: 700, color: feelingColor[log.overall_feeling] || '#64748b' }}>
                                                {log.overall_feeling?.replace('_', ' ') || '—'}
                                            </td>
                                            <td style={{ padding: '0.8rem 1rem' }}>
                                                {log.noticed_side_effects ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <AlertCircle size={12} color="#ef4444" />
                                                        <span style={{ fontSize: 11, fontWeight: 900, color: '#ef4444', textTransform: 'uppercase' }}>AE Reported</span>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <CheckCircle2 size={12} color="#10b981" />
                                                        <span style={{ fontSize: 11, fontWeight: 900, color: '#10b981', textTransform: 'uppercase' }}>Clear</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.8rem 1rem' }}>
                                                {badge ? (
                                                    <span style={{ backgroundColor: badge.bg, color: badge.color, padding: '0.15rem 0.5rem', borderRadius: 20, fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>
                                                        {badge.text}
                                                    </span>
                                                ) : <span style={{ color: '#475569', fontSize: 11 }}>—</span>}
                                            </td>
                                            <td style={{ padding: '0.8rem 1rem' }}>
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    style={{ backgroundColor: 'rgba(20,184,166,0.12)', color: '#14b8a6', border: '1px solid rgba(20,184,166,0.3)', borderRadius: 6, padding: '0.3rem 0.7rem', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }}>
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* AE Banner */}
            {aeCount > 0 && filterAE !== 'ae' && (
                <div style={{ ...G.card, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)', cursor: 'pointer' }}
                    onClick={() => setFilterAE('ae')}>
                    <AlertTriangle size={16} color="#ef4444" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fca5a5' }}>
                        {aeCount} adverse event{aeCount !== 1 ? 's' : ''} reported — <span style={{ textDecoration: 'underline' }}>click to filter</span>
                    </span>
                </div>
            )}

            {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
        </div>
    );
}
