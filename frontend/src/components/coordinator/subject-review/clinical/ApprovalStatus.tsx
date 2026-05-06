import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, UserCheck, Edit3, X, AlertTriangle } from 'lucide-react';

interface ApprovalStatusProps {
    participant: any;
    onApprove: (type: 'coordinator' | 'pi', signature: string) => Promise<void>;
    isProcessing: boolean;
}

const ApprovalStatus: React.FC<ApprovalStatusProps> = ({ participant, onApprove, isProcessing }) => {
    const [showSignModal, setShowSignModal] = useState<'coordinator' | 'pi' | null>(null);
    const [signature, setSignature] = useState('');

    const handleSign = async () => {
        if (!signature.trim()) return;
        await onApprove(showSignModal!, signature);
        setShowSignModal(null);
        setSignature('');
    };

    const isReadyForPI = participant.coordinator_approved;
    const isFullyApproved = participant.coordinator_approved && participant.pi_approved;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Coordinator Approval Card */}
            <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                participant.coordinator_approved 
                    ? 'bg-emerald-500/5 border-emerald-500/20' 
                    : 'bg-white/5 border-white/10'
            }`}>
                <div className="flex items-start gap-3 mb-4">
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        participant.coordinator_approved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                        <UserCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <h4 className="font-semibold text-white text-sm leading-tight">Coordinator Approval</h4>
                            {participant.coordinator_approved ? (
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md whitespace-nowrap">✓ Verified</span>
                            ) : (
                                <button
                                    onClick={() => setShowSignModal('coordinator')}
                                    disabled={isProcessing}
                                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest flex items-center gap-1 whitespace-nowrap"
                                >
                                    <Edit3 className="w-3 h-3" /> Sign Now
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-slate-400">Technical Eligibility Verification</p>
                    </div>
                </div>

                {participant.coordinator_approved ? (
                    <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase mb-1">E-Signature</p>
                        <p className="font-serif italic text-slate-300 border-b border-slate-700 pb-1 mb-1">{participant.coordinator_signature}</p>
                        <p className="text-[10px] text-slate-500">Timestamp: {new Date(participant.coordinator_approved_at).toLocaleString()}</p>
                    </div>
                ) : (
                    <p className="text-xs text-slate-500 italic">Awaiting study coordinator sign-off on participant screening data.</p>
                )}
            </div>

            {/* PI Approval Card */}
            <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                participant.pi_approved 
                    ? 'bg-blue-500/5 border-blue-500/20' 
                    : !isReadyForPI ? 'bg-slate-900/20 border-white/5 grayscale opacity-50' : 'bg-white/5 border-white/10'
            }`}>
                <div className="flex items-start gap-3 mb-4">
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        participant.pi_approved ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <h4 className="font-semibold text-white text-sm leading-tight">Principal Investigator</h4>
                            {participant.pi_approved ? (
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md whitespace-nowrap">✓ Authorized</span>
                            ) : isReadyForPI ? (
                                <button
                                    onClick={() => setShowSignModal('pi')}
                                    disabled={isProcessing}
                                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest flex items-center gap-1 whitespace-nowrap"
                                >
                                    <Edit3 className="w-3 h-3" /> Authorize
                                </button>
                            ) : (
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Awaiting CC</span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400">Final Medical &amp; Protocol Review</p>
                    </div>
                </div>

                {participant.pi_approved ? (
                    <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase mb-1">E-Signature</p>
                        <p className="font-serif italic text-slate-300 border-b border-slate-700 pb-1 mb-1">{participant.pi_signature}</p>
                        <p className="text-[10px] text-slate-500">Timestamp: {new Date(participant.pi_approved_at).toLocaleString()}</p>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        {!isReadyForPI && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                        <p className="text-xs text-slate-500 italic">
                            {!isReadyForPI ? "PI review is blocked until Coordinator sign-off." : "Pending final medical authorization for enrollment."}
                        </p>
                    </div>
                )}
            </div>

            {/* Signature Modal */}
            <AnimatePresence>
                {showSignModal && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => !isProcessing && setShowSignModal(null)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
                        >
                            <button 
                                onClick={() => setShowSignModal(null)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-white mb-2">Electronic Signature</h3>
                                <p className="text-slate-400 text-sm">
                                    You are signing as the <span className="text-blue-400 font-semibold uppercase">{showSignModal === 'coordinator' ? 'Study Coordinator' : 'Principal Investigator'}</span>.
                                    This action will be logged in the immutable clinical audit trail.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">Full Legal Name</label>
                                    <input 
                                        type="text"
                                        value={signature}
                                        onChange={(e) => setSignature(e.target.value)}
                                        placeholder="Type your full name"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        autoFocus
                                    />
                                </div>

                                <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                    <p className="text-[10px] text-blue-300 leading-relaxed uppercase tracking-tighter opacity-70">
                                        I hereby certify that I have reviewed the eligibility criteria and source documentation for this participant and confirm their suitability for this clinical trial protocol.
                                    </p>
                                </div>

                                <button 
                                    onClick={handleSign}
                                    disabled={!signature.trim() || isProcessing}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>Affix Electronic Signature</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ApprovalStatus;
