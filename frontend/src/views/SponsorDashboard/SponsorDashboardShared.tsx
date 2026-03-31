import React, { useEffect } from 'react';
import { jsPDF } from 'jspdf';

// === CONSTANTS & MOCK DATA ===
export const SPONSOR = {
  id: 'SP-VITANOVA',
  name: 'VitaNova Therapeutics',
  contact: 'Dr. Patricia Lane',
  email: 'p.lane@vitanova.com',
  phone: '+1 (813) 555-0192'
};

export const MOCK_PROTOCOLS = [
  {
    id:'MUSB-2024-012', title:'VITAL-Age Study', status:'Recruiting',
    enrollment:{ current:65, target:100 }, lastUpdated:'2 days ago',
    pi:'Dr. James Miller', site:'Miller Clinic — Tampa, FL',
    startDate:'2025-09-01', endDate:'2026-09-01',
    studyType:'Clinical Trial', researchArea:'Aging',
    indication:'Healthy Aging', designType:'Randomized Controlled Trial',
    studyMode:'In-Person', irbStatus:'Approved', launchDate:'2025-10-01',
    coordinators:['CC-01','CC-02'],
    sites:['Miller Clinic — Tampa','MusB Research Center'],
    kpis:{ enrolled:65, targetEnrolled:100, completed:8, targetCompleted:90, recruitmentCompleted:false, analysisStatus:'Not Started', latestReport:'Draft' },
    nctNumber:'NCT06123456', registryStatus:'Active, Recruiting',
    documents:[
      { id:'d1', type:'IRB Letter', category:'Regulatory', title:'IRB Approval Letter', description:'Official IRB approval document', version:'1.0', date:'2025-09-01', irbNumber:'25-028', expiryDate:'2026-09-01', pageCount:3 },
      { id:'d2', type:'Protocol', category:'Protocol', title:'IRB Approved Protocol', description:'Final approved study protocol', version:'2.0', date:'2025-08-15', amendment:'Amendment 1 — Aug 2025', pageCount:48, versions:[{version:'1.0',date:'2025-07-01',status:'Superseded',notes:'Initial submission'},{version:'2.0',date:'2025-08-15',status:'Current',notes:'Amendment 1 — updated eligibility criteria'}] },
      { id:'d3', type:'Consent', category:'Consent', title:'Participant Consent Form', description:'IRB-approved consent document', version:'1.0', date:'2025-09-01', effectiveDate:'2025-10-01', expiryDate:'2026-09-01', language:'English', pageCount:12, versions:[{version:'1.0',date:'2025-09-01',status:'Current',irbApprovalDate:'2025-09-01'}] },
      { id:'d4', type:'Report', category:'Reports', title:'Q1 2026 Progress Report', description:'Quarterly enrollment and safety progress report', version:'1.0', date:'2026-01-10', pageCount:8 },
      { id:'d5', type:'Report', category:'Reports', title:'Interim Safety Report', description:'Mid-study safety monitoring summary', version:'1.0', date:'2026-02-20', pageCount:6 },
      { id:'d6', type:'Site Activation', category:'Regulatory', title:'Site Activation Letter', description:'Official site activation authorization', version:'1.0', date:'2025-09-20', pageCount:2 }
    ],
    reportStats:{ progressReportsAvailable:2, latestReport:'Ready', participantDataAvailable:true },
    reports:[{ name:'Q1 2026 Progress Report', type:'Progress', date:'2026-01-10', status:'Sent' }],
    team:[
      { name:'Dr. James Miller', role:'Principal Investigator' },
      { name:'Sarah Jenkins', role:'Clinical Coordinator' },
      { name:'Dr. Patricia Lane', role:'Sponsor Contact' }
    ],
    milestones:[
      { label:'Protocol Submitted', date:'2025-07-01', status:'completed', notes:'Version 2 submitted' },
      { label:'IRB Approved', date:'2025-09-01', status:'completed', notes:'Full board approval' },
      { label:'Recruiting Started', date:'2025-10-01', status:'completed', notes:'First participant enrolled Oct 8' },
      { label:'Enrollment Closed', date:'2026-05-01', status:'pending', notes:'Target: 100 participants' },
      { label:'Data Lock', date:'2026-07-01', status:'pending', notes:'' },
      { label:'Final Report', date:'2026-09-01', status:'pending', notes:'' }
    ],
    enrollmentHistory:[{month:'Oct',count:8},{month:'Nov',count:22},{month:'Dec',count:35},{month:'Jan',count:48},{month:'Feb',count:59},{month:'Mar',count:65}],
    completionData:[{visit:'Screening',completed:73,target:75},{visit:'Baseline',completed:70,target:73},{visit:'Week 4',completed:65,target:70},{visit:'Week 8',completed:58,target:65},{visit:'Week 12',completed:42,target:58}],
    questionnaires:[
      { name:'VITAL Symptom Score', avgBaseline:7.2, avgLatest:4.8, points:[{label:'Baseline',score:7.2},{label:'Wk 4',score:6.1},{label:'Wk 8',score:5.3},{label:'Wk 12',score:4.8}] },
      { name:'Quality of Life Index', avgBaseline:52, avgLatest:68, points:[{label:'Baseline',score:52},{label:'Wk 4',score:57},{label:'Wk 8',score:63},{label:'Wk 12',score:68}] }
    ],
    samples:[{month:'Oct',sent:20,received:18},{month:'Nov',sent:35,received:30},{month:'Dec',sent:48,received:45},{month:'Jan',sent:60,received:58},{month:'Feb',sent:70,received:68},{month:'Mar',sent:78,received:75}]
  },
  {
    id:'MUSB-2024-013', title:'Anti-Aging Microbiome Study', status:'Active',
    enrollment:{ current:40, target:80 }, lastUpdated:'5 days ago',
    pi:'Dr. Elena Cruz', site:'MusB Research Center',
    startDate:'2025-11-01', endDate:'2026-11-01',
    studyType:'Clinical Trial', researchArea:'Gut Health',
    indication:'Gut Health & Aging', designType:'Double-Blind RCT',
    studyMode:'Virtual', irbStatus:'Approved', launchDate:'2025-11-15',
    coordinators:['CC-03'],
    sites:['MusB Research Center — Remote'],
    kpis:{ enrolled:40, targetEnrolled:80, completed:3, targetCompleted:70, recruitmentCompleted:false, analysisStatus:'Not Started', latestReport:'Pending' },
    nctNumber:null, registryStatus:null,
    documents:[
      { id:'d7', type:'IRB Letter', category:'Regulatory', title:'IRB Approval Letter', description:'Official IRB approval for Anti-Aging Microbiome Study', version:'1.0', date:'2025-10-28', irbNumber:'25-041', expiryDate:'2026-10-28', pageCount:3 },
      { id:'d8', type:'Protocol', category:'Protocol', title:'IRB Approved Protocol', description:'Final approved study protocol', version:'1.0', date:'2025-10-15', amendment:null, pageCount:36, versions:[{version:'1.0',date:'2025-10-15',status:'Current',notes:'Initial approved version'}] },
      { id:'d9', type:'Consent', category:'Consent', title:'Participant Consent Form', description:'IRB-approved eConsent document', version:'2.1', date:'2026-02-15', effectiveDate:'2026-03-01', expiryDate:'2027-02-28', language:'English', pageCount:10, versions:[{version:'1.0',date:'2025-11-01',status:'Superseded',irbApprovalDate:'2025-10-28'},{version:'2.1',date:'2026-02-15',status:'Current',irbApprovalDate:'2026-02-10'}] }
    ],
    reportStats:{ progressReportsAvailable:0, latestReport:'Pending', participantDataAvailable:true },
    reports:[],
    team:[
      { name:'Dr. Elena Cruz', role:'Principal Investigator' },
      { name:'Mark Wilson', role:'Clinical Coordinator' },
      { name:'Dr. Patricia Lane', role:'Sponsor Contact' }
    ],
    milestones:[
      { label:'Protocol Submitted', date:'2025-09-15', status:'completed', notes:'' },
      { label:'IRB Approved', date:'2025-10-28', status:'completed', notes:'Expedited review' },
      { label:'Recruiting Started', date:'2025-11-15', status:'completed', notes:'' },
      { label:'Enrollment Closed', date:'2026-06-01', status:'pending', notes:'Target: 80 participants' },
      { label:'Data Lock', date:'2026-09-01', status:'pending', notes:'' },
      { label:'Final Report', date:'2026-11-01', status:'pending', notes:'' }
    ],
    enrollmentHistory:[{month:'Nov',count:5},{month:'Dec',count:14},{month:'Jan',count:25},{month:'Feb',count:33},{month:'Mar',count:40}],
    completionData:[{visit:'Screening',completed:44,target:45},{visit:'Baseline',completed:42,target:44},{visit:'Week 6',completed:38,target:42},{visit:'Week 12',completed:28,target:38}],
    questionnaires:[
      { name:'Microbiome Wellness Score', avgBaseline:5.5, avgLatest:7.1, points:[{label:'Baseline',score:5.5},{label:'Wk 6',score:6.2},{label:'Wk 12',score:7.1}] }
    ],
    samples:[{month:'Nov',sent:12,received:10},{month:'Dec',sent:25,received:22},{month:'Jan',sent:38,received:35},{month:'Feb',sent:48,received:44},{month:'Mar',sent:55,received:50}]
  },
  {
    id:'MUSB-2023-008', title:'Gut-Brain Axis Pilot Study', status:'Completed',
    enrollment:{ current:50, target:50 }, lastUpdated:'3 months ago',
    pi:'Dr. James Miller', site:'Miller Clinic — Tampa, FL',
    startDate:'2024-01-01', endDate:'2024-12-31',
    studyType:'Observational', researchArea:'Neurology',
    indication:'Neurology & Gut Health', designType:'Observational Cohort',
    studyMode:'Hybrid', irbStatus:'Approved', launchDate:'2024-01-15',
    coordinators:['CC-01'],
    sites:['Miller Clinic — Tampa'],
    kpis:{ enrolled:50, targetEnrolled:50, completed:47, targetCompleted:45, recruitmentCompleted:true, analysisStatus:'Completed', latestReport:'Sent' },
    nctNumber:'NCT05987654', registryStatus:'Completed',
    documents:[
      { id:'d10', type:'IRB Letter', category:'Regulatory', title:'IRB Approval Letter', description:'Original IRB approval — archived', version:'1.0', date:'2023-12-15', irbNumber:'23-091', expiryDate:'2024-12-15', pageCount:3 },
      { id:'d11', type:'Protocol', category:'Protocol', title:'IRB Approved Protocol', description:'Final study protocol — v3 (final)', version:'3.0', date:'2023-12-01', amendment:'Amendment 2', pageCount:52, versions:[{version:'1.0',date:'2023-10-01',status:'Superseded',notes:'Initial'},{version:'2.0',date:'2023-11-15',status:'Superseded',notes:'Amendment 1'},{version:'3.0',date:'2023-12-01',status:'Final',notes:'Amendment 2 — final'}] },
      { id:'d12', type:'Consent', category:'Consent', title:'Participant Consent Form', description:'Final consent version used for all enrolled participants', version:'3.0', date:'2023-12-15', effectiveDate:'2024-01-01', expiryDate:'2024-12-31', language:'English', pageCount:11, versions:[{version:'1.0',date:'2023-10-01',status:'Superseded',irbApprovalDate:'2023-10-01'},{version:'2.0',date:'2023-11-20',status:'Superseded',irbApprovalDate:'2023-11-15'},{version:'3.0',date:'2023-12-15',status:'Final',irbApprovalDate:'2023-12-15'}] },
      { id:'d13', type:'Report', category:'Reports', title:'Final Study Report', description:'Comprehensive final study report', version:'1.0', date:'2025-01-15', pageCount:24 },
      { id:'d14', type:'Report', category:'Reports', title:'Q2 2024 Progress Report', description:'Mid-study progress and safety summary', version:'1.0', date:'2024-06-30', pageCount:10 }
    ],
    reportStats:{ progressReportsAvailable:2, latestReport:'Sent', participantDataAvailable:true },
    reports:[
      { name:'Final Study Report — Gut-Brain Axis', type:'Final Report', date:'2025-01-15', status:'Sent' },
      { name:'Q2 Progress Report', type:'Progress', date:'2024-06-30', status:'Sent' }
    ],
    team:[
      { name:'Dr. James Miller', role:'Principal Investigator' },
      { name:'Elena Rodriguez', role:'Study Lead' }
    ],
    milestones:[
      { label:'Protocol Submitted', date:'2023-11-01', status:'completed', notes:'' },
      { label:'IRB Approved', date:'2023-12-15', status:'completed', notes:'' },
      { label:'Recruiting Started', date:'2024-01-15', status:'completed', notes:'' },
      { label:'Enrollment Closed', date:'2024-06-30', status:'completed', notes:'Target met exactly' },
      { label:'Data Lock', date:'2024-10-01', status:'completed', notes:'' },
      { label:'Final Report', date:'2024-12-31', status:'completed', notes:'Submitted on schedule' }
    ],
    enrollmentHistory:[{month:'Jan',count:10},{month:'Feb',count:22},{month:'Mar',count:35},{month:'Apr',count:44},{month:'May',count:50}],
    completionData:[{visit:'Screening',completed:50,target:50},{visit:'Baseline',completed:50,target:50},{visit:'Month 3',completed:48,target:50},{visit:'Month 6',completed:47,target:50}],
    questionnaires:[
      { name:'Gut-Brain Symptom Index', avgBaseline:6.8, avgLatest:3.9, points:[{label:'Baseline',score:6.8},{label:'Mo 3',score:5.2},{label:'Mo 6',score:3.9}] },
      { name:'Cognitive Function Score', avgBaseline:72, avgLatest:81, points:[{label:'Baseline',score:72},{label:'Mo 3',score:76},{label:'Mo 6',score:81}] }
    ],
    samples:[{month:'Jan',sent:15,received:15},{month:'Feb',sent:28,received:28},{month:'Mar',sent:40,received:39},{month:'Apr',sent:50,received:49},{month:'May',sent:55,received:54}]
  }
];

