import React, { useState } from 'react';
import { authFetch, API, getUser } from '../../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, AlertCircle, FileUp, ClipboardList, CheckCircle2,
    AlertTriangle, ChevronRight, Info, Plus, Calendar,
    FileText, Save, Clock, ArrowRight, X, Trash2, Microscope,
    Heart, Thermometer, User, Upload, Eye, RefreshCcw
} from 'lucide-react';
import { Card } from './SharedComponents';

// --- SUB-COMPONENTS (Defined outside to prevent re-mounting/flicker) ---

const SectionHeader = ({ title, icon: Icon, subtitle }: any) => (
    <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-amber-500">
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <h4 className="text-[20px] font-black text-white italic uppercase tracking-tighter">{title}</h4>
            <p className="text-[13px] font-black text-slate-500 uppercase tracking-widest">{subtitle}</p>
        </div>
    </div>
);

const BooleanChoice = ({ value, onChange, label, inverse = false }: any) => {
    const getYesStyle = () => {
        if (value !== true) return 'text-slate-500 hover:text-slate-300 bg-white/[0.02]';
        return inverse
            ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/30 scale-105 z-10'
            : 'bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/30 scale-105 z-10 font-black';
    };

    const getNoStyle = () => {
        if (value !== false) return 'text-slate-500 hover:text-slate-300 bg-white/[0.02]';
        return inverse
            ? 'bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/30 scale-105 z-10 font-black'
            : 'bg-rose-500 text-white shadow-xl shadow-rose-500/30 scale-105 z-10';
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-1">
            {label && <label className="text-[14px] font-black text-slate-400 uppercase tracking-[0.15em] block flex-1 drop-shadow-sm">{label}</label>}
            <div className="flex gap-1.5 p-1 bg-[#050b18] border border-white/10 rounded-[1.5rem] w-fit shadow-2xl relative overflow-hidden">
                <button
                    onClick={() => onChange(true)}
                    className={`px-12 py-3 rounded-2xl text-[13px] font-bold uppercase tracking-widest transition-all duration-300 ${getYesStyle()}`}
                >
                    Yes
                </button>
                <button
                    onClick={() => onChange(false)}
                    className={`px-12 py-3 rounded-2xl text-[13px] font-bold uppercase tracking-widest transition-all duration-300 ${getNoStyle()}`}
                >
                    No
                </button>
            </div>
        </div>
    );
};

