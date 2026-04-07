import React, { useState } from 'react';
import { authFetch, API } from '../../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, AlertCircle, FileUp, ClipboardList, CheckCircle2,
    AlertTriangle, ChevronRight, Info, Plus, Calendar,
    FileText, Save, Clock, ArrowRight, X, Trash2, Microscope,
    Heart, Thermometer, User, Upload
} from 'lucide-react';
import { Card } from './SharedComponents';

// --- SUB-COMPONENTS (Defined outside to prevent re-mounting/flicker) ---

const SectionHeader = ({ title, icon: Icon, subtitle }: any) => (
    <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-cyan-400">
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <h4 className="text-[20px] font-black text-white italic uppercase tracking-tighter">{title}</h4>
            <p className="text-[13px] font-black text-slate-500 uppercase tracking-widest">{subtitle}</p>
        </div>
    </div>
);

const BooleanChoice = ({ value, onChange, label }: any) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-1">
        {label && <label className="text-[15px] font-black text-slate-400 uppercase tracking-widest block flex-1">{label}</label>}
        <div className="flex gap-2 p-1.5 bg-white/[0.02] border border-white/5 rounded-[1.5rem] w-fit shadow-inner-white">
            <button
                onClick={() => onChange(true)}
                className={`px-10 py-3 rounded-2xl text-[14px] font-black uppercase tracking-widest transition-all ${value === true ? 'bg-[#00e676] text-slate-900 shadow-xl shadow-[#00e676]/20 scale-105' : 'text-slate-500 hover:text-white'}`}
            >
                Yes
            </button>
            <button
                onClick={() => onChange(false)}
                className={`px-10 py-3 rounded-2xl text-[14px] font-black uppercase tracking-widest transition-all ${value === false ? 'bg-red-500 text-white shadow-xl shadow-red-500/20 scale-105' : 'text-slate-500 hover:text-white'}`}
            >
                No
            </button>
        </div>
    </div>
);

