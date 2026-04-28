import React from 'react';
import { motion } from 'framer-motion';
import { History, Activity, ShieldAlert, Key, ArrowRight } from 'lucide-react';

interface AuditLog {
    id: string;
    action: string;
    details: any;
    user_name: string;
    ip_address: string;
    timestamp: string;
}

interface RevealLog {
    id: string;
    field_accessed: string;
    reason: string;
    user_name: string;
    timestamp: string;
}

interface ClinicalAuditTrailProps {
    clinicalLogs: AuditLog[];
    piiLogs: RevealLog[];
}

const ClinicalAuditTrail: React.FC<ClinicalAuditTrailProps> = ({ clinicalLogs, piiLogs }) => {
    const combinedLogs = [
        ...clinicalLogs.map(l => ({ ...l, type: 'CLINICAL' })),
        ...piiLogs.map(l => ({ ...l, type: 'PII', action: 'PII_ACCESS', details: { field: l.field_accessed, reason: l.reason } }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <History className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Clinical Audit Trail</h3>
            </div>

            <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {combinedLogs.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                        <Activity className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                        <p className="text-slate-500 text-sm">No clinical audit records found for this participant.</p>
                    </div>
                ) : (
                    combinedLogs.map((log, index) => (
                        <motion.div 
                            key={log.id + index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-4 rounded-2xl border transition-all hover:bg-white/5 ${
                                log.type === 'PII' ? 'bg-amber-500/5 border-amber-500/10' : 'bg-white/5 border-white/10'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    {log.action === 'STATUS_CHANGE' && <Activity className="w-4 h-4 text-blue-400" />}
                                    {log.action === 'COORDINATOR_APPROVAL' && <UserCheck className="w-4 h-4 text-emerald-400" />}
                                    {log.action === 'PI_APPROVAL' && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                                    {log.action === 'RANDOMIZATION' && <Key className="w-4 h-4 text-purple-400" />}
                                    {log.action === 'PII_ACCESS' && <ShieldAlert className="w-4 h-4 text-amber-500" />}
                                    
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                        {log.action.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">
                                    {new Date(log.timestamp).toLocaleString()}
                                </span>
                            </div>

                            <div className="pl-6 space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-slate-500">By</span>
                                    <span className="text-slate-300 font-medium">{log.user_name || 'System'}</span>
                                    <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded uppercase">{log.ip_address}</span>
                                </div>

                                {log.action === 'STATUS_CHANGE' && log.details && (
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded">{log.details.from}</span>
                                        <ArrowRight className="w-3 h-3 text-slate-600" />
                                        <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded font-bold">{log.details.to}</span>
                                    </div>
                                )}

                                {log.action === 'RANDOMIZATION' && log.details && (
                                    <div className="text-xs text-slate-400">
                                        Assigned to <span className="text-purple-400 font-bold">{log.details.arm_assigned}</span>
                                        <span className="ml-2 opacity-60">({log.details.method})</span>
                                    </div>
                                )}

                                {log.action === 'PII_ACCESS' && log.details && (
                                    <div className="text-xs">
                                        <p className="text-slate-500">Field: <span className="text-amber-400 font-medium uppercase">{log.details.field}</span></p>
                                        <p className="text-slate-400 mt-1 italic">" {log.details.reason} "</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

const UserCheck = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
);

const ShieldCheck = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
);

export default ClinicalAuditTrail;
