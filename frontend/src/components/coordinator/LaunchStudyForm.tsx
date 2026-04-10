import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Rocket, Beaker, Activity, Users, FileText, CheckCircle2,
    X, ChevronDown, Upload, ChevronRight, ChevronLeft,
    AlertCircle, History, CheckSquare, TrendingUp,
    ShieldCheck, Microscope, UserPlus, FileCheck, Layers,
    Briefcase, Plus, Calendar, Award, DollarSign,
    Building2, Search, Building, Check
} from 'lucide-react';
import { authFetch, API } from '../../utils/auth';

interface LaunchStudyFormProps {
    onClose?: () => void;
    onSave?: (data: any) => void;
    initialData?: any;
    availablePIs?: any[];
    availableCoordinators?: any[];
    availableSponsors?: any[];
    availableSponsorUsers?: any[];
}

type StepID = 1 | 2 | 3 | 4 | 5;

interface DocumentFile {
    id: string;
    name: string;
    category: 'Protocol' | 'IRB_Letter' | 'Flyer' | 'Other';
    version: string;
    status: 'Current' | 'Draft';
}

const LaunchStudyFormRoot = ({ onClose, onSave, initialData, availablePIs = [], availableCoordinators = [], availableSponsors = [], availableSponsorUsers = [] }: LaunchStudyFormProps) => {
    const [currentStep, setCurrentStep] = useState<StepID>(1);
    const [lastSaved, setLastSaved] = useState<string>('Just now');

    // Real Data Holders
    const displayPIs = useMemo(() => availablePIs || [], [availablePIs]);
    const displayCoordinators = useMemo(() => availableCoordinators || [], [availableCoordinators]);
    const displaySponsors = useMemo(() => availableSponsors || [], [availableSponsors]);
    const [invitedSponsors, setInvitedSponsors] = useState<any[]>([]);
    const [showInviteSponsorModal, setShowInviteSponsorModal] = useState(false);
    const [showInviteMemberModal, setShowInviteMemberModal] = useState(false);
    const [inviteMemberRole, setInviteMemberRole] = useState<'PI' | 'COORDINATOR' | 'STUDY_STAFF'>('PI');
    const [inviteData, setInviteData] = useState({ name: '', email: '', organization: '' });
    const [inviteLoading, setInviteLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isInviting, setIsInviting] = useState(false);

    // Derived display for sponsor users (existing + recently invited)
    const displaySponsorUsers = useMemo(() => {
        return [...(availableSponsorUsers || []), ...invitedSponsors];
    }, [availableSponsorUsers, invitedSponsors]);

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
        pi_id: (initialData?.pi_id || []),
        coordinator_id: (initialData?.coordinator_id || []),
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
        kit_description: initialData?.kit_description || ''
    });

    const [uploadedDocs, setUploadedDocs] = useState<DocumentFile[]>(() => [
        { id: '1', name: 'IRB_Protocol_V3.pdf', category: 'Protocol', version: 'V3.1', status: 'Current' },
        { id: '2', name: 'Consent_Form_Template.docx', category: 'Other', version: 'V1.0', status: 'Draft' }
    ]);
    const [sponsorSearch, setSponsorSearch] = useState('');
    const [showSponsorDropdown, setShowSponsorDropdown] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sponsorDropdownRef = useRef<HTMLDivElement>(null);

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
                // Add to temporary state so they appear in dropdowns immediately
                if (inviteMemberRole === 'PI') {
                    setFormData(prev => ({ ...prev, pi_id: [data.id] }));
                } else {
                    setFormData(prev => ({
                        ...prev,
                        coordinator_id: [...(prev.coordinator_id || []), data.id]
                    }));
                }
                setShowInviteMemberModal(false);
                setInviteData({ name: '', email: '', organization: '' });
                alert(`${inviteMemberRole} Invited Successfully!`);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setInviteLoading(false);
        }
    };

    const handleInviteSponsor = async (e: React.FormEvent) => {
        if (!inviteData.email || !inviteData.email.includes('@')) return alert("Valid email required.");
        setIsInviting(true);
        try {
            const apiUrl = API || '';
            const res = await authFetch(`${apiUrl}/api/auth/admin/create-user/`, {
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

                // Automatically assign this new person
                const currentAssigned = Array.isArray(formData.assigned_sponsors) ? formData.assigned_sponsors : [];
                setFormData({
                    ...formData,
                    assigned_sponsors: [...currentAssigned, newUser.id]
                });

                setInviteData({ name: '', email: '', organization: '' });
                setShowInviteSponsorModal(false);
                alert(`Invitation sent to ${inviteData.email}. Account provisioned.`);
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || 'Could not invite sponsor.'}`);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to invite sponsor.");
        } finally {
            setIsInviting(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validation: Max 10MB
            if (file.size > 10 * 1024 * 1024) {
                alert("FILE REJECTED: Security threshold exceeded. Protocol documents must not exceed 10MB.");
                return;
            }

            // Validation: Allowed types (PDF, Word)
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
                alert("FILE REJECTED: Format incompatibility. Only PDF and Microsoft Word (.doc, .docx) protocol artifacts are permitted.");
                return;
            }

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

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sponsorDropdownRef.current && !sponsorDropdownRef.current.contains(event.target as Node)) {
                setShowSponsorDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const steps = useMemo(() => [
        { id: 1, label: 'Core Protocol', sub: 'Identity & Purpose', icon: Beaker },
        { id: 2, label: 'Methodology', sub: 'Clinical Design', icon: Activity },
        { id: 3, label: 'Research Team', sub: 'Roles & Operations', icon: Users },
        { id: 4, label: 'Documents', sub: 'Compliance Uploads', icon: FileText },
        { id: 5, label: 'Review', sub: 'Final Validation', icon: CheckCircle2 },
    ], []);

    const handleNext = useCallback(() => setCurrentStep((s) => (s < 5 ? (s + 1) as StepID : s)), []);
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

        // Step 3 Validation: Ensure at least some compensation is defined for the chosen logic
        const globalStipendEntered = formData.compensation && formData.compensation.toString().trim() !== '' && Number(formData.compensation) > 0;
        
        const configValue = formData.reward_logic === 'PER_TASK' ? (formData.reward_config?.tasks?.default || 0) :
                           formData.reward_logic === 'PER_VISIT' ? (formData.reward_config?.visits?.default || 0) :
                           formData.reward_logic === 'FULL_STUDY' ? (formData.reward_config?.full_study || 0) : 0;
                           
        const hasCompensation = globalStipendEntered || configValue > 0;

        if (!hasCompensation) missingFields.push('reward_amount');

        const hasPI = Array.isArray(formData.pi_id) && formData.pi_id.length > 0;
        const hasCC = Array.isArray(formData.coordinator_id) && formData.coordinator_id.length > 0;
        const hasProtocol = Array.isArray(uploadedDocs) && uploadedDocs.some(d => d.category === 'Protocol');

        return {
            isValid: missingFields.length === 0 && hasPI && hasCC,
            missingFields,
            hasPI,
            hasCC,
            hasProtocol
        };
    }, [formData, uploadedDocs]);

    const mixedSponsors = useMemo(() => {
        const orgs = displaySponsors.map(o => ({ ...o, type: 'ORGANIZATION', displayName: o.name || o.full_name || 'Unnamed Org' }));
        const individuals = displaySponsorUsers.map(u => ({ ...u, type: 'PERSONNEL', displayName: u.full_name || u.name || u.email || 'Unnamed Person' }));
        return [...orgs, ...individuals];
    }, [displaySponsors, displaySponsorUsers]);

    const filteredSponsors = useMemo(() => {
        if (!sponsorSearch) return mixedSponsors;
        const query = sponsorSearch.toLowerCase();
        return mixedSponsors.filter(s => s.displayName.toLowerCase().includes(query));
    }, [mixedSponsors, sponsorSearch]);

    return (
        <div className="flex flex-col min-h-full pb-32">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-6">
                    <div className="p-3 bg-indigo-500/10 rounded-3xl border border-indigo-500/20">
                        <Rocket className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black text-white italic uppercase tracking-tighter leading-tight italic">Launch <span className="text-indigo-400">New Study</span></h1>
                        <p className="text-[12px] text-white/40 font-bold uppercase tracking-[0.3em] mt-2">Study Setup Hub</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[12px] font-black text-indigo-400 uppercase tracking-widest leading-none">Status: Drafting</p>
                        <p className="text-[12px] text-white/40 font-bold mt-1 uppercase">Last saved: {lastSaved}</p>
                    </div>
                </div>
            </div>

            {/* Stepper Progress Node */}
            <div className="sticky top-0 z-40 bg-[#0B1120]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] py-6 px-10 mb-12 shadow-xl will-change-transform">
                <div className="flex items-center justify-between">
                    {steps.map((step, idx) => (
                        <React.Fragment key={step.id}>
                            <button
                                onClick={() => step.id < currentStep && setCurrentStep(step.id as StepID)}
                                className={`flex items-center gap-4 transition-all ${currentStep === step.id ? 'opacity-100 scale-105' : currentStep > step.id ? 'opacity-80 grayscale-0' : 'opacity-30'}`}
                            >
                                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center border transition-all ${currentStep === step.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                                    <step.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                                </div>
                                <div className="text-left hidden xl:block">
                                    <p className="text-sm font-black text-white uppercase tracking-widest leading-none">{step.label}</p>
                                    <p className={`text-[12px] uppercase tracking-tighter mt-1.5 ${currentStep === step.id ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>{step.sub}</p>
                                </div>
                            </button>
                            {idx < steps.length - 1 && <div className="h-px flex-1 bg-white/5 mx-4" />}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Step Content Hub */}
            <div className="flex-1">
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12 will-change-transform">
                            <div className="bg-[#0B101B]/80 backdrop-blur-xl border border-white/5 rounded-[3.5rem] p-12 space-y-12 shadow-xl relative">
                                <div className="absolute top-0 right-0 p-12 opacity-5"><Beaker className="w-48 h-48 text-white" /></div>
                                <div className="flex items-center gap-4 border-l-4 border-indigo-500 pl-8">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Study Identity</h2>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div className="space-y-4">
                                        <label className="text-[15px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Internal ID / Study Number</label>
                                        <div className="bg-white/5 border border-white/10 rounded-3xl px-6 py-5 text-xl text-indigo-400 font-mono flex items-center justify-between">
                                            <span>{formData.protocol_id}</span>
                                            <span className="text-[12px] px-3 py-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 font-black uppercase text-indigo-300">Auto-Generated</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4 relative" ref={sponsorDropdownRef}>
                                        <label className="text-[15px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Sponsor Organization</label>
                                        <div onClick={() => setShowSponsorDropdown(!showSponsorDropdown)} className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-5 text-lg text-white font-bold flex items-center justify-between cursor-pointer hover:border-white/20 transition-all font-mono italic">
                                            <span>{formData.sponsor_name || "Select Sponsor"}</span>
                                            <ChevronDown className="w-5 h-5 opacity-40 shrink-0" />
                                        </div>
                                        {showSponsorDropdown && (
                                            <div
                                                onMouseLeave={() => setShowSponsorDropdown(false)}
                                                className="absolute top-full left-0 right-0 mt-4 bg-[#0a0b1a] border border-white/10 rounded-[2rem] shadow-[0_40px_120px_rgba(0,0,0,0.9)] z-[70] overflow-hidden backdrop-blur-3xl animate-in fade-in slide-in-from-top-4 duration-300"
                                            >
                                                <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                                                    <div className="relative group">
                                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search Sponsor Database..."
                                                            value={sponsorSearch}
                                                            onChange={(e) => setSponsorSearch(e.target.value)}
                                                            className="w-full bg-[#05060f] border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-sm text-white outline-none focus:border-indigo-500/50 font-medium tracking-tight placeholder:text-slate-700 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar scroll-smooth">
                                                    {/* Primary Group: Organizations */}
                                                    {filteredSponsors.filter(s => s.type === 'ORGANIZATION').length > 0 && (
                                                        <div className="px-8 py-3 bg-white/[0.03] text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Active Organizations</div>
                                                    )}
                                                    {filteredSponsors.filter(s => s.type === 'ORGANIZATION').map(s => (
                                                        <div key={s?.id} onClick={() => {
                                                            setFormData({ ...formData, sponsor_id: '', sponsor_org_id: s?.id, sponsor_name: s?.displayName });
                                                            setShowSponsorDropdown(false);
                                                        }} className="px-8 py-4 hover:bg-indigo-600/30 cursor-pointer text-sm font-bold text-slate-300 hover:text-white flex items-center gap-4 transition-all group border-b border-white/[0.01]">
                                                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                                                <Building2 className="w-4 h-4" />
                                                            </div>
                                                            <span className="tracking-tight">{s?.displayName}</span>
                                                        </div>
                                                    ))}

                                                    {/* Secondary Group: Individual Sponsors/Personnel */}
                                                    {(filteredSponsors.filter(s => s.type === 'PERSONNEL').length > 0 || (sponsorSearch && filteredSponsors.length === 0)) && (
                                                        <div className="px-8 py-3 bg-white/[0.03] text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic border-t border-white/5">Clinical Personnel</div>
                                                    )}

                                                    {filteredSponsors.filter(s => s.type === 'PERSONNEL').length > 0 ? (
                                                        filteredSponsors.filter(s => s.type === 'PERSONNEL').map(s => (
                                                            <div key={s?.id} onClick={() => {
                                                                setFormData({ ...formData, sponsor_id: s?.id, sponsor_org_id: '', sponsor_name: s?.displayName });
                                                                setShowSponsorDropdown(false);
                                                            }} className="px-8 py-4 hover:bg-emerald-600/30 cursor-pointer text-sm font-bold text-slate-300 hover:text-white flex items-center gap-4 transition-all group border-b border-white/[0.01]">
                                                                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                                                    <Briefcase className="w-4 h-4" />
                                                                </div>
                                                                <span className="tracking-tight">{s?.displayName}</span>
                                                                <span className="ml-auto text-[9px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg uppercase tracking-[0.1em] font-black italic">Lead</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        sponsorSearch && filteredSponsors.length === 0 && (
                                                            <div className="px-10 py-10 text-center bg-white/[0.01]">
                                                                <p className="text-[11px] text-slate-600 font-black uppercase tracking-widest italic opacity-50">No match found for "{sponsorSearch}"</p>
                                                            </div>
                                                        )
                                                    )}
                                                </div>

                                                <div className="flex border-t border-white/10 divide-x divide-white/10 bg-[#05060f]/80 backdrop-blur-md">
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            if (!sponsorSearch) {
                                                                alert("Please type the sponsor organization name in the search box first.");
                                                                return;
                                                            }
                                                            if (window.confirm(`Add "${sponsorSearch}" as a new Sponsor Organization?`)) {
                                                                try {
                                                                    const apiUrl = API || '';
                                                                    const res = await authFetch(`${apiUrl}/api/sponsor-organizations/`, {
                                                                        method: 'POST',
                                                                        body: JSON.stringify({ name: sponsorSearch })
                                                                    });
                                                                    if (res.ok) {
                                                                        const newOrg = await res.json();
                                                                        setFormData({ ...formData, sponsor_id: '', sponsor_org_id: newOrg.id, sponsor_name: newOrg.name });
                                                                        setShowSponsorDropdown(false);
                                                                        setSponsorSearch('');
                                                                    } else {
                                                                        const err = await res.json();
                                                                        alert(`Organization Creation Failed: ${err.name ? 'This organization name already exists.' : 'Invalid data format'}`);
                                                                    }
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    alert("A network error occurred while creating the organization.");
                                                                }
                                                            }
                                                        }}
                                                        className="flex-1 px-4 py-5 bg-indigo-600/5 hover:bg-indigo-600/20 cursor-pointer text-[10px] font-black uppercase text-indigo-400 text-center tracking-[0.2em] transition-all hover:text-white"
                                                    >
                                                        + Register "{sponsorSearch || 'Org'}"
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowSponsorDropdown(false);
                                                            setShowInviteSponsorModal(true);
                                                        }}
                                                        className="flex-1 px-4 py-5 bg-emerald-600/5 hover:bg-emerald-600/20 cursor-pointer text-[10px] font-black uppercase text-emerald-400 text-center tracking-[0.2em] transition-all hover:text-white"
                                                    >
                                                        + Invite Sponsor
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div className="space-y-4">
                                        <label className="text-[15px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Start Date</label>
                                        <div className="relative group">
                                            <input
                                                type="date"
                                                name="startDate"
                                                value={formData.startDate}
                                                onChange={handleChange}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-lg text-white font-mono outline-none focus:border-indigo-500/50 transition-all custom-calendar-input"
                                                style={{ colorScheme: 'dark', zoom: 1.3 }}
                                            />
                                            <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 text-indigo-400 pointer-events-none opacity-50 group-focus-within:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[15px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">End Date (Estimated)</label>
                                        <div className="relative group">
                                            <input
                                                type="date"
                                                name="endDate"
                                                value={formData.endDate}
                                                onChange={handleChange}
                                                className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-5 text-lg text-white font-mono outline-none focus:border-indigo-500/50 transition-all custom-calendar-input"
                                                style={{ colorScheme: 'dark', zoom: 1.3 }}
                                            />
                                            <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 text-indigo-400 pointer-events-none opacity-50 group-focus-within:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#0B101B]/80 backdrop-blur-xl border border-white/5 rounded-[3.5rem] p-12 space-y-12 shadow-xl">
                                <div className="flex items-center gap-4 border-l-4 border-emerald-500 pl-8">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Study Information</h2>
                                </div>
                                <div className="space-y-10">
                                    <div className="space-y-4">
                                        <label className="text-[15px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Official Full Title</label>
                                        <textarea name="full_title" value={formData.full_title} onChange={handleChange} placeholder="As stated on the clinical trial registry..." className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-xl text-white font-bold outline-none focus:border-emerald-500/50 resize-none placeholder:opacity-20 italic leading-relaxed" />
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                        <div className="space-y-4">
                                            <label className="text-[15px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Public Short Title</label>
                                            <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-lg text-white font-bold outline-none focus:border-emerald-500/50" />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[15px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Therapeutic Indication</label>
                                            <input type="text" name="indication" value={formData.indication} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-lg text-white font-bold outline-none focus:border-emerald-500/50 italic" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[15px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Brief Summary Overview</label>
                                        <textarea name="brief_description" value={formData.brief_description} onChange={handleChange} className="w-full h-32 bg-white/5 border border-white/10 rounded-3xl px-8 py-6 text-base text-white/80 font-medium outline-none focus:border-emerald-500/50 resize-none leading-relaxed" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12 will-change-transform">
                            <div className="bg-[#0B101B]/80 backdrop-blur-xl border border-white/5 rounded-[3.5rem] p-12 space-y-12 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-5"><Activity className="w-48 h-48 text-white" /></div>
                                <div className="flex items-center gap-4 border-l-4 border-indigo-500 pl-8">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Study Design</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                    {[
                                        {
                                            field: 'trial_model', label: 'Primary Model', options: [
                                                { val: 'RCT', label: 'RCT' },
                                                { val: 'OBSERVATIONAL', label: 'Observational' },
                                                { val: 'DEVICE_TRIAL', label: 'Device Trial' }
                                            ]
                                        },
                                        {
                                            field: 'phase', label: 'Clinical Phase', options: [
                                                { val: 'PHASE_0', label: 'Phase 0' },
                                                { val: 'PHASE_1', label: 'Phase 1' },
                                                { val: 'PHASE_1_2', label: 'Phase 1/2' },
                                                { val: 'PHASE_2', label: 'Phase 2' },
                                                { val: 'PHASE_2_3', label: 'Phase 2/3' },
                                                { val: 'PHASE_3', label: 'Phase 3' },
                                                { val: 'PHASE_4', label: 'Phase 4' },
                                                { val: 'PILOT', label: 'Pilot' },
                                                { val: 'N/A', label: 'N/A' },
                                                { val: 'BIOEQUIVALENCE', label: 'Bioequivalence' }
                                            ]
                                        },
                                        {
                                            field: 'masking', label: 'Masking Strategy', options: [
                                                { val: 'NONE', label: 'None' },
                                                { val: 'SINGLE_BLIND', label: 'Single Blind' },
                                                { val: 'DOUBLE_BLIND', label: 'Double Blind' },
                                                { val: 'TRIPLE_BLIND', label: 'Triple Blind' },
                                                { val: 'FOURTH_BLIND', label: 'Fourth Blind' }
                                            ]
                                        },
                                        {
                                            field: 'execution_type', label: 'Execution', options: [
                                                { val: 'IN_PERSON', label: 'In-person' },
                                                { val: 'REMOTE', label: 'Remote' },
                                                { val: 'HYBRID', label: 'Hybrid' }
                                            ]
                                        }
                                    ].map((group) => (
                                        <div key={group.field} className="space-y-4 relative group">
                                            <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-2">{group.label}</label>
                                            <select
                                                value={formData[group.field as keyof typeof formData] as string}
                                                onChange={(e) => setFormData({ ...formData, [group.field]: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[12px] font-black uppercase tracking-widest text-indigo-400 outline-none hover:border-indigo-500/30 transition-all appearance-none cursor-pointer italic"
                                            >
                                                {group.options.map(opt => (
                                                    <option key={opt.val} value={opt.val} className="bg-[#0B1120] text-slate-300 font-bold">{opt.label}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-6 bottom-4 pointer-events-none opacity-40">
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    ))}

                                    <div className="space-y-4 relative group">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-2">Reward Type</label>
                                        <select
                                            value={formData.reward_type}
                                            onChange={(e) => setFormData({ ...formData, reward_type: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[12px] font-black uppercase tracking-widest text-emerald-400 outline-none hover:border-emerald-500/30 transition-all appearance-none cursor-pointer italic"
                                        >
                                            {[
                                                { label: 'TARGET GIFT CARD', val: 'TARGET_CARD' },
                                                { label: 'DIGITAL COUPONS', val: 'COUPONS' },
                                                { label: 'CVS CARD', val: 'CVS_CARD' },
                                                { label: 'Master Card', val: 'MASTER_CARD' },
                                                { label: 'PUBLIX CARDS', val: 'PUBLIX_CARDS' },
                                                { label: 'Walmart Cards', val: 'WALMART_CARDS' },
                                                { label: 'VISA CARD', val: 'VISA_CARD' },
                                                { label: 'MIXED REWARDS', val: 'MIXED' }
                                            ].map(opt => (
                                                <option key={opt.val} value={opt.val} className="bg-[#0B1120] text-slate-300 font-bold">{opt.label}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-6 bottom-4 pointer-events-none opacity-40">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>

                                    <div className="space-y-4 relative group">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-2">Incentive Logic</label>
                                        <select
                                            value={formData.reward_logic}
                                            onChange={(e) => setFormData({ ...formData, reward_logic: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[12px] font-black uppercase tracking-widest text-[#14b8a6] outline-none hover:border-[#14b8a6]/30 transition-all appearance-none cursor-pointer italic"
                                        >
                                            {[
                                                { label: 'PER ACTIVITY', val: 'PER_TASK' },
                                                { label: 'PER CLINICAL VISIT', val: 'PER_VISIT' },
                                                { label: 'MILESTONE COMPLETION', val: 'FULL_STUDY' }
                                            ].map(opt => (
                                                <option key={opt.val} value={opt.val} className="bg-[#0B1120] text-slate-300 font-bold">{opt.label}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-6 bottom-4 pointer-events-none opacity-40">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <label className="text-[15px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">Participant Goal</label>
                                        <div className="bg-white/5 border border-white/5 rounded-3xl p-8 flex items-center justify-between">
                                            <div>
                                                <p className="text-[12px] font-black text-indigo-400 uppercase tracking-widest">Target Sample Size</p>
                                                <p className="text-4xl font-black text-white italic mt-1">{formData.target_subjects}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setFormData({ ...formData, target_subjects: Math.max(0, formData.target_subjects - 10) })} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all font-black text-xl">-</button>
                                                <button onClick={() => setFormData({ ...formData, target_subjects: formData.target_subjects + 10 })} className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center hover:bg-indigo-500 transition-all font-black text-xl">+</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <label className="text-[15px] font-black text-slate-500 uppercase tracking-widest ml-2">Consent Mechanics</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {['ECONSENT', 'PAPER_CONSENT', 'REMOTE_WITNESS'].map(opt => (
                                                <button key={opt} onClick={() => toggleMultiSelect('consent_collection', opt)} className={`flex items-center gap-3 px-6 py-5 rounded-3xl border transition-all ${Array.isArray(formData.consent_collection) && formData.consent_collection.includes(opt) ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${Array.isArray(formData.consent_collection) && formData.consent_collection.includes(opt) ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'}`}>
                                                        {Array.isArray(formData.consent_collection) && formData.consent_collection.includes(opt) && <CheckSquare className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span className="text-[12px] font-black uppercase tracking-widest leading-none">{opt.replace('_', ' ')}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-white/5 space-y-8">
                                    <div className="flex items-center justify-between ml-2">
                                        <label className="text-[15px] font-black text-slate-500 uppercase tracking-widest italic">Clinical Logistics (Study Kits)</label>
                                        <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-white/10">
                                            <button
                                                onClick={() => setFormData({ ...formData, uses_kit: !formData.uses_kit })}
                                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${formData.uses_kit ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500'}`}
                                            >
                                                Kit Required
                                            </button>
                                            <button
                                                onClick={() => setFormData({ ...formData, uses_kit: !formData.uses_kit })}
                                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!formData.uses_kit ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
                                            >
                                                No Kit
                                            </button>
                                        </div>
                                    </div>

                                    {formData.uses_kit && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                                                    <p className="text-[12px] font-black text-cyan-400 uppercase tracking-widest mb-3">Dispatch Workflow</p>
                                                    <div className="flex items-center gap-4">
                                                        <label className="flex items-center gap-3 cursor-pointer group">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.kit_dispatch_required}
                                                                onChange={(e) => setFormData({ ...formData, kit_dispatch_required: e.target.checked })}
                                                                className="hidden"
                                                            />
                                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.kit_dispatch_required ? 'bg-cyan-600 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'border-white/20'}`}>
                                                                {formData.kit_dispatch_required && <CheckSquare className="w-4 h-4 text-white" />}
                                                            </div>
                                                            <span className="text-[12px] font-black text-white uppercase tracking-widest group-hover:text-cyan-300 transition-colors">Enable Local Dispatch System</span>
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                                                    <p className="text-[12px] font-black text-cyan-400 uppercase tracking-widest mb-3">Sync Strategy</p>
                                                    <div className="flex items-center gap-4">
                                                        <label className="flex items-center gap-3 cursor-pointer group">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.kit_tracking_enabled}
                                                                onChange={(e) => setFormData({ ...formData, kit_tracking_enabled: e.target.checked })}
                                                                className="hidden"
                                                            />
                                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.kit_tracking_enabled ? 'bg-indigo-600 border-indigo-500' : 'border-white/20'}`}>
                                                                {formData.kit_tracking_enabled && <CheckSquare className="w-4 h-4 text-white" />}
                                                            </div>
                                                            <span className="text-[12px] font-black text-white uppercase tracking-widest group-hover:text-indigo-300 transition-colors">Real-time Courier Tracking</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-2">Kit Contents & Protocol Description</label>
                                                <textarea
                                                    name="kit_description"
                                                    value={formData.kit_description}
                                                    onChange={handleChange}
                                                    placeholder="Specify swabs, tubes, sensors, or other medical supplies included..."
                                                    className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[12px] text-white font-medium outline-none focus:border-cyan-500/50 resize-none placeholder:opacity-20 italic"
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                                            <p className="text-[12px] font-black text-indigo-400 uppercase tracking-widest mb-3">Stipend Amount</p>
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl font-black text-slate-500">{CURRENCY_SYMBOLS[formData.compensation_currency] || '$'}</span>
                                                <input
                                                    type="text"
                                                    name="compensation"
                                                    value={formData.compensation}
                                                    onChange={handleChange}
                                                    placeholder="0.00"
                                                    className="bg-transparent border-none text-3xl font-black text-white italic focus:ring-0 w-full placeholder:text-white/10"
                                                />
                                            </div>
                                        </div>
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                                            <p className="text-[12px] font-black text-indigo-400 uppercase tracking-widest mb-3">Currency</p>
                                            <select
                                                name="compensation_currency"
                                                value={formData.compensation_currency}
                                                onChange={handleChange}
                                                className="bg-transparent border-none text-xl font-black text-white italic focus:ring-0 w-full appearance-none pr-8 cursor-pointer"
                                            >
                                                {Object.keys(CURRENCY_SYMBOLS).map(code => (
                                                    <option key={code} value={code} className="bg-[#0B101B]">
                                                        {code} - {code === 'USD' ? 'US Dollar' : code === 'EUR' ? 'Euro' : code === 'GBP' ? 'British Pound' : code === 'INR' ? 'Indian Rupee' : code === 'JPY' ? 'Japanese Yen' : code}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12 will-change-transform">
                            <div className="bg-[#0B101B]/80 backdrop-blur-xl border border-white/5 rounded-[3.5rem] p-12 space-y-12 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-5"><Users className="w-48 h-48 text-white" /></div>
                                <div className="flex items-center gap-4 border-l-4 border-indigo-500 pl-8">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Research Team Deployment</h3>
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-6">
                                        <label className="text-[15px] font-black text-slate-500 uppercase tracking-widest ml-2">Principal Investigators (PI)</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {displayPIs.map(pi => (
                                                <div key={pi?.id} onClick={() => toggleMultiSelect('pi_id', pi?.id)} className={`relative p-6 rounded-[2.5rem] border transition-all cursor-pointer group ${Array.isArray(formData.pi_id) && formData.pi_id.includes(pi?.id) ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                                                    {Array.isArray(formData.pi_id) && formData.pi_id.includes(pi?.id) && <div className="absolute top-4 right-4 text-indigo-400 group-hover:scale-110 transition-transform duration-300"><ShieldCheck className="w-6 h-6 shadow-[0_0_15px_rgba(129,140,248,0.4)]" /></div>}
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black text-white italic group-hover:bg-white/10 transition-all">{String(pi?.full_name || pi?.name || 'U').charAt(0)}</div>
                                                        <div>
                                                            <p className="text-sm font-black text-white uppercase tracking-tighter">{pi?.full_name || pi?.name || 'Unknown User'}</p>
                                                            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Verified Specialist</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <label className="text-[15px] font-black text-slate-500 uppercase tracking-widest ml-2">Clinical Research Coordinators (CRC)</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {displayCoordinators.map(crc => (
                                                <div key={crc?.id} onClick={() => toggleMultiSelect('coordinator_id', crc?.id)} className={`relative p-6 rounded-[2.5rem] border transition-all cursor-pointer group ${Array.isArray(formData.coordinator_id) && formData.coordinator_id.includes(crc?.id) ? 'bg-emerald-600/10 border-emerald-500/50' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                                                    {Array.isArray(formData.coordinator_id) && formData.coordinator_id.includes(crc?.id) && <div className="absolute top-4 right-4 text-emerald-400 group-hover:scale-110 transition-transform duration-300"><UserPlus className="w-6 h-6 shadow-[0_0_15px_rgba(52,211,153,0.4)]" /></div>}
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black text-white italic group-hover:bg-white/10 transition-all">{String(crc?.full_name || crc?.name || 'C').charAt(0)}</div>
                                                        <div>
                                                            <p className="text-sm font-black text-white uppercase tracking-tighter">{crc?.full_name || crc?.name || 'Unknown User'}</p>
                                                            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Operations Lead</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-12 max-w-5xl mx-auto">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Clinical Team Access</h3>
                                                <p className="text-[12px] text-slate-500 font-bold uppercase tracking-widest italic">Assign authorized personnel to this protocol</p>
                                            </div>
                                            <button
                                                onClick={() => { setInviteMemberRole('PI'); setShowInviteMemberModal(true); }}
                                                className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-500/10 transition-all flex items-center gap-3"
                                            >
                                                <UserPlus className="w-4 h-4" /> Invite Member
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                                                        <ShieldCheck className="w-4 h-4 text-indigo-500" /> Principal Investigator
                                                    </label>
                                                    <span className="text-[10px] font-black text-indigo-500/50 uppercase tracking-tighter">Required</span>
                                                </div>
                                                <div className="relative group">
                                                    <select
                                                        value={formData.pi_id?.[0] || ''}
                                                        onChange={(e) => setFormData({ ...formData, pi_id: e.target.value ? [e.target.value] : [] })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-[12px] font-black uppercase tracking-widest text-indigo-400 outline-none hover:border-indigo-500/30 transition-all appearance-none cursor-pointer italic"
                                                    >
                                                        <option value="" className="bg-[#0B1120]">Select PI...</option>
                                                        {availablePIs.map(pi => (
                                                            <option key={pi.id} value={pi.id} className="bg-[#0B1120] text-slate-300 font-bold">{pi.full_name || pi.name || pi.email}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                                        <ChevronDown className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-emerald-500" /> Research Staff
                                                </label>
                                                <div className="relative group">
                                                    <div className="min-h-[60px] w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex flex-wrap gap-2 items-center">
                                                        {formData.coordinator_id?.map(cid => {
                                                            const c = availableCoordinators.find(x => x.id === cid);
                                                            return (
                                                                <div key={cid} className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5 flex items-center gap-2">
                                                                    <span className="text-[11px] font-black text-emerald-400 uppercase italic">{c?.full_name || c?.name || 'Staff'}</span>
                                                                    <button onClick={() => setFormData({ ...formData, coordinator_id: formData.coordinator_id?.filter(x => x !== cid) })} className="text-emerald-500 hover:text-white transition-colors">
                                                                        <X className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                        <select
                                                            onChange={(e) => {
                                                                if (e.target.value && !formData.coordinator_id?.includes(e.target.value)) {
                                                                    setFormData({ ...formData, coordinator_id: [...(formData.coordinator_id || []), e.target.value] });
                                                                }
                                                                e.target.value = '';
                                                            }}
                                                            className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer italic flex-1 min-w-[120px]"
                                                        >
                                                            <option value="" className="bg-[#0B1120]">Add Staff...</option>
                                                            {availableCoordinators.filter(c => !formData.coordinator_id?.includes(c.id)).map(c => (
                                                                <option key={c.id} value={c.id} className="bg-[#0B1120] text-slate-400 font-bold">{c.full_name || c.name || c.email}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-8 flex items-start gap-6">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                                                <AlertCircle className="w-6 h-6 text-indigo-400" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-[12px] font-black text-white uppercase tracking-widest">Protocol Access Governance</h4>
                                                <p className="text-[12px] text-slate-400 leading-relaxed font-bold italic">
                                                    By assigning personnel, you grant them access to PII, study endpoints, and clinical records.
                                                    Ensure all team members have valid GXP certification on file.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12 will-change-transform">
                            <div className="bg-[#0B101B]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-12 shadow-xl relative overflow-hidden flex flex-col items-center justify-center py-20 min-h-[500px]">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

                                <div className="w-24 h-24 bg-indigo-600/10 border border-indigo-500/30 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(79,70,229,0.1)]">
                                    <Upload className="w-10 h-10 text-indigo-400" />
                                </div>

                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic mb-4 leading-none">Upload Study Documents</h3>
                                <p className="text-slate-400 text-lg font-medium max-w-xl mb-12 italic text-center leading-relaxed">Select files for IRB Protocol, Informed Consent Templates, and Patient Recruitment Flyers to begin clinical synchronization.</p>

                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-indigo-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative px-12 py-5 bg-[#0B101B] border border-white/10 hover:border-indigo-500/50 rounded-3xl flex items-center gap-4 transition-all overflow-hidden"
                                    >
                                        <Plus className="w-6 h-6 text-indigo-400 group-hover:rotate-90 transition-transform duration-500" />
                                        <span className="text-[12px] font-black uppercase tracking-[0.3em] text-white">Select Study Documents</span>
                                    </button>
                                </div>

                                <div className="mt-16 w-full max-w-4xl space-y-4">
                                    <div className="flex items-center justify-between px-10 mb-2">
                                        <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest">Active Document Feed</p>
                                        <p className="text-[12px] font-black text-indigo-500 uppercase tracking-widest">{Array.isArray(uploadedDocs) ? uploadedDocs.length : 0} Artifacts Synced</p>
                                    </div>
                                    {Array.isArray(uploadedDocs) && uploadedDocs.map(doc => (
                                        <div key={doc.id} className="bg-white/[0.03] border border-white/5 rounded-3xl px-10 py-6 flex items-center justify-between group hover:bg-white/[0.05] transition-all hover:border-white/10">
                                            <div className="flex items-center gap-6">
                                                <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-indigo-500/10 transition-colors"><Microscope className="w-6 h-6 text-indigo-400" /></div>
                                                <div className="text-left">
                                                    <p className="text-sm font-black text-white uppercase tracking-tighter group-hover:text-indigo-300 transition-colors">{doc.name}</p>
                                                    <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">{doc.category} Type • {doc.version}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-[12px] font-black text-emerald-400 uppercase tracking-widest">{doc.status}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setUploadedDocs(prev => prev.filter(d => d.id !== doc.id));
                                                    }}
                                                    className="text-slate-600 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg group/del"
                                                >
                                                    <X className="w-5 h-5 group-hover/del:rotate-90 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 5 && (
                        <motion.div key="step5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12 will-change-transform">
                            <div className="bg-[#0B101B]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-12 space-y-12 shadow-xl relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 border-l-4 border-indigo-500 pl-8">
                                        <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic">Final Review</h3>
                                    </div>
                                    <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all ${validation?.isValid ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-red-500/10 border-red-500/50 text-red-500'}`}>
                                        {validation?.isValid ? <ShieldCheck className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                        <span className="text-sm font-black uppercase tracking-widest italic">{validation?.isValid ? "Synchronized & Ready" : "Critical Discretions Found"}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-12">
                                        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-10 space-y-8">
                                            <h4 className="text-[12px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3 italic"><Layers className="w-4 h-4" /> Identity Synopsis</h4>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-10">
                                                <div>
                                                    <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest">Protocol ID</p>
                                                    <p className="text-lg font-bold text-white mt-1 italic font-mono">{formData.protocol_id}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest">Target Sample</p>
                                                    <p className="text-2xl font-black text-white mt-1 italic">{formData.target_subjects} Subjects</p>
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest">Sponsor</p>
                                                    <p className="text-sm font-black text-indigo-300 mt-1 uppercase italic truncate">{formData.sponsor_name || "NOT SELECTED"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest">Indication</p>
                                                    <p className="text-sm font-black text-emerald-400 mt-1 uppercase italic truncate">{formData.indication || "NOT SPECIFIED"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest">Incentive Loop</p>
                                                    <p className="text-sm font-black text-white mt-1 uppercase italic truncate">{formData.reward_type} / {formData.reward_logic.replace('_', ' ')}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest">Base Stipend</p>
                                                    <p className="text-lg font-black text-emerald-400 mt-1 italic">
                                                        {formData.compensation && formData.compensation.toString().trim() !== '' ? `${CURRENCY_SYMBOLS[formData.compensation_currency] || '$'}${formData.compensation}` : 
                                                         formData.reward_logic === 'PER_TASK' ? `${CURRENCY_SYMBOLS[formData.compensation_currency] || '$'}${formData.reward_config?.tasks?.default || 0} / Task` :
                                                         formData.reward_logic === 'PER_VISIT' ? `${CURRENCY_SYMBOLS[formData.compensation_currency] || '$'}${formData.reward_config?.visits?.default || 0} / Visit` :
                                                         formData.reward_logic === 'FULL_STUDY' ? `${CURRENCY_SYMBOLS[formData.compensation_currency] || '$'}${formData.reward_config?.full_study || 0} Total` :
                                                         "$0 Total"}
                                                    </p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest">Short Title Alias</p>
                                                    <p className="text-lg font-bold text-white mt-1 italic leading-tight uppercase underline decoration-indigo-500/30 underline-offset-8">{formData.title || "---"}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-[#111827] border border-white/5 rounded-[2.5rem] p-10 space-y-8">
                                            <h4 className="text-[12px] font-black text-pink-500 uppercase tracking-widest italic">Verification Status</h4>
                                            <div className="space-y-5">
                                                {[
                                                    { label: 'Primary Identity Mapped', check: validation?.missingFields?.length === 0, sub: validation?.missingFields?.length > 0 ? `Missing: ${validation?.missingFields?.join(', ').replace(/_/g, ' ')}` : null },
                                                    { label: 'Principal Investigator Synced', check: validation?.hasPI },
                                                    { label: 'Operational Support Assigned', check: validation?.hasCC },
                                                    { label: 'IRB Protocol Root Uploaded', check: validation?.hasProtocol }
                                                ].map((item, i) => (
                                                    <div key={i} className="flex-col gap-1">
                                                        <div className="flex items-center justify-between group">
                                                            <span className={`text-[12px] font-black uppercase tracking-widest transition-all ${item.check ? 'text-slate-500 group-hover:text-slate-300' : 'text-red-400 italic underline'}`}>{item.label}</span>
                                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${item.check ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-500'}`}>
                                                                {item.check ? <CheckSquare className="w-4 h-4 shadow-emerald-500/50" /> : <AlertCircle className="w-4 h-4" />}
                                                            </div>
                                                        </div>
                                                        {item.sub && (
                                                            <p className="text-[12px] text-red-400 font-bold uppercase tracking-widest mt-1 ml-1 opacity-70 italic">{item.sub}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-12">
                                        <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-[2.5rem] p-10 space-y-8">
                                            <h4 className="text-[12px] font-black text-white uppercase tracking-widest italic flex items-center gap-3"><TrendingUp className="w-4 h-4" /> Timeline Projections</h4>
                                            <div className="flex items-center gap-8">
                                                <div className="flex-1 p-6 bg-[#03060C] rounded-2xl border border-white/5">
                                                    <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest">Deployment</p>
                                                    <p className="text-lg font-black text-white mt-1 italic font-mono">{formData.startDate || "TBD"}</p>
                                                </div>
                                                <ChevronRight className="w-6 h-6 text-slate-800" />
                                                <div className="flex-1 p-6 bg-[#03060C] rounded-2xl border border-white/5">
                                                    <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest">Termination</p>
                                                    <p className="text-lg font-black text-white mt-1 italic font-mono">{formData.endDate || "TBD"}</p>
                                                </div>
                                            </div>
                                            <p className="text-[12px] text-white/30 font-bold uppercase tracking-widest leading-relaxed italic">* These projections are intended for internal synchronization only and do not constitute absolute clinical deadlines.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Action Bar Hub */}
            <div className="fixed bottom-0 right-0 left-0 lg:left-[320px] h-24 border-t border-white/5 bg-[#0B101B]/90 backdrop-blur-xl flex items-center justify-between px-10 z-[60]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 1}
                        className={`px-10 py-5 rounded-2xl border flex items-center gap-4 transition-all ${currentStep === 1 ? 'opacity-20 cursor-not-allowed border-white/5 text-slate-600' : 'bg-white/5 border-white/10 text-white hover:bg-white/10 shadow-xl'}`}
                    >
                        <ChevronLeft className="w-5 h-5 text-indigo-400" />
                        <span className="text-[12px] font-black uppercase tracking-[0.2em]">Previous Phase</span>
                    </button>
                </div>

                <div className="flex items-center gap-6">
                    <button onClick={onClose} className="px-8 py-5 text-slate-500 hover:text-white transition-all text-[12px] font-black uppercase tracking-widest italic group">
                        Discard <span className="opacity-0 group-hover:opacity-100 transition-opacity">Study</span>
                    </button>

                    {currentStep < 5 ? (
                        <button onClick={handleNext} className="px-12 py-5 bg-indigo-600 text-white rounded-2xl flex items-center gap-4 shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all group">
                            <span className="text-[12px] font-black uppercase tracking-[0.2em]">Next Step</span>
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                if (validation?.isValid && onSave) {
                                    // Normalize data for backend
                                    // Many fields in the frontend state use camelCase or simplified names
                                    // but the backend serializer expects snake_case or specific model field names.
                                    const { pi_id, coordinator_id, assigned_sponsors, startDate, endDate, execution_type, indication, brief_description, masking, ...baseData } = formData;
                                    
                                    const payload = {
                                        ...baseData,
                                        primary_indication: indication,
                                        description: brief_description,
                                        study_type: execution_type,
                                        start_date: startDate || null,
                                        end_date: endDate || null,
                                        // Map masking logic to boolean flags expected by backend
                                        is_double_blind: masking === 'DOUBLE_BLIND' || masking === 'TRIPLE_BLIND' || masking === 'FOURTH_BLIND',
                                        has_placebo_control: formData.trial_model === 'RCT',
                                        // Plural IDs for many-to-many staff assignments (Must use plural keys for backend sync)
                                        pi_ids: Array.isArray(pi_id) ? pi_id : [],
                                        coordinator_ids: Array.isArray(coordinator_id) ? coordinator_id : [],
                                        // Ensure standard fields are correctly typed
                                        compensation: String(formData.compensation || '0'),
                                        reward_amount: Number(formData.compensation) || 0,
                                        // Sanitize foreign keys
                                        sponsor_id: formData.sponsor_id || null,
                                        sponsor_org_id: formData.sponsor_org_id || null,
                                        // Set initial visibility status so it shows on the main website immediately
                                        status: 'RECRUITING',
                                        stage: 'RECRUITING'
                                    };
                                    onSave(payload);
                                    alert("✅ PROTOCOL SYNCED: Study has been successfully registered in the MusB Meta-Database.");
                                }
                            }}
                            disabled={!validation?.isValid}
                            className={`px-14 py-5 rounded-[2.5rem] flex items-center gap-4 shadow-3xl transition-all ${validation?.isValid ? 'bg-emerald-600 animate-pulse-slow text-white shadow-emerald-500/40 hover:scale-[1.05] active:scale-95 hover:bg-emerald-500' : 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed border border-white/5'}`}
                        >
                            <Rocket className="w-6 h-6" />
                            <span className="text-[12px] font-black uppercase tracking-[0.2em]">{validation?.isValid ? 'SUBMIT PROTOCOL' : 'Identity Verification Required'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Invite Modals */}
            <AnimatePresence>
                {(showInviteMemberModal || showInviteSponsorModal) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0B101B]/95 backdrop-blur-xl">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-lg bg-[#0F172A] border border-white/10 rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">
                                    {showInviteSponsorModal ? 'Invite Sponsor Representative' : `Invite ${inviteMemberRole}`}
                                </h3>
                                <button onClick={() => { setShowInviteMemberModal(false); setShowInviteSponsorModal(false); }} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); showInviteSponsorModal ? handleInviteSponsor(e) : handleInvitePersonnel(e); }} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={inviteData.name}
                                        onChange={e => setInviteData({ ...inviteData, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-indigo-500/50"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Professional Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={inviteData.email}
                                        onChange={e => setInviteData({ ...inviteData, email: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-indigo-500/50"
                                        placeholder="john@organization.com"
                                    />
                                </div>
                                {!showInviteSponsorModal && (
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Clinical Role</label>
                                        <select
                                            value={inviteMemberRole}
                                            onChange={(e) => setInviteMemberRole(e.target.value as any)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none"
                                        >
                                            <option value="PI" className="bg-[#0F172A]">Principal Investigator</option>
                                            <option value="COORDINATOR" className="bg-[#0F172A]">Clinical Coordinator</option>
                                            <option value="STUDY_STAFF" className="bg-[#0F172A]">Research Assistant</option>
                                        </select>
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={inviteLoading}
                                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20"
                                >
                                    {inviteLoading ? <Activity className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                                    {inviteLoading ? 'Sending Credentials...' : 'Send Secure Invitation'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const LaunchStudyForm = React.memo(LaunchStudyFormRoot);
export default LaunchStudyForm;


