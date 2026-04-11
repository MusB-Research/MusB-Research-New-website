import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
    Users, Shield, CheckCircle2, Building2, AlertTriangle, 
    Search, Plus, X, Globe, User, Briefcase, RefreshCcw,
    Check, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS, TeamMember, TeamDocument, ROLE_DOCS, PROTOCOLS } from './TeamConstants';
import { TeamCard } from './components/TeamCard';
import { PersonnelPanel } from './components/PersonnelPanel';
import { authFetch, revealValue } from '../../../utils/auth';

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
                const results = data.results !== undefined ? data.results : data;
                const membersArray = Array.isArray(results) ? results : [];
                
                const formatted: TeamMember[] = membersArray.map((u: any) => ({
                    id: u.id,
                    name: revealValue(u.full_name, u.decrypted_name) || u.email?.split('@')[0] || 'Unknown User',
                    email: revealValue(u.email) || u.email || 'unknown@domain',
                    phone: u.phone_number || 'N/A',
                    role: u.role === 'PARTICIPANT' ? 'Participant' : u.role || 'Staff',
                    type: (u.affiliation || 'musb').toLowerCase() === 'onsite' ? 'Office' : 'MusB',
                    status: u.is_active ? 'Active' : 'Inactive',
                    assignedStudies: u.assigned_studies || [],
                    permissionLevel: 'Full',
                    expertise: u.affiliation === 'musb' ? (u.role === 'PI' ? 'Principal Investigator' : 'Clinical Ops') : undefined,
                    documents: []
                }));

                setMusbTeam(formatted.filter(m => m.type === 'MusB'));
                setOfficeTeam(formatted.filter(m => m.type === 'Office'));
            } else {
                // If status is not 200, log it and show a precise error
                console.error(`Registry fetch failed: ${response.status}`);
                addToast(`Sync failed: ${response.status}`, 'error');
            }
        } catch (error) {
            console.error("Team Sync Error:", error);
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
                addToast('Access granted to team member', 'success');
                fetchTeam();
                setPanelOpen(false);
            }
        } catch (error) {
            addToast('Access suspension: Terminal error', 'error');
        }
    };

    const handleDeleteMember = (member: TeamMember) => {
        setConfirmModal({
            message: `Permanently remove [${member.name}] from staff list?`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    const response = await authFetch(`/api/users/${member.id}/`, { method: 'DELETE' });
                    if (response.ok) {
                        addToast('Team member removed successfully');
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
            const matchesSearch = (m.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (m.email || "").toLowerCase().includes(searchQuery.toLowerCase());
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

    return (
        <div className="flex flex-col h-full space-y-10 pt-4">
            <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} />

            {/* Header */}
            <div className="flex justify-between items-center pb-6 border-b border-white/5">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase italic leading-none">Staffing and personnel</h2>
                    <p className="text-sm text-slate-400 mt-2 font-bold uppercase tracking-widest opacity-80">Clinical network and personnel records</p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={fetchTeam} 
                        className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-slate-300 flex items-center gap-2 hover:bg-white/10 transition-all uppercase tracking-widest"
                    >
                        <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
                        Sync list
                    </button>
                    <button 
                        onClick={() => {
                            setPanelMode('add');
                            setEditedMember({ name: '', email: '', phone: '', role: 'Clinical Coordinator', type: 'Office', assignedStudies: [], status: 'Active', documents: [] });
                            setPanelOpen(true);
                        }} 
                        className="px-6 py-2.5 bg-white text-black rounded-xl font-black text-xs flex items-center gap-2 hover:bg-slate-100 transition-all active:scale-95 shadow-lg shadow-white/10 uppercase tracking-widest"
                    >
                        <Plus size={16} /> Add member
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Personnel', val: stats.total, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                    { label: 'Active Status', val: stats.active, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                    { label: 'MusB Network', val: stats.musb, icon: Building2, color: 'text-slate-400', bg: 'bg-slate-400/10' },
                    { label: 'Inactive / Alerts', val: stats.alerts, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-400/10' },
                ].map((k, idx) => (
                    <div key={idx} className="p-6 bg-[#1E293B]/20 border border-white/5 rounded-2xl flex items-center gap-6">
                        <div className={`p-4 rounded-xl ${k.bg}`}>
                            <k.icon className={`w-6 h-6 ${k.color}`} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white leading-none">{k.val.toString().padStart(2, '0')}</p>
                            <p className="text-[11px] font-black text-slate-500 mt-3 uppercase tracking-[0.2em]">{k.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5">
                    {[
                        { id: 'MusB', label: 'MusB net' },
                        { id: 'Office', label: 'My office' },
                        { id: 'All', label: 'Global' }
                    ].map(t => (
                        <button 
                            key={t.id} 
                            onClick={() => setActiveTab(t.id as any)} 
                            className={`px-8 py-3 rounded-lg text-[11px] font-black uppercase tracking-[0.15em] transition-all ${activeTab === t.id ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto items-center">
                    <div className="flex gap-2">
                        {['All', 'Available', 'Assigned', 'Active'].map(f => (
                            <button 
                                key={f} 
                                onClick={() => setFilterStatus(f)} 
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                                    filterStatus === f 
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                    : 'bg-transparent text-slate-500 border-white/5 hover:border-white/10'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full sm:w-[320px]">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                        <input 
                            className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-12 pr-6 text-sm text-white outline-none focus:border-blue-500/50 transition-all transition-colors font-bold" 
                            placeholder="Search clinical registry..." 
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)} 
                        />
                    </div>
                </div>
            </div>

            {/* Registry Table */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="py-24 text-center">
                        <RefreshCcw size={40} className="animate-spin text-slate-700 mx-auto mb-4" />
                        <p className="text-sm text-slate-400 font-black uppercase tracking-widest">Synchronizing clinical records...</p>
                    </div>
                ) : getVisibleTeam.length === 0 ? (
                    <div className="py-32 text-center opacity-40">
                        <Users size={48} className="text-slate-600 mx-auto mb-4" />
                        <p className="text-sm text-slate-600 font-bold uppercase tracking-widest">No match found in registry</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[1000px]">
                            <thead>
                                <tr className="border-b border-white/5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    <th className="px-6 py-4 pb-2 w-1/4">Personnel node</th>
                                    <th className="px-6 py-4 pb-2 w-1/6">Functional role</th>
                                    <th className="px-6 py-4 pb-2">Study assignments</th>
                                    <th className="px-6 py-4 pb-2 w-24">Status</th>
                                    <th className="px-6 py-4 pb-2 text-right w-32">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
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
                    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 10 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-3xl p-10 text-center shadow-2xl"
                        >
                            <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-white/5 border border-white/10 ${confirmModal.type === 'danger' ? 'text-rose-500' : 'text-amber-500'}`}>
                                <Shield size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">Security protocol action</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-10">{confirmModal.message}</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-bold transition-all" onClick={() => setConfirmModal(null)}>Abort</button>
                                <button 
                                    className={`px-6 py-3 text-white rounded-xl text-sm font-bold transition-all ${confirmModal.type === 'danger' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-blue-600 hover:bg-blue-500'}`} 
                                    onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }}
                                >
                                    Proceed
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* TOAST SYSTEM (Simplified) */}
            <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-4">
                <AnimatePresence>
                    {toasts.map(t => (
                        <motion.div 
                            key={t.id} 
                            initial={{ opacity: 0, x: 50 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: 50 }} 
                            className={`px-6 py-4 rounded-xl shadow-2xl border border-white/10 flex items-center gap-4 ${
                                t.type === 'error' ? 'bg-rose-600 text-white' : 'bg-[#1E293B] text-white'
                            }`}
                        >
                            {t.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} className="text-emerald-400" />} 
                            <span className="text-xs font-bold leading-none">{t.message}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
