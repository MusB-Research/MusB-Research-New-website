import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

// === CONSTANTS ===
const COLORS = {
  blue: '#3b82f6',
  indigo: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  gray: '#94a3b8',
  border: 'rgba(255, 255, 255, 0.05)',
  dark: '#f1f5f9',
  body: '#94a3b8',
  label: '#64748b',
  bg: 'transparent'
};

// === MOCK DATA ===
const MOCK_STUDIES = [
  {
    id: 'MUSB-2024-012',
    title: 'VITAL-Age Study',
    sponsorName: 'VitaNova Therapeutics',
    indication: 'Healthy Aging',
    designType: 'Randomized Controlled Trial',
    studyType: 'In-Person',
    status: 'Recruiting',
    irbStatus: 'Approved',
    startDate: '2025-09-01',
    endDate: '2026-09-01',
    launchDate: '2025-10-01',
    sites: ['Miller Clinic — Tampa', 'MusB Research Center'],
    coordinators: ['CC-01', 'CC-02'],
    pis: ['Dr. James Miller'],
    kpis: { enrolled: 65, targetEnrolled: 100, completed: 8, targetCompleted: 90, recruitmentCompleted: false, analysisStatus: 'Not Started', latestReport: 'Draft' },
    enrollmentHistory: [ {month:'Oct 25',count:8}, {month:'Nov 25',count:22}, {month:'Dec 25',count:35}, {month:'Jan 26',count:48}, {month:'Feb 26',count:59}, {month:'Mar 26',count:65} ],
    completionData: [ {visit:'Screening',completed:73,target:75}, {visit:'Baseline',completed:70,target:73}, {visit:'Week 4',completed:65,target:70}, {visit:'Week 8',completed:58,target:65}, {visit:'Week 12',completed:42,target:58} ],
    questionnaires: [ { name:'VITAL Symptom Score', points:[ {label:'Baseline',score:7.2}, {label:'Wk 4',score:6.1}, {label:'Wk 8',score:5.3}, {label:'Wk 12',score:4.8} ] }, { name:'Quality of Life Index', points:[ {label:'Baseline',score:52}, {label:'Wk 4',score:57}, {label:'Wk 8',score:63}, {label:'Wk 12',score:68} ] } ],
    samples: [ {month:'Oct',sent:20,received:18}, {month:'Nov',sent:35,received:30}, {month:'Dec',sent:48,received:45}, {month:'Jan',sent:60,received:58}, {month:'Feb',sent:70,received:68}, {month:'Mar',sent:78,received:75} ],
    documents: [ {name:'Protocol_v2.pdf',type:'Protocol',date:'2025-08-15'}, {name:'IRB_Approval.pdf',type:'IRB',date:'2025-09-01'}, {name:'Q1_Progress_Report.pdf',type:'Report',date:'2026-01-10'} ],
    team: [ {name:'Dr. James Miller',role:'Principal Investigator'}, {name:'CC-01',role:'Lead Coordinator'}, {name:'CC-02',role:'Clinical Coordinator'} ],
    milestones: [ {label:'Protocol Submitted',date:'2025-07-01',status:'completed',notes:'Version 2 submitted'}, {label:'IRB Approved',date:'2025-09-01',status:'completed',notes:'Full board approval'}, {label:'Site Activation',date:'2025-09-20',status:'completed',notes:'Both sites activated'}, {label:'Recruiting Started',date:'2025-10-01',status:'completed',notes:'First participant enrolled Oct 8'}, {label:'Enrollment Closed',date:'2026-05-01',status:'pending',notes:'Target: 100 participants'}, {label:'Data Lock',date:'2026-07-01',status:'pending',notes:''}, {label:'Final Report',date:'2026-09-01',status:'pending',notes:''} ],
    reports: [ {name:'Q1 2026 Progress Report',type:'Progress',date:'2026-01-10',status:'Sent'} ]
  },
  {
    id: 'MUSB-2024-013',
    title: 'Anti-Aging Microbiome Study',
    sponsorName: 'VitaNova Therapeutics',
    indication: 'Gut Health & Aging',
    designType: 'Double-Blind RCT',
    studyType: 'Virtual',
    status: 'Active',
    irbStatus: 'Approved',
    startDate: '2025-11-01',
    endDate: '2026-11-01',
    launchDate: '2025-11-15',
    sites: ['MusB Research Center — Remote'],
    coordinators: ['CC-03'],
    pis: ['Dr. Elena Cruz'],
    kpis: { enrolled: 40, targetEnrolled: 80, completed: 3, targetCompleted: 70, recruitmentCompleted: false, analysisStatus: 'Not Started', latestReport: 'Pending' },
    enrollmentHistory: [ {month:'Nov 25',count:5}, {month:'Dec 25',count:14}, {month:'Jan 26',count:25}, {month:'Feb 26',count:33}, {month:'Mar 26',count:40} ],
    completionData: [ {visit:'Screening',completed:44,target:45}, {visit:'Baseline',completed:42,target:44}, {visit:'Week 6',completed:38,target:42}, {visit:'Week 12',completed:28,target:38} ],
    questionnaires: [ { name:'Microbiome Wellness Score', points:[ {label:'Baseline',score:5.5}, {label:'Wk 6',score:6.2}, {label:'Wk 12',score:7.1} ] } ],
    samples: [ {month:'Nov',sent:12,received:10}, {month:'Dec',sent:25,received:22}, {month:'Jan',sent:38,received:35}, {month:'Feb',sent:48,received:44}, {month:'Mar',sent:55,received:50} ],
    documents: [ {name:'Protocol_v1.pdf',type:'Protocol',date:'2025-10-15'}, {name:'IRB_Approval.pdf',type:'IRB',date:'2025-10-28'} ],
    team: [ {name:'Dr. Elena Cruz',role:'Principal Investigator'}, {name:'CC-03',role:'Clinical Coordinator'} ],
    milestones: [ {label:'Protocol Submitted',date:'2025-09-15',status:'completed',notes:''}, {label:'IRB Approved',date:'2025-10-28',status:'completed',notes:'Expedited review'}, {label:'Site Activation',date:'2025-11-10',status:'completed',notes:'Virtual site setup'}, {label:'Recruiting Started',date:'2025-11-15',status:'completed',notes:''}, {label:'Enrollment Closed',date:'2026-06-01',status:'pending',notes:'Target: 80 participants'}, {label:'Data Lock',date:'2026-09-01',status:'pending',notes:''}, {label:'Final Report',date:'2026-11-01',status:'pending',notes:''} ],
    reports: []
  },
  {
    id: 'MUSB-2023-008',
    title: 'Gut-Brain Axis Pilot Study',
    sponsorName: 'VitaNova Therapeutics',
    indication: 'Neurology & Gut Health',
    designType: 'Observational Cohort',
    studyType: 'Hybrid',
    status: 'Completed',
    irbStatus: 'Approved',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    launchDate: '2024-01-15',
    sites: ['Miller Clinic — Tampa'],
    coordinators: ['CC-01'],
    pis: ['Dr. James Miller'],
    kpis: { enrolled: 50, targetEnrolled: 50, completed: 47, targetCompleted: 45, recruitmentCompleted: true, analysisStatus: 'Completed', latestReport: 'Sent' },
    enrollmentHistory: [ {month:'Jan 24',count:10}, {month:'Feb 24',count:22}, {month:'Mar 24',count:35}, {month:'Apr 24',count:44}, {month:'May 24',count:50} ],
    completionData: [ {visit:'Screening',completed:50,target:50}, {visit:'Baseline',completed:50,target:50}, {visit:'Month 3',completed:48,target:50}, {visit:'Month 6',completed:47,target:50} ],
    questionnaires: [ { name:'Gut-Brain Symptom Index', points:[ {label:'Baseline',score:6.8}, {label:'Mo 3',score:5.2}, {label:'Mo 6',score:3.9} ] }, { name:'Cognitive Function Score', points:[ {label:'Baseline',score:72}, {label:'Mo 3',score:76}, {label:'Mo 6',score:81} ] } ],
    samples: [ {month:'Jan',sent:15,received:15}, {month:'Feb',sent:28,received:28}, {month:'Mar',sent:40,received:39}, {month:'Apr',sent:50,received:49}, {month:'May',sent:55,received:54} ],
    documents: [ {name:'Final_Report.pdf',type:'Final Report',date:'2025-01-15'}, {name:'Protocol_v3.pdf',type:'Protocol',date:'2023-12-01'}, {name:'IRB_Approval.pdf',type:'IRB',date:'2023-12-15'} ],
    team: [ {name:'Dr. James Miller',role:'Principal Investigator'}, {name:'CC-01',role:'Clinical Coordinator'} ],
    milestones: [ {label:'Protocol Submitted',date:'2023-11-01',status:'completed',notes:''}, {label:'IRB Approved',date:'2023-12-15',status:'completed',notes:''}, {label:'Site Activation',date:'2024-01-10',status:'completed',notes:''}, {label:'Recruiting Started',date:'2024-01-15',status:'completed',notes:''}, {label:'Enrollment Closed',date:'2024-05-31',status:'completed',notes:'Target met exactly'}, {label:'Data Lock',date:'2024-10-01',status:'completed',notes:''}, {label:'Final Report',date:'2024-12-31',status:'completed',notes:'Submitted on schedule'} ],
    reports: [ {name:'Final Study Report — Gut-Brain Axis',type:'Final Report',date:'2025-01-15',status:'Sent'}, {name:'Q2 Progress Report',type:'Progress',date:'2024-06-30',status:'Sent'} ]
  }
];