export const MOCK_TEAM = [
  { id:'t1', name:'Dr. Patricia Lane', role:'Sponsor Lead', status:'Active', lastActive:'Today' },
  { id:'t2', name:'Kevin Marsh', role:'Regulatory Affairs', status:'Active', lastActive:'Yesterday' },
  { id:'t3', name:'Sandra Cho', role:'Data Monitor', status:'Pending Invitation', lastActive:'—' }
];

export const MOCK_REPORTS = [
  { id:'rep1', name:'Q1 2026 Progress Report — VITAL-Age', study:'MUSB-2024-012', type:'Progress', date:'2026-01-10' },
  { id:'rep2', name:'Interim Safety Report — Anti-Aging Study', study:'MUSB-2024-013', type:'Safety', date:'2026-02-20' },
  { id:'rep3', name:'Final Report — Gut-Brain Axis Study', study:'MUSB-2023-008', type:'Final', date:'2025-01-15' }
];

export const generateParticipants = (studyId: string) => {
  const arms = studyId === 'MUSB-2024-012' ? ['Intervention','Control'] : ['Intervention','Control','Placebo'];
  const statuses = ['Active','Active','Active','Active','Screening','Completed','Withdrawn'];
  const genders = ['Male','Female','Female','Male','Female','Male','Other'];
  return Array.from({ length: 65 }, (_, i) => ({
    id: `${studyId?.split('-')?.[1]?.substring(0,3) || 'UNK'}-${String(i+1).padStart(3,'0')}`,
    age: 35 + Math.floor(((i * 7) % 30)),
    gender: genders[i % genders.length],
    arm: arms[i % arms.length],
    status: statuses[i % statuses.length],
    visitsCompleted: (i % 5) + 1,
    totalVisits: 5,
    compliance: 50 + ((i * 13) % 50),
    lastVisit: `2026-0${(i%3)+1}-${String((i%28)+1).padStart(2,'0')}`,
    aeCount: i % 7 === 0 ? 1 : 0,
    enrollmentDate: `2025-${String((i%6)+10).padStart(2,'0')}-01`,
    site: `SITE-${String((i%3)+1).padStart(2,'0')}`,
    scores:[
      { name:'VITAL Symptom Score', baseline: 6+((i*3)%3), latest: 3+((i*4)%4), date:'2026-01-15' },
      { name:'Quality of Life Index', baseline: 45+((i*5)%20), latest: 55+((i*7)%20), date:'2026-01-15' }
    ],
    visits:[
      { name:'Screening', date:`2025-10-${String((i%28)+1).padStart(2,'0')}`, status:'Completed' },
      { name:'Baseline', date:`2025-11-${String((i%28)+1).padStart(2,'0')}`, status: i%5>0?'Completed':'Missed' },
      { name:'Week 4', date:`2025-12-${String((i%28)+1).padStart(2,'0')}`, status: i%5>1?'Completed':'Scheduled' },
      { name:'Week 8', date:`2026-01-${String((i%28)+1).padStart(2,'0')}`, status: i%5>2?'Completed':'Scheduled' },
      { name:'Week 12', date:`2026-02-${String((i%28)+1).padStart(2,'0')}`, status:'Scheduled' }
    ]
  }));
};

