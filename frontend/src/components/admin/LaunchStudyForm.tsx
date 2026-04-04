import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Rocket, Beaker, Activity, Users, FileText, CheckCircle2, 
    X, ChevronDown, Upload, ChevronRight, ChevronLeft, 
    AlertCircle, History, CheckSquare, TrendingUp,
    ShieldCheck, Microscope, UserPlus, FileCheck, Layers,
    Briefcase, Plus, Calendar, ShieldAlert, Loader2, Building2
} from 'lucide-react';
import { authFetch, API, getUser, getRole } from '../../utils/auth';

interface LaunchStudyFormProps {
    onClose?: () => void;
    onSave?: (data: any) => void;
    initialData?: any;
    availablePIs?: any[];
    availableCoordinators?: any[];
    availableSponsors?: any[];
}

type StepID = 1 | 2 | 3 | 4 | 5;

interface DocumentFile {
    id: string;
    name: string;
    category: 'Protocol' | 'IRB_Letter' | 'Flyer' | 'Other';
    version: string;
    status: 'Current' | 'Draft';
}

const LaunchStudyFormRoot = ({ onClose, onSave, initialData, availablePIs = [], availableCoordinators = [], availableSponsors = [] }: LaunchStudyFormProps) => {
    const [currentStep, setCurrentStep] = useState<StepID>(1);
    const [lastSaved, setLastSaved] = useState<string>('Just now');

    // Real Data Holders
    const displayPIs = useMemo(() => availablePIs || [], [availablePIs]);
    const displayCoordinators = useMemo(() => availableCoordinators || [], [availableCoordinators]);
    const displaySponsors = useMemo(() => availableSponsors || [], [availableSponsors]);
    
    const [formData, setFormData] = useState<any>(() => {
        const currentUser = getUser();
        const initialPIs = (initialData?.assigned_pis || []).map((u: any) => typeof u === 'string' ? u : u.id);
        
        // Auto-assign current user as PI if creating new study and they are a PI
        if (!initialData && currentUser && getRole() === 'PI' && !initialPIs.includes(currentUser.id)) {
            initialPIs.push(currentUser.id);
        }

        return {
            protocol_id: initialData?.protocol_id || `MUSB-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`,
            sponsor_id: initialData?.sponsor_id || '',
            sponsor_name: initialData?.sponsor_name || '',
            startDate: initialData?.startDate || '',
            endDate: initialData?.endDate || '',
            full_title: initialData?.full_title || '',
            title: initialData?.title || '',
            indication: initialData?.indication || '',
            brief_description: initialData?.brief_description || '',
            overview: initialData?.overview || '',
            execution_type: initialData?.execution_type || 'IN_PERSON',
            trial_model: initialData?.trial_model || 'RCT',
            rct_design: initialData?.rct_design || 'PARALLEL',
            masking: initialData?.masking || 'DOUBLE_BLIND',
            phase: initialData?.phase || 'PHASE_2',
            target_subjects: initialData?.target_subjects || 120,
            medication_supply: initialData?.medication_supply || 'SPONSOR_PROVIDED',
            consent_collection: initialData?.consent_collection || ['ECONSENT'],
            assigned_pis: initialPIs,
            assigned_coordinators: (initialData?.assigned_coordinators || []).map((u: any) => typeof u === 'string' ? u : u.id),
            status: initialData?.status || 'DRAFT',
            compensation: initialData?.compensation || '500',
            compensation_currency: initialData?.compensation_currency || 'USD'
        };
    });

    const [uploadedDocs, setUploadedDocs] = useState<DocumentFile[]>(() => [
        { id: '1', name: 'IRB_Protocol_V3.pdf', category: 'Protocol', version: 'V3.1', status: 'Current' },
        { id: '2', name: 'Consent_Form_Template.docx', category: 'Other', version: 'V1.0', status: 'Draft' }
    ]);
    const [sponsorSearch, setSponsorSearch] = useState('');
    const [showSponsorDropdown, setShowSponsorDropdown] = useState(false);
    const [showAddSponsorModal, setShowAddSponsorModal] = useState(false);
    const [isCreatingSponsor, setIsCreatingSponsor] = useState(false);
    const [newSponsorData, setNewSponsorData] = useState({
        first_name: '',
        last_name: '',
        email: ''
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
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
        { id: 4, label: 'Documents', sub: 'Compliance Uploads', icon: FileText },
        { id: 5, label: 'Review', sub: 'Final Validation', icon: CheckCircle2 },
    ], []);

    const handleNext = useCallback(() => setCurrentStep((s) => (s < 5 ? (s + 1) as StepID : s)), []);
    const handlePrev = useCallback(() => setCurrentStep((s) => (s > 1 ? (s - 1) as StepID : s)), []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const toggleMultiSelect = useCallback((field: 'assigned_pis' | 'assigned_coordinators' | 'consent_collection', val: string) => {
        setFormData(prev => {
            const list = Array.isArray(prev[field]) ? [...(prev[field] as string[])] : [];
            const index = list.indexOf(val);
            if (index > -1) list.splice(index, 1);
            else list.push(val);
            return { ...prev, [field]: list };
        });
    }, []);

    const validation = useMemo(() => {
        const required = ['sponsor_id', 'startDate', 'full_title', 'title', 'indication', 'brief_description'];
        const missingFields = required.filter(f => !formData[f as keyof typeof formData]);
        const hasPI = Array.isArray(formData.assigned_pis) && formData.assigned_pis.length > 0;
        const hasCC = Array.isArray(formData.assigned_coordinators) && formData.assigned_coordinators.length > 0;
        const hasProtocol = Array.isArray(uploadedDocs) && uploadedDocs.some(d => d.category === 'Protocol');
        
        return {
            isValid: missingFields.length === 0 && hasPI && hasCC && hasProtocol,
            missingFields,
            hasPI,
            hasCC,
            hasProtocol
        };
    }, [formData, uploadedDocs]);

    const filteredSponsors = useMemo(() => {
        if (!sponsorSearch) return displaySponsors;
        return displaySponsors.filter(s => s?.name?.toLowerCase().includes(sponsorSearch.toLowerCase()));
    }, [displaySponsors, sponsorSearch]);

    const handleCreateQuickSponsor = async () => {
        if (!newSponsorData.email || !newSponsorData.first_name) {
            alert("❌ IDENTITY REQUIRED: Please provide at least a first name and email.");
            return;
        }

        setIsCreatingSponsor(true);
        try {
            const apiUrl = API || 'http://localhost:8000';
            const res = await authFetch(`${apiUrl}/api/auth/admin/create-user/`, {
                method: 'POST',
                body: JSON.stringify({
                    email: newSponsorData.email,
                    first_name: newSponsorData.first_name,
                    last_name: newSponsorData.last_name,
                    role: 'SPONSOR'
                })
            });

            if (res.ok) {
                const data = await res.json();
                alert(`✅ SPONSOR PROVISIONED\n\nSponsor has been successfully added to the system.`);
                setShowAddSponsorModal(false);
                setFormData(prev => ({ 
                    ...prev, 
                    sponsor_id: data.id, 
                    sponsor_name: `${newSponsorData.first_name} ${newSponsorData.last_name}`.trim() 
                }));
                setNewSponsorData({ first_name: '', last_name: '', email: '' });
                setShowSponsorDropdown(false);
            } else if (res.status === 409) {
                alert(`⚠️ CONFLICT DETECTED\n\nAn account with the email "${newSponsorData.email}" already exists in the MusB Registry. Please search for and select them from the "Select Sponsor" dropdown instead of creating a new entry.`);
            } else {
                const errorData = await res.json();
                alert(`Failed to create sponsor: ${errorData.error || errorData.detail || 'Access Denied'}`);
            }
        } catch (err) {
            console.error(err);
            alert('CRITICAL: Network error during sponsor dispatch');
        } finally {
            setIsCreatingSponsor(false);
        }
    };

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
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em] mt-2">Protocol Matrix Verification Hub V2.6</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-xs font-black text-indigo-400 uppercase tracking-widest leading-none">Status: Drafting</p>
                        <p className="text-[11px] text-white/40 font-bold mt-1 uppercase">Last saved: {lastSaved}</p>
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
                                    <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none">{step.label}</p>
                                    <p className={`text-[9px] uppercase tracking-tighter mt-1.5 ${currentStep === step.id ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>{step.sub}</p>
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
                                    <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tighter italic">Study Identity</h3>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div className="space-y-4">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Internal ID / Registry Number</label>
                                        <div className="bg-white/5 border border-white/10 rounded-3xl px-6 py-5 text-lg text-indigo-400 font-mono flex items-center justify-between">
                                            <span>{formData.protocol_id}</span>
                                            <span className="text-[10px] px-3 py-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 font-black uppercase text-indigo-300">Auto-Generated</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4 relative">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Sponsor Organization</label>
                                        <div onClick={() => setShowSponsorDropdown(!showSponsorDropdown)} className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-5 text-base text-white font-bold flex items-center justify-between cursor-pointer hover:border-white/20 transition-all font-mono italic">
                                            <span>{formData.sponsor_name || "Select Sponsor"}</span>
                                            <ChevronDown className="w-5 h-5 opacity-40" />
                                        </div>
                                        {showSponsorDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-3 bg-[#111827] border border-white/10 rounded-3xl shadow-3xl z-50 overflow-hidden backdrop-blur-xl">
                                                <div className="p-4 border-b border-white/5 bg-white/5">
                                                    <input type="text" placeholder="Search Sponsor Database..." value={sponsorSearch} onChange={(e) => setSponsorSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-indigo-500/50" />
                                                </div>
                                                <div className="max-h-60 overflow-y-auto">
                                                    {filteredSponsors.map(s => (
                                                        <div key={s?.id} onClick={() => { setFormData({...formData, sponsor_id: s?.id, sponsor_name: s?.full_name || s?.name}); setShowSponsorDropdown(false); }} className="px-6 py-5 hover:bg-indigo-600 cursor-pointer text-sm font-bold text-slate-300 hover:text-white flex items-center gap-3 transition-all">
                                                            <Briefcase className="w-4 h-4 text-slate-500 group-hover:text-white" /> {s?.full_name || s?.name}
                                                        </div>
                                                    ))}
                                                    <div 
                                                        onClick={() => setShowAddSponsorModal(true)}
                                                        className="p-4 border-t border-white/5 bg-indigo-600/5 hover:bg-indigo-600/10 cursor-pointer text-[10px] font-black uppercase text-indigo-400 text-center tracking-widest transition-all"
                                                    >
                                                        + Add New Sponsor Organization
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div className="space-y-4">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Start Date</label>
                                        <div className="relative group">
                                            <input 
                                                type="date" 
                                                name="startDate" 
                                                value={formData.startDate} 
                                                onChange={handleChange} 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-base text-white font-mono outline-none focus:border-indigo-500/50 transition-all custom-calendar-input" 
                                                style={{ colorScheme: 'dark', zoom: 1.3 }}
                                            />
                                            <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 text-indigo-400 pointer-events-none opacity-50 group-focus-within:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">End Date (Estimated)</label>
                                        <div className="relative group">
                                            <input 
                                                type="date" 
                                                name="endDate" 
                                                value={formData.endDate} 
                                                onChange={handleChange} 
                                                className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-5 text-base text-white font-mono outline-none focus:border-indigo-500/50 transition-all custom-calendar-input" 
                                                style={{ colorScheme: 'dark', zoom: 1.3 }}
                                            />
                                            <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 text-indigo-400 pointer-events-none opacity-50 group-focus-within:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-[#0B101B]/80 backdrop-blur-xl border border-white/5 rounded-[3.5rem] p-12 space-y-12 shadow-xl">
                                <div className="flex items-center gap-4 border-l-4 border-emerald-500 pl-8">
                                    <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tighter italic">Protocol Headers</h3>
                                </div>
                                <div className="space-y-10">
                                    <div className="space-y-4">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Official Full Title</label>
                                        <textarea name="full_title" value={formData.full_title} onChange={handleChange} placeholder="As stated on the clinical trial registry..." className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-lg text-white font-bold outline-none focus:border-emerald-500/50 resize-none placeholder:opacity-20 italic leading-relaxed" />
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                        <div className="space-y-4">
                                            <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Public Short Title</label>
                                            <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-base text-white font-bold outline-none focus:border-emerald-500/50" />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Therapeutic Indication</label>
                                            <input type="text" name="indication" value={formData.indication} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-base text-white font-bold outline-none focus:border-emerald-500/50 italic" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Brief Summary Overview</label>
                                        <textarea name="brief_description" value={formData.brief_description} onChange={handleChange} className="w-full h-32 bg-white/5 border border-white/10 rounded-3xl px-8 py-6 text-base text-white/80 font-medium outline-none focus:border-emerald-500/50 resize-none leading-relaxed" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12 will-change-transform">
                            <div className="bg-[#0B101B]/80 backdrop-blur-xl border border-white/5 rounded-[3.5rem] p-12 space-y-12 shadow-xl relative">
                                <div className="absolute top-0 right-0 p-12 opacity-5"><Activity className="w-48 h-48 text-white" /></div>
                                <div className="flex items-center gap-4 border-l-4 border-indigo-500 pl-8">
                                    <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tighter italic">Methodology Configuration</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                    {[
                                        { field: 'trial_model', label: 'Primary Model', options: ['RCT', 'Observational', 'Device Trial'] },
                                        { field: 'phase', label: 'Clinical Phase', options: ['PHASE_1', 'PHASE_2', 'PHASE_3', 'PHASE_4'] },
                                        { field: 'masking', label: 'Masking Strategy', options: ['NONE', 'SINGLE_BLIND', 'DOUBLE_BLIND', 'TRIPLE_BLIND'] },
                                        { field: 'execution_type', label: 'Execution', options: ['IN_PERSON', 'REMOTE', 'HYBRID'] }
                                    ].map((group) => (
                                        <div key={group.field} className="space-y-4">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">{group.label}</label>
                                            <div className="space-y-2">
                                                {group.options.map(opt => (
                                                    <button key={opt} onClick={() => setFormData({...formData, [group.field]: opt})} className={`w-full text-left px-5 py-4 rounded-xl text-xs font-black tracking-widest uppercase transition-all border ${formData[group.field as keyof typeof formData] === opt ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20'}`}>
                                                        {opt.replace('_', ' ')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="pt-8 border-t border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">Subject Population Node</label>
                                        <div className="bg-white/5 border border-white/5 rounded-3xl p-8 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Target Sample Size</p>
                                                <p className="text-2xl font-black text-white italic mt-1">{formData.target_subjects}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setFormData({...formData, target_subjects: Math.max(0, formData.target_subjects - 10)})} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all font-black text-xl">-</button>
                                                <button onClick={() => setFormData({...formData, target_subjects: formData.target_subjects + 10})} className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center hover:bg-indigo-500 transition-all font-black text-xl">+</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-2">Consent Mechanics</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {['ECONSENT', 'PAPER_CONSENT', 'REMOTE_WITNESS'].map(opt => (
                                                <button key={opt} onClick={() => toggleMultiSelect('consent_collection', opt)} className={`flex items-center gap-3 px-6 py-5 rounded-3xl border transition-all ${Array.isArray(formData.consent_collection) && formData.consent_collection.includes(opt) ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${Array.isArray(formData.consent_collection) && formData.consent_collection.includes(opt) ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'}`}>
                                                        {Array.isArray(formData.consent_collection) && formData.consent_collection.includes(opt) && <CheckSquare className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{opt.replace('_', ' ')}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-white/5 space-y-8">
                                    <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-2">Participant Financial Protocol</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Stipend Amount</p>
                                            <div className="flex items-center gap-4">
                                                {!isNaN(Number(formData.compensation)) && <span className="text-xl font-black text-slate-500">$</span>}
                                                <input 
                                                    type="text" 
                                                    name="compensation"
                                                    value={formData.compensation}
                                                    onChange={handleChange}
                                                    className="bg-transparent border-none text-xl font-black text-white italic focus:ring-0 w-full"
                                                />
                                            </div>
                                        </div>
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Currency</p>
                                            <select 
                                                name="compensation_currency"
                                                value={formData.compensation_currency}
                                                onChange={handleChange}
                                                className="bg-transparent border-none text-xl font-black text-white italic focus:ring-0 w-full appearance-none"
                                            >
                                                <option value="USD" className="bg-[#0B101B]">USD - US Dollar</option>
                                                <option value="EUR" className="bg-[#0B101B]">EUR - Euro</option>
                                                <option value="GBP" className="bg-[#0B101B]">GBP - British Pound</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12 will-change-transform">
                            <div className="bg-[#0B101B]/80 backdrop-blur-xl border border-white/5 rounded-[3.5rem] p-12 space-y-12 shadow-xl relative">
                                <div className="absolute top-0 right-0 p-12 opacity-5"><Users className="w-48 h-48 text-white" /></div>
                                <div className="flex items-center gap-4 border-l-4 border-indigo-500 pl-8">
                                    <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tighter italic">Research Team Deployment</h3>
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-6">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-2">Principal Investigators (PI)</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {displayPIs.map(pi => (
                                                <div key={pi?.id} onClick={() => toggleMultiSelect('assigned_pis', pi?.id)} className={`relative p-6 rounded-[2.5rem] border transition-all cursor-pointer group ${Array.isArray(formData.assigned_pis) && formData.assigned_pis.includes(pi?.id) ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                                                    {Array.isArray(formData.assigned_pis) && formData.assigned_pis.includes(pi?.id) && <div className="absolute top-4 right-4 text-indigo-400 group-hover:scale-110 transition-transform duration-300"><ShieldCheck className="w-6 h-6 shadow-[0_0_15px_rgba(129,140,248,0.4)]" /></div>}
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black text-white italic group-hover:bg-white/10 transition-all">{String(pi?.full_name || pi?.name || 'U').charAt(0)}</div>
                                                        <div>
                                                            <p className="text-sm font-black text-white uppercase tracking-tighter">{pi?.full_name || pi?.name || 'Unknown User'}</p>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Verified Specialist</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-2">Clinical Research Coordinators (CRC)</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {displayCoordinators.map(crc => (
                                                <div key={crc?.id} onClick={() => toggleMultiSelect('assigned_coordinators', crc?.id)} className={`relative p-6 rounded-[2.5rem] border transition-all cursor-pointer group ${Array.isArray(formData.assigned_coordinators) && formData.assigned_coordinators.includes(crc?.id) ? 'bg-emerald-600/10 border-emerald-500/50' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                                                    {Array.isArray(formData.assigned_coordinators) && formData.assigned_coordinators.includes(crc?.id) && <div className="absolute top-4 right-4 text-emerald-400 group-hover:scale-110 transition-transform duration-300"><UserPlus className="w-6 h-6 shadow-[0_0_15px_rgba(52,211,153,0.4)]" /></div>}
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black text-white italic group-hover:bg-white/10 transition-all">{String(crc?.full_name || crc?.name || 'C').charAt(0)}</div>
                                                        <div>
                                                            <p className="text-sm font-black text-white uppercase tracking-tighter">{crc?.full_name || crc?.name || 'Unknown User'}</p>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Operations Lead</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12 will-change-transform">
                            <div className="bg-[#0B101B]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-12 shadow-xl relative flex flex-col items-center justify-center py-20 min-h-[500px]">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                                
                                <div className="w-24 h-24 bg-indigo-600/10 border border-indigo-500/30 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(79,70,229,0.1)]">
                                    <Upload className="w-10 h-10 text-indigo-400" />
                                </div>
                                
                                <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tighter italic mb-4 leading-none">Sync Digital Protocol Matrix</h3>
                                <p className="text-slate-400 text-lg font-medium max-w-xl mb-12 italic text-center leading-relaxed">Select files for IRB Protocol, Informed Consent Templates, and Patient Recruitment Flyers to begin clinical synchronization.</p>
                                
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-indigo-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative px-12 py-5 bg-[#0B101B] border border-white/10 hover:border-indigo-500/50 rounded-3xl flex items-center gap-4 transition-all overflow-hidden"
                                    >
                                        <Plus className="w-6 h-6 text-indigo-400 group-hover:rotate-90 transition-transform duration-500" />
                                        <span className="text-xs font-black uppercase tracking-[0.3em] text-white">Select Protocol Artifacts</span>
                                    </button>
                                </div>
                                
                                <div className="mt-16 w-full max-w-4xl space-y-4">
                                    <div className="flex items-center justify-between px-10 mb-2">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active Document Feed</p>
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{Array.isArray(uploadedDocs) ? uploadedDocs.length : 0} Artifacts Synced</p>
                                    </div>
                                    {Array.isArray(uploadedDocs) && uploadedDocs.map(doc => (
                                        <div key={doc.id} className="bg-white/[0.03] border border-white/5 rounded-3xl px-10 py-6 flex items-center justify-between group hover:bg-white/[0.05] transition-all hover:border-white/10">
                                            <div className="flex items-center gap-6">
                                                <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-indigo-500/10 transition-colors"><Microscope className="w-6 h-6 text-indigo-400" /></div>
                                                <div className="text-left">
                                                    <p className="text-sm font-black text-white uppercase tracking-tighter group-hover:text-indigo-300 transition-colors">{doc.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">{doc.category} Node • {doc.version}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest">{doc.status}</span>
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
                            <div className="bg-[#0B101B]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-12 space-y-12 shadow-xl relative">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 border-l-4 border-indigo-500 pl-8">
                                        <h3 className="text-lg lg:text-xl font-black text-white uppercase tracking-tighter italic">Protocol Pre-Flight Review</h3>
                                    </div>
                                    <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all ${validation?.isValid ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-red-500/10 border-red-500/50 text-red-500'}`}>
                                        {validation?.isValid ? <ShieldCheck className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                        <span className="text-sm font-black uppercase tracking-widest italic">{validation?.isValid ? "Synchronized & Ready" : "Critical Discretions Found"}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-12">
                                        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-10 space-y-8">
                                            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3 italic"><Layers className="w-4 h-4" /> Identity Synopsis</h4>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-10">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Protocol ID</p>
                                                    <p className="text-lg font-bold text-white mt-1 italic font-mono">{formData.protocol_id}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Target Sample</p>
                                                    <p className="text-2xl font-black text-white mt-1 italic">{formData.target_subjects} Subjects</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sponsor</p>
                                                    <p className="text-sm font-black text-indigo-300 mt-1 uppercase italic truncate">{formData.sponsor_name || "NOT SELECTED"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Indication</p>
                                                    <p className="text-sm font-black text-emerald-400 mt-1 uppercase italic truncate">{formData.indication || "NOT SPECIFIED"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Compensation</p>
                                                    <p className="text-lg font-black text-emerald-400 mt-1 italic">
                                                        {isNaN(Number(formData.compensation)) ? formData.compensation : `${formData.compensation_currency === 'USD' ? '$' : formData.compensation_currency}${formData.compensation}`}
                                                    </p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Short Title Alias</p>
                                                    <p className="text-lg font-bold text-white mt-1 italic leading-tight uppercase underline decoration-indigo-500/30 underline-offset-8">{formData.title || "---"}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-[#111827] border border-white/5 rounded-[2.5rem] p-10 space-y-8">
                                            <h4 className="text-xs font-black text-pink-500 uppercase tracking-widest italic">Verification Status</h4>
                                            <div className="space-y-5">
                                                {[
                                                    { label: 'Primary Identity Mapped', check: validation?.missingFields?.length === 0, sub: validation?.missingFields?.length > 0 ? `Missing: ${validation?.missingFields?.join(', ').replace(/_/g, ' ')}` : null },
                                                    { label: 'Principal Investigator Synced', check: validation?.hasPI },
                                                    { label: 'Operational Support Assigned', check: validation?.hasCC },
                                                    { label: 'IRB Protocol Root Uploaded', check: validation?.hasProtocol }
                                                ].map((item, i) => (
                                                    <div key={i} className="flex-col gap-1">
                                                        <div className="flex items-center justify-between group">
                                                            <span className={`text-xs font-black uppercase tracking-widest transition-all ${item.check ? 'text-slate-500 group-hover:text-slate-300' : 'text-red-400 italic underline'}`}>{item.label}</span>
                                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${item.check ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-500'}`}>
                                                                {item.check ? <CheckSquare className="w-4 h-4 shadow-emerald-500/50" /> : <AlertCircle className="w-4 h-4" />}
                                                            </div>
                                                        </div>
                                                        {item.sub && (
                                                            <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest mt-1 ml-1 opacity-70 italic">{item.sub}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-12">
                                        <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-[2.5rem] p-10 space-y-8">
                                            <h4 className="text-xs font-black text-white uppercase tracking-widest italic flex items-center gap-3"><TrendingUp className="w-4 h-4" /> Timeline Projections</h4>
                                            <div className="flex items-center gap-8">
                                                <div className="flex-1 p-6 bg-[#03060C] rounded-2xl border border-white/5">
                                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Deployment</p>
                                                    <p className="text-lg font-black text-white mt-1 italic font-mono">{formData.startDate || "TBD"}</p>
                                                </div>
                                                <ChevronRight className="w-6 h-6 text-slate-800" />
                                                <div className="flex-1 p-6 bg-[#03060C] rounded-2xl border border-white/5">
                                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Termination</p>
                                                    <p className="text-lg font-black text-white mt-1 italic font-mono">{formData.endDate || "TBD"}</p>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-white/30 font-bold uppercase tracking-widest leading-relaxed italic">* These projections are intended for internal synchronization only and do not constitute absolute clinical deadlines.</p>
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
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Previous Phase</span>
                    </button>
                </div>

                <div className="flex items-center gap-6">
                    <button onClick={onClose} className="px-8 py-5 text-slate-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest italic group">
                        Discard <span className="opacity-0 group-hover:opacity-100 transition-opacity">Protocol</span>
                    </button>
                    
                    {currentStep < 5 ? (
                        <button onClick={handleNext} className="px-12 py-5 bg-indigo-600 text-white rounded-2xl flex items-center gap-4 shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all group">
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Proceed to Step {currentStep + 1}</span>
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    ) : (
                        <button 
                            onClick={async () => {
                                if (validation?.isValid && onSave) {
                                    setIsSubmitting(true);
                                    try {
                                        await onSave(formData);
                                        alert("✅ PROTOCOL SYNCHRONIZED\n\nStudy has been successfully registered in the MusB Meta-Database and is now live across the network.");
                                    } catch (err) {
                                        console.error(err);
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }
                            }} 
                            disabled={!validation?.isValid || isSubmitting}
                            className={`px-14 py-5 rounded-[2.5rem] flex items-center gap-4 shadow-3xl transition-all ${validation?.isValid && !isSubmitting ? 'bg-emerald-600 animate-pulse-slow text-white shadow-emerald-500/40 hover:scale-[1.05] active:scale-95 hover:bg-emerald-500' : 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed border border-white/5'}`}
                        >
                            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Rocket className="w-6 h-6" />}
                            <span className="text-xs font-black uppercase tracking-[0.2em]">
                                {isSubmitting ? 'SYNCHRONIZING PROTOCOL...' : (validation?.isValid ? 'Finalize & Launch Protocol' : 'Identity Verification Required')}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Add Sponsor Modal */}
            <AnimatePresence>
                {showAddSponsorModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#0F172A] border border-white/10 rounded-[3rem] w-full max-w-xl overflow-hidden shadow-3xl">
                            <div className="p-10 space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                                            <Building2 className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Register <span className="text-indigo-400">New Sponsor</span></h3>
                                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Cross-Network Entity Provisioning</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowAddSponsorModal(false)} className="p-3 hover:bg-white/5 rounded-xl transition-colors text-slate-500">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">First Name</label>
                                            <input 
                                                type="text" 
                                                value={newSponsorData.first_name} 
                                                onChange={(e) => setNewSponsorData({...newSponsorData, first_name: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-base text-white font-bold outline-none focus:border-indigo-500/50" 
                                                placeholder="e.g. John"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Last Name</label>
                                            <input 
                                                type="text" 
                                                value={newSponsorData.last_name} 
                                                onChange={(e) => setNewSponsorData({...newSponsorData, last_name: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-base text-white font-bold outline-none focus:border-indigo-500/50" 
                                                placeholder="e.g. Smith"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Sponsor Email Address</label>
                                        <input 
                                            type="email" 
                                            value={newSponsorData.email} 
                                            onChange={(e) => setNewSponsorData({...newSponsorData, email: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-base text-white font-bold outline-none focus:border-indigo-500/50 italic" 
                                            placeholder="sponsor@organization.com"
                                        />
                                    </div>
                                </div>

                                <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-3xl flex items-start gap-4">
                                    <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
                                    <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-widest leading-relaxed italic">
                                        * Provisioning a new sponsor will trigger an automatic credential dispatch to the provided email address for system access.
                                    </p>
                                </div>

                                <button 
                                    onClick={handleCreateQuickSponsor}
                                    disabled={isCreatingSponsor}
                                    className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest italic flex items-center justify-center gap-3 shadow-2xl shadow-indigo-900/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isCreatingSponsor ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                    {isCreatingSponsor ? 'DISPATCHING...' : 'REGISTER & ASSIGN SPONSOR'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const LaunchStudyForm = React.memo(LaunchStudyFormRoot);
export default LaunchStudyForm;
