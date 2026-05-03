import React, { useState, useEffect, useRef } from 'react';
import {
    Users, Shield, CheckCircle2, Building2, AlertTriangle,
    Search, Edit2, Lock, Unlock, Trash2, Mail, Phone,
    ChevronRight, X, Upload, Check, FileText, AlertCircle,
    ChevronDown, User, Briefcase, Database
} from 'lucide-react';
import { authFetch, API, revealValue } from '../../utils/auth';

// --- TYPES ---
interface Document {
    id: string;
    name: string;
    status: 'Valid' | 'Missing' | 'Expired';
    uploadDate?: string;
    expiryDate?: string;
    isRequired: boolean;
}

interface TeamMember {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    type: 'MusB' | 'Office';
    status: 'Active' | 'Inactive' | 'Draft';
    assignedStudies: string[];
    permissionLevel: 'Full' | 'Limited' | 'Read-only';
    documents: Document[];
    expertise?: string;
}

interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning';
    message: string;
}

interface ConfirmModal {
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning';
}

  

  

const ROLE_DOCS: Record<string, string[]> = {
    'COORDINATOR': ['CV', 'GCP Certificate', 'HSP Certificate', 'HIPAA Agreement', 'Study Training'],
    'PI': ['Medical License', 'CV', 'GCP Certificate', 'DOB/ID'],
    'TEAM_MEMBER': ['CV', 'Training Certificate', 'Venipuncture Competency', 'OSHA Training', 'HIPAA Agreement'],
};

const ROLE_LABELS: Record<string, string> = {
    'COORDINATOR': 'Clinical Coordinator',
    'PI': 'Sub-Investigator',
    'TEAM_MEMBER': 'Staff / Other'
};

interface PITeamModuleProps {
    allUsers?: any[];
    allStudies?: any[];
    onRefresh?: () => void;
    selectedStudyId?: string;
}

