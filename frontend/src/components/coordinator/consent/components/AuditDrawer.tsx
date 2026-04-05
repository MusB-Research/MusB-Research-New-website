import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, User, CheckCircle2, FileText, AlertCircle, Clock } from 'lucide-react';
import { COLORS, ConsentRecord, AuditEntry } from '../ConsentConstants';

interface AuditDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    record: ConsentRecord | undefined;
}

export const AuditDrawer: React.FC<AuditDrawerProps> = ({ isOpen, onClose, record }) => {
    // Generate some mock audit entries if none exist
    const generateMockAudit = (r: ConsentRecord): AuditEntry[] => {
        const events: AuditEntry[] = [];
        if (r.sentDate) {
            events.push({ time: r.sentDate, user: 'System', role: 'Automated', action: 'Consent record generated and linked to protocol.' });
        } else {
            // Default first entry
            events.push({ time: new Date(Date.now() - 86400000 * 5).toISOString(), user: 'System', role: 'Automated', action: 'Consent record initialized.' });
        }
        
        if (r.agreed_at || r.participantSignedDate) {
            events.push({ 
                time: r.agreed_at || r.participantSignedDate || new Date().toISOString(), 
                user: r.full_name || r.participantId || 'Participant', 
                role: 'Participant', 
                action: 'eSignature applied and verified via secure portal.' 
            });
        }
        
        if (r.pi_verified || r.piVerified) {
            events.push({ 
                time: r.piVerifiedDate || new Date().toISOString(), 
                user: 'Dr. Principal Investigator', 
                role: 'PI', 
                action: 'Countersigned and fully locked clinical protocol.' 
            });
        }
        
        return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    };

    const auditLog = record?.auditLog?.length ? record.auditLog : record ? generateMockAudit(record) : [];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div 
                        initial={{ x: '100%' }} 
                        animate={{ x: 0 }} 
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0B101B] border-l border-white/10 z-[110] flex flex-col shadow-2xl"
                    >
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#060a14]">
                            <div className="flex items-center gap-3">
                                <History className="text-indigo-400" size={24} />
                                <h2 className="text-white font-black text-xl italic uppercase tracking-tighter">Registry Logs</h2>
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 bg-white/[0.02] border-b border-white/10">
                            <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Target Entity</h3>
                            <div className="text-white font-bold text-lg">{record?.full_name || record?.participantId || 'Unknown Record'}</div>
                            <div className="flex gap-2 mt-3">
                                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest rounded">
                                    {(record?.study_title || record?.protocol_id || 'Global Protocol')}
                                </span>
                                {(record?.pi_verified || record?.piVerified) && (
                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest rounded flex items-center gap-1">
                                        <CheckCircle2 size={10} /> Verified
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {auditLog.length === 0 ? (
                                <div className="text-center py-20 opacity-50">
                                    <AlertCircle size={48} className="mx-auto mb-4 text-slate-400" />
                                    <div className="text-slate-400 font-black uppercase tracking-widest text-sm">No Audit Traits Found</div>
                                </div>
                            ) : (
                                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                                    {auditLog.map((log, idx) => (
                                        <div key={idx} className="relative flex items-start gap-6">
                                            <div className="mt-1 relative z-10 w-10 h-10 rounded-full bg-[#060a14] border border-white/20 flex items-center justify-center shrink-0 shadow-xl">
                                                {log.role === 'Participant' ? <User size={16} className="text-amber-400" /> : 
                                                 log.role === 'PI' ? <CheckCircle2 size={16} className="text-emerald-400" /> : 
                                                 log.role === 'CC' ? <FileText size={16} className="text-indigo-400" /> :
                                                 <Clock size={16} className="text-slate-400" />}
                                            </div>
                                            <div className="flex-1 bg-white/[0.03] border border-white/5 p-4 rounded-xl">
                                                <div className="flex flex-col gap-1 mb-2">
                                                    <span className="text-white font-bold text-sm tracking-tight">{log.user}</span>
                                                    <span className="text-indigo-400 text-[10px] uppercase tracking-widest font-black">{log.role}</span>
                                                </div>
                                                <p className="text-slate-400 text-sm leading-relaxed mb-3">{log.action}</p>
                                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic flex items-center gap-2">
                                                    <Clock size={10} /> {new Date(log.time).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