// === HELPERS ===
export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type:'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export const downloadFile = (content: string, filename: string, type='text/plain') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadPDF = async (reportData: any) => {
  const doc = new jsPDF();
  
  // Try to load logo (asynchronous process)
  const logoUrl = '/logo.jpg';
  try {
    const img = new Image();
    img.src = logoUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve; // Just proceed if it fails
    });
    if (img.complete && img.naturalWidth > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      doc.addImage(dataUrl, 'JPEG', 15, 10, 40, 40); // MusB Logo
    }
  } catch (e) {
     console.warn('Could not load logo for PDF');
  }

  // PDF Content styling
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30, 58, 138); // Dark Blue match branding
  doc.text('MusB RESEARCH STUDY REPORT', 60, 25);
  doc.setFontSize(14);
  doc.setTextColor(100, 116, 139); // Slate match branding
  doc.setFont('helvetica', 'normal');
  doc.text(`Protocol ID: ${reportData.study}`, 60, 35);
  doc.text(`Generated On: ${reportData.date}`, 60, 45);
  doc.setDrawColor(37, 99, 235);
  doc.line(15, 55, 195, 55);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(reportData.name, 15, 70);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('EXECUTIVE SUMMARY', 15, 85);
  doc.line(15, 88, 60, 88);

  doc.setTextColor(51, 65, 85);
  doc.text('This report provides a formal summary of the research progress and protocol compliance.', 15, 95);
  doc.text('Clinical data points have been synchronized with the central cloud repository.', 15, 102);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('KEY PROJECT METRICS:', 15, 115);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('- Enrollment Status: ON TRACK', 20, 122);
  doc.text('- Quality Control Index: 98.4%', 20, 129);
  doc.text('- Target Completion: Q4 2026', 20, 136);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('CONFIDENTIALITY NOTICE:', 15, 155);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('This document contains confidential information belonging to MusB Research Platform.', 15, 162);
  doc.text('Unauthorized access or disclosure is strictly prohibited under NDA protocols.', 15, 169);

  doc.save(`${reportData.name}.pdf`);
};

