export interface PersonalDoc {
    id: string;
    name: string;
    type: 'Medical License' | 'CV' | 'GCP Training' | 'Board Cert' | 'Financial Disclosure';
    status: 'Valid' | 'Expiring Soon' | 'Expired';
    expiryDate: string;
    fileUrl: string;
}

export const INITIAL_DOCS: PersonalDoc[] = [
    { id: 'PD-01', name: 'FL State Medical License - 2026', type: 'Medical License', status: 'Valid', expiryDate: '2027-12-31', fileUrl: '#' },
    { id: 'PD-02', name: 'Curriculum Vitae (CV) - Jan 2026', type: 'CV', status: 'Valid', expiryDate: '2028-01-01', fileUrl: '#' },
    { id: 'PD-03', name: 'CITI GCP Training Certification', type: 'GCP Training', status: 'Expiring Soon', expiryDate: '2026-04-15', fileUrl: '#' },
    { id: 'PD-04', name: 'Financial Disclosure Form', type: 'Financial Disclosure', status: 'Valid', expiryDate: '--', fileUrl: '#' },
];
