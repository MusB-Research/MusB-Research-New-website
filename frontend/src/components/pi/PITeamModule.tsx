import React, { useState, useEffect, useRef } from 'react';
import {
    Users, Shield, CheckCircle2, Building2, AlertTriangle,
    Search, Edit2, Lock, Unlock, Trash2, Mail, Phone,
    ChevronRight, X, Upload, Check, FileText, AlertCircle,
    ChevronDown, User, Briefcase, Database, MoreVertical
} from 'lucide-react';

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

// --- MOCK DATA ---
const MOCK_MUSB: TeamMember[] = [
    {
        id: 'm1', name: 'Dr. Sarah Chen', email: 's.chen@musb.network', phone: '(555) 012-3456',
        role: 'Senior Coordinator', type: 'MusB', status: 'Active', assignedStudies: ['HI-202B'],
        permissionLevel: 'Full', expertise: 'Neurology', documents: []
    },
    {
        id: 'm2', name: 'Marcus Rodriguez', email: 'm.rod@musb.network', phone: '(555) 012-3457',
        role: 'Clinical Lead', type: 'MusB', status: 'Active', assignedStudies: [],
        permissionLevel: 'Limited', expertise: 'Cardiology', documents: []
    },
    {
        id: 'm3', name: 'Elena Gilbert', email: 'e.gilbert@musb.network', phone: '(555) 012-3458',
        role: 'Data Manager', type: 'MusB', status: 'Inactive', assignedStudies: ['PT-901'],
        permissionLevel: 'Read-only', expertise: 'Oncology', documents: []
    }
];

const INITIAL_OFFICE_TEAM: TeamMember[] = [
    {
        id: 'o1', name: 'James Wilson', email: 'j.wilson@clinic.res', phone: '(555) 987-6543',
        role: 'Clinical Coordinator', type: 'Office', status: 'Active', assignedStudies: ['HI-202B'],
        permissionLevel: 'Full', documents: [
            { id: 'd1', name: 'CV', status: 'Valid', uploadDate: '2023-10-15', isRequired: true },
            { id: 'd2', name: 'GCP Certificate', status: 'Valid', uploadDate: '2023-11-20', isRequired: true },
            { id: 'd3', name: 'HSP Certificate', status: 'Missing', isRequired: true }
        ]
    }
];

const ROLE_DOCS: Record<string, string[]> = {
    'Clinical Coordinator': ['CV', 'GCP Certificate', 'HSP Certificate', 'HIPAA Agreement', 'Protocol Training'],
    'APRN': ['CV', 'APRN License', 'Malpractice Insurance', 'GCP Certificate', 'HIPAA Agreement'],
    'Sub-Investigator': ['Medical License', 'CV', 'GCP Certificate', 'DOB/ID'],
    'Phlebotomist': ['CV', 'Training Certificate', 'Venipuncture Competency', 'OSHA Training', 'HIPAA Agreement'],
    'Other': ['CV']
};

