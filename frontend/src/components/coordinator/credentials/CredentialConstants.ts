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

export const mapUserToDocs = (user: any): PersonalDoc[] => {
    if (!user) return INITIAL_DOCS;

    const getStatus = (expiry: string) => {
        if (!expiry || expiry === '--') return 'Valid';
        const expDate = new Date(expiry);
        const now = new Date();
        const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'Expired';
        if (diffDays < 30) return 'Expiring Soon';
        return 'Valid';
    };

    return [
        { 
            id: 'PD-01', 
            name: user.medical_licence ? 'Verified Medical License' : 'MISSING LICENSE', 
            type: 'Medical License', 
            status: getStatus(user.medical_licence_expiry), 
            expiryDate: user.medical_licence_expiry || '--', 
            fileUrl: user.medical_licence || '#' 
        },
        { 
            id: 'PD-02', 
            name: user.cv_document ? 'Official Curriculum Vitae (CV)' : 'MISSING CV', 
            type: 'CV', 
            status: getStatus(user.cv_expiry), 
            expiryDate: user.cv_expiry || '--', 
            fileUrl: user.cv_document || '#' 
        },
        { 
            id: 'PD-03', 
            name: user.gcp_training ? 'GCP Training Certificate' : 'MISSING GCP TRAINING', 
            type: 'GCP Training', 
            status: getStatus(user.gcp_training_expiry), 
            expiryDate: user.gcp_training_expiry || '--', 
            fileUrl: user.gcp_training || '#' 
        },
        { 
            id: 'PD-04', 
            name: user.financial_disclosure ? 'Financial Disclosure' : 'MISSING FORM', 
            type: 'Financial Disclosure', 
            status: 'Valid', 
            expiryDate: '--', 
            fileUrl: user.financial_disclosure || '#' 
        },
    ];
};


