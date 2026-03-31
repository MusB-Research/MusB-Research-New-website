import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X, AlertCircle } from 'lucide-react';

interface LogoutConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md bg-[#0d1424]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 overflow-hidden shadow-2xl"
                    >
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-500/5 blur-2xl rounded-full translate-y-1/2 -translate-x-1/2" />

                        {/* Top Icon & Close Button */}
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/5">
                                <LogOut className="w-7 h-7" />
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all border border-transparent hover:border-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Text Content */}
                        <div className="space-y-4 relative z-10">
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Confirm <span className="text-red-500">Sign Out</span>
                            </h2>
                            <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
                                Are you sure you want to end your current session? You will need to re-authenticate to access your clinical dashboard.
                            </p>
                        </div>

                        {/* Warning Box */}
                        <div className="mt-8 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-start gap-3 relative z-10">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            <p className="text-[10px] font-bold text-red-400/80 uppercase tracking-widest leading-relaxed">
                                Any unsaved changes in active forms will be lost upon signing out of the secure network.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-4 mt-10 relative z-10">
                            <button 
                                onClick={onClose}
                                className="py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                            >
                                CANCEL
                            </button>
                            <button 
                                onClick={onConfirm}
                                className="py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                SIGN OUT
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default LogoutConfirmationModal;
