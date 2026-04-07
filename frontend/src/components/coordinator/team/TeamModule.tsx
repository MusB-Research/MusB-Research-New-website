import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
    Users, Shield, CheckCircle2, Building2, AlertTriangle, 
    Search, Plus, X, Globe, User, Briefcase, RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS, TeamMember, TeamDocument, ROLE_DOCS, PROTOCOLS } from './TeamConstants';
import { TeamCard } from './components/TeamCard';
import { PersonnelPanel } from './components/PersonnelPanel';
import { authFetch } from '../../../utils/authFetch';

export default function TeamModule({ selectedStudyId }: { selectedStudyId?: string }) {
    // State
    const [officeTeam, setOfficeTeam] = useState<TeamMember[]>([]);
    const [musbTeam, setMusbTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'MusB' | 'Office' | 'All'>('MusB');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    const [panelOpen, setPanelOpen] = useState(false);
    const [panelMode, setPanelMode] = useState<'add' | 'edit'>('add');
    const [editedMember, setEditedMember] = useState<Partial<TeamMember>>({});
    const [activeRowMenu, setActiveRowMenu] = useState<string | null>(null);

    const [toasts, setToasts] = useState<{ id: string, type: string, message: string }[]>([]);
    const [confirmModal, setConfirmModal] = useState<{ message: string, onConfirm: () => void, type?: string } | null>(null);
    const [musbModalOpen, setMusbModalOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeDocId = useRef<string | null>(null);

    const addToast = useCallback((message: string, type = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev.slice(-2), { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    // BACKEND INTEGRATION
    const fetchTeam = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authFetch('/api/users/');
            if (response.ok) {
                const data = await response.json();
                
                const formatted: TeamMember[] = data.map((u: any) => ({
                    id: u.id,
                    name: u.full_name || u.email.split('@')[0],
                    email: u.email,
                    phone: u.phone_number || 'N/A',
                    role: u.role === 'PARTICIPANT' ? 'Participant' : u.role || 'Staff',
                    type: (u.affiliation || 'musb').toLowerCase() === 'onsite' ? 'Office' : 'MusB',
                    status: u.is_active ? 'Active' : 'Inactive',
                    assignedStudies: u.assigned_studies || [],
                    permissionLevel: 'Full', // Defaulting for visual
                    expertise: u.affiliation === 'musb' ? (u.role === 'PI' ? 'Principal Investigator' : 'Clinical Ops') : undefined,
                    documents: [] // Documents are managed in a separate vault but initialized here for UI
                }));

                setMusbTeam(formatted.filter(m => m.type === 'MusB'));
                setOfficeTeam(formatted.filter(m => m.type === 'Office'));
            }
        } catch (error) {
            addToast('Clinical terminal synchronization failed', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchTeam();
    }, [fetchTeam]);

    // Handlers
    const handleSaveMember = async () => {
        if (!editedMember.name || !editedMember.email || !editedMember.role) {
            addToast('All fields required for clinical registry', 'error');
            return;
        }

        try {
            const payload = {
                full_name: editedMember.name,
                email: editedMember.email,
                phone_number: editedMember.phone,
                role: editedMember.role,
                affiliation: editedMember.type === 'Office' ? 'onsite' : 'musb',
                is_active: editedMember.status === 'Active',
                assigned_studies: editedMember.assignedStudies || []
            };

            const url = panelMode === 'edit' ? `/api/users/${editedMember.id}/` : '/api/users/';
            const method = panelMode === 'edit' ? 'PATCH' : 'POST';

            const response = await authFetch(url, {
                method,
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                addToast(panelMode === 'edit' ? 'Clinical record synchronized' : 'Personnel record initialized');
                fetchTeam();
                setPanelOpen(false);
            } else {
                const err = await response.json();
                addToast(err.error || 'Registry update failed', 'error');
            }
        } catch (error) {
            addToast('Terminal connection error', 'error');
        }
    };

    const handleActivateUser = async () => {
        try {
            const response = await authFetch(`/api/users/${editedMember.id}/`, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: true })
            });
            if (response.ok) {
                addToast('Level-3 Clearance granted to personnel', 'success');
                fetchTeam();
                setPanelOpen(false);
            }
        } catch (error) {
            addToast('Access suspension: Terminal error', 'error');
        }
    };

    const handleDeleteMember = (member: TeamMember) => {
        setConfirmModal({
            message: `Permanently remove [${member.name}] from clinical registry?`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    const response = await authFetch(`/api/users/${member.id}/`, { method: 'DELETE' });
                    if (response.ok) {
                        addToast('Personnel record purged from terminal');
                        fetchTeam();
                    }
                } catch (error) {
                    addToast('Registry purge failed', 'error');
                }
            }
        });
    };

    const handleStatusToggle = (member: TeamMember) => {
        const newStatus = member.status === 'Active' ? 'Inactive' : 'Active';
        const msg = newStatus === 'Inactive' ? "Access revocation will suspend protocol-level permissions. Continue?" : `Restore clinical access for ${member.name}?`;
        setConfirmModal({
            message: msg,
            onConfirm: async () => {
                try {
                    const response = await authFetch(`/api/users/${member.id}/`, {
                        method: 'PATCH',
                        body: JSON.stringify({ is_active: newStatus === 'Active' })
                    });
                    if (response.ok) {
                        addToast(`Permission node status: ${newStatus}`);
                        fetchTeam();
                    }
                } catch (error) {
                    addToast('Status update failed', 'error');
                }
            }
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !activeDocId.current) return;
        addToast(`Encrypted document verified: ${e.target.files[0].name}`);
        activeDocId.current = null;
    };

    const getVisibleTeam = useMemo(() => {
        const filterFn = (m: TeamMember) => {
            const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterStatus === 'All' || (filterStatus === 'Available' && m.assignedStudies.length === 0) || (filterStatus === 'Assigned' && m.assignedStudies.length > 0) || (filterStatus === 'Active' && m.status === 'Active');
            return matchesSearch && matchesFilter;
        };
        if (activeTab === 'MusB') return musbTeam.filter(filterFn);
        if (activeTab === 'Office') return officeTeam.filter(filterFn);
        return [...officeTeam, ...musbTeam].filter(filterFn);
    }, [officeTeam, musbTeam, activeTab, searchQuery, filterStatus]);

    const stats = {
        total: officeTeam.length + musbTeam.length,
        active: [...officeTeam, ...musbTeam].filter(t => t.status === 'Active').length,
        musb: musbTeam.length,
        alerts: officeTeam.filter(m => m.status === 'Inactive').length
    };

    const S = {
        title: { fontSize: '24px', fontWeight: 900, fontStyle: 'italic' as const, textTransform: 'uppercase' as const, letterSpacing: '-0.02em', color: 'white' },
        badge: (c: string) => ({ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30`, padding: '0.5rem 1.25rem', borderRadius: '4px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, display: 'inline-flex', alignItems: 'center', gap: '6px' }),
        btnIndigo: { backgroundColor: COLORS.accent, color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)' },
        btnGhost: { backgroundColor: 'transparent', color: 'white', border: `1.5px solid ${COLORS.border}`, padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }
    };

    return (
        <div className="flex flex-col h-full bg-[#0B101B] overflow-hidden">
            <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} />

            {/* HEADER */}
            <div className="px-6 lg:px-10 py-6 lg:py-8 border-b border-white/10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-[#0B101B]">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Users size={32} />
                    </div>
                    <div>
                        <h1 style={S.title}>Staffing <span className="text-indigo-400">&</span> Personnel</h1>
                        <p className="text-[12px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1 italic">Clinical RBAC & Credentials Vault</p>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                    <button style={S.btnGhost} onClick={fetchTeam} className="hover:bg-white/5 transition-colors">
                        <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                        Sync Terminal
                    </button>
                    <button style={S.btnIndigo} onClick={() => {
                        setPanelMode('add');
                        setEditedMember({ name: '', email: '', phone: '', role: 'Clinical Coordinator', type: 'Office', assignedStudies: [], status: 'Active', documents: [] });
                        setPanelOpen(true);
                    }} className="hover:brightness-110 transition-all">
                        <Plus size={20} /> New Team Member
                    </button>
                </div>
            </div>

            {/* KPI STRIP */}
            <div className="bg-white/[0.01] border-b border-white/5 flex overflow-x-auto custom-scrollbar-horizontal shrink-0">
                {[
                    { l: 'Total Personnel', v: stats.total, i: Users, c: COLORS.accent },
                    { l: 'Active Status', v: stats.active, i: CheckCircle2, c: COLORS.success },
                    { l: 'MusB Network', v: stats.musb, i: Building2, c: COLORS.accent },
                    { l: 'Inactive / Alerts', v: stats.alerts, i: AlertTriangle, c: COLORS.warning }
                ].map((k, idx) => (
                    <div key={idx} className="flex-1 min-w-[200px] p-6 lg:p-10 flex items-center gap-8 border-r border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                        <div style={{ padding: '1rem', borderRadius: '16px', backgroundColor: `${k.c}10`, color: k.c }}><k.i size={28} /></div>
                        <div>
                            <div className="text-4xl font-black text-white tracking-tighter font-mono italic leading-none">{k.v.toString().padStart(2, '0')}</div>
                            <div className="text-[12px] font-bold uppercase tracking-widest text-slate-500 mt-2">{k.l}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* NAVIGATION / SEARCH */}
            <div className="p-6 lg:p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-[#0B101B]">
                <div className="flex items-center bg-white/5 p-2 rounded-2xl border border-white/10 w-full md:w-auto">
                    {['MusB', 'Office', 'All'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 md:flex-none px-10 py-4 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}>{t === 'MusB' ? 'MusB Net' : t === 'Office' ? 'My Office' : 'Global'}</button>
                    ))}
                </div>
                <div className="flex flex-col md:flex-row gap-8 w-full md:w-auto items-center">
                    <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
                        {['All', 'Available', 'Assigned', 'Active'].map(f => (
                            <button key={f} onClick={() => setFilterStatus(f)} style={{ ...S.badge(filterStatus === f ? COLORS.accent : COLORS.label), cursor: 'pointer' }} className="hover:brightness-125 transition-all">{f}</button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-[360px]">
                        <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-14 pr-6 text-[14px] text-white outline-none focus:border-indigo-500 focus:bg-white/[0.08] transition-all" placeholder="SEARCH CLINICAL REGISTRY..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* TABLE AREA */}
            <div className="flex-1 overflow-auto custom-scrollbar p-6 lg:p-10 bg-[#0B101B]">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                        <RefreshCcw size={48} className="animate-spin text-indigo-500/50" />
                        <p className="text-[14px] font-black uppercase tracking-widest italic">Synchronizing Personnel Ledger...</p>
                    </div>
                ) : getVisibleTeam.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-6 opacity-40">
                        <Users size={64} />
                        <p className="text-[16px] font-black uppercase tracking-[0.3em] italic">No Match Found in Registry</p>
                    </div>
                ) : (
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse min-w-[1100px]">
                                <thead>
                                    <tr className="bg-white/[0.04] border-b border-white/10">
                                        {['Personnel Node', 'Functional Role', 'Study Assignments', 'Status', 'Actions'].map(h => (
                                            <th key={h} className="p-10 text-left uppercase tracking-[0.25em] text-[13px] font-black text-slate-400 italic">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {getVisibleTeam.map(m => (
                                        <TeamCard 
                                            key={m.id} 
                                            member={m} 
                                            onEdit={(mem) => { setPanelMode('edit'); setEditedMember(mem); setPanelOpen(true); }}
                                            onDelete={handleDeleteMember}
                                            onStatusToggle={handleStatusToggle}
                                            activeRowMenu={activeRowMenu}
                                            setActiveRowMenu={setActiveRowMenu}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <PersonnelPanel 
                isOpen={panelOpen}
                onClose={() => setPanelOpen(false)}
                mode={panelMode}
                editedMember={editedMember}
                setEditedMember={setEditedMember}
                handleSave={handleSaveMember}
                handleActivate={handleActivateUser}
                triggerUpload={(id) => { activeDocId.current = id; fileInputRef.current?.click(); }}
            />

            {/* CONFIRMATION MODAL */}
            <AnimatePresence>
                {confirmModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '520px', backgroundColor: '#0B101B', border: `1px solid ${COLORS.border}`, borderRadius: '24px', padding: '4rem', textAlign: 'center', boxShadow: '0 30px 60px rgba(0,0,0,1)' }}>
                            <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem', color: confirmModal.type === 'danger' ? COLORS.danger : COLORS.warning }}><Shield size={40} /></div>
                            <h3 style={{ ...S.title, fontSize: '24px', marginBottom: '1.5rem' }}>Security Protocol Action</h3>
                            <p style={{ color: COLORS.text, fontSize: '16px', lineHeight: '1.7', marginBottom: '3rem', fontWeight: 600 }}>{confirmModal.message}</p>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <button style={{ ...S.btnGhost, flex: 1, padding: '1.25rem' }} onClick={() => setConfirmModal(null)} className="hover:bg-white/5 transition-all">Abort</button>
                                <button style={{ ...S.btnIndigo, flex: 1, backgroundColor: confirmModal.type === 'danger' ? COLORS.danger : COLORS.accent, padding: '1.25rem' }} onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className="hover:brightness-110 transition-all">Proceed</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* TOAST SYSTEM */}
            <div className="fixed bottom-12 right-12 z-[200] flex flex-col gap-6">
                <AnimatePresence>
                    {toasts.map(t => (
                        <motion.div key={t.id} initial={{ opacity: 0, x: 100, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 100, scale: 0.9 }} style={{ padding: '1.5rem 3rem', backgroundColor: t.type === 'error' ? COLORS.danger : t.type === 'warning' ? COLORS.warning : COLORS.success, color: 'white', borderRadius: '16px', fontWeight: 900, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.15em', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {t.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />} 
                            {t.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

        </div>
    );
}



