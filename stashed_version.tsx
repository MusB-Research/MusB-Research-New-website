import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Search, Building2 } from 'lucide-react';
import ScreenerBuilder from './ScreenerBuilder';
import QuestionnaireBuilder from './QuestionnaireBuilder';

export const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: 'EUR ',
    GBP: 'GBP '
};

interface LaunchStudyFormProps {
    onClose?: () => void;
    onSave?: (data: any) => void | boolean | Promise<void | boolean>;
    initialData?: any;
    availablePIs?: any[];
    availableCoordinators?: any[];
    availableSponsors?: any[];
    availableSponsorUsers?: any[];
}

const STEPS = [
    { id: 1, label: 'Protocol' },
    { id: 2, label: 'Study info' },
    { id: 3, label: 'Design' },
    { id: 4, label: 'Team' },
    { id: 5, label: 'Screening' },
    { id: 6, label: 'Questionnaires' },
    { id: 7, label: 'Documents' },
    { id: 8, label: 'Review' },
];

const SponsorSearchModal = ({ isOpen, onClose, onSelect, availableSponsors }: any) => {
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    const filteredSponsors = (availableSponsors || []).filter((s: any) => {
        const name = (s.name || s.organization || s).toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    });

    return (
        <div className="fixed inset-0 bg-[#060B16]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-black text-white tracking-widest uppercase mb-1">Identity Protocol</div>
                        <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">Sponsor Portal Search</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-6 border-b border-white/5 bg-[#0B101B]">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search Organizations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0F172A] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 italic font-medium transition-colors"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto max-h-[400px] p-6 bg-[#0B101B]">
                    <div className="text-[11px] font-black text-slate-500 tracking-[0.2em] uppercase mb-4">
                        Clinical Personnel / Orgs
                    </div>
                    <div className="space-y-3">
                        {filteredSponsors.map((sponsor: any, idx: number) => (
                            <div key={idx} className="group flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-blue-500/30 hover:bg-blue-600/10 transition-all cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-colors">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <div className="text-white font-bold text-lg italic">{sponsor.name || sponsor.organization || sponsor}</div>
                                        <div className="text-[10px] font-black text-slate-500 tracking-widest uppercase mt-1">
                                            GXP Verified Organization
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onSelect(sponsor)}
                                    className="opacity-0 group-hover:opacity-100 px-6 py-2 rounded-lg bg-blue-600/20 text-blue-400 font-black text-[11px] tracking-widest uppercase hover:bg-blue-600 hover:text-white transition-all"
                                >
                                    Select
                                </button>
                            </div>
                        ))}
                        {filteredSponsors.length === 0 && (
                            <div className="text-slate-500 text-center py-8 italic text-sm">
                                No organizations found matching "{searchQuery}"
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-[#0F172A] grid grid-cols-2 gap-4">
                    <button className="py-4 rounded-xl font-black text-[11px] tracking-widest uppercase bg-blue-600 text-white hover:bg-blue-500 transition-colors text-center">
                        Add Organization
                    </button>
                    <button className="py-4 rounded-xl font-black text-[11px] tracking-widest uppercase bg-white/5 text-emerald-400 border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors text-center">
                        Invite Delegate
                    </button>
                </div>
            </div>
        </div>
    );
};

const LaunchStudyForm: React.FC<LaunchStudyFormProps> = ({
    onClose,
    onSave,
    initialData,
    availablePIs,
    availableCoordinators,
    availableSponsors,
    availableSponsorUsers
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const trialModelToLabel: Record<string, string> = {
        RCT: 'Randomized controlled trial',
        OPEN_LABEL: 'Open label study',
        IHUT: 'In-home use test',
        REGISTRY: 'Patient repository',
        OBSERVATIONAL: 'Observational study',
        BIOEQUIVALENCE: 'Bioequivalence study'
    };
    const phaseToLabel: Record<string, string> = {
        'N/A': 'N/A',
        PHASE_0: 'Phase 0',
        PHASE_1: 'Phase 1',
        PHASE_1_2: 'Phase 1/2',
        PHASE_2: 'Phase 2',
        PHASE_2_3: 'Phase 2/3',
        PHASE_3: 'Phase 3',
        PHASE_4: 'Phase 4',
        PILOT: 'Pilot',
        BIOEQUIVALENCE: 'Bioequivalence'
    };
    const maskingToLabel: Record<string, string> = {
        NONE: 'None (open label)',
        SINGLE_BLIND: 'Single blind',
        DOUBLE_BLIND: 'Double blind',
        TRIPLE_BLIND: 'Triple blind',
        QUADRUPLE_BLIND: 'Quadruple blind'
    };
    const studyTypeToLabel: Record<string, string> = {
        IN_PERSON: 'In-person',
        VIRTUAL: 'Remote',
        DECENTRALIZED: 'Hybrid'
    };
    const rewardTypeToLabel: Record<string, string> = {
        CASH: 'Cash',
        VISA_CARD: 'Gift Card',
        MASTER_CARD: 'Gift Card',
        MIXED: 'Product'
    };
    const rewardLogicToLabel: Record<string, string> = {
        FULL_STUDY: 'Per study completion',
        PER_VISIT: 'Per visit',
        PER_TASK: 'Milestone based'
    };
    const getSponsorDisplayName = (value: string) => {
        if (!value) return '';
        return availableSponsors?.find((s: any) => String(s.id) === String(value))?.name || value;
    };

    // Form State
    const [formData, setFormData] = useState({
        internalId: 'MUSB-2025-001',
        sponsor: '',
        startDate: '',
        endDate: '',
        fullTitle: '',
        shortTitle: '',
        category: '',
        briefSummary: '',
        studyOverview: '',
        benefits: '',
        participationMessage: '',
        primaryModel: '',
        clinicalPhase: 'N/A',
        maskingStrategy: 'None (open label)',
        executionMode: 'In-person',
        rewardType: 'Cash',
        incentiveLogic: 'Per study completion',
        stipendAmount: '',
        currency: 'USD',
        requireStudyKit: false,
        targetEnrollment: '',
        consentMethods: {
            eConsent: false,
            paperConsent: false,
            remoteWitness: false,
            lar: false,
            parentGuardian: false
        },
        selectedPIs: [] as string[],
        selectedCoordinators: [] as string[],
        selectedSponsorUsers: [] as string[],
        invitePIEmail: '',
        inviteCoordinatorEmail: '',
        inviteSponsorEmail: '',
        screenerQuestions: [] as any[],
        selectedQuestionnaires: [] as string[],
        consentFormFile: null as File | null,
        additionalDocuments: [] as File[]
    });

    const consentFileInputRef = useRef<HTMLInputElement>(null);
    const additionalFileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.checked });
    };

    const handleNestedCheckboxChange = (group: string, field: string, checked: boolean) => {
        setFormData({
            ...formData,
            [group]: {
                ...(formData as any)[group],
                [field]: checked
            }
        });
    };

    const handleArrayToggle = (group: keyof typeof formData, value: string) => {
        const arr = formData[group] as string[];
        setFormData({
            ...formData,
            [group]: arr.includes(value) ? arr.filter(id => id !== value) : [...arr, value]
        });
    };

    const handleConsentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFormData({ ...formData, consentFormFile: e.target.files[0] });
        }
    };

    const handleAdditionalFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFormData({
                ...formData,
                additionalDocuments: [...formData.additionalDocuments, ...Array.from(e.target.files)]
            });
        }
    };

    const removeAdditionalFile = (index: number) => {
        setFormData({
            ...formData,
            additionalDocuments: formData.additionalDocuments.filter((_, i) => i !== index)
        });
    };

    const handleSaveDraft = () => {
        const serializableData = {
            ...formData,
            consentFormFile: null, // Files cannot be serialized
            additionalDocuments: []
        };
        localStorage.setItem('study_launch_draft', JSON.stringify({ currentStep, formData: serializableData }));
        alert("Draft saved successfully! You can leave this page and your progress will be restored when you return.");
    };

    const handleResetForm = () => {
        localStorage.removeItem('study_launch_draft');
        window.location.reload();
    };

    useEffect(() => {
        if (!initialData) {
            const savedDraft = localStorage.getItem('study_launch_draft');
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    if (parsed.formData && window.confirm("We found an unsaved study draft. Would you like to resume where you left off?")) {
                        setFormData(prev => ({ ...prev, ...parsed.formData }));
                        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
                    } else {
                        localStorage.removeItem('study_launch_draft');
                    }
                } catch (e) {
                    console.error("Failed to load draft", e);
                }
            }
        } else {
            const existingQuestionnaires = Array.isArray(initialData.study_questionnaires)
                ? initialData.study_questionnaires.map((q: any) => q.template || q.template_details?.id).filter(Boolean)
                : [];
            const screenerQuestions = initialData.screener_config?.steps?.find((step: any) => step.type === 'user_input')?.questions || [];

            setFormData(prev => ({
                ...prev,
                internalId: initialData.protocol_id || prev.internalId,
                sponsor: initialData.sponsor_org_id || initialData.sponsor_org?.id || initialData.sponsor_name || '',
                startDate: initialData.start_date || '',
                endDate: initialData.end_date || '',
                fullTitle: initialData.full_title || initialData.title || '',
                shortTitle: initialData.title || '',
                category: initialData.condition || initialData.primary_indication || '',
                briefSummary: initialData.description || '',
                studyOverview: initialData.overview || '',
                benefits: initialData.benefit || '',
                participationMessage: initialData.participation_message || '',
                primaryModel: trialModelToLabel[initialData.trial_model] || initialData.trial_model || '',
                clinicalPhase: phaseToLabel[initialData.phase] || initialData.phase || 'N/A',
                maskingStrategy: maskingToLabel[initialData.masking_strategy] || initialData.masking_strategy || 'None (open label)',
                executionMode: studyTypeToLabel[initialData.study_type] || initialData.study_type || 'In-person',
                rewardType: rewardTypeToLabel[initialData.reward_type] || initialData.reward_type || 'Cash',
                incentiveLogic: rewardLogicToLabel[initialData.reward_logic] || initialData.reward_logic || 'Per study completion',
                stipendAmount: (initialData.reward_config?.amount || '').toString(),
                currency: initialData.compensation_currency || 'USD',
                requireStudyKit: Boolean(initialData.has_study_kit),
                targetEnrollment: String(initialData.target_subjects || ''),
                selectedPIs: initialData.pi_ids || [],
                selectedCoordinators: initialData.coordinator_ids || [],
                selectedSponsorUsers: initialData.sponsor_ids || [],
                screenerQuestions,
                selectedQuestionnaires: existingQuestionnaires
            }));
        }
    }, [initialData]);

    return (
        <div className="flex flex-col min-h-full w-full px-4 lg:px-8 2xl:px-12 max-w-[2800px] mx-auto text-white py-8">

            {/* Header Menu (Stepper) */}
            <div className="w-full max-w-6xl mx-auto mb-12">
                <div className="flex items-stretch bg-white/5 rounded-xl overflow-hidden border border-white/10 shadow-lg text-sm md:text-base font-medium">
                    {STEPS.map((step, index) => {
                        const isActive = currentStep === step.id;
                        const isLast = index === STEPS.length - 1;

                        return (
                            <button
                                key={step.id}
                                onClick={() => setCurrentStep(step.id)}
                                className={`
                                    flex-1 py-3 px-2 md:px-4 text-center transition-colors duration-200 flex items-center justify-center
                                    ${isActive
                                        ? 'bg-blue-600 text-white font-semibold shadow-inner'
                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'}
                                    ${!isLast ? 'border-r border-white/10' : ''}
                                `}
                            >
                                <span className={step.label.includes('Questionnaires') ? 'leading-tight text-[13px] md:text-base' : ''}>
                                    {step.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Form Content Area */}
            <div className="flex-1 w-full max-w-6xl mx-auto bg-[#0F172A] rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl">
                {currentStep === 1 ? (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Protocol fundamentals</h2>
                            <p className="text-slate-400 mt-1 text-sm md:text-base">Define the core identifiers for this study before proceeding.</p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">BASIC IDENTIFIERS</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Internal Study ID */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Internal study ID</label>
                                    <input
                                        type="text"
                                        name="internalId"
                                        value={formData.internalId}
                                        onChange={handleChange}
                                        placeholder="MUSB-2025-001"
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    />
                                </div>

                                {/* Sponsor */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-200">Sponsor</label>
                                    <div
                                        onClick={() => setIsSponsorModalOpen(true)}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 cursor-pointer hover:border-blue-500 transition-colors flex items-center justify-between"
                                    >
                                        <span className={formData.sponsor ? "text-white" : "text-slate-500"}>
                                            {getSponsorDisplayName(formData.sponsor) || "Select Organization..."}
                                        </span>
                                        <Search size={16} className="text-slate-500" />
                                    </div>
                                </div>

                                {/* Start Date */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Start date</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors [color-scheme:dark]"
                                    />
                                </div>

                                {/* End Date */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">End date</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Navigation specifically for Step 1 */}
                        <div className="pt-4">
                            <button
                                onClick={() => setCurrentStep(2)}
                                className="w-full py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                Continue to study information <span className="text-xl leading-none">&rarr;</span>
                            </button>
                        </div>
                    </div>
                ) : currentStep === 2 ? (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Study information</h2>
                            <p className="text-slate-400 mt-1 text-sm md:text-base">This information will appear on participant-facing pages and portals.</p>
                        </div>

                        {/* TITLES CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">TITLES</h3>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Official full title</label>
                                    <input
                                        type="text"
                                        name="fullTitle"
                                        value={formData.fullTitle}
                                        onChange={handleChange}
                                        placeholder="Full protocol title as registered"
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#e0e0e0]">Public short title</label>
                                        <input
                                            type="text"
                                            name="shortTitle"
                                            value={formData.shortTitle}
                                            onChange={handleChange}
                                            placeholder="e.g. Beat the Bloat Study"
                                            className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#e0e0e0]">Study category</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange as any}
                                            className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none"
                                        >
                                            <option value="">Select category</option>
                                            <option value="Gut Health">Gut Health</option>
                                            <option value="Metabolic Health">Metabolic Health</option>
                                            <option value="Aging">Aging</option>
                                            <option value="Women's Health">Women's Health</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PUBLIC-FACING CONTENT CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">PUBLIC-FACING CONTENT</h3>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Brief summary (shown on eligibility page)</label>
                                    <textarea
                                        name="briefSummary"
                                        value={formData.briefSummary}
                                        onChange={handleChange as any}
                                        placeholder="e.g. Are you feeling gassy and bloated? You may qualify for this study."
                                        rows={3}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-y"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Study overview (bullet points, one per line)</label>
                                    <textarea
                                        name="studyOverview"
                                        value={formData.studyOverview}
                                        onChange={handleChange as any}
                                        placeholder={`Evaluating a natural formulation targeting bloating, gas, and indigestion\nNon-invasive testing using breath-based gas measurements\nShort-duration study with minimal time commitment`}
                                        rows={4}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-y leading-relaxed"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Benefits for participants (bullet points, one per line)</label>
                                    <textarea
                                        name="benefits"
                                        value={formData.benefits}
                                        onChange={handleChange as any}
                                        placeholder={`Receive $150 compensation upon completion\nAccess to free digestive health assessment\nNo invasive testing ΓÇö simple and comfortable participation`}
                                        rows={4}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-y leading-relaxed"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Community participation message</label>
                                    <textarea
                                        name="participationMessage"
                                        value={formData.participationMessage}
                                        onChange={handleChange as any}
                                        placeholder="Participate in innovative, community-driven clinical research and take an active role in advancing health science ΓÇö while gaining valuable insights into your own health."
                                        rows={3}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-y"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Navigation specifically for Step 2 */}
                        <div className="pt-4 flex items-center justify-between gap-4">
                            <button
                                onClick={() => setCurrentStep(1)}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-xl leading-none">&larr;</span> Back
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center"
                            >
                                Save as draft
                            </button>
                            <button
                                onClick={() => setCurrentStep(3)}
                                className="w-1/2 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                Continue to study design <span className="text-xl leading-none">&rarr;</span>
                            </button>
                        </div>
                    </div>
                ) : currentStep === 3 ? (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Study design</h2>
                            <p className="text-slate-400 mt-1 text-sm md:text-base">Configure study structure, delivery, incentives, and consent method.</p>
                        </div>

                        {/* PRIMARY MODEL CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">PRIMARY MODEL</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                {['Randomized controlled trial', 'Open label study', 'In-home use test', 'Patient repository', 'Observational study', 'Bioequivalence study'].map((model) => (
                                    <label key={model} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-[#0B101B] cursor-pointer hover:border-blue-500 transition-colors">
                                        <input
                                            type="radio"
                                            name="primaryModel"
                                            value={model}
                                            checked={formData.primaryModel === model}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-blue-400 bg-transparent border-gray-500 focus:ring-blue-500 focus:ring-1"
                                        />
                                        <span className="text-sm font-medium text-white">{model}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/10">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Clinical phase</label>
                                    <select
                                        name="clinicalPhase"
                                        value={formData.clinicalPhase}
                                        onChange={handleChange}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none"
                                    >
                                        <option value="N/A">N/A</option>
                                        <option value="Phase 1">Phase 1</option>
                                        <option value="Phase 2">Phase 2</option>
                                        <option value="Phase 3">Phase 3</option>
                                        <option value="Phase 4">Phase 4</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Masking strategy</label>
                                    <select
                                        name="maskingStrategy"
                                        value={formData.maskingStrategy}
                                        onChange={handleChange}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none"
                                    >
                                        <option value="None (open label)">None (open label)</option>
                                        <option value="Single blind">Single blind</option>
                                        <option value="Double blind">Double blind</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Execution mode</label>
                                    <select
                                        name="executionMode"
                                        value={formData.executionMode}
                                        onChange={handleChange}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none"
                                    >
                                        <option value="In-person">In-person</option>
                                        <option value="Remote">Remote</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* INCENTIVES CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">INCENTIVES</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Reward type</label>
                                    <select
                                        name="rewardType"
                                        value={formData.rewardType}
                                        onChange={handleChange}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Gift Card">Gift Card</option>
                                        <option value="Product">Product</option>
                                        <option value="None">None</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Incentive logic</label>
                                    <select
                                        name="incentiveLogic"
                                        value={formData.incentiveLogic}
                                        onChange={handleChange}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none"
                                    >
                                        <option value="Per study completion">Per study completion</option>
                                        <option value="Per visit">Per visit</option>
                                        <option value="Milestone based">Milestone based</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Stipend amount</label>
                                    <input
                                        type="number"
                                        name="stipendAmount"
                                        value={formData.stipendAmount}
                                        onChange={handleChange}
                                        placeholder="e.g. 150"
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Currency</label>
                                    <select
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleChange}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* STUDY KIT & ENROLLMENT CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">STUDY KIT & ENROLLMENT</h3>

                            <div className="space-y-6">
                                <label className="inline-flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-[#0B101B] cursor-pointer hover:border-blue-500 transition-colors w-max pr-6">
                                    <input
                                        type="checkbox"
                                        name="requireStudyKit"
                                        checked={formData.requireStudyKit}
                                        onChange={handleCheckboxChange}
                                        className="w-4 h-4 rounded text-blue-400 bg-transparent border-gray-500 focus:ring-blue-500 focus:ring-1"
                                    />
                                    <span className="text-sm font-medium text-white">Require study kit</span>
                                </label>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Target enrollment (number of participants)</label>
                                    <input
                                        type="number"
                                        name="targetEnrollment"
                                        value={formData.targetEnrollment}
                                        onChange={handleChange}
                                        placeholder="e.g. 60"
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* CONSENT METHOD CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">CONSENT METHOD</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { key: 'eConsent', label: 'E-consent' },
                                    { key: 'paperConsent', label: 'Paper consent' },
                                    { key: 'remoteWitness', label: 'Remote witness' },
                                    { key: 'lar', label: 'Legal authorized representative (LAR)' },
                                    { key: 'parentGuardian', label: 'Parent / guardian' }
                                ].map((method) => (
                                    <label key={method.key} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-[#0B101B] cursor-pointer hover:border-blue-500 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.consentMethods[method.key as keyof typeof formData.consentMethods]}
                                            onChange={(e) => handleNestedCheckboxChange('consentMethods', method.key, e.target.checked)}
                                            className="w-4 h-4 rounded text-blue-400 bg-transparent border-gray-500 focus:ring-blue-500 focus:ring-1"
                                        />
                                        <span className="text-sm font-medium text-white leading-tight">{method.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Footer Navigation specifically for Step 3 */}
                        <div className="pt-8 flex items-center justify-between gap-4 mt-8 border-t border-white/10">
                            <button
                                onClick={() => setCurrentStep(2)}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-xl leading-none">&larr;</span> Back
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center"
                            >
                                Save as draft
                            </button>
                            <button
                                onClick={() => setCurrentStep(4)}
                                className="w-1/2 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                Continue to research team <span className="text-xl leading-none">&rarr;</span>
                            </button>
                        </div>
                    </div>
                ) : currentStep === 4 ? (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Research team</h2>
                            <p className="text-slate-400 mt-1 text-sm md:text-base">Select or invite the personnel assigned to this study. They will be notified upon launch.</p>
                        </div>

                        {/* PIs CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">PRINCIPAL INVESTIGATOR(S)</h3>

                            <div className="space-y-4 mb-6">
                                {availablePIs && availablePIs.length > 0 ? availablePIs.map((pi: any) => (
                                    <div key={pi.id} className="flex items-center justify-between pb-4 border-b border-white/10 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-[#1e4460] flex items-center justify-center text-[#5daee9] font-bold text-sm">
                                                {pi.first_name?.[0] || ''}{pi.last_name?.[0] || ''}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white">{pi.first_name} {pi.last_name}</span>
                                                    <span className="text-[10px] bg-[#1e4460] text-[#5daee9] px-2 py-0.5 rounded font-bold uppercase">PI</span>
                                                </div>
                                                <div className="text-sm text-gray-400">{pi.organization || 'MusB Research Institute'}</div>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={(formData.selectedPIs as string[]).includes(pi.id)}
                                            onChange={() => handleArrayToggle('selectedPIs', pi.id)}
                                            className="w-5 h-5 rounded text-blue-400 bg-transparent border-gray-500 focus:ring-blue-500 focus:ring-1 cursor-pointer"
                                        />
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-500 italic pb-4 border-b border-white/10">No available PIs found in database.</p>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                <input
                                    type="email"
                                    name="invitePIEmail"
                                    value={formData.invitePIEmail}
                                    onChange={handleChange}
                                    placeholder="Invite PI by email address"
                                    className="flex-1 bg-[#0B101B] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                />
                                <button className="px-6 py-2.5 rounded-lg font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-colors whitespace-nowrap">
                                    Send invite
                                </button>
                            </div>
                        </div>

                        {/* CLINICAL COORDINATORS CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">CLINICAL COORDINATORS</h3>

                            <div className="space-y-4 mb-6">
                                {availableCoordinators && availableCoordinators.length > 0 ? availableCoordinators.map((coord: any) => (
                                    <div key={coord.id} className="flex items-center justify-between pb-4 border-b border-white/10 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-[#1e4a2a] flex items-center justify-center text-[#5de97a] font-bold text-sm">
                                                {coord.first_name?.[0] || ''}{coord.last_name?.[0] || ''}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white">{coord.first_name} {coord.last_name}</span>
                                                    <span className="text-[10px] bg-[#1e4a2a] text-[#5de97a] px-2 py-0.5 rounded font-bold uppercase">Coordinator</span>
                                                </div>
                                                <div className="text-sm text-gray-400">{coord.organization || 'MusB Research Institute'}</div>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={(formData.selectedCoordinators as string[]).includes(coord.id)}
                                            onChange={() => handleArrayToggle('selectedCoordinators', coord.id)}
                                            className="w-5 h-5 rounded text-blue-400 bg-transparent border-gray-500 focus:ring-blue-500 focus:ring-1 cursor-pointer"
                                        />
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-500 italic pb-4 border-b border-white/10">No available coordinators found in database.</p>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                <input
                                    type="email"
                                    name="inviteCoordinatorEmail"
                                    value={formData.inviteCoordinatorEmail}
                                    onChange={handleChange}
                                    placeholder="Invite coordinator by email address"
                                    className="flex-1 bg-[#0B101B] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                />
                                <button className="px-6 py-2.5 rounded-lg font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-colors whitespace-nowrap">
                                    Send invite
                                </button>
                            </div>
                        </div>

                        {/* SPONSOR PERSONNEL CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">SPONSOR PERSONNEL</h3>

                            <div className="space-y-4 mb-6">
                                {availableSponsorUsers && availableSponsorUsers.length > 0 ? availableSponsorUsers.map((sponsor: any) => (
                                    <div key={sponsor.id} className="flex items-center justify-between pb-4 border-b border-white/10 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-[#52411e] flex items-center justify-center text-[#e9b85d] font-bold text-sm">
                                                {sponsor.first_name?.[0] || ''}{sponsor.last_name?.[0] || ''}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white">{sponsor.first_name} {sponsor.last_name}</span>
                                                    <span className="text-[10px] bg-[#52411e] text-[#e9b85d] px-2 py-0.5 rounded font-bold uppercase">Sponsor</span>
                                                </div>
                                                <div className="text-sm text-gray-400">{sponsor.organization || 'External Sponsor Org'}</div>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={(formData.selectedSponsorUsers as string[]).includes(sponsor.id)}
                                            onChange={() => handleArrayToggle('selectedSponsorUsers', sponsor.id)}
                                            className="w-5 h-5 rounded text-blue-400 bg-transparent border-gray-500 focus:ring-blue-500 focus:ring-1 cursor-pointer"
                                        />
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-500 italic pb-4 border-b border-white/10">No available sponsor personnel found in database.</p>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                <input
                                    type="email"
                                    name="inviteSponsorEmail"
                                    value={formData.inviteSponsorEmail}
                                    onChange={handleChange}
                                    placeholder="Invite sponsor contact by email address"
                                    className="flex-1 bg-[#0B101B] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                />
                                <button className="px-6 py-2.5 rounded-lg font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-colors whitespace-nowrap">
                                    Send invite
                                </button>
                            </div>
                        </div>

                        <p className="text-slate-400 text-sm md:text-base text-center mt-2 mb-4">
                            Selected personnel will be automatically assigned to this study upon launch and will receive portal access.
                        </p>

                        {/* Footer Navigation specifically for Step 4 */}
                        <div className="pt-8 flex items-center justify-between gap-4 mt-8 border-t border-white/10">
                            <button
                                onClick={() => setCurrentStep(3)}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-xl leading-none">&larr;</span> Back
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center"
                            >
                                Save as draft
                            </button>
                            <button
                                onClick={() => setCurrentStep(5)}
                                className="w-1/2 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                Continue to screening form <span className="text-xl leading-none">&rarr;</span>
                            </button>
                        </div>
                    </div>
                ) : currentStep === 5 ? (
                    <div className="space-y-6">
                        <ScreenerBuilder
                            standalone={true}
                            initialQuestions={formData.screenerQuestions}
                            onSave={(questions) => {
                                setFormData({ ...formData, screenerQuestions: questions });
                            }}
                        />

                        {/* Footer Navigation specifically for Step 5 */}
                        <div className="pt-8 flex items-center justify-between gap-4 mt-8 border-t border-white/10">
                            <button
                                onClick={() => setCurrentStep(4)}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-xl leading-none">&larr;</span> Back
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center"
                            >
                                Save as draft
                            </button>
                            <button
                                onClick={() => setCurrentStep(6)}
                                className="w-1/2 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                Continue to questionnaires <span className="text-xl leading-none">&rarr;</span>
                            </button>
                        </div>
                    </div>
                ) : currentStep === 6 ? (
                    <div className="space-y-6">
                        <QuestionnaireBuilder
                            selectedTemplates={formData.selectedQuestionnaires}
                            onSelectTemplate={(id) => handleArrayToggle('selectedQuestionnaires', id)}
                        />

                        {/* Footer Navigation specifically for Step 6 */}
                        <div className="pt-8 flex items-center justify-between gap-4 mt-8 border-t border-white/10">
                            <button
                                onClick={() => setCurrentStep(5)}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-xl leading-none">&larr;</span> Back
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center"
                            >
                                Save as draft
                            </button>
                            <button
                                onClick={() => setCurrentStep(7)}
                                className="w-1/2 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                Continue to documents <span className="text-xl leading-none">&rarr;</span>
                            </button>
                        </div>
                    </div>
                ) : currentStep === 7 ? (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Study documents</h2>
                            <p className="text-slate-400 mt-1 text-sm md:text-base">Upload required documents. The consent form will appear in the participant portal for electronic signature if e-consent was selected.</p>
                        </div>

                        {/* INFORMED CONSENT FORM CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">INFORMED CONSENT FORM</h3>

                            <input
                                type="file"
                                ref={consentFileInputRef}
                                onChange={handleConsentFileChange}
                                className="hidden"
                                accept=".pdf,.doc,.docx"
                            />

                            {formData.consentFormFile ? (
                                <div className="p-6 border border-white/10 bg-[#0B101B] rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-lg flex items-center justify-center">
                                            <Upload className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{formData.consentFormFile.name}</p>
                                            <p className="text-sm text-gray-500">{(formData.consentFormFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, consentFormFile: null })}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => consentFileInputRef.current?.click()}
                                    className="border-2 border-dashed border-white/10 bg-[#0B101B] hover:border-blue-500 hover:bg-blue-600/5 transition-all rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer text-center"
                                >
                                    <Upload className="w-6 h-6 text-slate-400 mb-4" />
                                    <p className="text-white font-medium mb-1">Click to upload consent form (PDF, DOCX)</p>
                                    <p className="text-slate-400 text-sm">This will appear in the participant portal for online signature</p>
                                </div>
                            )}
                        </div>

                        {/* ADDITIONAL STUDY DOCUMENTS CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">ADDITIONAL STUDY DOCUMENTS</h3>

                            <input
                                type="file"
                                ref={additionalFileInputRef}
                                onChange={handleAdditionalFilesChange}
                                className="hidden"
                                multiple
                            />

                            <div
                                onClick={() => additionalFileInputRef.current?.click()}
                                className="border-2 border-dashed border-white/10 bg-[#0B101B] hover:border-blue-500 hover:bg-blue-600/5 transition-all rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer text-center mb-6"
                            >
                                <Upload className="w-6 h-6 text-slate-400 mb-4" />
                                <p className="text-white font-medium">Upload protocol, IRB approval, or other documents</p>
                            </div>

                            {formData.additionalDocuments.length > 0 && (
                                <div className="space-y-3">
                                    {formData.additionalDocuments.map((file, idx) => (
                                        <div key={idx} className="p-4 border border-white/10 bg-[#0B101B] rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 bg-gray-700 text-gray-300 rounded-lg flex items-center justify-center">
                                                    <Upload className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-white text-sm font-medium">{file.name}</p>
                                                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeAdditionalFile(idx)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Navigation specifically for Step 7 */}
                        <div className="pt-4 flex items-center justify-between gap-4">
                            <button
                                onClick={() => setCurrentStep(6)}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-xl leading-none">&larr;</span> Back
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center"
                            >
                                Save as draft
                            </button>
                            <button
                                onClick={() => setCurrentStep(8)}
                                className="w-1/2 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                Continue to review <span className="text-xl leading-none">&rarr;</span>
                            </button>
                        </div>
                    </div>
                ) : currentStep === 8 ? (
                    <div className="space-y-6">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white">Review & launch</h2>
                            <p className="text-gray-400 mt-2">Review your study configuration before submitting. Missing fields are highlighted below.</p>
                        </div>

                        {/* PROTOCOL */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Protocol</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                    <span className="text-sm text-gray-300 font-medium">Internal ID</span>
                                    {formData.internalId ? (
                                        <span className="text-sm text-emerald-400">{formData.internalId}</span>
                                    ) : (
                                        <span className="text-sm text-red-400">Not entered</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                    <span className="text-sm text-gray-300 font-medium">Sponsor</span>
                                    {formData.sponsor ? (
                                        <span className="text-sm text-emerald-400">{getSponsorDisplayName(formData.sponsor)}</span>
                                    ) : (
                                        <span className="text-sm text-red-400">Not entered</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center pb-2">
                                    <span className="text-sm text-gray-300 font-medium">Start / end date</span>
                                    {formData.startDate && formData.endDate ? (
                                        <span className="text-sm text-emerald-400">{formData.startDate} - {formData.endDate}</span>
                                    ) : (
                                        <span className="text-sm text-red-400">Not entered</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* STUDY INFORMATION */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Study Information</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                    <span className="text-sm text-gray-300 font-medium">Full title</span>
                                    {formData.fullTitle ? (
                                        <span className="text-sm text-emerald-400">{formData.fullTitle}</span>
                                    ) : (
                                        <span className="text-sm text-red-400">Not entered</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                    <span className="text-sm text-gray-300 font-medium">Public short title</span>
                                    {formData.shortTitle ? (
                                        <span className="text-sm text-emerald-400">{formData.shortTitle}</span>
                                    ) : (
                                        <span className="text-sm text-red-400">Not entered</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center pb-2">
                                    <span className="text-sm text-gray-300 font-medium">Category</span>
                                    {formData.category ? (
                                        <span className="text-sm text-emerald-400">{formData.category}</span>
                                    ) : (
                                        <span className="text-sm text-red-400">Not entered</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* TEAM & DESIGN */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Team & Design</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                    <span className="text-sm text-gray-300 font-medium">PI assigned</span>
                                    {formData.selectedPIs.length > 0 ? (
                                        <span className="text-sm text-emerald-400">
                                            {formData.selectedPIs.map(id => {
                                                const person = availablePIs?.find(p => String(p.id) === String(id));
                                                return person ? `${person.first_name || ''} ${person.last_name || ''}`.trim() || id : id;
                                            }).join(', ')}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-red-400">Not entered</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                    <span className="text-sm text-gray-300 font-medium">Coordinator assigned</span>
                                    {formData.selectedCoordinators.length > 0 ? (
                                        <span className="text-sm text-emerald-400">
                                            {formData.selectedCoordinators.map(id => {
                                                const person = availableCoordinators?.find(c => String(c.id) === String(id));
                                                return person ? `${person.first_name || ''} ${person.last_name || ''}`.trim() || id : id;
                                            }).join(', ')}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-red-400">Not entered</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                    <span className="text-sm text-gray-300 font-medium">Screening form</span>
                                    {formData.screenerQuestions.length > 0 ? (
                                        <span className="text-sm text-emerald-400">Screener configured ({formData.screenerQuestions.length} questions)</span>
                                    ) : (
                                        <span className="text-sm text-red-400">Not entered</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                    <span className="text-sm text-gray-300 font-medium">Questionnaires</span>
                                    {formData.selectedQuestionnaires.length > 0 ? (
                                        <span className="text-sm text-emerald-400">{formData.selectedQuestionnaires.length} assigned</span>
                                    ) : (
                                        <span className="text-sm text-red-400">Not entered</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center pb-2">
                                    <span className="text-sm text-gray-300 font-medium">Consent form</span>
                                    {formData.consentFormFile ? (
                                        <span className="text-sm text-emerald-400">{formData.consentFormFile.name}</span>
                                    ) : (
                                        <span className="text-sm text-yellow-500">Pending upload</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Navigation */}
                        <div className="pt-4 flex items-center justify-between gap-4">
                            <button
                                onClick={() => setCurrentStep(7)}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-xl leading-none">&larr;</span> Back
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center"
                            >
                                Save as draft
                            </button>
                            <button
                                onClick={handleResetForm}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center"
                            >
                                Reset form
                            </button>
                            <button
                                onClick={async () => {
                                    if (!onSave || isSubmitting) return;
                                    try {
                                        setIsSubmitting(true);
                                        await onSave(formData);
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                                disabled={isSubmitting}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Launching study...' : 'Preview & launch study'}
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
            <SponsorSearchModal
                isOpen={isSponsorModalOpen}
                onClose={() => setIsSponsorModalOpen(false)}
                availableSponsors={availableSponsors}
                onSelect={(sponsor: any) => {
                    const sponsorValue = sponsor?.id || sponsor?.name || sponsor?.organization || sponsor;
                    setFormData(prev => ({ ...prev, sponsor: String(sponsorValue) }));
                    setIsSponsorModalOpen(false);
                }}
            />
        </div>
    );
};

export default LaunchStudyForm;
