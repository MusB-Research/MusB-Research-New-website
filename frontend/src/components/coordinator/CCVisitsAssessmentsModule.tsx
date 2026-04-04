import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
    Search, Plus, Calendar, Clock, MapPin, 
    User, ListFilter, CheckCircle2, AlertCircle, 
    ChevronRight, ChevronDown, MoreVertical, 
    ArrowUpRight, ShieldAlert, Monitor, ArrowDown, 
    ArrowUp, ClipboardList, Info, Trash2, Send, 
    Save, FileText, Download, Target, Beaker, 
    Stethoscope, Pill, MessageSquare, Paperclip, 
    Eye, Lock, Unlock, X, RefreshCw
} from 'lucide-react';
import { API, authFetch } from '../../utils/auth';

// --- TYPES ---
interface ChecklistItem { label: string; checked: boolean; time?: string; by?: string; }
interface Assessment { name: string; status: 'Not Started' | 'In Progress' | 'Completed' | 'Locked'; }
interface Note { author: string; role: string; time: string; text: string; isInternal?: boolean; replies?: Note[]; }
interface AE { id: string; description: string; severity: 'Mild' | 'Moderate' | 'Severe'; relatedness: string; action: string; time: string; }
interface Doc { id: string; name: string; type: string; date: string; }
interface Sample { type: string; date: string; sampleId: string; shipment: 'Pending' | 'Shipped' | 'Received'; result?: string; }
interface Dispensing { product: string; dose: string; batch: string; date: string; compliance: number; missed: number; }

interface Visit {
    id: string;
    name: string;
    type: string;
    targetDate: string;
    windowDays: number;
    scheduledDate: string;
    actualDate: string | null;
    status: 'Scheduled' | 'Completed' | 'Missed' | 'Overdue' | 'In Progress';
    location: 'Clinic' | 'Virtual' | 'Home Visit';
    checklist: ChecklistItem[];
    assessments: Assessment[];
    vitals: { weight: string | number; height: string | number; bp: string; hr: string | number; temp: string | number; };
    aes: AE[];
    notes: Note[];
    documents: Doc[];
    deviations: string[];
    samples: Sample[];
    dispensing: Dispensing[];
    piApproved: boolean;
    locked?: boolean;
}

interface Participant {
    id: string;
    name: string;
    email?: string;
    study: string;
    protocol_id?: string;
    status: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'SCREENING' | 'ELIGIBLE' | 'INELIGIBLE' | 'CONSENTED' | 'RANDOMIZED' | 'ACTIVE' | 'COMPLETED' | 'DROPPED';
    coordinator: string;
    compliance: number;
    visits: Visit[];
}

// --- CONSTANTS ---
const COLORS = {
    bg: '#0B101B',
    accent: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#38bdf8',
    text: '#94a3b8',
    label: '#475569',
    glass: 'rgba(255,255,255,0.025)',
    border: 'rgba(255,255,255,0.06)'
};

