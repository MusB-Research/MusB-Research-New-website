import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Rocket, 
    Save, 
    Plus, 
    Shield, 
    Truck, 
    FileSignature, 
    Beaker, 
    Users, 
    Calendar,
    Activity,
    Settings2,
    CheckCircle2,
    X,
    ChevronDown
} from 'lucide-react';

interface TrialConfiguratorProps {
    onClose?: () => void;
    onSave?: (data: any) => void;
    initialData?: any;
    availablePIs?: any[];
    availableCoordinators?: any[];
    availableSponsors?: any[];
}

export default function LaunchStudyForm({ onClose, onSave, initialData, availablePIs = [], availableCoordinators = [], availableSponsors = [] }: TrialConfiguratorProps) {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        full_title: initialData?.full_title || '',
        protocol_id: initialData?.protocol_id || '',
        description: initialData?.description || '',
        sponsor_name: initialData?.sponsor_name || '',
        sponsor_id: initialData?.sponsor_id || '',
        pi_ids: initialData?.pi_ids || (initialData?.pi_id ? [initialData.pi_id] : []),
        coordinator_ids: initialData?.coordinator_ids || (initialData?.coordinator_id ? [initialData.coordinator_id] : []),
        startDate: initialData?.startDate || '',
        endDate: initialData?.endDate || '',
        target_screened: initialData?.target_screened || 100,
        status: initialData?.status || 'DRAFT',
        study_type: initialData?.study_type || 'IN_PERSON',
        trial_model: initialData?.trial_model || 'RCT',
        is_double_blind: initialData?.is_double_blind || false,
        has_placebo_control: initialData?.has_placebo_control || false,
        has_screening_log: initialData?.has_screening_log ?? true,
        shipment_mode: initialData?.shipment_mode || 'CLINIC',
        consent_mode: initialData?.consent_mode || 'ECONSENT',
        primary_indication: initialData?.primary_indication || '',
        proposal_source: initialData?.proposal_source || 'OFFLINE',
        proposal_submitted_date: initialData?.proposal_submitted_date || '',
        agreement_signed_date: initialData?.agreement_signed_date || '',
        contract_status: initialData?.contract_status || '',
        sponsor_contact_name: initialData?.sponsor_contact_name || '',
        sponsor_contact_email: initialData?.sponsor_contact_email || '',
    });

    const [piSearch, setPiSearch] = useState('');
    const [coordSearch, setCoordSearch] = useState('');
    const [sponsorSearch, setSponsorSearch] = useState('');
    const [isPiDropdownOpen, setIsPiDropdownOpen] = useState(false);
    const [isCoordDropdownOpen, setIsCoordDropdownOpen] = useState(false);
    const [isSponsorDropdownOpen, setIsSponsorDropdownOpen] = useState(false);
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isCreatingSponsor, setIsCreatingSponsor] = useState(false);
    const [newSponsorData, setNewSponsorData] = useState({ name: '', email: '' });

    const handleSaveNewSponsor = () => {
        if (!newSponsorData.name) return;
        
        // In a real app, this would hit an API.
        // For now, we'll mock it by adding to the temporary selection
        const newId = `new-${Date.now()}`;
        
        // Update the form
        setFormData({ 
            ...formData, 
            sponsor_id: newId, 
            sponsor_name: newSponsorData.name,
            sponsor_contact_email: newSponsorData.email || formData.sponsor_contact_email
        });
        
        // Reset and close
        setIsCreatingSponsor(false);
        setIsSponsorDropdownOpen(false);
        setNewSponsorData({ name: '', email: '' });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData({ ...formData, [name]: val });
    };

    const handleAction = (isPublish: boolean) => {
        // Normalize data before sending to backend
        const cleanData: any = { ...formData };
        
        // Ensure dates are sent as YYYY-MM-DD or null if empty
        ['startDate', 'endDate', 'proposal_submitted_date', 'agreement_signed_date', 'launch_date'].forEach(field => {
            if (!cleanData[field] || cleanData[field] === '') {
                cleanData[field] = null;
            } else if (typeof cleanData[field] === 'string' && cleanData[field].includes('T')) {
                // If it contains a time part (ISO string), keep only the date part
                cleanData[field] = cleanData[field].split('T')[0];
            }
        });

        // Ensure numeric fields are actually numbers
        if (cleanData.target_screened) {
          cleanData.target_screened = parseInt(cleanData.target_screened) || 0;
        }

        if (onSave) onSave({ ...cleanData, status: isPublish ? 'RECRUITING' : 'PAUSED' });
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
        >
            {/* Header / Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-white/5 pb-6 lg:pb-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-xl shrink-0">
                            <Settings2 className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-400" />
                        </div>
                        <h1 className="text-3xl lg:text-5xl font-black text-white italic uppercase tracking-tighter leading-tight">
                            Trial <span className="text-cyan-400">Configurator</span>
                        </h1>
                    </div>
                    <p className="text-[10px] lg:text-xs text-slate-500 font-black uppercase tracking-[0.2em] lg:tracking-[0.3em] ml-0 lg:ml-12">
                        Precision Protocol Engineering & Control Center
                    </p>
                </div>

                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="px-5 py-3.5 lg:px-6 lg:py-4 bg-white/5 border border-white/10 text-slate-400 rounded-xl lg:rounded-2xl text-[10px] lg:text-xs font-black uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <X className="w-5 h-5" /> Cancel
                        </button>
                    )}
                    <button 
                        onClick={() => handleAction(false)}
                        className="px-5 py-3.5 lg:px-8 lg:py-4 bg-white/5 border border-white/10 text-slate-300 rounded-xl lg:rounded-2xl text-[10px] lg:text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                    >
                        <Save className="w-5 h-5" /> Save Configuration
                    </button>
                    <button 
                        onClick={() => handleAction(true)}
                        className="px-5 py-3.5 lg:px-10 lg:py-4 bg-cyan-500 text-slate-950 rounded-xl lg:rounded-2xl text-[10px] lg:text-xs font-black uppercase tracking-widest shadow-xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <Save className="w-5 h-5" /> Push to Production
                    </button>
                </div>

            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Left: Core & Design */}
                <div className="xl:col-span-2 space-y-10">
                    {/* Section 1: Core Identity */}
                    <div className="relative z-[30] bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-10 space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                            <Beaker className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-400" />
                            <h3 className="text-sm lg:text-base font-black text-white uppercase tracking-widest italic">Core Protocol Identity</h3>
                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">Short Title</label>
                                <input 
                                    type="text" 
                                    name="title" 
                                    value={formData.title} 
                                    onChange={handleChange}
                                    placeholder="e.g. Metabolic Biomarker Correlation (Phase II)"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl px-5 lg:px-6 py-3.5 lg:py-4 text-xs lg:text-sm text-white font-bold outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-700"

                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">Full Title</label>
                                <input 
                                    type="text" 
                                    name="full_title" 
                                    value={formData.full_title} 
                                    onChange={handleChange}
                                    placeholder="e.g. Metabolic Biomarker Correlation Study Phase II Clinical Trial"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-bold outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">Internal ID / Registry #</label>
                                <input 
                                    type="text" 
                                    name="protocol_id" 
                                    value={formData.protocol_id} 
                                    onChange={handleChange}
                                    placeholder="MB-2026-X1"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-mono outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-700"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">Primary Medical Indication</label>
                                <input 
                                    type="text" 
                                    name="primary_indication" 
                                    value={formData.primary_indication} 
                                    onChange={handleChange}
                                    placeholder="Type 2 Diabetes / Metabolic Syndrome"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-bold outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">Sponsor Organization</label>
                                <div className="relative">
                                    <div 
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center justify-between cursor-pointer hover:border-cyan-500/50 transition-all"
                                        onClick={() => setIsSponsorDropdownOpen(!isSponsorDropdownOpen)}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm text-white font-bold">{formData.sponsor_name || '-- Select Sponsor --'}</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isSponsorDropdownOpen ? 'rotate-180' : ''}`} />
                                    </div>

                                    {isSponsorDropdownOpen && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-[#0B101B] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-3xl">
                                            {!isCreatingSponsor ? (
                                                <>
                                                    <div className="p-3 border-b border-white/5">
                                                        <input 
                                                            type="text"
                                                            placeholder="Filter sponsors..."
                                                            value={sponsorSearch}
                                                            onChange={(e) => setSponsorSearch(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-cyan-500/30"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                    <div className="max-h-60 overflow-y-auto">
                                                        {availableSponsors.filter(s => s.name.toLowerCase().includes(sponsorSearch.toLowerCase())).map(s => (
                                                            <div 
                                                                key={s.id}
                                                                onClick={() => {
                                                                    setFormData({ ...formData, sponsor_id: s.id, sponsor_name: s.name });
                                                                    setIsSponsorDropdownOpen(false);
                                                                    setSponsorSearch('');
                                                                }}
                                                                className="px-6 py-4 hover:bg-white/5 cursor-pointer flex items-center justify-between group"
                                                            >
                                                                <span className={`text-sm font-bold group-hover:text-cyan-400 ${formData.sponsor_id === s.id ? 'text-cyan-400' : 'text-slate-300'}`}>{s.name}</span>
                                                                {formData.sponsor_id === s.id && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                                                            </div>
                                                        ))}
                                                        
                                                        {/* Add Create New Sponsor option */}
                                                        <div 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setIsCreatingSponsor(true);
                                                            }}
                                                            className="px-6 py-4 border-t border-white/5 hover:bg-cyan-500/5 cursor-pointer flex items-center gap-3 group transition-colors"
                                                        >
                                                            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20">
                                                                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                                                            </div>
                                                            <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">Create New Sponsor</span>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">New Sponsor Profile</h4>
                                                        <button 
                                                            onClick={() => setIsCreatingSponsor(false)}
                                                            className="text-slate-500 hover:text-white"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Sponsor Name</label>
                                                            <input 
                                                                type="text"
                                                                placeholder="e.g. Novartis Pharmaceuticals"
                                                                value={newSponsorData.name}
                                                                onChange={(e) => setNewSponsorData({ ...newSponsorData, name: e.target.value })}
                                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-cyan-500/50"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Contact Email</label>
                                                            <input 
                                                                type="email"
                                                                placeholder="contact@sponsor.com"
                                                                value={newSponsorData.email}
                                                                onChange={(e) => setNewSponsorData({ ...newSponsorData, email: e.target.value })}
                                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-cyan-500/50"
                                                            />
                                                        </div>
                                                        <button 
                                                            onClick={handleSaveNewSponsor}
                                                            disabled={!newSponsorData.name}
                                                            className="w-full py-3 bg-cyan-500 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                                                        >
                                                            Save Sponsor
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Lifecycle Status - Integration of Section 5.1 */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                                <Activity className="w-3 h-3 text-cyan-400" />
                                Study Lifecycle State
                            </label>
                            <div className="relative">
                                <div 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 flex items-center justify-between cursor-pointer hover:border-cyan-500/50 transition-all font-mono"
                                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                                        <span className="text-sm text-white font-black uppercase tracking-widest">{formData.status.replace(/_/g, ' ')}</span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                                </div>

                                {isStatusDropdownOpen && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-[#0B101B] border border-white/10 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] z-[60] overflow-hidden backdrop-blur-3xl p-2 grid grid-cols-2 gap-1 font-mono">
                                        {[
                                            'DRAFT', 'PROPOSAL_SUBMITTED', 'PROPOSAL_UNDER_NEGOTIATION', 
                                            'AGREEMENT_SIGNED', 'IRB_PROTOCOL_INITIATED', 'UNDER_IRB_SUBMISSION', 
                                            'IRB_APPROVED', 'PREPARING_TO_LAUNCH', 'ACTIVE', 'RECRUITING', 
                                            'RECRUITMENT_COMPLETED', 'ANALYSIS_UNDERWAY', 'PROGRESS_REPORT_DRAFT', 
                                            'FINAL_REPORT_SENT', 'COMPLETED', 'PAUSED', 'CLOSED_ARCHIVED'
                                        ].map(st => (
                                            <div 
                                                key={st}
                                                onClick={() => { setFormData({ ...formData, status: st }); setIsStatusDropdownOpen(false); }}
                                                className={`px-4 py-3 rounded-xl hover:bg-white/5 cursor-pointer text-[9px] font-black uppercase tracking-widest transition-all ${formData.status === st ? 'text-cyan-400 bg-cyan-500/5' : 'text-slate-500'}`}
                                            >
                                                {st.replace(/_/g, ' ')}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section: Proposal & Sponsor Details (Section 4) */}
                    <div className="relative z-[15] bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                            <FileSignature className="w-6 h-6 text-emerald-400" />
                            <h3 className="text-base font-black text-white uppercase tracking-widest italic">Proposal & Sponsor Tracking</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">Proposal Source</label>
                                <select 
                                    name="proposal_source"
                                    value={formData.proposal_source}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-bold outline-none focus:border-emerald-500/50 appearance-none transition-all"
                                >
                                    <option value="ONLINE">Online Platform Submission</option>
                                    <option value="OFFLINE">Offline / Manual Referral</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">Current Contract Status</label>
                                <input 
                                    type="text" 
                                    name="contract_status"
                                    value={formData.contract_status}
                                    onChange={handleChange}
                                    placeholder="e.g. Under Legal Review"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-bold outline-none focus:border-emerald-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">Proposal Submitted Date</label>
                                <input 
                                    type="date" 
                                    name="proposal_submitted_date"
                                    value={formData.proposal_submitted_date}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-mono outline-none focus:border-emerald-500/50" 
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">Agreement Signed Date</label>
                                <input 
                                    type="date" 
                                    name="agreement_signed_date"
                                    value={formData.agreement_signed_date}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-mono outline-none focus:border-emerald-500/50" 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">Sponsor Contact Name</label>
                                <input 
                                    type="text" 
                                    name="sponsor_contact_name"
                                    value={formData.sponsor_contact_name}
                                    onChange={handleChange}
                                    placeholder="Point of Contact at SponsorOrg"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-bold outline-none focus:border-emerald-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">Sponsor Contact Email</label>
                                <input 
                                    type="email" 
                                    name="sponsor_contact_email"
                                    value={formData.sponsor_contact_email}
                                    onChange={handleChange}
                                    placeholder="contact@sponsormail.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-bold outline-none focus:border-emerald-500/50 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Clinical Model & Methodology */}
                    <div className="relative z-[20] bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                            <Activity className="w-6 h-6 text-indigo-400" />
                            <h3 className="text-base font-black text-white uppercase tracking-widest italic">Clinical Design & Methodology</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 min-h-[32px] flex items-end">Study Execution Type</label>
                                <div className="relative">
                                    <div 
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl h-16 px-6 flex items-center justify-between cursor-pointer hover:border-cyan-500/50 transition-all"
                                        onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                                    >
                                        <span className="text-[10px] text-white font-black uppercase tracking-widest">
                                            {formData.study_type === 'IN_PERSON' ? 'In-Person Clinical' : 
                                             formData.study_type === 'VIRTUAL' ? 'Virtual / Decentralized' : 'Hybrid Trial'}
                                        </span>
                                        <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
                                    </div>

                                    {isTypeDropdownOpen && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-[#0B101B] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-3xl">
                                            {[
                                                { id: 'IN_PERSON', label: 'In-Person Clinical' },
                                                { id: 'VIRTUAL', label: 'Virtual / Decentralized' },
                                                { id: 'DECENTRALIZED', label: 'Hybrid Trial' }
                                            ].map(type => (
                                                <div 
                                                    key={type.id}
                                                    onClick={() => {
                                                        setFormData({ ...formData, study_type: type.id });
                                                        setIsTypeDropdownOpen(false);
                                                    }}
                                                    className="px-6 py-4 hover:bg-white/5 cursor-pointer text-[10px] font-black uppercase tracking-widest group"
                                                >
                                                    <span className={`group-hover:text-cyan-400 ${formData.study_type === type.id ? 'text-cyan-400' : 'text-slate-400'}`}>{type.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 min-h-[32px] flex items-end">Statistical Trial Model</label>
                                <div className="relative">
                                    <div 
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl h-16 px-6 flex items-center justify-between cursor-pointer hover:border-cyan-500/50 transition-all"
                                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                                    >
                                        <span className="text-[10px] text-white font-black uppercase tracking-widest">
                                            {formData.trial_model === 'RCT' ? 'RCT (Randomized Controlled)' : 
                                             formData.trial_model === 'OPEN_LABEL' ? 'Open Label' : 
                                             formData.trial_model === 'IHUT' ? 'In-Home Use Test' :
                                             formData.trial_model === 'REGISTRY' ? 'Patient Registry' : 'Observational'}
                                        </span>
                                        <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                                    </div>

                                    {isModelDropdownOpen && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-[#0B101B] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-3xl max-h-60 overflow-y-auto">
                                            {[
                                                { id: 'RCT', label: 'RCT (Randomized Controlled)' },
                                                { id: 'OPEN_LABEL', label: 'Open Label' },
                                                { id: 'IHUT', label: 'In-Home Use Test (IHUT)' },
                                                { id: 'REGISTRY', label: 'Patient Registry' },
                                                { id: 'OBSERVATIONAL', label: 'Observational' }
                                            ].map(model => (
                                                <div 
                                                    key={model.id}
                                                    onClick={() => {
                                                        setFormData({ ...formData, trial_model: model.id });
                                                        setIsModelDropdownOpen(false);
                                                    }}
                                                    className="px-6 py-4 hover:bg-white/5 cursor-pointer text-[10px] font-black uppercase tracking-widest group"
                                                >
                                                    <span className={`group-hover:text-cyan-400 ${formData.trial_model === model.id ? 'text-cyan-400' : 'text-slate-400'}`}>{model.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 min-h-[32px] flex items-end">Recruitment Limit</label>
                                <input 
                                    type="number" 
                                    name="target_screened"
                                    value={formData.target_screened}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl h-16 px-6 text-[11px] text-white font-black uppercase tracking-[0.1em] outline-none focus:border-cyan-500/50 transition-all font-mono italic"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                            <label className="flex items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl cursor-pointer group hover:bg-white/10 transition-all">
                                <input 
                                    type="checkbox" 
                                    name="is_double_blind"
                                    checked={formData.is_double_blind}
                                    onChange={handleChange}
                                    className="w-6 h-6 accent-cyan-500"
                                />
                                <div className="space-y-1">
                                    <span className="text-xs font-black text-white uppercase tracking-widest">Double Blind</span>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest italic leading-tight">Masked assignment logic</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl cursor-pointer group hover:bg-white/10 transition-all">
                                <input 
                                    type="checkbox" 
                                    name="has_placebo_control"
                                    checked={formData.has_placebo_control}
                                    onChange={handleChange}
                                    className="w-6 h-6 accent-cyan-500"
                                />
                                <div className="space-y-1">
                                    <span className="text-xs font-black text-white uppercase tracking-widest">Placebo Control</span>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest italic leading-tight">Control arm integrated</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl cursor-pointer group hover:bg-white/10 transition-all">
                                <input 
                                    type="checkbox" 
                                    name="has_screening_log"
                                    checked={formData.has_screening_log}
                                    onChange={handleChange}
                                    className="w-6 h-6 accent-cyan-500"
                                />
                                <div className="space-y-1">
                                    <span className="text-xs font-black text-white uppercase tracking-widest">Screening Log</span>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest italic leading-tight">Full audit trail enabled</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Right: Logistics & Compliance */}
                <div className="space-y-10">
                    
                    {/* Section 3: Supply Chain */}
                    <div className="relative z-[30] bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                            <Truck className="w-6 h-6 text-emerald-400" />
                            <h3 className="text-base font-black text-white uppercase tracking-widest italic">Logistics & Supply</h3>
                        </div>

                        <div className="space-y-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Product Distribution Mode</label>
                                <div className="grid grid-cols-3 gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, shipment_mode: 'CLINIC'})}
                                        className={`h-20 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all duration-300 flex items-center justify-center text-center px-2 ${
                                            formData.shipment_mode === 'CLINIC' 
                                            ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                                            : 'bg-white/[0.02] border-white/5 text-slate-600 hover:text-slate-400 hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        Clinic Delivery
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, shipment_mode: 'DTP'})}
                                        className={`h-20 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all duration-300 flex items-center justify-center text-center px-2 ${
                                            formData.shipment_mode === 'DTP' 
                                            ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                                            : 'bg-white/[0.02] border-white/5 text-slate-600 hover:text-slate-400 hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        Direct-to-Participant
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, shipment_mode: 'HYBRID'})}
                                        className={`h-20 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all duration-300 flex items-center justify-center text-center px-2 ${
                                            formData.shipment_mode === 'HYBRID' 
                                            ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                                            : 'bg-white/[0.02] border-white/5 text-slate-600 hover:text-slate-400 hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        Hybrid (Both)
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Consent Framework</label>
                                <div className="grid grid-cols-3 gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, consent_mode: 'PAPER'})}
                                        className={`h-20 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all duration-300 flex items-center justify-center text-center px-2 ${
                                            formData.consent_mode === 'PAPER' 
                                            ? 'bg-cyan-500/5 text-cyan-400 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
                                            : 'bg-white/[0.02] border-white/5 text-slate-600 hover:text-slate-400 hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        Paper Record
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, consent_mode: 'ECONSENT'})}
                                        className={`h-20 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all duration-300 flex items-center justify-center text-center px-2 ${
                                            formData.consent_mode === 'ECONSENT' 
                                            ? 'bg-cyan-500/5 text-cyan-400 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
                                            : 'bg-white/[0.02] border-white/5 text-slate-600 hover:text-slate-400 hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        eConsent (Digital)
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, consent_mode: 'HYBRID'})}
                                        className={`h-20 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all duration-300 flex items-center justify-center text-center px-2 ${
                                            formData.consent_mode === 'HYBRID' 
                                            ? 'bg-cyan-500/5 text-cyan-400 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
                                            : 'bg-white/[0.02] border-white/5 text-slate-600 hover:text-slate-400 hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        Hybrid (Both)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Operational Dates */}
                    <div className="relative z-[20] bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                            <Calendar className="w-6 h-6 text-amber-400" />
                            <h3 className="text-base font-black text-white uppercase tracking-widest italic">Operational Window</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">FPI (First In)</label>
                                <input 
                                    type="date" 
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-mono outline-none focus:border-amber-500/50 transition-all text-center" 
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">LPO (Last Out)</label>
                                <input 
                                    type="date" 
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-mono outline-none focus:border-amber-500/50 transition-all text-center" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Medical Team Assignment */}
                    <div className="relative z-[10] bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                            <Users className="w-6 h-6 text-emerald-400" />
                            <h3 className="text-base font-black text-white uppercase tracking-widest italic">Clinical Research Team</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-10">
                            {/* PI Multi-Select */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end px-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Principal Investigator(s)</label>
                                    <span className="text-[10px] text-cyan-500 uppercase font-black tracking-widest flex items-center gap-1.5 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                                        {formData.pi_ids.length} Assigned
                                    </span>
                                </div>
                                <div className="relative">
                                    <div className="w-full bg-white/5 border border-white/10 rounded-2xl min-h-[56px] p-2 flex flex-wrap gap-2 focus-within:border-emerald-500/50 transition-all">
                                        {formData.pi_ids.map((id: any) => {
                                            const pi = availablePIs.find(p => p.id === id);
                                            return (
                                                <div key={id} className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
                                                    <span className="text-[11px] font-black text-emerald-400 uppercase tracking-tight">{pi?.name || 'Unknown'}</span>
                                                    <button 
                                                        onClick={() => setFormData({...formData, pi_ids: formData.pi_ids.filter((i: any) => i !== id)})}
                                                        className="text-emerald-500 hover:text-white transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        <input 
                                            type="text"
                                            placeholder={formData.pi_ids.length === 0 ? "Search and select PIs..." : "Add more..."}
                                            value={piSearch}
                                            onChange={(e) => {
                                                setPiSearch(e.target.value);
                                                setIsPiDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsPiDropdownOpen(true)}
                                            className="flex-1 bg-transparent border-none outline-none text-sm text-white px-3 min-w-[120px]"
                                        />
                                    </div>

                                    {isPiDropdownOpen && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-[#0B101B] border border-white/10 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto backdrop-blur-3xl">
                                            {availablePIs.filter(p => p.name.toLowerCase().includes(piSearch.toLowerCase()) && !formData.pi_ids.includes(p.id)).map(pi => (
                                                <div 
                                                    key={pi.id}
                                                    onClick={() => {
                                                        setFormData({...formData, pi_ids: [...formData.pi_ids, pi.id]});
                                                        setPiSearch('');
                                                        setIsPiDropdownOpen(false);
                                                    }}
                                                    className="px-6 py-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-none transition-colors group"
                                                >
                                                    <p className="text-sm font-bold text-white group-hover:text-emerald-400">{pi.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono">{pi.email}</p>
                                                </div>
                                            ))}
                                            <div className="px-6 py-3">
                                                <button onClick={() => setIsPiDropdownOpen(false)} className="text-[10px] text-slate-500 font-black uppercase hover:text-white">Close Dropdown</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                             {/* Coordinator Multi-Select */}
                             <div className="space-y-4">
                                <div className="flex justify-between items-end px-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Clinical Coordinator(s)</label>
                                    <span className="text-[10px] text-indigo-500 uppercase font-black tracking-widest flex items-center gap-1.5 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                                        {formData.coordinator_ids.length} Assigned
                                    </span>
                                </div>
                                <div className="relative">
                                    <div className="w-full bg-white/5 border border-white/10 rounded-2xl min-h-[56px] p-2 flex flex-wrap gap-2 focus-within:border-indigo-500/50 transition-all">
                                        {formData.coordinator_ids.map((id: any) => {
                                            const c = availableCoordinators.find(coord => coord.id === id);
                                            return (
                                                <div key={id} className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
                                                    <span className="text-[11px] font-black text-indigo-400 uppercase tracking-tight">{c?.name || 'Unknown'}</span>
                                                    <button 
                                                        onClick={() => setFormData({...formData, coordinator_ids: formData.coordinator_ids.filter((i: any) => i !== id)})}
                                                        className="text-indigo-500 hover:text-white transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        <input 
                                            type="text"
                                            placeholder={formData.coordinator_ids.length === 0 ? "Search and select Coords..." : "Add more..."}
                                            value={coordSearch}
                                            onChange={(e) => {
                                                setCoordSearch(e.target.value);
                                                setIsCoordDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsCoordDropdownOpen(true)}
                                            className="flex-1 bg-transparent border-none outline-none text-sm text-white px-3 min-w-[120px]"
                                        />
                                    </div>

                                    {isCoordDropdownOpen && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-[#0B101B] border border-white/10 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto backdrop-blur-3xl">
                                            {availableCoordinators.filter(c => c.name.toLowerCase().includes(coordSearch.toLowerCase()) && !formData.coordinator_ids.includes(c.id)).map(c => (
                                                <div 
                                                    key={c.id}
                                                    onClick={() => {
                                                        setFormData({...formData, coordinator_ids: [...formData.coordinator_ids, c.id]});
                                                        setCoordSearch('');
                                                        setIsCoordDropdownOpen(false);
                                                    }}
                                                    className="px-6 py-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-none transition-colors group"
                                                >
                                                    <p className="text-sm font-bold text-white group-hover:text-indigo-400">{c.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono">{c.email}</p>
                                                </div>
                                            ))}
                                             <div className="px-6 py-3">
                                                <button onClick={() => setIsCoordDropdownOpen(false)} className="text-[10px] text-slate-500 font-black uppercase hover:text-white">Close Dropdown</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
