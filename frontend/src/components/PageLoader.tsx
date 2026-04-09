import React from 'react';
import { motion } from 'framer-motion';

const PageLoader: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0e1a]">
            <div className="relative flex flex-col items-center gap-8">
                {/* ADVANCED CLINICAL LOADER */}
                <div className="relative w-24 h-24">
                    <motion.div
                        className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    />
                    <motion.div
                        className="absolute inset-0 border-t-4 border-cyan-400 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                        className="absolute inset-4 border-r-4 border-indigo-500 rounded-full"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                </div>

                <div className="flex flex-col items-center gap-2">
                    <motion.span
                        className="text-sm font-black text-cyan-400 uppercase tracking-[0.5em] italic"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        Syncing Clinical Node
                    </motion.span>
                    <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageLoader;
