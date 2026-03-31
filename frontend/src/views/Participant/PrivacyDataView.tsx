import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Eye, Archive, Download, AlertCircle } from 'lucide-react';
import { Card } from './SharedComponents';

const PrivacyDataView = ({ onAction }: { onAction: (t: string) => void }) => (
    <div className="max-w-[1500px]">
        <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase mb-8">Privacy Vault</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-10 border-cyan-500/10">
                <ShieldCheck className="w-12 h-12 text-cyan-400 mb-6" />
                <h3 className="text-xl font-black text-white uppercase italic mb-4">Your Privacy Profile</h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed mb-8">Your clinical data is end-to-end encrypted. We utilize institutional-grade zero-knowledge proof protocols to ensure your physical biometry and genetic material remain detached from your public identity.</p>
                <button onClick={() => onAction('Export Full Clinical Archive')} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3">
                    <Download className="w-4 h-4" /> DOWNLOAD FULL ARCHIVE
                </button>
            </Card>
            <div className="space-y-6">
                <Card className="p-8 hover:border-indigo-500/30 transition-all cursor-pointer group" onClick={() => onAction('View Data Access Logs')}>
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"><Eye className="w-6 h-6" /></div>
                        <div>
                            <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">Data Access Logs</h4>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Audit trail of everyone who accessed your nodes.</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-8 hover:border-amber-500/30 transition-all cursor-pointer group" onClick={() => onAction('Data Retention Settings')}>
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"><Archive className="w-6 h-6" /></div>
                        <div>
                            <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">Data Retention</h4>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Manage post-study data scrubbing and archiving.</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-8 hover:border-red-500/30 transition-all cursor-pointer group" onClick={() => onAction('Request Immediate Data Scrub')}>
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"><AlertCircle className="w-6 h-6" /></div>
                        <div>
                            <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">Delete All Clinical Nodes</h4>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">Legally scrubbing all study data from servers.</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    </div>
);

export default PrivacyDataView;
