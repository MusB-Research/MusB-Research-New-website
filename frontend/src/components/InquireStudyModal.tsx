import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, ChevronRight, ChevronLeft, Lock, CheckCircle2, Beaker,
    Building2, FileText, Upload, Phone, AlertCircle, Loader2, Calendar
} from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'STEP1' | 'NDA' | 'NDA_CONFIRM' | 'NDA_SENT' | 'STEP2' | 'SUCCESS';

const STEPS_LABELS: Record<Step, string> = {
    STEP1: 'Quick Check',
    NDA: 'Confidentiality',
    NDA_CONFIRM: 'NDA Details',
    NDA_SENT: 'NDA Sent',
    STEP2: 'Project Details',
    SUCCESS: 'Done',
};

const inputClass = `w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.06] transition-all`;
const labelClass = `block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2`;
const selectClass = `${inputClass} appearance-none cursor-pointer`;

const Checkbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <button
        type="button"
        onClick={onChange}
        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border transition-all text-left w-full text-sm ${
            checked
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
        }`}
    >
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            checked ? 'border-amber-500 bg-amber-500' : 'border-slate-600'
        }`}>
            {checked && <CheckCircle2 className="w-3 h-3 text-black" />}
        </div>
        {label}
    </button>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-500/70 border-b border-white/5 pb-3 mb-5">{children}</h3>
);

