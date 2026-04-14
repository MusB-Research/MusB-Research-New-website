import React, { useState } from 'react';
import { authFetch, API, getUser } from '../../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, AlertCircle, FileUp, ClipboardList, CheckCircle2,
    AlertTriangle, ChevronRight, Info, Plus, Calendar,
    FileText, Save, Clock, ArrowRight, X, Trash2, Microscope,
    Heart, Thermometer, User, Upload, Eye, RefreshCcw
} from 'lucide-react';
import { Card, Badge, ProgressBar, Skeleton } from './SharedComponents';

// --- SUB-COMPONENTS ---

const SectionHeader = ({ title, icon: Icon, subtitle }: any) => (
    <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-[#F0F6FF] rounded-2xl flex items-center justify-center border border-[#E3F2FD] text-[#1E88E5] shadow-sm">
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <h4 className="text-[15px] font-bold text-[#1A2B49] uppercase tracking-tight">{title}</h4>
            <p className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest">{subtitle}</p>
        </div>
    </div>
);

const BooleanChoice = ({ value, onChange, label, inverse = false }: any) => {
    const getYesStyle = () => {
        if (value !== true) return 'text-[#5F6F89] hover:text-[#5F6F89] bg-white';
        return inverse
            ? 'bg-[#D32F2F] text-white shadow-lg shadow-red-500/20 scale-105 z-10'
            : 'bg-[#00C853] text-white shadow-lg shadow-green-500/20 scale-105 z-10 font-bold';
    };

    const getNoStyle = () => {
        if (value !== false) return 'text-[#5F6F89] hover:text-[#5F6F89] bg-white';
        return inverse
            ? 'bg-[#00C853] text-white shadow-lg shadow-green-500/20 scale-105 z-10 font-bold'
            : 'bg-[#D32F2F] text-white shadow-lg shadow-red-500/20 scale-105 z-10';
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-1">
            {label && <label className="text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest block flex-1">{label}</label>}
            <div className="flex gap-1.5 p-1 bg-[#F8FBFF] border border-[#E3ECF5] rounded-[1.25rem] w-fit shadow-inner relative overflow-hidden">
                <button
                    onClick={() => onChange(true)}
                    className={`px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${getYesStyle()}`}
                >
                    Yes
                </button>
                <button
                    onClick={() => onChange(false)}
                    className={`px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${getNoStyle()}`}
                >
                    No
                </button>
            </div>
        </div>
    );
};

const LogDetailModal = ({ log, onClose }: { log: any; onClose: () => void }) => {
    const DetailRow = ({ label, value, icon: Icon, color = "text-[#5F6F89]" }: any) => (
        <div className="flex items-start gap-4 p-4 bg-[#F8FBFF] border border-[#E3ECF5] rounded-2xl">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white border border-[#E3ECF5] ${color}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="space-y-1">
                <p className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest">{label}</p>
                <p className="text-[14px] font-bold text-[#1A2B49] uppercase tracking-tight">{value || 'N/A'}</p>
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-[#1A2B49]/20 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white border border-[#E3ECF5] w-full max-w-2xl max-h-[85vh] rounded-[24px] shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-6 border-b border-[#E3ECF5] flex items-center justify-between bg-[#F8FBFF]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white text-[#1E88E5] rounded-2xl flex items-center justify-center border border-[#E3F2FD] shadow-sm">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[#1A2B49] uppercase tracking-tight">Log Details</h3>
                            <p className="text-[12px] font-bold text-[#8A99B3] uppercase tracking-widest">Entry Date: {new Date(log.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-white hover:bg-[#F0F6FF] rounded-xl text-[#8A99B3] hover:text-[#1E88E5] border border-[#E3ECF5] transition-all"><X className="w-6 h-6" /></button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Section A */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Thermometer className="w-5 h-5 text-[#1E88E5]" />
                            <h4 className="text-[13px] font-bold text-[#1A2B49] uppercase tracking-widest">Medicine Intake</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailRow icon={CheckCircle2} label="Took Medicine" value={log.took_medicine ? 'YES' : 'NO'} color={log.took_medicine ? 'text-[#1E7F4F]' : 'text-[#D32F2F]'} />
                            <DetailRow icon={Clock} label="Time Taken" value={log.time_taken} />
                            {log.took_medicine && (
                                <>
                                    <DetailRow icon={Activity} label="Full Dose" value={log.full_dose ? 'YES' : 'NO'} color={log.full_dose ? 'text-[#1E88E5]' : 'text-[#E65100]'} />
                                    {!log.full_dose && <DetailRow icon={Plus} label="Dose Amount" value={log.dose_amount} />}
                                </>
                            )}
                            {!log.took_medicine && <DetailRow icon={AlertTriangle} label="Reason Missed" value={log.reason_missed} color="text-[#D32F2F]" />}
                        </div>
                    </div>

                    {/* Section B */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-[#D32F2F]" />
                            <h4 className="text-[13px] font-bold text-[#1A2B49] uppercase tracking-widest">Adverse Events</h4>
                        </div>
                        {log.noticed_side_effects ? (
                            <div className="space-y-4">
                                <div className="p-6 bg-[#FDECEA] border border-[#FFCDD2] rounded-2xl space-y-2">
                                    <p className="text-[11px] font-bold text-[#D32F2F]/60 uppercase tracking-widest">Symptom Description</p>
                                    <p className="text-[#1A2B49] font-bold leading-relaxed">{log.side_effect_description}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <DetailRow icon={Clock} label="Onset Time" value={log.side_effect_start_time} />
                                    <DetailRow icon={Activity} label="Ongoing" value={log.side_effect_ongoing ? 'YES' : 'NO'} />
                                    <DetailRow icon={Microscope} label="Severity" value={log.severity} color="text-[#D32F2F]" />
                                    <DetailRow icon={User} label="Medical Care Sought" value={log.sought_medical_care ? 'YES' : 'NO'} />
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-[#E9F7EF] border border-[#C8E6C9] rounded-2xl flex items-center gap-3 text-[#1E7F4F]">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="text-[12px] font-bold uppercase tracking-widest">No side effects reported today</span>
                            </div>
                        )}
                    </div>

                    {/* Section C */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Heart className="w-5 h-5 text-[#1E88E5]" />
                            <h4 className="text-[13px] font-bold text-[#1A2B49] uppercase tracking-widest">General Health</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailRow icon={Activity} label="Overall Feeling" value={log.overall_feeling?.replace('_', ' ')} color="text-[#1E88E5]" />
                            {log.supporting_file && (
                                <div className="flex items-start gap-4 p-4 bg-[#FFF3E0] border border-[#FFE0B2] rounded-2xl group cursor-pointer hover:bg-[#FFE0B2]/50 transition-all">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white border border-[#FFE0B2] text-[#E65100]">
                                        <FileUp className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-[#8A99B3] uppercase tracking-widest">Attachment</p>
                                        <a href={log.supporting_file} target="_blank" rel="noreferrer" className="text-[14px] font-bold text-[#E65100] uppercase hover:underline">View Uploaded File</a>
                                    </div>
                                </div>
                            )}
                        </div>
                        {log.health_updates && (
                            <div className="p-6 bg-[#F0F6FF] border border-[#E3F2FD] rounded-2xl space-y-2">
                                <p className="text-[11px] font-bold text-[#1E88E5]/60 uppercase tracking-widest">Health Updates</p>
                                <p className="text-[#1A2B49] font-bold italic leading-relaxed">"{log.health_updates}"</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-8 border-t border-[#E3ECF5] bg-[#F8FBFF] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-10 py-4 bg-white hover:bg-[#F0F6FF] text-[#5F6F89] hover:text-[#1A2B49] border border-[#E3ECF5] rounded-xl text-[12px] font-bold uppercase tracking-widest transition-all shadow-sm"
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

    const getLocalISODate = (date: Date) => {
        const YYYY = date.getFullYear();
        const MM = String(date.getMonth() + 1).padStart(2, '0');
        const DD = String(date.getDate()).padStart(2, '0');
        return `${YYYY}-${MM}-${DD}`;
    };

    const [logDate, setLogDate] = useState(preselectedDate || getLocalISODate(new Date()));

    React.useEffect(() => {
        if (preselectedDate) {
            setLogDate(preselectedDate);
            setViewMode('FORM');
        }
    }, [preselectedDate]);

    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [selectedLog, setSelectedLog] = useState<any | null>(preselectedLog || null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(!!preselectedLog);

    React.useEffect(() => {
        if (preselectedLog) {
            setSelectedLog(preselectedLog);
            setIsPreviewModalOpen(true);
            setViewMode('HISTORY');
        }
    }, [preselectedLog]);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

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
                        if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
                    } else {
                        if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) { resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() })); }
                        else { resolve(file); }
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

    React.useEffect(() => {
        if (!supportingFile) { setPreviewUrl(null); return; }
        const url = URL.createObjectURL(supportingFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [supportingFile]);

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
            if (tookMedicine === null) { alert("Please answer if you took your medicine today."); return; }
            if (!logDate) { alert("Please select the entry date."); return; }
            if (!timeTaken) { alert("Please manually enter the time."); return; }
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
            formData.append('date', logDate);

            const resp = await authFetch(`${apiUrl}/api/daily-medication-logs/`, {
                method: 'POST',
                body: formData
            });

            if (resp.ok) {
                alert(isDraft ? "Draft saved successfully." : "Daily log submitted successfully.");
                if (!isDraft) {
                    resetForm();
                    fetchHistory();
                    if (onAction) { onAction('NAVIGATE_TO_COMPLETED_TASKS'); }
                    else { setViewMode('HISTORY'); }
                }
            } else { throw new Error("Failed to submit"); }
        } catch (e) {
            alert("Connection error. Your entry has been saved locally.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 pb-32">
            {/* Navigation Strip */}
            <div className="flex justify-between items-center bg-white border border-[#E3ECF5] p-2 rounded-2xl shadow-sm">
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('FORM')}
                        className={`px-8 py-3 rounded-xl text-[13px] font-bold uppercase tracking-widest transition-all ${viewMode === 'FORM' ? 'bg-[#E3F2FD] text-[#1E88E5]' : 'text-[#5F6F89] hover:text-[#5F6F89]'}`}
                    >
                        Daily Log
                    </button>
                    <button
                        onClick={() => setViewMode('HISTORY')}
                        className={`px-8 py-3 rounded-xl text-[13px] font-bold uppercase tracking-widest transition-all ${viewMode === 'HISTORY' ? 'bg-[#E3F2FD] text-[#1E88E5]' : 'text-[#5F6F89] hover:text-[#5F6F89]'}`}
                    >
                        History
                    </button>
                </div>
                <div className="px-6 text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00C853]" />
                    SECURE CLINICAL LOG
                </div>
            </div>

            {viewMode === 'FORM' ? (
                <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                    <Card className="p-0 overflow-hidden bg-white">
                        <div className="p-6 bg-gradient-to-br from-[#F0F6FF] to-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <ClipboardList className="w-40 h-40 text-[#1E88E5]" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-[#1A2B49] uppercase tracking-tight">Daily Protocol Log</h2>
                            <p className="text-[12px] font-bold text-[#1E88E5] uppercase tracking-widest mt-2 flex items-center gap-3">
                                <span className="w-10 h-0.5 bg-[#1E88E5]/20" />
                                Patient Status Entry
                            </p>
                            <p className="mt-4 text-[13px] font-bold text-[#5F6F89] leading-none whitespace-nowrap overflow-hidden text-ellipsis">
                                Please document your medication intake and health status for today. Secure reporting ensures clinical accuracy and participant safety.
                            </p>
                        </div>
                    </Card>

                    {/* Section A: Medicine Intake */}
                    <Card className="p-6 bg-white">
                        <section className="space-y-4">
                            <SectionHeader icon={Thermometer} title="A. Medication Adherence" subtitle="Documenting daily study medicine use" />

                            <div className="space-y-6">
                                <BooleanChoice label="Did you take your medicine today?" value={tookMedicine} onChange={setTookMedicine} />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-[#F8FBFF] pt-6">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-[#1E88E5]" /> Entry Date
                                        </label>
                                        <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="w-full bg-[#F8FBFF] border border-[#E3ECF5] rounded-xl p-3 text-[#1A2B49] font-bold text-lg outline-none focus:border-[#1E88E5] transition-all" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-[#1E88E5]" /> Time of Action
                                        </label>
                                        <input type="time" value={timeTaken} onChange={(e) => setTimeTaken(e.target.value)} className="w-full bg-[#F8FBFF] border border-[#E3ECF5] rounded-xl p-3 text-[#1A2B49] font-bold text-lg outline-none focus:border-[#1E88E5] transition-all" />
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {tookMedicine && (
                                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 bg-[#F0F6FF]/30 p-8 rounded-2xl border border-[#E3F2FD]">
                                        <BooleanChoice label="Did you take the full specified dose?" value={fullDose} onChange={setFullDose} />
                                        {fullDose === false && (
                                            <div className="space-y-8 animate-in fade-in duration-300">
                                                <div className="space-y-3">
                                                    <label className="text-[14px] font-bold text-[#5F6F89] uppercase tracking-widest block">How much was administered?</label>
                                                    <input type="text" placeholder="Specify (e.g., 2.5ml, 1 pill)" value={doseAmount} onChange={(e) => setDoseAmount(e.target.value)} className="w-full bg-white border border-[#E3ECF5] rounded-xl p-4 text-[#1A2B49] font-bold outline-none focus:border-[#1E88E5]" />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[14px] font-bold text-[#5F6F89] uppercase tracking-widest block">Reason for partial dose</label>
                                                    <textarea placeholder="Please specify..." value={reasonMissed} onChange={(e) => setReasonMissed(e.target.value)} className="w-full bg-white border border-[#E3ECF5] rounded-xl p-4 h-24 text-[#1A2B49] font-bold outline-none focus:border-[#1E88E5] resize-none" />
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {tookMedicine === false && (
                                <div className="space-y-4 bg-[#FDECEA] p-8 rounded-2xl border border-[#FFCDD2] animate-in zoom-in-95">
                                    <label className="text-[14px] font-bold text-[#D32F2F] uppercase tracking-widest block">Reason for missed dose</label>
                                    <textarea value={reasonMissed} onChange={(e) => setReasonMissed(e.target.value)} placeholder="Please explain why the dose was omitted..." className="w-full bg-white border border-[#FFCDD2] rounded-xl p-6 h-32 text-[#D32F2F] font-bold outline-none focus:border-[#D32F2F] shadow-sm resize-none" />
                                </div>
                            )}
                        </section>
                    </Card>

                    {/* Section B: Adverse Events */}
                    <Card className="p-6 bg-white">
                        <section className="space-y-10">
                            <SectionHeader icon={AlertTriangle} title="B. Adverse Events Monitoring" subtitle="Participant safety tracking" />

                            <BooleanChoice label="Did you notice any side effects or unusual symptoms?" value={noticedAE} onChange={setNoticedAE} inverse={true} />

                            <AnimatePresence>
                                {noticedAE && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-10">
                                        <div className="space-y-3">
                                            <label className="text-[13px] font-bold text-[#8A99B3] uppercase tracking-widest block">Symptom Description</label>
                                            <textarea value={aeDescription} onChange={(e) => setAeDescription(e.target.value)} placeholder="Describe the symptoms in detail..." className="w-full h-32 bg-[#F8FBFF] border border-[#E3ECF5] rounded-xl p-6 text-[#1A2B49] font-bold text-lg outline-none focus:border-[#D32F2F] shadow-inner resize-none" />
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                            <div className="space-y-3">
                                                <label className="text-[13px] font-bold text-[#5F6F89] uppercase tracking-widest block">Onset Time</label>
                                                <input type="text" placeholder="e.g., 1 hour after dose" value={aeStartTime} onChange={(e) => setAeStartTime(e.target.value)} className="w-full bg-[#F8FBFF] border border-[#E3ECF5] rounded-xl p-3 text-[#1A2B49] font-bold outline-none" />
                                            </div>
                                            <BooleanChoice label="Is it still ongoing?" value={aeOngoing} onChange={setAeOngoing} inverse={true} />
                                        </div>

                                        <div className="space-y-6">
                                            <label className="text-[13px] font-bold text-[#5F6F89] uppercase tracking-widest block">Severity Level</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                {[
                                                    { id: 'MILD', color: 'bg-[#00C853]', border: 'border-[#00C853]' },
                                                    { id: 'MODERATE', color: 'bg-[#FFAB00]', border: 'border-[#FFAB00]' },
                                                    { id: 'SEVERE', color: 'bg-[#D32F2F]', border: 'border-[#D32F2F]' }
                                                ].map(lvl => (
                                                    <button 
                                                        key={lvl.id} 
                                                        onClick={() => setAeSeverity(lvl.id)} 
                                                        className={`py-4 rounded-xl text-[12px] font-bold uppercase tracking-widest border transition-all ${aeSeverity === lvl.id ? `${lvl.color} ${lvl.border} text-white shadow-md` : 'bg-[#F8FBFF] border-[#E3ECF5] text-[#5F6F89] hover:text-[#5F6F89]'}`}
                                                    >
                                                        {lvl.id}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-[#FDECEA]/30 p-6 rounded-2xl border border-[#FFCDD2]">
                                            <BooleanChoice label="Activity Interference?" value={aeInterfered} onChange={setAeInterfered} inverse={true} />
                                            <BooleanChoice label="Medical Care Sought?" value={aeMedicalCare} onChange={setAeMedicalCare} inverse={true} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>
                    </Card>

                    {/* Section C: Health Wellness */}
                    <Card className="p-6 sm:p-8 bg-white">
                        <section className="space-y-4">
                            <SectionHeader icon={Activity} title="C. Holistic Wellness Review" subtitle="General health status" />

                            <div className="space-y-8">
                                <label className="text-[14px] font-bold text-[#5F6F89] uppercase tracking-widest block">Overall wellness today?</label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {[
                                        { id: 'VERY_GOOD', label: 'VERY GOOD', color: 'bg-[#00C853]', border: 'border-[#00C853]' },
                                        { id: 'GOOD', label: 'GOOD', color: 'bg-[#AEEA00]', border: 'border-[#AEEA00]' },
                                        { id: 'FAIR', label: 'FAIR', color: 'bg-[#FFD600]', border: 'border-[#FFD600]' },
                                        { id: 'POOR', label: 'POOR', color: 'bg-[#FF5252]', border: 'border-[#FF5252]' }
                                    ].map(opt => (
                                        <button 
                                            key={opt.id} 
                                            onClick={() => setOverallFeeling(opt.id)} 
                                            className={`py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest border transition-all ${overallFeeling === opt.id ? `${opt.color} ${opt.border} text-white shadow-md scale-[1.03]` : 'bg-[#F8FBFF] border-[#E3ECF5] text-[#5F6F89]'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-5">
                                <label className="text-[14px] font-bold text-[#5F6F89] uppercase tracking-widest">Additional Health Remarks</label>
                                <textarea value={healthUpdates} onChange={(e) => setHealthUpdates(e.target.value)} placeholder="..." className="w-full bg-[#F8FBFF] border border-[#E3ECF5] rounded-xl p-6 h-40 text-[#1A2B49] font-bold outline-none shadow-inner" />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[13px] font-bold text-[#5F6F89] uppercase tracking-widest block">Document Attachment (Optional)</label>
                                <div className="relative group">
                                    <input type="file" accept=".pdf, .png, .jpg, .jpeg" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    <div className={`p-10 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all ${supportingFile ? 'bg-[#E3F2FD]/50 border-[#1E88E5]' : 'bg-[#F8FBFF] border-[#E3ECF5] group-hover:bg-[#F0F6FF]'}`}>
                                        {isProcessingFile ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-2 border-[#1E88E5]/30 border-t-[#1E88E5] rounded-full animate-spin" />
                                                <span className="text-[12px] font-bold text-[#1E88E5] uppercase tracking-widest">Optimizing File...</span>
                                            </div>
                                        ) : supportingFile ? (
                                            <div className="flex flex-col items-center gap-4 w-full">
                                                {supportingFile.type.startsWith('image/') && previewUrl ? (
                                                    <img src={previewUrl} alt="Preview" className="h-32 w-auto rounded-xl object-cover border border-[#E3ECF5] shadow-lg" />
                                                ) : <div className="p-5 bg-white rounded-xl border border-[#E3ECF5] text-[#1E88E5]"><FileText className="w-10 h-10" /></div>}
                                                <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-[#E3ECF5] shadow-sm">
                                                    <span className="text-[12px] font-bold text-[#1A2B49] truncate max-w-[200px]">{supportingFile.name}</span>
                                                    <div className="flex items-center gap-1 ml-4 border-l pl-3 border-[#E3ECF5] relative z-20">
                                                        {previewUrl && (
                                                            <button 
                                                                type="button" 
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(previewUrl, '_blank'); }} 
                                                                className="p-1.5 text-[#1E88E5] hover:bg-[#E3F2FD] rounded-lg transition-all" 
                                                                title="Preview File"
                                                            >
                                                                <Eye className="w-4.5 h-4.5" />
                                                            </button>
                                                        )}
                                                        <button 
                                                            type="button" 
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSupportingFile(null); }} 
                                                            className="p-1.5 text-[#D32F2F] hover:bg-[#FDECEA] rounded-lg transition-all" 
                                                            title="Delete File"
                                                        >
                                                            <X className="w-4.5 h-4.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-[#5F6F89]" />
                                                <span className="text-[14px] font-bold text-[#5F6F89] uppercase tracking-widest text-center">Click to upload supporting report or image</span>
                                                <p className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-tighter text-center">Metadata stripped for HIPAA compliance</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </Card>

                    {/* Security Disclaimer */}
                    <div className="bg-[#FDECEA] border border-[#FFCDD2] p-8 rounded-2xl flex items-center justify-center gap-5 text-center shadow-sm">
                        <AlertTriangle className="w-8 h-8 text-[#D32F2F]" />
                        <p className="text-[14px] font-bold text-[#D32F2F] uppercase tracking-tight leading-relaxed italic">
                            IF EXPERIENCING SEVERE ADVERSE REACTIONS OR MEDICAL EMERGENCY, DISCONTINUE USE AND CALL EMERGENCY SERVICES (911) IMMEDIATELY.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-10">
                        <button onClick={() => handleSubmitLog(true)} disabled={isSubmitting} className="flex-1 py-5 rounded-xl border border-[#E3ECF5] bg-white text-[#5F6F89] font-bold uppercase tracking-widest hover:bg-[#F8FBFF] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-sm"><Save className="w-5 h-5" /> Save Draft</button>
                        <button onClick={() => handleSubmitLog(false)} disabled={isSubmitting} className="flex-[2] py-5 rounded-xl bg-[#1E88E5] text-white font-bold uppercase tracking-widest hover:bg-[#1565C0] transition-all flex items-center justify-center gap-4 shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50">
                            {isSubmitting ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                            Submit Final Log
                        </button>
                    </div>
                </div>
            ) : (
                /* HISTORY VIEW */
                <div className="space-y-4 animate-in fade-in duration-500">
                    {isLoadingHistory ? (
                        <div className="text-center py-20 text-[#5F6F89] uppercase font-bold tracking-widest">Syncing History...</div>
                    ) : history.length === 0 ? (
                        <Card className="text-center py-24 flex flex-col items-center border border-dashed border-[#E3ECF5]">
                            <ClipboardList className="w-16 h-16 text-[#E3ECF5] mb-6" />
                            <p className="text-[14px] font-bold text-[#5F6F89] uppercase tracking-widest">No protocol logs detected in registry.</p>
                        </Card>
                    ) : (
                        <div className="grid-system">
                            {history.map((log: any) => (
                            <Card key={log.id} onClick={() => setSelectedLog(log)} className="p-5 hover:border-[#1E88E5]/30 transition-all cursor-pointer group shadow-sm bg-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${log.took_medicine ? 'bg-[#E9F7EF] text-[#1E7F4F]' : 'bg-[#FDECEA] text-[#D32F2F]'}`}>
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h5 className="text-[14px] font-bold text-[#1A2B49] uppercase tracking-tight">ENTRY DATE: {new Date(log.date).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}</h5>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <Badge color={log.took_medicine ? 'green' : 'red'}>{log.took_medicine ? 'MEDICINE TAKEN' : 'DOSE MISSED'}</Badge>
                                                <span className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest">{log.overall_feeling?.replace('_', ' ')}</span>
                                                {log.supporting_file && (
                                                    <div className="flex items-center gap-1.5 ml-2 border-l border-[#E3ECF5] pl-3">
                                                        <FileText className="w-3.5 h-3.5 text-[#1E88E5]" />
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); window.open(log.supporting_file, '_blank'); }}
                                                            className="text-[10px] font-bold text-[#1E88E5] hover:underline uppercase"
                                                        >
                                                            View Attachment
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 bg-[#F8FBFF] rounded-xl flex items-center justify-center text-[#B0BCCF] group-hover:text-[#1E88E5] group-hover:bg-[#E3F2FD] transition-all"><ChevronRight className="w-6 h-6" /></div>
                                </div>
                            </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <AnimatePresence> {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />} </AnimatePresence>
        </div>
    );
};

export default LogsView;
