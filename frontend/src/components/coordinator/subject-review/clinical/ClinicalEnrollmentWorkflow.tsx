import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Check, Calendar, Phone, Mail, MoreHorizontal, User, 
    Shield, Briefcase, Plus, ChevronDown, Clock, AlertCircle,
    ArrowRight, CheckSquare, Square
} from 'lucide-react';

interface ClinicalEnrollmentWorkflowProps {
    participant: any;
    onApprove: (type: 'coordinator' | 'pi', signature: string) => Promise<void>;
    onRandomize: () => Promise<void>;
    addToast: (msg: string, type?: string) => void;
}

const ClinicalEnrollmentWorkflow: React.FC<ClinicalEnrollmentWorkflowProps> = ({ 
    participant, onApprove, onRandomize, addToast 
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
    const [activeRole, setActiveRole] = useState<'coordinator' | 'pi' | 'admin' | 'participant'>('coordinator');
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
            { id: 'pi', label: 'PI oversight' },
            { id: 'admin', label: 'Admin' }
        ];
        return [
            { id: 'coordinator', label: 'Coordinator' },
            { id: 'participant', label: 'Participant view' }
        ];
    };

    const roleTabs = getRoleTabs(activeStep);

    // Calculate real compliance for Step 5
    const calculateCompliance = () => {
        if (!participant.daily_logs || participant.daily_logs.length === 0) return 0;
        const total = participant.daily_logs.length;
        const taken = participant.daily_logs.filter((l: any) => l.took_medicine).length;
        return Math.round((taken / total) * 100);
    };

    const compliance = calculateCompliance();
    const activeKit = participant.kits?.[0];
    const participantTasks = participant.tasks || [];

    return (
        <div className="bg-[#121212] text-white min-h-screen p-8 rounded-3xl border border-white/5 shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">Enrollment workflow</h1>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <span>{participant.study_name || 'Clinical Study'}</span>
                        <span className="opacity-30">•</span>
                        <span>{participant.display_name || 'Participant'}</span>
                        <span className="opacity-30">•</span>
                        <span>Submitted {new Date(participant.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-[#FFF8E1]/10 text-[#FFE082] px-3 py-1 rounded-full text-xs font-bold border border-[#FFE082]/20">
                        {participant.status.replace(/_/g, ' ')}
                    </div>
                    <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Top Progress Tracker */}
            <div className="relative flex justify-between mb-12 max-w-4xl mx-auto">
                <div className="absolute top-4 left-0 w-full h-0.5 bg-white/5 -z-0" />
                {STEPS.map((step) => {
                    const isDone = step.id < activeStep;
                    const isActive = step.id === activeStep;
                    return (
                        <div key={step.id} className="flex flex-col items-center gap-3 relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-500 ${
                                isDone ? 'bg-[#00BFA5] border-[#00BFA5] text-white' : 
                                isActive ? 'bg-[#00BFA5] border-[#00BFA5] text-white ring-4 ring-[#00BFA5]/20' : 
                                'bg-[#1E1E1E] border-white/10 text-slate-500'
                            }`}>
                                {isDone ? <Check className="w-4 h-4" /> : step.id}
                            </div>
                            <span className={`text-[10px] uppercase font-bold tracking-widest ${isActive || isDone ? 'text-white' : 'text-slate-600'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Sub-Tabs Navigation */}
            <div className="flex border-b border-white/5 mb-8">
                {SUB_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveStep(tab.id)}
                        className={`px-8 py-3 text-xs font-bold uppercase tracking-widest transition-all relative ${
                            activeStep === tab.id ? 'text-white bg-white/5' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {activeStep === tab.id && (
                            <motion.div layoutId="subTabUnderline" className="absolute top-0 left-0 right-0 h-1 bg-[#00BFA5]" />
                        )}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Role Switcher */}
            <div className="flex p-1 bg-white/5 rounded-xl mb-8 max-w-2xl">
                {roleTabs.map((role) => (
                    <button
                        key={role.id}
                        onClick={() => setActiveRole(role.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                            activeRole === role.id ? 'bg-[#E0F2F1] text-[#00695C]' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
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
                    transition={{ duration: 0.2 }}
                    className="bg-[#1E1E1E] rounded-3xl border border-white/5 p-8"
                >
                    {activeStep === 2 && activeRole === 'coordinator' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center pb-6 border-b border-white/5">
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Step 1 — Review & Eligibility Call</h3>
                            </div>

                            <div className="flex items-center justify-between bg-white/5 p-6 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center font-bold text-lg">
                                        {participant.display_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'S'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">{participant.display_name || 'Subject'}</h4>
                                        <p className="text-sm text-slate-400">{participant.display_phone || 'N/A'} • {participant.display_email || 'N/A'}</p>
                                    </div>
                                </div>
                                <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                                    Log call made
                                </button>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Eligibility Verification Checklist</h4>
                                <div className="grid gap-3">
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
                                            className="flex items-center gap-3 cursor-pointer group"
                                        >
                                            {checklist[item.key as keyof typeof checklist] ? (
                                                <div className="w-5 h-5 rounded bg-[#6366F1] flex items-center justify-center">
                                                    <Check className="w-3.5 h-3.5 text-white" />
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded border-2 border-slate-700 group-hover:border-[#6366F1] transition-colors" />
                                            )}
                                            <span className={`text-sm ${checklist[item.key as keyof typeof checklist] ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Coordinator notes</label>
                                <textarea 
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="e.g. Spoke with participant at 10am. No concerns. Ready to enroll."
                                    className="w-full bg-[#121212] border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 min-h-[100px]"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    disabled={!isStep2Complete}
                                    onClick={() => onApprove('coordinator', 'Signed by Coordinator')}
                                    className="px-8 py-3 bg-[#00BFA5] text-white border border-[#00BFA5]/20 rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-all hover:bg-[#00796B]"
                                >
                                    Confirm enrollment →
                                </button>
                                <button className="px-8 py-3 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                                    Mark ineligible
                                </button>
                                <button className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                                    Add to waitlist
                                </button>
                            </div>
                        </div>
                    )}

                    {activeStep === 2 && activeRole === 'pi' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center pb-6 border-b border-white/5">
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">PI Oversight — New Query</h3>
                            </div>

                            <div className="flex items-center justify-between bg-white/5 p-6 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#6366F1] flex items-center justify-center font-bold text-lg">
                                        {participant.display_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'S'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">{participant.display_name || 'Subject'} — eligibility under review</h4>
                                        <p className="text-sm text-slate-400">Assigned to {participant.coordinator_name || 'Coordinator'} • Received {new Date(participant.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="bg-[#FFF8E1]/10 text-[#FFE082] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#FFE082]/20">
                                    {participant.status.replace(/_/g, ' ')}
                                </div>
                            </div>

                            <div className="p-6 bg-white/2 rounded-2xl border-l-4 border-[#00BFA5]">
                                <p className="text-sm font-bold text-white mb-1">All eligibility responses are positive. No flags detected by the system. Coordinator call in progress.</p>
                            </div>

                            <div className="flex gap-4">
                                <button className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                                    Add PI note
                                </button>
                                <button 
                                    onClick={() => onApprove('pi', 'Signed by PI')}
                                    className="px-8 py-3 bg-[#00BFA5] text-white border border-[#00BFA5]/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:bg-[#00796B]"
                                >
                                    Override & enroll directly
                                </button>
                            </div>
                        </div>
                    )}

                    {activeStep === 2 && activeRole === 'admin' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center pb-6 border-b border-white/5">
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Super Admin — Query Status</h3>
                            </div>

                            <div className="flex items-center justify-between bg-white/5 p-6 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center font-bold text-lg">MJ</div>
                                    <div>
                                        <h4 className="font-bold text-lg">{participant.display_name || 'Maria Johnson'}</h4>
                                        <p className="text-sm text-slate-400">{participant.study_name || 'Beat the Bloat Study'} • Query received • Coordinator assigned</p>
                                    </div>
                                </div>
                                <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">
                                    In review
                                </div>
                            </div>

                            <div className="p-10 text-center">
                                <p className="text-slate-400 text-sm max-w-md mx-auto">
                                    No action required from admin at this stage. Status will update automatically when coordinator confirms or declines enrollment.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeStep === 3 && activeRole === 'coordinator' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center pb-6 border-b border-white/5">
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Schedule Appointment — In-Person Visit</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Study type</label>
                                    <div className="relative">
                                        <select className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50">
                                            <option>In-person</option>
                                            <option>Virtual</option>
                                            <option>Hybrid</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Visit location</label>
                                    <div className="relative">
                                        <select className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50">
                                            <option>MusB Research — Tampa</option>
                                            <option>MusB Research — Orlando</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Coordinator Calendar — May 2026</h4>
                                <div className="bg-[#121212] p-6 rounded-2xl border border-white/5">
                                    <div className="grid grid-cols-7 gap-2 mb-4">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                            <div key={d} className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">{d}</div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-2">
                                        {Array.from({ length: 5 }).map((_, i) => <div key={i} />)}
                                        {Array.from({ length: 31 }).map((_, i) => {
                                            const day = i + 1;
                                            const isAvailable = [8, 10, 12, 15, 17, 22, 24, 26, 29].includes(day);
                                            return (
                                                <div 
                                                    key={day}
                                                    className={`h-12 rounded-lg flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${
                                                        isAvailable ? 'bg-[#E0F2F1] text-[#00695C] hover:bg-[#B2DFDB]' : 'text-slate-700'
                                                    }`}
                                                >
                                                    {day}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="mt-6 text-[10px] text-slate-500 italic">Green slots have availability. Click to select. Calendar syncs with Google Calendar.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Appointment time</label>
                                <div className="relative">
                                    <select className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50">
                                        <option>9:00 AM</option>
                                        <option>10:00 AM</option>
                                        <option>11:00 AM</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                                    Confirm & send invite
                                </button>
                                <button className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                                    Send self-schedule link
                                </button>
                            </div>
                        </div>
                    )}

                    {activeStep === 3 && activeRole === 'participant' && (
                        <div className="flex items-center justify-center py-12">
                            <div className="bg-[#121212] border border-white/10 rounded-3xl p-10 max-w-lg w-full shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-[#6366F1]/20" />
                                <h3 className="text-2xl font-bold text-white mb-2">Your appointment is confirmed</h3>
                                <p className="text-slate-400 text-sm mb-8">{participant.study_name || 'Beat the Bloat Study'} • MusB Research, Tampa</p>
                                
                                <div className="bg-[#E3F2FD] border border-blue-200 rounded-2xl p-6 mb-8">
                                    <div className="text-[#0D47A1] font-bold text-lg mb-1">Thursday, May 8, 2026 • 10:00 AM</div>
                                    <div className="text-[#1976D2] text-sm flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-[#1976D2]" /> 4821 N. Armenia Ave, Tampa FL • Suite 200
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all text-white">
                                        Add to Google Calendar
                                    </button>
                                    <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all text-slate-400">
                                        Request to reschedule
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeStep === 4 && activeRole === 'coordinator' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center pb-6 border-b border-white/5">
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Pre-visit tasks to assign</h3>
                            </div>

                            <div className="grid gap-3">
                                {[
                                    { id: 'ec', label: 'E-consent — send for electronic signature', checked: true },
                                    { id: 'pv', label: 'Pre-visit questionnaire (baseline health history)', checked: true },
                                    { id: 'of', label: 'Overnight fast reminder (nothing after 10pm night before)', checked: true },
                                    { id: 'dr', label: '3-day dietary recall form', checked: false },
                                    { id: 'pp', label: 'Food photo diary (upload via app before visit)', checked: false },
                                    { id: 'es', label: 'Exercise and sleep log for past 7 days', checked: false }
                                ].map((task) => (
                                    <div key={task.id} className="flex items-center gap-4 group cursor-pointer">
                                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${task.checked ? 'bg-[#10B981]' : 'border-2 border-slate-700'}`}>
                                            {task.checked && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <span className={`text-sm ${task.checked ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'}`}>{task.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4 pt-6">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Kit Shipment — Virtual / Hybrid Participants</h4>
                                <div className="grid grid-cols-5 gap-3">
                                    {[
                                        { label: 'Address verified', date: participant.display_address !== 'N/A' ? 'Verified' : 'Pending', status: participant.display_address !== 'N/A' ? 'done' : 'pending' },
                                        { label: 'Kit prepared', date: activeKit ? 'Prepared' : 'In progress', status: activeKit ? 'done' : 'active' },
                                        { label: 'Shipped', date: activeKit?.tracking_number ? 'Shipped' : 'Pending', status: activeKit?.tracking_number ? 'done' : 'pending' },
                                        { label: 'Participant confirmed', date: activeKit?.status === 'DELIVERED' ? 'Confirmed' : 'Pending', status: activeKit?.status === 'DELIVERED' ? 'done' : 'pending' },
                                        { label: 'Kit returned', date: activeKit?.status === 'RETURNED' ? 'Returned' : 'Pending', status: activeKit?.status === 'RETURNED' ? 'done' : 'pending' }
                                    ].map((step, i) => (
                                        <div key={i} className={`p-4 rounded-xl border text-center transition-all ${
                                            step.status === 'done' ? 'bg-[#E6FFFA] border-[#38B2AC] text-[#2C7A7B]' :
                                            step.status === 'active' ? 'bg-[#EBF8FF] border-[#4299E1] text-[#2B6CB0] ring-2 ring-[#4299E1]/20' :
                                            'bg-white/2 border-white/5 text-slate-600'
                                        }`}>
                                            <div className="text-[9px] font-bold uppercase tracking-widest mb-1">{step.label}</div>
                                            <div className="text-xs font-bold">{step.date}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Shipping address (verified)</label>
                                    <input 
                                        type="text" 
                                        defaultValue="124 Bayshore Blvd, Tampa FL 33606"
                                        className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Tracking number</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter after shipping"
                                        className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" 
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button className="px-8 py-3 bg-[#121212] border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:bg-white/5">
                                    Mark as shipped
                                </button>
                                <button className="px-8 py-3 bg-[#121212] border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:bg-white/5">
                                    Print label
                                </button>
                            </div>
                        </div>
                    )}

                    {activeStep === 4 && activeRole === 'participant' && (
                        <div className="flex items-center justify-center py-12">
                            <div className="bg-[#121212] border border-white/10 rounded-3xl p-10 max-w-lg w-full shadow-2xl">
                                <h3 className="text-2xl font-bold text-white mb-1">Before your visit</h3>
                                <p className="text-slate-400 text-sm mb-8">Please complete these before May 8</p>
                                
                                <div className="space-y-4">
                                    <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl p-5 flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                                        <div>
                                            <div className="text-[#10B981] font-bold text-sm">e-Consent signed</div>
                                            <div className="text-[#10B981]/70 text-xs">Completed Apr 25</div>
                                        </div>
                                    </div>

                                    {[
                                        { title: 'Health history questionnaire', detail: '~8 minutes • Due May 6', action: 'Start' },
                                        { title: '3-day food diary', detail: 'Upload photos or fill form • Due May 7', action: 'Upload' },
                                        { title: 'Overnight fast reminder', detail: 'Nothing to eat after 10pm on May 7', action: 'Reminder set', status: 'warning' }
                                    ].map((item, i) => (
                                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-5 h-5 rounded border-2 ${item.status === 'warning' ? 'border-[#F59E0B]' : 'border-white/10'}`} />
                                                <div>
                                                    <div className="text-white font-bold text-sm">{item.title}</div>
                                                    <div className="text-slate-500 text-xs">{item.detail}</div>
                                                </div>
                                            </div>
                                            <button className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                item.status === 'warning' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-white/5 text-white hover:bg-white/10'
                                            }`}>
                                                {item.action}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeStep === 5 && activeRole === 'coordinator' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center pb-6 border-b border-white/5">
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Active Study — Data Collection Overview</h3>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                {[
                                    { label: 'Compliance', value: `${compliance}%`, color: compliance > 80 ? 'text-[#10B981]' : 'text-[#F59E0B]' },
                                    { label: 'Days active', value: participant.daily_logs?.length || '0' },
                                    { label: 'Pending tasks', value: participantTasks.filter((t: any) => !t.completed_at).length, color: 'text-[#F59E0B]' },
                                    { label: 'Upload received', value: participant.lab_results?.length || '0', color: 'text-[#3B82F6]' }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white/2 border border-white/5 p-6 rounded-2xl">
                                        <div className={`text-3xl font-bold mb-1 ${stat.color || 'text-white'}`}>{stat.value}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{stat.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-6 pt-4">
                                {[
                                    { title: 'Daily symptom diary', detail: 'Today • 7 of 7 days submitted', status: 'On track', badge: 'bg-[#10B981]/10 text-[#10B981]' },
                                    { title: 'Blood test report upload', detail: 'Lab results from Quest Diagnostics — received Apr 28', status: 'Received', badge: 'bg-white/5 text-slate-400', action: 'View' },
                                    { title: 'GSRS questionnaire', detail: 'Due May 2 • Not yet submitted', status: 'Pending', badge: 'bg-[#F59E0B]/10 text-[#F59E0B]', action: 'Remind' },
                                    { title: 'Wearable data sync', detail: 'Fitbit connected • Last synced 2 hours ago • Sleep & steps flowing', status: 'Connected', badge: 'bg-[#10B981]/10 text-[#10B981]' }
                                ].map((task, i) => (
                                    <div key={i} className="flex items-center justify-between pb-6 border-b border-white/2 last:border-0">
                                        <div>
                                            <h4 className="font-bold text-sm text-white mb-1">{task.title}</h4>
                                            <p className="text-xs text-slate-500">{task.detail}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${task.badge}`}>{task.status}</div>
                                            {task.action && (
                                                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                                    {task.action}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4 pt-6">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Intervention Shipment (Second Regimen)</h4>
                                <div className="grid grid-cols-4 gap-3">
                                    {[
                                        { label: 'Prepared', date: 'Apr 28', status: 'done' },
                                        { label: 'Shipped', date: 'Apr 29', status: 'done' },
                                        { label: 'In transit', date: 'ETA May 1', status: 'active' },
                                        { label: 'Participant confirmed', date: 'Pending', status: 'pending' }
                                    ].map((step, i) => (
                                        <div key={i} className={`p-4 rounded-xl border text-center transition-all ${
                                            step.status === 'done' ? 'bg-[#E6FFFA] border-[#38B2AC] text-[#2C7A7B]' :
                                            step.status === 'active' ? 'bg-[#EBF8FF] border-[#4299E1] text-[#2B6CB0] ring-2 ring-[#4299E1]/20' :
                                            'bg-white/2 border-white/5 text-slate-600'
                                        }`}>
                                            <div className="text-[9px] font-bold uppercase tracking-widest mb-1">{step.label}</div>
                                            <div className="text-xs font-bold">{step.date}</div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-500 italic">Tracking: UPS 1Z9999W9 • Participant notified by email when shipped.</p>
                            </div>
                        </div>
                    )}

                    {activeStep === 5 && activeRole === 'participant' && (
                        <div className="flex items-center justify-center py-12">
                            <div className="bg-[#121212] border border-white/10 rounded-3xl p-10 max-w-lg w-full shadow-2xl">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-1">Hi {participant.display_name?.split(' ')[0] || 'Subject'}</h3>
                                        <p className="text-slate-400 text-sm">Week {Math.ceil((participant.daily_logs?.length || 1) / 7)} • {participant.study_name || 'Clinical Study'}</p>
                                    </div>
                                    <div className="text-4xl font-black text-[#10B981]/20">{compliance}%</div>
                                </div>
                                
                                <div className="space-y-4 mb-8">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Log your data today</h4>
                                    {[
                                        { title: 'Symptom diary', detail: '2 minutes • Due tonight', action: 'Start', icon: Plus },
                                        { title: 'Upload food photo', detail: 'Snap a photo of each meal', action: 'Upload', icon: Shield },
                                        { title: 'Wearable sync', detail: 'Fitbit connected • Auto-syncing', action: 'Live', icon: Clock, status: 'success' },
                                        { title: 'Upload lab report', detail: 'PDF or photo of results', action: 'Upload', icon: Briefcase }
                                    ].map((item, i) => (
                                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400">
                                                    <item.icon size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-white font-bold text-sm">{item.title}</div>
                                                    <div className="text-slate-500 text-xs">{item.detail}</div>
                                                </div>
                                            </div>
                                            <button className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                item.status === 'success' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-white/5 text-white hover:bg-white/10'
                                            }`}>
                                                {item.action}
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4 pt-6 border-t border-white/5">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Your kit — second shipment</h4>
                                    <div className="bg-[#EBF8FF] border border-[#4299E1]/30 rounded-2xl p-5 flex items-center justify-between">
                                        <div>
                                            <div className="text-[#2B6CB0] font-bold text-sm">In transit — arriving May 1</div>
                                            <div className="text-[#2B6CB0]/70 text-xs font-mono uppercase">UPS tracking: 1Z9999W9</div>
                                        </div>
                                        <button disabled className="px-4 py-2 bg-white/40 text-white/60 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                            Confirm received
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-center gap-6 pt-8">
                                    <button className="text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">Message your coordinator</button>
                                    <button className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors">View all tasks</button>
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