// === HELPERS ===
const exportToCSV = (headers: string[], data: any[][], filename: string) => {
  const csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n"
    + data.map(row => row.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// === SUB-COMPONENTS ===
const ProgressRing = ({ percent, color, size = 40 }: { percent: number, color: string, size?: number }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="20" cy="20" r={radius} stroke="#e2e8f0" strokeWidth="4" fill="transparent" />
      <circle 
        cx="20" cy="20" r={radius} stroke={color} strokeWidth="4" fill="transparent"
        strokeDasharray={circumference}
        style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text 
        x="50%" y="50%" textAnchor="middle" dy=".3em" fontSize="13" fontWeight="900" 
        style={{ transform: 'rotate(90deg) translate(0px, -2px)', fill: COLORS.dark }}
      >
        {percent}%
      </text>
    </svg>
  );
};

const Toast = ({ message, type, onDismiss }: { message: string, type: string, onDismiss: () => void }) => {
  const color = COLORS[type as keyof typeof COLORS] || COLORS.indigo;
  return (
    <div style={{
      width: '320px', background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(16px)', borderRadius: '12px', borderLeft: `6px solid ${color}`,
      boxShadow: '0 10px 25px rgba(0,0,0,0.3)', padding: '16px', display: 'flex', alignItems: 'center',
      gap: '12px', position: 'relative', overflow: 'hidden', animation: 'slideIn 0.3s ease-out', border: COLORS.border
    }}>
      <div style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: 'white' }}>{message}</div>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: COLORS.gray, cursor: 'pointer', fontSize: '18px' }}>×</button>
      <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', background: color, animation: 'shrink 3s linear forwards' }} />
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes shrink { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children, width = '600px' }: any) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div style={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width, maxWidth: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 32px', borderBottom: `1px solid rgba(255,255,255,0.05)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: 'white' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', color: COLORS.gray, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>{children}</div>
      </div>
    </div>
  );
};