// --- COMPONENT ---
export default function CCC_VisitsAssessmentsModule({ selectedStudyId }: { selectedStudyId?: string }) {
    // State
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [availableStudies, setAvailableStudies] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStudy, setSelectedStudy] = useState('All');
    const [activeParticipantId, setActiveParticipantId] = useState<string | null>(null);
    const [activeVisitId, setActiveVisitId] = useState<string | null>(null);
    const [visitTypeFilter, setVisitTypeFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [calendarView, setCalendarView] = useState(false);
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [schedulePanel, setSchedulePanel] = useState(false);
    const [schedulePanelForm, setSchedulePanelForm] = useState({ participantId: '', visitType: 'Screening', date: '', time: '', location: 'Clinic', coordinator: '', notes: '' });
    const [openAccordions, setOpenAccordions] = useState(new Set(['checklist', 'assessments', 'vitals', 'medication', 'labs', 'ae', 'notes', 'documents']));
    const [toasts, setToasts] = useState<{ id: string, type: string, message: string }[]>([]);
    const [confirmModal, setConfirmModal] = useState<{ message: string, onConfirm: () => void, type?: string } | null>(null);
    const [auditLog, setAuditLog] = useState<{ time: string, action: string }[]>([]);

    const apiUrl = API || 'http://localhost:8000';

    // Fetch Participants from API
    const loadInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [pRes, sRes] = await Promise.all([
                authFetch(`${apiUrl}/api/participants/`),
                authFetch(`${apiUrl}/api/studies/`)
            ]);

            if (pRes.ok) {
                const data = await pRes.json();
                const mapped: Participant[] = data.map((p: any) => ({
                    id: p.id,
                    name: p.user_details?.full_name || p.participant_sid || 'Unnamed Participant',
                    email: p.user_details?.email,
                    study: p.study_name || p.study,
                    protocol_id: p.protocol_id,
                    status: p.status,
                    coordinator: p.coordinator_name || 'Coordinator Unassigned',
                    compliance: p.compliance || 100,
                    visits: (p.visits || []).map((v: any) => ({
                        id: v.id,
                        name: v.visit_type,
                        type: v.visit_type,
                        targetDate: v.scheduled_date ? new Date(v.scheduled_date).toLocaleDateString() : 'N/A',
                        windowDays: 3,
                        scheduledDate: v.scheduled_date ? new Date(v.scheduled_date).toLocaleDateString() : 'N/A',
                        actualDate: v.actual_date,
                        status: v.status.charAt(0) + v.status.slice(1).toLowerCase().replace('_', ' '),
                        location: v.location || 'Clinic',
                        checklist: v.checklist || [],
                        assessments: v.assessments || [],
                        vitals: v.measurements || { weight: '', height: '', bp: '', hr: '', temp: '' },
                        aes: [], // To be linked to AEReport model later
                        notes: v.notes ? [{ author: 'Clinical Team', role: 'Staff', time: '', text: v.notes }] : [],
                        documents: [],
                        deviations: v.deviations || [],
                        samples: v.samples || [],
                        dispensing: v.dispensing || [],
                        piApproved: v.pi_approved,
                        locked: v.locked
                    }))
                }));
                setParticipants(mapped);
                if (mapped.length > 0 && !activeParticipantId) {
                    setActiveParticipantId(mapped[0].id);
                    if (mapped[0].visits.length > 0) setActiveVisitId(mapped[0].visits[0].id);
                }
            }

            if (sRes.ok) {
                const sData = await sRes.json();
                setAvailableStudies(sData.map((s: any) => s.title));
            }
        } catch (error) {
            console.error("Failed to sync clinical data:", error);
            addToast("CRITICAL: Cluster handshake failed", "error");
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, activeParticipantId]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    // Derived Data
    const activeParticipant = participants.find(p => p.id === activeParticipantId);
    const activeVisit = activeParticipant?.visits.find(v => v.id === activeVisitId);

    const filteredParticipants = useMemo(() => {
        return participants.filter(p => {
            const matchesStudy = selectedStudy === 'All' || p.study === selectedStudy;
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 p.id.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStudy && matchesSearch;
        });
    }, [participants, selectedStudy, searchQuery]);

    // Helpers
    const addToast = (message: string, type = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev.slice(-2), { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    const logAudit = (action: string) => {
        setAuditLog(prev => [{ time: new Date().toLocaleTimeString(), action }, ...prev]);
    };

    const toggleAccordion = (id: string) => {
        setOpenAccordions(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    // Calculation BMI
    const calculateBMI = (w: any, h: any) => {
        if (!w || !h) return null;
        const bmi = (Number(w) / Math.pow(Number(h) / 100, 2)).toFixed(1);
        let cat = 'Normal';
        let color = COLORS.success;
        const b = Number(bmi);
        if (b < 18.5) { cat = 'Underweight'; color = COLORS.warning; }
        else if (b >= 25 && b < 30) { cat = 'Overweight'; color = COLORS.warning; }
        else if (b >= 30) { cat = 'Obese'; color = COLORS.danger; }
        return { bmi, cat, color };
    };

    // Handlers
    const handleUpdateVisit = async (id: string, updates: Partial<Visit>) => {
        // Optimistic UI update
        setParticipants(prev => prev.map(p => p.id === activeParticipantId ? {
            ...p,
            visits: p.visits.map(v => v.id === id ? { ...v, ...updates } : v)
        } : p));

        try {
            // Map frontend fields back to backend schema
            const payload: any = {};
            if (updates.status) payload.status = updates.status.toUpperCase().replace(' ', '_');
            if (updates.checklist) payload.checklist = updates.checklist;
            if (updates.vitals) payload.measurements = updates.vitals;
            if (updates.piApproved !== undefined) payload.pi_approved = updates.piApproved;
            if (updates.locked !== undefined) payload.locked = updates.locked;
            if (updates.location) payload.location = updates.location;

            const res = await authFetch(`${apiUrl}/api/visits/${id}/`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                addToast("Persistence Failure: Node rejected update", "error");
                loadInitialData(); // Rollback
            }
        } catch (err) {
            addToast("Signal Interference: Network error", "error");
        }
    };

    const handleCheckItem = (idx: number) => {
        if (!activeVisit || activeVisit.status === 'Completed') return;
        const newList = [...activeVisit.checklist];
        newList[idx] = { ...newList[idx], checked: !newList[idx].checked, time: new Date().toLocaleTimeString(), by: 'Dr. Yadav' };
        handleUpdateVisit(activeVisit.id, { checklist: newList });
        logAudit(`Checklist item ${newList[idx].label} updated`);
    };

    const handleSignOff = () => {
        setConfirmModal({
            message: "Mark this visit as complete? This will lock all assessments and protocol checklists.",
            onConfirm: () => {
                if (activeVisitId) handleUpdateVisit(activeVisitId, { status: 'Completed', locked: true, piApproved: true });
                setConfirmModal(null);
                addToast('Visit Signed-Off Successfully');
                logAudit(`Visit ${activeVisitId} Locked & Signed-Off`);
            }
        });
    };

    const handleScheduleVisit = async () => {
        if (!schedulePanelForm.participantId || !schedulePanelForm.date) return addToast('Participant and Date required', 'warning');
        
        setIsLoading(true);
        try {
            const payload = {
                participant: schedulePanelForm.participantId,
                visit_type: schedulePanelForm.visitType.toUpperCase().replace(' ', '_'),
                scheduled_date: new Date(`${schedulePanelForm.date}T${schedulePanelForm.time || '09:00'}:00`).toISOString(),
                location: schedulePanelForm.location,
                notes: schedulePanelForm.notes,
                checklist: [{ label: 'Consent verified', checked: false }, { label: 'Vitals collected', checked: false }],
                status: 'SCHEDULED'
            };

            const res = await authFetch(`${apiUrl}/api/visits/`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const newVisit = await res.json();
                addToast('Node Provisioned: Visit Scheduled');
                setSchedulePanel(false);
                await loadInitialData();
            } else {
                addToast('Provisioning Denied', 'error');
            }
        } catch (err) {
            addToast('Protocol Break: Request failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // --- STYLES ---
    const G = {
        glass: { backgroundColor: COLORS.glass, backdropFilter: 'blur(12px)', border: `1px solid ${COLORS.border}` },
        label: { fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: COLORS.label },
        title: { fontSize: '20px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' as const, color: 'white' },
        btnIndigo: { backgroundColor: COLORS.accent, color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '4px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer' },
        btnGhost: { backgroundColor: 'transparent', color: COLORS.text, border: `1px solid ${COLORS.border}`, padding: '0.6rem 1.25rem', borderRadius: '4px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer' },
        badge: (c: string) => ({ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30`, padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '10px', fontWeight: 900 as const, textTransform: 'uppercase' as const })
    } as Record<string, any>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', backgroundColor: COLORS.bg, color: 'white', overflow: 'hidden' }}>
            
            {/* STICKY TOP BAR */}
            <header style={{ ...G.glass, padding: '1rem 3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Calendar size={24} color={COLORS.accent} />
                    <h1 style={G.title}>Visits & Assessments</h1>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select 
                        style={{ ...G.btnGhost, backgroundColor: '#0B101B', outline: 'none' }}
                        value={selectedStudy}
                        onChange={e => setSelectedStudy(e.target.value)}
                    >
                        <option value="All">All Studies</option>
                        {availableStudies.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} color={COLORS.label} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.border}`, borderRadius: '100px', padding: '0.5rem 1rem 0.5rem 2.25rem', fontSize: '12px', color: 'white', outline: 'none' }}
                            placeholder="Find PID..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button style={G.btnIndigo} onClick={() => setSchedulePanel(true)}><Plus size={14} style={{ marginRight: '6px' }} /> Schedule Visit</button>
                    <button style={{ ...G.btnGhost, borderColor: calendarView ? COLORS.accent : COLORS.border, color: calendarView ? 'white' : COLORS.text }} onClick={() => setCalendarView(!calendarView)}>
                        {calendarView ? 'Timeline View' : 'Calendar View'}
                    </button>
                </div>
            </header>

            {/* THREE-PANEL SPLIT */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* LEFT PANEL: Participant List */}
                <div style={{ width: '260px', borderRight: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ padding: '1.25rem', borderBottom: `1px solid ${COLORS.border}` }}>
                        <label style={G.label}>Enrollment Track</label>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                        {filteredParticipants.map(p => (
                            <div 
                                key={p.id}
                                onClick={() => setActiveParticipantId(p.id)}
                                style={{
                                    padding: '1.25rem', borderBottom: `1px solid ${COLORS.border}`, cursor: 'pointer',
                                    borderLeft: `3px solid ${activeParticipantId === p.id ? COLORS.accent : 'transparent'}`,
                                    backgroundColor: activeParticipantId === p.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 900, color: 'white' }}>{p.name}</span>
                                    <span style={G.badge(
                                        p.status === 'ACTIVE' || p.status === 'RANDOMIZED' ? COLORS.success : 
                                        ['SCREENING', 'CONSENTED', 'ELIGIBLE'].includes(p.status) ? COLORS.info :
                                        ['NEW', 'CONTACTED', 'INTERESTED'].includes(p.status) ? COLORS.warning :
                                        COLORS.danger
                                    )}>{p.status}</span>
                                </div>
                                <div style={{ fontSize: '10px', color: COLORS.label, fontFamily: 'monospace', marginBottom: '0.75rem' }}>ID: {p.id.slice(-8).toUpperCase()} • {p.study}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: p.compliance > 80 ? COLORS.success : COLORS.warning }} />
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: COLORS.text }}>{p.compliance}% Compliance</span>
                                </div>
                            </div>
                        ))}
                        {filteredParticipants.length === 0 && !isLoading && (
                            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: COLORS.label, fontSize: '12px' }}>
                                No participants found matching criteria.
                            </div>
                        )}
                        {isLoading && (
                            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: COLORS.accent, fontSize: '11px', fontWeight: 900 }}>
                                <RefreshCw size={16} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                                SYNCING CLINICAL DATABASE...
                            </div>
                        )}
                    </div>
                </div>

                {/* CENTER PANEL: Timeline / Calendar */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                    {calendarView ? (
                        <div style={{ flex: 1, padding: '3rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={G.title}>Operational Calendar</h2>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button style={G.btnGhost}>Previous</button>
                                    <button style={{ ...G.btnIndigo, padding: '0.4rem 1rem' }}>Today</button>
                                    <button style={G.btnGhost}>Next</button>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: COLORS.border, border: `1px solid ${COLORS.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                                {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
                                    <div key={d} style={{ padding: '1rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', ...G.label }}>{d}</div>
                                ))}
                                {Array.from({ length: 35 }).map((_, i) => (
                                    <div key={i} style={{ height: '120px', backgroundColor: COLORS.bg, padding: '0.75rem', position: 'relative' }}>
                                        <span style={{ fontSize: '11px', color: COLORS.label }}>{i + 1}</span>
                                        {i === 12 && (
                                            <div style={{ marginTop: '0.5rem', padding: '0.3rem 0.6rem', backgroundColor: `${COLORS.accent}20`, borderRadius: '4px', border: `1px solid ${COLORS.accent}40`, fontSize: '10px', fontWeight: 900 }}>
                                                BTB-023 · Week 4
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{ flex: 1, padding: '3rem', overflowY: 'auto' }} className="custom-scrollbar">
                            <div style={{ ...G.glass, padding: '2rem', borderRadius: '24px', marginBottom: '3rem' }}>
                                <label style={G.label}>Participant Trajectory</label>
                                <div style={{ padding: '4rem 0', position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', backgroundColor: COLORS.border, zIndex: 1 }} />
                                    {activeParticipant?.visits.map(v => (
                                        <div 
                                            key={v.id} 
                                            onClick={() => setActiveVisitId(v.id)}
                                            style={{ zIndex: 2, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                                        >
                                            <div style={{ 
                                                width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                backgroundColor: v.status === 'Completed' ? COLORS.success : (v.status === 'Scheduled' ? COLORS.warning : COLORS.bg),
                                                border: `3px solid ${activeVisitId === v.id ? COLORS.accent : COLORS.border}`,
                                                boxShadow: activeVisitId === v.id ? `0 0 20px ${COLORS.accent}40` : 'none',
                                                transition: 'all 0.2s'
                                            }}>
                                                {v.status === 'Completed' ? <CheckCircle2 size={20} /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS.label }} />}
                                            </div>
                                            <div style={{ position: 'absolute', top: '50px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>{v.name}</div>
                                                <div style={{ fontSize: '10px', color: COLORS.label, marginTop: '2px' }}>{v.scheduledDate}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                {activeParticipant?.visits.map(v => (
                                    <div 
                                        key={v.id} 
                                        onClick={() => setActiveVisitId(v.id)}
                                        style={{ ...G.glass, padding: '1.5rem', borderRadius: '16px', border: `1px solid ${activeVisitId === v.id ? COLORS.accent : COLORS.border}`, cursor: 'pointer' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <span style={{ fontSize: '14px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>{v.name} Assessment</span>
                                            <span style={G.badge(v.status === 'Completed' ? COLORS.success : COLORS.warning)}>{v.status}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', color: COLORS.label, fontSize: '11px' }}>
                                            <Clock size={12} /> {v.scheduledDate}
                                            <MapPin size={12} /> {v.location}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT PANEL: Visit Details */}
                <div style={{ width: '320px', borderLeft: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255,255,255,0.01)', overflowY: 'auto' }} className="custom-scrollbar">
                    {activeVisit ? (
                        <>
                             <div style={{ padding: '2rem 1.5rem', borderBottom: `1px solid ${COLORS.border}` }}>
                                <div style={{ fontSize: '10px', fontWeight: 900, color: COLORS.accent, marginBottom: '0.4rem' }}>STUDY: {activeParticipant?.study}</div>
                                <h2 style={{ ...G.title, fontSize: '18px', color: 'white', fontStyle: 'normal' }}>{activeParticipant?.name}</h2>
                                <div style={{ marginTop: '0.6rem', fontSize: '11px', color: COLORS.label }}>{activeParticipant?.email}</div>
                                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ fontSize: '11px', color: COLORS.label }}>Internal PID: {activeParticipant?.id}</div>
                                    <div style={G.badge(activeVisit.status === 'Completed' ? COLORS.success : COLORS.warning)}>{activeVisit.status}</div>
                                </div>
                            </div>

                            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <button style={G.btnIndigo} onClick={() => handleUpdateVisit(activeVisit.id, { status: 'In Progress' })}>Start Assessment</button>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button style={{ ...G.btnGhost, flex: 1, fontSize: '9px' }}>Reschedule</button>
                                    <button style={{ ...G.btnGhost, flex: 1, fontSize: '9px', borderColor: COLORS.danger, color: COLORS.danger }}>Missed</button>
                                </div>
                            </div>

                            {/* ACCORDIONS */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {/* CHECKLIST */}
                                <div style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                    <div onClick={() => toggleAccordion('checklist')} style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                        <label style={G.label}>Protocol Checklist</label>
                                        {openAccordions.has('checklist') ? <ChevronDown size={14} color={COLORS.label} /> : <ChevronRight size={14} color={COLORS.label} />}
                                    </div>
                                    {openAccordions.has('checklist') && (
                                        <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {activeVisit.checklist.map((item, i) => (
                                                <div key={i} onClick={() => handleCheckItem(i)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', cursor: 'pointer' }}>
                                                    {item.checked ? <CheckCircle2 size={16} color={COLORS.success} /> : <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1px solid ${COLORS.border}` }} />}
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '13px', color: item.checked ? 'white' : COLORS.text }}>{item.label}</div>
                                                        {item.checked && <div style={{ fontSize: '9px', color: COLORS.label, marginTop: '2px' }}>{item.by} · {item.time}</div>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* VITALS */}
                                <div style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                    <div onClick={() => toggleAccordion('vitals')} style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                        <label style={G.label}>Vitals & Anthropometry</label>
                                        {openAccordions.has('vitals') ? <ChevronDown size={14} color={COLORS.label} /> : <ChevronRight size={14} color={COLORS.label} />}
                                    </div>
                                    {openAccordions.has('vitals') && (
                                        <div style={{ padding: '0 1.5rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <span style={{ fontSize: '10px', color: COLORS.label }}>Weight (kg)</span>
                                                <input 
                                                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.border}`, padding: '0.5rem', borderRadius: '4px', color: 'white', marginTop: '0.3rem' }}
                                                    value={activeVisit.vitals.weight}
                                                    onChange={e => handleUpdateVisit(activeVisit.id, { vitals: { ...activeVisit.vitals, weight: e.target.value } })}
                                                />
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '10px', color: COLORS.label }}>Height (cm)</span>
                                                <input 
                                                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.border}`, padding: '0.5rem', borderRadius: '4px', color: 'white', marginTop: '0.3rem' }}
                                                    value={activeVisit.vitals.height}
                                                    onChange={e => handleUpdateVisit(activeVisit.id, { vitals: { ...activeVisit.vitals, height: e.target.value } })}
                                                />
                                            </div>
                                            {calculateBMI(activeVisit.vitals.weight, activeVisit.vitals.height) && (
                                                <div style={{ gridColumn: '1 / -1', padding: '1rem', backgroundColor: `${calculateBMI(activeVisit.vitals.weight, activeVisit.vitals.height)?.color}10`, borderRadius: '8px', border: `1px solid ${calculateBMI(activeVisit.vitals.weight, activeVisit.vitals.height)?.color}30`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <span style={{ fontSize: '10px', color: COLORS.label }}>Calculated BMI</span>
                                                        <div style={{ fontSize: '18px', fontWeight: 900 }}>{calculateBMI(activeVisit.vitals.weight, activeVisit.vitals.height)?.bmi}</div>
                                                    </div>
                                                    <span style={G.badge(calculateBMI(activeVisit.vitals.weight, activeVisit.vitals.height)?.color || COLORS.success)}>{calculateBMI(activeVisit.vitals.weight, activeVisit.vitals.height)?.cat}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginTop: 'auto', padding: '2rem 1.5rem', borderTop: `1px solid ${COLORS.border}`, backgroundColor: 'rgba(7, 10, 19, 0.4)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={G.label}>Completeness</span>
                                    <span style={{ fontSize: '12px', fontWeight: 900 }}>{Math.round((activeVisit.checklist.filter(c => c.checked).length / activeVisit.checklist.length) * 100)}%</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                                    <div style={{ width: `${(activeVisit.checklist.filter(c => c.checked).length / activeVisit.checklist.length) * 100}%`, height: '100%', backgroundColor: COLORS.success, transition: 'all 0.4s' }} />
                                </div>
                                <button 
                                    style={{ ...G.btnIndigo, width: '100%', padding: '1.25rem', backgroundColor: COLORS.success }}
                                    onClick={handleSignOff}
                                    disabled={activeVisit.status === 'Completed'}
                                >
                                    Approve & Sign-Off
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: COLORS.label }}>
                            <Stethoscope size={48} style={{ opacity: 0.1, marginBottom: '2rem' }} />
                            <div style={{ ...G.title, fontSize: '16px' }}>Terminal Standby</div>
                            <div style={{ fontSize: '10px', marginTop: '0.5rem' }}>Select participant protocol node...</div>
                        </div>
                    )}
                </div>
            </div>

            {/* TOAST SYSTEM */}
            <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 2000, display: 'flex', flexDirection: 'column-reverse', gap: '0.75rem' }}>
                {toasts.map(t => (
                    <div key={t.id} style={{ 
                        padding: '1rem 2rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '1rem',
                        backgroundColor: t.type === 'success' ? COLORS.success : t.type === 'error' ? COLORS.danger : COLORS.warning,
                        color: 'white', fontWeight: 900, textTransform: 'uppercase', fontSize: '11px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        animation: 'slideIn 0.3s forwards'
                    }}>
                        <Info size={16} /> {t.message}
                    </div>
                ))}
            </div>

            {/* SCHEDULE VISIT SLIDE-IN */}
            {schedulePanel && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 4000, display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setSchedulePanel(false)} />
                    <div style={{ width: '680px', height: '100%', backgroundColor: COLORS.bg, borderLeft: `1px solid ${COLORS.border}`, position: 'relative', display: 'flex', flexDirection: 'column', animation: 'slideRight 0.4s ease-out' }}>
                        <div style={{ padding: '3rem', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={G.title}>Schedule New Protocol Node</h2>
                            <button onClick={() => setSchedulePanel(false)} style={{ background: 'none', border: 'none', color: COLORS.label, cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ flex: 1, padding: '3rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div>
                                <label style={G.label}>Participant Selector</label>
                                <select 
                                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.border}`, padding: '1rem', borderRadius: '8px', color: 'white', marginTop: '0.5rem', outline: 'none' }}
                                    value={schedulePanelForm.participantId}
                                    onChange={e => setSchedulePanelForm({...schedulePanelForm, participantId: e.target.value})}
                                >
                                    <option value="">Select Participant...</option>
                                    {participants.map(p => <option key={p.id} value={p.id}>{p.name} ({p.study})</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <label style={G.label}>Visit Taxonomy</label>
                                    <select 
                                        style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.border}`, padding: '1rem', borderRadius: '8px', color: 'white', marginTop: '0.5rem', outline: 'none' }}
                                        value={schedulePanelForm.visitType}
                                        onChange={e => setSchedulePanelForm({...schedulePanelForm, visitType: e.target.value})}
                                    >
                                        <option>Screening</option>
                                        <option>Baseline</option>
                                        <option>Follow-up</option>
                                        <option>End of Study</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={G.label}>Node Location</label>
                                    <select 
                                        style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.border}`, padding: '1rem', borderRadius: '8px', color: 'white', marginTop: '0.5rem', outline: 'none' }}
                                        value={schedulePanelForm.location}
                                        onChange={e => setSchedulePanelForm({...schedulePanelForm, location: e.target.value})}
                                    >
                                        <option>Clinic</option>
                                        <option>Virtual</option>
                                        <option>Home Visit</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <label style={G.label}>Target Date</label>
                                    <input type="date" 
                                        style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.border}`, padding: '1rem', borderRadius: '8px', color: 'white', marginTop: '0.5rem', outline: 'none' }}
                                        value={schedulePanelForm.date}
                                        onChange={e => setSchedulePanelForm({...schedulePanelForm, date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label style={G.label}>Node Time</label>
                                    <input type="time" 
                                        style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.border}`, padding: '1rem', borderRadius: '8px', color: 'white', marginTop: '0.5rem', outline: 'none' }}
                                        value={schedulePanelForm.time}
                                        onChange={e => setSchedulePanelForm({...schedulePanelForm, time: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={G.label}>Coordinator Directives</label>
                                <textarea 
                                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.border}`, padding: '1.5rem', borderRadius: '8px', color: 'white', marginTop: '0.5rem', outline: 'none', minHeight: '120px' }}
                                    placeholder="Enter scheduling notes..."
                                    value={schedulePanelForm.notes}
                                    onChange={e => setSchedulePanelForm({...schedulePanelForm, notes: e.target.value})}
                                />
                            </div>
                        </div>
                        <div style={{ padding: '3rem', borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: '1rem' }}>
                            <button style={{ ...G.btnGhost, flex: 1, padding: '1.5rem' }} onClick={() => setSchedulePanel(false)}>Cancel</button>
                            <button style={{ ...G.btnIndigo, flex: 2, padding: '1.5rem' }} onClick={handleScheduleVisit}>Commit Schedule</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRM MODAL */}
            {confirmModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} onClick={() => setConfirmModal(null)} />
                    <div style={{ ...G.glass, width: '100%', maxWidth: '400px', padding: '3rem', borderRadius: '24px', position: 'relative', textAlign: 'center' }}>
                        <ShieldAlert size={48} color={COLORS.accent} style={{ marginBottom: '1.5rem' }} />
                        <h3 style={{ ...G.title, fontSize: '20px', marginBottom: '1rem' }}>Final Validation</h3>
                        <p style={{ fontSize: '14px', lineHeight: 1.6, color: COLORS.text, marginBottom: '2rem' }}>{confirmModal.message}</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button style={{ ...G.btnGhost, flex: 1 }} onClick={() => setConfirmModal(null)}>Abort</button>
                            <button style={{ ...G.btnIndigo, flex: 1 }} onClick={confirmModal.onConfirm}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes slideRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 2px; }
            `}</style>
        </div>
    );
}
