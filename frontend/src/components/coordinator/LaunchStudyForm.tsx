import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Rocket, Beaker, Activity, Users, FileText, CheckCircle2,
    X, ChevronDown, Upload, ChevronRight, ChevronLeft,
    AlertCircle, History, CheckSquare, TrendingUp,
    ShieldCheck, Microscope, UserPlus, FileCheck, Layers,
    Briefcase, Plus, Calendar, Award, DollarSign,
    Building2, Search, Building, Check, ExternalLink
} from 'lucide-react';
import { authFetch, API, revealValue } from '../../utils/auth';

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
    category: 'Protocol' | 'IRB_Letter' | 'Flyer' | 'Other';
    version: string;
    status: 'Current' | 'Draft';
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

const LaunchStudyFormRoot = ({ onClose, onSave, initialData, availablePIs = [], availableCoordinators = [], availableSponsors = [], availableSponsorUsers = [] }: LaunchStudyFormProps) => {
    const [currentStep, setCurrentStep] = useState<StepID>(1);
    const [lastSaved, setLastSaved] = useState<string>('Just now');

    // Required for tracking newly invited personnel during the session
    const [invitedSponsors, setInvitedSponsors] = useState<any[]>([]);
    const [fetchedPIs, setFetchedPIs] = useState<any[]>([]);
    const [fetchedCoordinators, setFetchedCoordinators] = useState<any[]>([]);
    const [fetchedSponsorUsers, setFetchedSponsorUsers] = useState<any[]>([]);

    const [showInviteSponsorModal, setShowInviteSponsorModal] = useState(false);
    const [showInviteMemberModal, setShowInviteMemberModal] = useState(false);
    const [inviteMemberRole, setInviteMemberRole] = useState<'PI' | 'COORDINATOR' | 'STUDY_STAFF'>('PI');
    const [inviteData, setInviteData] = useState({ name: '', email: '', organization: '' });
    const [inviteLoading, setInviteLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isInviting, setIsInviting] = useState(false);

    const displayPIs = useMemo(() => (availablePIs && availablePIs.length > 0) ? availablePIs : fetchedPIs, [availablePIs, fetchedPIs]);
    const displayCoordinators = useMemo(() => (availableCoordinators && availableCoordinators.length > 0) ? availableCoordinators : fetchedCoordinators, [availableCoordinators, fetchedCoordinators]);
    const displaySponsorUsers = useMemo(() => {
        const base = (availableSponsorUsers && availableSponsorUsers.length > 0) ? availableSponsorUsers : fetchedSponsorUsers;
        return [...base, ...(invitedSponsors || [])];
    }, [availableSponsorUsers, fetchedSponsorUsers, invitedSponsors]);

    const displaySponsors = useMemo(() => availableSponsors || [], [availableSponsors]);

    const CURRENCY_SYMBOLS: Record<string, string> = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'INR': '₹',
        'AUD': 'A$', 'CAD': 'C$', 'CHF': 'CHF', 'CNY': '¥', 'SEK': 'kr',
        'NZD': 'NZ$', 'SGD': 'S$', 'HKD': 'HK$', 'KRW': '₩', 'TRY': '₺',
        'RUB': '₽', 'BRL': 'R$', 'ZAR': 'R', 'AED': 'DH', 'SAR': 'SR'
    };

    const [formData, setFormData] = useState({
        protocol_id: initialData?.protocol_id || `MUSB-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`,
        sponsor_id: initialData?.sponsor_id || '',
        sponsor_org_id: initialData?.sponsor_org_id || '',
        sponsor_name: initialData?.sponsor_name || '',
        startDate: initialData?.startDate || initialData?.start_date || '',
        endDate: initialData?.endDate || initialData?.end_date || '',
        full_title: initialData?.full_title || '',
        title: initialData?.title || '',
        indication: initialData?.indication || initialData?.primary_indication || '',
        brief_description: initialData?.brief_description || initialData?.description || '',
        overview: initialData?.overview || '',
        execution_type: initialData?.execution_type || initialData?.study_type || 'IN_PERSON',
        trial_model: initialData?.trial_model || 'RCT',
        rct_design: initialData?.rct_design || 'PARALLEL',
        masking: initialData?.masking || 'DOUBLE_BLIND',
        phase: initialData?.phase || 'PHASE_2',
        target_subjects: initialData?.target_subjects || initialData?.target_screened || 0,
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
        uses_kit: initialData?.uses_kit || false,
        kit_dispatch_required: initialData?.kit_dispatch_required || false,
        kit_tracking_enabled: initialData?.kit_tracking_enabled || false,
        kit_description: initialData?.kit_description || '',
        study_questionnaires: initialData?.study_questionnaires || []
    });

    const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
    
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await authFetch(`${API}/api/questionnaire-templates/`);
                if (res.ok) {
                    const data = await res.json();
                    setAvailableTemplates(Array.isArray(data) ? data : (data.results || []));
                }
            } catch (err) { }
        };
        
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

        fetchTemplates();
        fetchTeamData();
    }, []);

    const [uploadedDocs, setUploadedDocs] = useState<DocumentFile[]>([]);
    const [sponsorSearch, setSponsorSearch] = useState('');
    const [showSponsorDropdown, setShowSponsorDropdown] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInvitePersonnel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteData.email || !inviteData.name) return;
        setInviteLoading(true);
        try {
            const res = await authFetch('/api/auth/admin/create-user/', {
                method: 'POST',
                body: JSON.stringify({
                    email: inviteData.email,
                    full_name: inviteData.name,
                    role: inviteMemberRole,
                    is_invited: true
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (inviteMemberRole === 'PI') {
                    setFormData(prev => ({ ...prev, pi_id: [data.id] }));
                } else {
                    setFormData(prev => ({ ...prev, coordinator_id: [...(prev.coordinator_id || []), data.id] }));
                }
                setShowInviteMemberModal(false);
                setInviteData({ name: '', email: '', organization: '' });
                alert(`${inviteMemberRole} Invited Successfully!`);
            }
        } catch (err) { console.error(err); } finally { setInviteLoading(false); }
    };

    const handleInviteSponsor = async (e: React.FormEvent) => {
        if (!inviteData.email || !inviteData.email.includes('@')) return alert("Valid email required.");
        setIsInviting(true);
        try {
            const res = await authFetch(`${API}/api/auth/admin/create-user/`, {
                method: 'POST',
                body: JSON.stringify({
                    email: inviteData.email,
                    first_name: inviteData.name || inviteData.email.split('@')[0],
                    last_name: 'Sponsor',
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
            }
        } catch (e) { console.error(e); } finally { setIsInviting(false); }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) return alert("File too large (Max 10MB)");
            const newDoc: DocumentFile = {
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                category: 'Protocol',
                version: 'V1.0 (Draft)',
                status: 'Draft'
            };
            setUploadedDocs(prev => [newDoc, ...prev]);
        }
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
    }, []);

    const toggleMultiSelect = useCallback((field: 'pi_id' | 'coordinator_id' | 'consent_collection', val: string) => {
        setFormData(prev => {
            const list = Array.isArray(prev[field]) ? [...(prev[field] as string[])] : [];
            const index = list.indexOf(val);
            if (index > -1) list.splice(index, 1);
            else list.push(val);
            return { ...prev, [field]: list };
        });
    }, []);

    const validation = useMemo(() => {
        const required = ['startDate', 'full_title', 'title', 'indication', 'brief_description'];
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

    const handleSubmit = useCallback(async () => {
        if (!validation?.isValid || !onSave || isSubmitting) return;

        const { pi_id, coordinator_id, assigned_sponsors, startDate, endDate, execution_type, indication, brief_description, masking, ...baseData } = formData;
        const payload = {
            ...baseData,
            primary_indication: indication,
            condition: indication,
            description: brief_description,
            study_type: execution_type,
            start_date: startDate || null,
            end_date: endDate || null,
            is_double_blind: masking === 'DOUBLE_BLIND' || masking === 'TRIPLE_BLIND' || masking === 'QUADRUPLE_BLIND',
            masking_strategy: masking,
            has_placebo_control: formData.trial_model === 'RCT',
            pi_ids: Array.isArray(pi_id) ? pi_id : [],
            coordinator_ids: Array.isArray(coordinator_id) ? coordinator_id : [],
            status: 'RECRUITING',
            stage: 'RECRUITING'
        };

        setIsSubmitting(true);
        try {
            const result = await onSave(payload);
            if (result !== false) {
                alert("PROTOCOL SYNCED: Study registered successfully.");
            }
        } catch (err) {
            console.error("Study launch failed:", err);
            alert(err instanceof Error ? err.message : "Study launch failed. Please check the required fields and try again.");
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, isSubmitting, onSave, validation?.isValid]);

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
                                        <textarea name="full_title" value={formData.full_title} onChange={handleChange} placeholder="As stated on the clinical trial registry..." className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-base text-white font-bold outline-none focus:border-emerald-500/50 resize-none placeholder:opacity-20 italic leading-snug shadow-inner" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Public Short Title</label>
                                            <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-base text-white font-bold outline-none focus:border-emerald-500/50 shadow-inner" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Therapeutic Indication</label>
                                            <input type="text" name="indication" value={formData.indication} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-base text-white font-bold outline-none focus:border-emerald-500/50 italic shadow-inner" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Brief Summary Overview</label>
                                        <textarea name="brief_description" value={formData.brief_description} onChange={handleChange} className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm text-white/80 font-medium outline-none focus:border-emerald-500/50 resize-none leading-relaxed shadow-inner" />
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

                                <div className="pt-6 border-t border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Participant Goal</label>
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                                            <div>
                                                <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Target Sample Size</p>
                                                <p className="text-3xl font-black text-white italic mt-1">{formData.target_subjects}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setFormData({ ...formData, target_subjects: Math.max(0, formData.target_subjects - 10) })} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all font-black text-lg">-</button>
                                                <button onClick={() => setFormData({ ...formData, target_subjects: formData.target_subjects + 10 })} className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center hover:bg-indigo-500 transition-all font-black text-lg">+</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Consent Mechanics</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['ECONSENT', 'PAPER_CONSENT', 'REMOTE_WITNESS'].map(opt => (
                                                <button key={opt} onClick={() => toggleMultiSelect('consent_collection', opt)} className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all ${Array.isArray(formData.consent_collection) && formData.consent_collection.includes(opt) ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${Array.isArray(formData.consent_collection) && formData.consent_collection.includes(opt) ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'}`}>
                                                        {Array.isArray(formData.consent_collection) && formData.consent_collection.includes(opt) && <CheckSquare className="w-2.5 h-2.5 text-white" />}
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{opt.replace('_', ' ')}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5 space-y-6">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">Clinical Logistics (Study Kits)</label>
                                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
                                            <button
                                                onClick={() => setFormData({ ...formData, uses_kit: true })}
                                                className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${formData.uses_kit ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500'}`}
                                            >
                                                Kit Required
                                            </button>
                                            <button
                                                onClick={() => setFormData({ ...formData, uses_kit: false })}
                                                className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${!formData.uses_kit ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
                                            >
                                                No Kit
                                            </button>
                                        </div>
                                    </div>

                                    {formData.uses_kit && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                                    <p className="text-[11px] font-black text-cyan-400 uppercase tracking-widest mb-2">Dispatch Workflow</p>
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="checkbox" checked={formData.kit_dispatch_required} onChange={(e) => setFormData({ ...formData, kit_dispatch_required: e.target.checked })} className="hidden" />
                                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${formData.kit_dispatch_required ? 'bg-cyan-600 border-cyan-500 shadow-md' : 'border-white/20'}`}>
                                                            {formData.kit_dispatch_required && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                                                        </div>
                                                        <span className="text-[11px] font-black text-white uppercase tracking-widest group-hover:text-cyan-300 transition-colors">Local Dispatch System</span>
                                                    </label>
                                                </div>
                                                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                                    <p className="text-[11px] font-black text-cyan-400 uppercase tracking-widest mb-2">Sync Strategy</p>
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="checkbox" checked={formData.kit_tracking_enabled} onChange={(e) => setFormData({ ...formData, kit_tracking_enabled: e.target.checked })} className="hidden" />
                                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${formData.kit_tracking_enabled ? 'bg-indigo-600 border-indigo-500' : 'border-white/20'}`}>
                                                            {formData.kit_tracking_enabled && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                                                        </div>
                                                        <span className="text-[11px] font-black text-white uppercase tracking-widest group-hover:text-indigo-300 transition-colors">Courier Tracking</span>
                                                    </label>
                                                </div>
                                            </div>
                                            <textarea name="kit_description" value={formData.kit_description} onChange={handleChange} placeholder="Specify swabs, tubes, sensors, or other medical supplies included..." className="w-full h-20 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-[11px] text-white font-medium outline-none focus:border-cyan-500/50 resize-none placeholder:opacity-20 italic" />
                                        </motion.div>
                                    )}

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
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Research Team Deployment</h3>
                                </div>

                                <div className="space-y-12 relative z-10">
                                    {/* PI Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 ml-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                            <label className="text-[14px] font-black text-white/60 uppercase tracking-[0.2em] italic">Principal Investigators (PI)</label>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
                                            {displayPIs.map(pi => (
                                                <div 
                                                    key={pi?.id} 
                                                    onClick={() => toggleMultiSelect('pi_id', pi?.id)} 
                                                    className={`relative p-6 rounded-[1.5rem] border transition-all cursor-pointer group flex flex-col items-center text-center gap-3 overflow-hidden ${
                                                        Array.isArray(formData.pi_id) && formData.pi_id.includes(pi?.id) 
                                                        ? 'bg-indigo-500/10 border-indigo-500/50 shadow-xl shadow-indigo-500/5' 
                                                        : 'bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.05]'
                                                    }`}
                                                >
                                                    {Array.isArray(formData.pi_id) && formData.pi_id.includes(pi?.id) && (
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white border-2 border-[#0B101B] shadow-lg z-10">
                                                            <Check className="w-3 h-3" />
                                                        </motion.div>
                                                    )}
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black italic shadow-inner transition-all group-hover:scale-110 shrink-0 ${
                                                        Array.isArray(formData.pi_id) && formData.pi_id.includes(pi?.id) ? 'bg-indigo-600/20 text-indigo-400' : 'bg-white/5 text-slate-500'
                                                    }`}>
                                                        {String(pi?.full_name || pi?.name || 'U').charAt(0)}
                                                    </div>
                                                    <div className="w-full overflow-hidden">
                                                        <p className="text-[13px] font-black text-white uppercase tracking-tighter leading-tight truncate px-2 w-full">{pi?.full_name || pi?.name || 'Unknown'}</p>
                                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Authorized PI</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* CRC Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 ml-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                            <label className="text-[14px] font-black text-white/60 uppercase tracking-[0.2em] italic">Research Coordinators (CRC)</label>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
                                            {displayCoordinators.map(crc => (
                                                <div 
                                                    key={crc?.id} 
                                                    onClick={() => toggleMultiSelect('coordinator_id', crc?.id)} 
                                                    className={`relative p-6 rounded-[1.5rem] border transition-all cursor-pointer group flex flex-col items-center text-center gap-3 overflow-hidden ${
                                                        Array.isArray(formData.coordinator_id) && formData.coordinator_id.includes(crc?.id) 
                                                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xl shadow-emerald-500/5' 
                                                        : 'bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.05]'
                                                    }`}
                                                >
                                                    {Array.isArray(formData.coordinator_id) && formData.coordinator_id.includes(crc?.id) && (
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-white border-2 border-[#0B101B] shadow-lg z-10">
                                                            <Check className="w-3 h-3" />
                                                        </motion.div>
                                                    )}
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black italic shadow-inner transition-all group-hover:scale-110 shrink-0 ${
                                                        Array.isArray(formData.coordinator_id) && formData.coordinator_id.includes(crc?.id) ? 'bg-emerald-600/20 text-emerald-400' : 'bg-white/5 text-slate-500'
                                                    }`}>
                                                        {String(crc?.full_name || crc?.name || 'C').charAt(0)}
                                                    </div>
                                                    <div className="w-full overflow-hidden">
                                                        <p className="text-[13px] font-black text-white uppercase tracking-tighter leading-tight truncate px-2 w-full">{crc?.full_name || crc?.name || 'Unknown'}</p>
                                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Operational CRC</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sponsor Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 ml-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                                            <label className="text-[14px] font-black text-white/60 uppercase tracking-[0.2em] italic">Sponsor Personnel</label>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
                                            {displaySponsorUsers.map(sp => (
                                                <div 
                                                    key={sp?.id} 
                                                    onClick={() => toggleMultiSelect('assigned_sponsors' as any, sp?.id)} 
                                                    className={`relative p-6 rounded-[1.5rem] border transition-all cursor-pointer group flex flex-col items-center text-center gap-3 overflow-hidden ${
                                                        Array.isArray(formData.assigned_sponsors) && formData.assigned_sponsors.includes(sp?.id) 
                                                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-xl shadow-cyan-500/5' 
                                                        : 'bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.05]'
                                                    }`}
                                                >
                                                    {Array.isArray(formData.assigned_sponsors) && formData.assigned_sponsors.includes(sp?.id) && (
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-white border-2 border-[#0B101B] shadow-lg z-10">
                                                            <Check className="w-3 h-3" />
                                                        </motion.div>
                                                    )}
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black italic shadow-inner transition-all group-hover:scale-110 shrink-0 ${
                                                        Array.isArray(formData.assigned_sponsors) && formData.assigned_sponsors.includes(sp?.id) ? 'bg-cyan-600/20 text-cyan-400' : 'bg-white/5 text-slate-500'
                                                    }`}>
                                                        {String(sp?.full_name || sp?.name || sp?.email || 'S').charAt(0)}
                                                    </div>
                                                    <div className="w-full overflow-hidden">
                                                        <p className="text-[13px] font-black text-white uppercase tracking-tighter leading-tight truncate px-2 w-full">{sp?.full_name || sp?.name || sp?.email || 'Unknown'}</p>
                                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Protocol Sponsor</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Footer / Action Hub */}
                                    <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div>
                                            <h4 className="text-[13px] font-black text-white uppercase tracking-widest italic">Clinical Team Access Hub</h4>
                                            <p className="text-[11px] text-slate-500 uppercase font-bold mt-2 italic tracking-widest">Assign authorized personnel to this protocol</p>
                                        </div>
                                        <button 
                                            onClick={() => { setInviteMemberRole('PI'); setShowInviteMemberModal(true); }} 
                                            className="px-8 py-4 bg-[#0B101B] border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex items-center gap-3 shadow-2xl active:scale-95"
                                        >
                                            <UserPlus className="w-4 h-4" /> 
                                            Invite Member
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-8">
                            <div className="bg-[#0B101B] border border-white/5 rounded-[2rem] p-8 space-y-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5"><Layers className="w-40 h-40 text-white" /></div>
                                <div className="flex items-center gap-4 border-l-4 border-indigo-500 pl-6">
                                    <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">Instrument Scheduling</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {availableTemplates.map(t => {
                                        const isSelected = formData.study_questionnaires.some((sq: any) => sq.template === t.id);
                                        const config = formData.study_questionnaires.find((sq: any) => sq.template === t.id);

                                        return (
                                            <div key={t.id} className={`p-6 rounded-2xl border transition-all ${isSelected ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-white/5 border-white/5 hover:border-white/20 hover:scale-[1.02]'}`}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-sm font-black text-white uppercase italic truncate max-w-[150px]">{t.name}</h3>
                                                    <button 
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setFormData({...formData, study_questionnaires: formData.study_questionnaires.filter((sq: any) => sq.template !== t.id)});
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
                                                            }
                                                        }}
                                                        className={`p-2 rounded-lg transition-all ${isSelected ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}
                                                    >
                                                        {isSelected ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                    </button>
                                                </div>

                                                {isSelected && (
                                                    <div className="space-y-4 pt-4 border-t border-white/5">
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
                                                                        value={config.frequency_interval || 1}
                                                                        onChange={e => setFormData({...formData, study_questionnaires: formData.study_questionnaires.map((sq: any) => sq.template === t.id ? {...sq, frequency_interval: parseInt(e.target.value) || 1} : sq)})}
                                                                        className="w-16 bg-white/5 border border-white/10 rounded-lg p-2 text-[11px] font-black text-indigo-400 text-center"
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
                                                                        value={config.repetitions}
                                                                        onChange={e => setFormData({...formData, study_questionnaires: formData.study_questionnaires.map((sq: any) => sq.template === t.id ? {...sq, repetitions: parseInt(e.target.value)} : sq)})}
                                                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] font-black text-white"
                                                                    />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Baseline Week</label>
                                                                    <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] font-black text-indigo-300 text-center">
                                                                        Week 0
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
                                                                {t.json_structure?.sections?.map((section: any, si: number) => (
                                                                    <div key={si} className="space-y-4">
                                                                        <div className="flex items-center gap-3 mb-2">
                                                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] font-mono italic">{section.label || section.title}</p>
                                                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                                                        </div>
                                                                        
                                                                        {section.fields?.map((field: any, fi: number) => (
                                                                            <div key={fi} className="group bg-white/[0.03] border border-white/5 rounded-2xl p-5 transition-all hover:bg-white/[0.05] hover:border-indigo-500/30">
                                                                                <div className="flex gap-4 mb-4">
                                                                                    <span className="text-indigo-500 font-black italic text-xs tracking-tighter opacity-70 group-hover:opacity-100">
                                                                                        {fi + 1 < 10 ? `0${fi + 1}` : fi + 1}
                                                                                    </span>
                                                                                    <h5 className="text-[11px] font-bold text-white/90 leading-relaxed uppercase tracking-tight">
                                                                                        {field.label || field.question}
                                                                                    </h5>
                                                                                </div>
                                                                                
                                                                                {field.type === 'multiple_choice' && field.options && (
                                                                                    <div className="grid grid-cols-1 gap-2 pl-8">
                                                                                        {field.options.map((opt: string, oi: number) => (
                                                                                            <div key={oi} className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-black/20 border border-white/5">
                                                                                                <div className="w-2 h-2 rounded-full border border-indigo-500/50" />
                                                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{opt}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                )}

                                                                                {field.type === 'text' && (
                                                                                    <div className="pl-8">
                                                                                        <div className="w-full h-8 bg-black/20 border border-dashed border-white/10 rounded-lg flex items-center px-3">
                                                                                            <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Text Response Area</span>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )) || (
                                                                    <div className="py-8 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                                                                        <AlertCircle className="w-6 h-6 text-slate-700 mx-auto mb-3 opacity-50" />
                                                                        <p className="text-[10px] text-slate-600 font-black uppercase italic tracking-[0.2em] leading-relaxed">
                                                                            Intelligence Protocol Empty<br/>
                                                                            <span className="text-[8px] opacity-50 mt-1 block">Deploy logic via Questionnaire Builder</span>
                                                                        </p>
                                                                    </div>
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
                        <motion.div key="step4" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-8">
                            <div className="bg-[#0B101B] border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center justify-center min-h-[400px] shadow-2xl relative overflow-hidden">
                                <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                                    <Upload className="w-8 h-8 text-indigo-400" />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-2">Sync Operational Artifacts</h3>
                                <p className="text-slate-500 text-sm max-w-md text-center mb-10 italic">Upload IRB Protocols, Consent Templates, and Flyers to the MusB Meta-Database.</p>

                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all flex items-center gap-3">
                                    <Plus className="w-4 h-4" /> Add Documents
                                </button>

                                <div className="mt-12 w-full max-w-2xl space-y-3">
                                    {Array.isArray(uploadedDocs) && uploadedDocs.map(doc => (
                                        <div key={doc.id} className="bg-white/5 border border-white/5 rounded-2xl px-6 py-4 flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-indigo-500/10"><Microscope className="w-5 h-5 text-indigo-400" /></div>
                                                <div>
                                                    <p className="text-[13px] font-black text-white uppercase tracking-tighter">{doc.name}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest italic">{doc.category} • {doc.version}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setUploadedDocs(prev => prev.filter(d => d.id !== doc.id))} className="text-slate-600 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 6 && (
                        <motion.div key="step5" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-8">
                            <div className="bg-[#0B101B] border border-white/5 rounded-[2rem] p-8 space-y-8 shadow-2xl relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic border-l-4 border-indigo-500 pl-6">Final Protocol Validation</h3>
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${validation?.isValid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                        {validation?.isValid ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                        <span className="text-[10px] font-black uppercase tracking-widest">{validation?.isValid ? "Ready for Deployment" : "Data Discretions Found"}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6">
                                        <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 italic"><Layers className="w-4 h-4" /> Identity Synopsis</h4>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div><p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Study ID</p><p className="text-sm font-bold text-white mt-1 italic font-mono">{formData.protocol_id}</p></div>
                                            <div><p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Target Sample</p><p className="text-lg font-black text-white mt-1 italic">{formData.target_subjects}</p></div>
                                            <div><p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sponsor</p><p className="text-[12px] font-black text-indigo-300 mt-1 uppercase italic truncate">{formData.sponsor_name || "MISSING"}</p></div>
                                            <div><p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Indication</p><p className="text-[12px] font-black text-emerald-400 mt-1 uppercase italic truncate">{formData.indication || "MISSING"}</p></div>
                                        </div>
                                    </div>
                                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-6 space-y-4">
                                        <h4 className="text-[11px] font-black text-white uppercase tracking-widest italic flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Deployment Timeline</h4>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 p-4 bg-black/20 rounded-xl border border-white/5 text-center">
                                                <p className="text-[9px] font-black text-slate-600 uppercase">Commence</p>
                                                <p className="text-sm font-black text-white mt-1 italic">{formData.startDate || "TBD"}</p>
                                            </div>
                                            <div className="flex-1 p-4 bg-black/20 rounded-xl border border-white/5 text-center">
                                                <p className="text-[9px] font-black text-slate-600 uppercase">Terminate</p>
                                                <p className="text-sm font-black text-white mt-1 italic">{formData.endDate || "TBD"}</p>
                                            </div>
                                        </div>
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
                    <button onClick={onClose} className="px-6 py-4 text-slate-500 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest italic group h-12 flex items-center">
                        Discard <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">Study</span>
                    </button>

                    {currentStep < 5 ? (
                        <button onClick={handleNext} className="px-8 md:px-12 py-4 h-12 bg-indigo-600 text-white rounded-2xl flex items-center gap-3 shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all group">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Next Step</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!validation?.isValid || isSubmitting}
                            className={`px-10 md:px-14 py-4 h-12 rounded-2xl flex items-center gap-3 transition-all ${validation?.isValid && !isSubmitting ? 'bg-indigo-600 text-white shadow-xl hover:scale-[1.05] active:scale-95' : 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed border border-white/5'}`}
                        >
                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">{isSubmitting ? 'Syncing Protocol' : 'Sync & Deploy Protocol'}</span>
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
                                        {showInviteSponsorModal ? 'Invite Sponsor' : `Invite ${inviteMemberRole}`}
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
        </div>
    );
};

const LaunchStudyForm = React.memo(LaunchStudyFormRoot);
export default LaunchStudyForm;