// === MAIN COMPONENT ===
const SponsorOurStudies = () => {
  const [studies, setStudies] = useState(MOCK_STUDIES);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState('Latest First');
  const [viewMode, setViewMode] = useState('cards');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set(['MUSB-2024-012']));
  const [cardChartTabs, setCardChartTabs] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<any[]>([]);

  const getCardTab = (id: string) => cardChartTabs[id] || 'Enrollment';
  const setCardTab = (id: string, tab: string) => setCardChartTabs(prev => ({ ...prev, [id]: tab }));
  
  // Modals
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean, study: any }>({ isOpen: false, study: null });
  const [reportsModal, setReportsModal] = useState<{ isOpen: boolean, study: any }>({ isOpen: false, study: null });
  const [inquiryModal, setInquiryModal] = useState(false);
  const [composeModal, setComposeModal] = useState<{ isOpen: boolean, study: any }>({ isOpen: false, study: null });

  const showToast = useCallback((message: string, type: string = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((expand: boolean) => {
    if (expand) setExpandedCards(new Set(studies.map(s => s.id)));
    else setExpandedCards(new Set());
  }, [studies]);

  const filteredAndSortedStudies = useMemo(() => {
    let result = studies.filter(s => {
      const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
      const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });

    switch (sortMode) {
      case 'A–Z': result.sort((a,b) => a.title.localeCompare(b.title)); break;
      case 'Enrollment %': result.sort((a,b) => (b.kpis.enrolled/b.kpis.targetEnrolled) - (a.kpis.enrolled/a.kpis.targetEnrolled)); break;
      case 'By Status': result.sort((a,b) => a.status.localeCompare(b.status)); break;
      case 'Oldest First': result.sort((a,b) => a.startDate.localeCompare(b.startDate)); break;
      default: result.sort((a,b) => b.startDate.localeCompare(a.startDate)); // Latest First
    }
    return result;
  }, [studies, filterStatus, searchQuery, sortMode]);

  // --- RENDER HELPERS ---
  
  const renderChart = (study: any) => {
    const activeTab = getCardTab(study.id);
    const height = 240;
    const padding = { t: 20, r: 20, b: 40, l: 40 };
    const w = 600;
    const chartW = w - padding.l - padding.r;
    const chartH = height - padding.t - padding.b;

    if (activeTab === 'Enrollment') {
      const data = study.enrollmentHistory;
      const maxVal = Math.max(...data.map((d: any) => d.count), study.kpis.targetEnrolled);
      const points = data.map((d: any, i: number) => ({
        x: padding.l + (i * chartW / (data.length - 1)),
        y: padding.t + chartH - (d.count / maxVal * chartH)
      }));
      const path = `M ${points.map((p: {x: number, y: number}) => `${p.x},${p.y}`).join(' L ')}`;
      const areaPath = `${path} L ${points[points.length-1].x},${padding.t + chartH} L ${padding.l},${padding.t + chartH} Z`;
      const targetY = padding.t + chartH - (study.kpis.targetEnrolled / maxVal * chartH);

      return (
        <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height: 'auto' }}>
          <path d={areaPath} fill={`${COLORS.blue}20`} />
          <path d={path} fill="none" stroke={COLORS.blue} strokeWidth="3" strokeLinecap="round" />
          <line x1={padding.l} y1={targetY} x2={w - padding.r} y2={targetY} stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />
          {points.map((p: {x: number, y: number}, i: number) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="#0f172a" stroke={COLORS.blue} strokeWidth="2" />)}
          <line x1={padding.l} y1={padding.t + chartH} x2={w - padding.r} y2={padding.t + chartH} stroke="rgba(255,255,255,0.1)" />
          <line x1={padding.l} y1={padding.t} x2={padding.l} y2={padding.t + chartH} stroke="rgba(255,255,255,0.1)" />
          <text x={w-padding.r} y={targetY-5} textAnchor="end" fontSize="13" fill="rgba(255,255,255,0.4)" fontWeight="600">TARGET: {study.kpis.targetEnrolled}</text>
        </svg>
      );
    }
    
    if (activeTab === 'Completion') {
      const data = study.completionData;
      const maxVal = 100;
      const barW = Math.min(chartW / data.length / 2, 30);
      return (
        <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height: 'auto' }}>
          {data.map((d: any, i: number) => {
            const x = padding.l + (i * chartW / data.length) + (chartW / data.length / 4);
            const compH = (d.completed / d.target * 100) / maxVal * chartH;
            return (
              <g key={i}>
                <rect x={x} y={padding.t + chartH - chartH} width={barW} height={chartH} fill="rgba(255,255,255,0.03)" rx="4" />
                <rect x={x} y={padding.t + chartH - compH} width={barW} height={compH} fill={COLORS.success} rx="4" />
                <text x={x + barW / 2} y={padding.t + chartH + 15} textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.3)">{d.visit}</text>
              </g>
            );
          })}
          <line x1={padding.l} y1={padding.t + chartH} x2={w - padding.r} y2={padding.t + chartH} stroke="rgba(255,255,255,0.1)" />
        </svg>
      );
    }

    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.gray }}>Data analysis in progress...</div>;
  };

  const renderStudyCard = (s: any) => {
    const isExpanded = expandedCards.has(s.id);
    const enrollPercent = Math.round((s.kpis.enrolled / s.kpis.targetEnrolled) * 100);
    
    return (
      <div key={s.id} style={{ 
        background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(16px)', borderRadius: '24px', marginBottom: '24px', overflow: 'hidden',
        boxShadow: isExpanded ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.2)',
        border: isExpanded ? `1px solid rgba(59, 130, 246, 0.2)` : '1px solid rgba(255,255,255,0.05)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Header */}
        <div 
          onClick={() => toggleExpand(s.id)}
          style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>{s.title}</div>
              <div style={{ fontSize: '14px', fontFamily: 'monospace', color: COLORS.blue, opacity: 0.8 }}>{s.id}</div>
            </div>
            <div style={{ padding: '4px 12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '99px', fontSize: '12px', fontWeight: 900, color: COLORS.blue, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.indication}</div>
          </div>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ 
              padding: '6px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
              background: s.status === 'Recruiting' ? 'rgba(16,185,129,0.1)' : 'rgba(37,99,235,0.1)',
              color: s.status === 'Recruiting' ? COLORS.success : COLORS.blue
            }}>{s.status}</div>
            <div style={{ fontSize: '20px', color: COLORS.gray, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}>▼</div>
          </div>
        </div>

        {!isExpanded && (
          <div style={{ height: '4px', background: COLORS.border, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: COLORS.blue, width: `${enrollPercent}%` }} />
          </div>
        )}

        {isExpanded && (
          <div style={{ padding: '0 24px 24px' }}>
            {/* KPI Strip */}
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '20px 0', borderTop: `1px solid ${COLORS.border}` }}>
              {[
                { label: 'Enrolled', value: `${s.kpis.enrolled} / ${s.kpis.targetEnrolled}`, color: COLORS.blue },
                { label: 'Enrollment %', value: `${enrollPercent}%`, ring: enrollPercent, color: enrollPercent > 80 ? COLORS.success : COLORS.warning },
                { label: 'Completed', value: s.kpis.completed, color: COLORS.success },
                { label: 'Analysis', value: s.kpis.analysisStatus, color: COLORS.indigo }
              ].map(k => (
                <div key={k.label} style={{ minWidth: '160px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: `1px solid rgba(255,255,255,0.05)` }}>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: COLORS.gray, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.1em' }}>{k.label}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: 'white' }}>{k.value}</div>
                    {k.ring !== undefined && <ProgressRing percent={k.ring} color={k.color} size={40} />}
                  </div>
                </div>
              ))}
            </div>

            {/* Basic Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', padding: '20px 0', borderTop: `1px solid ${COLORS.border}` }}>
              {[
                { label: 'Sponsor Name', val: s.sponsorName },
                { label: 'Indication', val: s.indication },
                { label: 'Design Type', val: s.designType },
                { label: 'Start Date', val: s.startDate },
                { label: 'PI', val: s.pis[0] },
                { label: 'Sites', val: s.sites.length + ' Active Sites' }
              ].map(i => (
                <div key={i.label}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: COLORS.gray, textTransform: 'uppercase' }}>{i.label}</div>
                  <div style={{ fontSize: '16px', fontWeight: 500, color: COLORS.dark }}>{i.val}</div>
                </div>
              ))}
            </div>

            {/* Visual Insights */}
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${COLORS.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.gray, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Visual Insights — {getCardTab(s.id).toUpperCase()}</div>
                <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Enrollment', 'Completion', 'Samples'].map(t => (
                    <button 
                      key={t}
                      onClick={(e) => { e.stopPropagation(); setCardTab(s.id, t); }}
                      style={{ 
                        padding: '8px 16px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s',
                        background: getCardTab(s.id) === t ? COLORS.blue : 'none',
                        color: getCardTab(s.id) === t ? 'white' : COLORS.gray,
                        textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ height: '240px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: `1px solid rgba(255,255,255,0.05)`, padding: '24px' }}>
                {renderChart(s)}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${COLORS.border}` }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setDetailModal({ isOpen: true, study: s })}
                  style={{ padding: '12px 24px', background: COLORS.blue, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }}
                >
                  View Detailed Study
                </button>
                <button 
                  onClick={() => setReportsModal({ isOpen: true, study: s })}
                  style={{ padding: '12px 24px', background: 'none', color: COLORS.blue, border: `1px solid ${COLORS.blue}`, borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }}
                >
                  View Reports
                </button>
              </div>
              <button 
                onClick={() => setComposeModal({ isOpen: true, study: s })}
                style={{ padding: '12px 24px', background: 'none', color: COLORS.gray, border: `1px solid ${COLORS.border}`, borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }}
              >
                Message Study Team
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', paddingBottom: '100px', color: COLORS.body, fontFamily: 'sans-serif' }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, background: 'rgba(5, 9, 18, 0.8)', backdropFilter: 'blur(24px)', borderBottom: `1px solid rgba(255,255,255,0.05)`, zIndex: 100, padding: '20px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>Research Portfolio</h1>
            <button 
              onClick={() => setInquiryModal(true)}
              style={{ padding: '12px 28px', background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.indigo})`, color: 'white', border: 'none', borderRadius: '14px', fontWeight: 900, cursor: 'pointer', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: `0 8px 20px ${COLORS.blue}40` }}
            >
              + New Study Inquiry
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <input 
              style={{ flex: 1, padding: '12px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.1)`, outline: 'none', color: 'white', fontSize: '14px' }}
              placeholder="Search by study name or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <select 
              style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.1)`, outline: 'none', color: 'white' }}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="All" style={{ background: '#0f172a' }}>All Status</option>
              <option value="Active" style={{ background: '#0f172a' }}>Active</option>
              <option value="Recruiting" style={{ background: '#0f172a' }}>Recruiting</option>
              <option value="Completed" style={{ background: '#0f172a' }}>Completed</option>
            </select>
            <div style={{ display: 'flex', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.03)' }}>
              <button 
                onClick={() => setViewMode('cards')}
                style={{ padding: '12px 20px', background: viewMode === 'cards' ? 'rgba(255,255,255,0.1)' : 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: '14px', fontWeight: 800, textTransform: 'uppercase' }}
              >
                Cards
              </button>
              <button 
                onClick={() => setViewMode('list')}
                style={{ padding: '12px 20px', background: viewMode === 'list' ? 'rgba(255,255,255,0.1)' : 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: '14px', fontWeight: 800, textTransform: 'uppercase' }}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1280px', margin: '32px auto', padding: '0 24px' }}>
        {/* Summary Bar */}
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: COLORS.gray }}>
            Showing {filteredAndSortedStudies.length} of {studies.length} studies
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => toggleAll(true)} style={{ background: 'none', border: 'none', color: COLORS.blue, fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>Expand All</button>
            <button onClick={() => toggleAll(false)} style={{ background: 'none', border: 'none', color: COLORS.gray, fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>Collapse All</button>
          </div>
        </div>

        {/* Results */}
        {filteredAndSortedStudies.length > 0 ? (
          viewMode === 'cards' ? (
            filteredAndSortedStudies.map(s => renderStudyCard(s))
          ) : (
            <div style={{ background: 'white', borderRadius: '16px', border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
                  <tr>
                    {['Study', 'ID', 'Status', 'Enrolled'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: COLORS.gray }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedStudies.map(s => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${COLORS.border}`, cursor: 'pointer' }} onClick={() => setDetailModal({ isOpen: true, study: s })}>
                      <td style={{ padding: '16px', fontWeight: 700, color: COLORS.dark, fontSize: '15px' }}>{s.title}</td>
                      <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '14px' }}>{s.id}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: s.status === 'Recruiting' ? COLORS.success : COLORS.blue }}>{s.status}</span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '15px' }}>{s.kpis.enrolled} / {s.kpis.targetEnrolled}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📁</div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: COLORS.dark }}>No studies found</h2>
            <p style={{ color: COLORS.gray }}>Try adjusting your search or filters to find what you're looking for.</p>
            <button onClick={() => { setSearchQuery(''); setFilterStatus('All'); }} style={{ marginTop: '20px', padding: '10px 20px', background: 'none', border: `1px solid ${COLORS.blue}`, color: COLORS.blue, borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Clear All Filters</button>
          </div>
        )}
      </div>

      {/* Modals & Toasts */}
      <Modal 
        isOpen={detailModal.isOpen} onClose={() => setDetailModal({ isOpen: false, study: null })} 
        title={detailModal.study?.title || 'Study Details'} width="800px"
      >
        {detailModal.study && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            {[
              { label: 'Protocol ID', value: detailModal.study.id },
              { label: 'Indication', value: detailModal.study.indication },
              { label: 'PI', value: detailModal.study.pis[0] },
              { label: 'Status', value: detailModal.study.status },
              { label: 'Start Date', value: detailModal.study.startDate },
              { label: 'End Date', value: detailModal.study.endDate }
            ].map(i => (
              <div key={i.label}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.gray, textTransform: 'uppercase', marginBottom: '4px' }}>{i.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 500, color: COLORS.dark }}>{i.value}</div>
              </div>
            ))}
            <div style={{ gridColumn: 'span 2', marginTop: '20px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 800, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '8px' }}>Study Timeline</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                {detailModal.study.milestones.map((m: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: m.status === 'completed' ? COLORS.success : '#e2e8f0', marginTop: '5px' }} />
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 700 }}>{m.label}</div>
                      <div style={{ fontSize: '14px', color: COLORS.gray }}>{m.date} {m.notes && `- ${m.notes}`}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal 
        isOpen={reportsModal.isOpen} onClose={() => setReportsModal({ isOpen: false, study: null })} 
        title={`Reports: ${reportsModal.study?.title}`}
      >
        {reportsModal.study?.reports.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reportsModal.study.reports.map((r: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: `1px solid ${COLORS.border}`, borderRadius: '12px' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{r.name}</div>
                  <div style={{ fontSize: '12px', color: COLORS.gray }}>{r.date} • {r.type}</div>
                </div>
                <button 
                  onClick={() => showToast(`Initiating download for ${r.name}...`)}
                  style={{ padding: '8px 16px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: COLORS.gray }}>No reports available for this study yet.</div>
        )}
      </Modal>

      <Modal isOpen={composeModal.isOpen} onClose={() => setComposeModal({ isOpen: false, study: null })} title="Message Study Team">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '14px', padding: '12px 16px', background: '#f1f5f9', borderRadius: '8px', fontWeight: 600 }}>
            TO: Investigation Team — {composeModal.study?.title}
          </div>
          <textarea 
            placeholder="Type your message to the clinical coordinators and investigators..."
            style={{ width: '100%', height: '150px', padding: '16px', borderRadius: '10px', border: `1px solid ${COLORS.border}`, outline: 'none', resize: 'none' }}
          />
          <button 
            onClick={() => { showToast('Message successfully transmitted to research team'); setComposeModal({ isOpen: false, study: null }); }}
            style={{ padding: '12px', background: COLORS.blue, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
          >
            Transmit Secure Message
          </button>
        </div>
      </Modal>

      <Modal isOpen={inquiryModal} onClose={() => setInquiryModal(false)} title="New Study Inquiry">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ margin: 0, fontSize: '16px', color: COLORS.gray }}>Provide initial research parameters to begin the protocol review process with our scientific board.</p>
          <div>
            <label style={{ fontSize: '14px', fontWeight: 700, color: COLORS.gray, display: 'block', marginBottom: '8px' }}>Proposed Study Title</label>
            <input style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${COLORS.border}`, outline: 'none' }} placeholder="Enter therapeutic name or research ID..." />
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: 700, color: COLORS.gray, display: 'block', marginBottom: '8px' }}>Research Area</label>
            <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${COLORS.border}`, outline: 'none', fontSize: '15px' }}>
              <option>Aging & Longevity</option>
              <option>Microbiome</option>
              <option>Neurology</option>
              <option>Healthy Aging</option>
            </select>
          </div>
          <button 
            onClick={() => { showToast('Inquiry ID: INQ-1042 successfully queued for review'); setInquiryModal(false); }}
            style={{ padding: '12px', background: COLORS.blue, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', marginTop: '10px' }}
          >
            Submit Research Inquiry
          </button>
        </div>
      </Modal>

      <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />)}
      </div>
    </div>
  );
};

export default SponsorOurStudies;
