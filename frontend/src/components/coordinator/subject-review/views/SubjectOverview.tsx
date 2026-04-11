import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { COLORS, S } from '../SubRevConstants';

interface SubjectOverviewProps {
    participant: any;
    alerts: any[];
    setParticipant?: React.Dispatch<React.SetStateAction<any>>;
    addToast: (msg: string, type?: string) => void;
    logAction: (action: string, detail: string) => void;
}

export const SubjectOverview: React.FC<SubjectOverviewProps> = ({ 
    participant, alerts = []
}) => {
    const formatVal = (val: any) => (val === undefined || val === null || val === 'N/A' || val === '') ? 'Not Available' : val;

    return (
        <div className="space-y-10">
            {/* Alerts Section (Flat Design) */}
            {alerts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {alerts.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded bg-rose-500/10 border border-rose-500/20">
                            <AlertCircle size={14} className="text-rose-500" />
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">{a.text}</span>
                            <button className="text-rose-500/50 hover:text-rose-500 transition-colors">
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Practical Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { l: 'Participant Age', v: formatVal(participant.age) },
                    { l: 'Sex', v: formatVal(participant.gender || participant.sex) },
                    { l: 'Assigned Study Arm', v: formatVal(participant.assigned_arm_name || participant.assigned_arm?.name || 'Default') },
                    { l: 'Enrollment Date', v: participant.reviewed_at ? new Date(participant.reviewed_at).toLocaleDateString() : (participant.status === 'ENROLLED' ? new Date(participant.created_at).toLocaleDateString() : 'Pending Review') },
                    { l: 'Study ID', v: formatVal(participant.protocol_id) },
                    { l: 'Assigned Coordinator', v: formatVal(participant.coordinator_name || 'Unassigned') }
                ].map((item, i) => (
                    <div key={i} style={S.card} className="group hover:border-indigo-500/30 transition-colors">
                        <label style={S.label}>{item.l}</label>
                        <div className="text-lg font-bold text-white mt-1">{item.v}</div>
                    </div>
                ))}
            </div>

            {/* Enrollment Status Card (Minimal) */}
            <div style={S.card} className="flex items-center justify-between border-l-4 border-l-indigo-500">
                <div>
                    <label style={S.label}>Enrollment Verification</label>
                    <div className="text-xl font-bold text-white uppercase tracking-tight mt-1">
                        Clinical Review Status: <span className="text-indigo-400">{participant.status || 'Active'}</span>
                    </div>
                </div>
                <div className="hidden sm:block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] italic opacity-50">
                    Synchronized with Regulatory Vault
                </div>
            </div>
        </div>
    );
};
