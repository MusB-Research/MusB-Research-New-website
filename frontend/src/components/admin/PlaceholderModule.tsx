import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface PlaceholderModuleProps {
    title: string;
    activeModule: string;
}

const PlaceholderModule = ({ title, activeModule }: PlaceholderModuleProps) => (
    <motion.div
        key={activeModule}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6 bg-white/5 border border-dashed border-white/10 rounded-[3rem] px-12"
    >
        <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center">
            <Clock className="w-10 h-10 text-slate-700 animate-pulse" />
        </div>
        <div>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                {title} <span className="text-cyan-400">Integrated</span>
            </h2>
            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-2 italic">
                Advanced Module Architecture Initialization in Progress
            </p>
        </div>
    </motion.div>
);

export default PlaceholderModule;
