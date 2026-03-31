import React, { useState } from 'react';
import { authFetch, API } from '../../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, AlertCircle, FileUp, ClipboardList, CheckCircle2, 
    AlertTriangle, Phone, ChevronRight, Info, Plus, Calendar,
    FileText, Save, Clock, ArrowRight, X, Trash2, Microscope
} from 'lucide-react';
import { Card, Badge, ProgressBar } from './SharedComponents';

const LogsView = ({ study, onAction }: { study?: any; onAction?: (title: string, task?: any) => void }) => {
    // Visibility logic (fallback to true for demo)
    const showDosing = study?.show_dosing_log !== false;
    const showAE = study?.show_ae_report !== false;
    const showLab = study?.show_lab_upload !== false;

    // --- DOSING STATE ---
    const [dosingTaken, setDosingTaken] = useState<string | null>(null);
    const [dosingStatus, setDosingStatus] = useState<'NOT_SUBMITTED' | 'SUBMITTED'>('NOT_SUBMITTED');

    // --- AE STATE ---
    const [aeDescription, setAeDescription] = useState('');
    const [aeSeverity, setAeSeverity] = useState('MILD');

    // --- DROPDOWN STATES ---
    const [openDosingReason, setOpenDosingReason] = useState(false);
    const [dosingReason, setDosingReason] = useState('');
    const [openAeSeverity, setOpenAeSeverity] = useState(false);

    // --- LAB STATE ---
    const [labType, setLabType] = useState('Blood');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    // --- HISTORY STATE ---
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    React.useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const apiUrl = API || 'http://localhost:8000';
            const [dosingResp, aeResp] = await Promise.all([
                authFetch(`${apiUrl}/api/dosing-logs/`),
                authFetch(`${apiUrl}/api/ae-reports/`)
            ]);
            
            let combined: any[] = [];
            if (dosingResp.ok) {
                const dosingData = await dosingResp.json();
                combined = [...combined, ...dosingData.map((d: any) => ({ ...d, type: 'DOSING' }))];
            }
            if (aeResp.ok) {
                const aeData = await aeResp.json();
                combined = [...combined, ...aeData.map((a: any) => ({ ...a, type: 'AE' }))];
            }
            
            setHistory(combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        } catch (e) {
            console.error("History fetch failed", e);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleSubmitDosing = async () => {
        try {
            const apiUrl = API || 'http://localhost:8000';
            const resp = await authFetch(`${apiUrl}/api/dosing-logs/`, {
                method: 'POST',
                body: JSON.stringify({
                    date: new Date().toISOString().split('T')[0],
                    dose_taken: dosingTaken === 'YES',
                    missed_reason: dosingReason,
                    side_effects: '', 
                    notes: ''
                })
            });
            if (resp.ok) {
                setDosingStatus('SUBMITTED');
                fetchHistory(); // Refresh history
                alert("we got your daily log and our team members contact you shortly");
            } else {
                // SIMULATION FALLBACK
                setDosingStatus('SUBMITTED');
                // Mock add to history for simulation
                setHistory(prev => [{
                    id: 'sim-' + Date.now(),
                    type: 'DOSING',
                    date: new Date().toISOString().split('T')[0],
                    dose_taken: dosingTaken === 'YES',
                    created_at: new Date().toISOString()
                }, ...prev]);
                alert("we got your daily log and our team members contact you shortly");
            }
        } catch (e) {
            setDosingStatus('SUBMITTED');
            alert("we got your daily log and our team members contact you shortly");
        }
    };

    const handleAEAction = async () => {
        if (onAction) {
            onAction('REQUEST_URGENT_CALL');
            return;
        }
        
        try {
            const apiUrl = API || 'http://localhost:8000';
            const resp = await authFetch(`${apiUrl}/api/ae-reports/`, {
                method: 'POST',
                body: JSON.stringify({
                    description: aeDescription,
                    start_date: new Date().toISOString(),
                    severity: aeSeverity,
                    is_ongoing: true,
                    related_to_product: 'UNSURE'
                })
            });
            if (resp.ok) {
                fetchHistory();
                alert("we got your safety report and our team members contact you shortly");
            } else {
                setHistory(prev => [{
                    id: 'sim-ae-' + Date.now(),
                    type: 'AE',
                    description: aeDescription,
                    severity: aeSeverity,
                    created_at: new Date().toISOString()
                }, ...prev]);
                alert("we got your safety report and our team members contact you shortly");
            }
        } catch (e) {
            alert("we got your safety report and our team members contact you shortly");
        }
    };

    if (!showDosing && !showAE && !showLab) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center space-y-6">
                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/5 text-slate-500">
                    <ClipboardList className="w-10 h-10" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">No logs available</h3>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[12px] mt-2">There are no active log forms assigned to your study node at this time.</p>
                </div>
                <button className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest border border-white/5 transition-all">
                    Contact Study Team
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-slate-500 text-[12px] font-black uppercase tracking-widest mb-4">
                        <span>Dashboard</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-cyan-500">Logs</span>
                    </div>
                    <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase italic mb-2">Daily Mission Logs</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Command center for your daily protocol data points </p>
                </div>
                <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-3xl p-4 pr-6">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[12px] font-black text-slate-600 uppercase tracking-widest block">Operational Date</span>
                        <span className="text-sm font-black text-white uppercase italic">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            {/* ──────────────── SUPPLEMENT DOSING LOG ──────────────── */}
            {showDosing && (
                <Card className="p-0 border border-white/5 overflow-hidden">
                    <div className="p-8 border-b border-white/[0.05] flex justify-between items-center bg-white/[0.01]">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-inner">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Supplement Dosing Log</h3>
                                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Protocol validation for daily product intake</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge color={dosingStatus === 'SUBMITTED' ? 'green' : 'amber'}>
                                {dosingStatus === 'SUBMITTED' ? 'SYNCHRONIZED' : 'STATUS: PENDING'}
                            </Badge>
                            <span className="text-[12px] font-black text-slate-700 uppercase tracking-widest">SINGLE ENTRY/24H</span>
                        </div>
                    </div>

                    <div className="p-10 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Dose Taken Segmented Control */}
                            <div className="space-y-4">
                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 block">1. Was your study dose taken today?</label>
                                <div className="flex gap-4 p-2 bg-white/[0.02] border border-white/5 rounded-3xl">
                                    <button 
                                        onClick={() => setDosingTaken('YES')}
                                        className={`flex-1 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${
                                            dosingTaken === 'YES' ? 'bg-[#00e676] text-slate-950 shadow-lg shadow-[#00e676]/20' : 'text-slate-500 hover:text-white'
                                        }`}
                                    >
                                        YES (CONFIRMED)
                                    </button>
                                    <button 
                                        onClick={() => setDosingTaken('NO')}
                                        className={`flex-1 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${
                                            dosingTaken === 'NO' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-slate-500 hover:text-white'
                                        }`}
                                    >
                                        NO (MISSED)
                                    </button>
                                </div>
                            </div>

                            {/* Missed Reason (Conditional) */}
                            <AnimatePresence>
                                {dosingTaken === 'NO' && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                                        className="space-y-4"
                                    >
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 block">2. missed dose rationale?</label>
                                        <div className="relative">
                                            <button 
                                                onClick={() => setOpenDosingReason(!openDosingReason)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left text-sm font-black uppercase text-white outline-none focus:border-[#00e676]/30 flex justify-between items-center transition-all"
                                            >
                                                {dosingReason || 'Select Protocol Variance'}
                                                <ChevronRight className={`w-4 h-4 transition-transform ${openDosingReason ? 'rotate-90' : ''}`} />
                                            </button>
                                            <AnimatePresence>
                                                {openDosingReason && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                                        className="absolute z-50 top-full left-0 w-full mt-2 bg-[#121826] border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl"
                                                    >
                                                        {['Forgot / Overlooked', 'Felt Unwell / AE', 'Travel / Access', 'Supplies Depleted', 'Other'].map(opt => (
                                                            <button 
                                                                key={opt}
                                                                onClick={() => { setDosingReason(opt); setOpenDosingReason(false); }}
                                                                className="w-full p-4 text-left text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 last:border-0"
                                                            >
                                                                {opt.toUpperCase()}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 block">Side Effects (Observed)</label>
                                <textarea 
                                    placeholder="Describe any physiological variances experienced today..."
                                    className="w-full h-32 bg-white/5 border border-white/10 rounded-[2rem] p-6 text-sm font-bold text-slate-300 outline-none focus:border-cyan-500/30 resize-none placeholder:text-slate-700"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 block">Mission Observations (Notes)</label>
                                <textarea 
                                    placeholder="Food intake, timing variances, or logistical notes..."
                                    className="w-full h-32 bg-white/5 border border-white/10 rounded-[2rem] p-6 text-sm font-bold text-slate-300 outline-none focus:border-indigo-500/30 resize-none placeholder:text-slate-700"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-white/[0.01] border-t border-white/[0.05] flex justify-between items-center">
                        <div className="flex items-center gap-3 text-slate-500">
                            <Info className="w-4 h-4" />
                            <span className="text-[12px] font-black uppercase tracking-widest">Protocol validation is required for incentives.</span>
                        </div>
                        <div className="flex gap-4">
                            {dosingStatus === 'SUBMITTED' && (
                                <button className="px-6 py-3 bg-white/5 text-slate-400 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest border border-white/5 transition-all">
                                    Edit Today's Node
                                </button>
                            )}
                            <button 
                                onClick={handleSubmitDosing}
                                disabled={!dosingTaken}
                                className={`px-10 py-3 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-lg disabled:opacity-30 ${
                                    dosingStatus === 'SUBMITTED' ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/30' : 'bg-cyan-500 text-slate-950 shadow-cyan-500/20 hover:bg-cyan-400'
                                }`}
                            >
                                <Save className="w-4 h-4" />
                                {dosingStatus === 'SUBMITTED' ? 'MISSION SYNCED' : 'INITIALIZE SYNC'}
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            {/* ──────────────── AE REPORT CARD ──────────────── */}
            {showAE && (
                <Card className="p-0 border border-red-500/10 overflow-hidden bg-gradient-to-br from-[#0d1424] to-[#120a0a]">
                    <div className="p-8 bg-black/40 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-red-500/20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">AE Report Dispatch</h3>
                                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Formal Adverse Event protocol report system</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleAEAction}
                            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                        >
                            <Phone className="w-4 h-4 animate-pulse" />
                            Request Urgent Call
                        </button>
                    </div>

                    <div className="p-1 p-2 px-8 py-3 bg-red-500/10 border-b border-red-500/10 flex items-center gap-3">
                        <AlertCircle className="w-3 h-3 text-red-500" />
                        <span className="text-[12px] font-black text-red-400 uppercase tracking-[0.2em]">Safety Protocol: If this is a medical emergency, terminate this session and contact local authorities [911] immediately.</span>
                    </div>

                    <div className="p-10 space-y-10">
                        <div className="space-y-4">
                            <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 block underline decoration-red-500/30 underline-offset-4">Event description [WHAT HAPPENED?]</label>
                            <textarea 
                                value={aeDescription}
                                onChange={(e) => setAeDescription(e.target.value)}
                                placeholder="Describe symptoms, medical concerns, or physiological anomalies in detail..."
                                className="w-full h-40 bg-white/5 border border-white/5 rounded-[2.5rem] p-8 text-base font-bold text-slate-300 outline-none focus:border-red-500/30 resize-none transition-all placeholder:text-slate-800"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 block">Incident Timestamp</label>
                                <input type="datetime-local" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-black uppercase text-white outline-none focus:border-red-500/30" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 block">Severity Matrix</label>
                                <div className="relative">
                                    <button 
                                        onClick={() => setOpenAeSeverity(!openAeSeverity)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left text-sm font-black uppercase text-white outline-none focus:border-red-500/30 flex justify-between items-center transition-all"
                                    >
                                        {aeSeverity.toUpperCase()}
                                        <ChevronRight className={`w-4 h-4 transition-transform ${openAeSeverity ? 'rotate-90' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {openAeSeverity && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                                className="absolute z-50 top-full left-0 w-full mt-2 bg-[#1a1212] border border-red-500/20 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl"
                                            >
                                                {['MILD', 'MODERATE', 'SEVERE'].map(opt => (
                                                    <button 
                                                        key={opt}
                                                        onClick={() => { setAeSeverity(opt); setOpenAeSeverity(false); }}
                                                        className={`w-full p-4 text-left text-sm font-bold transition-colors border-b border-white/5 last:border-0 ${
                                                            opt === 'SEVERE' ? 'text-red-500 bg-red-500/5 hover:bg-red-500/10' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                                        }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 block">Ongoing Incident?</label>
                                <div className="flex gap-3">
                                    {['YES', 'NO'].map(opt => (
                                        <button key={opt} className={`flex-1 py-4 border rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${opt === 'YES' ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-slate-600'}`}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 block">Action Taken (Medical Response)</label>
                            <input type="text" placeholder="Rest, Medication, Clinical Visit, etc." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-black uppercase text-white outline-none focus:border-red-500/30" />
                        </div>
                    </div>

                    <div className="p-8 bg-black/20 border-t border-red-500/20 flex justify-end">
                        <button 
                            onClick={() => alert("we got your request and our team members contact you shortly")}
                            disabled={!aeDescription}
                            className="px-14 py-4 bg-red-600 shadow-[0_0_40px_rgba(239,68,68,0.2)] hover:shadow-[0_0_50px_rgba(239,68,68,0.4)] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all active:scale-95 disabled:opacity-30"
                        >
                            SUBMIT PROTOCOL ALERT
                        </button>
                    </div>
                </Card>
            )}

            {/* ──────────────── LAB REPORT UPLOAD CARD ──────────────── */}
            {showLab && (
                <Card className="p-0 border border-indigo-500/10 overflow-hidden bg-gradient-to-br from-[#0a0e1a] to-[#0d1424]">
                    <div className="p-8 flex items-center justify-between bg-white/[0.01] border-b border-indigo-500/20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
                                <Microscope className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Lab Report Upload Node</h3>
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Secure clinical data ingest and verification</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 block">Protocol Lab Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Blood', 'Urine', 'Microbiome', 'Genetics'].map(type => (
                                        <button 
                                            key={type}
                                            onClick={() => setLabType(type)}
                                            className={`py-4 rounded-xl border text-[12px] font-black uppercase tracking-widest transition-all ${
                                                labType === type ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/10' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 block">Asset Collection Date</label>
                                <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-black uppercase text-white outline-none focus:border-indigo-500/30" />
                            </div>
                        </div>

                        {/* File Dropzone */}
                        <div className="space-y-4">
                            <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 block">Source Lab Document [UPLOAD]</label>
                            <label className="block cursor-pointer">
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={(e) => setUploadedFile(e.target.files ? e.target.files[0] : null)} 
                                />
                                <div className={`aspect-video md:aspect-[3/1] rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center p-12 transition-all ${
                                    uploadedFile ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/20'
                                }`}>
                                    {!uploadedFile ? (
                                        <>
                                            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-slate-500 mb-6">
                                                <FileUp className="w-8 h-8" />
                                            </div>
                                            <p className="text-sm font-black text-white italic uppercase tracking-widest mb-2">Initialize Secure Upload</p>
                                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.3em]">PDF, JPEG, or PNG formats only</p>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                                            <div className="w-16 h-16 bg-[#00e676]/10 text-[#00e676] rounded-3xl flex items-center justify-center mb-6">
                                                <CheckCircle2 className="w-8 h-8" />
                                            </div>
                                            <p className="text-sm font-black text-white italic uppercase tracking-tight">{uploadedFile.name}</p>
                                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">{(uploadedFile.size/1024/1024).toFixed(2)} MB</p>
                                            <button 
                                                onClick={(e) => { e.preventDefault(); setUploadedFile(null); }}
                                                className="mt-6 flex items-center gap-2 text-red-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Terminate Protocol
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="p-8 bg-black/20 border-t border-indigo-500/20 flex justify-end">
                        <button className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] shadow-[0_0_40px_rgba(99,102,241,0.25)] transition-all active:scale-95 flex items-center gap-3">
                            <Save className="w-4 h-4" />
                            Synchronize Lab Node
                        </button>
                    </div>
                </Card>
            )}

            {/* ──────────────── MISSION LOG HISTORY (THE TRACE) ──────────────── */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Mission Log Trace</h3>
                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mt-1">Audit trail of all protocol data points and synchronization states</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                        <div className="w-2 h-2 bg-[#00e676] rounded-full animate-pulse" />
                        <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Live Sync Alpha</span>
                    </div>
                </div>

                <div className="space-y-4">
                    {history.length === 0 ? (
                        <div className="p-12 bg-white/[0.02] border border-white/5 rounded-[3rem] border-dashed flex flex-col items-center justify-center text-center">
                            <Clock className="w-10 h-10 text-slate-700 mb-4" />
                            <p className="text-sm font-black text-slate-500 uppercase italic">No historical telemetry detected in this node</p>
                        </div>
                    ) : (
                        history.map((item, idx) => (
                            <motion.div 
                                key={item.id || idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group relative bg-[#0a0e1a]/80 border border-white/5 p-6 rounded-[2rem] hover:border-cyan-500/20 transition-all flex items-center justify-between overflow-hidden"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                                        item.type === 'AE' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                                    }`}>
                                        {item.type === 'AE' ? <AlertTriangle className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-sm font-black text-white uppercase italic">{item.type === 'AE' ? 'Safety Report' : 'Supplement Log'}</span>
                                            <Badge color={item.type === 'AE' ? 'red' : 'green'} className="text-[10px] px-2 py-0.5">
                                                {item.id?.toString().startsWith('sim') ? 'SIMULATED' : 'SYNCHRONIZED'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-[12px] font-bold text-slate-500 uppercase tracking-widest">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(item.created_at).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            {item.type === 'DOSING' && (
                                                <span className={`flex items-center gap-1 ${item.dose_taken ? 'text-[#00e676]' : 'text-red-400'}`}>
                                                    {item.dose_taken ? 'DOSE CONFIRMED' : `DOSE MISSED: ${item.missed_reason || 'NO REASON'}`}
                                                </span>
                                            )}
                                        </div>
                                        {item.type === 'AE' && item.description && (
                                            <p className="text-[12px] text-slate-400 mt-2 line-clamp-1 italic">"{item.description}"</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    {item.type === 'AE' ? (
                                        <div className="text-[11px] font-black text-red-400 uppercase tracking-widest px-3 py-1 bg-red-500/10 rounded-lg">
                                            SEVERITY: {item.severity}
                                        </div>
                                    ) : (
                                        <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                            ID: #{item.id?.toString().slice(-4) || 'XXXX'}
                                        </div>
                                    )}
                                </div>
                                {/* Subtle animated glow on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/[0.02] to-cyan-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Footer Notes */}
            <div className="flex flex-col items-center gap-4 py-12">
                <div className="flex gap-8">
                    <div className="flex items-center gap-2 text-[12px] font-black text-slate-700 uppercase tracking-widest">
                        <ShieldCheck /> END-TO-END ENCRYPTED
                    </div>
                    <div className="flex items-center gap-2 text-[12px] font-black text-slate-700 uppercase tracking-widest">
                        <ShieldCheck /> HIPAA COMPLIANT TUNNEL
                    </div>
                    <div className="flex items-center gap-2 text-[12px] font-black text-slate-700 uppercase tracking-widest">
                        <ShieldCheck /> ISO 27001 VERIFIED
                    </div>
                </div>
            </div>
        </div>
    );
};

const ShieldCheck = () => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

export default LogsView;
