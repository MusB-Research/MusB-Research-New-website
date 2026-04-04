export const COLORS = {
    bg: '#0B101B',
    bgDark: '#060a14',
    accent: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#38bdf8',
    text: '#94a3b8',
    label: '#475569',
    glass: 'rgba(255,255,255,0.025)',
    border: 'rgba(255,255,255,0.06)',
    modalOverlay: 'rgba(0,0,0,0.75)'
};

export interface TeamDocument {
    id: string;
    name: string;
    status: 'Valid' | 'Missing' | 'Expired';
    uploadDate?: string;
    expiryDate?: string;
    isRequired: boolean;
}

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    type: 'MusB' | 'Office';
    status: 'Active' | 'Inactive' | 'Draft';
    assignedStudies: string[];
    permissionLevel: 'Full' | 'Limited' | 'Read-only';
    documents: TeamDocument[];
    expertise?: string;
}

export const ROLE_DOCS: Record<string, string[]> = {
    'Clinical Coordinator': ['CV', 'GCP Certificate', 'HSP Certificate', 'HIPAA Agreement', 'Protocol Training'],
    'APRN': ['CV', 'APRN License', 'Malpractice Insurance', 'GCP Certificate', 'HIPAA Agreement'],
    'Sub-Investigator': ['Medical License', 'CV', 'GCP Certificate', 'DOB/ID'],
    'Phlebotomist': ['CV', 'Training Certificate', 'Venipuncture Competency', 'OSHA Training', 'HIPAA Agreement'],
    'Other': ['CV']
};

export const PROTOCOLS = ['HI-202B', 'PT-901', 'OB-442', 'VX-001', 'DM-772'];
