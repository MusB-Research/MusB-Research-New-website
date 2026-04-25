import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    Clock,
    Calendar,
    ArrowRight,
    Search,
    Stethoscope,
    ShieldCheck,
    Mail,
    Phone,
    Plus,
    Loader2,
    X,
    ChevronDown,
    CalendarDays
} from 'lucide-react';
import { fetchStudies, Study } from '../data/studies';
import { authFetch, API, getAccessToken } from '../utils/auth';
import { Skeleton } from './Participant/SharedComponents'; // Standard highlight: #00ADEF



type OutcomeType = 'ELIGIBLE' | 'MAYBE' | 'NOT_ELIGIBLE';

interface StepConfig {
    id: string;
    title: string;
    type: 'auto' | 'user_input' | 'clinical';
    editable?: boolean;
    required?: boolean;
}

export default function StudyScreener() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [study, setStudy] = useState<any | null>(null);
    const [dynamicForm, setDynamicForm] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAttemptingSubmit, setIsAttemptingSubmit] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isExistingParticipant, setIsExistingParticipant] = useState(false);
    const [isEnrolledInThisStudy, setIsEnrolledInThisStudy] = useState(false);
    const [isEnrolledElsewhere, setIsEnrolledElsewhere] = useState(false);
    const [enrollmentResult, setEnrollmentResult] = useState<any>(null);

    // Screen Path State
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [outcome, setOutcome] = useState<OutcomeType | null>(null);

    const initialFormData = {
        zipCode: '',
        location: '',
        trialsInLast30Days: '',
        healthConditions: [] as string[],
        cvConsent: false,
        fullName: '',
        email: '',
        phone: '',
        availability: ''
    };

    // Form Data
    const [formData, setFormData] = useState<any>(initialFormData);
    const [submittedData, setSubmittedData] = useState<any>(null);

    // ── Condition Details (per selected disease) ────────────────────────
    const [conditionDetails, setConditionDetails] = useState<Record<string, { severity: string; managed: string }>>({});

    // ── Location Lookup ───────────────────────────────────────────────────
    const [isLocating, setIsLocating] = useState(false);
    const locationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Time Tracking ─────────────────────────────────────────────────────
    const [startTime] = useState(Date.now());
    const [stepStartTimes, setStepStartTimes] = useState<Record<number, number>>({ 0: Date.now() });
    const [stepDurations, setStepDurations] = useState<Record<number, number>>({});

    // ── Dynamic Steps Logic ──────────────────────────────────────────────
    const [steps, setSteps] = useState<StepConfig[]>([
        { id: 'STEP2', title: 'ELIGIBILITY CRITERIA', type: 'user_input', editable: true, required: true },
        { id: 'STEP3', title: 'CONTACT & LOCATION', type: 'auto', editable: true, required: true }
    ]);

    useEffect(() => {
        const initializeScreener = async () => {
            setIsLoading(true);

            // 1. Check Auth & Existing Participant Status
            const token = localStorage.getItem('access') || sessionStorage.getItem('access');
            let currentUser: any = null;

            if (token) {
                try {
                    const res = await authFetch(`${API}/api/users/me/`);
                    if (res.ok) {
                        currentUser = await res.json();
                        if (currentUser.role === 'PARTICIPANT') {
                            setIsExistingParticipant(true);
                        }
                    }
                } catch (err) {
                    console.warn('Auth check failed', err);
                }
            }

            // 2. Fetch Study Data
            try {
                const res = await fetch(`${API}/api/public-studies/${id}/`);
                if (res.ok) {
                    const data = await res.json();
                    setStudy(data);

                    // Dynamic Steps from Config or Default
                    let enrichedSteps: StepConfig[] = [];
                    if (data.screener_config?.steps) {
                        enrichedSteps = data.screener_config.steps
                            .filter((s: any) => s.id !== 'STEP1')
                            .map((s: any) => ({
                                ...s,
                                title: s.title || (
                                    s.id === 'STEP2' ? 'ELIGIBILITY CRITERIA' :
                                        s.id === 'STEP3' ? 'CONTACT & LOCATION' : s.title
                                )
                            }));
                        setSteps(enrichedSteps);
                    } else {
                        // Default Fallback
                        enrichedSteps = steps;
                    }

                    // 3. If Logged In, check enrollment for THIS study and pre-fill from others
                    if (currentUser) {
                        try {
                            // Check THIS specific study first
                            const pRes = await authFetch(`${API}/api/participants/me/?study_id=${data.id}`);
                            if (pRes.ok) {
                                const pData = await pRes.json();
                                setIsEnrolledInThisStudy(true);
                                setEnrollmentResult(pData);

                                setFormData((prev: any) => ({
                                    ...prev,
                                    age: pData.age || currentUser.age || '',
                                    date_of_birth: pData.date_of_birth || currentUser.date_of_birth || '',
                                    zipCode: pData.zip_code || currentUser.zip_code || '',
                                    location: pData.location || `${currentUser.city || ''}, ${currentUser.state || ''}`,
                                    fullName: currentUser.decrypted_name || currentUser.full_name || `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim(),
                                    email: currentUser.email || '',
                                    phone: (currentUser.decrypted_phone && !currentUser.decrypted_phone.startsWith('gAAAA')) ? currentUser.decrypted_phone : (currentUser.phone_number && !currentUser.phone_number.startsWith('gAAAA')) ? currentUser.phone_number : '',
                                    cvConsent: true,
                                    availability: 'Continuing Participant'
                                }));
                            } else {
                                // Check if enrolled elsewhere (to trigger 'Apply' flow later)
                                if (currentUser.has_active_enrollment) {
                                    setIsEnrolledElsewhere(true);
                                }

                                // Not in THIS study, but check if they are in ANY other study for pre-filling
                                const allPRes = await authFetch(`${API}/api/participants/`);
                                if (allPRes.ok) {
                                    const allP = await allPRes.json();
                                    const records = Array.isArray(allP) ? allP : (allP.results || []);

                                    if (records.length > 0) {
                                        const latest = records.sort((a: any, b: any) =>
                                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                                        )[0];

                                        // Still pre-fill from latest record even if enrolled elsewhere
                                        setFormData((prev: any) => ({
                                            ...prev,
                                            age: latest.age || currentUser.age || '',
                                            date_of_birth: latest.date_of_birth || currentUser.date_of_birth || '',
                                            zipCode: latest.zip_code || currentUser.zip_code || '',
                                            location: latest.location || `${currentUser.city || ''}, ${currentUser.state || ''}`,
                                            fullName: currentUser.decrypted_name || currentUser.full_name || `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim(),
                                            email: currentUser.email || '',
                                            phone: currentUser.decrypted_phone || currentUser.phone_number || '',
                                            cvConsent: true
                                        }));
                                    }
                                }
                            }


                            // 🚀 Master Profile logic for Existing Users (Requirement 4 & 5)
                            if (currentUser && !currentUser.profile_incomplete) {
                                // Filter steps to only show 'user_input' (screener question)
                                const filteredSteps = enrichedSteps.filter((s: any) => s.type === 'user_input');
                                setSteps(filteredSteps);
                                setCurrentStepIndex(0);
                                setIsExistingParticipant(true);
                            } else {
                                // New or incomplete user: Show all steps
                                setSteps(enrichedSteps);
                                // Auto-navigation for enrolled but incomplete profile: Jump to first 'user_input' step
                                const firstInputIndex = data.screener_config?.steps?.findIndex((s: any) => s.type === 'user_input') ?? 1;
                                setCurrentStepIndex(firstInputIndex >= 0 ? firstInputIndex : 1);
                            }
                        } catch (pErr) {
                            console.debug('Enrollment pre-fill skip');
                            setSteps(enrichedSteps);
                        }
                    } else {
                        setSteps(enrichedSteps);
                    }

                    // 4. Fetch Dynamic Eligibility Form
                    const formRes = await fetch(`${API}/api/forms/?study_id=${data.id}&public=true`);
                    if (formRes.ok) {
                        const forms = await formRes.json();
                        const formList = Array.isArray(forms) ? forms : (forms.results || []);
                        const relevantForm = formList
                            .filter((f: any) => f.is_published)
                            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                        if (relevantForm) setDynamicForm(relevantForm);
                    }
                } else {
                    navigate('/trials');
                }
            } catch (e) {
                console.error("Initialization failed", e);
                navigate('/trials');
            } finally {
                // Load from LocalStorage for new users
                if (!token) {
                    const saved = localStorage.getItem(`screener_backup_${id}`);
                    if (saved) {
                        try {
                            const parsed = JSON.parse(saved);
                            setFormData((prev: any) => ({ ...prev, ...parsed }));
                        } catch (err) { }
                    }
                }
                setIsLoading(false);
            }
        };

        initializeScreener();
    }, [id, navigate]);

    // Persist to LocalStorage for Guests
    useEffect(() => {
        if (!isExistingParticipant && !isLoading && study) {
            localStorage.setItem(`screener_backup_${id}`, JSON.stringify(formData));
        }
    }, [formData, study, id, isExistingParticipant, isLoading]);

    const handleZipChange = (val: string) => {
        setFormData((prev: any) => ({ ...prev, zipCode: val }));
        if (locationTimerRef.current) clearTimeout(locationTimerRef.current);

        if (val.length >= 4) {
            setIsLocating(true);
            locationTimerRef.current = setTimeout(async () => {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(val)}&format=jsonv2&addressdetails=1`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.length > 0) {
                            const address = data[0].address;
                            const city = address.city || address.town || address.village || address.county || '';
                            const state = address.state || '';
                            const country = address.country || '';
                            const parts = [city, state, country].filter(Boolean);
                            if (parts.length > 0) {
                                setFormData((prev: any) => ({ ...prev, location: parts.join(', ') }));
                            }
                        }
                    }
                } catch (e) { } finally { setIsLocating(false); }
            }, 600);
        } else { setIsLocating(false); }
    };

    const validateStep = (index: number) => {
        const stepCfg = steps[index];
        if (!stepCfg) return true;


        if (stepCfg.id === 'STEP2') {
            const allDynamicFilled = ((stepCfg as any).questions || []).every((q: any) => !q.required || formData[q.id || `idx_${steps.indexOf(stepCfg)}`]);
            return formData.trialsInLast30Days && allDynamicFilled;
        }
        if (stepCfg.id === 'STEP3') {
            return formData.fullName && formData.email && formData.phone && formData.cvConsent && formData.availability && formData.location;
        }
        return true;
    };

    const handleNext = async () => {
        setIsAttemptingSubmit(true);
        if (!validateStep(currentStepIndex)) {
            setError('Please complete all mandatory fields in this step.');
            return;
        }
        setError(null);

        // If this is the last step, perform final submission logic
        if (currentStepIndex === steps.length - 1) {
            const now = Date.now();
            const lastStepDuration = (now - stepStartTimes[currentStepIndex]) / 1000;
            const updatedDurations = { ...stepDurations, [currentStepIndex]: lastStepDuration };
            await handleSubmit(updatedDurations);
        } else {
            const now = Date.now();
            const duration = (now - stepStartTimes[currentStepIndex]) / 1000;
            setStepDurations(prev => ({ ...prev, [currentStepIndex]: duration }));
            setStepStartTimes(prev => ({ ...prev, [currentStepIndex + 1]: now }));

            setIsAttemptingSubmit(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setCurrentStepIndex(currentStepIndex + 1);
        }
    };

    const handleBack = () => {
        setError(null);
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1);
        }
    };

    const isFieldInvalid = (field: string) => {
        if (!isAttemptingSubmit) return false;
        if (field === 'age') return !formData.age;
        if (field === 'location') return !formData.location;
        if (field === 'fullName') return !formData.fullName;
        if (field === 'email') return !formData.email;
        if (field === 'phone') return !formData.phone;
        if (field === 'cvConsent') return !formData.cvConsent;
        if (field === 'availability') return !formData.availability;
        return false;
    };

    const handleSubmit = async (finalStepDurations?: Record<number, number>) => {
        setIsLoading(true);
        let finalOutcome: OutcomeType = 'ELIGIBLE';

        const durations = finalStepDurations || stepDurations;
        const totalDuration = (Date.now() - startTime) / 1000;


        // Simple mock eligibility check (can be improved by study.eligibility_criteria in DB)
        if (formData.trialsInLast30Days === 'Yes') finalOutcome = 'MAYBE';

        setOutcome(finalOutcome);

        try {
            // Coordinator Notification
            await authFetch(`${API}/api/contact/submit/`, {
                method: 'POST',
                body: JSON.stringify({
                    name: formData.fullName || 'Screening Submission',
                    email: formData.email,
                    phone: formData.phone,
                    study_id: study.id,
                    inquiry_type_slug: 'screening',
                    metadata: {
                        outcome: finalOutcome,
                        formData,
                        conditionDetails,
                        performance: {
                            total_seconds: totalDuration,
                            step_durations: durations
                        }
                    }
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            // Inquiry Form to info@musbresearch.com
            await authFetch(`${API}/api/contact/submit/`, {
                method: 'POST',
                body: JSON.stringify({
                    name: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    recipient_override: 'info@musbresearch.com',
                    subject_prefix: '[MusB Inquiry]',
                    message: `New study eligibility inquiry for ${study.title}. Outcome: ${finalOutcome}.`,
                    metadata: {
                        source: 'Participant Screener',
                        study_title: study.title,
                        eligibility: finalOutcome
                    }
                })
            });

            // 🚀 Trigger Enrollment for Logged-in Users (Requirement 8)
            if (getAccessToken()) {
                const enrollmentStatus = finalOutcome === 'ELIGIBLE' ? 'CONSENTED' : 'PENDING_REVIEW';
                let sid = enrollmentResult?.participant_sid || enrollmentResult?.sid;

                if (!isEnrolledInThisStudy) {
                    const enrollRes = await authFetch(`${API}/api/studies/${id}/enroll/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: enrollmentStatus })
                    });
                    if (enrollRes.ok) {
                        const eData = await enrollRes.json();
                        setEnrollmentResult(eData);
                        sid = eData.participant_sid || eData.sid;
                    }
                }

                // 🚀 CRITICAL FIX: Sync eligibility data to the participant record
                if (sid) {
                    await authFetch(`${API}/api/participants/${sid}/submit_eligibility/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ eligibility_data: formData })
                    });
                }
            }
            // 🚀 Clear Local Backup and Reset Form for next use (Requirement: "clean the page")
            localStorage.removeItem(`screener_backup_${id}`);
            setSubmittedData({ ...formData });
            setFormData(initialFormData);
            setConditionDetails({});
            setError(null);
            setIsAttemptingSubmit(false);

        } catch (e) {
            console.error("Submission processing failed", e);
        }

        setIsLoading(false);
    };

    const renderProgress = () => {
        const progress = outcome ? 100 : ((currentStepIndex + 1) / steps.length) * 100;
        return (
            <div className="absolute top-0 left-0 w-full h-1 bg-white/5 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-[#00ADEF] shadow-[0_0_10px_rgba(0,173,239,0.8)]"
                />
            </div>
        );
    };

    if (isLoading || !study) {
        return (
            <div className="min-h-screen pt-40 pb-24 px-4">
                <div className="max-w-2xl mx-auto space-y-8">
                    <Skeleton className="h-10 w-48 mb-8" />
                    <div className="bg-[#0a0f1d] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl space-y-6">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-8 w-3/4" />
                        <div className="space-y-3 pt-6">
                            <Skeleton className="h-14 w-full rounded-2xl" />
                            <Skeleton className="h-14 w-full rounded-2xl" />
                            <Skeleton className="h-14 w-full rounded-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentStep = steps[currentStepIndex];
    const isStepReadOnly = (isEnrolledInThisStudy || isEnrolledElsewhere) && currentStep.type === 'auto';

    return (
        <div className="min-h-screen pt-32 pb-24 px-4 bg-transparent text-slate-200">
            <div className="max-w-2xl mx-auto">

                {/* Status Bar */}
                {(isEnrolledInThisStudy || isEnrolledElsewhere) && (
                    <div className="mb-6 bg-[#00ADEF]/10 border border-[#00ADEF]/20 py-4 px-6 rounded-2xl flex items-center gap-3 text-[#00ADEF] text-xs font-black uppercase tracking-widest">
                        <ShieldCheck className="w-5 h-5" />
                        Authenticated: Some fields are locked based on your profile
                    </div>
                )}

                {/* Progress Indicator */}
                <div className="mb-12 space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[12px] font-black uppercase tracking-[0.2em] text-[#00ADEF]/50">Progress</span>
                        <span className="text-[12px] font-black uppercase tracking-[0.2em] text-[#00ADEF]">{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-[#00ADEF] shadow-[0_0_20px_rgba(0,173,239,0.5)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                        />
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {!outcome ? (
                        <motion.div
                            key={currentStepIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-[#0a0f1d]/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-10 md:p-14 shadow-2xl relative overflow-hidden"
                        >
                            <div className="relative z-10">
                                <div className="mb-10">
                                    <h1 className="text-3xl font-black text-white italic tracking-tighter leading-none mb-2 whitespace-nowrap">
                                        Step {currentStepIndex + 1}: {currentStep.title}
                                    </h1>
                                </div>

                                <div className="min-h-[350px] space-y-8">


                                    {currentStep.id === 'STEP2' && (
                                        <div className="space-y-12">

                                            {/* Section A: Quick Eligibility Check (Fixed) */}
                                            <div className="space-y-6 bg-white/[0.02] p-8 rounded-[2rem] border border-white/5 shadow-2xl shadow-black/20">
                                                <div className="space-y-2">
                                                    <span className="text-xs font-bold tracking-wide text-white italic block">Quick eligibility check</span>
                                                    <h4 className="text-lg font-bold text-slate-300 leading-relaxed">Have you participated in any other clinical trial in the last 30 days?</h4>
                                                </div>
                                                <div className="flex gap-4">
                                                    {['Yes', 'No'].map(opt => (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, trialsInLast30Days: opt })}
                                                            className={`flex-1 py-5 rounded-2xl border text-sm font-bold transition-all ${formData.trialsInLast30Days === opt ? 'bg-[#00ADEF] border-[#00ADEF] text-white shadow-[0_0_20px_rgba(0,173,239,0.3)]' : 'bg-white/10 border-white/10 text-slate-200 hover:bg-white/20'}`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Section B: Study-Specific Questions (Dynamic) */}
                                            {((currentStep as any).questions || []).length > 0 && (
                                                <div className="space-y-10 pl-4 border-l-2 border-white/5">
                                                    {((currentStep as any).questions as any[]).map((q: any, i: number) => {
                                                        const fid = q.id || `idx_${i}`;
                                                        const isMissing = isAttemptingSubmit && q.required && !formData[fid];
                                                        return (
                                                            <div key={fid} className="space-y-4">
                                                                <div className="flex items-baseline gap-3">
                                                                    <h4 className={`text-lg font-black italic tracking-tight transition-colors leading-relaxed ${isMissing ? 'text-red-500' : 'text-white'}`}>
                                                                        {q.label} {q.required && <span className="text-[#00ADEF] ml-0.5">*</span>}
                                                                    </h4>
                                                                    {q.type === 'date' && (
                                                                        <span className="text-[13px] font-black uppercase tracking-widest text-slate-500 italic opacity-50">
                                                                            (Month / Day / Year)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {q.type?.toLowerCase().includes('text') || q.type === 'number' ? (
                                                                    <input
                                                                        type="text"
                                                                        className={`w-full bg-[#161f35] border rounded-2xl px-8 py-5 text-white text-xl outline-none transition-all ${isMissing ? 'border-red-500/50' : 'border-white/10 focus:border-[#00ADEF]/80'}`}
                                                                        value={formData[fid] || ''}
                                                                        onChange={(e) => setFormData({ ...formData, [fid]: e.target.value })}
                                                                        placeholder={q.placeholder || "Enter response..."}
                                                                    />
                                                                ) : q.type === 'date' ? (
                                                                    <input
                                                                        type="date"
                                                                        className={`w-full bg-[#161f35] border rounded-2xl px-8 py-5 text-white text-xl outline-none transition-all ${isMissing ? 'border-red-500/50' : 'border-white/10 focus:border-[#00ADEF]/80'}`}
                                                                        value={formData[fid] || ""}
                                                                        onChange={(e) => setFormData({ ...formData, [fid]: e.target.value })}
                                                                    />
                                                                ) : q.type === 'dropdown' ? (
                                                                    <div className="relative group/select">
                                                                        <select
                                                                            className={`w-full bg-[#0d1424] border rounded-2xl px-8 py-5 text-white outline-none appearance-none transition-all ${isMissing ? 'border-red-500/50' : 'border-white/5 focus:border-[#00ADEF]/50 hover:border-white/20'}`}
                                                                            value={formData[fid] || ''}
                                                                            onChange={(e) => setFormData({ ...formData, [fid]: e.target.value })}
                                                                        >
                                                                            <option value="">Select an option...</option>
                                                                            {(q.options || []).map((opt: string) => (
                                                                                <option key={opt} value={opt} className="bg-[#0d1424] text-white">{opt}</option>
                                                                            ))}
                                                                        </select>
                                                                        <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none group-hover/select:text-[#00ADEF] transition-colors" />
                                                                    </div>
                                                                ) : q.type === 'choice' ? (
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                        {(q.options || ['Yes', 'No']).map((opt: string) => {
                                                                            const isBinary = (q.options?.length === 2) && q.options.includes('Yes') && q.options.includes('No');
                                                                            return (
                                                                                <button
                                                                                    key={opt}
                                                                                    onClick={() => setFormData({ ...formData, [fid]: opt })}
                                                                                    type="button"
                                                                                    className={`px-6 py-4 border text-sm font-bold transition-all text-center ${isBinary ? 'rounded-2xl' : 'rounded-full'} ${formData[fid] === opt ? 'bg-[#00ADEF] border-[#00ADEF] text-white shadow-[0_0_20px_rgba(0,173,239,0.3)]' : 'bg-white/10 border-white/10 text-slate-200 hover:bg-white/20'}`}
                                                                                >
                                                                                    {opt}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex gap-4">
                                                                        {(['Yes', 'No']).map((opt: string) => (
                                                                            <button
                                                                                key={opt}
                                                                                onClick={() => setFormData({ ...formData, [fid]: opt })}
                                                                                type="button"
                                                                                className={`flex-1 py-5 rounded-2xl border text-sm font-bold transition-all ${formData[fid] === opt ? 'bg-[#00ADEF] border-[#00ADEF] text-white shadow-[0_0_20px_rgba(0,173,239,0.3)]' : 'bg-white/10 border-white/10 text-slate-200 hover:bg-white/20'}`}
                                                                            >
                                                                                {opt}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {currentStep.id === 'STEP3' && (
                                        <div className="space-y-8">
                                            {/* Location Section Moved to Step 2 (Contact & Location) */}
                                            <div className="space-y-8 bg-white/[0.02] p-8 rounded-[2rem] border border-white/5 shadow-2xl shadow-black/20">
                                                <div className="space-y-4">
                                                    <label className="text-lg font-black italic tracking-tight text-white block">Zip / Postal code</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            readOnly={isStepReadOnly}
                                                            value={formData.zipCode}
                                                            onChange={(e) => handleZipChange(e.target.value)}
                                                            className={`w-full bg-[#161f35] border border-white/10 rounded-2xl px-8 py-5 text-white text-xl outline-none focus:border-[#00ADEF]/50 ${isStepReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            placeholder="Enter Zip Code"
                                                        />
                                                        {isLocating && <Loader2 className="absolute right-6 top-6 w-5 h-5 text-[#00ADEF] animate-spin" />}
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <label className={`text-lg font-black italic tracking-tight block ${isFieldInvalid('location') ? 'text-red-500' : 'text-white'}`}>Current city, state, country</label>
                                                    <input
                                                        type="text"
                                                        readOnly={isStepReadOnly}
                                                        value={formData.location}
                                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                        className={`w-full bg-[#161f35] border rounded-2xl px-8 py-5 text-white text-lg outline-none transition-all ${isFieldInvalid('location') ? 'border-red-500/50' : 'border-white/10 focus:border-[#00ADEF]/80'} ${isStepReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        placeholder="Auto-filled or enter manually"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className={`text-lg font-bold ${isFieldInvalid('fullName') ? 'text-red-500' : 'text-slate-300'}`}>Full name</label>
                                                <input
                                                    type="text"
                                                    readOnly={isStepReadOnly}
                                                    value={formData.fullName}
                                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                    className={`w-full bg-[#0d1424] border rounded-2xl px-8 py-5 text-slate-200 text-xl outline-none transition-all ${isFieldInvalid('fullName') ? 'border-red-500/50' : 'border-white/5 focus:border-[#00ADEF]/50'} ${isStepReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className={`text-lg font-bold ${isFieldInvalid('email') ? 'text-red-500' : 'text-slate-300'}`}>Email address</label>
                                                <input
                                                    type="email"
                                                    readOnly={isStepReadOnly}
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className={`w-full bg-[#0d1424] border rounded-2xl px-8 py-5 text-slate-200 text-xl outline-none transition-all ${isFieldInvalid('email') ? 'border-red-500/50' : 'border-white/5 focus:border-[#00ADEF]/50'} ${isStepReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    placeholder="you@example.com"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className={`text-lg font-bold ${isFieldInvalid('phone') ? 'text-red-500' : 'text-slate-300'}`}>Phone number</label>
                                                <input
                                                    type="tel"
                                                    readOnly={isStepReadOnly}
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className={`w-full bg-[#0d1424] border rounded-2xl px-8 py-5 text-slate-200 text-xl outline-none transition-all ${isFieldInvalid('phone') ? 'border-red-500/50' : 'border-white/5 focus:border-[#00ADEF]/50'} ${isStepReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    placeholder="e.g. +1 (555) 000-0000"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className={`text-lg font-bold ${isFieldInvalid('availability') ? 'text-red-500' : 'text-slate-300'}`}>Availability for onboarding call</label>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    {['Morning', 'Afternoon', 'Evening'].map((opt) => (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, availability: opt })}
                                                            className={`py-5 rounded-full border text-base font-bold transition-all ${formData.availability === opt ? 'bg-[#00ADEF] border-[#00ADEF] text-white shadow-[0_0_20px_rgba(0,173,239,0.3)]' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="pt-6">
                                                <label className={`flex items-start gap-5 p-6 rounded-2xl border cursor-pointer transition-all ${isFieldInvalid('cvConsent') ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                                                    <div className="relative flex items-center mt-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.cvConsent}
                                                            onChange={(e) => setFormData({ ...formData, cvConsent: e.target.checked })}
                                                            className="w-6 h-6 rounded border-white/20 bg-black appearance-none checked:bg-white transition-all cursor-pointer"
                                                        />
                                                        {formData.cvConsent && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-black"><CheckCircle2 className="w-4 h-4" /></div>}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <span className="text-base font-bold tracking-wide text-white block italic">Consent to contact</span>
                                                        <p className="text-base text-slate-500 leading-relaxed font-bold tracking-tight">By checking this box, I agree that the research team may contact me via email or phone regarding my eligibility and potential study participation.</p>
                                                    </div>
                                                </label>
                                            </div>

                                        </div>
                                    )}
                                </div>

                                {/* Nav */}
                                <div className="flex items-center justify-between pt-12 mt-auto">
                                    <button
                                        onClick={handleBack}
                                        className={`px-6 py-4 text-sm font-bold tracking-wide transition-all flex items-center gap-2 ${currentStepIndex === 0 ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        <ChevronLeft className="w-4 h-4" /> Back
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        disabled={isLoading}
                                        className="px-10 py-4 bg-[#00ADEF] border border-[#00ADEF] hover:bg-white hover:text-[#00ADEF] text-white rounded-2xl text-sm font-black tracking-widest transition-all flex items-center gap-3 group shadow-2xl shadow-[#00ADEF]/20"
                                    >
                                        {isLoading ? 'Syncing...' : (currentStepIndex === steps.length - 1 ? 'Check result' : 'Next')}
                                        {!isLoading && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                                    </button>
                                </div>

                                {/* Standard Footer */}
                                <div className="mt-12 flex justify-center items-center gap-3 opacity-40 grayscale">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="text-[13px] font-bold tracking-wide text-slate-400">Secure HIPAA-compliant screening</span>
                                </div>

                            </div>

                            {error && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[12px] font-bold tracking-wide text-center animate-pulse">
                                    <AlertCircle className="w-4 h-4 inline mr-2 mb-0.5" /> {error}
                                </motion.div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-12 text-center space-y-10 shadow-2xl relative"
                        >
                            {outcome === 'ELIGIBLE' && (
                                <div className="space-y-10">
                                    <div className="w-24 h-24 bg-emerald-500/20 border border-emerald-500/40 rounded-3xl flex items-center justify-center mx-auto text-emerald-400">
                                        <CheckCircle2 className="w-12 h-12" />
                                    </div>
                                    <div className="space-y-4">
                                        <h1 className="text-4xl font-black text-white italic tracking-tighter">
                                            {enrollmentResult?.is_pending_multi_enrollment ? 'Application pending review' : 'Application received'}
                                        </h1>
                                        <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
                                            Thank you for submitting the form. We have received your details and our clinical team will contact you shortly.
                                        </p>
                                        {(!isExistingParticipant && !getAccessToken()) ? (
                                            <p className="text-cyan-400 text-sm font-bold mt-4 animate-pulse">
                                                Please create an account or login with Gmail to complete your enrollment.
                                            </p>
                                        ) : (
                                            <p className="text-emerald-400 text-sm font-bold mt-4 animate-pulse">
                                                Success! Your clinical profile has been securely synchronized with the trial repository.
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (isExistingParticipant || getAccessToken()) {
                                                navigate('/dashboard/participant');
                                            } else {
                                                // New User Flow: Redirect to signin with data
                                                navigate('/signin', {
                                                    state: {
                                                        redirectTo: `/dashboard/participant`,
                                                        email: submittedData?.email || formData.email,
                                                        fullName: submittedData?.fullName || formData.fullName,
                                                        screenerData: submittedData || formData
                                                    }
                                                });
                                            }
                                        }}
                                        className="w-full py-6 bg-[#00ADEF] text-white rounded-3xl font-bold text-sm tracking-wide hover:bg-white hover:text-[#00ADEF] transition-all shadow-2xl shadow-[#00ADEF]/20 active:scale-[0.98]"
                                    >
                                        {isExistingParticipant || getAccessToken() ? 'Go to Dashboard' : 'Login or Create Account'}
                                    </button>
                                </div>
                            )}

                            {outcome !== 'ELIGIBLE' && (
                                <div className="space-y-8 py-10">
                                    <div className="w-20 h-20 bg-slate-800 border border-white/10 rounded-3xl flex items-center justify-center mx-auto text-slate-500">
                                        <AlertCircle className="w-10 h-10" />
                                    </div>
                                    <h1 className="text-3xl font-black text-white italic text-slate-400">Status: Review required</h1>
                                    <div className="bg-slate-950/50 p-8 rounded-3xl border border-white/5">
                                        <p className="text-slate-400 font-medium leading-relaxed">
                                            Thank you for submitting the form. We have received your details and our clinical team will contact you shortly.
                                        </p>
                                        {(isExistingParticipant || getAccessToken()) && (
                                            <p className="text-emerald-400 text-sm font-bold mt-6 animate-pulse">
                                                Success! Your clinical profile has been securely synchronized with the trial repository.
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (isExistingParticipant || getAccessToken()) {
                                                navigate('/dashboard/participant');
                                            } else {
                                                navigate('/signin', {
                                                    state: {
                                                        redirectTo: `/dashboard/participant`,
                                                        email: submittedData?.email || formData.email,
                                                        fullName: submittedData?.fullName || formData.fullName,
                                                        screenerData: submittedData || formData
                                                    }
                                                });
                                            }
                                        }}
                                        className="w-full py-5 bg-[#00ADEF] text-white rounded-2xl font-bold text-[11px] tracking-widest uppercase transition-all shadow-lg shadow-[#00ADEF]/20"
                                    >
                                        {isExistingParticipant || getAccessToken() ? 'Go to Dashboard' : 'Login or Create Account'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