const LogDetailModal = ({ log, onClose }: { log: any; onClose: () => void }) => {
    const DetailRow = ({ label, value, icon: Icon, color = "text-slate-400" }: any) => (
        <div className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/5 ${color}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
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
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-cyan-900/20 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 border border-cyan-500/20">
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
                            <Thermometer className="w-5 h-5 text-cyan-400" />
                            <h4 className="text-[14px] font-black text-white uppercase tracking-widest">Medicine Intake</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailRow icon={CheckCircle2} label="Took Medicine" value={log.took_medicine ? 'YES' : 'NO'} color={log.took_medicine ? 'text-green-400' : 'text-red-400'} />
                            <DetailRow icon={Clock} label="Time Taken" value={log.time_taken} />
                            {log.took_medicine && (
                                <>
                                    <DetailRow icon={Activity} label="Full Dose" value={log.full_dose ? 'YES' : 'NO'} color={log.full_dose ? 'text-cyan-400' : 'text-orange-400'} />
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
                                    <p className="text-[10px] font-black text-red-400/60 uppercase tracking-widest px-1">Symptom Description</p>
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
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Additional AE Comments</p>
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
                                <div className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl group cursor-pointer hover:bg-cyan-500/5 hover:border-cyan-500/20 transition-all">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/5 text-cyan-400">
                                        <FileUp className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attachment</p>
                                        <a href={log.supporting_file} target="_blank" rel="noreferrer" className="text-[14px] font-bold text-cyan-400 uppercase hover:underline">View Uploaded File</a>
                                    </div>
                                </div>
                            )}
                        </div>
                        {log.health_updates && (
                            <div className="p-6 bg-purple-500/5 border border-purple-500/10 rounded-2xl space-y-2">
                                <p className="text-[10px] font-black text-purple-400/60 uppercase tracking-widest px-1">Health Updates</p>
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

const LogsView = ({ study, onAction }: { study?: any; onAction?: (title: string, task?: any) => void }) => {
    const apiUrl = API || 'http://localhost:8000';

    // UI Toggle
    const [viewMode, setViewMode] = useState<'FORM' | 'HISTORY'>('FORM');

    // --- DAILY LOG STATE ---
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // A. Medicine Intake
    const [tookMedicine, setTookMedicine] = useState<boolean | null>(null);
    const [timeTaken, setTimeTaken] = useState('');
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

    // --- OTHER STATES ---
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [selectedLog, setSelectedLog] = useState<any | null>(null);

    React.useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const resp = await authFetch(`${apiUrl}/api/daily-medication-logs/`);
            if (resp.ok) {
                const data = await resp.json();
                setHistory(data);
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
    };

    const handleSubmitLog = async (isDraft: boolean = false) => {
        if (!isDraft && tookMedicine === null) {
            alert("Please answer if you took your medicine today.");
            return;
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

            const resp = await authFetch(`${apiUrl}/api/daily-medication-logs/`, {
                method: 'POST',
                body: formData
            });

            if (resp.ok) {
                alert(isDraft ? "Draft saved successfully." : "Daily log submitted successfully.");
                if (!isDraft) {
                    resetForm();
                    fetchHistory();
                    setViewMode('HISTORY');
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
            <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-2 rounded-[2rem]">
                <div className="flex gap-1">
                    <button 
                        onClick={() => setViewMode('FORM')}
                        className={`px-10 py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all ${viewMode === 'FORM' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                        Daily Log Form
                    </button>
                    <button 
                        onClick={() => setViewMode('HISTORY')}
                        className={`px-10 py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all ${viewMode === 'HISTORY' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                        History
                    </button>
                </div>
                <div className="px-6 text-[11px] font-black text-slate-600 uppercase tracking-[0.3em]">
                    SECURE HUB v2.4
                </div>
            </div>

            {viewMode === 'FORM' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Header Image/Gradient */}
                    <Card className="p-0 border border-white/5 overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-cyan-600/20 via-indigo-600/20 to-purple-600/20 flex flex-col justify-center px-8 sm:px-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <ClipboardList className="w-24 h-24 text-white" />
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tighter relative z-10">Daily Medicine Log</h2>
                            <p className="text-[12px] sm:text-[13px] font-bold text-cyan-400/80 uppercase tracking-widest mt-1 relative z-10">Study Participation Tracker</p>
                        </div>
                    </Card>

                    {/* Intro Statement */}
                    <Card className="p-8 sm:p-10 border border-white/5 bg-white/[0.01]">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-cyan-400">
                                <Info className="w-5 h-5" />
                                <span className="text-[14px] font-black uppercase tracking-widest italic">Important Notice</span>
                            </div>
                            <p className="text-[18px] font-bold text-slate-300 leading-relaxed">
                                Please complete this daily log after taking your study medicine. This helps the study team track daily use and monitor any side effects or health concerns.
                            </p>
                            <p className="text-[15px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                Thank you for completing your daily entry. Please answer all questions as accurately as possible.
                            </p>
                            <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-2xl shadow-inner-white">
                                <p className="text-[16px] font-black text-red-400 uppercase tracking-widest flex items-center gap-3 italic leading-relaxed">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    If you experience severe symptoms or a medical emergency, call 911 immediately and contact the study team at (813) 419-0781.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Section A: Medicine Intake */}
                    <Card className="p-8 sm:p-10 border border-white/5 bg-white/[0.01]">
                        <section className="space-y-10">
                            <SectionHeader 
                                icon={Thermometer} 
                                title="A. Medicine Intake" 
                                subtitle="Tracking your daily compliance" 
                            />
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <BooleanChoice 
                                    label="Did you take your medicine today?" 
                                    value={tookMedicine} 
                                    onChange={setTookMedicine} 
                                />
                                
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-1">
                                    <label className="text-[15px] font-black text-slate-400 uppercase tracking-widest block flex-1">What time did you take it?</label>
                                    <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-2xl p-3 px-6 focus-within:border-cyan-500/30 transition-all min-w-[250px]">
                                        <Clock className="w-5 h-5 text-slate-500" />
                                        <input 
                                            type="time" 
                                            value={timeTaken}
                                            onChange={(e) => setTimeTaken(e.target.value)}
                                            className="bg-transparent border-none text-white outline-none w-full font-bold text-2xl uppercase tracking-tighter" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {tookMedicine && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-cyan-500/5 p-8 rounded-[2rem] border border-cyan-500/10"
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
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-cyan-500/30"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest block px-1">Reason for missed or partial dose, if applicable</label>
                                                    <textarea 
                                                        placeholder="Explain why a partial dose was taken..."
                                                        value={reasonMissed}
                                                        onChange={(e) => setReasonMissed(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 h-24 text-white font-bold outline-none focus:border-cyan-500/30 resize-none"
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
                                            />
                                        </div>

                                        <div className="space-y-6">
                                            <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest block px-1">Severity</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                {['MILD', 'MODERATE', 'SEVERE'].map(lvl => (
                                                    <button 
                                                        key={lvl}
                                                        onClick={() => setAeSeverity(lvl)}
                                                        className={`py-5 rounded-2xl text-[14px] font-black uppercase tracking-widest transition-all border ${aeSeverity === lvl ? 'bg-red-600 border-red-500 text-white shadow-xl shadow-red-600/20 scale-[1.02]' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}
                                                    >
                                                        {lvl}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-red-500/[0.03] p-8 rounded-[2rem] border border-red-500/5">
                                            <BooleanChoice 
                                                label="Interfered with daily activities?" 
                                                value={aeInterfered} 
                                                onChange={setAeInterfered} 
                                            />
                                            <BooleanChoice 
                                                label="Did you seek medical care?" 
                                                value={aeMedicalCare} 
                                                onChange={setAeMedicalCare} 
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
                                    {['VERY_GOOD', 'GOOD', 'FAIR', 'POOR'].map(opt => (
                                        <button 
                                            key={opt}
                                            onClick={() => setOverallFeeling(opt)}
                                            className={`py-5 rounded-xl text-[12px] font-black uppercase tracking-widest border transition-all ${overallFeeling === opt ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-white/[0.02] border-white/5 text-slate-500'}`}
                                        >
                                            {opt.replace('_', ' ')}
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
                                        onChange={(e) => setSupportingFile(e.target.files ? e.target.files[0] : null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                    />
                                    <div className={`p-10 rounded-[2rem] border-2 border-dashed flex items-center justify-center gap-4 transition-all ${supportingFile ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-white/[0.02] border-white/10 group-hover:bg-white/[0.04]'}`}>
                                        {supportingFile ? (
                                            <>
                                                <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                                                <span className="text-[14px] font-black text-white italic">{supportingFile.name}</span>
                                                <button onClick={(e) => { e.stopPropagation(); setSupportingFile(null); }} className="text-red-500 hover:text-red-400 p-2"><Trash2 className="w-5 h-5" /></button>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-6 h-6 text-slate-500" />
                                                <span className="text-[14px] font-black text-slate-500 uppercase tracking-widest">Select Image or Document</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </Card>

                    {/* Emergency Safety Message */}
                    <div className="bg-red-600 shadow-2xl shadow-red-600/20 p-8 sm:p-10 rounded-[3rem] flex items-start gap-6 border-2 border-red-500/50">
                        <AlertCircle className="w-10 h-10 text-white shrink-0 mt-1" />
                        <div className="space-y-6">
                            <h5 className="text-[24px] font-black text-white italic uppercase tracking-tighter">Emergency Safety Protocol</h5>
                            <p className="text-[18px] font-bold text-white leading-relaxed uppercase tracking-wide">
                                If you experience a serious side effect, stop the study product and contact the study team immediately at <span className="underline select-all text-white">(813) 419-0781</span>. 
                                If this is a medical emergency, call 911 right away.
                            </p>
                        </div>
                    </div>

                    {/* Form Buttons */}
                    <div className="flex flex-col sm:flex-row gap-6 pt-10 pb-20">
                        <button 
                            onClick={() => handleSubmitLog(true)}
                            disabled={isSubmitting}
                            className="flex-1 py-6 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-[2rem] text-[15px] font-black uppercase tracking-[0.25em] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            <Save className="w-6 h-6" />
                            Save Draft
                        </button>
                        <button 
                            onClick={() => handleSubmitLog(false)}
                            disabled={isSubmitting}
                            className="flex-[2] py-6 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-[2rem] text-[15px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-indigo-500/40 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                            ) : (
                                <ArrowRight className="w-6 h-6" />
                            )}
                            Submit Daily Log
                        </button>
                    </div>
                </div>
            ) : (
                /* HISTORY VIEW */
                <div className="space-y-6">
                    {isLoadingHistory ? (
                        <div className="text-center py-20 animate-pulse text-slate-500 uppercase font-black tracking-widest text-[14px]">Syncing health history...</div>
                    ) : history.length === 0 ? (
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
                                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-cyan-400 transition-colors">{log.took_medicine ? 'Dose Taken' : 'Dose Missed'} • {log.overall_feeling?.replace('_', ' ') || 'No feeling reported'}</p>
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
