import React, { useState } from 'react';
import { AlertCircle, X, Edit3, Check, ShieldCheck } from 'lucide-react';
import { COLORS, S } from '../SubRevConstants';
import { authFetch, API } from '../../../../utils/auth';

interface SubjectOverviewProps {
    participant: any;
    alerts: any[];
    setParticipant?: React.Dispatch<React.SetStateAction<any>>;
    addToast: (msg: string, type?: string) => void;
    logAction: (action: string, detail: string) => void;
}

export const SubjectOverview: React.FC<SubjectOverviewProps> = ({ 
    participant, alerts = [], addToast, logAction, setParticipant
}) => {
    const [isEditingIds, setIsEditingIds] = useState(false);
    const [tempPid, setTempPid] = useState(participant.participant_sid || '');
    const [tempSid, setTempSid] = useState(participant.protocol_id || '');
    const [isSaving, setIsSaving] = useState(false);

    const formatVal = (val: any) => (val === undefined || val === null || val === 'N/A' || val === '') ? 'Not Available' : val;

    const handleSaveIds = async () => {
        setIsSaving(true);
        try {
            // 1. Update Participant SID if changed
            if (tempPid !== participant.participant_sid) {
                const pRes = await authFetch(`${API}/api/participants/${participant.participant_sid}/`, {
                    method: 'PATCH',
                    body: JSON.stringify({ participant_sid: tempPid })
                });
                if (!pRes.ok) throw new Error("Failed to update PID");
                logAction('ID_EDIT', `Updated Clinical ID from ${participant.participant_sid} to ${tempPid}`);
            }

            // 2. Update Study Protocol ID if changed (Optional: This is a global change for the study)
            if (tempSid !== participant.protocol_id) {
                const sRes = await authFetch(`${API}/api/studies/${participant.study}/`, {
                    method: 'PATCH',
                    body: JSON.stringify({ protocol_id: tempSid })
                });
                if (!sRes.ok) throw new Error("Failed to update SID");
                logAction('ID_EDIT', `Updated Study ID from ${participant.protocol_id} to ${tempSid}`);
            }

            addToast("Identifiers updated successfully");
            setIsEditingIds(false);
            if (setParticipant) {
                setParticipant((prev: any) => ({ ...prev, participant_sid: tempPid, protocol_id: tempSid }));
            }
        } catch (err) {
            console.error(err);
            addToast("Update failed. Please verify permissions.", "error");
        } finally {
            setIsSaving(false);
        }
    };

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

            {/* IDENTITY MANAGEMENT SECTION (NEW) */}
            <div style={S.card} className="relative group overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                            <ShieldCheck size={18} />
                        </div>
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Subject Clinical Identity</h3>
                    </div>
                    <button 
                        onClick={() => isEditingIds ? handleSaveIds() : setIsEditingIds(true)}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isEditingIds ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'}`}
                    >
                        {isSaving ? 'Saving...' : (isEditingIds ? <><Check size={14} /> Commit Changes</> : <><Edit3 size={14} /> Update Credentials</>)}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {/* NAME CARD */}
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-indigo-500/10 rounded-xl md:rounded-2xl shadow-sm border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-[10px] md:text-xs shrink-0">NAME</div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5 opacity-70">Legal Identity</p>
                            <p className="text-lg md:text-xl font-black text-white tracking-tight uppercase truncate">
                                {participant.display_name || 'Anonymous Subject'}
                            </p>
                        </div>
                    </div>

                    {/* PID CARD */}
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-[#F0F6FF] rounded-xl md:rounded-2xl shadow-sm border border-[#E3F2FD] flex items-center justify-center text-[#1E88E5] font-black text-[10px] md:text-xs shrink-0">PID</div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-[#1E88E5] uppercase tracking-widest mb-1.5 opacity-70">Clinical ID</p>
                            {isEditingIds ? (
                                <input 
                                    value={tempPid}
                                    onChange={e => setTempPid(e.target.value)}
                                    className="w-full bg-[#0F172A] border border-blue-500/30 rounded-lg px-4 py-2 text-white font-bold text-lg outline-none focus:border-blue-500 transition-all"
                                />
                            ) : (
                                <p className="text-xl font-black text-white tracking-tight uppercase">{participant.participant_sid || 'AWAITING'}</p>
                            )}
                        </div>
                    </div>

                    {/* SID CARD */}
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-[#FFF3E0] rounded-xl md:rounded-2xl shadow-sm border border-[#FFE0B2] flex items-center justify-center text-[#E65100] font-black text-[10px] md:text-xs shrink-0">SID</div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-[#E65100] uppercase tracking-widest mb-1.5 opacity-70">Study ID</p>
                            {isEditingIds ? (
                                <input 
                                    value={tempSid}
                                    onChange={e => setTempSid(e.target.value)}
                                    className="w-full bg-[#0F172A] border border-amber-500/30 rounded-lg px-4 py-2 text-white font-bold text-lg outline-none focus:border-amber-500 transition-all"
                                />
                            ) : (
                                <p className="text-xl font-black text-white tracking-tight uppercase">{participant.protocol_id || 'N/A'}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Practical Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { l: 'Participant Age', v: formatVal(participant.age) },
                    { l: 'Sex', v: formatVal(participant.gender || participant.sex) },
                    { l: 'Assigned Study Arm', v: formatVal(participant.assigned_arm_name || participant.assigned_arm?.name || 'Default') },
                    { l: 'Contact Email', v: formatVal(participant.display_email) },
                    { l: 'Phone Number', v: formatVal(participant.display_phone) },
                    { l: 'Home Address / Location', v: formatVal(participant.display_address) },
                    { l: 'Enrollment Date', v: participant.reviewed_at ? new Date(participant.reviewed_at).toLocaleDateString() : (participant.status === 'ENROLLED' ? new Date(participant.created_at).toLocaleDateString() : 'Pending Review') },
                    { l: 'Primary Condition', v: participant.condition || 'General' },
                    { l: 'Assigned Coordinator', v: formatVal(participant.coordinator_name || 'Unassigned') }
                ].map((item, i) => (
                    <div key={i} style={S.card} className="group hover:border-indigo-500/30 transition-colors">
                        <label style={S.label}>{item.l}</label>
                        <div className="text-base font-bold text-white mt-1 break-words">{item.v}</div>
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

