import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Eye, Archive, Download, AlertCircle } from 'lucide-react';
import { Card, Skeleton, SkeletonText } from './SharedComponents';

const PrivacyDataView = ({ onAction, isLoading = false }: { onAction: (t: string) => void; isLoading?: boolean }) => {
    if (isLoading) {
        return (
            <div className="max-w-[1500px] space-y-8">
                <SkeletonText width="w-48" height="h-10" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Skeleton className="h-96" />
                    <div className="space-y-6">
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1500px] animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase mb-8">Privacy & Data</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-10 border-amber-500/10">
                    <ShieldCheck className="w-12 h-12 text-amber-500 mb-6" />
                    <h3 className="text-xl font-black text-white uppercase italic mb-4">Your Privacy</h3>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed mb-8">Your data is safe and private. We use the best security to make sure your personal information is never linked to your public identity.</p>
                    <button onClick={() => onAction('Export Data Summary')} className="w-full py-5 bg-amber-500 text-slate-950 rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3">
                        <Download className="w-4 h-4" /> DOWNLOAD DATA SUMMARY
                    </button>
                </Card>
                <div className="space-y-6">
                    <Card className="p-8 hover:border-amber-500/30 transition-all cursor-pointer group" onClick={() => onAction('View Data Access Logs')}>
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"><Eye className="w-6 h-6" /></div>
                            <div>
                                <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">Data Logs</h4>
                                <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest mt-1">See who has viewed your information.</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-8 hover:border-amber-500/30 transition-all cursor-pointer group" onClick={() => onAction('Data Retention Settings')}>
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"><Archive className="w-6 h-6" /></div>
                            <div>
                                <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">Data Storage</h4>
                                <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest mt-1">Choose how long we keep your data.</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-8 hover:border-red-500/30 transition-all cursor-pointer group" onClick={() => onAction('Request Data Deletion')}>
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"><AlertCircle className="w-6 h-6" /></div>
                            <div>
                                <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">Delete My Data</h4>
                                <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest mt-1">Remove all your information from our systems.</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PrivacyDataView;


