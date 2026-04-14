import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Eye, Archive, Download, AlertCircle, ChevronRight, Lock, FileText, Globe } from 'lucide-react';
import { Card, Skeleton, Badge } from './SharedComponents';

const PrivacyDataView = ({ onAction, isLoading = false }: { onAction: (t: string) => void; isLoading?: boolean }) => {
    if (isLoading) {
        return (
            <div className="max-w-[1400px] space-y-10 animate-pulse">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Skeleton className="h-96 rounded-[32px]" />
                    <div className="space-y-6">
                        <Skeleton className="h-32 rounded-2xl" />
                        <Skeleton className="h-32 rounded-2xl" />
                        <Skeleton className="h-32 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] pb-12">
            {/* Header */}
            <div className="mb-12">
                 <div className="flex items-center gap-2 text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest mb-3">
                    <span>Portal</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="text-[#1E88E5]">Privacy Governance</span>
                </div>
                <h2 className="text-2xl font-bold text-[#1A2B49] uppercase tracking-tight">Data Ownership & Rights</h2>
                <p className="text-[13px] font-bold text-[#5F6F89] uppercase tracking-widest mt-1">Configure encrypted asset permissions and visibility protocols</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Main Advocacy Card */}
                <Card className="p-10 bg-white border-[#E3ECF5] shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-48 h-48 text-[#1E88E5]" />
                    </div>
                    
                    <div className="w-14 h-14 bg-[#F0F6FF] rounded-2xl flex items-center justify-center text-[#1E88E5] mb-8 border border-[#E3F2FD]">
                        <Lock className="w-7 h-7" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-[#1A2B49] uppercase tracking-tight mb-4">Integrity Framework</h3>
                    <p className="text-[14px] font-bold text-[#5F6F89] uppercase tracking-widest leading-relaxed mb-10">
                        Our research infrastructure utilizes multi-layer encryption and biometric de-identification. Your clinical assets are accessible ONLY to authorized protocol coordinators and investigators.
                    </p>
                    
                    <button onClick={() => onAction('Export Data Summary')} className="w-full py-5 bg-[#1E88E5] text-white rounded-2xl font-bold text-[13px] uppercase tracking-widest shadow-lg shadow-blue-500/10 flex items-center justify-center gap-3 hover:bg-[#1565C0] active:scale-95 transition-all">
                        <Download className="w-4.5 h-4.5" /> Transmit Data Extract
                    </button>
                    
                    <div className="mt-8 pt-6 border-t border-[#F8FBFF] flex items-center gap-3">
                        <Badge color="blue">GDPR COMPLIANT</Badge>
                        <Badge color="blue">HIPAA ALIGNED</Badge>
                    </div>
                </Card>

                {/* Interaction Cards */}
                <div className="space-y-6">
                    <Card className="p-8 bg-white border-[#E3ECF5] hover:border-[#1E88E5]/30 transition-all cursor-pointer group shadow-sm" onClick={() => onAction('View Data Access Logs')}>
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-[#F8FBFF] text-[#5F6F89] rounded-2xl flex items-center justify-center transition-all group-hover:bg-[#E3F2FD] group-hover:text-[#1E88E5] shadow-inner-sm border border-[#E3ECF5]">
                                <Eye className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="text-[15px] font-bold text-[#1A2B49] uppercase tracking-tight">Access Registry</h4>
                                <p className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest mt-1">Live audit of internal data requests.</p>
                            </div>
                            <ChevronRight className="w-5 h-5 ml-auto text-[#E3ECF5] group-hover:text-[#1E88E5] transition-colors" />
                        </div>
                    </Card>

                    <Card className="p-8 bg-white border-[#E3ECF5] hover:border-[#1E88E5]/30 transition-all cursor-pointer group shadow-sm" onClick={() => onAction('Data Retention Settings')}>
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-[#F8FBFF] text-[#5F6F89] rounded-2xl flex items-center justify-center transition-all group-hover:bg-[#E3F2FD] group-hover:text-[#1E88E5] shadow-inner-sm border border-[#E3ECF5]">
                                <Archive className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="text-[15px] font-bold text-[#1A2B49] uppercase tracking-tight">Retention Policy</h4>
                                <p className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest mt-1">Configure asset storage longevity.</p>
                            </div>
                            <ChevronRight className="w-5 h-5 ml-auto text-[#E3ECF5] group-hover:text-[#1E88E5] transition-colors" />
                        </div>
                    </Card>

                    <Card className="p-8 bg-white border-[#FDECEA] hover:border-[#D32F2F]/30 transition-all cursor-pointer group shadow-sm" onClick={() => onAction('Request Data Deletion')}>
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-[#FDECEA] text-[#D32F2F]/30 rounded-2xl flex items-center justify-center transition-all group-hover:bg-[#D32F2F] group-hover:text-white shadow-inner-sm border border-[#FFCDD2]">
                                <AlertCircle className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="text-[15px] font-bold text-[#1A2B49] uppercase tracking-tight">Data Scrub Protocol</h4>
                                <p className="text-[11px] font-bold text-[#D32F2F] uppercase tracking-widest mt-1 opacity-70">Remove all clinical identifiers.</p>
                            </div>
                            <ChevronRight className="w-5 h-5 ml-auto text-[#FFCDD2] group-hover:text-[#D32F2F] transition-colors" />
                        </div>
                    </Card>
                </div>
            </div>

            {/* Footer Transparency Section */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 p-10 bg-[#F8FBFF] border border-[#E3ECF5] rounded-[32px]">
                <div className="space-y-3">
                    <FileText className="w-6 h-6 text-[#1E88E5]" />
                    <h5 className="text-[13px] font-bold text-[#1A2B49] uppercase tracking-tight">Transparent Audit</h5>
                    <p className="text-[11px] text-[#5F6F89] font-bold uppercase tracking-widest leading-relaxed">Every event is recorded in a permanent, encrypted ledger for liability protection.</p>
                </div>
                <div className="space-y-3">
                    <Globe className="w-6 h-6 text-[#1E88E5]" />
                    <h5 className="text-[13px] font-bold text-[#1A2B49] uppercase tracking-tight">Global Resilience</h5>
                    <p className="text-[11px] text-[#5F6F89] font-bold uppercase tracking-widest leading-relaxed">Data is partitioned across SOC-2 compliant hubs with redundant secure backup.</p>
                </div>
                <div className="space-y-3">
                    <ShieldCheck className="w-6 h-6 text-[#1E88E5]" />
                    <h5 className="text-[13px] font-bold text-[#1A2B49] uppercase tracking-tight">Biometric Shield</h5>
                    <p className="text-[11px] text-[#5F6F89] font-bold uppercase tracking-widest leading-relaxed">Your identity is physically decoupled from medical results at the compute layer.</p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyDataView;
