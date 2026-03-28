import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
    X
} from 'lucide-react';
import { fetchStudies, Study } from '../data/studies';
import { authFetch , API } from '../utils/auth';

type ScreenerStep = 'STEP1' | 'STEP2' | 'STEP3' | 'OUTCOME';
type OutcomeType = 'ELIGIBLE' | 'MAYBE' | 'NOT_ELIGIBLE';

export default function StudyScreener() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [study, setStudy] = useState<any | null>(null);
    const [dynamicForm, setDynamicForm] = useState<any | null>(null);
    const [step, setStep] = useState<ScreenerStep>('STEP1');
    const [outcome, setOutcome] = useState<OutcomeType>('ELIGIBLE');
    const [isLoading, setIsLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState<any>({
        age: '',
        zipCode: '',
        location: '',
        trialsInLast30Days: '',
        healthConditions: [] as string[],
        cvConsent: false,
        fullName: '',
        email: '',
        phone: '',
        availability: ''
    });

    useEffect(() => {
        const fetchStudyAndForm = async () => {
            setIsLoading(true);
            const apiUrl = API;
            try {
                // Use public-studies for recruitment/screening to avoid assignment restrictions
                const res = await fetch(`${apiUrl}/api/public-studies/${id}/`);
                if (res.ok) {
                    const data = await res.json();
                    setStudy({
                        ...data,
                        id: data.id, 
                        protocol_id: data.protocol_id,
                        duration: data.duration || "4-12 Weeks"
                    });

                    // Try to fetch dynamic form for this study
                    // Use regular fetch as screeners are public (ReadOnly allowed on backend)
                    const formRes = await fetch(`${apiUrl}/api/forms/?study_id=${data.id}`);
                    if (formRes.ok) {
                        const forms = await formRes.json();
                        // Filter for correct title and sort by most recent to ensure we don't load zombie/duplicate forms
                        const relevantForm = forms
                            .filter((f: any) => f.title === 'Screener Form' || f.is_published)
                            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                        
                        if (relevantForm) {
                            setDynamicForm(relevantForm);
                        }
                    }
                } else {
                    // Fallback to public fetch if auth fetch fails
                    const studies = await fetchStudies();
                    const foundStudy = studies.find(s => s.id === id);
                    if (foundStudy) setStudy(foundStudy);
                    else navigate('/trials');
                }
            } catch (e) {
                console.error("Error fetching study for screener:", e);
                // Last ditch effort: public fetch
                const studies = await fetchStudies();
                const foundStudy = studies.find(s => s.id === id);
                if (foundStudy) setStudy(foundStudy);
                else navigate('/trials');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudyAndForm();
    }, [id, navigate]);

    const [error, setError] = useState<string | null>(null);
    const [isAttemptingSubmit, setIsAttemptingSubmit] = useState(false);

    // ── Condition Details (per selected disease) ────────────────────────
    const [conditionDetails, setConditionDetails] = useState<Record<string, { severity: string; managed: string }>>({});

    // ── Location Lookup ───────────────────────────────────────────────────
    const [isLocating, setIsLocating] = useState(false);
    const locationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleZipChange = (val: string) => {
        setFormData((prev: any) => ({ ...prev, zipCode: val }));

        if (locationTimerRef.current) clearTimeout(locationTimerRef.current);

        if (val.length >= 4) {
            setIsLocating(true);
            locationTimerRef.current = setTimeout(async () => {
                try {
                    // Use openstreetmap nominatim for global postal code lookup
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(val)}&format=jsonv2&addressdetails=1`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.length > 0) {
                            const address = data[0].address;
                            // Format: City/Town, State, Country
                            const city = address.city || address.town || address.village || address.county || '';
                            const state = address.state || '';
                            const country = address.country || '';

                            const parts = [city, state, country].filter(Boolean);
                            if (parts.length > 0) {
                                setFormData((prev: any) => ({ ...prev, location: parts.join(', ') }));
                            }
                        }
                    }
                } catch (e) {
                    console.error("Location lookup failed", e);
                } finally {
                    setIsLocating(false);
                }
            }, 600);
        } else {
            setIsLocating(false);
        }
    };

    const validateCurrentStep = () => {
        if (step === 'STEP1') {
            return formData.age && formData.location;
        }
        if (step === 'STEP2') {
            if (dynamicForm) {
                const questions = Array.isArray(dynamicForm.schema) 
                    ? dynamicForm.schema 
                    : (dynamicForm.schema.sections 
                        ? dynamicForm.schema.sections.flatMap((s: any) => s.questions || [])
                        : (dynamicForm.schema.questions || []));
                return questions.every((q: any) => {
                    if (!q.required) return true;
                    return !!formData[q.id || q.key];
                });
            } else {
                return formData.trialsInLast30Days && formData.healthConditions.length > 0;
            }
        }
        if (step === 'STEP3') {
            return formData.fullName && formData.email && formData.phone && formData.availability && formData.cvConsent;
        }
        return true;
    };

    const handleNext = () => {
        setIsAttemptingSubmit(true);
        if (!validateCurrentStep()) {
            setError('Please fill in all required fields to proceed.');
            return;
        }
        setError(null);
        setIsAttemptingSubmit(false);
        if (step === 'STEP1') setStep('STEP2');
        else if (step === 'STEP2') setStep('STEP3');
        else if (step === 'STEP3') handleSubmit();
    };

    const isFieldMissing = (field: string) => {
        if (!isAttemptingSubmit) return false;
        if (step === 'STEP1') {
            if (field === 'age') return !formData.age;
            if (field === 'location') return !formData.location;
        }
        if (step === 'STEP2') {
            if (dynamicForm) {
                return !formData[field];
            } else {
                if (field === 'trialsInLast30Days') return !formData.trialsInLast30Days;
                if (field === 'healthConditions') return formData.healthConditions.length === 0;
            }
        }
        if (step === 'STEP3') {
            if (field === 'fullName') return !formData.fullName;
            if (field === 'email') return !formData.email;
            if (field === 'phone') return !formData.phone;
            if (field === 'availability') return !formData.availability;
            if (field === 'cvConsent') return !formData.cvConsent;
        }
        return false;
    };

    const handleBack = () => {
        if (step === 'STEP2') setStep('STEP1');
        else if (step === 'STEP3') setStep('STEP2');
    };

    const handleSubmit = async () => {
        setIsLoading(true);

        let finalOutcome: OutcomeType = 'ELIGIBLE';

        const ageNum = parseInt(formData.age || '0');
        if (ageNum < 18 || !formData.location) {
            finalOutcome = 'NOT_ELIGIBLE';
        } else if (dynamicForm) {
            const questions = Array.isArray(dynamicForm.schema) ? dynamicForm.schema : (dynamicForm.schema.questions || []);
            if (questions.some((q: any) => q.required && !formData[q.id || q.key])) {
                finalOutcome = 'MAYBE';
            }
        } else {
            if (formData.healthConditions.includes('None of the above')) {
                finalOutcome = 'ELIGIBLE';
            } else if (formData.healthConditions.length > 0) {
                finalOutcome = 'MAYBE';
            }
        }

        setOutcome(finalOutcome);

        try {
            const apiUrl = API || 'http://localhost:8000';
            await authFetch(`${apiUrl}/api/contact/submit/`, {
                method: 'POST',
                body: JSON.stringify({
                    name: formData.fullName || 'Anonymous Participant',
                    email: formData.email || 'no-email@provided.com',
                    phone: formData.phone || 'N/A',
                    message: `
                        Screening Results for ${study?.protocol_id || study?.title}:
                        Outcome: ${finalOutcome}
                        
                        PRIMARY DATA:
                        ${JSON.stringify(formData, null, 2)}
                        
                        CONDITION DETAILS:
                        ${JSON.stringify(conditionDetails, null, 2)}
                    `,
                    inquiry_type: 1,
                    study_id: study?.id,
                    metadata: {
                        study_protocol: study?.protocol_id,
                        outcome: finalOutcome,
                        formData: formData, // The full structured answers
                        conditionDetails: conditionDetails
                    }
                })
            });
        } catch (e) {
            console.error('Failed to notify clinical team', e);
        }

        setIsLoading(false);
        setStep('OUTCOME');
    };

    if (!study) return null;

    const renderProgress = () => {
        const stepMap: Record<ScreenerStep, number> = { 'STEP1': 33, 'STEP2': 66, 'STEP3': 100, 'OUTCOME': 100 };
        const progress = stepMap[step] || 0;

        return (
            <div className="absolute top-0 left-0 w-full h-1 bg-white/5 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                />
            </div>
        );
    };

    return (
        <div className="min-h-screen pt-40 pb-24 px-4 bg-transparent text-slate-200">
            <div className="max-w-2xl mx-auto">
                <AnimatePresence mode="wait">
                    {step !== 'OUTCOME' ? (
                        <motion.div
                            key="screener"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
                        >
                            {/* Header */}
                            <div className="mb-8 space-y-2">
                                <h1 className="text-3xl font-black text-white uppercase italic tracking-tight">{
                                    step === 'STEP1' ? 'Step 1: Basics & Location' :
                                        step === 'STEP2' ? (dynamicForm ? 'Step 2: Custom Questionnaire' : 'Step 2: ELIGIBILITY CRITERIA') :
                                            'Step 3: Contact & Availability'
                                }</h1>
                            </div>

                            {renderProgress()}

                            {/* Form Steps */}
                            <div className="min-h-[300px]">
                                        {step === 'STEP1' && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                                <div className="space-y-6">
                                                    <div className="space-y-3">
                                                        <label className={`text-sm font-black uppercase tracking-widest transition-colors ${isFieldMissing('age') ? 'text-red-500' : 'text-slate-300'}`}>What is your age?</label>
                                                        <input
                                                            type="number"
                                                            placeholder="Enter your age"
                                                            value={formData.age}
                                                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                                            className={`w-full bg-slate-950/50 border rounded-2xl px-6 py-5 text-white text-lg outline-none transition-all ${isFieldMissing('age') ? 'border-red-500/50 animate-error-pulse' : 'border-white/10 focus:border-cyan-500/50'}`}
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-sm font-black uppercase tracking-widest text-slate-300">Zip / Postal Code</label>
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. 90210"
                                                                value={formData.zipCode}
                                                                onChange={(e) => handleZipChange(e.target.value)}
                                                                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-5 text-white text-lg outline-none focus:border-cyan-500/50 transition-all font-bold"
                                                            />
                                                            {isLocating && (
                                                                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                                                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className={`text-sm font-black uppercase tracking-widest transition-colors ${isFieldMissing('location') ? 'text-red-500' : 'text-slate-300'}`}>Current City, State, Country</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Auto-filled from Zip Code or enter manually"
                                                            value={formData.location}
                                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                            className={`w-full bg-slate-950/50 border rounded-2xl px-6 py-5 text-white text-lg outline-none transition-all ${isFieldMissing('location') ? 'border-red-500/50 animate-error-pulse' : 'border-white/10 focus:border-cyan-500/50'}`}
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {step === 'STEP2' && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                                {dynamicForm ? (
                                                    <div className="space-y-8">
                                                        <div className="flex items-center gap-4 text-sm text-cyan-400 font-bold uppercase tracking-[0.2em] bg-cyan-500/5 py-4 px-6 rounded-2xl border border-cyan-500/20 mb-10">
                                                            <Clock className="w-5 h-5" /> Protocol Synchronization Active
                                                        </div>
                                                        <div className="space-y-12">
                                                            {(Array.isArray(dynamicForm.schema) 
                                                              ? dynamicForm.schema 
                                                              : (dynamicForm.schema.sections 
                                                                  ? dynamicForm.schema.sections.flatMap((s: any) => s.questions || [])
                                                                  : (dynamicForm.schema.questions || []))
                                                            ).map((q: any, i: number) => {
                                                                const fieldId = q.id || q.key;
                                                                const isMissing = q.required && isAttemptingSubmit && !formData[fieldId];
                                                                
                                                                // Normalize types from QuestionnaireBuilder
                                                                const rawType = (q.type || '').toLowerCase();
                                                                const type = rawType.includes('text') ? 'text' : 
                                                                             rawType.includes('number') ? 'text' :
                                                                             rawType.includes('date') ? 'date' :
                                                                             rawType.includes('yesno') || rawType.includes('yes/no') ? 'yesno' :
                                                                             rawType.includes('likert') || rawType.includes('choice') || rawType.includes('dropdown') ? 'choice' :
                                                                             rawType;

                                                                return (
                                                                    <div key={i} className="space-y-4">
                                                                        <label className={`text-sm font-black uppercase tracking-widest transition-colors flex items-center gap-3 ${isMissing ? 'text-red-500' : 'text-slate-300'}`}>
                                                                            {q.label}
                                                                            {q.required && <span className="text-cyan-500 text-[10px]">*</span>}
                                                                        </label>
                                                                        
                                                                        {(type === 'text' || type === 'file') && (
                                                                            <input
                                                                                type={type === 'file' ? "file" : "text"}
                                                                                placeholder="Enter response..."
                                                                                className={`w-full bg-slate-950/50 border rounded-2xl px-6 py-5 text-white text-lg outline-none transition-all ${isMissing ? 'border-red-500/50 animate-error-pulse' : 'border-white/10 focus:border-cyan-500/50'}`}
                                                                                value={type === 'text' ? (formData[fieldId] || '') : undefined}
                                                                                onChange={(e) => setFormData({ ...formData, [fieldId]: e.target.value })}
                                                                            />
                                                                        )}

                                                                        {type === 'date' && (
                                                                            <input
                                                                                type="date"
                                                                                className={`w-full bg-slate-950/50 border rounded-2xl px-6 py-5 text-white text-lg outline-none transition-all ${isMissing ? 'border-red-500/50 animate-error-pulse' : 'border-white/10 focus:border-cyan-500/50'}`}
                                                                                value={formData[fieldId] || ''}
                                                                                onChange={(e) => setFormData({ ...formData, [fieldId]: e.target.value })}
                                                                            />
                                                                        )}

                                                                        {type === 'yesno' && (
                                                                            <div className="flex gap-4">
                                                                                {['Yes', 'No'].map(opt => (
                                                                                    <button
                                                                                        key={opt}
                                                                                        onClick={() => setFormData({ ...formData, [fieldId]: opt })}
                                                                                        className={`flex-1 py-5 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all ${formData[fieldId] === opt ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/30'}`}
                                                                                    >
                                                                                        {opt}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        )}

                                                                        {(type === 'choice' || type === 'dropdown') && (
                                                                            <div className="grid grid-cols-1 gap-3">
                                                                                {(q.options || ['Option 1', 'Option 2']).map((opt: string) => (
                                                                                    <button
                                                                                        key={opt}
                                                                                        onClick={() => setFormData({ ...formData, [fieldId]: opt })}
                                                                                        className={`w-full p-5 rounded-2xl border text-left text-xs font-black uppercase tracking-widest transition-all ${formData[fieldId] === opt ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
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
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="space-y-4">
                                                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 italic">Major Exclusion Check</h4>
                                                    <div className="space-y-4">
                                                        <p className={`text-sm font-bold transition-colors ${isFieldMissing('trialsInLast30Days') ? 'text-red-500' : 'text-slate-400'}`}>Have you participated in any other clinical trial in the last 30 days?</p>
                                                        <div className="flex gap-4">
                                                            {['Yes', 'No'].map(opt => (
                                                                <button
                                                                    key={opt}
                                                                    onClick={() => setFormData({ ...formData, trialsInLast30Days: opt })}
                                                                    className={`flex-1 py-5 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${formData.trialsInLast30Days === opt ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}
                                                                >
                                                                    {opt}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-4 pt-4 border-t border-white/5">
                                                    <p className={`text-sm font-bold transition-colors ${isFieldMissing('healthConditions') ? 'text-red-500' : 'text-slate-400'}`}>Please select any of the following conditions you have been diagnosed with (Global Use):</p>
                                                    <div className="space-y-4">
                                                        {[
                                                            'Diabetes', 'Hypertension', 'Asthma', 'Migraine', 'Heart Condition', 'Cancer history', 'None of the above'
                                                        ].map(condition => {
                                                            const isSelected = formData.healthConditions.includes(condition);
                                                            const isNone = condition === 'None of the above';

                                                            return (
                                                                <div key={condition} className="space-y-3">
                                                                    <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isSelected}
                                                                            onChange={(e) => {
                                                                                let newConditions = [...formData.healthConditions];
                                                                                if (isNone) {
                                                                                    newConditions = e.target.checked ? ['None of the above'] : [];
                                                                                    setConditionDetails({});
                                                                                } else {
                                                                                    newConditions = newConditions.filter(c => c !== 'None of the above');
                                                                                    if (e.target.checked) {
                                                                                        newConditions.push(condition);
                                                                                        setConditionDetails(prev => ({ ...prev, [condition]: { severity: '', managed: '' } }));
                                                                                    } else {
                                                                                        newConditions = newConditions.filter(c => c !== condition);
                                                                                        const newDetails = { ...conditionDetails };
                                                                                        delete newDetails[condition];
                                                                                        setConditionDetails(newDetails);
                                                                                    }
                                                                                }
                                                                                setFormData({ ...formData, healthConditions: newConditions });
                                                                            }}
                                                                            className="w-5 h-5 rounded border-cyan-500/30 bg-white/5 checked:bg-cyan-500 transition-all cursor-pointer"
                                                                        />
                                                                        <span className="text-sm font-bold text-slate-300">{condition}</span>
                                                                    </label>

                                                                    {/* Condition Detail Panel */}
                                                                    <AnimatePresence>
                                                                        {isSelected && !isNone && (
                                                                            <motion.div
                                                                                initial={{ height: 0, opacity: 0 }}
                                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                                exit={{ height: 0, opacity: 0 }}
                                                                                className="overflow-hidden"
                                                                            >
                                                                                <div className="ml-9 p-5 bg-white/5 border border-white/5 rounded-2xl space-y-4">
                                                                                    <div className="space-y-2">
                                                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">How long have you had this condition?</label>
                                                                                        <select
                                                                                            value={conditionDetails[condition]?.managed || ''}
                                                                                            onChange={(e) => setConditionDetails(prev => ({ ...prev, [condition]: { ...prev[condition], managed: e.target.value } }))}
                                                                                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none appearance-none"
                                                                                        >
                                                                                            <option value="">Select duration...</option>
                                                                                            <option value="Under 1 year">Under 1 year</option>
                                                                                            <option value="1-5 years">1-5 years</option>
                                                                                            <option value="Over 5 years">Over 5 years</option>
                                                                                        </select>
                                                                                    </div>
                                                                                    <div className="space-y-2">
                                                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Severity Level</label>
                                                                                        <div className="flex gap-2">
                                                                                            {['Mild', 'Moderate', 'Severe'].map(sev => (
                                                                                                <button
                                                                                                    key={sev}
                                                                                                    onClick={() => setConditionDetails(prev => ({ ...prev, [condition]: { ...prev[condition], severity: sev } }))}
                                                                                                    className={`flex-1 py-3 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${conditionDetails[condition]?.severity === sev ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}
                                                                                                >
                                                                                                    {sev}
                                                                                                </button>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                </>
                                                )}
                                            </motion.div>
                                        )}

                                        {step === 'STEP3' && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                                <div className="space-y-6">
                                                    <div className="space-y-4">
                                                        <label className={`text-sm font-black uppercase tracking-widest ml-4 transition-colors ${isFieldMissing('fullName') ? 'text-red-500' : 'text-slate-300'}`}>Full Name</label>
                                                        <input
                                                            type="text"
                                                            placeholder="John Doe"
                                                            value={formData.fullName}
                                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                            className={`w-full bg-slate-950/50 border rounded-2xl px-6 py-5 text-white text-lg outline-none transition-all ${isFieldMissing('fullName') ? 'border-red-500/50 animate-error-pulse' : 'border-white/10 focus:border-cyan-500/50'}`}
                                                        />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <label className={`text-sm font-black uppercase tracking-widest ml-4 transition-colors ${isFieldMissing('email') ? 'text-red-500' : 'text-slate-300'}`}>Email Address</label>
                                                        <input
                                                            type="email"
                                                            placeholder="you@example.com"
                                                            value={formData.email}
                                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                            className={`w-full bg-slate-950/50 border rounded-2xl px-6 py-5 text-white text-lg outline-none transition-all ${isFieldMissing('email') ? 'border-red-500/50 animate-error-pulse' : 'border-white/10 focus:border-cyan-500/50'}`}
                                                        />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <label className={`text-sm font-black uppercase tracking-widest ml-4 transition-colors ${isFieldMissing('phone') ? 'text-red-500' : 'text-slate-300'}`}>Phone Number</label>
                                                        <input
                                                            type="tel"
                                                            placeholder="(555) 123-4567"
                                                            value={formData.phone}
                                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                            className={`w-full bg-slate-950/50 border rounded-2xl px-6 py-5 text-white text-lg outline-none transition-all ${isFieldMissing('phone') ? 'border-red-500/50 animate-error-pulse' : 'border-white/10 focus:border-cyan-500/50'}`}
                                                        />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <label className={`text-sm font-black uppercase tracking-widest ml-4 transition-colors ${isFieldMissing('availability') ? 'text-red-500' : 'text-slate-300'}`}>Availability for Onboarding Call</label>
                                                        <select
                                                            value={formData.availability}
                                                            onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                                                            className={`w-full bg-slate-950/50 border rounded-2xl px-6 py-5 text-white text-lg outline-none transition-all appearance-none cursor-pointer ${isFieldMissing('availability') ? 'border-red-500/50 animate-error-pulse' : 'border-white/10 focus:border-cyan-500 focus:bg-slate-900/90'}`}
                                                        >
                                                            <option value="" className="bg-slate-900">Select a time...</option>
                                                            <option value="Morning" className="bg-slate-900">Morning (9AM - 12PM)</option>
                                                            <option value="Afternoon" className="bg-slate-900">Afternoon (12PM - 5PM)</option>
                                                            <option value="Evening" className="bg-slate-900">Evening (5PM - 8PM)</option>
                                                        </select>
                                                    </div>
                                                    <div className="pt-4 border-t border-white/5">
                                                        <label className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer group transition-all ${isFieldMissing('cvConsent') ? 'bg-red-500/5 animate-error-pulse' : 'hover:bg-white/5'}`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.cvConsent}
                                                                onChange={(e) => setFormData({ ...formData, cvConsent: e.target.checked })}
                                                                className={`w-5 h-5 rounded mt-1 transition-all cursor-pointer ${isFieldMissing('cvConsent') ? 'border-red-500' : 'border-white/10 bg-white/5 checked:bg-cyan-500'}`}
                                                            />
                                                            <div className="space-y-1">
                                                                <span className={`text-sm font-black uppercase tracking-widest transition-colors ${isFieldMissing('cvConsent') ? 'text-red-500' : 'text-slate-300'}`}>Consent to Contact</span>
                                                                <p className="text-xs text-slate-500 leading-relaxed">
                                                                    By checking this box, I agree that the research team may contact me via email or phone regarding my eligibility and potential study participation.
                                                                </p>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                            </div>

                            {/* Error Message */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-6 overflow-hidden"
                                    >
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Nav Buttons */}
                            <div className="flex items-center justify-between pt-8 border-t border-white/5">
                                <button
                                    onClick={() => { setError(null); handleBack(); }}
                                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${step === 'STEP1' ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:text-white'}`}
                                >
                                    <ChevronLeft className="w-4 h-4" /> BACK
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={isLoading}
                                    className="px-10 py-4 bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 rounded-xl font-black text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-2xl group active:scale-95"
                                >
                                    {isLoading ? 'PROCESSING...' : (step === 'STEP3' ? 'CHECK RESULT' : 'NEXT')}
                                    {!isLoading && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                                </button>
                            </div>

                            <div className="mt-8 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-slate-600">
                                <ShieldCheck className="w-3.5 h-3.5" /> Secure HIPAA-Compliant Screening
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="outcome"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-12 text-center space-y-8 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />

                            {outcome === 'ELIGIBLE' && (
                                <div className="space-y-8 animate-in zoom-in duration-500">
                                    <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto text-emerald-400 font-black italic shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                        PASS
                                    </div>
                                    <div className="space-y-2">
                                        <h1 className="text-4xl font-black text-white uppercase italic">Study Match Found!</h1>
                                        <p className="text-cyan-400 font-bold text-sm uppercase tracking-widest">Initial Screening Successful</p>
                                    </div>
                                    <div className="bg-slate-950/50 p-8 rounded-3xl border border-white/5 text-left space-y-4">
                                        <p className="text-slate-300 font-medium leading-relaxed text-lg">
                                            Great news! Based on your responses, you meet the initial criteria for the <strong>{study.title}</strong>.
                                        </p>
                                        <div className="flex items-start gap-4 bg-white/5 p-6 rounded-xl border border-white/5">
                                            <CheckCircle2 className="w-6 h-6 text-cyan-400 shrink-0" />
                                            <p className="text-sm text-slate-400 leading-relaxed">Next step: Review and sign the digital Informed Consent Form (ICF) to officially begin your enrollment process.</p>
                                        </div>
                                    </div>
                                    <div className="grid gap-4">
                                        <button
                                            onClick={() => navigate('/signin', {
                                                state: { 
                                                    redirectTo: `/studies/${study.id}/consent`,
                                                    email: formData.email,
                                                    fullName: formData.fullName
                                                }
                                            })}
                                            className="w-full py-6 bg-cyan-500 text-slate-950 rounded-2xl font-black text-base uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-cyan-500/20 cursor-pointer active:scale-[0.98]"
                                        >
                                            Proceed to Digital Consent
                                        </button>
                                        <Link to="/dashboard/participant" className="w-full py-4 text-slate-500 font-black text-sm uppercase tracking-widest hover:text-white transition-all text-center">
                                            Back to Dashboard
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {outcome === 'MAYBE' && (
                                <div className="space-y-8 animate-in zoom-in duration-500">
                                    <div className="w-20 h-20 bg-yellow-500/20 border border-yellow-500/30 rounded-3xl flex items-center justify-center mx-auto text-yellow-400">
                                        <Clock className="w-10 h-10" />
                                    </div>
                                    <h1 className="text-4xl font-black text-white uppercase italic">Further Review Needed</h1>
                                    <div className="bg-slate-950/50 p-8 rounded-3xl border border-white/5 text-center">
                                        <p className="text-slate-300 font-medium leading-relaxed text-lg mb-8">
                                            Based on your responses, we need to clarify a few details. Please schedule a brief 5-minute screening call with our coordinator.
                                        </p>
                                        <button
                                            onClick={() => window.location.href = 'mailto:info@musbresearch.com?subject=Screening%20Call%20Request'}
                                            className="bg-white/10 hover:bg-white/20 text-white px-10 py-4 rounded-xl text-sm font-black uppercase tracking-widest border border-white/10 transition-all flex items-center gap-3 mx-auto cursor-pointer active:scale-95"
                                        >
                                            <Calendar className="w-5 h-5 text-cyan-400" /> Schedule Call Now
                                        </button>
                                    </div>
                                    <Link to="/trials" className="block text-cyan-400 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors">
                                        Browse Other Studies
                                    </Link>
                                </div>
                            )}

                            {outcome === 'NOT_ELIGIBLE' && (
                                <div className="space-y-8 animate-in zoom-in duration-500">
                                    <div className="w-20 h-20 bg-slate-800 border border-white/10 rounded-3xl flex items-center justify-center mx-auto text-slate-500">
                                        <AlertCircle className="w-10 h-10" />
                                    </div>
                                    <h1 className="text-4xl font-black text-white uppercase italic text-slate-400">Not Eligible</h1>
                                    <div className="bg-slate-950/50 p-8 rounded-3xl border border-white/5">
                                        <p className="text-slate-400 font-medium leading-relaxed text-lg">
                                            Thank you for completing the screener. Unfortunately, based on our current protocol, you do not meet the criteria for this specific study.
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <button
                                            onClick={() => navigate('/contact')}
                                            className="w-full py-5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-black text-sm uppercase tracking-widest border border-white/10 transition-all cursor-pointer active:scale-95"
                                        >
                                            Notify Me of Future Studies
                                        </button>
                                        <Link to="/trials" className="block w-full text-center py-4 text-cyan-500 font-black text-sm uppercase tracking-widest hover:text-white transition-all">
                                            Explore Other Open Trials
                                        </Link>
                                    </div>
                                </div>
                            )}

                            <div className="pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-600 uppercase">
                                    <Mail className="w-4 h-4 text-cyan-500" /> info@musbresearch.com
                                </div>
                                <div className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-600 uppercase justify-end">
                                    <Phone className="w-4 h-4 text-cyan-500" /> (813) 555-0123
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
