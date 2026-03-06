export interface TeamMember {
    id: string;
    name: string;
    role: string;
    bio: string;
    imageUrl?: string;
    expertiseTags?: string[];
    linkedinUrl?: string;
    expandedBio?: string;
    areasOfExpertise?: string[];
    affiliations?: string[];
    publications?: string[];
}

export interface Advisor {
    id: string;
    name: string;
    advisoryRole: string;
    expertiseArea: string;
    organization: string;
    bio: string;
    imageUrl?: string;
    linkedinUrl?: string;
}

export interface ClinicalCollaborator {
    id: string;
    name: string;
    logoUrl?: string;
    specialty: string;
    location?: string;
}

export interface StaffMember {
    id: string;
    name: string;
    role: string;
    department: string;
    roleDescription: string;
    imageUrl?: string;
}

export interface ResearchCapability {
    id: string;
    title: string;
    description: string;
    icon: string;
}

export interface Facility {
    id: string;
    name: string;
    description: string;
    features: string[];
}

export type Condition = 'Gut' | 'Brain' | 'Metabolic' | 'Aging' | 'Women’s Health' | 'Cancer Support';

export interface Study {
    id: string;
    title: string;
    condition: Condition;
    duration: string;
    compensation_range?: string;
    is_paid?: boolean;
    is_free_testing?: boolean;
}

export interface CertificationItem {
    id: string;
    label: string;
    icon?: string;
    imageUrl?: string;
}

export interface PartnerLogo {
    id: string;
    name: string;
    logoUrl?: string;
    category?: 'Academic' | 'Industry' | 'CRO' | 'Community';
    websiteUrl?: string;
}

export type NewsType = 'News' | 'Event' | 'Partnership' | 'Publication' | 'Educational Material';

export interface NewsItem {
    id: string;
    title: string;
    type: NewsType;
    isFeatured: boolean;
    publishStatus: 'Draft' | 'Published' | 'Archived';
    excerpt: string;
    content: string;
    imageUrl: string;
    date: string;
    // Event specific
    startTime?: string;
    endTime?: string;
    locationType?: 'On-site' | 'Virtual' | 'Hybrid';
    location?: string;
    registrationLink?: string;
    tags?: string[];
}

export interface CareerCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export interface JobOpening {
    id: string;
    title: string;
    department: string;
    location: string;
    type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
    experienceLevel: 'Entry-level' | 'Mid-level' | 'Senior' | 'Executive';
    summary: string;
    description: string;
    requirements?: string[];
    applyUrl?: string;
    deadline?: string;
    isFeatured: boolean;
    status: 'Draft' | 'Live' | 'Closed';
}