export default function InquireStudyModal({ isOpen, onClose }: Props) {
    const [step, setStep] = useState<Step>('STEP1');
    const [isLoading, setIsLoading] = useState(false);

    // Step 1 Data
    const [step1, setStep1] = useState({
        productName: '',
        productCategory: '',
        stageDev: '',
        studyNeed: [] as string[],
        healthFocus: '',
        timeline: '',
    });

    // NDA Data
    const [ndaChoice, setNdaChoice] = useState<'YES' | 'NO' | ''>('');
    const [ndaDetails, setNdaDetails] = useState({
        companyName: '',
        signatoryName: '',
        title: '',
        address: '',
    });

    // Step 2 Data
    const [step2, setStep2] = useState({
        studyType: [] as string[],
        targetPopulation: '',
        specificCondition: '',
        ageRange: '',
        budgetRange: '',
        services: [] as string[],
        description: '',
        fileName: '',
    });

    const toggleArray = (arr: string[], val: string) =>
        arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

    const simulateDelay = (cb: () => void) => {
        setIsLoading(true);
        setTimeout(() => { setIsLoading(false); cb(); }, 1200);
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setStep('STEP1');
            setStep1({ productName: '', productCategory: '', stageDev: '', studyNeed: [], healthFocus: '', timeline: '' });
            setNdaChoice('');
            setNdaDetails({ companyName: '', signatoryName: '', title: '', address: '' });
            setStep2({ studyType: [], targetPopulation: '', specificCondition: '', ageRange: '', budgetRange: '', services: [], description: '', fileName: '' });
        }, 400);
    };

    const getProgressWidth = () => {
        const order: Step[] = ['STEP1', 'NDA', 'STEP2', 'SUCCESS'];
        const idx = order.indexOf(step === 'NDA_CONFIRM' ? 'NDA' : step === 'NDA_SENT' ? 'STEP2' : step);
        return `${((idx + 1) / order.length) * 100}%`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25 }}
                        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-[#07090f] border border-white/10 rounded-[2.5rem] shadow-2xl shadow-black/50"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 px-8 pt-8 pb-6 border-b border-white/5">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center">
                                        <Beaker className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-500/60">MusB Research</p>
                                        <p className="text-sm font-black text-white leading-none">Start a Clinical Study</p>
                                    </div>
                                </div>
                                <button onClick={handleClose} className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    animate={{ width: getProgressWidth() }}
                                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                                />
                            </div>
                            <div className="flex justify-between mt-2">
                                {(['Quick Check', 'Confidentiality', 'Project Details', 'Complete'] as const).map((l, i) => (
                                    <span key={i} className="text-[8px] font-bold uppercase tracking-widest text-slate-600">{l}</span>
                                ))}
                            </div>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6">
                            <AnimatePresence mode="wait">

                                {/* ── STEP 1 ── */}
                                {step === 'STEP1' && (
                                    <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-8">
                                        <div>
                                            <h2 className="text-2xl font-black text-white leading-tight">Let's Explore Your Study Concept</h2>
                                            <p className="text-slate-500 text-sm mt-1">Tell us a little about your project. Our team will guide the rest.</p>
                                        </div>

                                        {/* Section A */}
                                        <div className="space-y-4">
                                            <SectionTitle>Section A — Product Overview</SectionTitle>
                                            <div>
                                                <label className={labelClass}>Product / Ingredient Name *</label>
                                                <input value={step1.productName} onChange={e => setStep1(s => ({ ...s, productName: e.target.value }))} placeholder="e.g., NAD+ Precursor Blend" className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Product Category *</label>
                                                <select value={step1.productCategory} onChange={e => setStep1(s => ({ ...s, productCategory: e.target.value }))} className={selectClass}>
                                                    <option value="" disabled>Select a category...</option>
                                                    {['Probiotic / Postbiotic', 'Nutraceutical', 'Botanical', 'Functional Food', 'Pharmaceutical', 'Device', 'Other'].map(v => <option key={v} value={v}>{v}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Stage of Development *</label>
                                                <select value={step1.stageDev} onChange={e => setStep1(s => ({ ...s, stageDev: e.target.value }))} className={selectClass}>
                                                    <option value="" disabled>Select stage...</option>
                                                    {['Concept', 'Preclinical Complete', 'Ready for Clinical', 'Marketed Product Seeking Data'].map(v => <option key={v} value={v}>{v}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Section B */}
                                        <div className="space-y-4">
                                            <SectionTitle>Section B — Study Scope</SectionTitle>
                                            <div>
                                                <label className={labelClass}>What best describes your need? *</label>
                                                <div className="space-y-2">
                                                    {['New Clinical Study', 'Preclinical Validation', 'Biomarker / Lab Support', 'Biorepository', 'Not Sure – Need Guidance'].map(v => (
                                                        <Checkbox key={v} label={v} checked={step1.studyNeed.includes(v)} onChange={() => setStep1(s => ({ ...s, studyNeed: toggleArray(s.studyNeed, v) }))} />
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Primary Health Focus *</label>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                    {['Gut', 'Metabolic', 'Brain', 'Aging', "Women's Health", 'Environmental', 'Liver / Behavioral', 'Other'].map(v => (
                                                        <button key={v} type="button" onClick={() => setStep1(s => ({ ...s, healthFocus: v }))}
                                                            className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                                                                step1.healthFocus === v
                                                                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                                                                    : 'bg-white/[0.03] border-white/10 text-slate-500 hover:text-white hover:border-white/20'
                                                            }`}
                                                        >{v}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Estimated Timeline</label>
                                                <select value={step1.timeline} onChange={e => setStep1(s => ({ ...s, timeline: e.target.value }))} className={selectClass}>
                                                    <option value="" disabled>Select timeline...</option>
                                                    {['Immediate (0–3 months)', '3–6 months', '6–12 months', 'Exploring Options'].map(v => <option key={v} value={v}>{v}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── NDA CHOICE ── */}
                                {step === 'NDA' && (
                                    <motion.div key="nda" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center">
                                                <Lock className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-white leading-tight">Would You Like an NDA Before Sharing Details?</h2>
                                                <p className="text-slate-500 text-sm mt-0.5">Your concept and formulation data may be confidential.</p>
                                            </div>
                                        </div>

                                        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 text-sm text-slate-400 leading-relaxed">
                                            We understand that your concept, formulation, or data may be confidential. If you prefer, we can execute a <strong className="text-white">mutual NDA</strong> before reviewing detailed project materials.
                                        </div>

                                        <div className="space-y-3">
                                            {[
                                                { val: 'YES', label: 'Yes — Send NDA Before Proceeding', sub: 'Our legal team will send a mutual NDA within 1–2 business days.' },
                                                { val: 'NO', label: 'No — Continue to Detailed Submission', sub: 'Skip the NDA and proceed directly to full project details.' },
                                            ].map(opt => (
                                                <button key={opt.val} type="button" onClick={() => setNdaChoice(opt.val as 'YES' | 'NO')}
                                                    className={`w-full text-left p-5 rounded-2xl border transition-all ${
                                                        ndaChoice === opt.val
                                                            ? opt.val === 'YES' ? 'bg-slate-700/40 border-slate-500/50 text-white' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                                            : 'bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${ndaChoice === opt.val ? 'border-current bg-current' : 'border-slate-600'}`} />
                                                        <div>
                                                            <p className="font-black text-sm">{opt.label}</p>
                                                            <p className="text-[11px] text-slate-500 mt-0.5">{opt.sub}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── NDA CONFIRM (company details) ── */}
                                {step === 'NDA_CONFIRM' && (
                                    <motion.div key="nda_confirm" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                                        <div>
                                            <h2 className="text-xl font-black text-white">Confirm NDA Details</h2>
                                            <p className="text-slate-500 text-sm mt-1">We'll prepare a personalized mutual NDA and send it within 1–2 business days.</p>
                                        </div>
                                        {[
                                            { field: 'companyName', label: 'Legal Name of Company *', placeholder: 'Acme Biotech Inc.' },
                                            { field: 'signatoryName', label: 'Authorized Signatory Name *', placeholder: 'Jane Smith' },
                                            { field: 'title', label: 'Title *', placeholder: 'Chief Scientific Officer' },
                                            { field: 'address', label: 'Corporate Address *', placeholder: '123 Research Blvd, Boston, MA 02101' },
                                        ].map(({ field, label, placeholder }) => (
                                            <div key={field}>
                                                <label className={labelClass}>{label}</label>
                                                <input value={(ndaDetails as any)[field]} onChange={e => setNdaDetails(s => ({ ...s, [field]: e.target.value }))} placeholder={placeholder} className={inputClass} />
                                            </div>
                                        ))}
                                    </motion.div>
                                )}

                                {/* ── NDA SENT ── */}
                                {step === 'NDA_SENT' && (
                                    <motion.div key="nda_sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-8 space-y-6">
                                        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-white">NDA Request Submitted</h2>
                                            <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto leading-relaxed">
                                                Our team will send a <strong className="text-white">Mutual NDA</strong> to your authorized signatory within <strong className="text-white">1–2 business days</strong>. Once executed, you may proceed with your detailed study submission.
                                            </p>
                                        </div>
                                        <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/70 mb-1">Lead Status</p>
                                            <p className="text-amber-400 font-bold">🔒 NDA Requested</p>
                                        </div>
                                        <button
                                            onClick={handleClose}
                                            className="flex items-center gap-2 mx-auto px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-black text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                                        >
                                            <Calendar className="w-4 h-4" /> Schedule Intro Call
                                        </button>
                                    </motion.div>
                                )}

                                {/* ── STEP 2 ── */}
                                {step === 'STEP2' && (
                                    <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-8">
                                        <div>
                                            <h2 className="text-2xl font-black text-white">Tell Us More About Your Study</h2>
                                            <p className="text-slate-500 text-sm mt-1">Full qualification — this helps our team prepare a tailored proposal.</p>
                                        </div>

                                        {/* Study Type */}
                                        <div className="space-y-4">
                                            <SectionTitle>Section A — Study Type</SectionTitle>
                                            <div className="space-y-2">
                                                {['Pilot Study', 'Randomized Controlled Trial', 'Mechanistic Study', 'Observational', 'Not Sure'].map(v => (
                                                    <Checkbox key={v} label={v} checked={step2.studyType.includes(v)} onChange={() => setStep2(s => ({ ...s, studyType: toggleArray(s.studyType, v) }))} />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Target Population */}
                                        <div className="space-y-4">
                                            <SectionTitle>Section B — Target Population & Budget</SectionTitle>
                                            <div>
                                                <label className={labelClass}>Target Population</label>
                                                <select value={step2.targetPopulation} onChange={e => setStep2(s => ({ ...s, targetPopulation: e.target.value }))} className={selectClass}>
                                                    <option value="" disabled>Select population...</option>
                                                    {['Healthy Adults', 'Specific Condition', 'Children / Pediatric', 'Elderly (65+)', 'Mixed'].map(v => <option key={v} value={v}>{v}</option>)}
                                                </select>
                                            </div>
                                            {step2.targetPopulation === 'Specific Condition' && (
                                                <div>
                                                    <label className={labelClass}>Specify Condition</label>
                                                    <input value={step2.specificCondition} onChange={e => setStep2(s => ({ ...s, specificCondition: e.target.value }))} placeholder="e.g., Type 2 Diabetes, IBS..." className={inputClass} />
                                                </div>
                                            )}
                                            <div>
                                                <label className={labelClass}>Age Range (Optional)</label>
                                                <input value={step2.ageRange} onChange={e => setStep2(s => ({ ...s, ageRange: e.target.value }))} placeholder="e.g., 30–65 years" className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Estimated Budget Range</label>
                                                <select value={step2.budgetRange} onChange={e => setStep2(s => ({ ...s, budgetRange: e.target.value }))} className={selectClass}>
                                                    <option value="" disabled>Select range...</option>
                                                    {['< $100K', '$100K – $250K', '$250K – $500K', '$500K+', 'Prefer to Discuss'].map(v => <option key={v} value={v}>{v}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Services */}
                                        <div className="space-y-4">
                                            <SectionTitle>Section C — Services Needed</SectionTitle>
                                            <div className="space-y-2">
                                                {[
                                                    'Study Design & Protocol Development',
                                                    'IRB & Regulatory Support',
                                                    'Participant Recruitment',
                                                    'Clinical Site Execution',
                                                    'Central Laboratory Services',
                                                    'Microbiome / Omics Analysis',
                                                    'Biostatistics',
                                                    'End-to-End Study Management',
                                                ].map(v => (
                                                    <Checkbox key={v} label={v} checked={step2.services.includes(v)} onChange={() => setStep2(s => ({ ...s, services: toggleArray(s.services, v) }))} />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Additional Info */}
                                        <div className="space-y-4">
                                            <SectionTitle>Section D — Additional Information</SectionTitle>
                                            <div>
                                                <label className={labelClass}>Project Description *</label>
                                                <textarea
                                                    value={step2.description}
                                                    onChange={e => setStep2(s => ({ ...s, description: e.target.value }))}
                                                    rows={4}
                                                    placeholder="Briefly describe your product, the study goal, and any key questions you're looking to answer..."
                                                    className={`${inputClass} resize-none`}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Supporting Documents (Optional)</label>
                                                <label className="flex items-center gap-3 w-full bg-white/[0.04] border-2 border-dashed border-white/10 rounded-2xl px-5 py-5 cursor-pointer hover:border-white/20 transition-all group">
                                                    <Upload className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-all" />
                                                    <span className="text-sm text-slate-600 group-hover:text-slate-400 transition-all">
                                                        {step2.fileName || 'Click to upload (PDF, DOCX, PPTX)'}
                                                    </span>
                                                    <input type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={e => setStep2(s => ({ ...s, fileName: e.target.files?.[0]?.name || '' }))} />
                                                </label>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── SUCCESS ── */}
                                {step === 'SUCCESS' && (
                                    <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-8 space-y-6">
                                        <motion.div
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            transition={{ delay: 0.2, type: 'spring', damping: 12 }}
                                            className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto"
                                        >
                                            <CheckCircle2 className="w-10 h-10 text-amber-400" />
                                        </motion.div>
                                        <div>
                                            <h2 className="text-xl font-black text-white">Thank You for Your Submission</h2>
                                            <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto leading-relaxed">
                                                Our clinical development team will review your project and contact you within <strong className="text-white">2–3 business days</strong>.
                                            </p>
                                        </div>
                                        <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-5 text-left space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/70">Lead Status Updated</p>
                                            <p className="text-amber-400 font-bold">✅ Qualified Lead — Routed to Clinical Development Team</p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                            <button onClick={handleClose} className="px-6 py-3 bg-amber-500 text-slate-950 rounded-2xl text-sm font-black hover:scale-[1.02] active:scale-95 transition-all">
                                                Done
                                            </button>
                                            <button onClick={handleClose} className="flex items-center gap-2 justify-center px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-black text-slate-300 hover:text-white hover:bg-white/10 transition-all">
                                                <Calendar className="w-4 h-4" /> Schedule a Call Now
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                            </AnimatePresence>
                        </div>

                        {/* Footer Actions */}
                        {step !== 'NDA_SENT' && step !== 'SUCCESS' && (
                            <div className="flex-shrink-0 px-8 py-5 border-t border-white/5 flex items-center justify-between gap-4">
                                <button
                                    onClick={() => {
                                        if (step === 'STEP1') handleClose();
                                        else if (step === 'NDA') setStep('STEP1');
                                        else if (step === 'NDA_CONFIRM') setStep('NDA');
                                        else if (step === 'STEP2') setStep('NDA');
                                    }}
                                    className="flex items-center gap-2 px-5 py-3 text-sm font-black text-slate-500 hover:text-white transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    {step === 'STEP1' ? 'Cancel' : 'Back'}
                                </button>

                                <button
                                    disabled={isLoading}
                                    onClick={() => {
                                        if (step === 'STEP1') {
                                            simulateDelay(() => setStep('NDA'));
                                        } else if (step === 'NDA') {
                                            if (!ndaChoice) return;
                                            if (ndaChoice === 'YES') setStep('NDA_CONFIRM');
                                            else simulateDelay(() => setStep('STEP2'));
                                        } else if (step === 'NDA_CONFIRM') {
                                            simulateDelay(() => setStep('NDA_SENT'));
                                        } else if (step === 'STEP2') {
                                            simulateDelay(() => setStep('SUCCESS'));
                                        }
                                    }}
                                    className="flex items-center gap-2 px-8 py-3.5 bg-amber-500 text-slate-950 rounded-2xl text-sm font-black shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:scale-100"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                        <>
                                            {step === 'STEP1' && 'Continue'}
                                            {step === 'NDA' && (ndaChoice === 'YES' ? 'Proceed to NDA Details' : ndaChoice === 'NO' ? 'Continue to Project Details' : 'Select an Option')}
                                            {step === 'NDA_CONFIRM' && <>Request NDA <Lock className="w-4 h-4" /></>}
                                            {step === 'STEP2' && <>Request Clinical Consultation <ChevronRight className="w-4 h-4" /></>}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
