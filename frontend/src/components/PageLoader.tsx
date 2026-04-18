import React from 'react';
import { motion } from 'framer-motion';

const PageLoader: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#faf9f6]">
            <div className="flex flex-col items-center gap-6">
                <div className="relative w-20 h-20">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-full h-full rounded-full border-4 border-[#1E88E5]/10 border-t-[#1E88E5]"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-4 rounded-xl bg-[#E3F2FD] flex items-center justify-center"
                    >
                        <img src="/logo.jpg" alt="" className="w-8 h-8 object-contain" />
                    </motion.div>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <h2 className="text-[12px] font-bold text-[#1A2B49] uppercase tracking-[0.2em]">MusB Research</h2>
                    <span className="text-[10px] text-[#5F6F89] font-bold uppercase tracking-widest animate-pulse">Initializing Portal...</span>
                </div>
            </div>
        </div>
    );
};

export default PageLoader;
