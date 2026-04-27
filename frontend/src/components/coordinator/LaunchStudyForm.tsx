import * as React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Rocket, Beaker, Activity, Users, FileText, CheckCircle2,
    X, ChevronDown, Upload, ChevronRight, ChevronLeft,
    AlertCircle, History, CheckSquare, TrendingUp,
    ShieldCheck, Microscope, UserPlus, FileCheck, Layers,
    Briefcase, Plus, Calendar, Award, DollarSign,
    Building2, Search, Building, Check, ExternalLink, MousePointer2, Save, Tag, Info, Eye
} from 'lucide-react';
import { authFetch, API, revealValue } from '../../utils/auth';
import QuestionnaireBuilder from './QuestionnaireBuilder';
import ScreenerBuilder from './ScreenerBuilder';

export const CURRENCY_SYMBOLS: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'INR': '₹',
    'NGN': '₦',
    'KES': 'KSh',
    'ZAR': 'R',
    'GHS': 'GH₵',
    'CAD': 'C$',
    'AUD': 'A$',
    'JPY': '¥',
    'CHF': 'CHF',
    'CNY': '¥',
    'SEK': 'kr',
    'NZD': 'NZ$',
    'SGD': 'S$',
    'HKD': 'HK$',
    'KRW': '₩',
    'TRY': '₺',
    'RUB': '₽',
    'BRL': 'R$',
    'AED': 'DH',
    'SAR': 'SR',
};

export const STUDY_CATEGORIES = [
    'Gut Health',
    'Metabolic Health',
    'Aging',
    "Women's Health",
    'Brain Health',
    'Skin',
    'Other'
] as const;

export type StudyCategory = typeof STUDY_CATEGORIES[number];

interface LaunchStudyFormProps {
    onClose?: () => void;
    onSave?: (data: any) => void | boolean | Promise<void | boolean>;
    initialData?: any;
    availablePIs?: any[];
    availableCoordinators?: any[];
    availableSponsors?: any[];
    availableSponsorUsers?: any[];
}

type StepID = 1 | 2 | 3 | 4 | 5 | 6;

interface DocumentFile {
    id: string;
    name: string;
    category: 'Protocol' | 'IRB_Letter' | 'Flyer' | 'Informed_Consent' | 'Other';
    version: string;
    status: 'Current' | 'Draft';
    visible_to: string[]; // Roles: 'PARTICIPANT', 'PI', 'COORDINATOR', 'SPONSOR'
}

const toIdArray = (value: any, fallback?: any): string[] => {
    const source = value ?? fallback ?? [];
    const list = Array.isArray(source) ? source : [source];

    return list
        .map((item) => {
            if (!item) return '';
            if (typeof item === 'object') return item.id || item.pk || item.user_id || '';
            return String(item);
        })
        .filter(Boolean);
};

const QuestionPreview = ({ field, index }: { field: any, index: number }) => (
    <div className="group bg-white/[0.03] border border-white/5 rounded-2xl p-5 transition-all hover:bg-white/[0.05] hover:border-indigo-500/30">
        <div className="flex gap-4 mb-4">
            <span className="text-indigo-500 font-black italic text-sm tracking-tighter opacity-70 group-hover:opacity-100">
                {index + 1 < 10 ? `0${index + 1}` : index + 1}
            </span>
            <h5 className="text-[13px] md:text-[14px] font-bold text-white/90 leading-relaxed uppercase tracking-tight">
                {field.label || field.question}
            </h5>
        </div>
        
        {(field.type === 'multiple_choice' || field.type === 'choice') && field.options && (
            <div className="grid grid-cols-1 gap-2 pl-8">
                {field.options.map((opt: string, oi: number) => (
                    <div key={oi} className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-black/20 border border-white/5">
                        <div className="w-2.5 h-2.5 rounded-full border border-indigo-500/50" />
                        <span className="text-[13px] md:text-[14px] font-bold text-slate-400 uppercase tracking-widest">{opt}</span>
                    </div>
                ))}
            </div>
        )}

        {(field.type === 'text' || field.type === 'short_text') && (
            <div className="pl-8">
                <div className="w-full h-8 bg-black/20 border border-dashed border-white/10 rounded-lg flex items-center px-3">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Text Response Area</span>
                </div>
            </div>
        )}
    </div>
);

