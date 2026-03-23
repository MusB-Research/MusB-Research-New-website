export interface Study {
    id: string;
    title: string;
    condition: string;
    type: 'On-site' | 'Remote' | 'Hybrid';
    trialFormat: 'RCT' | 'Open-label' | 'Pre-post' | 'IHUT' | 'Observational';
    status: 'Recruiting' | 'Active' | 'Paused' | 'Completed';
    description: string;
    benefit: string;
    duration: string;
    tags: string[];
    compensation: string;
    location: string;
    timeCommitment: string;
    overview: string;
    timeline: { step: string; label: string }[];
    kitsInfo: string;
    safetyInfo: string;
    privacyStandards: ('HIPAA' | 'GDPR' | 'SOC2')[];
    remoteParticipation: boolean;
    compensation_range?: string;
    is_paid?: boolean;
    is_free_testing?: boolean;
}

export const fetchStudies = async (): Promise<Study[]> => {
    try {
        const url = `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/public-studies/`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        const statusMap: Record<string, any> = {
            'RECRUITING': 'Recruiting',
            'ACTIVE': 'Active',
            'PAUSED': 'Paused',
            'COMPLETED': 'Completed'
        };

        return data.map((d: any) => ({
            id: d.protocol_id || d.id,
            title: d.title,
            condition: d.condition || d.primary_indication || 'Other',
            type: d.study_type === 'VIRTUAL' ? 'Virtual' : (d.study_type === 'IN_PERSON' ? 'On-site' : 'Hybrid'),
            trialFormat: d.trial_format || d.trial_model,
            status: statusMap[d.status] || 'Upcoming',
            description: d.description || d.primary_indication || "Standard research protocol",
            benefit: d.benefit || (d.trial_model === 'RCT' ? 'Placebo-Controlled' : 'Standard Product'),
            duration: d.duration || d.time_commitment || "4-12 Weeks",
            tags: (d.tags && d.tags.length > 0) ? d.tags : [d.trial_model, d.study_type].filter(Boolean),
            compensation: d.compensation || 'Varies by study',
            location: d.location || (d.study_type === 'VIRTUAL' ? 'Remote' : 'Clinical Site'),
            timeCommitment: d.time_commitment || 'To be determined',
            overview: d.overview || 'This clinical trial is designed to evaluate safely and efficacy.',
            timeline: d.timeline || [],
            kitsInfo: d.kits_info,
            safetyInfo: d.safety_info,
            privacyStandards: d.privacy_standards || [],
            remoteParticipation: d.remote_participation || (d.study_type === 'VIRTUAL'),
            compensation_range: d.compensation || 'Varies by study',
            is_paid: true,
            is_free_testing: false
        }));
    } catch (error) {
        console.error("Failed to fetch studies:", error);
        return [];
    }
};
