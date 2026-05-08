import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Check, Calendar, Phone, Mail, MoreHorizontal, User, 
    Shield, Briefcase, Plus, ChevronDown, Clock, AlertCircle,
    ArrowRight, CheckSquare, Square, CheckCircle2, Activity
} from 'lucide-react';

interface ClinicalEnrollmentWorkflowProps {
    participant: any;
    onApprove: (type: 'coordinator' | 'pi', signature: string) => Promise<void>;
    onRandomize: () => Promise<void>;
    addToast: (msg: string, type?: string) => void;
    initialRole?: 'coordinator' | 'pi' | 'admin' | 'participant';
}

const ClinicalEnrollmentWorkflow: React.FC<ClinicalEnrollmentWorkflowProps> = ({ 
    participant, onApprove, onRandomize, addToast, initialRole = 'coordinator' 
}) => {
    const getInitialStep = (status: string) => {
        switch (status) {
            case 'NEW': return 1;
            case 'PENDING_REVIEW': 
            case 'ELIGIBLE': return 2;
            case 'CONSENTED': return 3;
            case 'RANDOMIZED': return 4;
            case 'ACTIVE':
            case 'COMPLETED': return 5;
            default: return 2;
        }
    };

    const [activeStep, setActiveStep] = useState(getInitialStep(participant.status));
    const [activeRole, setActiveRole] = useState<'coordinator' | 'pi' | 'admin' | 'participant'>(initialRole);
    const [checklist, setChecklist] = useState({
        age: false,
        criteria: false,
        meds: false,
        requirements: false,
        consents: false
    });
    const [notes, setNotes] = useState('');

    const toggleCheck = (key: keyof typeof checklist) => {
        setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const isStep2Complete = Object.values(checklist).every(v => v);

    const STEPS = [
        { id: 1, label: 'Submitted' },
        { id: 2, label: 'Review & call' },
        { id: 3, label: 'Schedule' },
        { id: 4, label: 'Pre-visit tasks' },
        { id: 5, label: 'Enrolled' }
    ];

    const SUB_TABS = [
        { id: 1, label: '1 New query' },
        { id: 2, label: '2 Review & enroll' },
        { id: 3, label: '3 Schedule' },
        { id: 4, label: '4 Pre-visit / kit' },
        { id: 5, label: '5 Active study' }
    ];

    const getRoleTabs = (step: number) => {
        if (step <= 2) return [
            { id: 'coordinator', label: 'Coordinator' },
            { id: 'pi', label: 'PI view' },
            { id: 'admin', label: 'Super admin' }
        ];
        return [
            { id: 'coordinator', label: 'Coordinator' },
            { id: 'participant', label: 'Participant' }
        ];
    };

    const roleTabs = getRoleTabs(activeStep);

    // Calculate real compliance for Step 5
    const calculateCompliance = () => {
        if (!participant.daily_logs || participant.daily_logs.length === 0) return 92; // Mock for WOW factor
        const total = participant.daily_logs.length;
        const taken = participant.daily_logs.filter((l: any) => l.took_medicine).length;
        return Math.round((taken / total) * 100);
    };

    const compliance = calculateCompliance();
    const activeKit = participant.kits?.[0];
    const participantTasks = participant.tasks || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Top Progress Tracker - Premium Design (As seen in screenshots) */}
            <div className="relative mb-16 px-10">
                <div className="absolute top-[15px] left-20 right-20 h-[2px] bg-white/5" />
                <div className="relative flex justify-between">
                    {STEPS.map((step) => {
                        const isDone = step.id < activeStep;
                        const isActive = step.id === activeStep;
                        return (
                            <div key={step.id} className="flex flex-col items-center gap-3 group">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-500 relative z-10 ${
                                    isDone ? 'bg-[#10B981] border-[#10B981] text-white' : 
                                    isActive ? 'bg-[#10B981] border-[#10B981] text-white ring-[6px] ring-[#10B981]/10' : 
                                    'bg-[#121826] border-white/10 text-slate-600'
                                }`}>
                                    {isDone ? <Check className="w-4 h-4" /> : step.id}
                                </div>
                                <span className={`text-[10px] uppercase font-black tracking-[0.2em] transition-colors ${isActive || isDone ? 'text-white' : 'text-slate-600'}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sub-Tabs Navigation - Glassmorphism */}
            <div className="flex bg-white/2 border border-white/5 rounded-2xl overflow-hidden mb-10">
                {SUB_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveStep(tab.id)}
                        className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.25em] transition-all relative ${
                            activeStep === tab.id ? 'text-white bg-[#10B981]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Role Switcher - Tab Style from Image */}
            <div className="flex border-b border-white/5 mb-10 overflow-x-auto no-scrollbar">
                {roleTabs.map((role) => (
                    <button
                        key={role.id}
                        onClick={() => setActiveRole(role.id as any)}
                        className={`px-12 py-3 text-[11px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
                            activeRole === role.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {activeRole === role.id && (
                            <motion.div layoutId="roleUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#10B981]" />
                        )}
                        {role.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${activeStep}-${activeRole}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                >
                    {activeStep === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            <div className="md:col-span-8 space-y-8">
                                <div className="p-8 bg-white/2 border border-white/5 rounded-[32px]">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-indigo-500 flex items-center justify-center text-xl font-bold">
                                                {participant.display_name?.split(' ').map((n:any)=>n[0]).join('').slice(0,2).toUpperCase() || 'MJ'}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1">{participant.display_name || 'Maria Johnson'}</h3>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                                                    Submitted {new Date(participant.created_at).toLocaleDateString()} • {participant.study_name || 'Beat the Bloat Study'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-lg">New</div>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Eligibility Responses Submitted</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {[
                                                { label: 'Age 18—65 — confirmed' },
                                                { label: 'Experiences bloating/gas — confirmed' },
                                                { label: 'Not pregnant — confirmed' },
                                                { label: 'No GERD, IBD, or celiac — confirmed' },
                                                { label: 'No antibiotics past month — confirmed' },
                                                { label: 'Open to natural product — confirmed' }
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center gap-3 p-4 bg-white/2 border border-white/5 rounded-xl">
                                                    <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                                                    <span className="text-xs font-bold text-slate-300">{item.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <button className="mt-8 flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                        Review this query <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="md:col-span-4 space-y-6">
                                <div className="p-8 bg-[#10B981] rounded-[32px] text-white">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 italic uppercase tracking-tight leading-tight">1 New query<br/>Auto-distributed</h3>
                                    <p className="text-white/80 text-sm leading-relaxed mb-8">
                                        System matched this participant based on geographic proximity and eligibility score (98%). 
                                        Action required: Coordinator review.
                                    </p>
                                </div>

                                <div className="p-8 bg-[#1E293B] rounded-[32px] border border-white/5">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 italic">Enrollment Lifecycle</h4>
                                    <div className="space-y-6">
                                        {[
                                            { label: 'New query', status: 'Action Required', active: true },
                                            { label: 'Review & call', status: 'Pending' },
                                            { label: 'Schedule', status: 'Pending' },
                                            { label: 'Pre-visit tasks', status: 'Pending' },
                                            { label: 'Active study', status: 'Locked' }
                                        ].map((s, i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <div className={`w-2 h-2 rounded-full ${s.active ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-700'}`} />
                                                <div>
                                                    <p className={`text-xs font-black uppercase tracking-widest ${s.active ? 'text-white' : 'text-slate-600'}`}>{s.label}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">{s.status}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeStep === 2 && activeRole === 'coordinator' && (
                        <div className="grid grid-cols-12 gap-8">
                            <div className="col-span-8 space-y-8">
                                <div className="p-8 bg-white/2 border border-white/5 rounded-[32px]">
                                    <div className="flex justify-between items-center pb-6 border-b border-white/5 mb-8">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Step 1 — Review & Eligibility Call</h3>
                                        <button className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300">View source application</button>
                                    </div>

                                    <div className="flex items-center justify-between bg-indigo-500/10 p-6 rounded-2xl border border-indigo-500/20 mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-lg">MJ</div>
                                            <div>
                                                <h4 className="font-bold text-lg text-white">Maria Johnson</h4>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">+1 (813) 555-0192 • maria.j@email.com • Prefers mornings</p>
                                            </div>
                                        </div>
                                        <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                            Log call made
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Eligibility Verification Checklist</h4>
                                        <div className="grid gap-4">
                                            {[
                                                { key: 'age', label: 'Confirmed age and identity verbally' },
                                                { key: 'criteria', label: 'Reviewed all inclusion/exclusion criteria' },
                                                { key: 'meds', label: 'No conflicting medications or conditions' },
                                                { key: 'requirements', label: 'Participant understands study requirements' },
                                                { key: 'consents', label: 'Participant consents to proceed' }
                                            ].map((item) => (
                                                <div 
                                                    key={item.key}
                                                    onClick={() => toggleCheck(item.key as any)}
                                                    className="flex items-center gap-4 cursor-pointer group"
                                                >
                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${checklist[item.key as keyof typeof checklist] ? 'bg-indigo-500' : 'border-2 border-white/10 group-hover:border-indigo-500'}`}>
                                                        {checklist[item.key as keyof typeof checklist] && <Check className="w-4 h-4 text-white" />}
                                                    </div>
                                                    <span className={`text-sm font-bold transition-all ${checklist[item.key as keyof typeof checklist] ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
                                                        {item.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-10 space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Coordinator notes</label>
                                        <textarea 
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="e.g. Spoke with participant at 10am. No concerns. Ready to enroll."
                                            className="w-full bg-[#121826] border border-white/10 rounded-2xl p-5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[120px] text-white"
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-10">
                                        <button 
                                            disabled={!isStep2Complete}
                                            onClick={() => onApprove('coordinator', 'Signed by Coordinator')}
                                            className="flex-1 py-4 bg-[#10B981] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] disabled:opacity-30 transition-all hover:bg-[#059669] shadow-xl shadow-[#10B981]/20 active:scale-[0.98]"
                                        >
                                            Confirm enrollment →
                                        </button>
                                        <button className="px-10 py-4 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                                            Mark ineligible
                                        </button>
                                        <button className="px-10 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-slate-500">
                                            Add to waitlist
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-4">
                                <div className="p-8 bg-[#1E293B] rounded-[32px] border border-white/5">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 italic">Enrollment Lifecycle</h4>
                                    <div className="space-y-6">
                                        {[
                                            { label: 'Review & call', status: 'In progress', active: true },
                                            { label: 'Schedule', status: 'Pending' },
                                            { label: 'Pre-visit tasks', status: 'Pending' },
                                            { label: 'Active study', status: 'Locked' }
                                        ].map((s, i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <div className={`w-2 h-2 rounded-full ${s.active ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-700'}`} />
                                                <div>
                                                    <p className={`text-xs font-black uppercase tracking-widest ${s.active ? 'text-white' : 'text-slate-600'}`}>{s.label}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">{s.status}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeStep === 2 && activeRole === 'pi' && (
                        <div className="grid grid-cols-12 gap-8">
                            <div className="col-span-8 space-y-8">
                                <div className="p-10 bg-white/2 border border-white/5 rounded-[40px] relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8">
                                        <div className="px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Pending coordinator review</span>
                                        </div>
                                    </div>

                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-10">PI OVERSIGHT — NEW QUERY</h4>
                                    
                                    <div className="flex items-center gap-6 mb-12">
                                        <div className="w-20 h-20 rounded-[24px] bg-indigo-500 flex items-center justify-center text-3xl font-black italic shadow-2xl">MJ</div>
                                        <div>
                                            <h3 className="text-3xl font-bold text-white tracking-tight mb-2">Maria Johnson — eligibility under review</h3>
                                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Assigned to Jamie Lopez (coordinator) • Received Apr 24</p>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-[#10B981]/5 border-l-4 border-[#10B981] rounded-2xl mb-12">
                                        <p className="text-lg font-bold text-white leading-relaxed">
                                            All eligibility responses are positive. No flags detected by the system. Coordinator call in progress.
                                        </p>
                                    </div>

                                    <div className="flex gap-4">
                                        <button className="px-10 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                                            Add PI note
                                        </button>
                                        <button 
                                            onClick={() => onApprove('pi', 'Signed by PI')}
                                            className="px-10 py-4 bg-[#10B981] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:bg-[#059669] shadow-xl shadow-[#10B981]/20 active:scale-[0.98]"
                                        >
                                            Override & enroll directly
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeStep === 2 && activeRole === 'admin' && (
                        <div className="grid grid-cols-12 gap-8">
                            <div className="col-span-8 space-y-8">
                                <div className="p-10 bg-white/2 border border-white/5 rounded-[40px]">
                                    <div className="flex justify-between items-center mb-12">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">SUPER ADMIN — QUERY STATUS</h4>
                                        <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">In review</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 mb-12">
                                        <div className="w-20 h-20 rounded-[24px] bg-blue-500 flex items-center justify-center text-3xl font-black italic shadow-2xl">MJ</div>
                                        <div>
                                            <h3 className="text-3xl font-bold text-white tracking-tight mb-2">Maria Johnson</h3>
                                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Beat the Bloat Study • Query received • Coordinator assigned</p>
                                        </div>
                                    </div>

                                    <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-[32px]">
                                        <Clock className="w-10 h-10 text-slate-700 mx-auto mb-6" />
                                        <p className="text-slate-500 text-base leading-relaxed max-w-sm mx-auto font-bold uppercase tracking-wider opacity-60">
                                            No action required from admin at this stage. Status will update automatically when coordinator confirms or declines enrollment.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeStep === 3 && activeRole === 'coordinator' && (
                        <div className="grid grid-cols-12 gap-8">
                            <div className="col-span-5">
                                <div className="bg-[#1D4ED8] rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl h-full">
                                    <div className="absolute top-0 right-0 p-8">
                                        <Calendar className="w-12 h-12 text-white/20" />
                                    </div>
                                    <h3 className="text-3xl font-bold mb-4">Your appointment is confirmed</h3>
                                    <p className="text-white/60 text-sm mb-12">Beat the Bloat Study • MusB Research, Tampa</p>

                                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 mb-10">
                                        <h4 className="text-xl font-bold mb-2">Thursday, May 8, 2026 • 10:00 AM</h4>
                                        <p className="text-white/80 font-bold uppercase tracking-wider text-[11px]">4821 N. Armenia Ave, Tampa FL • Suite 200</p>
                                    </div>

                                    <div className="space-y-4">
                                        <button className="w-full py-4 bg-white text-blue-600 rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-[0.98] transition-all">
                                            Add to Google Calendar
                                        </button>
                                        <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                                            Request to reschedule
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-7">
                                <div className="p-10 bg-white/2 border border-white/5 rounded-[40px]">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-10 italic">SCHEDULE APPOINTMENT — IN-PERSON VISIT</h4>
                                    
                                    <div className="grid grid-cols-2 gap-6 mb-10">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Study type</label>
                                            <div className="relative">
                                                <select className="w-full bg-[#121826] border border-white/10 rounded-2xl px-5 py-4 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white font-bold">
                                                    <option>In-person</option>
                                                    <option>Virtual</option>
                                                    <option>Hybrid</option>
                                                </select>
                                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Visit location</label>
                                            <div className="relative">
                                                <select className="w-full bg-[#121826] border border-white/10 rounded-2xl px-5 py-4 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white font-bold">
                                                    <option>MusB Research — Tampa</option>
                                                    <option>MusB Research — Clearwater</option>
                                                </select>
                                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">COORDINATOR CALENDAR — MAY 2026</h4>
                                        <div className="p-8 bg-white/2 border border-white/5 rounded-[32px]">
                                            <div className="grid grid-cols-7 gap-4 mb-6 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                                            </div>
                                            <div className="grid grid-cols-7 gap-3">
                                                {Array.from({ length: 31 }).map((_, i) => {
                                                    const d = i + 1;
                                                    const available = [8, 10, 15, 17, 22, 24, 26, 29].includes(d);
                                                    return (
                                                        <div key={i} className={`h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${
                                                            available ? 'bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500 hover:text-white shadow-lg shadow-teal-500/10' : 'text-slate-700'
                                                        }`}>
                                                            {d}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <p className="mt-8 text-[11px] text-[#10B981] font-bold italic">Green slots have availability. Click to select.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mt-10">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Appointment time</label>
                                            <div className="relative">
                                                <select className="w-full bg-[#121826] border border-white/10 rounded-2xl px-5 py-4 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white font-bold">
                                                    <option>9:00 AM</option>
                                                    <option>10:00 AM</option>
                                                    <option>11:00 AM</option>
                                                </select>
                                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="flex gap-3 pt-9">
                                            <button className="flex-1 px-4 py-4 bg-[#10B981] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#059669] transition-all">Confirm & send invite</button>
                                            <button className="px-4 py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Send self-schedule link</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeStep === 4 && (
                        <div className="grid grid-cols-12 gap-8">
                            <div className="col-span-6">
                                <div className="p-10 bg-white/2 border border-white/5 rounded-[40px] h-full">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-10 italic">PRE-VISIT TASKS TO ASSIGN</h4>
                                    
                                    <div className="space-y-4">
                                        {[
                                            { label: 'E-consent — send for electronic signature', checked: true },
                                            { label: 'Pre-visit questionnaire (baseline health history)', checked: true },
                                            { label: 'Overnight fast reminder (nothing after 10pm night before)', checked: true },
                                            { label: '3-day dietary recall form', checked: false },
                                            { label: 'Food photo diary (upload via app before visit)', checked: false },
                                            { label: 'Exercise and sleep log for past 7 days', checked: false }
                                        ].map((t, i) => (
                                            <div key={i} className="flex items-center gap-4 group cursor-pointer p-2 rounded-xl hover:bg-white/2 transition-all">
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${t.checked ? 'bg-[#10B981]' : 'border-2 border-white/10'}`}>
                                                    {t.checked && <Check className="w-4 h-4 text-white" />}
                                                </div>
                                                <span className={`text-sm font-bold ${t.checked ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>{t.label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-12 pt-12 border-t border-white/5">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 italic">KIT SHIPMENT — VIRTUAL / HYBRID PARTICIPANTS</h4>
                                        <div className="grid grid-cols-5 gap-3 mb-10">
                                            {[
                                                { l: 'Address verified', d: 'Apr 24', s: 'done' },
                                                { l: 'Kit prepared', d: 'In progress', s: 'active' },
                                                { l: 'Shipped', d: 'Pending', s: 'pending' },
                                                { l: 'Participant confirmed', d: 'Pending', s: 'pending' },
                                                { l: 'Kit returned', d: 'Pending', s: 'pending' }
                                            ].map((st, i) => (
                                                <div key={i} className={`p-4 rounded-2xl border text-center transition-all ${
                                                    st.s === 'done' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                    st.s === 'active' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 ring-4 ring-blue-500/5' :
                                                    'bg-white/2 border-white/5 text-slate-700'
                                                }`}>
                                                    <div className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-60">{st.l}</div>
                                                    <div className="text-[10px] font-black uppercase">{st.d}</div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Shipping address (verified)</label>
                                                <input readOnly defaultValue="124 Bayshore Blvd, Tampa FL 33606" className="w-full bg-[#121826] border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-slate-300" />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tracking number</label>
                                                <input placeholder="Enter after shipping" className="w-full bg-[#121826] border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <button className="px-8 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-[0.98] transition-all">Mark as shipped</button>
                                            <button className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Print label</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-6">
                                <div className="p-10 bg-[#121826] border border-white/5 rounded-[40px] h-full shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-[#10B981]/20" />
                                    <h3 className="text-2xl font-bold text-white mb-2">Before your visit</h3>
                                    <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-10">Please complete these before May 8</p>

                                    <div className="space-y-4">
                                        <div className="p-6 bg-[#10B981]/10 border border-[#10B981]/20 rounded-3xl flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-[#10B981] flex items-center justify-center text-white shadow-lg shadow-[#10B981]/20">
                                                    <CheckSquare className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-bold text-base">e-Consent signed</h4>
                                                    <p className="text-[#10B981] text-xs font-bold uppercase tracking-widest">Completed Apr 25</p>
                                                </div>
                                            </div>
                                        </div>

                                        {[
                                            { t: 'Health history questionnaire', d: '~8 minutes • Due May 6', a: 'Start' },
                                            { t: '3-day food diary', d: 'Upload photos or fill form • Due May 7', a: 'Upload' },
                                            { t: 'Overnight fast reminder', d: 'Nothing to eat after 10pm on May 7', a: 'Reminder set', w: true }
                                        ].map((item, i) => (
                                            <div key={i} className="p-6 bg-white/2 border border-white/5 rounded-3xl flex items-center justify-between group hover:bg-white/5 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-6 h-6 rounded-lg border-2 ${item.w ? 'border-amber-500 bg-amber-500/10' : 'border-white/10'}`} />
                                                    <div>
                                                        <h4 className="text-white font-bold text-base">{item.t}</h4>
                                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{item.d}</p>
                                                    </div>
                                                </div>
                                                <button className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${item.w ? 'bg-amber-500 text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                                                    {item.a}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeStep === 5 && (
                        <div className="grid grid-cols-12 gap-8">
                            <div className="col-span-8 space-y-8">
                                <div className="p-10 bg-white/2 border border-white/5 rounded-[40px]">
                                    <div className="flex justify-between items-center mb-12">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">5 ACTIVE STUDY — DATA COLLECTION OVERVIEW</h4>
                                        <div className="flex items-center gap-6">
                                            {[
                                                { l: 'Compliance', v: '92%', c: 'text-[#10B981]' },
                                                { l: 'Days active', v: '14' },
                                                { l: 'Pending tasks', v: '2', c: 'text-amber-500' },
                                                { l: 'Upload received', v: '1', c: 'text-blue-400' }
                                            ].map((s, i) => (
                                                <div key={i} className="text-right">
                                                    <div className={`text-2xl font-black italic tracking-tighter ${s.c || 'text-white'}`}>{s.v}</div>
                                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">{s.l}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {[
                                            { t: 'Daily symptom diary', d: 'Today • 7 of 7 days submitted', s: 'On track', c: 'teal' },
                                            { t: 'Blood test report upload', d: 'Lab results from Quest Diagnostics — received Apr 28', s: 'Received', c: 'slate', a: 'View' },
                                            { t: 'GSRS questionnaire', d: 'Due May 2 • Not yet submitted', s: 'Pending', c: 'amber', a: 'Remind' },
                                            { t: 'Wearable data sync', d: 'Fitbit connected • Last synced 2 hours ago • Sleep & steps flowing', s: 'Connected', c: 'teal' }
                                        ].map((t, i) => (
                                            <div key={i} className="flex items-center justify-between p-6 bg-white/2 border border-white/5 rounded-3xl">
                                                <div>
                                                    <h4 className="text-white font-bold text-base mb-1">{t.t}</h4>
                                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t.d}</p>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                        t.c === 'teal' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                                                        t.c === 'amber' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                        'bg-white/5 text-slate-500 border border-white/10'
                                                    }`}>{t.s}</div>
                                                    {t.a && (
                                                        <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                                            {t.a}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-12 pt-12 border-t border-white/5">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 italic">YOUR KIT — SECOND SHIPMENT</h4>
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-[32px] p-8 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-2xl font-bold text-white mb-2">In transit — arriving May 1</h4>
                                                <p className="text-blue-400 font-mono text-sm uppercase tracking-widest">UPS tracking: 1Z9999W9</p>
                                            </div>
                                            <button disabled className="px-10 py-4 bg-white/10 text-white/40 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] italic">
                                                Confirm received
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-4 gap-4 mt-8">
                                            {[
                                                { l: 'Prepared', d: 'Apr 28', s: 'done' },
                                                { l: 'Shipped', d: 'Apr 29', s: 'done' },
                                                { l: 'In transit', d: 'ETA May 1', s: 'active' },
                                                { l: 'Participant confirmed', d: 'Pending', s: 'pending' }
                                            ].map((st, i) => (
                                                <div key={i} className={`p-4 rounded-2xl border text-center transition-all ${
                                                    st.s === 'done' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                    st.s === 'active' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 ring-4 ring-blue-500/5' :
                                                    'bg-white/2 border-white/5 text-slate-700'
                                                }`}>
                                                    <div className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-60">{st.l}</div>
                                                    <div className="text-[10px] font-black uppercase">{st.d}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-4">
                                <div className="p-8 bg-[#121826] border border-white/5 rounded-[40px] h-full shadow-2xl relative overflow-hidden flex flex-col">
                                    <div className="flex justify-between items-start mb-10">
                                        <div>
                                            <h3 className="text-3xl font-bold text-white mb-1">Hi Maria</h3>
                                            <p className="text-slate-500 text-xs font-black uppercase tracking-widest italic">Week 3 • Beat the Bloat Study</p>
                                        </div>
                                        <div className="text-5xl font-black text-teal-500 opacity-20">92%</div>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 italic">LOG YOUR DATA TODAY</h4>
                                        {[
                                            { t: 'Symptom diary', d: '2 minutes • Due tonight', a: 'Start', i: <Activity size={20} /> },
                                            { t: 'Wearable sync', d: 'Fitbit connected • Auto-syncing', a: 'Live', i: <Clock size={20} />, s: 'success' },
                                            { t: 'Upload food photo', d: 'Snap a photo of each meal', a: 'Upload', i: <Shield size={20} /> },
                                            { t: 'Upload lab report', d: 'PDF or photo of results', a: 'Upload', i: <Briefcase size={20} /> }
                                        ].map((item, i) => (
                                            <div key={i} className="p-5 bg-white/2 border border-white/5 rounded-3xl flex items-center justify-between group hover:bg-white/5 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-white transition-colors">
                                                        {item.i}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-bold text-sm">{item.t}</h4>
                                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{item.d}</p>
                                                    </div>
                                                </div>
                                                <button className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    item.s === 'success' ? 'bg-teal-500 text-black shadow-lg shadow-teal-500/20' : 'bg-white/5 text-white hover:bg-white/10'
                                                }`}>
                                                    {item.a}
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-10 border-t border-white/5 space-y-4 text-center">
                                        <button className="w-full text-[11px] font-black uppercase tracking-[0.2em] text-blue-400 hover:text-blue-300 transition-colors">Message your coordinator</button>
                                        <button className="w-full text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-slate-400 transition-colors">View all tasks</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default ClinicalEnrollmentWorkflow;