// === SHARED COMPONENTS ===
export const ToastContainer = ({ toasts, removeToast }: any) => (
  <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, display:'flex', flexDirection:'column', gap:8 }}>
    {toasts.map((t: any) => {
      let brd = '4px solid #cecece'; let icn = 'ℹ ';
      if (t.type==='success'){ brd='4px solid #10b981'; icn='✓ ' }
      if (t.type==='error'){ brd='4px solid #ef4444'; icn='✕ ' }
      if (t.type==='warning'){ brd='4px solid #f59e0b'; icn='⚠ ' }
      if (t.type==='info'){ brd='4px solid #2563eb'; icn='ℹ ' }
      return (
        <div key={t.id} style={{
          background:'#1e293b', borderRadius:10, padding:'12px 16px', display:'flex', gap:10, minWidth:280, maxWidth:360,
          borderLeft: brd
        }}>
          <div style={{ flex:1, color:'#f1f5f9', fontSize:16 }}>
            {icn} {t.message}
          </div>
          <button onClick={() => removeToast(t.id)} style={{ background:'none', border:'none', color:'#94a3b8', cursor:'pointer' }}>×</button>
        </div>
      );
    })}
  </div>
);

export const Modal = ({ open, onClose, title, subtitle, children, width='680px' }: any) => {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if(open) window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onClose]);
  
  if (!open) return null;
  return (
    <div 
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} 
      onClick={onClose}
    >
      <div 
        style={{ background:'#1e293b', borderRadius:16, border:'1px solid #334155', maxHeight:'90vh', display:'flex', flexDirection:'column', width, maxWidth:'95vw' }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding:'32px 40px', borderBottom:'1px solid #334155', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h3 style={{ margin:0, fontSize:38, fontWeight:900, color:'#f1f5f9', letterSpacing: '-0.04em', lineHeight: 1.1 }}>{title}</h3>
            {subtitle && <p style={{ margin:'12px 0 0 0', fontSize:22, color:'#94a3b8', fontWeight: 600 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:32 }}>×</button>
        </div>
        <div style={{ padding:24, overflowY:'auto', flex:1 }}>{children}</div>
      </div>
    </div>
  );
};

