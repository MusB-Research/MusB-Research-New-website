import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, AlertCircle } from 'lucide-react';

export type ParticipantStatus = 
    | 'NEW' 
    | 'PENDING_REVIEW' 
    | 'ELIGIBLE' 
    | 'CONSENTED' 
    | 'RANDOMIZED' 
    | 'ACTIVE' 
    | 'COMPLETED' 
    | 'DROPPED' 
    | 'INELIGIBLE';

interface LifecycleTrackerProps {
    status: ParticipantStatus;
    updatedAt: string;
}

const STEPS = [
    { key: 'NEW', label: 'Screened' },
    { key: 'PENDING_REVIEW', label: 'Review' },
    { key: 'ELIGIBLE', label: 'Eligible' },
    { key: 'CONSENTED', label: 'Consented' },
    { key: 'RANDOMIZED', label: 'Randomized' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'COMPLETED', label: 'Completed' }
];

const LifecycleTracker: React.FC<LifecycleTrackerProps> = ({ status, updatedAt }) => {
    const currentIndex = STEPS.findIndex(s => s.key === status);
    const isTerminal = ['DROPPED', 'INELIGIBLE'].includes(status);

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-semibold text-white">Enrollment Lifecycle</h3>
                    <p className="text-sm text-slate-400">Current Phase: <span className="text-blue-400 font-medium">{status.replace('_', ' ')}</span></p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Last Status Update</p>
                    <p className="text-sm text-slate-300">{new Date(updatedAt).toLocaleString()}</p>
                </div>
            </div>

            <div className="relative flex justify-between">
                {/* Progress Line */}
                <div className="absolute top-5 left-0 w-full h-0.5 bg-white/10 -z-0" />
                <motion.div 
                    className="absolute top-5 left-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] -z-0"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />

                {STEPS.map((step, index) => {
                    const isCompleted = index < currentIndex;
                    const isActive = index === currentIndex;
                    const isPending = index > currentIndex;

                    return (
                        <div key={step.key} className="flex flex-col items-center relative z-10">
                            <motion.div 
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                                    isCompleted ? 'bg-blue-500 border-blue-500' : 
                                    isActive ? 'bg-slate-900 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 
                                    'bg-slate-900 border-white/20'
                                }`}
                                initial={false}
                                animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                                transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
                            >
                                {isCompleted ? (
                                    <Check className="w-5 h-5 text-white" />
                                ) : isActive ? (
                                    <Clock className="w-5 h-5 text-blue-400" />
                                ) : (
                                    <span className="text-xs font-bold text-slate-500">{index + 1}</span>
                                )}
                            </motion.div>
                            <span className={`mt-3 text-[10px] font-bold uppercase tracking-tight text-center max-w-[80px] leading-tight ${
                                isActive ? 'text-blue-400' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                            }`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {isTerminal && (
                <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 border ${
                    status === 'DROPPED' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-sm">Study Participation Terminated</p>
                        <p className="text-xs opacity-80">This participant has been marked as {status.toLowerCase()} and is no longer part of the active protocol.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LifecycleTracker;
