import React, { useState, useEffect } from 'react';
import { CheckCircle2, X, AlertTriangle, CheckSquare } from 'lucide-react';
import { COLORS, S } from '../SubRevConstants';
import { authFetch, API, getRole } from '../../../../utils/auth';

interface EligibilityAuditProps {
    participant: any;
    screeningNotes: string;
    setScreeningNotes: (val: string) => void;
    logAction: (action: string, detail: string) => void;
    onUpdateParticipant?: (updated: any) => void;
}

export const EligibilityAudit: React.FC<EligibilityAuditProps> = ({ 
    participant, screeningNotes, setScreeningNotes, logAction, onUpdateParticipant 
}) => {
    const role = (getRole() || '').toUpperCase();
    const canEdit = ['COORDINATOR', 'PI', 'ADMIN', 'SUPER_ADMIN'].includes(role);

    // HMBT State variables
    const [preHydrogen, setPreHydrogen] = useState<string>('');
    const [preMethane, setPreMethane] = useState<string>('');
    const [preCO2, setPreCO2] = useState<string>('');
    const [postHydrogen, setPostHydrogen] = useState<string>('');
    const [postMethane, setPostMethane] = useState<string>('');
    const [postCO2, setPostCO2] = useState<string>('');

    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

    // Sync state when participant changes
    useEffect(() => {
        const outcomes = participant?.eligibility_data?.hmbt_outcomes || {};
        setPreHydrogen(outcomes.pre_hydrogen ?? '');
        setPreMethane(outcomes.pre_methane ?? '');
        setPreCO2(outcomes.pre_co2 ?? '');
        setPostHydrogen(outcomes.post_hydrogen ?? '');
        setPostMethane(outcomes.post_methane ?? '');
        setPostCO2(outcomes.post_co2 ?? '');
        setSaveStatus({ type: null, message: '' });
    }, [participant]);

    const handleSaveHMBT = async () => {
        if (!canEdit) return;
        setIsSaving(true);
        setSaveStatus({ type: null, message: '' });

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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    eligibility_data: updatedEligibilityData
                })
            });

            if (res.ok) {
                const data = await res.json();
                setSaveStatus({ type: 'success', message: 'HMBT Outcome measurements successfully saved!' });
                if (onUpdateParticipant) {
                    onUpdateParticipant({
                        ...participant,
                        ...data,
                        consent: data.consent || participant.consent,
                        adverseEvents: data.adverseEvents || participant.adverseEvents,
                        symptoms: data.symptoms || participant.symptoms,
                        documents: data.documents || participant.documents,
                        lab_results: data.lab_results || data.labs || participant.lab_results
                    });
                }
                logAction('HMBT Saved', 'Coordinator populated HMBT measurements during screening review.');
            } else {
                const errData = await res.json().catch(() => ({}));
                setSaveStatus({ type: 'error', message: errData.detail || 'Failed to save outcome measurements.' });
            }
        } catch (err) {
            console.error("Error saving HMBT outcomes:", err);
            setSaveStatus({ type: 'error', message: 'An unexpected error occurred while saving.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleMarkAllComplete = async (type: 'inclusion' | 'exclusion') => {
        if (!canEdit || !onUpdateParticipant) return;
        
        let updatedInclusions = [...participant.inclusions];
        let updatedExclusions = [...participant.exclusions];

        if (type === 'inclusion') {
            updatedInclusions = updatedInclusions.map((inc: any) => ({ ...inc, met: true }));
        } else {
            updatedExclusions = updatedExclusions.map((exc: any) => ({ ...exc, present: false }));
        }

        const updatedParticipant = {
            ...participant,
            inclusions: updatedInclusions,
            exclusions: updatedExclusions
        };

        // Update local state immediately for fast feedback
        onUpdateParticipant(updatedParticipant);

        try {
            await authFetch(`${API}/api/participants/${participant.participant_sid}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eligibility_data: {
                        ...(participant?.eligibility_data || {}),
                        inclusions: updatedInclusions,
                        exclusions: updatedExclusions
                    }
                })
            });
            logAction('Criteria Updated', `Coordinator marked all ${type} criteria as ${type === 'inclusion' ? 'met' : 'absent'}.`);
        } catch (err) {
            console.error("Failed to update criteria:", err);
        }
    };

    // Helper functions to check clinical thresholds
    const isHydrogenElevated = (val: string) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 20;
    };

    const isMethaneElevated = (val: string) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 10;
    };

    const inputStyle = {
        width: '100%',
        backgroundColor: '#0F172A',
        border: `1px solid ${COLORS.border}`,
        borderRadius: '8px',
        padding: '0.5rem 0.75rem',
        color: 'white',
        fontSize: '13px',
        outline: 'none',
        transition: 'all 0.2s',
        marginTop: '0.15rem',
    };

    const sectionTitleStyle = {
        fontSize: '12px',
        fontWeight: 800,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.08em',
        color: COLORS.accent,
        borderBottom: `1px solid ${COLORS.border}`,
        paddingBottom: '0.5rem',
        marginBottom: '1rem',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div style={S.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={S.label}>Inclusion Criteria Registry</label>
                        {canEdit && (
                            <button 
                                onClick={() => handleMarkAllComplete('inclusion')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded transition-all border border-emerald-500/20"
                            >
                                <CheckSquare size={12} /> Mark All Met
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                        {participant.inclusions.map((inc: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                {inc.met ? <CheckCircle2 size={16} color={COLORS.success} /> : <X size={16} color={COLORS.danger} />}
                                <span style={{ fontSize: '14px', color: inc.met ? 'white' : COLORS.text }}>{inc.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={S.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={S.label}>Exclusion Criteria Registry</label>
                        {canEdit && (
                            <button 
                                onClick={() => handleMarkAllComplete('exclusion')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded transition-all border border-emerald-500/20"
                            >
                                <CheckSquare size={12} /> Mark All Absent
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                        {participant.exclusions.map((exc: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: exc.present ? `${COLORS.danger}10` : 'rgba(255,255,255,0.02)', borderRadius: '8px', border: exc.present ? `1px solid ${COLORS.danger}30` : 'none' }}>
                                {exc.present ? <AlertTriangle size={16} color={COLORS.danger} /> : <CheckCircle2 size={16} color={COLORS.success} />}
                                <span style={{ fontSize: '14px', color: exc.present ? COLORS.danger : 'white' }}>{exc.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ gridColumn: '1 / -1', ...S.card }}>
                    <label style={S.label}>Screening Methodology Notes</label>
                    <textarea 
                        style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: 'white', padding: '1.5rem', fontSize: '14px', outline: 'none', minHeight: '120px' }}
                        placeholder="Enter proprietary clinical observations..."
                        value={screeningNotes}
                        onBlur={() => logAction('Note Saved', 'PI updated screening methodology notes.')}
                        onChange={e => setScreeningNotes(e.target.value)}
                    />
                </div>
            </div>

            {/* Hydrogen Methane Breath Test (HMBT) Outcome Measurements Form */}
            <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <label style={{ ...S.label, marginBottom: '0.15rem' }}>Core Trial Diagnostics</label>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
                            Hydrogen Methane Breath Test (HMBT) Outcomes
                        </h3>
                    </div>
                    {participant?.eligibility_data?.hmbt_outcomes?.saved_at && (
                        <div style={{ fontSize: '11px', color: COLORS.label, backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: `1px solid ${COLORS.border}` }}>
                            Last Saved: <span style={{ color: 'white', fontWeight: 600 }}>{new Date(participant.eligibility_data.hmbt_outcomes.saved_at).toLocaleDateString()}</span> by <span style={{ color: COLORS.accent, fontWeight: 600 }}>{participant.eligibility_data.hmbt_outcomes.saved_by}</span>
                        </div>
                    )}
                </div>

                {!canEdit && (
                    <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', fontSize: '13px', color: COLORS.warning, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        <span>HMBT Outcome measurements can only be populated and updated by Clinical Coordinators (CC) or Principal Investigators (PI).</span>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    {/* Pre-HMBT Section */}
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: `1px solid ${COLORS.border}`, borderRadius: '10px', padding: '1rem' }}>
                        <h4 style={sectionTitleStyle}>Pre-HMBT Measurements</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: COLORS.text }}>Hydrogen (ppm)</label>
                                    {preHydrogen && (
                                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: isHydrogenElevated(preHydrogen) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: isHydrogenElevated(preHydrogen) ? COLORS.danger : COLORS.success }}>
                                            {isHydrogenElevated(preHydrogen) ? 'Elevated (>=20)' : 'Normal'}
                                        </span>
                                    )}
                                </div>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 12" 
                                    value={preHydrogen}
                                    onChange={(e) => setPreHydrogen(e.target.value)}
                                    disabled={!canEdit}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: COLORS.text }}>Methane (ppm)</label>
                                    {preMethane && (
                                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: isMethaneElevated(preMethane) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: isMethaneElevated(preMethane) ? COLORS.danger : COLORS.success }}>
                                            {isMethaneElevated(preMethane) ? 'Elevated (>=10)' : 'Normal'}
                                        </span>
                                    )}
                                </div>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 5" 
                                    value={preMethane}
                                    onChange={(e) => setPreMethane(e.target.value)}
                                    disabled={!canEdit}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: COLORS.text, display: 'block' }}>Carbon Dioxide (CO2)</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. 5.1%" 
                                    value={preCO2}
                                    onChange={(e) => setPreCO2(e.target.value)}
                                    disabled={!canEdit}
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Post-HMBT Section */}
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: `1px solid ${COLORS.border}`, borderRadius: '10px', padding: '1rem' }}>
                        <h4 style={sectionTitleStyle}>Post-HMBT Measurements</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: COLORS.text }}>Hydrogen (ppm)</label>
                                    {postHydrogen && (
                                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: isHydrogenElevated(postHydrogen) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: isHydrogenElevated(postHydrogen) ? COLORS.danger : COLORS.success }}>
                                            {isHydrogenElevated(postHydrogen) ? 'Elevated (>=20)' : 'Normal'}
                                        </span>
                                    )}
                                </div>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 35" 
                                    value={postHydrogen}
                                    onChange={(e) => setPostHydrogen(e.target.value)}
                                    disabled={!canEdit}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: COLORS.text }}>Methane (ppm)</label>
                                    {postMethane && (
                                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: isMethaneElevated(postMethane) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: isMethaneElevated(postMethane) ? COLORS.danger : COLORS.success }}>
                                            {isMethaneElevated(postMethane) ? 'Elevated (>=10)' : 'Normal'}
                                        </span>
                                    )}
                                </div>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 8" 
                                    value={postMethane}
                                    onChange={(e) => setPostMethane(e.target.value)}
                                    disabled={!canEdit}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: COLORS.text, display: 'block' }}>Carbon Dioxide (CO2)</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. 5.3%" 
                                    value={postCO2}
                                    onChange={(e) => setPostCO2(e.target.value)}
                                    disabled={!canEdit}
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {saveStatus.type && (
                    <div style={{ 
                        backgroundColor: saveStatus.type === 'success' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', 
                        border: `1px solid ${saveStatus.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, 
                        borderRadius: '8px', 
                        padding: '1rem', 
                        marginBottom: '1.5rem', 
                        fontSize: '13px', 
                        color: saveStatus.type === 'success' ? COLORS.success : COLORS.danger,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        {saveStatus.type === 'success' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        )}
                        <span>{saveStatus.message}</span>
                    </div>
                )}

                {canEdit && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                            onClick={handleSaveHMBT}
                            disabled={isSaving}
                            style={{ 
                                ...S.btnPrimary,
                                opacity: isSaving ? 0.7 : 1,
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            {isSaving ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <circle cx="12" cy="12" r="10" strokeDasharray="40" strokeLinecap="round"></circle>
                                    </svg>
                                    Saving Outcomes...
                                </span>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                        <polyline points="7 3 7 8 15 8"></polyline>
                                    </svg>
                                    Save Breath Test Metrics
                                </span>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


