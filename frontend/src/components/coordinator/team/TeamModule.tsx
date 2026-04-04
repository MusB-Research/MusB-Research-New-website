import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
    Users, Shield, CheckCircle2, Building2, AlertTriangle, 
    Search, Plus, X, Globe, User, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS, TeamMember, TeamDocument, ROLE_DOCS, PROTOCOLS } from './TeamConstants';
import { TeamCard } from './components/TeamCard';
import { PersonnelPanel } from './components/PersonnelPanel';

const INITIAL_MUSB: TeamMember[] = [
    { id: 'm1', name: 'Dr. Sarah Chen', email: 's.chen@musb.network', phone: '(555) 012-3456', role: 'Senior Coordinator', type: 'MusB', status: 'Active', assignedStudies: ['HI-202B'], permissionLevel: 'Full', expertise: 'Neurology', documents: [] },
    { id: 'm2', name: 'Marcus Rodriguez', email: 'm.rod@musb.network', phone: '(555) 012-3457', role: 'Clinical Lead', type: 'MusB', status: 'Active', assignedStudies: [], permissionLevel: 'Limited', expertise: 'Cardiology', documents: [] },
    { id: 'm3', name: 'Elena Gilbert', email: 'e.gilbert@musb.network', phone: '(555) 012-3458', role: 'Data Manager', type: 'MusB', status: 'Inactive', assignedStudies: ['PT-901'], permissionLevel: 'Read-only', expertise: 'Oncology', documents: [] }
];

const INITIAL_OFFICE: TeamMember[] = [
    { id: 'o1', name: 'James Wilson', email: 'j.wilson@clinic.res', phone: '(555) 987-6543', role: 'Clinical Coordinator', type: 'Office', status: 'Active', assignedStudies: ['HI-202B'], permissionLevel: 'Full', documents: [
        { id: 'd1', name: 'CV', status: 'Valid', uploadDate: '2023-10-15', isRequired: true },
        { id: 'd2', name: 'GCP Certificate', status: 'Valid', uploadDate: '2023-11-20', isRequired: true },
        { id: 'd3', name: 'HSP Certificate', status: 'Missing', isRequired: true }
    ]}
];