const LaunchStudyFormRoot = ({ onClose, onSave, initialData, availablePIs = [], availableCoordinators = [], availableSponsors = [], availableSponsorUsers = [] }: LaunchStudyFormProps) => {
    const [currentStep, setCurrentStep] = useState<StepID>(1);
    const [lastSaved, setLastSaved] = useState<string>('Just now');

    // Required for tracking newly invited personnel during the session
    const [invitedSponsors, setInvitedSponsors] = useState<any[]>([]);
    const [invitedPersonnel, setInvitedPersonnel] = useState<any[]>([]);
    const [fetchedPIs, setFetchedPIs] = useState<any[]>([]);
    const [fetchedCoordinators, setFetchedCoordinators] = useState<any[]>([]);
    const [fetchedSponsorUsers, setFetchedSponsorUsers] = useState<any[]>([]);

    const [showInviteSponsorModal, setShowInviteSponsorModal] = useState(false);
    const [showInviteMemberModal, setShowInviteMemberModal] = useState(false);
    const [inviteMemberRole, setInviteMemberRole] = useState<'PI' | 'COORDINATOR' | 'TEAM_MEMBER'>('PI');
    const [inviteData, setInviteData] = useState({ name: '', email: '', organization: '' });
    const [inviteLoading, setInviteLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [showQuestionnaireBuilder, setShowQuestionnaireBuilder] = useState(false);
    const [showScreenerBuilder, setShowScreenerBuilder] = useState(false);
    const [previewScreener, setPreviewScreener] = useState<any>(null);
    const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
    const pendingCategory = useRef<DocumentFile['category']>('Protocol');

    // Auto-expansion refs
    const titleRef = useRef<HTMLTextAreaElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);

    // Custom Category States
    const [sessionCategories, setSessionCategories] = useState<string[]>([]);
    const [isAddingCustom, setIsAddingCustom] = useState(false);
    const [customInput, setCustomInput] = useState('');

    const autoExpand = useCallback((el: HTMLTextAreaElement | null) => {
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }, []);

    const getScreenerQuestions = useCallback((s: any) => {
        return s?.screener_config?.questions || s?.screener_config?.steps?.find((st: any) => st.type === 'user_input')?.questions || [];
    }, []);

    const displayPIs = useMemo(() => {
        const base = (availablePIs && availablePIs.length > 0) ? availablePIs : fetchedPIs;
        const invited = invitedPersonnel.filter(u => u.role === 'PI' || u.role === 'pi');
        return [...base, ...invited];
    }, [availablePIs, fetchedPIs, invitedPersonnel]);

    const displayCoordinators = useMemo(() => {
        const base = (availableCoordinators && availableCoordinators.length > 0) ? availableCoordinators : fetchedCoordinators;
        const invited = invitedPersonnel.filter(u => u.role === 'COORDINATOR' || u.role === 'coordinator');
        return [...base, ...invited];
    }, [availableCoordinators, fetchedCoordinators, invitedPersonnel]);
    const displaySponsorUsers = useMemo(() => {
        const base = (availableSponsorUsers && availableSponsorUsers.length > 0) ? availableSponsorUsers : fetchedSponsorUsers;
        return [...base, ...(invitedSponsors || [])];
    }, [availableSponsorUsers, fetchedSponsorUsers, invitedSponsors]);

    const displaySponsors = useMemo(() => availableSponsors || [], [availableSponsors]);


    const [formData, setFormData] = useState({
        protocol_id: initialData?.protocol_id || `MUSB-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`,
        sponsor_id: initialData?.sponsor_id || '',
        sponsor_org_id: initialData?.sponsor_org_id || '',
        sponsor_name: initialData?.sponsor_name || '',
        startDate: initialData?.startDate || initialData?.start_date || '',
        endDate: initialData?.endDate || initialData?.end_date || '',
        full_title: initialData?.full_title || '',
        title: initialData?.title || '',
        brief_description: initialData?.brief_description || initialData?.description || '',
        category: initialData?.condition || initialData?.category || 'Other',
        overview: initialData?.overview || '',
        benefit: initialData?.benefit || initialData?.benefit || '',
        participation_message: initialData?.participation_message || '',
        execution_type: initialData?.execution_type || initialData?.study_type || 'IN_PERSON',
        trial_model: initialData?.trial_model || 'RCT',
        rct_design: initialData?.rct_design || 'PARALLEL',
        masking: initialData?.masking || 'DOUBLE_BLIND',
        phase: initialData?.phase || 'PHASE_2',
        target_subjects: initialData?.target_subjects || initialData?.target_screened || 0,
        has_study_kit: initialData?.has_study_kit || false,
        shipment_mode: initialData?.shipment_mode || 'CLINIC',
        medication_supply: initialData?.medication_supply || 'SPONSOR_PROVIDED',
        consent_collection: initialData?.consent_collection || ['ECONSENT'],
        pi_id: toIdArray(initialData?.pi_ids ?? initialData?.pi_id, initialData?.assigned_pis),
        coordinator_id: toIdArray(initialData?.coordinator_ids ?? initialData?.coordinator_id, initialData?.assigned_coordinators),
        assigned_sponsors: (initialData?.assigned_sponsors || []).map((s: any) => typeof s === 'object' ? s.id : s) as string[],
        status: initialData?.status || 'DRAFT',
        compensation: initialData?.compensation || '',
        compensation_currency: initialData?.compensation_currency || 'USD',
        reward_type: initialData?.reward_type || 'CASH',
        reward_logic: initialData?.reward_logic || 'PER_TASK',
        reward_config: initialData?.reward_config || { tasks: {}, visits: {}, full_study: 0 },
        reward_amount: initialData?.reward_amount || 0,
        study_questionnaires: initialData?.study_questionnaires || [],
        screener_questions: initialData?.screener_config?.steps?.find((s: any) => s.type === 'user_input')?.questions || []
    });

    const [uploadedDocs, setUploadedDocs] = useState<DocumentFile[]>([]);
    const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
    const [existingStudies, setExistingStudies] = useState<any[]>([]);

    const fetchStudies = useCallback(async () => {
        try {
            const res = await authFetch(`${API}/api/studies/`);
            if (res.ok) {
                const data = await res.json();
                setExistingStudies(Array.isArray(data) ? data : (data.results || []));
            }
        } catch (err) { }
    }, []);

    useEffect(() => {
        fetchStudies();
    }, [fetchStudies]);
    
    const fetchTemplates = useCallback(async () => {
        try {
            const res = await authFetch(`${API}/api/questionnaire-templates/`);
            if (res.ok) {
                const data = await res.json();
                setAvailableTemplates(Array.isArray(data) ? data : (data.results || []));
            }
        } catch (err) { }
    }, []);

    useEffect(() => {
        if (!showQuestionnaireBuilder) {
            fetchTemplates();
        }
    }, [showQuestionnaireBuilder, fetchTemplates]);

    // Auto-save draft to localStorage
    useEffect(() => {
        if (!initialData) { // Only auto-save for new studies
            const draft = {
                formData,
                currentStep,
                uploadedDocs,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('musb_study_launch_draft', JSON.stringify(draft));
            setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
    }, [formData, currentStep, uploadedDocs, initialData]);

    const [showResumeBanner, setShowResumeBanner] = useState(false);

    useEffect(() => {
        if (!initialData) {
            const savedDraft = localStorage.getItem('musb_study_launch_draft');
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    // Only show if it's not too old (e.g., within 24 hours) or just always show
                    setShowResumeBanner(true);
                } catch (e) {
                    console.error("Failed to parse draft", e);
                }
            }
        }
    }, [initialData]);

    const handleResumeDraft = () => {
        const savedDraft = localStorage.getItem('musb_study_launch_draft');
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                setFormData(parsed.formData);
                setCurrentStep(parsed.currentStep);
                if (parsed.uploadedDocs) setUploadedDocs(parsed.uploadedDocs);
                setShowResumeBanner(false);
            } catch (e) {
                console.error("Failed to resume draft", e);
            }
        }
    };

    const handleClearDraft = () => {
        localStorage.removeItem('musb_study_launch_draft');
        setShowResumeBanner(false);
    };

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const [piRes, ccRes, spRes] = await Promise.all([
                    authFetch(`${API}/api/auth/personnel-fetch/?role=PI`),
                    authFetch(`${API}/api/auth/personnel-fetch/?role=COORDINATOR`),
                    authFetch(`${API}/api/auth/personnel-fetch/?role=SPONSOR`)
                ]);
                
                if (piRes.ok) {
                    const data = await piRes.json();
                    setFetchedPIs(Array.isArray(data) ? data : (data.results || []));
                }
                if (ccRes.ok) {
                    const data = await ccRes.json();
                    setFetchedCoordinators(Array.isArray(data) ? data : (data.results || []));
                }
                if (spRes.ok) {
                    const data = await spRes.json();
                    setFetchedSponsorUsers(Array.isArray(data) ? data : (data.results || []));
                }
            } catch (err) { console.error("Failed to fetch team data:", err); }
        };

        fetchTeamData();
    }, []);

    useEffect(() => {
        if (currentStep === 1) {
            autoExpand(titleRef.current);
            autoExpand(descriptionRef.current);
        }
    }, [currentStep, formData.full_title, formData.brief_description, autoExpand]);
    const [sponsorSearch, setSponsorSearch] = useState('');
    const [showSponsorDropdown, setShowSponsorDropdown] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInvitePersonnel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteData.email || !inviteData.name) return;
        
        const names = inviteData.name.trim().split(' ');
        const firstName = names[0];
        const lastName = names.length > 1 ? names.slice(1).join(' ') : 'Personnel';

        setInviteLoading(true);
        try {
            const res = await authFetch('/api/auth/admin/create-user/', {
                method: 'POST',
                body: JSON.stringify({
                    email: inviteData.email,
                    first_name: firstName,
                    last_name: lastName,
                    role: inviteMemberRole,
                    is_invited: true
                })
            });
            if (res.ok) {
                const data = await res.json();
                setInvitedPersonnel(prev => [...prev, data]);
                if (inviteMemberRole === 'PI') {
                    setFormData(prev => ({ ...prev, pi_id: [...(prev.pi_id || []), data.id] }));
                } else {
                    setFormData(prev => ({ ...prev, coordinator_id: [...(prev.coordinator_id || []), data.id] }));
                }
                setShowInviteMemberModal(false);
                setInviteData({ name: '', email: '', organization: '' });
                alert(`${inviteMemberRole} Invited Successfully!`);
            } else {
                const errorData = await res.json();
                if (res.status === 400 && errorData.existing_user) {
                    const existing = errorData.existing_user;
                    const userObj = {
                        id: existing.id || existing._id,
                        full_name: existing.name,
                        email: existing.email,
                        role: inviteMemberRole,
                        status: existing.status
                    };
                    setInvitedPersonnel(prev => [...prev, userObj]);
                    
                    if (inviteMemberRole === 'PI') {
                        setFormData(prev => ({ ...prev, pi_id: [...(prev.pi_id || []), userObj.id] }));
                    } else {
                        setFormData(prev => ({ ...prev, coordinator_id: [...(prev.coordinator_id || []), userObj.id] }));
                    }
                    setShowInviteMemberModal(false);
                    setInviteData({ name: '', email: '', organization: '' });
                    alert(`This user already exists and has been added to your selection.`);
                } else {
                    alert(errorData.error || 'Invitation failed. Please try again.');
                }
            }
        } catch (err) { 
            console.error(err);
            alert('A network error occurred. Please try again.');
        } finally { setInviteLoading(false); }
    };

    const handleInviteSponsor = async (e: React.FormEvent) => {
        if (!inviteData.email || !inviteData.email.includes('@')) return alert("Valid email required.");
        
        const names = inviteData.name.trim().split(' ');
        const firstName = names[0];
        const lastName = names.length > 1 ? names.slice(1).join(' ') : 'Sponsor';

        setInviteLoading(true);
        try {
            const res = await authFetch('/api/auth/admin/create-user/', {
                method: 'POST',
                body: JSON.stringify({
                    email: inviteData.email,
                    first_name: firstName,
                    last_name: lastName,
                    role: 'SPONSOR'
                })
            });
            if (res.ok) {
                const newUser = await res.json();
                setInvitedSponsors(prev => [...prev, newUser]);
                const currentAssigned = Array.isArray(formData.assigned_sponsors) ? formData.assigned_sponsors : [];
                setFormData({ ...formData, assigned_sponsors: [...currentAssigned, newUser.id] });
                setInviteData({ name: '', email: '', organization: '' });
                setShowInviteSponsorModal(false);
                alert(`Invitation sent to ${inviteData.email}.`);
            } else {
                const errorData = await res.json();
                if (res.status === 400 && errorData.existing_user) {
                    const existing = errorData.existing_user;
                    const newUser = {
                        id: existing.id || existing._id,
                        full_name: existing.name,
                        email: existing.email,
                        role: 'SPONSOR',
                        status: existing.status
                    };
                    setInvitedSponsors(prev => [...prev, newUser]);
                    const currentAssigned = Array.isArray(formData.assigned_sponsors) ? formData.assigned_sponsors : [];
                    setFormData({ ...formData, assigned_sponsors: [...currentAssigned, newUser.id] });
                    setInviteData({ name: '', email: '', organization: '' });
                    setShowInviteSponsorModal(false);
                    alert(`This sponsor already exists and has been added to your selection.`);
                } else {
                    alert(errorData.error || 'Invitation failed. Please try again.');
                }
            }
        } catch (e) { 
            console.error(e);
            alert('A network error occurred. Please try again.');
        } finally { setInviteLoading(false); }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) return alert("File too large (Max 10MB)");
            const newDoc: DocumentFile = {
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                category: pendingCategory.current,
                version: 'V1.0 (Draft)',
                status: 'Draft',
                visible_to: ['PARTICIPANT', 'PI', 'COORDINATOR', 'SPONSOR'] // Default to all
            };
            setUploadedDocs(prev => [newDoc, ...prev]);
        }
    };

    const toggleDocVisibility = (docId: string, role: string) => {
        setUploadedDocs(prev => prev.map(d => {
            if (d.id !== docId) return d;
            const roles = [...d.visible_to];
            const idx = roles.indexOf(role);
            if (idx > -1) roles.splice(idx, 1);
            else roles.push(role);
            return { ...d, visible_to: roles };
        }));
    };

    const steps = useMemo(() => [
        { id: 1, label: 'Core Protocol', sub: 'Identity & Purpose', icon: Beaker },
        { id: 2, label: 'Methodology', sub: 'Clinical Design', icon: Activity },
        { id: 3, label: 'Research Team', sub: 'Roles & Operations', icon: Users },
        { id: 4, label: 'Instruments', sub: 'Scheduling & Modes', icon: Layers },
        { id: 5, label: 'Documents', sub: 'Compliance Uploads', icon: FileText },
        { id: 6, label: 'Review', sub: 'Final Validation', icon: CheckCircle2 },
    ], []);

    const handleNext = useCallback(() => setCurrentStep((s) => (s < 6 ? (s + 1) as StepID : s)), []);
    const handlePrev = useCallback(() => setCurrentStep((s) => (s > 1 ? (s - 1) as StepID : s)), []);
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (e.target instanceof HTMLTextAreaElement) {
            autoExpand(e.target);
        }
    }, [autoExpand]);

    const toggleMultiSelect = useCallback((field: 'pi_id' | 'coordinator_id' | 'consent_collection' | 'assigned_sponsors', val: string) => {
        setFormData(prev => {
            const list = Array.isArray(prev[field]) ? [...(prev[field] as string[])] : [];
            const index = list.indexOf(val);
            if (index > -1) list.splice(index, 1);
            else list.push(val);
            return { ...prev, [field]: list };
        });
    }, []);

    const renderPersonnelCard = (person: any, field: 'pi_id' | 'coordinator_id' | 'assigned_sponsors', roleLabel: string, color: string) => {
        const isSelected = Array.isArray(formData[field]) && (formData[field] as string[]).includes(person?.id);
        const initials = String(person?.full_name || person?.name || person?.email || 'U').charAt(0);
        
        return (
            <motion.div 
                key={person?.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5, scale: 1.02 }}
                onClick={() => toggleMultiSelect(field, person?.id)} 
                className="group relative cursor-pointer"
            >
                {/* Premium Hover Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${color === 'indigo' ? 'from-[#7c3aed]/10 to-indigo-500/10' : color === 'emerald' ? 'from-[#10b981]/10 to-emerald-500/10' : 'from-[#06b6d4]/10 to-cyan-500/10'} rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className={`relative h-full bg-[#0f1133]/40 backdrop-blur-xl border transition-all duration-300 rounded-[2rem] p-6 flex flex-col items-center text-center gap-5 overflow-hidden shadow-2xl ${isSelected ? (color === 'indigo' ? 'border-indigo-500 shadow-indigo-500/20' : color === 'emerald' ? 'border-emerald-500 shadow-emerald-500/20' : 'border-cyan-500 shadow-cyan-500/20') : 'border-white/5 hover:border-white/10'}`}>
                    
                    {/* Selection Indicator */}
                    <AnimatePresence>
                        {isSelected && (
                            <motion.div 
                                initial={{ scale: 0, opacity: 0 }} 
                                animate={{ scale: 1, opacity: 1 }} 
                                exit={{ scale: 0, opacity: 0 }}
                                className={`absolute top-4 right-4 w-6 h-6 ${color === 'indigo' ? 'bg-indigo-600' : color === 'emerald' ? 'bg-emerald-600' : 'bg-cyan-600'} rounded-full flex items-center justify-center text-white border-2 border-[#0B101B] shadow-lg z-20`}
                            >
                                <Check className="w-3.5 h-3.5" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Avatar with Rainbow Border */}
                    <div className="relative shrink-0">
                        <div className={`w-20 h-20 p-1 bg-gradient-to-br ${color === 'indigo' ? 'from-[#7c3aed] via-indigo-500 to-purple-500' : color === 'emerald' ? 'from-[#10b981] via-emerald-500 to-teal-500' : 'from-[#06b6d4] via-cyan-500 to-blue-500'} rounded-[1.8rem] shadow-xl group-hover:shadow-2xl transition-all duration-500`}>
                            <div className="w-full h-full bg-[#0a0b1a] rounded-[1.6rem] flex items-center justify-center overflow-hidden border border-white/5 relative">
                                {person?.image || person?.avatar ? (
                                    <img src={person?.image || person?.avatar} alt={person?.full_name || person?.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <span className={`text-2xl font-black italic bg-clip-text text-transparent bg-gradient-to-br from-white to-white/30`}>
                                        {initials}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Status Pulse */}
                        {(person?.status === 'ACTIVE' || person?.is_active) && (
                            <div className="absolute -bottom-1 -right-1 p-1 bg-[#0a0b1a] rounded-full border border-white/10 shadow-2xl">
                                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="space-y-2 flex-1 w-full">
                        <div>
                            <h4 className="text-[14px] font-black text-white uppercase italic tracking-tighter leading-tight truncate group-hover:text-indigo-400 transition-colors">
                                {person?.full_name || person?.name || person?.email || 'Unknown'}
                            </h4>
                            <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-2 italic ${color === 'indigo' ? 'text-indigo-400' : color === 'emerald' ? 'text-emerald-400' : 'text-cyan-400'} opacity-70 group-hover:opacity-100 transition-opacity`}>
                                {roleLabel}
                            </p>
                        </div>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                            {(person?.status === 'PENDING' || person?.invitation_status === 'Pending') ? (
                                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[7px] font-black text-amber-500 uppercase tracking-widest">
                                    INVITATION PENDING
                                </span>
                            ) : (
                                <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[7px] font-black text-slate-500 uppercase tracking-widest group-hover:bg-white/10 group-hover:text-slate-300 transition-all">
                                    GXP VERIFIED
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    const validation = useMemo(() => {
        const required = ['startDate', 'full_title', 'title', 'brief_description'];
        const missingFields = required.filter(f => !formData[f as keyof typeof formData]);
        const hasPI = Array.isArray(formData.pi_id) && formData.pi_id.length > 0;
        const hasCC = Array.isArray(formData.coordinator_id) && formData.coordinator_id.length > 0;
        const hasProtocol = Array.isArray(uploadedDocs) && uploadedDocs.some(d => d.category === 'Protocol');
        return {
            isValid: missingFields.length === 0 && hasPI && hasCC,
            missingFields, hasPI, hasCC, hasProtocol
        };
    }, [formData, uploadedDocs]);

    const mixedSponsors = useMemo(() => {
        const orgs = displaySponsors.map(o => ({ ...o, type: 'ORGANIZATION', displayName: revealValue(o.name, o.full_name) || revealValue(o.full_name) || 'Unnamed Org' }));
        const individuals = displaySponsorUsers.map(u => ({ ...u, type: 'PERSONNEL', displayName: revealValue(u.full_name, u.decrypted_name) || revealValue(u.name, u.decrypted_name) || u.email || 'Unnamed Person' }));
        return [...orgs, ...individuals];
    }, [displaySponsors, displaySponsorUsers]);

    const filteredSponsors = useMemo(() => {
        if (!sponsorSearch) return mixedSponsors;
        const query = sponsorSearch.toLowerCase();
        return mixedSponsors.filter(s => s.displayName.toLowerCase().includes(query));
    }, [mixedSponsors, sponsorSearch]);

    const handleSubmit = useCallback(async (options?: { isDraft?: boolean }) => {
        const isDraft = options?.isDraft ?? false;
        
        // Validation only required for final launch, not for draft
        if (!isDraft && (!validation?.isValid || !onSave || isSubmitting)) return;
        if (isDraft && !onSave) return;

        const { pi_id, coordinator_id, assigned_sponsors, startDate, endDate, execution_type, brief_description, masking, category, ...baseData } = formData;
        const studyStatus = isDraft ? 'DRAFT' : 'RECRUITING';
        const payload = {
            ...baseData,
            condition: category || 'Other',
            description: brief_description,
            study_type: execution_type,
            start_date: startDate || null,
            end_date: endDate || null,
            is_double_blind: masking === 'DOUBLE_BLIND' || masking === 'TRIPLE_BLIND' || masking === 'QUADRUPLE_BLIND',
            masking_strategy: masking,
            has_placebo_control: formData.trial_model === 'RCT',
            consent_mode: formData.consent_collection.includes('ECONSENT') && formData.consent_collection.includes('PAPER_CONSENT') 
                ? 'HYBRID' 
                : formData.consent_collection.includes('PAPER_CONSENT') 
                    ? 'PAPER' 
                    : 'ECONSENT',
            pi_ids: Array.isArray(pi_id) ? pi_id : (pi_id ? [pi_id] : []),
            coordinator_ids: Array.isArray(coordinator_id) ? coordinator_id : (coordinator_id ? [coordinator_id] : []),
            sponsor_ids: Array.isArray(assigned_sponsors) ? assigned_sponsors : (assigned_sponsors ? [assigned_sponsors] : []),
            status: studyStatus,
            stage: studyStatus,
            operational_artifacts: uploadedDocs.map(d => ({
                name: d.name,
                category: d.category,
                version: d.version,
                visible_to: d.visible_to
            })),
            screener_config: {
                steps: [
                    { id: 'STEP1', type: 'system', label: 'Basics & location' },
                    { 
                        id: 'STEP2', 
                        type: 'user_input', 
                        label: 'Eligibility criteria',
                        questions: formData.screener_questions
                    },
                    { id: 'STEP3', type: 'system', label: 'Contact & availability' }
                ]
            }
        };

        setIsSubmitting(true);
        try {
            if (onSave) {
                const result = await onSave(payload);
                if (result !== false) {
                    localStorage.removeItem('musb_study_launch_draft');
                    if (isDraft) {
                        alert("Draft Progress Synchronized: You can resume this setup later from the study directory.");
                    } else {
                        alert("PROTOCOL SYNCED: Study registered and launched successfully.");
                        window.location.reload();
                    }
                }
            }
        } catch (err) {
            console.error("Study launch failed:", err);
            alert(err instanceof Error ? err.message : "Study launch failed. Please check the required fields and try again.");
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, isSubmitting, onSave, validation?.isValid, uploadedDocs]);

    return (
        <div className="flex flex-col min-h-full pb-32 w-full px-4 lg:px-8 2xl:px-12 max-w-[2800px] mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 border-b border-white/5 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(79,70,229,0.1)]">
                        <Rocket className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-lg lg:text-2xl font-black text-white italic uppercase tracking-tighter leading-tight">Launch <span className="text-indigo-400">New Study</span></h1>
                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                            <Activity className="w-2.5 h-2.5 text-indigo-500/40" />
                            Secure Operational Protocol Entry
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest leading-none">Status: Drafting</p>
                        <p className="text-[10px] text-white/40 font-bold mt-1 uppercase">Last saved: {lastSaved}</p>
                    </div>
                </div>
            </div>

            {/* Resume Draft Banner */}
            <AnimatePresence>
                {showResumeBanner && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
                        animate={{ opacity: 1, height: 'auto', marginBottom: 24 }} 
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
                                    <History className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest leading-none">Draft Protocol Detected</h4>
                                    <p className="text-[13px] text-white font-bold mt-1.5 uppercase tracking-tight italic">You have an unsaved setup in progress. Would you like to resume?</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button 
                                    onClick={handleResumeDraft}
                                    className="flex-1 md:flex-none px-8 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/10"
                                >
                                    Resume Setup
                                </button>
                                <button 
                                    onClick={handleClearDraft}
                                    className="flex-1 md:flex-none px-6 py-3 bg-white/5 border border-white/10 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stepper Progress Node */}
            <div className="sticky top-0 z-40 bg-[#0B1120]/80 backdrop-blur-xl border border-white/10 rounded-3xl py-4 px-6 mb-12 shadow-2xl overflow-x-auto scrollbar-hide">
                <div className="flex items-center justify-between min-w-[700px] lg:min-w-0">
                    {steps.map((step, idx) => (
                        <React.Fragment key={step.id}>
                            <button
                                onClick={() => step.id < currentStep && setCurrentStep(step.id as StepID)}
                                className={`flex items-center gap-3 transition-all ${currentStep === step.id ? 'opacity-100 scale-100' : currentStep > step.id ? 'opacity-80' : 'opacity-30'}`}
                            >
                                <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center border transition-all ${currentStep === step.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                                    <step.icon className="w-4 h-4" />
                                </div>
                                <div className="text-left hidden xl:block">
                                    <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none">{step.label}</p>
                                    <p className={`text-[10px] uppercase tracking-tighter mt-1.5 ${currentStep === step.id ? 'text-indigo-400 font-bold' : 'text-slate-600'}`}>{step.sub}</p>
                                </div>
                            </button>
                            {idx < steps.length - 1 && <div className="h-px flex-1 bg-white/10 mx-4" />}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Step Content Hub */}
            <div className="flex-1">
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-6">
                            <div className="bg-[#0B101B] border border-white/5 rounded-3xl p-6 space-y-6 shadow-2xl relative overflow-visible">
                                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Beaker className="w-40 h-40 text-white" /></div>
                                <div className="flex items-center justify-between border-l-4 border-indigo-500 pl-6">
                                    <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">Protocol Fundamentals</h2>
                                    <div className="flex items-center gap-3 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">Active Discovery</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Internal ID / Study Number</label>
                                        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base text-indigo-400 font-mono flex items-center justify-between">
                                            <span>{formData.protocol_id}</span>
                                            <span className="text-[9px] px-2 py-1 bg-indigo-500/10 rounded-lg border border-indigo-500/20 font-black uppercase text-indigo-300">Auto-ID</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Sponsor Organization</label>
                                        {!formData.sponsor_name ? (
                                            <div
                                                onClick={() => setShowSponsorDropdown(true)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-base text-white/50 font-bold flex items-center justify-between cursor-pointer hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group shadow-lg"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all shrink-0">
                                                        <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                                                    </div>
                                                    <span className="italic font-mono uppercase tracking-tight text-[12px] truncate">Select Connected Sponsor Agency...</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <ChevronDown className="w-4 h-4 opacity-20 group-hover:opacity-100 transition-all" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <div className="w-full bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3.5 flex items-center justify-between shadow-xl shadow-indigo-600/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/40">
                                                            {formData.sponsor_org_id ? <Building2 className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Sponsor Connected</p>
                                                            <h4 className="text-sm font-black text-white italic uppercase tracking-tighter">{formData.sponsor_name}</h4>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setShowSponsorDropdown(true); }}
                                                            className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
                                                            title="Change Sponsor"
                                                        >
                                                            <Search className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, sponsor_id: '', sponsor_org_id: '', sponsor_name: '' }); }}
                                                            className="p-2 bg-red-500/5 border border-red-500/10 rounded-lg text-red-500/60 hover:text-red-500 hover:bg-red-500/20 transition-all"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
                                        <div className="relative group bg-white/5 border border-white/10 rounded-xl flex items-center transition-all focus-within:border-indigo-500/50 overflow-hidden">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                                <span className={`text-[13px] font-mono tracking-widest ${formData.startDate ? 'text-white font-bold' : 'text-slate-500'}`}>
                                                    {formData.startDate ? (() => {
                                                        const parts = formData.startDate.split('-');
                                                        if (parts.length === 3) return `${parts[1]} / ${parts[2]} / ${parts[0]}`;
                                                        return formData.startDate;
                                                    })() : 'mm / dd / yyyy'}
                                                </span>
                                            </div>
                                            <input
                                                type="date"
                                                name="startDate"
                                                value={formData.startDate}
                                                onChange={handleChange}
                                                className="w-full bg-transparent border-none rounded-xl px-4 py-4 outline-none custom-calendar-input transparent-date-input z-20 cursor-pointer text-transparent"
                                                style={{ colorScheme: 'dark' }}
                                            />
                                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none opacity-50 group-focus-within:opacity-100 transition-opacity z-10" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">End Date (Estimated)</label>
                                        <div className="relative group bg-white/5 border border-white/10 rounded-xl flex items-center transition-all focus-within:border-indigo-500/50 overflow-hidden">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                                <span className={`text-[13px] font-mono tracking-widest ${formData.endDate ? 'text-white font-bold' : 'text-slate-500'}`}>
                                                    {formData.endDate ? (() => {
                                                        const parts = formData.endDate.split('-');
                                                        if (parts.length === 3) return `${parts[1]} / ${parts[2]} / ${parts[0]}`;
                                                        return formData.endDate;
                                                    })() : 'mm / dd / yyyy'}
                                                </span>
                                            </div>
                                            <input
                                                type="date"
                                                name="endDate"
                                                value={formData.endDate}
                                                onChange={handleChange}
                                                className="w-full bg-transparent border-none rounded-xl px-4 py-4 outline-none custom-calendar-input transparent-date-input z-20 cursor-pointer text-transparent"
                                                style={{ colorScheme: 'dark' }}
                                            />
                                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none opacity-50 group-focus-within:opacity-100 transition-opacity z-10" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#0B101B] border border-white/5 rounded-[2rem] p-8 space-y-8 shadow-2xl">
                                <div className="flex items-center gap-4 border-l-4 border-emerald-500 pl-6">
                                    <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">Study Information</h2>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Official Full Title</label>
                                        <textarea 
                                            name="full_title" 
                                            ref={titleRef}
                                            value={formData.full_title} 
                                            onChange={handleChange} 
                                            placeholder="As stated on the clinical trial registry..." 
                                            className="w-full min-h-[96px] bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-base text-white font-bold outline-none focus:border-emerald-500/50 resize-none placeholder:opacity-20 italic leading-snug shadow-inner overflow-hidden" 
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Public Short Title</label>
                                        <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-base text-white font-bold outline-none focus:border-emerald-500/50 shadow-inner" />
                                    </div>

                                    {/* Study Category Selector */}
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                                <Tag className="w-4 h-4 text-emerald-400" />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Study Category</label>
                                                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">Determines how this study appears in public filters</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {[...STUDY_CATEGORIES, ...sessionCategories].map((cat) => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                                                    className={`relative px-4 py-3.5 rounded-xl border text-left transition-all duration-200 group/cat ${
                                                        formData.category === cat 
                                                            ? 'bg-emerald-500/15 border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
                                                            : 'bg-white/[0.03] border-white/5 hover:border-emerald-500/20 hover:bg-emerald-500/5'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${
                                                            formData.category === cat ? 'text-emerald-400' : 'text-slate-500 group-hover/cat:text-slate-300'
                                                        }`}>
                                                            {cat}
                                                        </span>
                                                        {formData.category === cat && (
                                                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                        )}
                                                    </div>
                                                </button>
                                            ))}

                                            {isAddingCustom ? (
                                                <div className="col-span-2 flex items-center gap-2 p-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={customInput}
                                                        onChange={(e) => setCustomInput(e.target.value)}
                                                        placeholder="Category name..."
                                                        className="flex-1 bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-emerald-400 placeholder:text-emerald-500/30 px-2"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                if (customInput.trim()) {
                                                                    const newCat = customInput.trim();
                                                                    if (!STUDY_CATEGORIES.includes(newCat as any) && !sessionCategories.includes(newCat)) {
                                                                        setSessionCategories(prev => [...prev, newCat]);
                                                                    }
                                                                    setFormData(prev => ({ ...prev, category: newCat }));
                                                                    setIsAddingCustom(false);
                                                                    setCustomInput('');
                                                                }
                                                            } else if (e.key === 'Escape') {
                                                                setIsAddingCustom(false);
                                                                setCustomInput('');
                                                            }
                                                        }}
                                                    />
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (customInput.trim()) {
                                                                    const newCat = customInput.trim();
                                                                    if (!STUDY_CATEGORIES.includes(newCat as any) && !sessionCategories.includes(newCat)) {
                                                                        setSessionCategories(prev => [...prev, newCat]);
                                                                    }
                                                                    setFormData(prev => ({ ...prev, category: newCat }));
                                                                    setIsAddingCustom(false);
                                                                    setCustomInput('');
                                                                }
                                                            }}
                                                            className="p-2 rounded-lg bg-emerald-500 text-slate-900 hover:bg-white transition-colors"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsAddingCustom(false);
                                                                setCustomInput('');
                                                            }}
                                                            className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsAddingCustom(true)}
                                                    className="px-4 py-3.5 rounded-xl border border-dashed border-white/10 bg-transparent hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2 group/add"
                                                >
                                                    <Plus className="w-3 h-3 text-slate-500 group-hover/add:text-emerald-400 transition-colors" />
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover/add:text-emerald-400">Add</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                     {/* PUBLIC-FACING CONTENT SECTIONS */}
                                     <div className="pt-8 space-y-8">
                                         <div className="flex items-center gap-4 border-l-4 border-emerald-500 pl-6 mb-8">
                                             <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">Public-Facing Content</h2>
                                         </div>

                                         <div className="grid grid-cols-1 gap-8">
                                             {/* 1. Brief Summary */}
                                             <div className="space-y-4">
                                                 <div className="flex items-center justify-between">
                                                     <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Brief summary (shown on eligibility page)</label>
                                                 </div>
                                                 <textarea 
                                                     name="brief_description" 
                                                     value={formData.brief_description} 
                                                     onChange={handleChange} 
                                                     placeholder="Example: Participate in a 14-day study on a natural sleep supplement. This study involves daily sleep logs and a personalized health report."
                                                     className="w-full min-h-[100px] bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm text-white/80 font-medium outline-none focus:border-emerald-500/50 resize-none leading-relaxed shadow-inner hover:bg-white/[0.07] transition-all" 
                                                 />
                                             </div>

                                             {/* 2. Study Overview */}
                                             <div className="space-y-4">
                                                 <div className="flex items-center justify-between">
                                                     <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Study overview (bullet points, one per line)</label>
                                                 </div>
                                                 <textarea 
                                                     name="overview" 
                                                     value={formData.overview} 
                                                     onChange={handleChange} 
                                                     placeholder={"* Complete daily sleep logs via the MusB portal\n* Take the supplement as directed for 14 days\n* No in-person visits required"}
                                                     className="w-full min-h-[120px] bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm text-white/80 font-medium outline-none focus:border-emerald-500/50 resize-none leading-relaxed shadow-inner hover:bg-white/[0.07] transition-all" 
                                                 />
                                             </div>

                                             {/* 3. Benefits */}
                                             <div className="space-y-4">
                                                 <div className="flex items-center justify-between">
                                                     <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Benefits for participants (bullet points, one per line)</label>
                                                 </div>
                                                 <textarea 
                                                     name="benefit" 
                                                     value={formData.benefit} 
                                                     onChange={handleChange} 
                                                     placeholder={"* No-cost supply of sleep supplement\n* Receive a personalized sleep health report\n* Help advance natural health science"}
                                                     className="w-full min-h-[120px] bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm text-white/80 font-medium outline-none focus:border-emerald-500/50 resize-none leading-relaxed shadow-inner hover:bg-white/[0.07] transition-all" 
                                                 />
                                             </div>

                                             {/* 4. Community Message */}
                                             <div className="space-y-4">
                                                 <div className="flex items-center justify-between">
                                                     <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Community participation message</label>
                                                 </div>
                                                 <textarea 
                                                     name="participation_message" 
                                                     value={formData.participation_message} 
                                                     onChange={handleChange} 
                                                     placeholder="Example: Your participation helps us understand how natural solutions can improve sleep quality for everyone in our community."
                                                     className="w-full min-h-[100px] bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm text-white/80 font-medium outline-none focus:border-emerald-500/50 resize-none leading-relaxed shadow-inner hover:bg-white/[0.07] transition-all" 
                                                 />
                                             </div>
                                         </div>
                                     </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-8">
                            <div className="bg-[#0B101B] border border-white/5 rounded-[2rem] p-8 space-y-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5"><Activity className="w-40 h-40 text-white" /></div>
                                <div className="flex items-center gap-4 border-l-4 border-indigo-500 pl-6">
                                    <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">Study Design</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        {
                                            field: 'trial_model', label: 'Primary Model', options: [
                                                { val: 'RCT', label: 'Randomized Controlled Trial' },
                                                { val: 'OPEN_LABEL', label: 'Open Label Study' },
                                                { val: 'IHUT', label: 'In-Home Use Test' },
                                                { val: 'REGISTRY', label: 'Patient Registry' },
                                                { val: 'OBSERVATIONAL', label: 'Observational Study' },
                                                { val: 'BIOEQUIVALENCE', label: 'Bioequivalence Study' }
                                            ]
                                        },
                                        {
                                            field: 'phase', label: 'Clinical Phase', options: [
                                                { val: 'N/A', label: 'N/A' },
                                                { val: 'PHASE_0', label: 'Phase 0' },
                                                { val: 'PHASE_1', label: 'Phase 1' },
                                                { val: 'PHASE_1_2', label: 'Phase 1/2' },
                                                { val: 'PHASE_2', label: 'Phase 2' },
                                                { val: 'PHASE_2_3', label: 'Phase 2/3' },
                                                { val: 'PHASE_3', label: 'Phase 3' },
                                                { val: 'PHASE_4', label: 'Phase 4' },
                                                { val: 'PILOT', label: 'Pilot Study' },
                                                { val: 'BIOEQUIVALENCE', label: 'Bioequivalence' }
                                            ]
                                        },
                                        {
                                            field: 'masking', label: 'Masking Strategy', options: [
                                                { val: 'NONE', label: 'None' },
                                                { val: 'SINGLE_BLIND', label: 'Single Blind' },
                                                { val: 'DOUBLE_BLIND', label: 'Double Blind' },
                                                { val: 'TRIPLE_BLIND', label: 'Triple Blind' },
                                                { val: 'QUADRUPLE_BLIND', label: 'Quadruple Blind' }
                                            ]
                                        },
                                        {
                                            field: 'execution_type', label: 'Execution', options: [
                                                { val: 'IN_PERSON', label: 'In-person' },
                                                { val: 'VIRTUAL', label: 'Virtual' },
                                                { val: 'DECENTRALIZED', label: 'Hybrid / Decentralized' }
                                            ]
                                        }
                                    ].map((group) => (
                                        <div key={group.field} className="space-y-3 relative group">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">{group.label}</label>
                                            <select
                                                value={formData[group.field as keyof typeof formData] as string}
                                                onChange={(e) => setFormData({ ...formData, [group.field]: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-indigo-400 outline-none hover:border-indigo-500/30 transition-all appearance-none cursor-pointer italic shadow-inner"
                                            >
                                                {group.options.map(opt => (
                                                    <option key={opt.val} value={opt.val} className="bg-[#0B1120] text-slate-300 font-bold">{opt.label}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 bottom-3 pointer-events-none opacity-40">
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                    ))}

                                    <div className="space-y-3 relative group">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Reward Type</label>
                                        <select
                                            value={formData.reward_type}
                                            onChange={(e) => setFormData({ ...formData, reward_type: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-emerald-400 outline-none hover:border-emerald-500/30 transition-all appearance-none cursor-pointer italic"
                                        >
                                            {[
                                                { label: 'DIRECT CASH', val: 'CASH' },
                                                { label: 'TARGET GIFT CARD', val: 'TARGET_CARD' },
                                                { label: 'DIGITAL COUPONS', val: 'COUPONS' },
                                                { label: 'CVS CARD', val: 'CVS_CARD' },
                                                { label: 'Master Card', val: 'MASTER_CARD' },
                                                { label: 'PUBLIX CARDS', val: 'PUBLIX_CARDS' },
                                                { label: 'Walmart Gift Cards', val: 'WALMART_CARDS' },
                                                { label: 'VISA CARD', val: 'VISA_CARD' },
                                                { label: 'MIXED REWARDS', val: 'MIXED' }
                                            ].map(opt => (
                                                <option key={opt.val} value={opt.val} className="bg-[#0B1120] text-slate-300 font-bold">{opt.label}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 bottom-3 pointer-events-none opacity-40">
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        </div>
                                    </div>

                                    <div className="space-y-3 relative group">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Incentive Logic</label>
                                        <select
                                            value={formData.reward_logic}
                                            onChange={(e) => setFormData({ ...formData, reward_logic: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[#14b8a6] outline-none hover:border-[#14b8a6]/30 transition-all appearance-none cursor-pointer italic"
                                        >
                                            {[
                                                { label: 'PER ACTIVITY', val: 'PER_TASK' },
                                                { label: 'PER CLINICAL VISIT', val: 'PER_VISIT' },
                                                { label: 'MILESTONE COMPLETION', val: 'FULL_STUDY' }
                                            ].map(opt => (
                                                <option key={opt.val} value={opt.val} className="bg-[#0B1120] text-slate-300 font-bold">{opt.label}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 bottom-3 pointer-events-none opacity-40">
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5 space-y-4">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Study Kit Requirements</label>
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={(e) => { e.preventDefault(); setFormData({ ...formData, has_study_kit: !formData.has_study_kit }); }} 
                                            className={`flex flex-1 items-center justify-between px-6 py-4 rounded-2xl border transition-all ${
                                                formData.has_study_kit ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.has_study_kit ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'}`}>
                                                    {formData.has_study_kit && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className="text-[12px] font-black uppercase tracking-widest leading-none">Require Study Kit</span>
                                                    <span className="text-[10px] text-slate-500 mt-1">Check to enable shipment options</span>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                    <AnimatePresence>
                                        {formData.has_study_kit && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {[
                                                        { val: 'CLINIC', label: 'Clinic Delivery' },
                                                        { val: 'DTP', label: 'Direct-to-Patient' },
                                                        { val: 'HYBRID', label: 'Hybrid' }
                                                    ].map(mock => (
                                                        <button 
                                                            key={mock.val}
                                                            onClick={(e) => { e.preventDefault(); setFormData({ ...formData, shipment_mode: mock.val }); }}
                                                            className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                                                                formData.shipment_mode === mock.val ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-[#0B101B] border-white/10 hover:border-white/20'
                                                            }`}
                                                        >
                                                            <span className={`text-[10px] font-black uppercase tracking-widest ${formData.shipment_mode === mock.val ? 'text-indigo-400' : 'text-slate-400'}`}>
                                                                {mock.label}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="pt-6 border-t border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Enrolled Participants</label>
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                                            <div>
                                                <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Target Enrollment</p>
                                                <input 
                                                    type="number" 
                                                    value={formData.target_subjects === 0 ? '' : formData.target_subjects} 
                                                    onChange={(e) => setFormData({ ...formData, target_subjects: parseInt(e.target.value, 10) || 0 })}
                                                    placeholder="0"
                                                    className="bg-transparent border-none text-3xl font-black text-white italic mt-1 outline-none w-40 p-0 focus:ring-0 placeholder:text-white/20"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setFormData({ ...formData, target_subjects: Math.max(0, formData.target_subjects - 10) })} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all font-black text-lg">-</button>
                                                <button onClick={() => setFormData({ ...formData, target_subjects: formData.target_subjects + 10 })} className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center hover:bg-indigo-500 transition-all font-black text-lg">+</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Consent Method</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {[
                                                { val: 'ECONSENT', label: 'E-consent' },
                                                { val: 'PAPER_CONSENT', label: 'Paper consent' },
                                                { val: 'REMOTE_WITNESS', label: 'Remote witness' },
                                                { val: 'LAR', label: 'Legal authorized representative (LAR)' },
                                                { val: 'PARENT_GUARDIAN', label: 'Parent / guardian' }
                                            ].map(opt => (
                                                <button 
                                                    key={opt.val} 
                                                    onClick={() => toggleMultiSelect('consent_collection', opt.val)} 
                                                    className={`flex items-center gap-4 px-5 py-5 rounded-[1.5rem] border transition-all h-full group ${Array.isArray(formData.consent_collection) && formData.consent_collection.includes(opt.val) ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-xl shadow-indigo-600/10' : 'bg-white/[0.03] border-white/5 text-slate-500 hover:border-white/20 hover:bg-white/[0.05]'}`}
                                                >
                                                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 ${Array.isArray(formData.consent_collection) && formData.consent_collection.includes(opt.val) ? 'bg-indigo-500 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'border-white/20'}`}>
                                                        {Array.isArray(formData.consent_collection) && formData.consent_collection.includes(opt.val) && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                                                    </div>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest leading-tight text-left ${Array.isArray(formData.consent_collection) && formData.consent_collection.includes(opt.val) ? 'text-white' : 'text-slate-400'}`}>
                                                        {opt.label}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5 space-y-6">

                                    <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white/5 border border-white/5 rounded-xl p-5">
                                            <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-2">Stipend Amount</p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl font-black text-slate-500">{CURRENCY_SYMBOLS[formData.compensation_currency] || '$'}</span>
                                                <input type="text" name="compensation" value={formData.compensation} onChange={handleChange} placeholder="0.00" className="bg-transparent border-none text-2xl font-black text-white italic focus:ring-0 w-full placeholder:text-white/10" />
                                            </div>
                                        </div>
                                        <div className="bg-white/5 border border-white/5 rounded-xl p-5">
                                            <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-2">Currency</p>
                                            <select name="compensation_currency" value={formData.compensation_currency} onChange={handleChange} className="bg-transparent border-none text-lg font-black text-white italic focus:ring-0 w-full appearance-none pr-8 cursor-pointer">
                                                {Object.keys(CURRENCY_SYMBOLS).map(code => (
                                                    <option key={code} value={code} className="bg-[#0B101B]">{code}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-8">
                            <div className="bg-[#0B101B]/60 border border-white/5 rounded-[2.5rem] p-10 space-y-12 shadow-3xl relative overflow-hidden group">
                                <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500/5 blur-[120px] rounded-full group-hover:bg-indigo-500/10 transition-colors duration-1000" />
                                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                                    <Users className="w-64 h-64 text-white" />
                                </div>

                                <div className="flex items-center gap-4 border-l-4 border-indigo-500 pl-8">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Research Team</h3>
                                </div>

                                <div className="space-y-12 relative z-10">
                                    {/* PI Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between ml-1">
                                            <div className="flex items-center gap-4">
                                                <div className="w-1.5 h-8 bg-indigo-600 rounded-full" />
                                                <div>
                                                    <label className="text-[14px] font-black text-white uppercase tracking-[0.2em] italic leading-none">Principal Investigators</label>
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Lead Medical Oversight (PI)</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => { setInviteMemberRole('PI'); setShowInviteMemberModal(true); }}
                                                className="px-6 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-[10px] font-black uppercase text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-3 shadow-lg active:scale-95 group"
                                            >
                                                <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" /> Invite New PI
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                            {displayPIs.map(pi => renderPersonnelCard(pi, 'pi_id', 'Primary Investigator', 'indigo'))}
                                        </div>
                                    </div>

                                    {/* CRC Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between ml-1">
                                            <div className="flex items-center gap-4">
                                                <div className="w-1.5 h-8 bg-emerald-600 rounded-full" />
                                                <div>
                                                    <label className="text-[14px] font-black text-white uppercase tracking-[0.2em] italic leading-none">Research Coordinators</label>
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Operational Study Control (CRC)</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => { setInviteMemberRole('COORDINATOR'); setShowInviteMemberModal(true); }}
                                                className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-3 shadow-lg active:scale-95 group"
                                            >
                                                <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" /> Invite New CRC
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                            {displayCoordinators.map(crc => renderPersonnelCard(crc, 'coordinator_id', 'Study Coordinator', 'emerald'))}
                                        </div>
                                    </div>

                                    {/* Sponsor Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between ml-1">
                                            <div className="flex items-center gap-4">
                                                <div className="w-1.5 h-8 bg-cyan-600 rounded-full" />
                                                <div>
                                                    <label className="text-[14px] font-black text-white uppercase tracking-[0.2em] italic leading-none">Sponsor Personnel</label>
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Oversight & Monitoring</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => { setShowSponsorDropdown(false); setShowInviteSponsorModal(true); }}
                                                className="px-6 py-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-[10px] font-black uppercase text-cyan-400 hover:bg-cyan-600 hover:text-white transition-all flex items-center gap-3 shadow-lg active:scale-95 group"
                                            >
                                                <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" /> Invite Sponsor
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                            {displaySponsorUsers.map(sp => renderPersonnelCard(sp, 'assigned_sponsors', 'Study Sponsor', 'cyan'))}
                                        </div>
                                    </div>

                                    {/* Footer / Action Hub */}
                                    <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div>
                                            <h4 className="text-[13px] font-black text-white uppercase tracking-widest italic">Team Permissions</h4>
                                            <p className="text-[11px] text-slate-500 uppercase font-bold mt-2 italic tracking-widest">Selected personnel will be automatically assigned to this study upon launch.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-8">
                            <div className="bg-[#0B101B] border border-white/5 rounded-[2rem] p-8 space-y-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5"><Layers className="w-40 h-40 text-white" /></div>
                                 <div className="flex items-center justify-between border-l-4 border-indigo-500 pl-6">
                                    <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">Forms & Questionnaires</h2>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setShowScreenerBuilder(true)}
                                            className="px-6 py-2.5 bg-[#0B101B] border border-pink-500/30 rounded-xl text-[10px] font-black text-pink-500 uppercase tracking-widest hover:bg-pink-500/10 transition-all shadow-lg active:scale-95 flex items-center gap-3"
                                        >
                                            <MousePointer2 className="w-5 h-5" /> Eligibility Designer
                                        </button>
                                        <button
                                            onClick={() => setShowQuestionnaireBuilder(true)}
                                            className="px-6 py-2.5 bg-indigo-600 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-3"
                                        >
                                            <Plus className="w-5 h-5" /> Create New Questionnaire
                                        </button>
                                    </div>
                                </div>

                                {/* Screener Registry Library */}
                                {existingStudies.some(s => getScreenerQuestions(s).length > 0 && s.id !== initialData?.id) && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-px flex-1 bg-white/5" />
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Import Existing Screener</p>
                                            <div className="h-px flex-1 bg-white/5" />
                                        </div>
                                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                                            {existingStudies
                                                .filter(s => getScreenerQuestions(s).length > 0 && s.id !== initialData?.id)
                                                .map(s => (
                                                <div key={s.id} className="shrink-0 p-5 bg-[#0d1424] border border-white/5 rounded-2xl flex flex-col items-start gap-4 hover:border-pink-500/30 transition-all group w-56 relative">
                                                    <div className="flex flex-col gap-1 w-full">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Search className="w-3.5 h-3.5 text-pink-500" />
                                                                <span className="text-[10px] font-black text-white uppercase tracking-widest italic">{s.protocol_id}</span>
                                                            </div>
                                                            <span className="text-[9px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{getScreenerQuestions(s).length} Qs</span>
                                                        </div>
                                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate mt-1 w-full" title={s.title}>{s.title}</p>
                                                    </div>
                                                    
                                                    <div className="flex w-full gap-2 mt-auto">
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); setPreviewScreener(s); }}
                                                            className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest transition-all text-center"
                                                        >
                                                            Preview
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                const qs = getScreenerQuestions(s);
                                                                setFormData(prev => ({ ...prev, screener_questions: qs }));
                                                                alert(`Imported ${qs.length} eligibility questions from ${s.protocol_id}`);
                                                            }}
                                                            className="flex-1 py-2 bg-pink-500/10 hover:bg-pink-500/20 shadow-lg shadow-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-center"
                                                        >
                                                            Import
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Current Eligibility Screener Preview */}
                                {formData.screener_questions && formData.screener_questions.length > 0 && (
                                    <div className="bg-white/[0.02] border border-pink-500/20 rounded-2xl p-6 mb-8 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><MousePointer2 className="w-32 h-32 text-pink-500" /></div>
                                        <div className="flex items-center justify-between mb-6 relative z-10">
                                            <div>
                                                <h3 className="text-sm font-black text-pink-400 uppercase italic flex items-center gap-2">
                                                    <ShieldCheck className="w-4 h-4" /> Current Eligibility Screener
                                                </h3>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                                    {formData.screener_questions.length} Active Questions
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setShowScreenerBuilder(true)}
                                                className="px-4 py-2 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
                                            >
                                                Edit Screener <MousePointer2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="space-y-3 relative z-10 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                            {formData.screener_questions.map((q: any, idx: number) => (
                                                <div key={idx} className="p-4 bg-black/20 border border-white/5 rounded-xl flex flex-col gap-2 transition-all hover:border-pink-500/30">
                                                    <span className="text-[12px] font-bold text-white"><span className="text-pink-500 mr-2">{idx + 1}.</span>{q.label}</span>
                                                    <div className="flex gap-2 items-center">
                                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">
                                                            {q.type.replace('_', ' ')}
                                                        </span>
                                                        {q.required && <span className="text-[9px] font-black text-pink-400 uppercase tracking-widest bg-pink-500/10 px-2 py-0.5 rounded-md">Required</span>}
                                                        {q.allow_multiple && <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-md">Multiple</span>}
                                                        {q.options && q.options.length > 0 && (
                                                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                                                {q.options.length} Options
                                                            </span>
                                                        )}
                                                    </div>
                                                    {q.options && q.options.length > 0 && (
                                                        <div className="mt-2 pl-6 border-l-2 border-white/5 space-y-1">
                                                            {q.options.map((opt: string, optIdx: number) => (
                                                                <p key={optIdx} className="text-[10px] font-medium text-slate-400">{opt}</p>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                                    {availableTemplates.map(t => {
                                        const isSelected = formData.study_questionnaires.some((sq: any) => sq.template === t.id);
                                        const config = formData.study_questionnaires.find((sq: any) => sq.template === t.id);
                                        const isExpanded = expandedTemplateId === t.id;

                                        return (
                                            <div 
                                                key={t.id} 
                                                onClick={() => setExpandedTemplateId(isExpanded ? null : t.id)}
                                                className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                                                    isSelected 
                                                    ? 'bg-indigo-600/10 border-indigo-500/50' 
                                                    : 'bg-white/5 border-white/5 hover:border-white/20'
                                                } ${isExpanded ? 'ring-2 ring-indigo-500/20' : ''}`}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-sm font-black text-white uppercase italic truncate max-w-[150px]">{t.name}</h3>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Don't trigger expansion toggle
                                                            if (isSelected) {
                                                                setFormData({...formData, study_questionnaires: formData.study_questionnaires.filter((sq: any) => sq.template !== t.id)});
                                                                if (isExpanded) setExpandedTemplateId(null);
                                                            } else {
                                                                setFormData({...formData, study_questionnaires: [...formData.study_questionnaires, { 
                                                                    template: t.id, 
                                                                    mode: 'STRUCTURED', 
                                                                    frequency_interval: 1, 
                                                                    frequency_unit: 'WEEKS', 
                                                                    repetitions: 1, 
                                                                    schedule_name: t.name,
                                                                    allow_participant_download: false,
                                                                    notify_staff_on_submission: true
                                                                }]});
                                                                setExpandedTemplateId(t.id);
                                                            }
                                                        }}
                                                        className={`p-2 rounded-lg transition-all ${isSelected ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}
                                                    >
                                                        {isSelected ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                    </button>
                                                </div>

                                                {isSelected && isExpanded && (
                                                    <div className="space-y-4 pt-4 border-t border-white/5" onClick={e => e.stopPropagation()}>
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Capture Mode</label>
                                                            <div className="flex gap-2 p-1 bg-black/20 rounded-lg">
                                                                <button 
                                                                    onClick={() => setFormData({...formData, study_questionnaires: formData.study_questionnaires.map((sq: any) => sq.template === t.id ? {...sq, mode: 'PDF'} : sq)})}
                                                                    className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase transition-all ${config.mode === 'PDF' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
                                                                >
                                                                    Full PDF
                                                                </button>
                                                                <button 
                                                                    onClick={() => setFormData({...formData, study_questionnaires: formData.study_questionnaires.map((sq: any) => sq.template === t.id ? {...sq, mode: 'STRUCTURED'} : sq)})}
                                                                    className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase transition-all ${config.mode === 'STRUCTURED' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
                                                                >
                                                                    Structured
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-4 mb-6">
                                                            <div>
                                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Recurrence Pattern</label>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-bold text-white/40 uppercase">Repeat every</span>
                                                                    <input 
                                                                        type="number" 
                                                                        min="1"
                                                                        value={config.frequency_interval === 0 ? '' : config.frequency_interval}
                                                                        onChange={e => setFormData({...formData, study_questionnaires: formData.study_questionnaires.map((sq: any) => sq.template === t.id ? {...sq, frequency_interval: parseInt(e.target.value, 10) || 0} : sq)})}
                                                                        placeholder="1"
                                                                        className="w-16 bg-white/5 border border-white/10 rounded-lg p-2 text-[11px] font-black text-indigo-400 text-center placeholder:text-indigo-400/20"
                                                                    />
                                                                    <select 
                                                                        value={config.frequency_unit || 'WEEKS'}
                                                                        onChange={e => setFormData({...formData, study_questionnaires: formData.study_questionnaires.map((sq: any) => sq.template === t.id ? {...sq, frequency_unit: e.target.value} : sq)})}
                                                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] font-black uppercase text-indigo-400"
                                                                    >
                                                                        <option value="DAYS">Days</option>
                                                                        <option value="WEEKS">Weeks</option>
                                                                        <option value="MONTHS">Months</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex-1">
                                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Total Repetitions</label>
                                                                    <input 
                                                                        type="number" 
                                                                        min="1"
                                                                        value={config.repetitions === 0 ? '' : config.repetitions}
                                                                        onChange={e => setFormData({...formData, study_questionnaires: formData.study_questionnaires.map((sq: any) => sq.template === t.id ? {...sq, repetitions: parseInt(e.target.value, 10) || 0} : sq)})}
                                                                        placeholder="1"
                                                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] font-black text-white placeholder:text-white/20"
                                                                    />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Baseline Week</label>
                                                                    <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] font-black text-indigo-300 text-center uppercase">
                                                                        {(config.frequency_unit || 'WEEKS').replace('S', '')} 0
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-3 mb-4">
                                                            <button 
                                                                onClick={() => setFormData({...formData, study_questionnaires: formData.study_questionnaires.map((sq: any) => sq.template === t.id ? {...sq, allow_participant_download: !sq.allow_participant_download} : sq)})}
                                                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${config.allow_participant_download ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-500'}`}
                                                            >
                                                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${config.allow_participant_download ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'}`}>
                                                                    {config.allow_participant_download && <CheckSquare className="w-2.5 h-2.5 text-white" />}
                                                                </div>
                                                                <span className="text-[9px] font-black uppercase tracking-widest leading-none">Allow Download</span>
                                                            </button>
                                                            <button 
                                                                onClick={() => setFormData({...formData, study_questionnaires: formData.study_questionnaires.map((sq: any) => sq.template === t.id ? {...sq, notify_staff_on_submission: !sq.notify_staff_on_submission} : sq)})}
                                                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${config.notify_staff_on_submission ? 'bg-emerald-600/20 border-emerald-500 text-white' : 'bg-white/5 border-white/5 text-slate-500'}`}
                                                            >
                                                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${config.notify_staff_on_submission ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                                                                    {config.notify_staff_on_submission && <CheckSquare className="w-2.5 h-2.5 text-white" />}
                                                                </div>
                                                                <span className="text-[9px] font-black uppercase tracking-widest leading-none">Notify Staff</span>
                                                            </button>
                                                        </div>

                                                        <div className="pt-4 border-t border-white/5 space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic flex items-center gap-2">
                                                                    <Activity className="w-3 h-3" /> Instrumented Content
                                                                </h4>
                                                                <span className="text-[9px] text-white/40 font-bold uppercase">Intelligence Preview</span>
                                                            </div>
                                                            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                                                                {config.mode === 'PDF' ? (
                                                                    <div className="py-12 text-center border border-dashed border-indigo-500/30 rounded-2xl bg-indigo-500/5">
                                                                        <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                                                                            <FileText className="w-6 h-6 text-indigo-400" />
                                                                        </div>
                                                                        <p className="text-[11px] text-indigo-300 font-black uppercase italic tracking-[0.2em] leading-relaxed px-10">
                                                                            Paper-Integrated PDF Capture Mode<br/>
                                                                            <span className="text-[8px] opacity-70 mt-1 block font-bold text-slate-500 uppercase tracking-widest italic">System will ingest physical scan of the source document</span>
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    (t.json_structure?.sections?.length > 0 || t.json_structure?.questions?.length > 0) ? (
                                                                        <>
                                                                            {/* Render Sections if they exist */}
                                                                            {t.json_structure?.sections?.map((section: any, si: number) => (
                                                                                <div key={si} className="space-y-4">
                                                                                    <div className="flex items-center gap-3 mb-2">
                                                                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                                                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] font-mono italic">{section.label || section.title}</p>
                                                                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                                                                    </div>
                                                                                    {section.fields?.map((field: any, fi: number) => (
                                                                                        <QuestionPreview key={fi} field={field} index={fi} />
                                                                                    ))}
                                                                                </div>
                                                                            ))}
                                                                            
                                                                            {/* Fallback to flat questions if no sections */}
                                                                            {(!t.json_structure?.sections || t.json_structure?.sections.length === 0) && t.json_structure?.questions?.map((field: any, fi: number) => (
                                                                                <QuestionPreview key={fi} field={field} index={fi} />
                                                                            ))}
                                                                        </>
                                                                    ) : (
                                                                        <div className="py-8 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                                                                            <AlertCircle className="w-6 h-6 text-slate-700 mx-auto mb-3 opacity-50" />
                                                                            <p className="text-[10px] text-slate-600 font-black uppercase italic tracking-[0.2em] leading-relaxed">
                                                                                Intelligence Protocol Empty<br/>
                                                                                <span className="text-[8px] opacity-50 mt-1 block">Deploy logic via Questionnaire Builder</span>
                                                                            </p>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 5 && (
                        <motion.div key="step5" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-8">
                            <div className="bg-[#0B101B] border border-white/5 rounded-[2.5rem] p-10 flex flex-col shadow-2xl relative overflow-hidden min-h-[500px]">
                                <div className="mb-10">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-2">Study documents</h3>
                                    <p className="text-slate-500 text-[13px] font-medium leading-relaxed max-w-3xl">
                                        Upload required documents. The consent form will appear in the participant portal for electronic signature if e-consent was selected.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-12">
                                    {/* Consent Form Zone */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] font-mono italic">Informed Consent Form</p>
                                            <div className="h-px flex-1 bg-white/5" />
                                        </div>
                                        
                                        <div 
                                            onClick={() => { pendingCategory.current = 'Informed_Consent'; fileInputRef.current?.click(); }}
                                            className="group cursor-pointer border-2 border-dashed border-white/5 hover:border-indigo-500/30 rounded-[2rem] p-14 bg-white/[0.01] hover:bg-indigo-500/[0.02] transition-all flex flex-col items-center justify-center text-center relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl relative z-10">
                                                <FileCheck className="w-8 h-8 text-indigo-400" />
                                            </div>
                                            <p className="text-[14px] font-black text-white uppercase tracking-widest mb-1 relative z-10">Click to upload consent form (PDF, DOCX)</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic opacity-60 relative z-10">This will appear in the participant portal for online signature</p>
                                        </div>
                                    </div>

                                    {/* Additional Documents Zone */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono italic">Additional Study Documents</p>
                                            <div className="h-px flex-1 bg-white/5" />
                                        </div>

                                        <div 
                                            onClick={() => { pendingCategory.current = 'Other'; fileInputRef.current?.click(); }}
                                            className="group cursor-pointer border-2 border-dashed border-white/5 hover:border-white/10 rounded-[2rem] p-10 bg-white/[0.01] hover:bg-white/[0.03] transition-all flex flex-col items-center justify-center text-center"
                                        >
                                            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                                <Upload className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <p className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Upload protocol, IRB approval, or other documents</p>
                                        </div>
                                    </div>
                                </div>

                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

                                {/* List of Uploaded Docs */}
                                {uploadedDocs.length > 0 && (
                                    <div className="mt-16 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <h4 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                <Layers className="w-4 h-4 text-indigo-500" /> Uploaded Assets ({uploadedDocs.length})
                                            </h4>
                                            <div className="h-px flex-1 bg-white/10" />
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-4">
                                            {uploadedDocs.map(doc => (
                                                <div key={doc.id} className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col gap-6 group transition-all hover:border-indigo-500/30 shadow-xl">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-indigo-500/10 transition-all">
                                                                {doc.category === 'Informed_Consent' ? <FileCheck className="w-6 h-6 text-indigo-400" /> : <Microscope className="w-6 h-6 text-indigo-400" />}
                                                            </div>
                                                            <div>
                                                                <p className="text-[14px] font-black text-white uppercase tracking-tight">{doc.name}</p>
                                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest italic font-bold">
                                                                    {doc.category.replace('_', ' ')} • {doc.version}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => setUploadedDocs(prev => prev.filter(d => d.id !== doc.id))} 
                                                            className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    </div>

                                                    <div className="pt-4 border-t border-white/5">
                                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                                            <ShieldCheck className="w-3 h-3 text-indigo-500" />
                                                            Visibility Permissions
                                                        </p>
                                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                                            {[
                                                                { role: 'PARTICIPANT', label: 'Participants', icon: Users },
                                                                { role: 'PI', label: 'Principal Inves.', icon: Award },
                                                                { role: 'COORDINATOR', label: 'Coordinators', icon: UserPlus },
                                                                { role: 'SPONSOR', label: 'Sponsors', icon: Building2 },
                                                            ].map((opt) => {
                                                                const isSelected = doc.visible_to.includes(opt.role);
                                                                return (
                                                                    <button
                                                                        key={opt.role}
                                                                        onClick={() => toggleDocVisibility(doc.id, opt.role)}
                                                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                                                            isSelected 
                                                                                ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.1)]' 
                                                                                : 'bg-white/[0.02] border-white/5 text-slate-600 hover:border-white/10'
                                                                        }`}
                                                                    >
                                                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${isSelected ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-white/5 border-white/10'}`}>
                                                                            {isSelected ? <Check className="w-3 h-3" /> : <opt.icon className="w-3 h-3" />}
                                                                        </div>
                                                                        <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 6 && (
                        <motion.div key="step5" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-8">
                            <div className="bg-[#0B101B] border border-white/5 rounded-[2rem] p-8 space-y-8 shadow-2xl relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic border-l-4 border-indigo-500 pl-6">Final Review</h3>
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${validation?.isValid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                        {validation?.isValid ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                        <span className="text-[10px] font-black uppercase tracking-widest">{validation?.isValid ? "Ready to Launch" : "Missing Information"}</span>
                                    </div>
                                </div>



                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                    <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-6 italic">
                                        <ShieldCheck className="w-4 h-4" /> Shared Study Documents
                                    </h4>
                                    <div className="space-y-3">
                                        {uploadedDocs.map(doc => (
                                            <div key={doc.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                    <span className="text-[11px] font-black text-white uppercase italic truncate max-w-[200px]">{doc.name}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    {['PARTICIPANT', 'PI', 'COORDINATOR', 'SPONSOR'].map(role => {
                                                        const isShared = doc.visible_to.includes(role);
                                                        return (
                                                            <div 
                                                                key={role} 
                                                                title={`${role} visibility`}
                                                                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-black border transition-all ${
                                                                    isShared 
                                                                        ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400' 
                                                                        : 'bg-white/5 border-white/5 text-slate-700 opacity-30'
                                                                }`}
                                                            >
                                                                {role.charAt(0)}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                        {uploadedDocs.length === 0 && (
                                            <p className="text-[10px] text-slate-600 font-bold uppercase italic text-center py-4">No documents added yet</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Action Bar Hub */}
            <div className="fixed bottom-0 right-0 left-0 xl:left-[240px] h-20 border-t border-white/5 bg-[#0B101B]/90 backdrop-blur-xl flex items-center justify-between px-6 z-[60]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 1}
                        className={`px-6 md:px-10 py-4 h-12 rounded-2xl border flex items-center gap-3 transition-all ${currentStep === 1 ? 'opacity-20 cursor-not-allowed border-white/5 text-slate-600' : 'bg-white/5 border-white/10 text-white hover:bg-white/10 shadow-xl'}`}
                    >
                        <ChevronLeft className="w-4 h-4 text-indigo-400" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">Previous Phase</span>
                    </button>
                </div>

                <div className="flex items-center gap-6">
                    {formData.title && (
                        <button 
                            onClick={() => handleSubmit({ isDraft: true })}
                            disabled={isSubmitting}
                            className="hidden md:flex px-6 py-4 h-12 bg-white/5 border border-white/10 text-emerald-400 rounded-2xl items-center gap-3 hover:bg-white/10 transition-all group"
                        >
                            <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Save Progress</span>
                        </button>
                    )}

                    <button onClick={onClose} className="px-6 py-4 text-slate-500 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest italic group h-12 flex items-center">
                        Discard <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">Study</span>
                    </button>

                    {currentStep < 6 ? (
                        <button onClick={handleNext} className="px-8 md:px-12 py-4 h-12 bg-indigo-600 text-white rounded-2xl flex items-center gap-3 shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all group">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Next Step</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    ) : (
                        <button
                            onClick={() => handleSubmit()}
                            disabled={!validation?.isValid || isSubmitting}
                            className={`px-10 md:px-14 py-4 h-12 rounded-2xl flex items-center gap-3 transition-all ${validation?.isValid && !isSubmitting ? 'bg-indigo-600 text-white shadow-xl hover:scale-[1.05] active:scale-95' : 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed border border-white/5'}`}
                        >
                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">{isSubmitting ? 'Launching...' : 'Launch Study'}</span>
                            {isSubmitting ? <Activity className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Sponsor Search Modal Overlay - Portaled */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {showSponsorDropdown && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-[#05060f]/98 backdrop-blur-2xl">
                            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-2xl bg-[#0B101B] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-1">Identity Protocol</h4>
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Sponsor Portal Search</h3>
                                    </div>
                                    <button onClick={() => { setShowSponsorDropdown(false); setSponsorSearch(''); }} className="p-3 hover:bg-white/5 rounded-full transition-all"><X className="w-5 h-5 text-slate-500" /></button>
                                </div>
                                <div className="p-6 bg-black/40">
                                    <div className="relative group">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input autoFocus placeholder="Search Organizations..." value={sponsorSearch} onChange={(e) => setSponsorSearch(e.target.value)} className="w-full bg-[#05060f] border border-white/10 rounded-[2rem] pl-14 pr-6 py-4 text-white outline-none focus:border-indigo-500/50 font-bold italic" />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest px-4 py-2">Clinical Personnel / Orgs</p>
                                    {filteredSponsors.map(s => (
                                        <div key={s?.id} onClick={() => {
                                            setFormData({ ...formData, sponsor_id: s.type === 'PERSONNEL' ? s.id : '', sponsor_org_id: s.type === 'ORGANIZATION' ? s.id : '', sponsor_name: s?.displayName });
                                            setShowSponsorDropdown(false);
                                            setSponsorSearch('');
                                        }} className="px-4 py-3.5 hover:bg-indigo-600/10 cursor-pointer rounded-[2rem] flex items-center justify-between transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    {s.type === 'ORGANIZATION' ? <Building2 className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-base font-black text-white italic tracking-tight">{s?.displayName}</p>
                                                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{s.type === 'ORGANIZATION' ? 'GXP Verified Organization' : 'Lead Personnel Delegate'}</p>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black uppercase opacity-0 group-hover:opacity-100">Select</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-6 border-t border-white/5 flex gap-4 bg-black/20">
                                    <button onClick={async () => { /* Handle add org */ }} className="flex-1 py-4 bg-indigo-600 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all">Add Organization</button>
                                    <button onClick={() => { setShowSponsorDropdown(false); setShowInviteSponsorModal(true); }} className="flex-1 py-4 bg-white/5 border border-white/10 text-emerald-400 rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Invite Delegate</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                , document.body)}

            {/* Invite Modals - Portaled */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {(showInviteMemberModal || showInviteSponsorModal) && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-[#05060f]/98 backdrop-blur-2xl"
                        >
                            <motion.div 
                                initial={{ scale: 0.9, y: 20 }} 
                                animate={{ scale: 1, y: 0 }} 
                                className="w-full max-w-md bg-[#0B101B] border border-white/5 rounded-[2.5rem] p-10 shadow-3xl space-y-8 relative overflow-hidden"
                            >
                                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full" />
                                
                                <div className="flex items-center justify-between relative z-10">
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                        {showInviteSponsorModal ? 'Invite Sponsor' : `Invite ${inviteMemberRole === 'TEAM_MEMBER' ? 'Staff Member' : inviteMemberRole}`}
                                    </h3>
                                    <button 
                                        onClick={() => { setShowInviteMemberModal(false); setShowInviteSponsorModal(false); }} 
                                        className="p-2 hover:bg-white/5 rounded-full transition-all"
                                    >
                                        <X className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>

                                <form 
                                    onSubmit={(e) => { e.preventDefault(); showInviteSponsorModal ? handleInviteSponsor(e) : handleInvitePersonnel(e); }} 
                                    className="space-y-6 relative z-10"
                                >
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 italic">Full Identity Name</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={inviteData.name} 
                                            onChange={e => setInviteData({ ...inviteData, name: e.target.value })} 
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-indigo-500/50 transition-all font-mono"
                                            placeholder="EX: DR. SARAH CHEN"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 italic">Sync Email Address</label>
                                        <input 
                                            type="email" 
                                            required 
                                            value={inviteData.email} 
                                            onChange={e => setInviteData({ ...inviteData, email: e.target.value })} 
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-indigo-500/50 transition-all font-mono"
                                            placeholder="CHEN@MUSB-HEALTH.COM"
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={inviteLoading} 
                                        className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        {inviteLoading ? <Activity className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                                        {inviteLoading ? 'PROCESSING SYNC...' : 'INITIALIZE DEPLOYMENT'}
                                    </button>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                , document.body)}

            {/* In-Workflow Questionnaire Builder Modal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {showQuestionnaireBuilder && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-[#05060f]/98 backdrop-blur-2xl"
                        >
                            <motion.div 
                                initial={{ scale: 0.95, y: 30, opacity: 0 }} 
                                animate={{ scale: 1, y: 0, opacity: 1 }} 
                                exit={{ scale: 0.95, y: 30, opacity: 0 }}
                                className="w-full max-w-7xl bg-[#0B101B] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[90vh]"
                            >
                                <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                                            <Layers className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Questionnaire Builder</h3>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Create forms and assessments for this study</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setShowQuestionnaireBuilder(false)} 
                                        className="p-4 hover:bg-white/5 rounded-2xl transition-all border border-white/5 group"
                                    >
                                        <X className="w-6 h-6 text-slate-500 group-hover:text-white transition-colors" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-black/20">
                                    <div className="max-w-6xl mx-auto">
                                        <QuestionnaireBuilder initialTab="Create New" />
                                    </div>
                                </div>
                                <div className="px-10 py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-center">
                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] italic">
                                        STUDY SYNC ACTIVE
                                    </p>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            , document.body)}

            {/* In-Workflow Screener Builder Modal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {showScreenerBuilder && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-[#05060f]/98 backdrop-blur-2xl">
                            <motion.div 
                                initial={{ scale: 0.95, y: 30, opacity: 0 }} 
                                animate={{ scale: 1, y: 0, opacity: 1 }} 
                                className="w-full max-w-7xl bg-[#0B101B] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[90vh]"
                            >
                                <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-[1.5rem] bg-pink-600 flex items-center justify-center text-white shadow-xl shadow-pink-600/20">
                                            <MousePointer2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Screener Builder</h3>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Create questions to screen new participants</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setShowScreenerBuilder(false)} 
                                        className="p-4 hover:bg-white/5 rounded-2xl transition-all border border-white/5 group"
                                    >
                                        <X className="w-6 h-6 text-slate-500 group-hover:text-white transition-colors" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-black/20">
                                    <div className="max-w-6xl mx-auto">
                                        <ScreenerBuilder 
                                            initialQuestions={formData.screener_questions}
                                            standalone={true}
                                            onSave={(qs) => {
                                                setFormData({ ...formData, screener_questions: qs });
                                                setShowScreenerBuilder(false);
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="px-10 py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-center">
                                    <p className="text-[10px] text-pink-600 font-black uppercase tracking-[0.4em] italic">
                                        SCREENER DESIGN ACTIVE
                                    </p>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            , document.body)}

            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {previewScreener && (
                        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-6 bg-[#05060f]/98 backdrop-blur-2xl">
                            <motion.div 
                                initial={{ scale: 0.95, y: 30, opacity: 0 }} 
                                animate={{ scale: 1, y: 0, opacity: 1 }} 
                                exit={{ scale: 0.95, y: -20, opacity: 0 }}
                                className="w-full max-w-4xl bg-[#0B101B] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                            >
                                <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-600/10">
                                            <Search className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
                                                {previewScreener?.protocol_id} Screener
                                            </h3>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">{previewScreener?.title}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.preventDefault(); setPreviewScreener(null); }} 
                                        className="p-4 hover:bg-white/5 rounded-2xl transition-all border border-white/5 group"
                                    >
                                        <X className="w-6 h-6 text-slate-500 group-hover:text-white transition-colors" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-4">
                                    {getScreenerQuestions(previewScreener).map((q: any, idx: number) => (
                                        <QuestionPreview key={idx} field={q} index={idx} />
                                    ))}
                                </div>
                                <div className="px-10 py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] italic">
                                        PREVIEW MODE
                                    </p>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const qs = getScreenerQuestions(previewScreener);
                                            setFormData(prev => ({ ...prev, screener_questions: qs }));
                                            alert(`Imported ${qs.length} eligibility questions from ${previewScreener.protocol_id}`);
                                            setPreviewScreener(null);
                                        }}
                                        className="px-6 py-3 bg-pink-500/10 hover:bg-pink-500/20 shadow-lg shadow-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Import These Questions
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            , document.body)}
        </div>
    );
};

const LaunchStudyForm = React.memo(LaunchStudyFormRoot);
export default LaunchStudyForm;