const PROTOCOLS = ['HI-202B', 'PT-901', 'OB-442', 'VX-001', 'DM-772'];

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
    // State
    const [officeTeam, setOfficeTeam] = useState<TeamMember[]>([]);
    const [musbTeam, setMusbTeam] = useState<TeamMember[]>([]);
    const [activeTab, setActiveTab] = useState<'MusB' | 'Office' | 'All'>('Office');
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
                name: u.full_name || u.email,
                email: u.email,
                phone: u.phone_number || 'N/A',
                role: u.role?.toUpperCase() || 'MEMBER',
                type: u.affiliation === 'onsite' ? 'Office' : 'MusB',
                status: (u.status || '').toLowerCase() === 'active' ? 'Active' : 'Inactive',
                assignedStudies: u.assigned_studies || [],
                permissionLevel: 'Full',
                documents: []
            } as TeamMember));
            
            // Filter by selectedStudyId if provided
            const filtered = selectedStudyId && selectedStudyId !== 'all'
                ? mapped.filter(m => m.assignedStudies.includes(selectedStudyId))
                : mapped;

            // Filter out sponsors as they have their own module now
            setOfficeTeam(filtered.filter(m => m.type === 'Office' && m.role !== 'SPONSOR'));
            setMusbTeam(filtered.filter(m => m.type === 'MusB' && m.role !== 'SPONSOR'));
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
    const handleSaveMember = () => {
        // Validation
        if (!editedMember.name || !editedMember.email || !editedMember.role) {
            addToast('Please fill all required identity fields', 'error');
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
            addToast('New personnel registered to PI Office');
        } else {
            setOfficeTeam(prev => prev.map(m => m.id === editedMember.id ? { ...m, ...editedMember } as TeamMember : m));
            addToast('Personnel record updated successfully');
        }
        setPanelOpen(false);
    };

    const handleActivateUser = () => {
        // Validation for missing docs
        const missingDocs = (editedMember.documents || []).filter(d => d.isRequired && d.status !== 'Valid');
        if (missingDocs.length > 0) {
            addToast('Cannot activate: Credentials incomplete', 'error');
            return;
        }

        const activated = { ...editedMember, status: 'Active' as const };
        setOfficeTeam(prev => prev.map(m => m.id === editedMember.id ? { ...m, ...activated } as TeamMember : m));
        setEditedMember(activated); // Update local panel state too
        addToast('User activated successfully', 'success');
        setPanelOpen(false);
    };

    const handleDelete = (member: TeamMember) => {
        // Blocking logic
        if (member.assignedStudies.length > 0) {
            addToast('Cannot delete — user has active study assignments. Inactivate instead.', 'error');
            return;
        }

        setConfirmModal({
            message: `This action will permanently remove ${member.name}. Continue?`,
            type: 'danger',
            onConfirm: () => {
                setOfficeTeam(prev => prev.filter(m => m.id !== member.id));
                addToast('Member removed from system');
                setConfirmModal(null);
                if (panelOpen && selectedMember?.id === member.id) setPanelOpen(false);
            }
        });
    };

    const handleInactivateToggle = (member: TeamMember) => {
        const newStatus = member.status === 'Active' ? 'Inactive' : 'Active';
        const msg = newStatus === 'Inactive'
            ? "Access suspension will revoke all protocol-level edit permissions. Continue?"
            : `Restore access for ${member.name}?`;

        setConfirmModal({
            message: msg,
            onConfirm: () => {
                setOfficeTeam(prev => prev.map(m => m.id === member.id ? { ...m, status: newStatus as any } : m));
                addToast(`User status updated to ${newStatus}`);
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
    const handleApplyMusBChanges = () => {
        // Toggle 'Assigned' status based on selection
        setMusbTeam(prev => prev.map(m => ({
            ...m,
            status: tempMusbSelected.includes(m.id) ? 'Active' : 'Inactive'
        } as TeamMember)));

        addToast('MusB team updated', 'success');
        setMusbModalOpen(false);
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
            height: isMobile ? 'auto' : '100vh',
            width: '100%',
            backgroundColor: 'transparent',
            color: 'white',
            overflow: isMobile ? 'visible' : 'hidden',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '1.5rem 1.5rem' : '1rem 2.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
            borderBottom: '1px solid rgba(99, 102, 241, 0.15)',
            backgroundColor: 'rgba(7, 10, 19, 0.7)',
            backdropFilter: 'blur(40px)',
            flexShrink: 0,
            boxShadow: 'inset 0 -1px 20px rgba(99, 102, 241, 0.05)'
        },
        title: {
            fontSize: isMobile ? '1.25rem' : '1.75rem',
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase' as const,
            letterSpacing: '-0.04em',
            margin: 0
        },
        btnPrimary: {
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 900,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.12em',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginLeft: '1.5rem',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)'
        },
        btnGhost: {
            backgroundColor: 'transparent',
            color: '#94a3b8',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '1rem 2rem',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 900,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.12em',
            cursor: 'pointer',
            transition: 'all 0.2s'
        },
        kpiStrip: {
            display: 'flex',
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexWrap: isMobile ? 'nowrap' as const : 'wrap' as const,
            overflowX: isMobile ? 'auto' as const : 'visible' as const,
            flexShrink: 0,
            backdropFilter: 'blur(10px)'
        },
        kpiItem: {
            flex: isMobile ? '0 0 auto' : isTablet ? '1 1 30%' : '1',
            display: 'flex',
            alignItems: 'center',
            padding: '1rem 1.75rem',
            gap: '1rem',
            borderRight: '1px solid rgba(99, 102, 241, 0.15)',
            borderBottom: isTablet ? '1px solid rgba(99, 102, 241, 0.15)' : 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.01)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        },
        kpiValue: {
            fontSize: '22px',
            fontFamily: 'monospace',
            fontWeight: 900,
            fontStyle: 'italic',
            lineHeight: 1,
            letterSpacing: '-0.05em',
            textShadow: '0 0 30px rgba(99, 102, 241, 0.3)'
        },
        kpiLabel: {
            fontSize: '11px',
            fontWeight: 900,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.25em',
            color: '#94a3b8',
            marginTop: '8px'
        },
        navRow: {
            display: 'flex',
            padding: isMobile ? '1.25rem' : '0.75rem 2.5rem',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            flexShrink: 0
        },
        tabBtn: (active: boolean) => ({
            padding: '0.6rem 1.25rem',
            backgroundColor: active ? '#6366f1' : 'transparent',
            color: active ? 'white' : '#94a3b8',
            border: active ? 'none' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 900,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.12em',
            cursor: 'pointer',
            marginRight: '0.75rem',
            transition: 'all 0.2s'
        }),
        searchBox: {
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            padding: '0 1.25rem'
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
            width: '200px',
            letterSpacing: '0.05em'
        },
        tableArea: {
            flex: 1,
            overflowX: 'auto' as const,
            overflowY: isMobile ? 'visible' : 'auto' as const,
            padding: isMobile ? '0 1rem' : isTablet ? '0 1.5rem' : '0 2.5rem'
        },
        table: {
            width: '100%',
            borderCollapse: 'separate' as const,
            borderSpacing: '0 1px'
        },
        th: {
            position: 'sticky' as const,
            top: isMobile ? '64px' : 0,
            padding: isMobile ? '0.75rem' : isTablet ? '1rem' : '1.25rem 1.5rem',
            fontSize: '11px',
            fontWeight: 900,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            color: '#64748b',
            textAlign: 'left' as const,
            backgroundColor: 'rgba(11, 16, 27, 0.9)',
            backdropFilter: 'blur(20px)',
            zIndex: 10
        },
        td: {
            padding: isMobile ? '1rem 0.75rem' : isTablet ? '1.25rem' : '1.5rem 1.5rem',
            backgroundColor: 'rgba(255,255,255,0.01)',
            verticalAlign: 'middle',
            borderBottom: '1px solid rgba(255,255,255,0.04)'
        },
        name: {
            fontSize: '14px',
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase' as const,
            color: 'white',
            marginBottom: '6px',
            letterSpacing: '-0.02em'
        },
        panel: {
            position: 'fixed' as const,
            top: 0,
            right: 0,
            width: isMobile ? '100%' : '720px',
            height: '100vh',
            backgroundColor: 'rgba(7, 10, 19, 0.85)',
            backdropFilter: 'blur(40px)',
            borderLeft: '1px solid rgba(99, 102, 241, 0.3)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column' as const,
            boxShadow: '-20px 0 60px rgba(0,0,0,0.8), inset 0 0 100px rgba(99, 102, 241, 0.05)',
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
            fontSize: '12px',
            outline: 'none',
            marginTop: '0.5rem'
        },
        label: {
            fontSize: '12px',
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
            padding: '0.6rem 1rem',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 900,
            textTransform: 'uppercase' as const,
            backgroundColor: status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
            color: status === 'Active' ? '#10b981' : '#94a3b8',
            border: `1px solid ${status === 'Active' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)'}`
        })
    } as Record<string, any>;

    // --- RENDER HELPERS ---
    const renderKPI = (label: string, value: number, Icon: any, color: string) => (
        <div style={S.kpiItem}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: `${color}10`, color: color }}>
                <Icon size={20} />
            </div>
            <div>
                <div style={{ ...S.kpiValue, color: label === 'Action Required' && value > 0 ? '#f59e0b' : 'inherit' }}>{value.toString().padStart(2, '0')}</div>
                <div style={{ ...S.kpiLabel, fontSize: '11px' }}>{label}</div>
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
                        const defaultRole = 'Clinical Coordinator';
                        setEditedMember({
                            name: '', email: '', phone: '', role: defaultRole,
                            assignedStudies: [], permissionLevel: 'Read-only',
                            documents: ROLE_DOCS[defaultRole].map(name => ({
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
                {renderKPI('Total Personnel', officeTeam.length + musbTeam.length, Users, '#6366f1')}
                {renderKPI('Active Status', [...officeTeam, ...musbTeam].filter(t => t.status === 'Active').length, CheckCircle2, '#10b981')}
                {renderKPI('MusB Network', musbTeam.length, Building2, '#6366f1')}
                {renderKPI('PI Office Team', officeTeam.length, Users, '#475569')}
                {renderKPI('Action Required', officeTeam.filter(m => m.documents.some(d => d.status !== 'Valid')).length, AlertTriangle, '#f59e0b')}
            </div>

            {/* NAVIGATION / SEARCH */}
            <div style={S.navRow}>
                <div className="custom-scrollbar-horizontal" style={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    gap: '0.5rem', 
                    width: isMobile ? '100%' : 'auto',
                    overflowX: isMobile ? 'auto' : 'visible',
                    paddingBottom: isMobile ? '0.75rem' : '0',
                    flexShrink: 0
                }}>
                    <button style={S.tabBtn(activeTab === 'MusB')} onClick={() => setActiveTab('MusB')}>MusB Coordinators</button>
                    <button style={S.tabBtn(activeTab === 'Office')} onClick={() => setActiveTab('Office')}>My Office Team</button>
                    <button style={S.tabBtn(activeTab === 'All')} onClick={() => setActiveTab('All')}>All Team Members</button>
                </div>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row', 
                    gap: isMobile ? '1.25rem' : '1.5rem',
                    width: isMobile ? '100%' : 'auto'
                }}>
                    {activeTab === 'MusB' && (
                        <div className="custom-scrollbar-horizontal" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? '0.5rem' : '0' }}>
                            <span style={S.label}>Filter:</span>
                            {['All', 'Available', 'Assigned', 'Active'].map(f => (
                                <button key={f}
                                    onClick={() => setFilterStatus(f)}
                                    style={{
                                        ...S.tabBtn(filterStatus === f),
                                        padding: '0.4rem 0.6rem',
                                        backgroundColor: filterStatus === f ? 'rgba(99,102,241,0.1)' : 'transparent',
                                        border: filterStatus === f ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.06)',
                                        color: filterStatus === f ? '#6366f1' : '#475569'
                                    }}>{f}</button>
                            ))}
                        </div>
                    )}
                    <div style={{ ...S.searchBox, width: isMobile ? '100%' : 'auto' }}>
                        <Search size={14} color="#475569" />
                        <input
                            style={{ ...S.searchInput, width: isMobile ? '100%' : '200px' }}
                            placeholder="SEARCH TEAM..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* TABLE AREA */}
            <div style={S.tableArea} className="custom-scrollbar-horizontal">
                <table style={{ ...S.table, minWidth: isTablet ? '1200px' : '100%' }}>
                    <thead>
                        <tr>
                            <th style={S.th}>Personnel</th>
                            <th style={{ ...S.th, width: '20%' }}>Role</th>
                            <th style={S.th}>Assigned Protocols</th>
                            <th style={{ ...S.th, textAlign: 'center' }}>Status</th>
                            <th style={{ ...S.th, textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getVisibleTeam().map(m => (
                            <tr key={m.id}>
                                <td style={S.td}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={20} color="#475569" />
                                        </div>
                                        <div>
                                            <div style={S.name}>{m.name}</div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.05em' }}>{m.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={S.td}>
                                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.role}</div>
                                    {m.expertise && <div style={{ fontSize: '11px', color: '#6366f1', marginTop: '6px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.expertise}</div>}
                                </td>
                                <td style={S.td}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                                        {m.assignedStudies.length > 0 ? m.assignedStudies.map(s => (
                                            <span key={s} style={{ fontSize: '14px', fontWeight: 900, color: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid rgba(99,102,241,0.2)' }}>{s}</span>
                                        )) : <span style={{ fontSize: '14px', color: '#475569', fontWeight: 900, letterSpacing: '0.1em' }}>NO ASSIGNMENTS</span>}
                                    </div>
                                </td>
                                <td style={{ ...S.td, textAlign: 'center' }}>
                                    <span style={S.statusBadge(m.status)}>{m.status}</span>
                                </td>
                                <td style={{ ...S.td, textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', position: 'relative' }}>
                                        {m.type === 'Office' ? (
                                            <div ref={activeRowMenu === m.id ? rowMenuRef : null}>
                                                <button 
                                                    style={{ ...S.btnGhost, padding: '0.5rem' }} 
                                                    onClick={() => setActiveRowMenu(activeRowMenu === m.id ? null : m.id)}
                                                >
                                                    <MoreVertical size={16} />
                                                </button>

                                                {activeRowMenu === m.id && (
                                                    <div style={{
                                                        position: 'absolute', right: 0, top: '100%',
                                                        backgroundColor: '#0B101B', border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: '8px', zIndex: 50, width: '200px',
                                                        boxShadow: '0 20px 40px rgba(0,0,0,0.6)', marginTop: '0.5rem', overflow: 'hidden'
                                                    }}>
                                                        <button 
                                                            style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', padding: '1rem', background: 'none', border: 'none', color: 'white', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
                                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            onClick={() => {
                                                                setPanelMode('edit');
                                                                setEditedMember({ ...m });
                                                                setSelectedMember(m);
                                                                setPanelOpen(true);
                                                                setActiveRowMenu(null);
                                                            }}
                                                        >
                                                            <Edit2 size={14} color="#6366f1" /> EDIT PERSONNEL
                                                        </button>
                                                        <button 
                                                            style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', padding: '1rem', background: 'none', border: 'none', color: 'white', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
                                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            onClick={() => { handleInactivateToggle(m); setActiveRowMenu(null); }}
                                                        >
                                                            {m.status === 'Inactive' ? <><Unlock size={14} color="#10b981" /> ACTIVATE USER</> : <><Lock size={14} color="#f59e0b" /> LOCK ACCESS</>}
                                                        </button>
                                                        <button 
                                                            style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', padding: '1rem', background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
                                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.05)'}
                                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            onClick={() => { handleDelete(m); setActiveRowMenu(null); }}
                                                        >
                                                            <Trash2 size={14} /> REMOVE MEMBER
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <button style={{ ...S.btnGhost, padding: '0.5rem' }} onClick={() => addToast('MUSB CREDENTIALS MANAGED BY NETWORK ADMIN', 'warning')}>
                                                <Shield size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* SLIDE-IN PANEL */}
            <div style={S.panel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h2 style={S.title}>{panelMode === 'add' ? 'Register New Personnel' : 'Edit Team Member'}</h2>
                    <button style={{ ...S.btnGhost, padding: '0.5rem' }} onClick={() => setPanelOpen(false)}><X size={20} /></button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                    {/* IDENTITY */}
                    <section style={{ marginBottom: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: '2px', height: '14px', backgroundColor: '#6366f1' }} />
                            <h3 style={S.label}>Personnel Identity</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={S.label}>Full Name</label>
                                <input style={S.input} value={editedMember.name || ''} onChange={e => setEditedMember({ ...editedMember, name: e.target.value })} />
                            </div>
                            <div>
                                <label style={S.label}>Role Dropdown</label>
                                <select style={{ ...S.input, fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }} value={editedMember.role} onChange={e => {
                                    const role = e.target.value;
                                    setEditedMember({
                                        ...editedMember,
                                        role,
                                        documents: ROLE_DOCS[role].map(name => ({
                                            id: Math.random().toString(36).substr(2, 9),
                                            name, status: 'Missing', isRequired: true
                                        }))
                                    });
                                }}>
                                    {Object.keys(ROLE_DOCS).map(r => <option key={r} value={r} style={{ backgroundColor: '#0B101B', color: 'white' }}>{r.toUpperCase()}</option>)}
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
                    <section style={{ marginBottom: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: '2px', height: '14px', backgroundColor: '#6366f1' }} />
                            <h3 style={S.label}>Authorization & Scope</h3>
                        </div>
                        <label style={{ ...S.label, marginBottom: '0.75rem' }}>Assign Studies</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            {PROTOCOLS.map(p => {
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
                                            backgroundColor: selected ? '#6366f1' : 'transparent',
                                            color: selected ? 'white' : '#475569',
                                            borderColor: selected ? '#6366f1' : 'rgba(255,255,255,0.06)'
                                        }}>{p}</button>
                                );
                            })}
                        </div>

                        <label style={{ ...S.label, marginBottom: '0.75rem' }}>Permission Level</label>
                        <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', padding: '4px' }}>
                            {['Full', 'Limited', 'Read-only'].map(lvl => (
                                <button key={lvl}
                                    onClick={() => setEditedMember({ ...editedMember, permissionLevel: lvl as any })}
                                    style={{
                                        flex: 1, padding: '0.75rem', border: 'none', borderRadius: '4px',
                                        fontSize: '11px', fontWeight: 900, textTransform: 'uppercase',
                                        backgroundColor: editedMember.permissionLevel === lvl ? '#6366f1' : 'transparent',
                                        color: editedMember.permissionLevel === lvl ? 'white' : '#475569',
                                        cursor: 'pointer'
                                    }}>{lvl}</button>
                            ))}
                        </div>
                    </section>

                    {/* REPOSITORY */}
                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: '2px', height: '14px', backgroundColor: '#6366f1' }} />
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
                                            {doc.uploadDate && <div style={{ fontSize: '10px', color: '#10b981', marginTop: '2px' }}>VERIFIED: {doc.uploadDate}</div>}
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
                                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#10b981' }}>ALL CREDENTIALS VERIFIED. READY FOR ACTIVATION.</div>
                                </>
                            ) : (
                                <>
                                    <AlertCircle size={20} color="#ef4444" />
                                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#ef4444' }}>
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
                        }} onClick={handleActivateUser}>
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
                        {MOCK_MUSB.map(m => (
                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                                onClick={() => {
                                    setTempMusbSelected(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]);
                                }}>
                                <input type="checkbox" checked={tempMusbSelected.includes(m.id)} readOnly style={{ width: '22px', height: '22px', accentColor: '#6366f1', cursor: 'pointer' }} />
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{m.name}</div>
                                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.expertise} <span style={{ opacity: 0.3, margin: '0 8px' }}>|</span> {m.email}</div>
                                </div>
                            </div>
                        ))}
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
                            backgroundColor: confirmModal.type === 'danger' ? '#ef4444' : '#6366f1'
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