export default function TeamModule() {
    // State
    const [officeTeam, setOfficeTeam] = useState<TeamMember[]>(INITIAL_OFFICE);
    const [musbTeam, setMusbTeam] = useState<TeamMember[]>(INITIAL_MUSB);
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
    const [tempMusbSelected, setTempMusbSelected] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeDocId = useRef<string | null>(null);

    const addToast = useCallback((message: string, type = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev.slice(-2), { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    // Handlers
    const handleSaveMember = () => {
        if (!editedMember.name || !editedMember.email || !editedMember.role) {
            addToast('Please fill all required clinical identity fields', 'error');
            return;
        }

        if (panelMode === 'add') {
            const newMember: TeamMember = {
                id: 'o-' + Math.random().toString(36).substr(2, 5),
                name: editedMember.name!,
                email: editedMember.email!,
                phone: editedMember.phone || 'N/A',
                role: editedMember.role!,
                type: 'Office',
                status: 'Draft',
                assignedStudies: editedMember.assignedStudies || [],
                permissionLevel: editedMember.permissionLevel || 'Read-only',
                documents: editedMember.documents || []
            };
            setOfficeTeam(prev => [...prev, newMember]);
            addToast('Personnel record initialized and added to pending registry');
        } else {
            setOfficeTeam(prev => prev.map(m => m.id === editedMember.id ? { ...m, ...editedMember } as TeamMember : m));
            addToast('Clinical record synchronization complete');
        }
        setPanelOpen(false);
    };

    const handleActivateUser = () => {
        const missingDocs = (editedMember.documents || []).filter(d => d.isRequired && d.status !== 'Valid');
        if (missingDocs.length > 0) {
            addToast('Access suspension: Credentials incomplete', 'error');
            return;
        }
        const activated = { ...editedMember, status: 'Active' as const };
        setOfficeTeam(prev => prev.map(m => m.id === editedMember.id ? { ...m, ...activated } as TeamMember : m));
        setEditedMember(activated);
        addToast('Level-3 Clearance granted to personnel', 'success');
        setPanelOpen(false);
    };

    const handleDeleteMember = (member: TeamMember) => {
        if (member.assignedStudies.length > 0) {
            addToast('Clinical lock: Active protocol assignments detected', 'error');
            return;
        }
        setConfirmModal({
            message: `Permanently remove [${member.name}] from clinical registry?`,
            type: 'danger',
            onConfirm: () => {
                setOfficeTeam(prev => prev.filter(m => m.id !== member.id));
                addToast('Personnel record purged from terminal');
                setConfirmModal(null);
            }
        });
    };

    const handleStatusToggle = (member: TeamMember) => {
        const newStatus = member.status === 'Active' ? 'Inactive' : 'Active';
        const msg = newStatus === 'Inactive' ? "Access revocation will suspend protocol-level permissions. Continue?" : `Restore clinical access for ${member.name}?`;
        setConfirmModal({
            message: msg,
            onConfirm: () => {
                setOfficeTeam(prev => prev.map(m => m.id === member.id ? { ...m, status: newStatus as any } : m));
                addToast(`Permission node status: ${newStatus}`);
                setConfirmModal(null);
            }
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !activeDocId.current) return;
        const today = new Date().toISOString().split('T')[0];
        setEditedMember(prev => ({
            ...prev,
            documents: prev.documents?.map(d => d.id === activeDocId.current ? { ...d, status: 'Valid', uploadDate: today } : d)
        }));
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
        alerts: officeTeam.filter(m => m.documents.some(d => d.status !== 'Valid')).length
    };

    const S = {
        title: { fontSize: '22px', fontWeight: 900, fontStyle: 'italic' as const, textTransform: 'uppercase' as const, letterSpacing: '-0.02em', color: 'white' },
        badge: (c: string) => ({ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30`, padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' as const, display: 'inline-flex', alignItems: 'center', gap: '4px' }),
        btnIndigo: { backgroundColor: COLORS.accent, color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)' },
        btnGhost: { backgroundColor: 'transparent', color: 'white', border: COLORS.border, padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }
    };

    return (
        <div className="flex flex-col h-full bg-[#0B101B] overflow-hidden">
            <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} />

            {/* HEADER */}
            <div className="px-6 lg:px-10 py-6 lg:py-8 border-b border-white/10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-[#0B101B]">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Users size={28} />
                    </div>
                    <div>
                        <h1 style={S.title}>Staffing <span className="text-indigo-400">&</span> Personnel</h1>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 italic">Clinical RBAC & Credentials Vault</p>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                    <button style={S.btnGhost} onClick={() => setMusbModalOpen(true)}>+ Select MusB Coordinators</button>
                    <button style={S.btnIndigo} onClick={() => {
                        setPanelMode('add');
                        setEditedMember({ name: '', email: '', phone: '', role: 'Clinical Coordinator', assignedStudies: [], permissionLevel: 'Read-only', documents: (ROLE_DOCS['Clinical Coordinator'] || []).map(n => ({ id: Math.random().toString(36).substr(2,9), name: n, status: 'Missing', isRequired: true })) });
                        setPanelOpen(true);
                    }}><Plus size={18} /> New Team Member</button>
                </div>
            </div>

            {/* KPI STRIP */}
            <div className="bg-white/[0.01] border-b border-white/5 flex overflow-x-auto custom-scrollbar-horizontal shrink-0">
                {[
                    { l: 'Total Personnel', v: stats.total, i: Users, c: COLORS.accent },
                    { l: 'Active Status', v: stats.active, i: CheckCircle2, c: COLORS.success },
                    { l: 'MusB Network', v: stats.musb, i: Building2, c: COLORS.accent },
                    { l: 'Auth Alerts', v: stats.alerts, i: AlertTriangle, c: COLORS.warning }
                ].map((k, idx) => (
                    <div key={idx} className="flex-1 min-w-[200px] p-6 lg:p-8 flex items-center gap-6 border-r border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                        <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: `${k.c}10`, color: k.c }}><k.i size={24} /></div>
                        <div>
                            <div className="text-3xl font-black text-white tracking-tighter font-mono italic">{k.v.toString().padStart(2, '0')}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">{k.l}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* NAVIGATION / SEARCH */}
            <div className="p-6 lg:p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="flex items-center bg-white/5 p-2 rounded-2xl border border-white/10 w-full md:w-auto">
                    {['MusB', 'Office', 'All'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}>{t === 'MusB' ? 'MusB Net' : t === 'Office' ? 'My Office' : 'Global'}</button>
                    ))}
                </div>
                <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto">
                    {activeTab === 'MusB' && (
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                            {['All', 'Available', 'Assigned'].map(f => (
                                <button key={f} onClick={() => setFilterStatus(f)} style={{ ...S.badge(filterStatus === f ? COLORS.accent : COLORS.label), cursor: 'pointer' }}>{f}</button>
                            ))}
                        </div>
                    )}
                    <div className="relative w-full md:w-[320px]">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-[13px] text-white outline-none focus:border-indigo-500 transition-colors" placeholder="SEARCH REGISTRY..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* TABLE AREA */}
            <div className="flex-1 overflow-auto custom-scrollbar p-6 lg:p-10">
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-x-auto">
                    <table className="w-full border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-white/[0.03] border-b border-white/5">
                                {['Personnel Node', 'Functional Role', 'Study Assignments', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="p-8 text-left uppercase tracking-[0.2em] text-[12px] font-black text-slate-500 italic">{h}</th>
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
                    <div style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '100%', maxWidth: '500px', backgroundColor: COLORS.bg, border: COLORS.border, borderRadius: '24px', padding: '3rem', textAlign: 'center' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)', border: COLORS.border, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: COLORS.warning }}><Shield size={32} /></div>
                            <h3 style={{ ...S.title, fontSize: '20px', marginBottom: '1rem' }}>Clinical Registry Action</h3>
                            <p style={{ color: COLORS.text, fontSize: '15px', lineHeight: '1.6', marginBottom: '2.5rem' }}>{confirmModal.message}</p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button style={{ ...S.btnGhost, flex: 1 }} onClick={() => setConfirmModal(null)}>Cancel</button>
                                <button style={{ ...S.btnIndigo, flex: 1, backgroundColor: confirmModal.type === 'danger' ? COLORS.danger : COLORS.accent }} onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }}>Confirm Action</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* TOAST SYSTEM */}
            <div className="fixed bottom-10 right-10 z-[200] flex flex-col gap-4">
                <AnimatePresence>
                    {toasts.map(t => (
                        <motion.div key={t.id} initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} style={{ padding: '1.25rem 2.5rem', backgroundColor: t.type === 'error' ? COLORS.danger : t.type === 'warning' ? COLORS.warning : COLORS.success, color: 'white', borderRadius: '12px', fontWeight: 900, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.1em', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <CheckCircle2 size={16} /> {t.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

        </div>
    );
}
