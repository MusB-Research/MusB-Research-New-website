import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Edit3, Check, ShieldCheck, Save } from 'lucide-react';
import { COLORS, S } from '../SubRevConstants';
import { authFetch, API, getRole } from '../../../../utils/auth';
import LifecycleTracker from '../clinical/LifecycleTracker';
import ApprovalStatus from '../clinical/ApprovalStatus';
import PIIRevealButton from '../clinical/PIIRevealButton';

interface SubjectOverviewProps {
    participant: any;
    alerts: any[];
    setParticipant?: React.Dispatch<React.SetStateAction<any>>;
    addToast: (msg: string, type?: string) => void;
    logAction: (action: string, detail: string) => void;
    onApprove: (type: 'coordinator' | 'pi', signature: string) => Promise<void>;
    onReveal: (field: string, reason: string) => Promise<string>;
    isApproving: boolean;
}

export const SubjectOverview: React.FC<SubjectOverviewProps> = ({ 
    participant, alerts = [], addToast, logAction, setParticipant,
    onApprove, onReveal, isApproving
}) => {
    const [isEditingIds, setIsEditingIds] = useState(false);
    const [tempPid, setTempPid] = useState(participant.participant_sid || '');
    const [tempSid, setTempSid] = useState(participant.protocol_id || '');
    const [isSaving, setIsSaving] = useState(false);

    // HMBT State variables
    const [preHydrogen, setPreHydrogen] = useState<string>('');
    const [preMethane, setPreMethane] = useState<string>('');
    const [preCO2, setPreCO2] = useState<string>('');
    const [postHydrogen, setPostHydrogen] = useState<string>('');
    const [postMethane, setPostMethane] = useState<string>('');
    const [postCO2, setPostCO2] = useState<string>('');
    const [hmbtSaveStatus, setHmbtSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
    const [isSavingHmbt, setIsSavingHmbt] = useState<boolean>(false);

    const role = (getRole() || '').toUpperCase();
    const canEdit = ['COORDINATOR', 'PI', 'ADMIN', 'SUPER_ADMIN'].includes(role);

    // Sync HMBT state when participant changes
    useEffect(() => {
        const outcomes = participant?.eligibility_data?.hmbt_outcomes || {};
        setPreHydrogen(outcomes.pre_hydrogen ?? '');
        setPreMethane(outcomes.pre_methane ?? '');
        setPreCO2(outcomes.pre_co2 ?? '');
        setPostHydrogen(outcomes.post_hydrogen ?? '');
        setPostMethane(outcomes.post_methane ?? '');
        setPostCO2(outcomes.post_co2 ?? '');
        setHmbtSaveStatus({ type: null, message: '' });
    }, [participant]);

    const handleSaveHMBT = async () => {
        if (!canEdit || !setParticipant) return;
        setIsSavingHmbt(true);
        setHmbtSaveStatus({ type: null, message: '' });

        try {
            const updatedOutcomes = {
                pre_hydrogen: preHydrogen,
                pre_methane: preMethane,
                pre_co2: preCO2,
                post_hydrogen: postHydrogen,
                post_methane: postMethane,
                post_co2: postCO2,
                saved_by: role,
                saved_at: new Date().toISOString()
            };

            const updatedEligibilityData = {
                ...(participant?.eligibility_data || {}),
                hmbt_outcomes: updatedOutcomes
            };

            const res = await authFetch(`${API}/api/participants/${participant.participant_sid}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eligibility_data: updatedEligibilityData })
            });

            if (res.ok) {
                const data = await res.json();
                setHmbtSaveStatus({ type: 'success', message: 'HMBT metrics saved!' });
                setParticipant((prev: any) => ({
                    ...prev,
                    eligibility_data: updatedEligibilityData
                }));
                logAction('HMBT Saved', 'Populated HMBT measurements from overview.');
                addToast("HMBT Measurements updated successfully", "success");
            } else {
                const errData = await res.json().catch(() => ({}));
                setHmbtSaveStatus({ type: 'error', message: errData.detail || 'Failed to save.' });
            }
        } catch (err) {
            console.error(err);
            setHmbtSaveStatus({ type: 'error', message: 'An unexpected error occurred.' });
        } finally {
            setIsSavingHmbt(false);
            setTimeout(() => setHmbtSaveStatus({ type: null, message: '' }), 3000);
        }
    };

    const isElevated = (val: string, threshold: number) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= threshold;
    };

    const inputStyle = {
        width: '100%',
        backgroundColor: '#0F172A',
        border: `1px solid ${COLORS.border}`,
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        color: 'white',
        fontSize: '16px', // Larger text size
        outline: 'none',
        transition: 'all 0.2s',
        marginTop: '0.25rem',
    };

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

            {/* Clinical Lifecycle Tracker */}
            <LifecycleTracker 
                status={participant.status} 
                updatedAt={participant.updated_at || participant.created_at} 
            />

            {/* Dual Approval System */}
            <ApprovalStatus 
                participant={participant} 
                onApprove={onApprove} 
                isProcessing={isApproving} 
            />

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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* NAME CARD */}
                    <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-xl shadow-sm border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-[10px] shrink-0">NAME</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 opacity-70">Legal Identity</p>
                            <p className="text-base font-black text-white tracking-tight uppercase truncate">
                                {participant.display_name || 'Anonymous Subject'}
                            </p>
                        </div>
                    </div>

                    {/* PID CARD */}
                    <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="w-12 h-12 bg-[#F0F6FF] rounded-xl shadow-sm border border-[#E3F2FD] flex items-center justify-center text-[#1E88E5] font-black text-[10px] shrink-0">PID</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-[#1E88E5] uppercase tracking-widest mb-1 opacity-70">Clinical ID</p>
                            {isEditingIds ? (
                                <input
                                    value={tempPid}
                                    onChange={e => setTempPid(e.target.value)}
                                    className="w-full bg-[#0F172A] border border-blue-500/30 rounded-lg px-3 py-1.5 text-white font-bold text-sm outline-none focus:border-blue-500 transition-all"
                                />
                            ) : (
                                <p className="text-base font-black text-white tracking-tight uppercase truncate">{participant.participant_sid || 'AWAITING'}</p>
                            )}
                        </div>
                    </div>

                    {/* SID CARD */}
                    <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl sm:col-span-2 lg:col-span-1">
                        <div className="w-12 h-12 bg-[#FFF3E0] rounded-xl shadow-sm border border-[#FFE0B2] flex items-center justify-center text-[#E65100] font-black text-[10px] shrink-0">SID</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-[#E65100] uppercase tracking-widest mb-1 opacity-70">Study ID</p>
                            {isEditingIds ? (
                                <input
                                    value={tempSid}
                                    onChange={e => setTempSid(e.target.value)}
                                    className="w-full bg-[#0F172A] border border-amber-500/30 rounded-lg px-3 py-1.5 text-white font-bold text-sm outline-none focus:border-amber-500 transition-all"
                                />
                            ) : (
                                <p className="text-base font-black text-white tracking-tight uppercase truncate">{participant.protocol_id || 'N/A'}</p>
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
                    { l: 'Contact Email', v: <PIIRevealButton field="email" maskedValue={participant.display_email} onReveal={onReveal} /> },
                    { l: 'Phone Number', v: <PIIRevealButton field="phone" maskedValue={participant.display_phone} onReveal={onReveal} /> },
                    { l: 'Home Address / Location', v: <PIIRevealButton field="address" maskedValue={participant.display_address} onReveal={onReveal} /> },
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

            {/* HMBT Outcomes Section */}
            {participant?.eligibility_data && (
                <div style={S.card} className="mt-2">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <label style={{ ...S.label, marginBottom: '0.15rem' }}>Core Trial Diagnostics</label>
                            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
                                Hydrogen Methane Breath Test (HMBT) Outcomes
                            </h3>
                        </div>
                        {participant.eligibility_data.hmbt_outcomes?.saved_at && (
                            <div style={{ fontSize: '11px', color: COLORS.label, backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: `1px solid ${COLORS.border}` }}>
                                Last Saved: <span style={{ color: 'white', fontWeight: 600 }}>{new Date(participant.eligibility_data.hmbt_outcomes.saved_at).toLocaleDateString()}</span> by <span style={{ color: COLORS.accent, fontWeight: 600 }}>{participant.eligibility_data.hmbt_outcomes.saved_by}</span>
                            </div>
                        )}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {/* Pre-HMBT Section */}
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: `1px solid ${COLORS.border}`, borderRadius: '10px', padding: '1.25rem' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: COLORS.accent, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
                                Pre-HMBT Measurements
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: COLORS.text }}>Hydrogen (ppm)</label>
                                        {isElevated(preHydrogen, 20) && <span style={{ fontSize: '10px', color: COLORS.danger, fontWeight: 'bold' }}>Elevated</span>}
                                    </div>
                                    {canEdit ? (
                                        <input type="text" inputMode="decimal" placeholder="e.g. 15" value={preHydrogen} onChange={e => setPreHydrogen(e.target.value)} style={{...inputStyle, borderColor: isElevated(preHydrogen, 20) ? COLORS.danger : COLORS.border}} />
                                    ) : (
                                        <div className="text-white font-bold text-lg">{preHydrogen || '-'}</div>
                                    )}
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: COLORS.text }}>Methane (ppm)</label>
                                        {isElevated(preMethane, 10) && <span style={{ fontSize: '10px', color: COLORS.danger, fontWeight: 'bold' }}>Elevated</span>}
                                    </div>
                                    {canEdit ? (
                                        <input type="text" inputMode="decimal" placeholder="e.g. 5" value={preMethane} onChange={e => setPreMethane(e.target.value)} style={{...inputStyle, borderColor: isElevated(preMethane, 10) ? COLORS.danger : COLORS.border}} />
                                    ) : (
                                        <div className="text-white font-bold text-lg">{preMethane || '-'}</div>
                                    )}
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: COLORS.text, display: 'block', marginBottom: '0.25rem' }}>Carbon Dioxide (CO2)</label>
                                    {canEdit ? (
                                        <input type="text" inputMode="decimal" placeholder="e.g. 5.1%" value={preCO2} onChange={e => setPreCO2(e.target.value)} style={inputStyle} />
                                    ) : (
                                        <div className="text-white font-bold text-lg">{preCO2 || '-'}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Post-HMBT Section */}
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: `1px solid ${COLORS.border}`, borderRadius: '10px', padding: '1.25rem' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: COLORS.accent, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
                                Post-HMBT Measurements
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: COLORS.text }}>Hydrogen (ppm)</label>
                                        {isElevated(postHydrogen, 20) && <span style={{ fontSize: '10px', color: COLORS.danger, fontWeight: 'bold' }}>Elevated</span>}
                                    </div>
                                    {canEdit ? (
                                        <input type="text" inputMode="decimal" placeholder="e.g. 35" value={postHydrogen} onChange={e => setPostHydrogen(e.target.value)} style={{...inputStyle, borderColor: isElevated(postHydrogen, 20) ? COLORS.danger : COLORS.border}} />
                                    ) : (
                                        <div className="text-white font-bold text-lg">{postHydrogen || '-'}</div>
                                    )}
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: COLORS.text }}>Methane (ppm)</label>
                                        {isElevated(postMethane, 10) && <span style={{ fontSize: '10px', color: COLORS.danger, fontWeight: 'bold' }}>Elevated</span>}
                                    </div>
                                    {canEdit ? (
                                        <input type="text" inputMode="decimal" placeholder="e.g. 8" value={postMethane} onChange={e => setPostMethane(e.target.value)} style={{...inputStyle, borderColor: isElevated(postMethane, 10) ? COLORS.danger : COLORS.border}} />
                                    ) : (
                                        <div className="text-white font-bold text-lg">{postMethane || '-'}</div>
                                    )}
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: COLORS.text, display: 'block', marginBottom: '0.25rem' }}>Carbon Dioxide (CO2)</label>
                                    {canEdit ? (
                                        <input type="text" inputMode="decimal" placeholder="e.g. 5.3%" value={postCO2} onChange={e => setPostCO2(e.target.value)} style={inputStyle} />
                                    ) : (
                                        <div className="text-white font-bold text-lg">{postCO2 || '-'}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {canEdit && (
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', borderTop: `1px solid ${COLORS.border}`, paddingTop: '1.5rem' }}>
                            {hmbtSaveStatus.type && (
                                <span style={{ fontSize: '12px', fontWeight: 600, color: hmbtSaveStatus.type === 'success' ? COLORS.success : COLORS.danger }}>
                                    {hmbtSaveStatus.message}
                                </span>
                            )}
                            <button 
                                onClick={handleSaveHMBT}
                                disabled={isSavingHmbt}
                                style={{ 
                                    backgroundColor: COLORS.accent, color: 'white', padding: '0.75rem 1.5rem', 
                                    borderRadius: '8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', 
                                    letterSpacing: '0.05em', border: 'none', cursor: isSavingHmbt ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isSavingHmbt ? 0.7 : 1,
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Save size={16} /> {isSavingHmbt ? 'Saving...' : 'Save Breath Test Metrics'}
                            </button>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

