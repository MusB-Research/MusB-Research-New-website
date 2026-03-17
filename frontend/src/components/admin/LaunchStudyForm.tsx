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
    X
} from 'lucide-react';

interface TrialConfiguratorProps {
    onClose?: () => void;
    onSave?: (data: any) => void;
    initialData?: any;
}

export default function LaunchStudyForm({ onClose, onSave, initialData }: TrialConfiguratorProps) {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        protocol_id: initialData?.protocol_id || '',
        description: initialData?.description || '',
        sponsor_name: initialData?.sponsor_name || '',
        pi: initialData?.pi || '',
        coordinator: initialData?.coordinator || '',
        startDate: initialData?.startDate || '',
        endDate: initialData?.endDate || '',
        participantLimit: initialData?.participantLimit || 100,
        status: initialData?.status || 'PAUSED',
        study_type: initialData?.study_type || 'IN_PERSON',
        trial_model: initialData?.trial_model || 'RCT',
        is_double_blind: initialData?.is_double_blind || false,
        has_placebo_control: initialData?.has_placebo_control || false,
        has_screening_log: initialData?.has_screening_log ?? true,
        shipment_mode: initialData?.shipment_mode || 'CLINIC',
        consent_mode: initialData?.consent_mode || 'ECONSENT',
        primary_indication: initialData?.primary_indication || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData({ ...formData, [name]: val });
    };

    const handleAction = (isPublish: boolean) => {
        if (onSave) onSave({ ...formData, status: isPublish ? 'RECRUITING' : 'PAUSED' });
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
        >
            {/* Header / Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-white/5 pb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-xl">
                            <Settings2 className="w-5 h-5 text-cyan-400" />
                        </div>
                        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                            Trial <span className="text-cyan-400">Configurator</span>
                        </h1>
                    </div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] ml-12">
                        Precision Protocol Engineering & Control Center
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="px-6 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center gap-2"
                        >
                            <X className="w-4 h-4" /> Cancel
                        </button>
                    )}
                    <button 
                        onClick={() => handleAction(false)}
                        className="px-8 py-4 bg-white/5 border border-white/10 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3"
                    >
                        <Save className="w-4 h-4" /> Save Configuration
                    </button>
                    <button 
                        onClick={() => handleAction(true)}
                        className="px-10 py-4 bg-cyan-500 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
                    >
                        <Rocket className="w-4 h-4" /> Deploy Protocol
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Left: Core & Design */}
                <div className="xl:col-span-2 space-y-10">
                    
                    {/* Section 1: Core Identity */}
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                            <Beaker className="w-5 h-5 text-cyan-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Core Protocol Identity</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Official Protocol Title</label>
                                <input 
                                    type="text" 
                                    name="title" 
                                    value={formData.title} 
                                    onChange={handleChange}
                                    placeholder="e.g. Metabolic Biomarker Correlation (Phase II)"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white font-bold outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-700"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Internal ID / Registry #</label>
                                <input 
                                    type="text" 
                                    name="protocol_id" 
                                    value={formData.protocol_id} 
                                    onChange={handleChange}
                                    placeholder="MB-2026-X1"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white font-mono outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Sponsor Organization</label>
                                <input 
                                    type="text" 
                                    name="sponsor_name" 
                                    value={formData.sponsor_name} 
                                    onChange={handleChange}
                                    placeholder="Global BioPharma Ltd"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white font-bold outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-700"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Primary Medical Indication</label>
                                <input 
                                    type="text" 
                                    name="primary_indication" 
                                    value={formData.primary_indication} 
                                    onChange={handleChange}
                                    placeholder="Type 2 Diabetes / Metabolic Syndrome"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white font-bold outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-700"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Clinical Model & Methodology */}
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                            <Activity className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Clinical Design & Methodology</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Study Execution Type</label>
                                <select 
                                    name="study_type"
                                    value={formData.study_type}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[10px] text-white font-black uppercase tracking-widest outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
                                >
                                    <option value="IN_PERSON">In-Person Clinical</option>
                                    <option value="VIRTUAL">Virtual / Decentralized</option>
                                    <option value="HYBRID">Hybrid (On-Site + Virtual)</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Statistical Trial Model</label>
                                <select 
                                    name="trial_model"
                                    value={formData.trial_model}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[10px] text-white font-black uppercase tracking-widest outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
                                >
                                    <option value="RCT">RCT (Randomized Controlled)</option>
                                    <option value="OPEN_LABEL">Open Label</option>
                                    <option value="IHUT">In-Home Use Test (IHUT)</option>
                                    <option value="REGISTRY">Patient Registry</option>
                                    <option value="OBSERVATIONAL">Observational</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Recruitment Limit</label>
                                <input 
                                    type="number" 
                                    name="participantLimit"
                                    value={formData.participantLimit}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg text-white font-black italic outline-none focus:border-cyan-500/50 transition-all font-mono"
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
                                    className="w-5 h-5 accent-cyan-500"
                                />
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Double Blind</span>
                                    <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest italic leading-tight">Masked assignment logic</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl cursor-pointer group hover:bg-white/10 transition-all">
                                <input 
                                    type="checkbox" 
                                    name="has_placebo_control"
                                    checked={formData.has_placebo_control}
                                    onChange={handleChange}
                                    className="w-5 h-5 accent-cyan-500"
                                />
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Placebo Control</span>
                                    <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest italic leading-tight">Control arm integrated</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl cursor-pointer group hover:bg-white/10 transition-all">
                                <input 
                                    type="checkbox" 
                                    name="has_screening_log"
                                    checked={formData.has_screening_log}
                                    onChange={handleChange}
                                    className="w-5 h-5 accent-cyan-500"
                                />
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Screening Log</span>
                                    <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest italic leading-tight">Full audit trail enabled</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Right: Logistics & Compliance */}
                <div className="space-y-10">
                    
                    {/* Section 3: Supply Chain */}
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                            <Truck className="w-5 h-5 text-emerald-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Logistics & Supply</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Product Distribution Mode</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, shipment_mode: 'CLINIC'})}
                                        className={`py-4 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                            formData.shipment_mode === 'CLINIC' 
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-lg' 
                                            : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                                        }`}
                                    >
                                        Clinic Delivery
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, shipment_mode: 'DTP'})}
                                        className={`py-4 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                            formData.shipment_mode === 'DTP' 
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-lg' 
                                            : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                                        }`}
                                    >
                                        Direct-to-Participant
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Consent Framework</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, consent_mode: 'PAPER'})}
                                        className={`py-4 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                            formData.consent_mode === 'PAPER' 
                                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                                            : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                                        }`}
                                    >
                                        Paper Record
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, consent_mode: 'ECONSENT'})}
                                        className={`py-4 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                            formData.consent_mode === 'ECONSENT' 
                                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-lg' 
                                            : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                                        }`}
                                    >
                                        eConsent (Digital)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Operational Dates */}
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                            <Calendar className="w-5 h-5 text-amber-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Operational Window</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">FPI (First In)</label>
                                <input 
                                    type="date" 
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white font-mono outline-none" 
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">LPO (Last Out)</label>
                                <input 
                                    type="date" 
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white font-mono outline-none" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 5: Team Assignments */}
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                            <Users className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Clinical Supervision</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Principal Investigator</label>
                                <select 
                                    name="pi"
                                    value={formData.pi}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[10px] text-white font-black uppercase tracking-widest outline-none transition-all"
                                >
                                    <option value="">-- Unassigned --</option>
                                    <option value="1">Dr. Michael Chen, MD</option>
                                    <option value="2">Dr. Sarah Alvarez, PhD</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Lead Site Coordinator</label>
                                <select 
                                    name="coordinator"
                                    value={formData.coordinator}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[10px] text-white font-black uppercase tracking-widest outline-none transition-all"
                                >
                                    <option value="">-- Unassigned --</option>
                                    <option value="3">Emily Jones</option>
                                    <option value="4">James Smith</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
