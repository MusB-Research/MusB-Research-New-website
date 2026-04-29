import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, AlertTriangle, X } from 'lucide-react';

interface PIIRevealButtonProps {
    field: 'email' | 'phone' | 'address';
    maskedValue: string;
    onReveal: (field: string, reason: string) => Promise<string>;
}

const PIIRevealButton: React.FC<PIIRevealButtonProps> = ({ field, maskedValue, onReveal }) => {
    const [revealedValue, setRevealedValue] = useState<string | null>(null);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [reason, setReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleReveal = async () => {
        if (!reason.trim()) return;
        setIsProcessing(true);
        try {
            const value = await onReveal(field, reason);
            setRevealedValue(value);
            setShowReasonModal(false);
        } catch (error) {
            console.error('Failed to reveal PII:', error);
        } finally {
            setIsProcessing(false);
            setReason('');
        }
    };

    const isMasked = maskedValue && maskedValue.startsWith('gAAAA');

    return (
        <div className="flex items-center gap-2 group">
            {revealedValue ? (
                <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                    <span className="text-sm font-medium text-blue-300">{revealedValue}</span>
                    <button onClick={() => setRevealedValue(null)} className="text-blue-500 hover:text-blue-400">
                        <EyeOff className="w-4 h-4" />
                    </button>
                </div>
            ) : isMasked ? (
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 rounded-lg border border-white/5 opacity-60">
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-sm text-slate-500 font-mono tracking-tighter">••••••••••••••</span>
                    </div>
                    <button 
                        onClick={() => setShowReasonModal(true)}
                        className="p-1.5 bg-white/5 hover:bg-blue-500/20 rounded-lg text-slate-400 hover:text-blue-400 transition-all"
                        title="Reveal PII (Audit Logged)"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <span className="text-sm text-slate-300">{maskedValue || 'N/A'}</span>
            )}

            {/* Reason Modal */}
            <AnimatePresence>
                {showReasonModal && (
                    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => !isProcessing && setShowReasonModal(false)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                        >
                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 bg-amber-500/10 rounded-xl">
                                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white">PII Access Request</h4>
                                    <p className="text-xs text-slate-400">This action is logged for 21 CFR Part 11 and HIPAA compliance.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Reason for Access</label>
                                    <textarea 
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="e.g., Contacting for follow-up visit scheduling"
                                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none h-24"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setShowReasonModal(false)}
                                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleReveal}
                                        disabled={!reason.trim() || isProcessing}
                                        className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? 'Logging...' : 'Confirm Access'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PIIRevealButton;
