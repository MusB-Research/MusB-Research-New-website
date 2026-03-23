import React, { useState, useCallback } from 'react';
import { 
  X, ChevronRight, ChevronLeft, Calendar, 
  MapPin, DollarSign, Users, FileText, 
  Upload, CheckCircle2, AlertCircle, Loader2 
} from 'lucide-react';
import { authFetch, API } from '../utils/auth';

const THEME = {
  primary: '#2563eb',
  secondary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  border: '#e2e8f0',
  dark: '#0f172a',
  body: '#475569',
  label: '#64748b',
  white: '#ffffff',
  bg: '#f8fafc'
};

const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px', 
  border: `1px solid ${THEME.border}`, background: '#f8fafc',
  fontSize: '14px', color: THEME.dark, marginBottom: '16px',
  outline: 'none', transition: 'border-color 0.2s',
  display: 'block'
};

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: 700, 
  color: THEME.label, textTransform: 'uppercase' as const, 
  marginBottom: '8px', letterSpacing: '0.05em'
};

const pillStyle = (active: boolean) => ({
  padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
  cursor: 'pointer', transition: 'all 0.2s', border: `1px solid ${active ? THEME.primary : THEME.border}`,
  background: active ? `${THEME.primary}10` : '#fff',
  color: active ? THEME.primary : THEME.body,
  flex: 1, textAlign: 'center' as const
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function InquireStudyModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState({
    title: '',
    researchArea: 'Aging',
    studyType: 'Clinical Trial',
    description: '',
    participants: '',
    startDate: '',
    duration: '6 months',
    budget: '$50K–$200K',
    sites: [] as string[],
    contactName: 'Dr. Patricia Lane',
    contactEmail: 'p.lane@vitanova.com',
    phone: '',
    notes: '',
    files: [] as string[]
  });

  const handleNext = useCallback(() => {
    if (step === 1 && (!form.title || !form.description)) return;
    setStep(s => s + 1);
  }, [step, form]);

  const handleBack = useCallback(() => setStep(s => s - 1), []);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Simulate real logic as requested
      const response = await authFetch(`${API || 'http://localhost:8000'}/api/studies/`, {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          protocol_id: `INQ-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'PAUSED', // Represents "Under Review" locally
          primary_indication: form.researchArea,
          description: form.description,
          target_enrollment: parseInt(form.participants) || 50,
        })
      });

      if (response.ok) {
        setShowSuccess(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setShowSuccess(false);
      setForm({
        title: '', researchArea: 'Aging', studyType: 'Clinical Trial',
        description: '', participants: '', startDate: '', duration: '6 months',
        budget: '$50K–$200K', sites: [], contactName: 'Dr. Patricia Lane',
        contactEmail: 'p.lane@vitanova.com', phone: '', notes: '', files: []
      });
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '24px', width: '680px', maxWidth: '100%', overflow: 'hidden', boxShadow: '0 25px 70px rgba(0,0,0,0.15)', position: 'relative' }}>
        
        {/* Header */}
        <div style={{ padding: '32px 32px 24px', borderBottom: `1px solid ${THEME.border}`, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: THEME.dark, margin: 0 }}>New Study Inquiry</h2>
              <p style={{ fontSize: '14px', color: THEME.body, marginTop: '4px' }}>Submit a research collaboration request to MusB Research</p>
            </div>
            <button onClick={resetAndClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: THEME.label }}><X size={24} /></button>
          </div>

          {/* Progress Indicator */}
          {!showSuccess && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
              {[1, 2, 3].map(s => (
                <div key={s} style={{ 
                  flex: 1, height: '6px', borderRadius: '3px', 
                  background: s <= step ? THEME.primary : THEME.border,
                  transition: 'background 0.3s'
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '32px', maxHeight: '60vh', overflowY: 'auto' }}>
          {showSuccess ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: '80px', height: '80px', background: `${THEME.success}10`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <CheckCircle2 size={40} color={THEME.success} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: THEME.dark, marginBottom: '12px' }}>Inquiry Submitted Successfully!</h3>
              <p style={{ fontSize: '14px', color: THEME.body, marginBottom: '24px', lineHeight: '1.6' }}>
                Submit this study inquiry to MusB Research? A coordinator will contact you within 2 business days. 
                Your Inquiry ID is: <strong>INQ-{Math.floor(Math.random()*10000)}</strong>
              </p>
              <button 
                onClick={resetAndClose}
                style={{ padding: '12px 32px', background: THEME.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={labelStyle}>Study Title (Required)</label>
                    <input style={inputStyle} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g., Evaluation of NAD+ in Aging Cohorts" />
                  </div>
                  <div>
                    <label style={labelStyle}>Research Area</label>
                    <select style={inputStyle} value={form.researchArea} onChange={e => setForm({...form, researchArea: e.target.value})}>
                      {['Oncology', 'Metabolic', 'Neurology', 'Aging', 'Gut Health', 'Women\'s Health', 'Other'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Study Type</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {['Clinical Trial', 'Observational', 'Preclinical'].map(v => (
                        <button key={v} onClick={() => setForm({...form, studyType: v})} style={pillStyle(form.studyType === v)}>{v}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Brief Description (Required)</label>
                    <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'none' }} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the objectives and methods..." />
                  </div>
                  <div>
                    <label style={labelStyle}>Estimated Number of Participants</label>
                    <input style={inputStyle} type="number" value={form.participants} onChange={e => setForm({...form, participants: e.target.value})} placeholder="e.g., 100" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   <div>
                    <label style={labelStyle}>Proposed Start Date</label>
                    <input style={inputStyle} type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
                  </div>
                  <div>
                    <label style={labelStyle}>Estimated Duration</label>
                    <select style={inputStyle} value={form.duration} onChange={e => setForm({...form, duration: e.target.value})}>
                      {['3 months', '6 months', '12 months', '18+ months'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Budget Range</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      {['< $50K', '$50K–$200K', '$200K–$500K', '$500K+'].map(v => (
                        <button key={v} onClick={() => setForm({...form, budget: v})} style={pillStyle(form.budget === v)}>{v}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Preferred Sites</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {['Tampa', 'Miami', 'Orlando', 'Remote'].map(v => (
                        <button key={v} onClick={() => {
                          const sites = form.sites.includes(v) ? form.sites.filter(s => s !== v) : [...form.sites, v];
                          setForm({...form, sites});
                        }} style={pillStyle(form.sites.includes(v))}>{v}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>Contact Name</label>
                      <input style={inputStyle} value={form.contactName} readOnly disabled />
                    </div>
                    <div>
                      <label style={labelStyle}>Contact Email</label>
                      <input style={inputStyle} value={form.contactEmail} readOnly disabled />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Primary Contact Phone</label>
                    <input style={inputStyle} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+1 (813) 000-0000" />
                  </div>
                  <div>
                    <label style={labelStyle}>Additional Notes</label>
                    <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'none' }} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any other details or requirements..." />
                  </div>
                  <div>
                    <label style={labelStyle}>Attach Supporting Files</label>
                    <div style={{ padding: '20px', border: `2px dashed ${THEME.border}`, borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }}>
                       <Upload size={24} color={THEME.label} style={{ marginBottom: '8px' }} />
                       <p style={{ fontSize: '13px', color: THEME.label, margin: 0 }}>Click to upload protocol synopsis or budget draft</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!showSuccess && (
          <div style={{ padding: '24px 32px', borderTop: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between', background: '#fff' }}>
            <button 
              onClick={step === 1 ? resetAndClose : handleBack}
              style={{ padding: '10px 24px', border: 'none', background: 'none', color: THEME.label, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {step === 1 ? 'Cancel' : <><ChevronLeft size={18} /> Back</>}
            </button>
            <button 
              onClick={step === 3 ? handleSubmit : handleNext}
              disabled={isLoading || (step === 1 && (!form.title || !form.description))}
              style={{ 
                padding: '10px 32px', background: THEME.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, 
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: (step === 1 && (!form.title || !form.description)) ? 0.5 : 1
              }}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
                step === 3 ? 'Submit Inquiry' : <>Next <ChevronRight size={18} /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
