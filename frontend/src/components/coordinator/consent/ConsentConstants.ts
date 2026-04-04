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

export const COMPREHENSION_QUESTIONS = [
    { id: 'q1', question: 'You may withdraw from this study at any time without penalty.', options: ['True', 'False', 'Only with PI approval'], correct: 'True' },
    { id: 'q2', question: 'Your personal health information may be shared with the study sponsor.', options: ['Never', 'Only if required by law', 'Yes, as described in the consent'], correct: 'Yes, as described in the consent' },
    { id: 'q3', question: 'Participation in this study is completely voluntary.', options: ['True', 'False', 'Depends on your insurance'], correct: 'True' }
];

export interface ConsentTemplate {
    id: string;
    title: string;
    shortName: string;
    study: string;
    type: string;
    version: string;
    irbNumber: string;
    irbApprovalDate: string;
    effectiveDate: string;
    expirationDate: string | null;
    language: string;
    status: string;
    notes: string;
    pageCount: number;
    signatureRequirements: {
        participantSignature: boolean;
        participantDate: boolean;
        larSignature: boolean;
        witnessSignature: boolean;
        ccSignature: boolean;
        piVerification: boolean;
        initialEachPage: boolean;
        initialKeySections: boolean;
    };
    completionRules: {
        mustScrollFull: boolean;
        mustAnswerComprehension: boolean;
        mustCheckAgreements: boolean;
        allowRemote: boolean;
        allowInPerson: boolean;
        requireCCBeforePI: boolean;
    };
    placedFields: ConsentField[];
    auditLog: AuditEntry[];
}

export interface ConsentField {
    id: string;
    type: string;
    page: number;
    x: number;
    y: number;
}

export interface AuditEntry {
    time: string;
    user: string;
    role: string;
    action: string;
}

export interface ConsentRecord {
    id: string;
    participantId?: string;
    full_name?: string;
    study: string;
    study_title?: string;
    protocol_id?: string;
    consentId: string;
    template_version?: string;
    version: string;
    sentDate: string;
    agreed_at?: string;
    participantSigned: boolean;
    participantSignedDate: string | null;
    ccReviewed: boolean;
    ccReviewedDate: string | null;
    piVerified: boolean;
    pi_verified?: boolean;
    piVerifiedDate: string | null;
    status: string;
    locked: boolean;
    auditLog: AuditEntry[];
}