const LogDetailModal = ({ log, onClose }: { log: any; onClose: () => void }) => {
    const DetailRow = ({ label, value, icon: Icon, color = "text-slate-400" }: any) => (
        <div className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/5 ${color}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="space-y-1">
                <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
                <p className="text-[14px] font-bold text-white uppercase tracking-tight">{value || 'N/A'}</p>
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-[#0a0f18] border border-white/10 w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-amber-900/20 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Log Details</h3>
                            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Entry Date: {new Date(log.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Section A */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Thermometer className="w-5 h-5 text-amber-500" />
                            <h4 className="text-[14px] font-black text-white uppercase tracking-widest">Medicine Intake</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailRow icon={CheckCircle2} label="Took Medicine" value={log.took_medicine ? 'YES' : 'NO'} color={log.took_medicine ? 'text-green-400' : 'text-red-400'} />
                            <DetailRow icon={Clock} label="Time Taken" value={log.time_taken} />
                            {log.took_medicine && (
                                <>
                                    <DetailRow icon={Activity} label="Full Dose" value={log.full_dose ? 'YES' : 'NO'} color={log.full_dose ? 'text-amber-500' : 'text-orange-400'} />
                                    {!log.full_dose && <DetailRow icon={Plus} label="Dose Amount" value={log.dose_amount} />}
                                </>
                            )}
                            {!log.took_medicine && <DetailRow icon={AlertTriangle} label="Reason Missed" value={log.reason_missed} color="text-red-400" />}
                        </div>
                    </div>

                    {/* Section B */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <h4 className="text-[14px] font-black text-white uppercase tracking-widest">Adverse Events</h4>
                        </div>
                        {log.noticed_side_effects ? (
                            <div className="space-y-4">
                                <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-2">
                                    <p className="text-[12px] font-black text-red-400/60 uppercase tracking-widest px-1">Symptom Description</p>
                                    <p className="text-white font-bold leading-relaxed">{log.side_effect_description}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <DetailRow icon={Clock} label="Onset Time" value={log.side_effect_start_time} />
                                    <DetailRow icon={Activity} label="Ongoing" value={log.side_effect_ongoing ? 'YES' : 'NO'} />
                                    <DetailRow icon={Microscope} label="Severity" value={log.severity} color="text-red-400" />
                                    <DetailRow icon={User} label="Medical Care Sought" value={log.sought_medical_care ? 'YES' : 'NO'} />
                                </div>
                                {log.ae_additional_comments && (
                                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                        <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest mb-2">Additional AE Comments</p>
                                        <p className="text-slate-300 font-bold italic">"{log.ae_additional_comments}"</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-2xl flex items-center gap-3 text-green-400">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="text-[12px] font-black uppercase tracking-widest">No side effects reported today</span>
                            </div>
                        )}
                    </div>

                    {/* Section C */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Heart className="w-5 h-5 text-purple-400" />
                            <h4 className="text-[14px] font-black text-white uppercase tracking-widest">General Health</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailRow icon={Activity} label="Overall Feeling" value={log.overall_feeling?.replace('_', ' ')} color="text-purple-400" />
                            {log.supporting_file && (
                                <div className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl group cursor-pointer hover:bg-amber-500/5 hover:border-amber-500/20 transition-all">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/5 text-amber-500">
                                        <FileUp className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Attachment</p>
                                        <a href={log.supporting_file} target="_blank" rel="noreferrer" className="text-[14px] font-bold text-amber-500 uppercase hover:underline">View Uploaded File</a>
                                    </div>
                                </div>
                            )}
                        </div>
                        {log.health_updates && (
                            <div className="p-6 bg-purple-500/5 border border-purple-500/10 rounded-2xl space-y-2">
                                <p className="text-[12px] font-black text-purple-400/60 uppercase tracking-widest px-1">Health Updates</p>
                                <p className="text-white font-bold leading-relaxed italic">"{log.health_updates}"</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-8 border-t border-white/5 bg-slate-900/40 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all"
                    >
                        Close Entry
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- MAIN COMPONENT ---

const LogsView = ({ study, onAction, preselectedDate, preselectedLog, defaultViewMode = 'FORM' }: { study?: any; onAction?: (title: string, task?: any) => void; preselectedDate?: string | null; preselectedLog?: any; defaultViewMode?: 'FORM' | 'HISTORY' }) => {
    const apiUrl = API || 'http://localhost:8000';

    // UI Toggle
    const [viewMode, setViewMode] = useState<'FORM' | 'HISTORY'>(defaultViewMode);

    // --- DAILY LOG STATE ---
    const [isSubmitting, setIsSubmitting] = useState(false);

    // A. Medicine Intake
    const [tookMedicine, setTookMedicine] = useState<boolean | null>(null);
    // Senior Developer: Use the participant's profile timezone for the initial clock state
    const [timeTaken, setTimeTaken] = useState(() => {
        const u = getUser();
        const tz = u?.timezone || 'UTC';
        return new Date().toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz
        });
    });
    const [fullDose, setFullDose] = useState<boolean | null>(null);
    const [doseAmount, setDoseAmount] = useState('');
    const [reasonMissed, setReasonMissed] = useState('');

    // B. Adverse Events
    const [noticedAE, setNoticedAE] = useState<boolean | null>(null);
    const [aeDescription, setAeDescription] = useState('');
    const [aeStartTime, setAeStartTime] = useState('');
    const [aeOngoing, setAeOngoing] = useState<boolean | null>(null);
    const [aeSeverity, setAeSeverity] = useState<string | null>(null);
    const [aeInterfered, setAeInterfered] = useState<boolean | null>(null);
    const [aeMedicalCare, setAeMedicalCare] = useState<boolean | null>(null);
    const [aeComments, setAeComments] = useState('');

    // C. General Health
    const [overallFeeling, setOverallFeeling] = useState<string | null>(null);
    const [healthUpdates, setHealthUpdates] = useState('');
    const [supportingFile, setSupportingFile] = useState<File | null>(null);

    // --- MANUAL DATE/TIME ---
    // Senior Developer: Use local date parts instead of toISOString() to prevent timezone shifting
    const getLocalISODate = (date: Date) => {
        const YYYY = date.getFullYear();
        const MM = String(date.getMonth() + 1).padStart(2, '0');
        const DD = String(date.getDate()).padStart(2, '0');
        return `${YYYY}-${MM}-${DD}`;
    };

    const [logDate, setLogDate] = useState(preselectedDate || getLocalISODate(new Date()));

    // Update logDate if preselectedDate changes
    React.useEffect(() => {
        if (preselectedDate) {
            setLogDate(preselectedDate);
            setViewMode('FORM');
        }
    }, [preselectedDate]);

    // --- OTHER STATES ---
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [selectedLog, setSelectedLog] = useState<any | null>(preselectedLog || null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(!!preselectedLog);

    // Handle deep-link to history details
    React.useEffect(() => {
        if (preselectedLog) {
            setSelectedLog(preselectedLog);
            setIsPreviewModalOpen(true);
            setViewMode('HISTORY');
        }
    }, [preselectedLog]);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Image processing: Compression & Metadata stripping
    const processImage = async (file: File): Promise<File> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_SIZE = 1600;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                        } else {
                            resolve(file);
                        }
                    }, 'image/jpeg', 0.7);
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadError(null);

        // Validation
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            setUploadError("Only PDF, PNG, and JPEG files are allowed.");
            return;
        }

        if (file.type.startsWith('image/')) {
            setIsProcessingFile(true);
            try {
                const processed = await processImage(file);
                setSupportingFile(processed);
            } catch (err) {
                console.error("Image processing failed", err);
                setSupportingFile(file);
            } finally {
                setIsProcessingFile(false);
            }
        } else {
            setSupportingFile(file);
        }
    };

    // Image preview effect
    React.useEffect(() => {
        if (!supportingFile) {
            setPreviewUrl(null);
            return;
        }

        const url = URL.createObjectURL(supportingFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [supportingFile]);

    // --- LOCAL STORAGE DATA SYNC ---
    React.useEffect(() => {
        const savedData = localStorage.getItem('musb_daily_log_draft');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.tookMedicine !== undefined) setTookMedicine(parsed.tookMedicine);
                if (parsed.timeTaken) setTimeTaken(parsed.timeTaken);
                if (parsed.fullDose !== undefined) setFullDose(parsed.fullDose);
                if (parsed.doseAmount) setDoseAmount(parsed.doseAmount);
                if (parsed.reasonMissed) setReasonMissed(parsed.reasonMissed);
                if (parsed.noticedAE !== undefined) setNoticedAE(parsed.noticedAE);
                if (parsed.aeDescription) setAeDescription(parsed.aeDescription);
                if (parsed.aeStartTime) setAeStartTime(parsed.aeStartTime);
                if (parsed.aeOngoing !== undefined) setAeOngoing(parsed.aeOngoing);
                if (parsed.aeSeverity) setAeSeverity(parsed.aeSeverity);
                if (parsed.aeInterfered !== undefined) setAeInterfered(parsed.aeInterfered);
                if (parsed.aeMedicalCare !== undefined) setAeMedicalCare(parsed.aeMedicalCare);
                if (parsed.aeComments) setAeComments(parsed.aeComments);
                if (parsed.overallFeeling) setOverallFeeling(parsed.overallFeeling);
                if (parsed.healthUpdates) setHealthUpdates(parsed.healthUpdates);
            } catch (e) {
                console.error("Local storage sync failed", e);
            }
        }
    }, []);

    React.useEffect(() => {
        const dataToSave = {
            tookMedicine, timeTaken, fullDose, doseAmount, reasonMissed,
            noticedAE, aeDescription, aeStartTime, aeOngoing, aeSeverity,
            aeInterfered, aeMedicalCare, aeComments,
            overallFeeling, healthUpdates
        };
        localStorage.setItem('musb_daily_log_draft', JSON.stringify(dataToSave));
    }, [
        tookMedicine, timeTaken, fullDose, doseAmount, reasonMissed,
        noticedAE, aeDescription, aeStartTime, aeOngoing, aeSeverity,
        aeInterfered, aeMedicalCare, aeComments,
        overallFeeling, healthUpdates
    ]);

    React.useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const resp = await authFetch(`${apiUrl}/api/daily-medication-logs/`);
            if (resp.ok) {
                const data = await resp.json();
                console.log("Medication History API Response:", data);
                const cleanData = Array.isArray(data) ? data : (data.results || []);
                setHistory(cleanData);
            }
        } catch (e) {
            console.error("History fetch failed", e);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const resetForm = () => {
        setTookMedicine(null); setTimeTaken(''); setFullDose(null); setDoseAmount(''); setReasonMissed('');
        setNoticedAE(null); setAeDescription(''); setAeStartTime(''); setAeOngoing(null); setAeSeverity(null);
        setAeInterfered(null); setAeMedicalCare(null); setAeComments('');
        setOverallFeeling(null); setHealthUpdates(''); setSupportingFile(null);
        setLogDate(new Date().toISOString().split('T')[0]);
        setTimeTaken(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
        localStorage.removeItem('musb_daily_log_draft');
    };

    const handleSubmitLog = async (isDraft: boolean = false) => {
        if (!isDraft) {
            if (tookMedicine === null) {
                alert("Please answer if you took your medicine today.");
                return;
            }
            if (!logDate) {
                alert("Please select the entry date.");
                return;
            }
            if (!timeTaken) {
                alert("Please manually enter the time of medication or recording.");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('took_medicine', tookMedicine === true ? 'true' : 'false');
            formData.append('time_taken', timeTaken);
            formData.append('full_dose', fullDose === true ? 'true' : 'false');
            formData.append('dose_amount', doseAmount);
            formData.append('reason_missed', reasonMissed);

            formData.append('noticed_side_effects', noticedAE === true ? 'true' : 'false');
            formData.append('side_effect_description', aeDescription);
            formData.append('side_effect_start_time', aeStartTime);
            formData.append('side_effect_ongoing', aeOngoing === true ? 'true' : 'false');
            if (aeSeverity) formData.append('severity', aeSeverity);
            formData.append('interfered_daily_activities', aeInterfered === true ? 'true' : 'false');
            formData.append('sought_medical_care', aeMedicalCare === true ? 'true' : 'false');
            formData.append('ae_additional_comments', aeComments);

            if (overallFeeling) formData.append('overall_feeling', overallFeeling);
            formData.append('health_updates', healthUpdates);
            if (supportingFile) formData.append('supporting_file', supportingFile);
            formData.append('is_draft', isDraft ? 'true' : 'false');

            // Manual Date and Time Entry
            formData.append('date', logDate);
            formData.append('time_taken', timeTaken || '00:00');

            const resp = await authFetch(`${apiUrl}/api/daily-medication-logs/`, {
                method: 'POST',
                body: formData
            });

            if (resp.ok) {
                alert(isDraft ? "Draft saved successfully." : "Daily log submitted successfully.");
                if (!isDraft) {
                    resetForm();
                    fetchHistory();
                    if (onAction) {
                        onAction('NAVIGATE_TO_COMPLETED_TASKS');
                    } else {
                        setViewMode('HISTORY');
                    }
                }
            } else {
                throw new Error("Failed to submit");
            }
        } catch (e) {
            alert("Connection error. Your entry has been saved locally.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-[1500px] mx-auto space-y-8 pb-20 mt-10">
            {/* Navigation Strip */}
            <div className="flex justify-between items-center bg-[#050b18]/40 backdrop-blur-xl border border-white/5 p-2 rounded-[2rem] shadow-2xl relative z-[100]">
                <div className="flex gap-1">
                    <button
                        onClick={() => setViewMode('FORM')}
                        className={`px-10 py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden ${viewMode === 'FORM' ? 'bg-amber-500 text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        Daily Log
                    </button>
                    <button
                        onClick={() => setViewMode('HISTORY')}
                        className={`px-10 py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden ${viewMode === 'HISTORY' ? 'bg-amber-500 text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        History
                    </button>
                </div>
                <div className="px-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]" />
                    MusB Health
                </div>
            </div>

            {viewMode === 'FORM' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Header Image/Gradient */}
                    <Card className="p-0 border border-white/5 overflow-hidden bg-[#0d1424]">
                        <div className="h-44 bg-gradient-to-br from-[#0d1424] via-amber-950/20 to-[#0d1424] flex flex-col justify-center px-8 sm:px-14 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
                                <ClipboardList className="w-32 h-32 text-white" />
                            </div>
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />
                            <h2 className="text-3xl sm:text-4xl font-black text-white italic uppercase tracking-tighter relative z-10 drop-shadow-2xl">Daily Medicine Log</h2>
                            <p className="text-[12px] sm:text-[14px] font-black text-amber-500 uppercase tracking-[0.2em] mt-2 relative z-10 flex items-center gap-2">
                                <span className="w-8 h-[1px] bg-amber-500/30" />
                                Study Daily Status
                            </p>
                        </div>
                    </Card>

                    {/* Intro Statement  */}
                    <div className="px-2">
                        <div className="flex items-center gap-3 text-amber-500 mb-4 px-1">
                            <Info className="w-5 h-5 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            <span className="text-[13px] font-black uppercase tracking-[0.2em] italic">Important Notice</span>
                        </div>
                        <p className="text-[16px] font-bold text-slate-400 leading-relaxed border-l-2 border-amber-500/20 pl-6 py-2">
                            Please complete this daily log after taking your study medicine. This helps the study team track daily use and monitor any side effects or health concerns.
                        </p>
                    </div>

                    {/* Section A: Medicine Intake */}
                    <Card className="p-8 sm:p-10 border border-white/5 bg-white/[0.01]">
                        <section className="space-y-10">
                            <SectionHeader
                                icon={Thermometer}
                                title="A. Medication Use"
                                subtitle="Tracking your daily use"
                            />

                            <div className="space-y-10">
                                <BooleanChoice
                                    label="Did you take your medicine today?"
                                    value={tookMedicine}
                                    onChange={setTookMedicine}
                                />

                                <div className="flex flex-col md:flex-row gap-8 pb-8 border-t border-white/5 pt-10">
                                    <div className="flex-1 space-y-4">
                                        <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                            <Calendar className="w-4 h-4 text-amber-500" />
                                            Log Date
                                        </label>
                                        <input
                                            type="date"
                                            value={logDate}
                                            onChange={(e) => setLogDate(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold text-xl outline-none focus:border-amber-500/30 transition-all cursor-pointer"
                                        />
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Select the date this entry refers to</p>
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                            <Clock className="w-4 h-4 text-amber-500" />
                                            Current Time
                                        </label>
                                        <input
                                            type="time"
                                            value={timeTaken}
                                            onChange={(e) => setTimeTaken(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold text-xl outline-none focus:border-amber-500/30 transition-all cursor-pointer"
                                        />
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Select the time of this recording</p>
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {tookMedicine && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-amber-500/5 p-8 rounded-[2rem] border border-amber-500/10"
                                    >
                                        <BooleanChoice
                                            label="Did you take the full dose?"
                                            value={fullDose}
                                            onChange={setFullDose}
                                        />

                                        {fullDose === false && (
                                            <div className="space-y-6 lg:col-span-2 animate-in fade-in slide-in-from-left-2">
                                                <div className="space-y-4">
                                                    <label className="text-[15px] font-black text-slate-400 uppercase tracking-widest block px-1">If no, how much did you take?</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Specify amount (e.g., 5ml, 1 pill)"
                                                        value={doseAmount}
                                                        onChange={(e) => setDoseAmount(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-amber-500/30"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest block px-1">Reason for missed or partial dose, if applicable</label>
                                                    <textarea
                                                        placeholder="Explain why a partial dose was taken..."
                                                        value={reasonMissed}
                                                        onChange={(e) => setReasonMissed(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 h-24 text-white font-bold outline-none focus:border-amber-500/30 resize-none"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {tookMedicine === false && (
                                <div className="space-y-3 bg-red-500/5 p-8 rounded-[2rem] border border-red-500/10 animate-in zoom-in-95">
                                    <label className="text-[14px] font-black text-red-400 uppercase tracking-widest block px-1">Reason for missed or partial dose, if applicable</label>
                                    <textarea
                                        value={reasonMissed}
                                        onChange={(e) => setReasonMissed(e.target.value)}
                                        placeholder="Please explain why the dose was missed today..."
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl p-6 h-32 text-white font-bold outline-none focus:border-red-500/30 resize-none"
                                    />
                                </div>
                            )}
                        </section>
                    </Card>

                    {/* Section B: Adverse Events */}
                    <Card className="p-8 sm:p-10 border border-white/5 bg-white/[0.01]">
                        <section className="space-y-10">
                            <SectionHeader
                                icon={AlertTriangle}
                                title="B. Adverse Events / Side Effects"
                                subtitle="Monitoring your physiological response"
                            />

                            <BooleanChoice
                                label="Did you notice any side effects or unusual symptoms today?"
                                value={noticedAE}
                                onChange={setNoticedAE}
                                inverse={true}
                            />

                            <AnimatePresence>
                                {noticedAE && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-10 overflow-hidden"
                                    >
                                        <div className="space-y-3">
                                            <label className="text-[14px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 block">Symptom Description [WHAT HAPPENED?]</label>
                                            <textarea
                                                value={aeDescription}
                                                onChange={(e) => setAeDescription(e.target.value)}
                                                placeholder="Describe the symptoms in detail..."
                                                className="w-full h-40 bg-white/5 border border-white/5 rounded-2xl p-6 text-white font-bold text-[18px] outline-none focus:border-red-500/30 resize-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-1">
                                                <label className="text-[15px] font-black text-slate-400 uppercase tracking-widest block flex-1">When did it start?</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., 2 hours after dose"
                                                    value={aeStartTime}
                                                    onChange={(e) => setAeStartTime(e.target.value)}
                                                    className="w-full sm:w-[300px] bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none text-lg"
                                                />
                                            </div>
                                            <BooleanChoice
                                                label="Is it still ongoing?"
                                                value={aeOngoing}
                                                onChange={setAeOngoing}
                                                inverse={true}
                                            />
                                        </div>

                                        <div className="space-y-6">
                                            <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest block px-1">Severity</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                {[
                                                    { id: 'MILD', color: 'bg-amber-500 border-amber-400 shadow-amber-500/20' },
                                                    { id: 'MODERATE', color: 'bg-orange-500 border-orange-400 shadow-orange-500/20' },
                                                    { id: 'SEVERE', color: 'bg-red-600 border-red-500 shadow-red-600/20' }
                                                ].map(lvl => (
                                                    <button
                                                        key={lvl.id}
                                                        onClick={() => setAeSeverity(lvl.id)}
                                                        className={`py-5 rounded-2xl text-[14px] font-black uppercase tracking-widest transition-all border ${aeSeverity === lvl.id ? `${lvl.color} text-white scale-[1.02] shadow-xl` : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}
                                                    >
                                                        {lvl.id}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-red-500/[0.03] p-8 rounded-[2rem] border border-red-500/5">
                                            <BooleanChoice
                                                label="Interfered with daily activities?"
                                                value={aeInterfered}
                                                onChange={setAeInterfered}
                                                inverse={true}
                                            />
                                            <BooleanChoice
                                                label="Did you seek medical care?"
                                                value={aeMedicalCare}
                                                onChange={setAeMedicalCare}
                                                inverse={true}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Additional Comments</label>
                                            <textarea
                                                value={aeComments}
                                                onChange={(e) => setAeComments(e.target.value)}
                                                className="w-full bg-white/5 border border-white/5 rounded-2xl p-6 h-24 text-white font-bold outline-none"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>
                    </Card>

                    {/* Section C: General Health */}
                    <Card className="p-8 sm:p-10 border border-white/5 bg-white/[0.01]">
                        <section className="space-y-10">
                            <SectionHeader
                                icon={Activity}
                                title="C. General Health Check"
                                subtitle="Holistic daily wellness review"
                            />

                            <div className="space-y-8">
                                <label className="text-[15px] font-black text-slate-400 uppercase tracking-widest block px-1">How do you feel today overall?</label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {[
                                        { id: 'VERY_GOOD', color: 'bg-emerald-500 border-emerald-400 shadow-emerald-500/20' },
                                        { id: 'GOOD', color: 'bg-lime-500 border-lime-400 shadow-lime-500/20' },
                                        { id: 'FAIR', color: 'bg-amber-500 border-amber-400 shadow-amber-500/20' },
                                        { id: 'POOR', color: 'bg-red-600 border-red-500 shadow-red-600/20' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setOverallFeeling(opt.id)}
                                            className={`py-5 rounded-xl text-[12px] font-black uppercase tracking-widest border transition-all ${overallFeeling === opt.id ? `${opt.color} text-white shadow-lg scale-105` : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-white'}`}
                                        >
                                            {opt.id.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-5">
                                <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest px-1">Any other health updates you want to report?</label>
                                <textarea
                                    value={healthUpdates}
                                    onChange={(e) => setHealthUpdates(e.target.value)}
                                    placeholder="Write here..."
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-6 h-40 text-white font-bold text-lg outline-none"
                                />
                            </div>

                            {/* File Upload Placeholder */}
                            <div className="space-y-4">
                                <label className="text-[13px] font-black text-slate-500 uppercase tracking-widest px-1 block">Supporting file / Photo (If needed)</label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept=".pdf, .png, .jpg, .jpeg"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`p-8 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all ${supportingFile ? 'bg-cyan-500/5 border-cyan-500/40' : 'bg-white/[0.02] border-white/10 group-hover:bg-white/[0.04]'} ${uploadError ? 'border-red-500/50 bg-red-500/5' : ''}`}>
                                        {isProcessingFile ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                                                <span className="text-[12px] font-black text-cyan-400 uppercase tracking-widest">Optimizing & Protecting Privacy...</span>
                                            </div>
                                        ) : supportingFile ? (
                                            <div className="flex flex-col items-center gap-4 w-full">
                                                {supportingFile.type.startsWith('image/') && previewUrl ? (
                                                    <div className="relative group/preview">
                                                        <img src={previewUrl} alt="Preview" className="h-40 w-auto rounded-2xl object-cover border border-white/10 shadow-2xl" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                                                            <p className="text-white text-[10px] font-black uppercase tracking-widest">Client-Side Optimized</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10">
                                                        <FileText className="w-10 h-10 text-cyan-500" />
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 bg-white/5 p-2 px-4 rounded-2xl border border-white/10">
                                                    <span className="text-[12px] font-black text-white italic truncate max-w-[150px]">{supportingFile.name}</span>
                                                    <div className="flex items-center border-l border-white/10 ml-2 pl-2 gap-1 relative z-20">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setIsPreviewModalOpen(true);
                                                            }}
                                                            className="p-2 text-cyan-400 hover:bg-cyan-400/10 rounded-xl transition-all cursor-pointer"
                                                            title="Preview File"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setSupportingFile(null);
                                                            }}
                                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                                                            title="Delete File"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="w-6 h-6 text-slate-500" />
                                                <span className="text-[14px] font-black text-slate-500 uppercase tracking-widest">Select Image or PDF</span>
                                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter text-center">Privacy protection enabled <br /> Metadata will be removed automatically</p>
                                            </>
                                        )}
                                    </div>
                                    {uploadError && <p className="text-red-500 text-[12px] font-black uppercase mt-3 tracking-widest text-center">{uploadError}</p>}
                                </div>
                            </div>
                        </section>
                    </Card>

                    {/* Preview Modal */}
                    <AnimatePresence>
                        {isPreviewModalOpen && supportingFile && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[150] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 md:p-12"
                                onClick={() => setIsPreviewModalOpen(false)}
                            >
                                <button className="absolute top-8 right-8 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all z-[160]"><X className="w-8 h-8" /></button>

                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="w-full max-w-5xl h-full flex flex-col bg-[#0a0f18] rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">File Preview: {supportingFile.name}</h3>
                                        <div className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] font-black text-cyan-400 uppercase tracking-widest">Supporting Document</div>
                                    </div>

                                    <div className="flex-1 flex items-center justify-center p-4 bg-black/20">
                                        {supportingFile.type.startsWith('image/') ? (
                                            <img
                                                src={previewUrl!}
                                                alt="Review"
                                                className="max-h-full max-w-full object-contain rounded-xl"
                                            />
                                        ) : supportingFile.type === 'application/pdf' ? (
                                            <iframe
                                                src={previewUrl!}
                                                className="w-full h-full border-none rounded-xl bg-white"
                                                title="PDF Preview"
                                            />
                                        ) : (
                                            <div className="text-slate-500 text-center uppercase font-black italic tracking-widest">Preview not available for this file type</div>
                                        )}
                                    </div>

                                    <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-center">
                                        <button
                                            onClick={() => setIsPreviewModalOpen(false)}
                                            className="px-12 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] text-white transition-all"
                                        >
                                            Close Preview
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Emergency Footer Advisory */}
                    <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-[2rem] flex items-center justify-center gap-4 text-center mt-12 animate-pulse shadow-[0_0_30px_rgba(244,63,94,0.1)]">
                        <AlertTriangle className="w-7 h-7 text-rose-500 shrink-0" />
                        <p className="text-[14px] font-black text-rose-500 uppercase tracking-[0.1em] italic leading-relaxed">
                            If you experience severe symptoms or a medical emergency, call 911 immediately and contact the study team at (612) 419-0781.
                        </p>
                    </div>


                    {/* Form Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-6 pt-10 pb-20 px-2 lg:px-0">
                        <button
                            onClick={() => handleSubmitLog(true)}
                            disabled={isSubmitting}
                            className="flex-1 py-5 rounded-[2.5rem] border border-slate-700 bg-[#0a101f] text-slate-400 font-black uppercase tracking-[0.2em] transition-all duration-300 hover:border-slate-500 hover:text-white hover:bg-white/5 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            <Save className={`w-5 h-5 ${isSubmitting ? 'animate-spin' : ''}`} />
                            Save Draft
                        </button>
                        <button
                            onClick={() => handleSubmitLog(false)}
                            disabled={isSubmitting}
                            className="flex-[2] py-5 rounded-[2.5rem] bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-500/30 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-4 relative overflow-hidden group disabled:opacity-50"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            {isSubmitting ? (
                                <RefreshCcw className="w-6 h-6 animate-spin text-white" />
                            ) : (
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            )}
                            <span className="italic">Submit Daily Log</span>
                        </button>
                    </div>
                </div>
            ) : (
                /* HISTORY VIEW */
                <div className="space-y-6">
                    {isLoadingHistory ? (
                        <div className="text-center py-20 animate-pulse text-slate-500 uppercase font-black tracking-widest text-[14px]">Syncing health history...</div>
                    ) : (!Array.isArray(history) || history.length === 0) ? (
                        <Card className="text-center py-20 flex flex-col items-center">
                            <ClipboardList className="w-12 h-12 text-slate-700 mb-4" />
                            <p className="text-[14px] font-black text-slate-500 uppercase tracking-widest">No previous logs recorded.</p>
                        </Card>
                    ) : (
                        history.map((log: any) => (
                            <Card
                                key={log.id}
                                onClick={() => setSelectedLog(log)}
                                className="p-8 border-white/5 hover:border-cyan-500/20 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 ${log.took_medicine ? 'bg-[#00e676]/10 text-[#00e676]' : 'bg-red-500/10 text-red-500'}`}>
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h5 className="text-[15px] font-black text-white italic uppercase tracking-tighter">Entry: {new Date(log.date).toLocaleDateString()}</h5>
                                            <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-cyan-400 transition-colors">{log.took_medicine ? 'Dose Taken' : 'Dose Missed'} • {log.overall_feeling?.replace('_', ' ') || 'No feeling reported'}</p>
                                        </div>
                                    </div>
                                    <button className="p-3 bg-white/5 rounded-xl text-slate-400 group-hover:text-white group-hover:bg-cyan-500/20 transition-all"><ChevronRight className="w-5 h-5" /></button>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            <AnimatePresence>
                {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
            </AnimatePresence>
        </div>
    );
};

export default LogsView;


