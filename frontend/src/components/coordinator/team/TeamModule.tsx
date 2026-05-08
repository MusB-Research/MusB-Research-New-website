import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
    Users, Shield, CheckCircle2, Building2, AlertTriangle, 
    Search, Plus, X, Globe, User, Briefcase, RefreshCcw,
    Check, ChevronRight, Edit2, Unlock, Lock, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS, TeamMember, TeamDocument, ROLE_DOCS, PROTOCOLS } from './TeamConstants';
import { TeamCard } from './components/TeamCard';
import { PersonnelPanel } from './components/PersonnelPanel';
import { authFetch, revealValue } from '../../../utils/auth';

export default function TeamModule({ 
    selectedStudyId, 
    initialUsers,
    allStudies = [],
    onRefresh
}: { 
    selectedStudyId?: string, 
    initialUsers?: any[],
    allStudies?: any[],
    onRefresh?: () => void 
}) {
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
            // Using the unified listing endpoint that includes pending invitations
            const response = await authFetch('/api/auth/list-team-members/');
            if (response.ok) {
                const data = await response.json();
                const membersArray = Array.isArray(data) ? data : [];
                
                const formatted: TeamMember[] = membersArray.map((u: any) => ({
                    id: u.id,
                    name: u.name || revealValue(u.full_name, u.decrypted_name) || u.email?.split('@')[0] || 'Unknown User',
                    email: revealValue(u.email) || u.email || 'unknown@domain',
                    phone: u.phone || u.phone_number || 'N/A',
                    role: u.role === 'PARTICIPANT' ? 'Participant' : u.role || 'Staff',
                    type: (u.affiliation || 'musb').toLowerCase() === 'onsite' ? 'Office' : 'MusB',
                    status: u.status === 'PENDING' ? 'Draft' : (u.is_active !== false ? 'Active' : 'Inactive'),
                    assignedStudies: u.assigned_studies || [],
                    permissionLevel: 'Full',
                    expertise: u.affiliation === 'musb' ? (u.role === 'PI' ? 'Principal Investigator' : 'Clinical Ops') : undefined,
                    documents: []
                }));

                const staffOnly = formatted.filter(m => {
                    const roleStr = String(m.role || '').toUpperCase().replace(/[\s_-]/g, '');
                    const statusStr = String(m.status || '').toUpperCase();
                    return roleStr !== 'SUPERADMIN' &&
                           roleStr !== 'ADMIN' &&
                           roleStr !== 'PARTICIPANT' &&
                           statusStr !== 'DRAFT' &&
                           statusStr !== 'PENDING';
                });

                setMusbTeam(staffOnly.filter(m => m.type === 'MusB'));
                setOfficeTeam(staffOnly.filter(m => m.type === 'Office'));
            } else {
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

    const initialFetchAttempted = useRef(false);

    useEffect(() => {
        if (!initialFetchAttempted.current) {
            initialFetchAttempted.current = true;
            if (initialUsers && initialUsers.length > 0) {
                // Bootstrapping from parent data
                const membersArray = initialUsers;
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

                const staffOnly = formatted.filter(m => {
                    const roleStr = String(m.role || '').toUpperCase().replace(/[\s_-]/g, '');
                    const statusStr = String(m.status || '').toUpperCase();
                    return roleStr !== 'SUPERADMIN' &&
                           roleStr !== 'ADMIN' &&
                           roleStr !== 'PARTICIPANT' &&
                           roleStr !== 'PARTICIPANT' &&
                           statusStr !== 'DRAFT' &&
                           statusStr !== 'PENDING';
                });

                setMusbTeam(staffOnly.filter(m => m.type === 'MusB'));
                setOfficeTeam(staffOnly.filter(m => m.type === 'Office'));
                setLoading(false);
            } else {
                fetchTeam();
            }
        }
    }, [initialUsers, fetchTeam]);

    // Handlers
    const handleSaveMember = async () => {
        if (!editedMember.name || !editedMember.email || !editedMember.role) {
            addToast('All fields required for clinical registry', 'error');
            return;
        }

        try {
            const roleMapper: Record<string, string> = {
                'Clinical Coordinator': 'COORDINATOR',
                'APRN': 'COORDINATOR',
                'Sub-Investigator': 'PI',
                'Phlebotomist': 'TEAM_MEMBER',
                'Other': 'TEAM_MEMBER',
                'PI': 'PI'
            };

            const mappedRole = roleMapper[editedMember.role || 'Other'] || 'TEAM_MEMBER';

            if (panelMode === 'add') {
                // Use Invitation Endpoint for new members to ensure proper email flow
                const response = await authFetch('/api/auth/invite-team-member/', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: editedMember.email,
                        role: mappedRole,
                        organization: editedMember.type === 'Office' ? 'onsite' : 'MusB',
                        study_ids: editedMember.assignedStudies || []
                    })
                });

                if (response.ok) {
                    addToast('Invitation dispatched to team member');
                    if (onRefresh) onRefresh();
                    else fetchTeam();
                    setPanelOpen(false);
                } else {
                    const err = await response.json();
                    addToast(err.error || 'Registry invitation failed', 'error');
                }
            } else {
                // Update existing User record
                const response = await authFetch(`/api/users/${editedMember.id}/`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        full_name: editedMember.name,
                        email: editedMember.email,
                        phone_number: editedMember.phone,
                        role: mappedRole,
                        affiliation: editedMember.type === 'Office' ? 'onsite' : 'musb',
                        is_active: editedMember.status === 'Active',
                        assigned_studies: editedMember.assignedStudies || []
                    })
                });

                if (response.ok) {
                    addToast('Personnel record synchronized');
                    if (onRefresh) onRefresh();
                    else fetchTeam();
                    setPanelOpen(false);
                } else {
                    const err = await response.json();
                    addToast(err.error || 'Registry update failed', 'error');
                }
            }
        } catch (error) {
            addToast('Terminal connection error', 'error');
        }
    };

    const handleResendInvitation = async (member: TeamMember) => {
        try {
            const response = await authFetch(`/api/auth/resend-invitation/${member.id}/`, {
                method: 'POST'
            });
            if (response.ok) {
                addToast('Invitation reminder dispatched');
            } else {
                addToast('Failed to resend invitation', 'error');
            }
        } catch (error) {
            addToast('Connection failure', 'error');
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
                if (onRefresh) onRefresh();
                else fetchTeam();
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
                        if (onRefresh) onRefresh();
                        else fetchTeam();
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
                        if (onRefresh) onRefresh();
                        else fetchTeam();
                    }
                } catch (error) {
                    addToast('Status update failed', 'error');
                }
            }
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeDocId.current) return;

        setEditedMember(prev => ({
            ...prev,
            documents: prev.documents?.map(doc => {
                if (doc.id === activeDocId.current) {
                    return {
                        ...doc,
                        status: 'Valid',
                        uploadDate: new Date().toLocaleDateString(),
                        fileName: file.name
                    };
                }
                return doc;
            })
        }));

        addToast(`Document uploaded successfully: ${file.name}`);
        activeDocId.current = null;
        e.target.value = '';
    };

    const getVisibleTeam = useMemo(() => {
        const filterFn = (m: TeamMember) => {
            const roleStr = String(m.role || '').toUpperCase().replace(/[\s_-]/g, '');
            if (roleStr === 'SUPERADMIN' || roleStr === 'ADMIN') return false;

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
        <div className="flex flex-col min-h-full space-y-4 pt-2 px-4 sm:px-6 lg:px-0">
            <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase italic leading-none">Staffing and personnel</h2>
                    <p className="text-[10px] sm:text-sm text-slate-400 mt-2 font-bold uppercase tracking-widest opacity-80">Clinical network and personnel records</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={fetchTeam} 
                        className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] sm:text-xs font-black text-slate-300 flex items-center justify-center gap-2 hover:bg-white/10 transition-all uppercase tracking-widest"
                    >
                        <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
                        <span className="hidden xs:inline">Sync list</span>
                        <span className="xs:hidden">Sync</span>
                    </button>
                    <button 
                        onClick={() => {
                            setPanelMode('add');
                            setEditedMember({ name: '', email: '', phone: '', role: '', type: 'Office', assignedStudies: [], status: 'Active', documents: [] });
                            setPanelOpen(true);
                        }} 
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-white text-black rounded-xl font-black text-[10px] sm:text-xs flex items-center justify-center gap-2 hover:bg-slate-100 transition-all active:scale-95 shadow-lg shadow-white/10 uppercase tracking-widest"
                    >
                        <Plus size={16} /> <span className="hidden xs:inline">Add member</span><span className="xs:hidden">Add</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { label: 'Total Personnel', val: stats.total, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                    { label: 'Active Status', val: stats.active, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                    { label: 'MusB Network', val: stats.musb, icon: Building2, color: 'text-slate-400', bg: 'bg-slate-400/10' },
                    { label: 'Inactive / Alerts', val: stats.alerts, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-400/10' },
                ].map((k, idx) => (
                    <div key={idx} className="p-3 sm:p-4 bg-[#0B101B]/50 backdrop-blur-xl border border-white/5 rounded-2xl flex items-center gap-3 sm:gap-4 shadow-2xl">
                        <div className={`p-3 rounded-xl ${k.bg} shrink-0 border border-white/5`}>
                            <k.icon className={`w-5 h-5 ${k.color}`} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl sm:text-2xl font-black text-white leading-none italic">{k.val.toString().padStart(2, '0')}</p>
                            <p className="text-[10px] font-black text-slate-500 mt-2 uppercase tracking-[0.2em] truncate">{k.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                    {/* Desktop Tab Buttons */}
                    <div className="hidden xl:flex items-center gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/5 w-full xl:w-auto overflow-x-auto no-scrollbar">
                        {[
                            { id: 'MusB', label: 'MusB net' },
                            { id: 'Office', label: 'My office' },
                            { id: 'All', label: 'Global' }
                        ].map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => setActiveTab(t.id as any)} 
                                className={`flex-1 xl:flex-none whitespace-nowrap px-4 lg:px-8 py-2.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] transition-all ${activeTab === t.id ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Mobile/Tablet Tab Dropdown */}
                    <div className="xl:hidden w-full relative">
                        <select 
                            value={activeTab}
                            onChange={(e) => setActiveTab(e.target.value as any)}
                            className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3.5 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="MusB">MusB Net</option>
                            <option value="Office">My Office</option>
                            <option value="All">Global</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronRight size={16} className="rotate-90" />
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto items-center">
                        {/* Desktop Filter Status Buttons */}
                        <div className="hidden xl:flex gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                            {['All', 'Available', 'Assigned', 'Active'].map(f => (
                                <button 
                                    key={f} 
                                    onClick={() => setFilterStatus(f)} 
                                    className={`flex-1 sm:flex-none whitespace-nowrap px-3 sm:px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                                        filterStatus === f 
                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                        : 'bg-transparent text-slate-500 border-white/5 hover:border-white/10'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        {/* Mobile/Tablet Filter Dropdown */}
                        <div className="xl:hidden w-full relative">
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3.5 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Available">Available</option>
                                <option value="Assigned">Assigned</option>
                                <option value="Active">Active</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronRight size={16} className="rotate-90" />
                            </div>
                        </div>

                        <div className="relative w-full sm:w-[280px] lg:w-[320px]">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                            <input 
                                className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-12 pr-6 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-bold placeholder:text-slate-600" 
                                placeholder="Search registry..." 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)} 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Registry Content */}
            <div className="flex-1">
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
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden xl:block overflow-x-auto border border-white/5 rounded-2xl bg-[#0F172A]/40">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                        <th className="px-6 py-3.5 w-1/4">Personnel node</th>
                                        <th className="px-6 py-3.5 w-1/6">Functional role</th>
                                        <th className="px-6 py-3.5">Study assignments</th>
                                        <th className="px-6 py-3.5 w-24">Status</th>
                                        <th className="px-6 py-3.5 text-right w-32">Actions</th>
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
                                            onResendInvite={handleResendInvitation}
                                            activeRowMenu={activeRowMenu}
                                            setActiveRowMenu={setActiveRowMenu}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                            {getVisibleTeam.map(m => (
                                <div key={m.id} className="p-4 bg-[#0B101B]/40 backdrop-blur-xl border border-white/5 rounded-2xl space-y-4 shadow-2xl overflow-hidden">
                                    <div className="flex flex-col xs:flex-row justify-between items-start gap-4 w-full min-w-0">
                                        <div className="flex items-center gap-4 min-w-0 flex-1 w-full">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                                                <User size={24} className="text-slate-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-black text-white uppercase italic tracking-tight truncate">{m.name}</div>
                                                <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest truncate">{m.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-row xs:flex-col items-center xs:items-end gap-2 w-full xs:w-auto">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                m.status === 'Active' 
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                : (m.status === 'Draft' || m.status === 'PENDING')
                                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                : 'bg-white/5 text-slate-500 border-white/5'
                                            }`}>
                                                {m.status}
                                            </span>
                                            {m.type === 'MusB' && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/5 border border-blue-500/10 text-[9px] font-black uppercase tracking-widest text-blue-400/70">
                                                    <Shield size={12} /> Network
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Functional Role</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest italic leading-none">{m.role}</p>
                                                {m.type === 'MusB' ? (
                                                    <span className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-[8px] font-black uppercase tracking-widest text-blue-400 rounded-md">
                                                        Internal
                                                    </span>
                                                ) : (
                                                    <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-[8px] font-black uppercase tracking-widest text-amber-400 rounded-md">
                                                        External
                                                    </span>
                                                )}
                                            </div>
                                            {m.expertise && <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-wider opacity-60 leading-none italic">{m.expertise}</p>}
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Assignments</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {m.assignedStudies.length > 0 ? m.assignedStudies.map(s => (
                                                    <span key={s} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{s}</span>
                                                )) : <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest opacity-60">none</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-white/5">
                                        {m.type !== 'MusB' ? (
                                            <>
                                                {(m.status === 'Draft' || m.status === 'PENDING') ? (
                                                    <button 
                                                        onClick={() => handleResendInvitation(m)}
                                                        className="flex-1 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <RefreshCcw size={14} /> Resend Invite
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={() => { setPanelMode('edit'); setEditedMember(m); setPanelOpen(true); }}
                                                            className="flex-1 py-2.5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black text-slate-300 uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Edit2 size={14} className="text-blue-400" /> Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => handleStatusToggle(m)}
                                                            className="flex-1 py-2.5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black text-slate-300 uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            {m.status === 'Inactive' ? <Unlock size={14} className="text-emerald-400" /> : <Lock size={14} className="text-amber-400" />} {m.status === 'Inactive' ? 'Activate' : 'Suspend'}
                                                        </button>
                                                    </>
                                                )}
                                                <button 
                                                    onClick={() => handleDeleteMember(m)}
                                                    className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 hover:bg-rose-500/20 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="w-full py-2.5 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest italic opacity-50">
                                                Network permissions managed by system
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <PersonnelPanel 
                isOpen={panelOpen}
                onClose={() => setPanelOpen(false)}
                mode={panelMode}
                editedMember={editedMember}
                setEditedMember={setEditedMember}
                allStudies={allStudies}
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
