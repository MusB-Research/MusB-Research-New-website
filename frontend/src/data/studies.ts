import { API } from '../utils/auth';
export interface Study {
    id: string;
    title: string;
    condition: string;
    type: 'On-site' | 'Remote' | 'Hybrid';
    trialFormat: 'RCT' | 'Open-label' | 'Pre-post' | 'IHUT' | 'Observational';
    status: 'Recruiting' | 'Upcoming' | 'Paused' | 'Completed';
    description: string;
    benefit: string;
    duration: string;
    tags: string[];
    compensation: string;
    location: string;
    timeCommitment: string;
    overview: string;
    timeline: { step: string; label: string }[];

    safetyInfo: string;
    privacyStandards: ('HIPAA' | 'GDPR' | 'SOC2')[];
    remoteParticipation: boolean;
    full_title?: string;
    participation_message?: string;
    compensation_range?: string;
    is_paid?: boolean;
    is_free_testing?: boolean;
    countries?: string[];
}

export const fetchStudies = async (): Promise<Study[]> => {
    try {
        const url = `${API || 'http://localhost:8000'}/api/public-studies/`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        const statusMap: Record<string, string> = {
            'RECRUITING': 'Recruiting',
            'UPCOMING': 'Upcoming',
            'PAUSED': 'Paused',
            'COMPLETED': 'Completed'
        };

        const results = data.map((d: any) => ({
            id: d.protocol_id || d.id,
            original_db_id: d.id, // Store for sorting
            title: d.title,
            condition: d.condition || d.primary_indication || 'Other',
            type: d.study_type === 'VIRTUAL' ? 'Virtual' : (d.study_type === 'IN_PERSON' ? 'On-site' : 'Hybrid'),
            trialFormat: d.trial_format || d.trial_model,
            status: statusMap[d.status] || 'Upcoming',
            description: d.description || d.primary_indication || "",
            benefit: d.benefit || "",
            duration: d.duration || d.time_commitment || "4-12 Weeks",
            tags: (d.tags && d.tags.length > 0) ? d.tags : [d.trial_model, d.study_type].filter(Boolean),
            compensation: d.compensation || 'Varies by study',
            location: d.location || (d.study_type === 'VIRTUAL' ? 'Remote' : 'Clinical Site'),
            timeCommitment: d.time_commitment || 'To be determined',
            overview: d.overview || "",
            full_title: d.full_title || "",
            participation_message: d.participation_message || "",
            timeline: d.timeline || [],

            safetyInfo: d.safety_info,
            privacyStandards: d.privacy_standards || [],
            remoteParticipation: d.remote_participation || (d.study_type === 'VIRTUAL'),
            compensation_range: d.compensation || 'Varies by study',
            is_paid: true,
            is_free_testing: false,
            countries: d.countries || []
        }));

        // Sort Chronologically: Oldest First based on Database ID (MongoDB ObjectIds are naturally chronological)
        return results.sort((a: any, b: any) => 
            (a.original_db_id || '').localeCompare(b.original_db_id || '')
        );
    } catch (error) {
        console.error("Failed to fetch studies:", error);
        return [];
    }
};