export const ConfirmModal = ({ confirmModal, setConfirmModal }: any) => {
  if (!confirmModal) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 20 }}>
      <div style={{ background: '#1e293b', width: '100%', maxWidth: 440, borderRadius: 24, padding: 32, border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 28, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.02em' }}>{confirmModal.title}</h3>
        <p style={{ margin: '0 0 32px 0', color: '#94a3b8', lineHeight: 1.6, fontSize: 19, fontWeight: 500 }}>{confirmModal.message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {confirmModal.buttons ? (
            <>
              {confirmModal.buttons.map((btn: any, i: number) => (
                <button 
                  key={i} 
                  onClick={() => { btn.onClick(); setConfirmModal(null); }} 
                  style={{ background: btn.color || 'transparent', border: btn.color ? 'none' : '1px solid #334155', color: btn.color ? 'white' : '#94a3b8', padding: '12px 24px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 18, transition: 'all 0.2s' }}
                >
                  {btn.label}
                </button>
              ))}
              <button onClick={() => setConfirmModal(null)} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '12px 24px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 18 }}>Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => setConfirmModal(null)} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '12px 24px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 18 }}>Cancel</button>
              <button 
                onClick={() => { confirmModal.onConfirm?.(); setConfirmModal(null); }} 
                style={{ background: confirmModal.confirmColor || '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 18, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
              >
                {confirmModal.confirmLabel || 'Confirm'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const statusColors: Record<string, {bg:string, color:string}> = {
  Recruiting: { bg:'rgba(16,185,129,0.15)', color:'#10b981' },
  Active: { bg:'rgba(37,99,235,0.15)', color:'#60a5fa' },
  Completed: { bg:'rgba(100,116,139,0.15)', color:'#94a3b8' },
  'Under Review': { bg:'rgba(99,102,241,0.15)', color:'#818cf8' },
  'Attention Needed': { bg:'rgba(239,68,68,0.15)', color:'#ef4444' },
  'On Hold': { bg:'rgba(245,158,11,0.15)', color:'#f59e0b' },
  Cancelled: { bg:'rgba(239,68,68,0.15)', color:'#ef4444' },
  Approved: { bg:'rgba(16,185,129,0.15)', color:'#10b981' },
  Pending: { bg:'rgba(245,158,11,0.15)', color:'#f59e0b' },
  Sent: { bg:'rgba(99,102,241,0.15)', color:'#818cf8' },
  Draft: { bg:'rgba(245,158,11,0.15)', color:'#f59e0b' },
  Ready: { bg:'rgba(16,185,129,0.15)', color:'#10b981' },
};

export const StatusBadge = ({ status }: { status: string }) => {
  const s = statusColors[status] || { bg:'rgba(100,116,139,0.15)', color:'#94a3b8' };
  return (
    <span style={{ background:s.bg, color:s.color, padding:'6px 14px', borderRadius:999, fontSize:16, fontWeight:800, whiteSpace:'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {status}
    </span>
  );
};

export const ProgressRing = ({ pct, width=40, stroke=4 }: any) => {
  const r = (20 - stroke/2);
  const circ = 2 * Math.PI * r;
  const fill = isNaN(pct) ? 0 : pct;
  const dash = (fill / 100) * circ;
  const color = fill >= 80 ? '#10b981' : fill >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={width} height={width} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r={r} fill="none" stroke="#334155" strokeWidth={stroke} />
      <circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth={stroke} 
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" 
              transform="rotate(-90 20 20)" style={{ transition:'stroke-dasharray 0.5s' }} />
      <text x="20" y="24" fill="#f1f5f9" fontSize="13" fontWeight={700} textAnchor="middle">{Math.round(fill)}%</text>
    </svg>
  );
};

export const PillButton = ({ active, children, onClick }: any) => (
  <button onClick={onClick} style={{ 
    background: active ? '#2563eb' : 'transparent', color: active ? '#fff' : '#94a3b8',
    border: active ? '1px solid #2563eb' : '1px solid #334155',
    borderRadius: 999, padding: '10px 24px', fontSize: 17, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.02em'
  }}>{children}</button>
);

export const LineChart = ({ data, target=null }: any) => {
  if(!data || !data.length) return <div/>;
  const max = Math.max(...data.map((d:any)=>d.count), target||0) || 1;
  const pts = data.map((d:any,i:number) => `${40 + i*(400/(data.length-1||1))},${125 - (d.count/max)*105}`).join(' ');
  return (
    <svg width="100%" height="100%" viewBox="0 0 460 160">
      <rect x="0" y="0" width="460" height="160" fill="#0f172a" rx="8" />
      <line x1="40" y1="125" x2="440" y2="125" stroke="#334155" strokeWidth="1" />
      {target && <line x1="40" y1={125 - (target/max)*105} x2="440" y2={125 - (target/max)*105} stroke="#64748b" strokeWidth="1" strokeDasharray="4" />}
      {target && <text x="445" y={125 - (target/max)*105 + 4} fill="#64748b" fontSize="10">Target</text>}
      <polyline points={pts} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d:any,i:number) => (
        <g key={i}>
          <text x={40 + i*(400/(data.length-1||1))} y="145" fill="#64748b" fontSize="10" textAnchor="middle">{d.month||d.label}</text>
          <circle cx={40 + i*(400/(data.length-1||1))} cy={125 - (d.count/max)*105} r="4" fill="#0f172a" stroke="#2563eb" strokeWidth="2" />
        </g>
      ))}
    </svg>
  );
};

export const GroupedBarChart = ({ data }: any) => {
  if(!data || !data.length) return <div/>;
  const max = Math.max(...data.flatMap((d:any)=>[d.completed, d.target])) || 1;
  const w = 400 / data.length;
  return (
    <svg width="100%" height="100%" viewBox="0 0 460 160">
      <rect x="0" y="0" width="460" height="160" fill="#0f172a" rx="8" />
      <line x1="40" y1="125" x2="440" y2="125" stroke="#334155" strokeWidth="1" />
      {data.map((d:any,i:number) => {
        const x = 40 + i*w + w/2;
        const hr = (d.completed/max)*105;
        const ht = (d.target/max)*105;
        return (
          <g key={i}>
            <text x={x} y="145" fill="#64748b" fontSize="10" textAnchor="middle">{d.visit||d.label}</text>
            <rect x={x-12} y={125-ht} width="10" height={ht} fill="#334155" rx="2" />
            <rect x={x} y={125-hr} width="10" height={hr} fill="#10b981" rx="2" />
            <text x={x-7} y={125-ht-3} fill="#94a3b8" fontSize="8" textAnchor="middle">{d.target}</text>
            <text x={x+5} y={125-hr-3} fill="#f1f5f9" fontSize="8" textAnchor="middle">{d.completed}</text>
          </g>
        )
      })}
      <rect x="40" y="10" width="8" height="8" fill="#10b981" rx="2" /><text x="52" y="17" fill="#f1f5f9" fontSize="10">Completed</text>
      <rect x="110" y="10" width="8" height="8" fill="#334155" rx="2" /><text x="122" y="17" fill="#64748b" fontSize="10">Target</text>
    </svg>
  );
};