// --- COMPONENT ---
export default function PITeamModule({ 
    allUsers = [], 
    allStudies = [], 
    onRefresh,
    selectedStudyId 
}: PITeamModuleProps) {
    const STUDIES = allStudies.map(s => s.protocol_id || s.id);

    // State
    const [officeTeam, setOfficeTeam] = useState<TeamMember[]>([]);
    const [musbTeam, setMusbTeam] = useState<TeamMember[]>([]);
    const [activeTab, setActiveTab] = useState<'MusB' | 'Office' | 'All'>('MusB');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // Panel/Modal State
    const [panelOpen, setPanelOpen] = useState(false);
    const [panelMode, setPanelMode] = useState<'add' | 'edit'>('add');
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [editedMember, setEditedMember] = useState<Partial<TeamMember>>({});
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (allUsers.length > 0) {
            const mapped = allUsers.map((u: any) => ({
                id: u.id,
                name: revealValue(u.full_name, u.decrypted_name) || revealValue(u.email) || 'Unknown User',
                email: revealValue(u.email) || u.email || 'unknown@domain',
                phone: u.phone_number || 'N/A',
                role: (u.role || 'MEMBER').toUpperCase().replace('_', ' '),
                type: u.affiliation === 'onsite' ? 'Office' : 'MusB',
                status: (u.status || '').toLowerCase() === 'active' ? 'Active' : 'Inactive',
                assignedStudies: u.assigned_studies || [],
                permissionLevel: 'Full',
                documents: []
            } as TeamMember));
            
            const filtered = selectedStudyId && selectedStudyId !== 'all'
                ? mapped.filter(m => m.assignedStudies.includes(selectedStudyId))
                : mapped;

            const staffOnly = filtered.filter(m => 
                !m.role.includes('SPONSOR') && 
                !m.role.includes('ADMIN') && 
                !m.role.includes('PARTICIPANT')
            );

            setOfficeTeam(staffOnly.filter(m => m.type === 'Office'));
            // Filter MusB Team to only show those with @musbresearch.com domain
            setMusbTeam(staffOnly.filter(m => m.type === 'MusB' && m.email.toLowerCase().endsWith('@musbresearch.com')));
        }
    }, [allUsers, selectedStudyId]);

    const isMobile = windowWidth < 768;
    const isTablet = windowWidth < 1440;
    const [activeRowMenu, setActiveRowMenu] = useState<string | null>(null);
    const rowMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (rowMenuRef.current && !rowMenuRef.current.contains(e.target as Node)) {
                setActiveRowMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null);
    const [musbModalOpen, setMusbModalOpen] = useState(false);
    const [tempMusbSelected, setTempMusbSelected] = useState<string[]>([]);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeDocId = useRef<string | null>(null);

    // --- LOGIC: TOASTS ---
    const addToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    // --- LOGIC: CRUD ---
    const handleSaveMember = async () => {
        if (!editedMember.name || !editedMember.email || !editedMember.role) {
            addToast('Please fill all required fields', 'error');
            return;
        }

        try {
            const nameParts = (editedMember.name || '').trim().split(/\s+/);
            const first_name = nameParts[0] || 'Unknown';
            const last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

            const payload = {
                first_name,
                last_name,
                email: editedMember.email,
                role: editedMember.role || 'TEAM_MEMBER',
                phone_number: editedMember.phone || '',
                affiliation: 'onsite',
                study_id: editedMember.assignedStudies?.[0] || 'all',
                assigned_studies: editedMember.assignedStudies || [],
                status: 'ACTIVE'
            };

            if (panelMode === 'add') {
                const res = await authFetch(`${API}/api/auth/admin/create-user/`, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    addToast('Team member added');
                    onRefresh?.();
                    setPanelOpen(false);
                } else {
                    const err = await res.json();
                    addToast(err.detail || 'Could not register member', 'error');
                }
            } else {
                const res = await authFetch(`${API}/api/users/${editedMember.id}/`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    addToast('Team member details updated');
                    onRefresh?.();
                    setPanelOpen(false);
                } else {
                    addToast('Could not update member details', 'error');
                }
            }
        } catch (error) {
            addToast('Network error during save', 'error');
        }
    };

    const handleActivateUser = async (memberID?: string) => {
        const id = memberID || editedMember.id;
        if (!id) return;

        try {
            const res = await authFetch(`${API}/api/users/${id}/`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'ACTIVE' })
            });
            if (res.ok) {
                addToast('User account activated', 'success');
                onRefresh?.();
                setPanelOpen(false);
            } else {
                addToast('Activation failed', 'error');
            }
        } catch {
            addToast('Connection error', 'error');
        }
    };

    const handleDelete = async (member: TeamMember) => {
        if (member.assignedStudies.length > 0) {
            addToast('Cannot delete — user has active study assignments. Inactivate instead.', 'error');
            return;
        }

        setConfirmModal({
            message: `This action will permanently remove ${member.name}. Continue?`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    const res = await authFetch(`${API}/api/users/${member.id}/`, { method: 'DELETE' });
                    if (res.ok) {
                        addToast('Member removed from system');
                        onRefresh?.();
                    } else {
                        addToast('Delete failed', 'error');
                    }
                } catch {
                    addToast('Connection error', 'error');
                }
                setConfirmModal(null);
            }
        });
    };

    const handleInactivateToggle = async (member: TeamMember) => {
        const newStatus = member.status === 'Active' ? 'inactive' : 'active';
        const msg = newStatus === 'inactive'
            ? "Access suspension will revoke all study-level edit permissions. Continue?"
            : `Restore access for ${member.name}?`;

        setConfirmModal({
            message: msg,
            onConfirm: async () => {
                try {
                    const res = await authFetch(`${API}/api/users/${member.id}/`, {
                        method: 'PATCH',
                        body: JSON.stringify({ status: newStatus.toUpperCase() })
                    });
                    if (res.ok) {
                        addToast(`User status updated to ${newStatus}`);
                        onRefresh?.();
                    } else {
                        addToast('Status update failed', 'error');
                    }
                } catch {
                    addToast('Connection error', 'error');
                }
                setConfirmModal(null);
            }
        });
    };


    // --- LOGIC: DOCUMENT UPLOAD ---
    const triggerUpload = (docId: string) => {
        activeDocId.current = docId;
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !activeDocId.current) return;

        const today = new Date().toISOString().split('T')[0];
        setEditedMember(prev => ({
            ...prev,
            documents: prev.documents?.map(d => d.id === activeDocId.current ? { ...d, status: 'Valid', uploadDate: today } : d)
        }));

        addToast(`Document verified: ${e.target.files[0].name}`, 'success');
        activeDocId.current = null;
    };

    // --- LOGIC: MUSB SELECTION ---
    const handleApplyMusBChanges = async () => {
        if (!selectedStudyId || selectedStudyId === 'all') {
            addToast('Please select a specific study first', 'warning');
            return;
        }

        try {
            // Update assigned_studies for each MusB member whose selection changed
            const updates = musbTeam.map(async (m) => {
                const isSelected = tempMusbSelected.includes(m.id);
                const isAlreadyAssigned = m.assignedStudies.includes(selectedStudyId);

                if (isSelected && !isAlreadyAssigned) {
                    return authFetch(`${API}/api/users/${m.id}/`, {
                        method: 'PATCH',
                        body: JSON.stringify({ 
                            assigned_studies: [...m.assignedStudies, selectedStudyId],
                            status: 'ACTIVE'
                        })
                    });
                } else if (!isSelected && isAlreadyAssigned) {
                    return authFetch(`${API}/api/users/${m.id}/`, {
                        method: 'PATCH',
                        body: JSON.stringify({ 
                            assigned_studies: m.assignedStudies.filter((s: string) => s !== selectedStudyId)
                        })
                    });
                }
                return null;
            });

            await Promise.all(updates);
            addToast('MusB team assignments updated', 'success');
            onRefresh?.();
            setMusbModalOpen(false);
        } catch (error) {
            addToast('Error updating assignments', 'error');
        }
    };

    // --- FILTERING ---
    const getVisibleTeam = () => {
        if (activeTab === 'MusB') {
            return musbTeam.filter(m => {
                const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    m.email.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesFilter = filterStatus === 'All' ||
                    (filterStatus === 'Available' && m.assignedStudies.length === 0) ||
                    (filterStatus === 'Assigned' && m.assignedStudies.length > 0) ||
                    (filterStatus === 'Active' && m.status === 'Active');
                return matchesSearch && matchesFilter;
            });
        }
        if (activeTab === 'Office') {
            return officeTeam.filter(m =>
                m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return [...officeTeam, ...musbTeam].filter(m =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    // --- STYLES ---
    const S = {
        container: {
            display: 'flex',
            flexDirection: 'column' as const,
            minHeight: '100%',
            width: '100%',
            backgroundColor: 'transparent',
            color: 'white',
            overflowX: 'hidden',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        },
        header: {
            display: 'flex',
            flexDirection: isMobile ? 'column' as const : 'row' as const,
            alignItems: isMobile ? 'center' as const : 'center' as const,
            justifyContent: 'space-between',
            padding: isMobile ? '1.5rem 1rem' : '0.5rem 1.5rem',
            gap: isMobile ? '1rem' : '0.75rem',
            borderBottom: '1px solid rgba(20, 184, 166, 0.1)',
            backgroundColor: 'rgba(7, 10, 19, 0.4)',
            backdropFilter: 'blur(40px)',
            flexShrink: 0,
            width: '100%'
        },
        title: {
            fontSize: isMobile ? '1.1rem' : '1.4rem',
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase' as const,
            letterSpacing: '-0.02em',
            margin: 0,
            opacity: 0.9
        },
        btnPrimary: {
            backgroundColor: '#14b8a6',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 900,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 15px rgba(20, 184, 166, 0.2)'
        },
        kpiStrip: {
            display: isMobile ? 'grid' : 'flex',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'none',
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexWrap: isMobile ? 'nowrap' as const : 'wrap' as const,
            overflowX: isMobile ? 'visible' as const : 'visible' as const,
            flexShrink: 0,
            backdropFilter: 'blur(10px)',
            padding: isMobile ? '0.5rem' : '0'
        },
        kpiItem: {
            flex: isMobile ? '0 0 auto' : isTablet ? '1 1 20%' : '1',
            display: 'flex',
            alignItems: 'center',
            padding: '0.4rem 1rem',
            gap: '0.75rem',
            borderRight: '1px solid rgba(20, 184, 166, 0.08)',
            backgroundColor: 'transparent',
            transition: 'all 0.2s ease'
        },
        kpiValue: {
            fontSize: '18px',
            fontFamily: 'monospace',
            fontWeight: 900,
            fontStyle: 'italic',
            lineHeight: 1,
            letterSpacing: '-0.02em',
        },
        kpiLabel: {
            fontSize: isMobile ? '9px' : '11px',
            fontWeight: 900,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.15em',
            color: '#14b8a6',
            marginTop: '2px',
            opacity: 0.8
        },
        navRow: {
            display: 'flex',
            padding: isMobile ? '0.75rem' : '0.5rem 1.5rem',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexShrink: 0,
            width: '100%',
            backgroundColor: 'rgba(255,255,255,0.01)',
            borderBottom: '1px solid rgba(255,255,255,0.03)'
        },
        tabBtn: (active: boolean) => ({
            padding: isMobile ? '0.6rem 0.5rem' : '0.6rem 1.25rem',
            flex: isMobile ? 1 : 'none',
            backgroundColor: active ? '#14b8a6' : 'rgba(255,255,255,0.03)',
            color: active ? 'white' : '#94a3b8',
            border: active ? 'none' : '1px solid rgba(255,255,255,0.05)',
            borderRadius: '4px',
            fontSize: isMobile ? '9px' : '11px',
            fontWeight: 900,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'center' as const
        }),
        searchBox: {
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '4px',
            padding: '0 1rem',
            flex: isMobile ? '1' : '0 1 400px',
            marginLeft: isMobile ? '0' : 'auto'
        },
        searchInput: {
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            padding: '0.6rem 0.75rem',
            fontSize: '12px',
            fontWeight: 900,
            textTransform: 'uppercase' as const,
            outline: 'none',
            width: '100%',
            letterSpacing: '0.05em'
        },
        tableArea: {
            flex: 1,
            overflowX: 'auto' as const,
            overflowY: isMobile ? 'visible' : 'auto' as const,
            padding: isMobile ? '0 1rem' : isTablet ? '0 1rem' : '0 1.5rem'
        },
        table: {
            width: '100%',
            borderCollapse: 'separate' as const,
            borderSpacing: '0 1px'
        },
        th: {
            position: 'sticky' as const,
            top: isMobile ? '64px' : 0,
            padding: '1rem 1.5rem',
            fontSize: '11px',
            fontWeight: 900,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.12em',
            color: '#475569',
            textAlign: 'left' as const,
            backgroundColor: 'rgba(11, 16, 27, 0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            zIndex: 10
        },
        td: {
            padding: isMobile ? '0.5rem' : '0.5rem 1rem',
            backgroundColor: 'transparent',
            verticalAlign: 'middle',
            borderBottom: '1px solid rgba(255,255,255,0.03)'
        },
        name: {
            fontSize: '13px',
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase' as const,
            color: 'white',
            marginBottom: '2px',
            letterSpacing: '0.02em'
        },
        panel: {
            position: 'fixed' as const,
            top: 0,
            right: 0,
            width: isMobile ? '100%' : '720px',
            height: '100vh',
            backgroundColor: 'rgba(7, 10, 19, 0.85)',
            backdropFilter: 'blur(40px)',
            borderLeft: '1px solid rgba(20, 184, 166, 0.3)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column' as const,
            boxShadow: '-20px 0 60px rgba(0,0,0,0.8), inset 0 0 100px rgba(20, 184, 166, 0.05)',
            transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        },
        input: {
            width: '100%',
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px',
            color: 'white',
            padding: '1rem',
            fontSize: '13px',
            outline: 'none',
            marginTop: '0.5rem'
        },
        label: {
            fontSize: '13px',
            fontWeight: 900,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.15em',
            color: '#475569',
            display: 'block'
        },
        overlay: {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 90,
            display: panelOpen || confirmModal || musbModalOpen ? 'block' : 'none'
        },
        toast: (type: string) => ({
            padding: '1.25rem 2.25rem',
            borderRadius: '8px',
            backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b',
            color: 'white',
            fontSize: '14px',
            fontWeight: 900,
            textTransform: 'uppercase' as const,
            marginBottom: '1rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            letterSpacing: '0.05em',
            minWidth: isMobile ? 'calc(100vw - 4rem)' : '320px'
        }),
        statusBadge: (status: string) => ({
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 900,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            backgroundColor: status === 'Active' ? 'rgba(20, 184, 166, 0.05)' : 'rgba(245, 158, 11, 0.05)',
            color: status === 'Active' ? '#14b8a6' : '#f59e0b',
            border: status === 'Active' ? '1px solid rgba(20, 184, 166, 0.15)' : '1px solid rgba(245, 158, 11, 0.15)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
        }),
        mobileCard: {
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '1.25rem',
            marginBottom: '1rem',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '1rem'
        }
    } as Record<string, any>;

    // --- RENDER HELPERS ---
    const renderKPI = (label: string, value: number, Icon: any, color: string) => (
        <div style={S.kpiItem}>
            <div style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: 'rgba(20, 184, 166, 0.08)', color: '#14b8a6' }}>
                <Icon size={16} />
            </div>
            <div>
                <div style={S.kpiValue}>{value.toString().padStart(2, '0')}</div>
                <div style={S.kpiLabel}>{label}</div>
            </div>
        </div>
    );

    return (
        <div style={S.container}>
            <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} />
            <div style={S.overlay} onClick={() => { setPanelOpen(false); setConfirmModal(null); setMusbModalOpen(false); }} />

            {/* HEADER */}
            <header style={S.header}>
                <h1 style={S.title}>Team Management</h1>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', width: isMobile ? '100%' : 'auto' }}>
                    <button style={S.btnGhost} onClick={() => {
                        setTempMusbSelected(musbTeam.filter(m => m.status === 'Active').map(m => m.id));
                        setMusbModalOpen(true);
                    }}>+ Select MusB Coordinators</button>
                    <button style={S.btnPrimary} onClick={() => {
                        setPanelMode('add');
                        const defaultRole = 'COORDINATOR';
                        setEditedMember({
                            name: '', email: '', phone: '', role: defaultRole,
                            assignedStudies: selectedStudyId && selectedStudyId !== 'all' ? [selectedStudyId] : [],
                            permissionLevel: 'Read-only',
                            documents: (ROLE_DOCS[defaultRole] || []).map(name => ({
                                id: Math.random().toString(36).substr(2, 9),
                                name, status: 'Missing', isRequired: true
                            }))
                        });
                        setPanelOpen(true);
                    }}>+ Add Team Member</button>
                </div>
            </header>

            {/* KPI STRIP */}
            <div style={S.kpiStrip} className="custom-scrollbar-horizontal">
                {renderKPI('Total Team', officeTeam.length + musbTeam.length, Users, '#14b8a6')}
                {renderKPI('Active Members', [...officeTeam, ...musbTeam].filter(t => t.status === 'Active').length, CheckCircle2, '#10b981')}
                {renderKPI('MusB Team', musbTeam.length, Building2, '#14b8a6')}
                {renderKPI('My Office Team', officeTeam.length, Users, '#475569')}
                {renderKPI('Missing Documents', officeTeam.filter(m => m.documents.some(d => d.status !== 'Valid')).length, AlertTriangle, '#f59e0b')}
            </div>

            {/* NAVIGATION / SEARCH */}
            <div style={S.navRow}>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'row',
                    gap: '0.5rem', 
                    width: '100%',
                    flexShrink: 0
                }}>
                    <button style={S.tabBtn(activeTab === 'MusB')} onClick={() => setActiveTab('MusB')}>MusB Team</button>
                    <button style={S.tabBtn(activeTab === 'Office')} onClick={() => setActiveTab('Office')}>My Office Team</button>
                    <button style={S.tabBtn(activeTab === 'All')} onClick={() => setActiveTab('All')}>All Members</button>
                </div>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row', 
                    gap: isMobile ? '0.75rem' : '1.5rem',
                    flex: 1,
                    justifyContent: 'flex-end',
                    width: '100%'
                }}>
                    {activeTab === 'MusB' && (
                        <div className="custom-scrollbar-horizontal" style={{ 
                            display: 'flex', 
                            gap: '0.4rem', 
                            alignItems: 'center', 
                            overflowX: 'auto', 
                            paddingBottom: isMobile ? '0.25rem' : '0',
                            width: isMobile ? '100%' : 'auto'
                        }}>
                            {!isMobile && <span style={S.label}>Filter:</span>}
                            {['All', 'Available', 'Assigned', 'Active'].map(f => (
                                <button key={f}
                                    onClick={() => setFilterStatus(f)}
                                    style={{
                                        ...S.tabBtn(filterStatus === f),
                                        padding: isMobile ? '0.4rem 0.6rem' : '0.4rem 0.8rem',
                                        flex: isMobile ? '1 0 auto' : 'none',
                                        backgroundColor: filterStatus === f ? 'rgba(20, 184, 166, 0.1)' : 'transparent',
                                        border: filterStatus === f ? '1px solid #14b8a6' : '1px solid rgba(255,255,255,0.06)',
                                        color: filterStatus === f ? '#14b8a6' : '#475569',
                                        minWidth: isMobile ? '70px' : 'auto'
                                    }}>{f}</button>
                            ))}
                        </div>
                    )}
                    <div style={{...S.searchBox, width: '100%'}}>
                        <Search size={14} color="#475569" />
                        <input
                            style={S.searchInput}
                            placeholder="SEARCH TEAM..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            {/* TABLE AREA */}
            <div style={S.tableArea} className="custom-scrollbar-horizontal pb-20">
                {isMobile ? (
                    <div className="space-y-4">
                        {getVisibleTeam().map(m => (
                            <div key={m.id} style={S.mobileCard}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                            <User size={18} color="#14b8a6" />
                                        </div>
                                        <div>
                                            <div style={S.name}>{m.name}</div>
                                            <div className="text-[11px] text-slate-500 font-bold tracking-tight lowercase">{m.email}</div>
                                        </div>
                                    </div>
                                    <span style={S.statusBadge(m.status)}>{m.status}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 py-3 border-y border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Role</p>
                                        <p className="text-[10px] font-black text-white uppercase tracking-tight">{m.role}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Affiliation</p>
                                        <p className="text-[10px] font-black text-teal-400 uppercase tracking-tight">{m.type}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Assignments</p>
                                    <div className="flex flex-wrap gap-2">
                                        {m.assignedStudies.length > 0 ? m.assignedStudies.map(s => (
                                            <span key={s} className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-teal-400 uppercase tracking-tight">
                                                {s}
                                            </span>
                                        )) : <span className="text-[10px] font-bold text-slate-600 italic">None</span>}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400">
                                            <Mail className="w-4 h-4" />
                                        </button>
                                        <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400">
                                            <Phone className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {m.type === 'Office' && (
                                            <button 
                                                onClick={() => {
                                                    setPanelMode('edit');
                                                    setEditedMember({ ...m });
                                                    setSelectedMember(m);
                                                    setPanelOpen(true);
                                                }}
                                                className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleInactivateToggle(m)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                m.status === 'Inactive' 
                                                ? 'bg-emerald-600 text-white border-emerald-500' 
                                                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                            }`}
                                        >
                                            {m.status === 'Inactive' ? 'Activate' : 'Lock'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                        <thead>
                            <tr>
                                <th style={S.th}>Team Member</th>
                                <th style={S.th}>Role</th>
                                <th style={S.th}>Assigned Studies</th>
                                <th style={{ ...S.th, textAlign: 'center' }}>Status</th>
                                <th style={{ ...S.th, textAlign: 'right', paddingRight: '2rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getVisibleTeam().map(m => (
                                <tr key={m.id} className="group-row">
                                    <td style={S.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <User size={20} color="#475569" />
                                            </div>
                                            <div>
                                                <div style={S.name}>{m.name}</div>
                                                <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.05em' }}>{m.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={S.td}>
                                        <div style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.role}</div>
                                        {m.expertise && <div style={{ fontSize: '10px', color: '#14b8a6', marginTop: '2px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.expertise}</div>}
                                    </td>
                                    <td style={S.td}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                            {m.assignedStudies.length > 0 ? m.assignedStudies.map(s => (
                                                <span key={s} style={{ fontSize: '11px', fontWeight: 900, color: '#14b8a6', backgroundColor: 'rgba(99,102,241,0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(99,102,241,0.1)' }}>{s}</span>
                                            )) : <span style={{ fontSize: '11px', color: '#475569', fontWeight: 900, letterSpacing: '0.05em' }}>NO ASSIGNMENTS</span>}
                                        </div>
                                    </td>
                                    <td style={{ ...S.td, textAlign: 'center' }}>
                                        <span style={S.statusBadge(m.status)}>{m.status}</span>
                                    </td>
                                    <td style={{ ...S.td, textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                            {m.type === 'Office' && (
                                                <button 
                                                    title="Edit Personnel"
                                                    style={{ ...S.btnGhost, padding: '0.6rem', color: '#14b8a6', borderColor: 'rgba(99,102,241,0.2)' }} 
                                                    onClick={() => {
                                                        setPanelMode('edit');
                                                        setEditedMember({ ...m });
                                                        setSelectedMember(m);
                                                        setPanelOpen(true);
                                                    }}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            )}

                                            <button 
                                                title={m.status === 'Inactive' ? "Activate" : "Lock Access"}
                                                style={{ ...S.btnGhost, padding: '0.6rem', color: m.status === 'Inactive' ? '#10b981' : '#f59e0b', borderColor: 'rgba(255,255,255,0.1)' }} 
                                                onClick={() => handleInactivateToggle(m)}
                                            >
                                                {m.status === 'Inactive' ? <Unlock size={16} /> : <Lock size={16} />}
                                            </button>

                                            {m.type === 'Office' ? (
                                                <button 
                                                    title="Remove Member"
                                                    style={{ ...S.btnGhost, padding: '0.6rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.1)' }} 
                                                    onClick={() => handleDelete(m)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            ) : (
                                                <button 
                                                    title="MUSB NETWORK USER"
                                                    style={{ ...S.btnGhost, padding: '0.6rem' }} 
                                                    onClick={() => addToast('MUSB PROFILE MANAGED BY ADMIN', 'warning')}
                                                >
                                                    <Shield size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* SLIDE-IN PANEL */}
            <div style={S.panel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h2 style={S.title}>{panelMode === 'add' ? 'Register New Personnel' : 'Edit Team Member'}</h2>
                    <button style={{ ...S.btnGhost, padding: '0.5rem' }} onClick={() => setPanelOpen(false)}><X size={20} /></button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 2rem' }}>
                    {/* IDENTITY */}
                    <section style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ width: '2px', height: '14px', backgroundColor: '#14b8a6' }} />
                            <h3 style={S.label}>Personnel Identity</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={S.label}>Full Name</label>
                                <input style={S.input} value={editedMember.name || ''} onChange={e => setEditedMember({ ...editedMember, name: e.target.value })} />
                            </div>
                            <div>
                                <label style={S.label}>Role Dropdown</label>
                                <select style={{ ...S.input, fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }} value={editedMember.role} onChange={e => {
                                    const role = e.target.value;
                                    setEditedMember({
                                        ...editedMember,
                                        role,
                                        documents: (ROLE_DOCS[role] || []).map(name => ({
                                            id: Math.random().toString(36).substr(2, 9),
                                            name, status: 'Missing', isRequired: true
                                        }))
                                    });
                                }}>
                                    <option value="" disabled>SELECT ROLE</option>
                                    {Object.keys(ROLE_DOCS).map(r => <option key={r} value={r} style={{ backgroundColor: '#0B101B', color: 'white' }}>{ROLE_LABELS[r] || r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={S.label}>Email Address</label>
                                <input style={S.input} value={editedMember.email || ''} onChange={e => setEditedMember({ ...editedMember, email: e.target.value })} />
                            </div>
                            <div>
                                <label style={S.label}>Phone Number</label>
                                <input style={S.input} value={editedMember.phone || ''} onChange={e => setEditedMember({ ...editedMember, phone: e.target.value })} />
                            </div>
                        </div>
                    </section>

                    {/* AUTHORIZATION */}
                    <section style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ width: '2px', height: '14px', backgroundColor: '#14b8a6' }} />
                            <h3 style={S.label}>Authorization & Scope</h3>
                        </div>
                        <label style={{ ...S.label, marginBottom: '0.5rem' }}>Assign Studies</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                            {STUDIES.map(p => {
                                const selected = editedMember.assignedStudies?.includes(p);
                                return (
                                    <button key={p}
                                        onClick={() => setEditedMember({
                                            ...editedMember,
                                            assignedStudies: selected
                                                ? editedMember.assignedStudies?.filter(s => s !== p)
                                                : [...(editedMember.assignedStudies || []), p]
                                        })}
                                        style={{
                                            ...S.btnGhost,
                                            padding: '0.5rem 1rem',
                                            backgroundColor: selected ? '#14b8a6' : 'transparent',
                                            color: selected ? 'white' : '#475569',
                                            borderColor: selected ? '#14b8a6' : 'rgba(255,255,255,0.06)'
                                        }}>{p}</button>
                                );
                            })}
                        </div>

                        <label style={{ ...S.label, marginBottom: '0.5rem' }}>Permission Level</label>
                        <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', padding: '4px' }}>
                            {['Full', 'Limited', 'Read-only'].map(lvl => (
                                <button key={lvl}
                                    onClick={() => setEditedMember({ ...editedMember, permissionLevel: lvl as any })}
                                    style={{
                                        flex: 1, padding: '0.6rem', border: 'none', borderRadius: '4px',
                                        fontSize: '11px', fontWeight: 900, textTransform: 'uppercase',
                                        backgroundColor: editedMember.permissionLevel === lvl ? '#14b8a6' : 'transparent',
                                        color: editedMember.permissionLevel === lvl ? 'white' : '#475569',
                                        cursor: 'pointer'
                                    }}>{lvl}</button>
                            ))}
                        </div>
                    </section>

                    {/* REPOSITORY */}
                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: '2px', height: '14px', backgroundColor: '#14b8a6' }} />
                            <h3 style={S.label}>Qualification Repository ({editedMember.role})</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {editedMember.documents?.map(doc => (
                                <div key={doc.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '1rem', backgroundColor: doc.status === 'Valid' ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                                    borderRadius: '4px', border: `1px solid ${doc.status === 'Valid' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)'}`
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        {doc.status === 'Valid' ? <CheckCircle2 size={16} color="#10b981" /> : <AlertCircle size={16} color="#475569" />}
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: doc.status === 'Valid' ? 'white' : '#475569' }}>{doc.name}</div>
                                            {doc.uploadDate && <div style={{ fontSize: '12px', color: '#10b981', marginTop: '2px' }}>VERIFIED: {doc.uploadDate}</div>}
                                        </div>
                                    </div>
                                    <button style={{ ...S.btnGhost, padding: '0.4rem 0.8rem' }} onClick={() => triggerUpload(doc.id)}>
                                        <Upload size={12} style={{ marginRight: '6px' }} /> UPLOAD
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* BOTTOM BANNER */}
                <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    {editedMember.status !== 'Active' && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                            borderRadius: '4px', marginBottom: '1.5rem',
                            backgroundColor: (editedMember.documents || []).every(d => d.status === 'Valid') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.05)',
                            border: `1px solid ${(editedMember.documents || []).every(d => d.status === 'Valid') ? '#10b981' : '#ef4444'}20`
                        }}>
                            {(editedMember.documents || []).every(d => d.status === 'Valid') ? (
                                <>
                                    <CheckCircle2 size={20} color="#10b981" />
                                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#10b981' }}>ALL CREDENTIALS VERIFIED. READY FOR ACTIVATION.</div>
                                </>
                            ) : (
                                <>
                                    <AlertCircle size={20} color="#ef4444" />
                                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#ef4444' }}>
                                        INELIGIBLE: {(editedMember.documents || []).filter(d => d.status !== 'Valid').length} DOCUMENTS REMAINING
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {panelMode === 'edit' && (
                            <button style={{ ...S.btnGhost, borderColor: '#ef444430', color: '#ef4444' }} onClick={() => handleDelete(editedMember as TeamMember)}>DELETE PERSON</button>
                        )}
                        <div style={{ flex: 1 }} />
                        <button style={S.btnGhost} onClick={() => setPanelOpen(false)}>CANCEL</button>
                        <button style={{
                            ...S.btnPrimary,
                            backgroundColor: (editedMember.documents || []).every(d => d.status === 'Valid') ? '#10b981' : '#1e293b',
                            cursor: (editedMember.documents || []).every(d => d.status === 'Valid') ? 'pointer' : 'not-allowed'
                        }} onClick={() => handleActivateUser()}>
                            {(editedMember.documents || []).every(d => d.status === 'Valid') ? 'ACTIVATE USER' : 'LOCKED'}
                        </button>
                        <button style={S.btnPrimary} onClick={handleSaveMember}>SAVE PROGRESSION</button>
                    </div>
                </div>
            </div>

            {/* MUSB MODAL */}
            {musbModalOpen && (
                <div style={{
                    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '600px', backgroundColor: '#0B101B', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', zIndex: 100, overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                        <h2 style={S.title}>SELECT MUSB COORDINATORS</h2>
                        <button onClick={() => setMusbModalOpen(false)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}><X size={20} /></button>
                    </div>
                    <div style={{ padding: '1.5rem', maxHeight: '500px', overflowY: 'auto' }}>
                        {musbTeam.filter(m => m.role.includes('COORDINATOR')).length > 0 ? 
                         musbTeam.filter(m => m.role.includes('COORDINATOR')).map(m => (
                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                                onClick={() => {
                                    setTempMusbSelected(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]);
                                }}>
                                <input type="checkbox" checked={tempMusbSelected.includes(m.id)} readOnly style={{ width: '22px', height: '22px', accentColor: '#14b8a6', cursor: 'pointer' }} />
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{m.name}</div>
                                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.expertise || m.role} <span style={{ opacity: 0.3, margin: '0 8px' }}>|</span> {m.email}</div>
                                </div>
                            </div>
                        )) : (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#475569', fontSize: '14px', fontWeight: 'bold' }}>NO MUSB PERSONNEL FOUND</div>
                        )}
                    </div>
                    <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button style={S.btnGhost} onClick={() => setMusbModalOpen(false)}>CANCEL</button>
                        <button style={S.btnPrimary} onClick={handleApplyMusBChanges}>CONFIRM SELECTION</button>
                    </div>
                </div>
            )}

            {/* CONFIRM MODAL */}
            {confirmModal && (
                <div style={{
                    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '400px', backgroundColor: '#0B101B', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', zIndex: 110, padding: '2rem', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.8)'
                }}>
                    <div style={{ color: confirmModal.type === 'danger' ? '#ef4444' : '#f59e0b', marginBottom: '1.5rem' }}>
                        <AlertTriangle size={48} style={{ margin: '0 auto' }} />
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', marginBottom: '2rem' }}>{confirmModal.message}</p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button style={{ ...S.btnGhost, flex: 1 }} onClick={() => setConfirmModal(null)}>CANCEL</button>
                        <button style={{
                            ...S.btnPrimary,
                            flex: 1,
                            backgroundColor: confirmModal.type === 'danger' ? '#ef4444' : '#14b8a6'
                        }} onClick={confirmModal.onConfirm}>PROCEED</button>
                    </div>
                </div>
            )}

            {/* TOASTS */}
            <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 200, display: 'flex', flexDirection: 'column-reverse' }}>
                {toasts.map(t => (
                    <div key={t.id} style={S.toast(t.type)}>
                        {t.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                        {t.message}
                    </div>
                ))}
            </div>
        </div>
    );
}


