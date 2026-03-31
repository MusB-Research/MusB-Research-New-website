import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getUser, getRole, authFetch, API, performLogout, getDisplayName } from '../../utils/auth';
import { Link } from 'react-router-dom';
import { User, LogOut, Zap, Bell, Sparkles } from 'lucide-react';
import { SPONSOR, MOCK_TEAM, MOCK_REPORTS, MOCK_PROTOCOLS, StatusBadge, Modal, ConfirmModal, PillButton, ProgressRing, downloadCSV, downloadFile, downloadPDF } from './SponsorDashboardShared';

// Pure SVG Bar Chart
const SVGBarChart = ({ data }: any) => {
  if (!data || !data.length) return null;
  const max = Math.max(...data.map((d: any) => d.count)) || 1;
  const w = 400 / data.length;
  return (
    <svg width="100%" height="100%" viewBox="0 0 460 160">
      <rect x="0" y="0" width="460" height="160" fill="#0f172a" rx="8" />
      <line x1="40" y1="125" x2="440" y2="125" stroke="#334155" strokeWidth="1" />
      {data.map((d: any, i: number) => {
        const x = 40 + i * w + w / 2;
        const h = (d.count / max) * 105;
        return (
          <g key={i}>
            <text x={x} y="145" fill="#64748b" fontSize="10" textAnchor="middle">{d.label}</text>
            <text x={x} y={125 - h - 5} fill="#f1f5f9" fontSize="12" fontWeight="700" textAnchor="middle">{d.count}</text>
            <rect x={x - 16} y={125 - h} width="32" height={h} fill={d.color} rx="4" />
          </g>
        );
      })}
    </svg>
  );
};

// --- Inquiry Logic Helpers ---
const CATEGORY_MAP: Record<string, string> = {
  'Probiotic / Postbiotic': 'PROBIOTIC',
  'Nutraceutical': 'NUTRACEUTICAL',
  'Botanical': 'BOTANICAL',
  'Functional Food': 'FUNCTIONAL_FOOD',
  'Pharmaceutical': 'PHARMACEUTICAL',
  'Device': 'DEVICE',
  'Other': 'OTHER'
};

const STAGE_MAP: Record<string, string> = {
  'Concept': 'CONCEPT',
  'Preclinical Complete': 'PRECLINICAL',
  'Ready for Clinical': 'READY',
  'Marketed Product Seeking Data': 'MARKETED'
};

const BUDGET_MAP: Record<string, string> = {
  '<$100K': 'UNDER_100K',
  '$100K–$250K': '100K_250K',
  '$250K–$500K': '250K_500K',
  '$500K+': 'OVER_500K',
  'Prefer to Discuss': 'DISCUSS'
};

const TIMEZONES = [
  'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific',
  'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney', 'UTC'
];

export default function DashboardPanel({ protocols, team, inquiries, setProtocols, addToast, windowWidth, setActiveModule }: any) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Handle live clock for location-aware telemetry
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [protocolFilter, setProtocolFilter] = useState('All');
  const [overviewModalOpen, setOverviewModalOpen] = useState(false);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [reportsStudyFilter, setReportsStudyFilter] = useState<any>(null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [inviteFormVisible, setInviteFormVisible] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'Regulatory Affairs' });
  const [studyDetailModalOpen, setStudyDetailModalOpen] = useState(false);
  const [studyDetailId, setStudyDetailId] = useState<any>(null);
  const [studyDetailTab, setStudyDetailTab] = useState('Overview');
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryStep, setInquiryStep] = useState(1);
  const [inquiryForm, setInquiryForm] = useState({
    // Step 1
    productName: '',
    category: 'Probiotic / Postbiotic',
    developmentStage: 'Concept',
    needs: [] as string[],
    primaryFocus: 'Gut',
    timeline: 'Immediate (0–3 months)',
    // NDA Choice
    ndaPreference: '' as 'YES' | 'NO' | '',
    // NDA Details
    legalName: '',
    signatoryName: '',
    signatoryTitle: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    // Step 2
    studyTypeNeeded: [] as string[],
    targetPopulation: '',
    budgetRange: 'Prefer to Discuss',
    servicesNeeded: [] as string[],
    projectDescription: '',
    contactEmail: '',
    contactPersonName: '',
    contactPersonDesignation: '',
    contactPersonMobile: '',
    hasOperationalAddress: false,
    opStreetAddress: '',
    opCity: '',
    opState: '',
    opZipCode: '',
    opCountry: '',
    discoveryCallDate: '',
    discoveryCallTime: '10:00',
    discoveryCallTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'US/Eastern',
    sites: [] as string[],
  });
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [composeStudyContext, setComposeStudyContext] = useState<any>(null);
  const [composeForm, setComposeForm] = useState({ to: '', subject: '', message: '' });
  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [inquiryCounter, setInquiryCounter] = useState(1001);

  const stats = useMemo(() => ({
    total: protocols.length,
    active: protocols.filter((p: any) => p.status === 'Active' || p.status === 'Recruiting').length,
    completed: protocols.filter((p: any) => p.status === 'Completed').length,
    submitted: (inquiries?.length || 0) + protocols.filter((p: any) => p.status === 'Under Review').length,
    progressReports: protocols.filter((p: any) => p.status === 'PROGRESS_REPORT_DRAFT' || (p.status_human && p.status_human.includes('Progress'))).length,
    finalReports: protocols.filter((p: any) => p.status === 'FINAL_REPORT_SENT').length,
    documents: protocols.reduce((acc: number, p: any) => acc + (p.documents?.length || 0), 0)
  }), [protocols, inquiries]);

  const filteredProtocols = useMemo(() =>
    protocolFilter === 'All' ? protocols : protocols.filter((p: any) => p.status === protocolFilter)
    , [protocols, protocolFilter]);

  const toggleSite = (site: string) => {
    setInquiryForm((prev: any) => ({
      ...prev,
      sites: prev.sites.includes(site) ? prev.sites.filter((s: any) => s !== site) : [...prev.sites, site]
    }));
  };

  const selectedStudyDetail = useMemo(() => {
    const found = protocols.find((p: any) => p.id === studyDetailId);
    if (!found) return null;
    // Merge with MOCK_PROTOCOLS fallback for fields the backend may not return
    const mock = MOCK_PROTOCOLS.find((m: any) => m.id === studyDetailId) || MOCK_PROTOCOLS[0];
    return {
      ...mock,
      ...found,
      milestones: found.milestones?.length ? found.milestones : mock.milestones,
      documents: found.documents?.length ? found.documents : mock.documents,
      team: found.team?.length ? found.team : mock.team,
      enrollment: found.enrollment || mock.enrollment,
      pi: found.pi || mock.pi,
      site: found.site || mock.site,
      studyType: found.studyType || mock.studyType,
      researchArea: found.researchArea || mock.researchArea,
      irbStatus: found.irbStatus || mock.irbStatus,
      startDate: found.startDate || mock.startDate,
      endDate: found.endDate || mock.endDate,
    };
  }, [protocols, studyDetailId]);
  const activeReports = useMemo(() => {
    let reps = MOCK_REPORTS;
    if (reportsStudyFilter) reps = reps.filter(r => r.study === reportsStudyFilter);
    return reps;
  }, [reportsStudyFilter]);

  const barChartData = [
    { label: 'Recruiting', count: protocols.filter((p: any) => p.status === 'Recruiting').length, color: '#10b981' },
    { label: 'Active', count: protocols.filter((p: any) => p.status === 'Active').length, color: '#3b82f6' },
    { label: 'Completed', count: protocols.filter((p: any) => p.status === 'Completed').length, color: '#94a3b8' },
    { label: 'Under Review', count: protocols.filter((p: any) => p.status === 'Under Review').length, color: '#6366f1' },
  ];

  return (
    <>
      <div style={{
        padding: windowWidth > 1024 ? '40px 60px' : windowWidth > 768 ? '30px 40px' : '20px 16px',
        maxWidth: '100%',
        margin: '0 auto',
        color: '#f1f5f9'
      }}>

      {/* CLEAN HIGH-FIDELITY GREETING - NO ICON, NO CARD */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '48px',
        animation: 'fadeIn 0.8s'
      }}>
        <h1 style={{ margin: 0, fontSize: '42px', fontWeight: 900, color: 'white', fontStyle: 'italic', letterSpacing: '-0.02em' }}>
          WELCOME BACK, <span style={{ color: '#60a5fa' }}>{getDisplayName(getUser()).toUpperCase()}</span>
        </h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#60a5fa', fontSize: '22px', fontWeight: 900, fontFamily: 'monospace' }}>
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 900, letterSpacing: '0.05em', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
              {Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop()?.replace('_', ' ')}
            </span>
          </div>
          <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ fontSize: '15px', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.1em' }}>
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Primary Action Banner */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(24px)',
        borderRadius: windowWidth > 768 ? 32 : 24,
        padding: windowWidth > 1024 ? '80px 100px' : windowWidth > 768 ? '60px 80px' : '40px 24px',
        marginBottom: windowWidth > 768 ? 64 : 32,
        display: 'flex',
        flexDirection: windowWidth > 1024 ? 'row' : 'column',
        justifyContent: 'space-between',
        alignItems: windowWidth > 1024 ? 'center' : 'flex-start',
        gap: windowWidth > 768 ? 48 : 32,
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ animation: 'fadeIn 0.8s ease-out' }}>
          <h1 style={{
            margin: 0,
            fontWeight: 900,
            fontSize: windowWidth > 960 ? 56 : windowWidth > 768 ? 42 : 32,
            color: 'white',
            letterSpacing: '-0.04em',
            lineHeight: 1.1
          }}>
            Elevate Your <span style={{ color: '#10b981' }}>Research</span><br />Network.
          </h1>
          <p style={{
            margin: '24px 0 0 0',
            color: 'rgba(255,255,255,0.7)',
            fontSize: windowWidth > 1024 ? 24 : windowWidth > 768 ? 20 : 16,
            lineHeight: 1.6,
            maxWidth: '950px',
            fontWeight: 500
          }}>
            Partner with MusB's elite clinical network to accelerate your protocol deployment.
          </p>
        </div>
        <button onClick={() => setInquiryModalOpen(true)} style={{
          background: 'white',
          color: '#0f172a',
          fontWeight: 900,
          border: 'none',
          padding: windowWidth > 768 ? '28px 56px' : '20px 40px',
          borderRadius: 24,
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          fontSize: windowWidth > 768 ? 22 : 18,
          width: windowWidth > 1024 ? 'auto' : '100%'
        }}>
          + Inquire A New Study
        </button>
      </div>

      <div style={{ fontSize: 16, color: '#64748b', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>CONTROL PANEL</div>
      <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 1200 ? 'repeat(4,1fr)' : windowWidth > 900 ? 'repeat(2,1fr)' : '1fr', gap: windowWidth > 768 ? 20 : 12, marginBottom: 32, alignItems: 'stretch' }}>

        {/* Box 1 */}
        <div onClick={() => setOverviewModalOpen(true)} style={{ background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)', borderRadius: 24, padding: '28px 24px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', transition: 'all 0.3s', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
          <h3 style={{ margin: '0 0 14px 0', fontSize: 26, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>Overview</h3>
          <div style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.8, marginBottom: 20, fontWeight: 500, flex: 1 }}>
            Total Studies: <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{stats.total}</span><br />Active: <span style={{ color: '#60a5fa', fontWeight: 700 }}>{stats.active}</span><br />Completed: <span style={{ color: '#10b981', fontWeight: 700 }}>{stats.completed}</span>
          </div>
          <div style={{ color: '#2563eb', fontSize: 17, fontWeight: 800 }}>→ View Insights</div>
        </div>

        {/* Box 2 */}
        <div onClick={() => setPortfolioModalOpen(true)} style={{ background: '#1e293b', borderRadius: 24, padding: '28px 24px', border: '1px solid #334155', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', transition: 'all 0.3s', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📁</div>
          <h3 style={{ margin: '0 0 14px 0', fontSize: 22, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>Protocol Portfolio</h3>
          <div style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.8, marginBottom: 20, fontWeight: 500, flex: 1 }}>
            Submitted: <span style={{ color: '#6366f1', fontWeight: 700 }}>{stats.submitted}</span><br />Active: <span style={{ color: '#60a5fa', fontWeight: 700 }}>{stats.active}</span><br />Completed: <span style={{ color: '#10b981', fontWeight: 700 }}>{stats.completed}</span>
          </div>
          <div style={{ color: '#6366f1', fontSize: 15, fontWeight: 800 }}>→ View All Protocols</div>
        </div>

        {/* Box 3 */}
        <div onClick={() => { setReportsStudyFilter(null); setReportsModalOpen(true); }} style={{ background: '#1e293b', borderRadius: 24, padding: '28px 24px', border: '1px solid #334155', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', transition: 'all 0.3s', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
          <h3 style={{ margin: '0 0 14px 0', fontSize: 22, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>Study Reports</h3>
          <div style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.8, marginBottom: 20, fontWeight: 500, flex: 1 }}>
            Progress Reports: <span style={{ color: '#10b981', fontWeight: 700 }}>{stats.progressReports}</span><br />Final Reports: <span style={{ color: '#6366f1', fontWeight: 700 }}>{stats.finalReports}</span><br />Downloadable: <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{stats.documents}</span>
          </div>
          <div style={{ color: '#10b981', fontSize: 15, fontWeight: 800 }}>→ Access Reports</div>
        </div>

        {/* Box 4 */}
        <div onClick={() => setTeamModalOpen(true)} style={{ background: '#1e293b', borderRadius: 24, padding: '28px 24px', border: '1px solid #334155', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', transition: 'all 0.3s', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
          <h3 style={{ margin: '0 0 14px 0', fontSize: 22, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>Team Access</h3>
          <div style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.8, marginBottom: 20, fontWeight: 500, flex: 1 }}>
            Team Members: <span style={{ color: '#f59e0b', fontWeight: 700 }}>{team?.length || 0}</span><br />Roles Assigned: <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{team ? new Set(team.map((t: any) => t.role)).size : 0}</span><br />Pending Invitations: <span style={{ color: '#94a3b8', fontWeight: 700 }}>{team ? team.filter((t: any) => t.status === 'PENDING').length : 0}</span>
          </div>
          <div style={{ color: '#f59e0b', fontSize: 15, fontWeight: 800 }}>→ Manage Access</div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: windowWidth > 768 ? 'row' : 'column',
        justifyContent: 'space-between',
        alignItems: windowWidth > 768 ? 'flex-end' : 'flex-start',
        marginBottom: 40,
        gap: 20
      }}>
        <div style={{
          fontSize: windowWidth > 768 ? 64 : 42,
          color: '#f1f5f9',
          fontWeight: 900,
          letterSpacing: '-0.03em'
        }}>
          Strategic Protocol Portfolio
        </div>
        <button onClick={() => setPortfolioModalOpen(true)} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: windowWidth > 768 ? 28 : 22, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>Explore Full Portfolio <span>→</span></button>
      </div>

      {windowWidth > 768 ? (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16 }}>
          {['All', 'Recruiting', 'Active', 'Completed', 'Under Review', 'Attention Needed'].map(f => (
            <PillButton key={f} active={protocolFilter === f} onClick={() => setProtocolFilter(f)}>{f}</PillButton>
          ))}
        </div>
      ) : (
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <select
            value={protocolFilter}
            onChange={(e) => setProtocolFilter(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(30, 41, 59, 0.8)',
              backdropFilter: 'blur(10px)',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: '14px 20px',
              fontSize: 18,
              fontWeight: 800,
              appearance: 'none',
              cursor: 'pointer',
              outline: 'none',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {['All', 'Recruiting', 'Active', 'Completed', 'Under Review', 'Attention Needed'].map(f => (
              <option key={f} value={f} style={{ background: '#0f172a', color: '#f1f5f9' }}>{f} Status</option>
            ))}
          </select>
          <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6366f1', fontSize: 16, fontWeight: 900 }}>▼</div>
        </div>
      )}

      {filteredProtocols.length === 0 ? (
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 48, textAlign: 'center', border: '1px solid #334155' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>No protocols match this filter</h3>
          <p style={{ color: '#94a3b8', margin: '0 0 24px 0' }}>Try a different filter or submit a new inquiry.</p>
          <button onClick={() => setInquiryModalOpen(true)} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>+ Submit New Protocol Inquiry</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 1200 ? 'repeat(3,1fr)' : windowWidth > 800 ? 'repeat(2,1fr)' : '1fr', gap: 40, marginBottom: 80 }}>
          {filteredProtocols.map((p: any) => (
            <div key={p.id} style={{ background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(8px)', borderRadius: 24, padding: '24px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{p.title}</h3>
                <StatusBadge status={p.status} />
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 18, color: '#64748b', marginBottom: 32, fontWeight: 600 }}>{p.id}</div>

              <div style={{ marginBottom: 32, flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 19, color: '#94a3b8', marginBottom: 12 }}>
                  <span>Enrollment</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 800 }}>{p.enrollment.current} / {p.enrollment.target} ({(p.enrollment.current / p.enrollment.target * 100).toFixed(0)}%)</span>
                </div>
                <div style={{ background: '#334155', height: 12, borderRadius: 999 }}>
                  <div style={{ background: '#2563eb', height: 12, borderRadius: 999, width: `${Math.min(100, (p.enrollment.current / p.enrollment.target * 100))}%`, boxShadow: '0 0 10px rgba(37, 99, 235, 0.5)' }} />
                </div>
                <div style={{ fontSize: 14, color: '#64748b', marginTop: 16 }}>Last updated: {p.lastUpdated}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 24, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button onClick={() => { setStudyDetailId(p.id); setStudyDetailTab('Overview'); setStudyDetailModalOpen(true); }} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 800, fontSize: 19, cursor: 'pointer', padding: 0 }}>View Study →</button>
                <button onClick={() => { setReportsStudyFilter(p.id); setReportsModalOpen(true); }} style={{ background: 'none', border: 'none', color: '#94a3b8', fontWeight: 800, fontSize: 19, cursor: 'pointer', padding: 0 }}>Reports</button>
                <button onClick={() => { setComposeStudyContext(p); setComposeForm({ to: `Study Team — ${p.title}`, subject: `Re: ${p.title}`, message: '' }); setComposeModalOpen(true); }} style={{ background: 'none', border: 'none', color: '#94a3b8', fontWeight: 800, fontSize: 19, cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>Message</button>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Overview Modal */}
      <Modal open={overviewModalOpen} onClose={() => setOverviewModalOpen(false)} title="Dashboard Insights" width="680px">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 24 }}>
          {['Total', 'Active', 'Recruiting', 'Completed'].map(s => {
            const statusMap: any = { Total: 'All', Active: 'Active', Recruiting: 'Recruiting', Completed: 'Completed' };
            const filtered = s === 'Total' ? protocols : protocols.filter((p: any) => p.status === s);
            const count = filtered.length;
            const cols: any = { Total: '#38bdf8', Active: '#60a5fa', Recruiting: '#10b981', Completed: '#94a3b8' };
            const handleClick = () => {
              if (count === 0) return;
              setOverviewModalOpen(false);
              if (count === 1) {
                // Go directly to the single study
                setStudyDetailId(filtered[0].id);
                setStudyDetailTab('Overview');
                setStudyDetailModalOpen(true);
              } else {
                // Open portfolio filtered by status
                setProtocolFilter(statusMap[s]);
                setPortfolioModalOpen(true);
              }
            };
            return (
              <div
                key={s}
                onClick={handleClick}
                style={{
                  background: '#0f172a',
                  borderRadius: 14,
                  padding: '24px 20px',
                  textAlign: 'center',
                  border: `1px solid ${count > 0 ? cols[s] + '44' : '#334155'}`,
                  cursor: count > 0 ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  position: 'relative',
                  boxShadow: count > 0 ? `0 4px 20px ${cols[s]}18` : 'none',
                }}
                onMouseEnter={e => { if (count > 0) (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: 60, fontWeight: 900, color: cols[s], lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: 15, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginTop: 8, letterSpacing: '0.06em' }}>{s} Studies</div>
                {count > 0 && (
                  <div style={{ fontSize: 12, color: cols[s], fontWeight: 700, marginTop: 10, opacity: 0.8 }}>
                    {count === 1 ? 'View Study →' : `View All ${count} →`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ height: 200, background: '#0f172a', borderRadius: 10, border: '1px solid #334155', padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 16 }}>STUDIES BY STATUS</div>
          <SVGBarChart data={barChartData} />
        </div>
      </Modal>

      {/* Portfolio Modal */}
      <Modal open={portfolioModalOpen} onClose={() => setPortfolioModalOpen(false)} title="Protocol Portfolio" width="860px">
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
              <tr>
                <th style={{ padding: '18px 20px', fontSize: 15, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Study ID</th>
                <th style={{ padding: '18px 20px', fontSize: 15, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Title</th>
                <th style={{ padding: '18px 20px', fontSize: 15, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</th>
                <th style={{ padding: '18px 20px', fontSize: 15, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Enrollment</th>
                <th style={{ padding: '18px 20px', fontSize: 15, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {protocols.map((p: any) => (
                <tr key={p.id} onClick={() => { setStudyDetailId(p.id); setStudyDetailModalOpen(true); setPortfolioModalOpen(false); }} style={{ borderBottom: '1px solid #334155', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <td style={{ padding: '22px 20px', fontSize: 17, fontFamily: 'monospace', color: '#94a3b8', fontWeight: 700 }}>{p.id}</td>
                  <td style={{ padding: '22px 20px', fontSize: 20, color: '#f1f5f9', fontWeight: 900, letterSpacing: '-0.01em' }}>{p.title}</td>
                  <td style={{ padding: '22px 20px' }}><StatusBadge status={p.status} /></td>
                  <td style={{ padding: '22px 20px', fontSize: 20, color: '#f1f5f9', fontWeight: 800 }}>{p.enrollment.current} <span style={{ color: '#64748b', fontSize: 18 }}>/ {p.enrollment.target}</span></td>
                   <td style={{ padding: '22px 20px', fontSize: 18, color: '#64748b', fontWeight: 500 }}>{p.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Reports Modal */}
      <Modal open={reportsModalOpen} onClose={() => setReportsModalOpen(false)} title="Study Reports" width="700px">
        {reportsStudyFilter && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid #2563eb', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, marginBottom: 20 }}>
            Filtered by: {reportsStudyFilter}
            <button onClick={() => setReportsStudyFilter(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>×</button>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activeReports.map(r => (
            <div key={r.id} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 16, padding: windowWidth > 600 ? '28px 32px' : '20px 18px', display: 'flex', flexDirection: windowWidth > 600 ? 'row' : 'column', justifyContent: 'space-between', alignItems: windowWidth > 600 ? 'center' : 'flex-start', gap: 16, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: windowWidth > 600 ? 26 : 22, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.01em' }}>{r.name}</h4>
                  <StatusBadge status={r.type} />
                </div>
                <div style={{ fontSize: windowWidth > 600 ? 18 : 16, color: '#64748b', fontWeight: 500 }}>{r.study} • Generated on <span style={{ color: '#94a3b8', fontWeight: 800 }}>{r.date}</span></div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0, width: windowWidth > 600 ? 'auto' : '100%' }}>
                <button
                  onClick={() => {
                    downloadPDF(r);
                    addToast({ type: 'success', message: 'PDF generated successfully.' });
                  }}
                  style={{ background: '#2563eb', color: 'white', border: 'none', padding: '14px 24px', borderRadius: 12, fontWeight: 800, fontSize: 18, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', flex: windowWidth > 600 ? 'none' : 1 }}
                >
                  ⬇ PDF
                </button>
                <button
                  onClick={() => {
                    const csvContent = `Report Name,Study ID,Type,Date\n"${r.name}",${r.study},${r.type},${r.date}\n\nParticipantID,Arm,Status,Compliance,AEs,LastVisit\n2024-001,Intervention,Active,96%,0,2026-02-10\n2024-002,Control,Active,91%,0,2026-02-12\n2024-003,Intervention,Completed,100%,1,2026-01-28\n2024-004,Control,Active,88%,0,2026-02-15\n2024-005,Intervention,Active,95%,0,2026-02-08\n2024-006,Control,Screening,N/A,0,2026-02-20\n2024-007,Intervention,Active,93%,0,2026-02-11`;
                    downloadFile(csvContent, `${r.name}.csv`, 'text/csv');
                    addToast({ type: 'success', message: 'CSV downloaded successfully.' });
                  }}
                  style={{ background: '#10b981', color: 'white', border: 'none', padding: '14px 24px', borderRadius: 12, fontWeight: 800, fontSize: 18, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', flex: windowWidth > 600 ? 'none' : 1 }}
                >
                  ⬇ CSV
                </button>
              </div>
            </div>
          ))}
          {activeReports.length === 0 && <div style={{ color: '#64748b', fontSize: 14 }}>No reports found.</div>}
        </div>
      </Modal>

      {/* Team Modal */}
      <Modal open={teamModalOpen} onClose={() => setTeamModalOpen(false)} title="Team Access Management" width="760px">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <button onClick={() => setInviteFormVisible(!inviteFormVisible)} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            + Invite Member
          </button>
        </div>

        {inviteFormVisible && (
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#f1f5f9' }}>Invite Team Member</h4>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <input type="email" placeholder="Email address" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', padding: '10px 14px', borderRadius: 8, outline: 'none' }} />
              <select value={inviteForm.role} onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })} style={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', padding: '10px 14px', borderRadius: 8, outline: 'none' }}>
                <option>Regulatory Affairs</option>
                <option>Data Monitor</option>
                <option>Study Coordinator</option>
                <option>Sponsor Lead</option>
              </select>
              <button onClick={() => {
                setActiveModule('TEAM');
                setTeamModalOpen(false);
                addToast({ type: 'info', message: 'Opening Team Management for detailed controls.' });
              }} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Open Team Manager
              </button>
            </div>
          </div>
        )}

        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
              <tr>
                <th style={{ padding: '12px 16px', fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Role</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Last Active</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {(team || []).map((m: any) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '16px', fontSize: 14, color: '#f1f5f9', fontWeight: 600 }}>{m.name || m.email?.split('@')[0]}</td>
                  <td style={{ padding: '16px', fontSize: 13, color: '#94a3b8' }}>{m.role?.replace('_', ' ').toUpperCase()}</td>
                  <td style={{ padding: '16px' }}><StatusBadge status={m.status === 'ACTIVE' || m.status === 'Active' ? 'Active' : 'Pending'} /></td>
                  <td style={{ padding: '16px', fontSize: 13, color: '#64748b' }}>{m.lastActive || 'N/A'}</td>
                  <td style={{ padding: '16px' }}>
                    <button onClick={() => {
                      addToast({ type: 'info', message: 'Use the Team Management module to manage members.' });
                    }} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Inquiry Modal - Enhanced Multi-Step Flow */}
      <Modal
        open={inquiryModalOpen}
        onClose={() => { setInquiryModalOpen(false); setInquiryStep(1); }}
        title={
          inquiryStep === 1 ? "🧪 Quick Project Check" :
            inquiryStep === 2 ? "🔐 NDA Preference" :
              inquiryStep === 3 ? "🏢 Company Details" :
                inquiryStep === 4 ? "📊 Project Details" :
                  inquiryStep === 5 ? "📅 Schedule Discovery Call" :
                    "🚀 Inquiry Submitted"
        }
        width={inquiryStep === 6 ? "500px" : "800px"}
      >
        {inquiryStep < 6 && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 40, alignItems: 'center' }}>
            {[1, 2, 3].map(step => {
              // Map display step to actual inquiryStep thresholds
              // Display 1 = inquiryStep 1, Display 2 = inquiryStep 2, Display 3 = steps 3/4/5
              const isActive = step === 1 ? inquiryStep >= 1 : step === 2 ? inquiryStep >= 2 : inquiryStep >= 3;
              const isPast = step === 1 ? inquiryStep > 1 : step === 2 ? inquiryStep > 2 : false;
              return (
                <React.Fragment key={step}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: isActive ? '#2563eb' : '#334155',
                    color: 'white', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 900, fontSize: 16,
                    boxShadow: isActive ? '0 0 15px rgba(37,99,235,0.4)' : 'none'
                  }}>
                    {step}
                  </div>
                  {step < 3 && <div style={{ flex: 1, height: 4, background: isPast ? '#2563eb' : '#334155', borderRadius: 2 }} />}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* STEP 1: QUICK PROJECT CHECK */}
        {inquiryStep === 1 && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12, color: 'white' }}>Let’s Explore Your Study Concept</h2>
            <p style={{ color: '#94a3b8', fontSize: 18, marginBottom: 40 }}>Tell us a little about your project. Our team will guide the rest.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 14, color: '#f1f5f9', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>1. Project Name*</label>
                <input
                  value={inquiryForm.productName}
                  onChange={e => setInquiryForm({ ...inquiryForm, productName: e.target.value })}
                  placeholder="e.g. MusB-99 Probiotic Blend"
                  style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '20px', borderRadius: 16, fontSize: 18, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, color: '#f1f5f9', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>2. Research Category*</label>
                <select
                  value={inquiryForm.category}
                  onChange={e => setInquiryForm({ ...inquiryForm, category: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '20px', borderRadius: 16, fontSize: 18, outline: 'none' }}
                >
                  {['Probiotic / Postbiotic', 'Nutraceutical', 'Botanical', 'Functional Food', 'Pharmaceutical', 'Device', 'Other'].map(cat => <option key={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, color: '#f1f5f9', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>3. Development Stage*</label>
                <select
                  value={inquiryForm.developmentStage}
                  onChange={e => setInquiryForm({ ...inquiryForm, developmentStage: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '20px', borderRadius: 16, fontSize: 18, outline: 'none' }}
                >
                  {['Concept', 'Preclinical Complete', 'Ready for Clinical', 'Marketed Product Seeking Data'].map(stg => <option key={stg}>{stg}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={{ display: 'block', fontSize: 14, color: '#f1f5f9', fontWeight: 800, marginBottom: 16, textTransform: 'uppercase' }}>4. What best describes your need?*</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
                {['New Clinical Study', 'Preclinical Validation', 'Biomarker / Lab Support', 'Biorepository', 'Not Sure – Need Guidance'].map(need => (
                  <label key={need} style={{ display: 'flex', alignItems: 'center', gap: 12, background: inquiryForm.needs.includes(need) ? 'rgba(37,99,235,0.1)' : 'rgba(30,41,59,0.5)', padding: '16px 20px', borderRadius: 14, border: `2px solid ${inquiryForm.needs.includes(need) ? '#2563eb' : '#334155'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                    <input
                      type="checkbox"
                      checked={inquiryForm.needs.includes(need)}
                      onChange={() => setInquiryForm({ ...inquiryForm, needs: inquiryForm.needs.includes(need) ? inquiryForm.needs.filter(n => n !== need) : [...inquiryForm.needs, need] })}
                      style={{ width: 20, height: 20 }}
                    />
                    <span style={{ fontSize: 16, fontWeight: 600, color: inquiryForm.needs.includes(need) ? 'white' : '#94a3b8' }}>{need}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 40 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, color: '#f1f5f9', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>5. Focus Of Reserach Area*</label>
                <select
                  value={inquiryForm.primaryFocus}
                  onChange={e => setInquiryForm({ ...inquiryForm, primaryFocus: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '20px', borderRadius: 16, fontSize: 18, outline: 'none' }}
                >
                  {['Gut Health', 'Metabolic', 'Brain', 'Aging', 'Women’s Health', 'Environmental', 'Liver / Behavioral', 'Other'].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, color: '#f1f5f9', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>6. Timeline To Begin </label>
                <select
                  value={inquiryForm.timeline}
                  onChange={e => setInquiryForm({ ...inquiryForm, timeline: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '20px', borderRadius: 16, fontSize: 18, outline: 'none' }}
                >
                  {['Immediate (0–3 months)', '3–6 months', '6–12 months', 'Exploring Options'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  if (!inquiryForm.productName || inquiryForm.needs.length === 0) return addToast({ type: 'error', message: 'Please complete required fields' });
                  setInquiryStep(2);
                }}
                style={{ background: '#2563eb', color: 'white', border: 'none', padding: '20px 48px', borderRadius: 16, fontWeight: 900, cursor: 'pointer', fontSize: 18, boxShadow: '0 10px 30px rgba(37,99,235,0.4)' }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: NDA CHOICE */}
        {inquiryStep === 2 && (
          <div style={{ animation: 'fadeIn 0.4s ease-out', textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>🔒</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16, color: 'white' }}>NDA Preference</h2>
            <p style={{ color: '#94a3b8', fontSize: 18, lineHeight: 1.6, maxWidth: 600, margin: '0 auto 40px' }}>
              We understand that your concept, formulation, or data may be confidential.
              If you prefer, we can execute a mutual NDA before reviewing detailed project materials.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 40 }}>
              <button
                onClick={() => setInquiryForm({ ...inquiryForm, ndaPreference: 'YES' })}
                style={{ flex: 1, padding: '32px', borderRadius: 24, background: inquiryForm.ndaPreference === 'YES' ? 'rgba(37,99,235,0.1)' : '#0f172a', border: `2px solid ${inquiryForm.ndaPreference === 'YES' ? '#2563eb' : '#334155'}`, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
              >
                <div style={{ fontSize: 32, opacity: inquiryForm.ndaPreference === 'YES' ? 1 : 0.4 }}>✅</div>
                <div style={{ fontWeight: 800, fontSize: 20, color: inquiryForm.ndaPreference === 'YES' ? 'white' : '#94a3b8' }}>Yes — Send NDA First</div>
              </button>
              <button
                onClick={() => setInquiryForm({ ...inquiryForm, ndaPreference: 'NO' })}
                style={{ flex: 1, padding: '32px', borderRadius: 24, background: inquiryForm.ndaPreference === 'NO' ? 'rgba(37,185,129,0.1)' : '#0f172a', border: `2px solid ${inquiryForm.ndaPreference === 'NO' ? '#10b981' : '#334155'}`, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
              >
                <div style={{ fontSize: 32, opacity: inquiryForm.ndaPreference === 'NO' ? 1 : 0.4 }}>⚡</div>
                <div style={{ fontWeight: 800, fontSize: 20, color: inquiryForm.ndaPreference === 'NO' ? 'white' : '#94a3b8' }}>No — Continue Direct</div>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setInquiryStep(1)} style={{ background: 'transparent', color: '#94a3b8', border: 'none', fontWeight: 800, fontSize: 18, cursor: 'pointer' }}>← Back</button>
              <button
                onClick={() => {
                  if (!inquiryForm.ndaPreference) return addToast({ type: 'error', message: 'Please select an option' });
                  setInquiryStep(inquiryForm.ndaPreference === 'YES' ? 3 : 4);
                }}
                disabled={!inquiryForm.ndaPreference}
                style={{ background: '#2563eb', color: 'white', border: 'none', padding: '16px 40px', borderRadius: 16, fontWeight: 900, cursor: 'pointer', fontSize: 18, opacity: !inquiryForm.ndaPreference ? 0.5 : 1 }}
              >
                Proceed →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: NDA DETAILS */}
        {inquiryStep === 3 && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16, color: 'white' }}>Company Details for NDA</h2>
            <p style={{ color: '#94a3b8', fontSize: 17, marginBottom: 32 }}>We'll use this information to populate the Mutual NDA template for signature.</p>

            <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 640 ? '1fr 1fr' : '1fr', gap: 24, marginBottom: 32 }}>
              <div style={{ gridColumn: windowWidth > 640 ? 'span 2' : 'auto' }}>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Legal Name of Company*</label>
                <input value={inquiryForm.legalName} onChange={e => setInquiryForm({ ...inquiryForm, legalName: e.target.value })} style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Authorized Signatory Name*</label>
                <input value={inquiryForm.signatoryName} onChange={e => setInquiryForm({ ...inquiryForm, signatoryName: e.target.value })} style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Title*</label>
                <input value={inquiryForm.signatoryTitle} onChange={e => setInquiryForm({ ...inquiryForm, signatoryTitle: e.target.value })} style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }} />
              </div>
              <div style={{ gridColumn: windowWidth > 640 ? 'span 2' : 'auto' }}>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Corporate Street Address*</label>
                <textarea
                  value={inquiryForm.streetAddress}
                  onChange={e => setInquiryForm({ ...inquiryForm, streetAddress: e.target.value })}
                  rows={2}
                  style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', resize: 'none', fontSize: 18 }}
                  placeholder="Street name and number"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>City*</label>
                <input
                  value={inquiryForm.city}
                  onChange={e => setInquiryForm({ ...inquiryForm, city: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>State / Province*</label>
                <input
                  value={inquiryForm.state}
                  onChange={e => setInquiryForm({ ...inquiryForm, state: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>ZIP / Postal Code*</label>
                <input
                  value={inquiryForm.zipCode}
                  onChange={e => setInquiryForm({ ...inquiryForm, zipCode: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Country*</label>
                <input
                  value={inquiryForm.country}
                  onChange={e => setInquiryForm({ ...inquiryForm, country: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }}
                />
              </div>
              <div style={{ gridColumn: windowWidth > 640 ? 'span 2' : 'auto' }}>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Company Contact Email*</label>
                <input
                  value={inquiryForm.contactEmail}
                  onChange={e => setInquiryForm({ ...inquiryForm, contactEmail: e.target.value })}
                  placeholder="The primary email for this inquiry"
                  style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }}
                />
              </div>

              {/* New Contact Person Fields */}
              <div style={{ gridColumn: windowWidth > 640 ? 'span 2' : 'auto' }}>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Contact Person Name*</label>
                <input
                  value={inquiryForm.contactPersonName}
                  onChange={e => setInquiryForm({ ...inquiryForm, contactPersonName: e.target.value })}
                  placeholder="Full name of the primary contact"
                  style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Designation*</label>
                <input
                  value={inquiryForm.contactPersonDesignation}
                  onChange={e => setInquiryForm({ ...inquiryForm, contactPersonDesignation: e.target.value })}
                  placeholder="e.g. Director of Clinical Operations"
                  style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Mobile Number*</label>
                <input
                  value={inquiryForm.contactPersonMobile}
                  onChange={e => setInquiryForm({ ...inquiryForm, contactPersonMobile: e.target.value })}
                  placeholder="Primary contact phone number"
                  style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }}
                />
              </div>

              {/* Operational Address Toggle */}
              <div style={{ gridColumn: windowWidth > 640 ? 'span 2' : 'auto', marginTop: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: inquiryForm.hasOperationalAddress ? 'rgba(37,99,235,0.1)' : 'rgba(30,41,59,0.3)', borderRadius: 12, border: '1px solid #334155', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <input
                    type="checkbox"
                    checked={inquiryForm.hasOperationalAddress}
                    onChange={e => setInquiryForm({ ...inquiryForm, hasOperationalAddress: e.target.checked })}
                    style={{ width: 20, height: 20 }}
                  />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: inquiryForm.hasOperationalAddress ? 'white' : '#f1f5f9' }}>Operational Address is different</div>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>Check this if the clinical operations take place at a different address.</div>
                  </div>
                </label>
              </div>

              {inquiryForm.hasOperationalAddress && (
                <div style={{ gridColumn: windowWidth > 640 ? 'span 2' : 'auto', display: 'grid', gridTemplateColumns: windowWidth > 640 ? '1fr 1fr' : '1fr', gap: 24, animation: 'fadeIn 0.3s ease-out', padding: '24px', background: 'rgba(37,99,235,0.05)', borderRadius: 16, border: '1px dashed #2563eb' }}>
                  <div style={{ gridColumn: windowWidth > 640 ? 'span 2' : 'auto' }}>
                    <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Operational Street Address*</label>
                    <textarea
                      value={inquiryForm.opStreetAddress}
                      onChange={e => setInquiryForm({ ...inquiryForm, opStreetAddress: e.target.value })}
                      rows={2}
                      style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', resize: 'none', fontSize: 18 }}
                      placeholder="Street name and number"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>City*</label>
                    <input
                      value={inquiryForm.opCity}
                      onChange={e => setInquiryForm({ ...inquiryForm, opCity: e.target.value })}
                      style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>State / Province*</label>
                    <input
                      value={inquiryForm.opState}
                      onChange={e => setInquiryForm({ ...inquiryForm, opState: e.target.value })}
                      style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>ZIP / Postal Code*</label>
                    <input
                      value={inquiryForm.opZipCode}
                      onChange={e => setInquiryForm({ ...inquiryForm, opZipCode: e.target.value })}
                      style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Country*</label>
                    <input
                      value={inquiryForm.opCountry}
                      onChange={e => setInquiryForm({ ...inquiryForm, opCountry: e.target.value })}
                      style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }}
                    />
                  </div>
                </div>
              )}
              <div style={{ gridColumn: windowWidth > 640 ? 'span 2' : 'auto' }}>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Brief Project Description (Confidential)*</label>
                <textarea
                  value={inquiryForm.projectDescription}
                  onChange={e => setInquiryForm({ ...inquiryForm, projectDescription: e.target.value })}
                  rows={3}
                  style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', resize: 'none', fontSize: 18 }}
                  placeholder="Describe your research goals..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setInquiryStep(2)} style={{ background: 'transparent', color: '#94a3b8', border: 'none', fontWeight: 800, fontSize: 18, cursor: 'pointer' }}>← Back</button>
              <button
                onClick={() => {
                  if (!inquiryForm.legalName || !inquiryForm.signatoryName) return addToast({ type: 'error', message: 'Please complete required fields' });
                  setInquiryStep(5); // Proceed to scheduling
                }}
                style={{ background: '#2563eb', color: 'white', border: 'none', padding: '18px 48px', borderRadius: 16, fontWeight: 900, cursor: 'pointer', fontSize: 18 }}
              >
                Continue to Scheduling
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PROJECT DETAILS (FULL QUALIFICATION) */}
        {inquiryStep === 4 && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12, color: 'white' }}>Tell Us More About Your Study</h2>
            <p style={{ color: '#94a3b8', fontSize: 17, marginBottom: 32 }}>Expanded qualification to help our team prepare a detailed proposal.</p>

            <div style={{ height: '450px', overflowY: 'auto', paddingRight: '12px', marginBottom: 32 }} className="custom-scroll">
              <div style={{ marginBottom: 32 }}>
                <label style={{ display: 'block', fontSize: 14, color: '#f1f5f9', fontWeight: 800, marginBottom: 16, textTransform: 'uppercase' }}>Observational Study</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                  {['Pilot Study', 'Randomized Controlled Trial', 'Mechanistic Study', 'Observational', 'Not Sure'].map(t => (
                    <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#0f172a', padding: '12px 16px', borderRadius: 12, border: '1px solid #334155', cursor: 'pointer' }}>
                      <input type="checkbox" checked={inquiryForm.studyTypeNeeded.includes(t)} onChange={() => setInquiryForm({ ...inquiryForm, studyTypeNeeded: inquiryForm.studyTypeNeeded.includes(t) ? inquiryForm.studyTypeNeeded.filter(x => x !== t) : [...inquiryForm.studyTypeNeeded, t] })} />
                      <span style={{ fontSize: 15, color: '#f1f5f9' }}>{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 640 ? '1fr 1fr' : '1fr', gap: 24, marginBottom: 32 }}>
                <div style={{ gridColumn: windowWidth > 640 ? 'span 2' : 'auto' }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Legal Name of Company*</label>
                  <input value={inquiryForm.legalName} onChange={e => setInquiryForm({ ...inquiryForm, legalName: e.target.value })} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }} />
                </div>

                <div style={{ gridColumn: windowWidth > 640 ? 'span 2' : 'auto' }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Corporate Street Address*</label>
                  <textarea
                    value={inquiryForm.streetAddress}
                    onChange={e => setInquiryForm({ ...inquiryForm, streetAddress: e.target.value })}
                    rows={2}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', resize: 'none', fontSize: 18 }}
                    placeholder="Street name and number"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>City*</label>
                  <input value={inquiryForm.city} onChange={e => setInquiryForm({ ...inquiryForm, city: e.target.value })} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>State / Province*</label>
                  <input value={inquiryForm.state} onChange={e => setInquiryForm({ ...inquiryForm, state: e.target.value })} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>ZIP / Postal Code*</label>
                  <input value={inquiryForm.zipCode} onChange={e => setInquiryForm({ ...inquiryForm, zipCode: e.target.value })} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Country*</label>
                  <input value={inquiryForm.country} onChange={e => setInquiryForm({ ...inquiryForm, country: e.target.value })} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }} />
                </div>

                <div style={{ gridColumn: windowWidth > 640 ? 'span 2' : 'auto' }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Contact Person Name*</label>
                  <input
                    value={inquiryForm.contactPersonName}
                    onChange={e => setInquiryForm({ ...inquiryForm, contactPersonName: e.target.value })}
                    placeholder="Full name of primary contact"
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }}
                  />
                </div>

                <div style={{ gridColumn: windowWidth > 640 ? 'span 2' : 'auto' }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Company Contact Email*</label>
                  <input
                    value={inquiryForm.contactEmail}
                    onChange={e => setInquiryForm({ ...inquiryForm, contactEmail: e.target.value })}
                    placeholder="Official company email"
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Designation*</label>
                  <input
                    value={inquiryForm.contactPersonDesignation}
                    onChange={e => setInquiryForm({ ...inquiryForm, contactPersonDesignation: e.target.value })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Mobile Number*</label>
                  <input
                    value={inquiryForm.contactPersonMobile}
                    onChange={e => setInquiryForm({ ...inquiryForm, contactPersonMobile: e.target.value })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }}
                  />
                </div>

                <div style={{ gridColumn: windowWidth > 640 ? 'span 2' : 'auto' }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Target Population</label>
                  <input value={inquiryForm.targetPopulation} onChange={e => setInquiryForm({ ...inquiryForm, targetPopulation: e.target.value })} placeholder="e.g. Healthy Adults, Type 2 Diabetics" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }} />
                </div>

                {/* Operational Address Toggle */}
                <div style={{ gridColumn: windowWidth > 640 ? 'span 2' : 'auto' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: inquiryForm.hasOperationalAddress ? 'rgba(37,99,235,0.1)' : 'rgba(30,41,59,0.3)', borderRadius: 12, border: '1px solid #334155', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <input
                      type="checkbox"
                      checked={inquiryForm.hasOperationalAddress}
                      onChange={e => setInquiryForm({ ...inquiryForm, hasOperationalAddress: e.target.checked })}
                      style={{ width: 20, height: 20 }}
                    />
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: inquiryForm.hasOperationalAddress ? 'white' : '#f1f5f9' }}>Operational Address is different</div>
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>Check this if the clinical operations take place at a different address.</div>
                    </div>
                  </label>
                </div>

                {inquiryForm.hasOperationalAddress && (
                  <div style={{ gridColumn: windowWidth > 640 ? 'span 2' : 'auto', display: 'grid', gridTemplateColumns: windowWidth > 640 ? '1fr 1fr' : '1fr', gap: 24, animation: 'fadeIn 0.3s ease-out', padding: '24px', background: 'rgba(37,99,235,0.05)', borderRadius: 16, border: '1px dashed #2563eb' }}>
                    <div style={{ gridColumn: windowWidth > 640 ? 'span 2' : 'auto' }}>
                      <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Operational Street Address*</label>
                      <textarea
                        value={inquiryForm.opStreetAddress}
                        onChange={e => setInquiryForm({ ...inquiryForm, opStreetAddress: e.target.value })}
                        rows={2}
                        style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', resize: 'none', fontSize: 18 }}
                        placeholder="Street name and number"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>City*</label>
                      <input value={inquiryForm.opCity} onChange={e => setInquiryForm({ ...inquiryForm, opCity: e.target.value })} style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>State / Province*</label>
                      <input value={inquiryForm.opState} onChange={e => setInquiryForm({ ...inquiryForm, opState: e.target.value })} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>ZIP / Postal Code*</label>
                      <input value={inquiryForm.opZipCode} onChange={e => setInquiryForm({ ...inquiryForm, opZipCode: e.target.value })} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Country*</label>
                      <input value={inquiryForm.opCountry} onChange={e => setInquiryForm({ ...inquiryForm, opCountry: e.target.value })} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }} />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 32 }}>
                <label style={{ display: 'block', fontSize: 14, color: '#f1f5f9', fontWeight: 800, marginBottom: 16, textTransform: 'uppercase' }}>Services Needed</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                  {[
                    'Study Design & Protocol Development', 'IRB & Regulatory Support',
                    'Participant Recruitment', 'Clinical Site Execution',
                    'Central Laboratory Services', 'Microbiome / Omics Analysis',
                    'Biostatistics', 'End-to-End Study Management',
                    'Biorepository', 'Central Lab', 'Others'
                  ].map(s => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#0f172a', padding: '12px 16px', borderRadius: 12, border: '1px solid #334155', cursor: 'pointer' }}>
                      <input type="checkbox" checked={inquiryForm.servicesNeeded.includes(s)} onChange={() => setInquiryForm({ ...inquiryForm, servicesNeeded: inquiryForm.servicesNeeded.includes(s) ? inquiryForm.servicesNeeded.filter(x => x !== s) : [...inquiryForm.servicesNeeded, s] })} />
                      <span style={{ fontSize: 14, color: '#f1f5f9' }}>{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Project Description (Short Paragraph)*</label>
                <textarea value={inquiryForm.projectDescription} onChange={e => setInquiryForm({ ...inquiryForm, projectDescription: e.target.value })} rows={4} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', fontSize: 18 }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setInquiryStep(2)}
                style={{ background: 'transparent', color: '#94a3b8', border: 'none', fontWeight: 800, fontSize: 18, cursor: 'pointer' }}
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  const { projectDescription, contactEmail, contactPersonName, legalName, streetAddress, city, state, zipCode, country } = inquiryForm;
                  const required = [projectDescription, contactEmail, contactPersonName, legalName, streetAddress, city, state, zipCode, country];
                  if (required.some(f => !f)) {
                    return addToast({ type: 'error', message: 'Please complete all required company, address, and project details.' });
                  }
                  setInquiryStep(5); // Proceed to scheduling
                }}
                style={{ background: '#10b981', color: 'white', border: 'none', padding: '20px 48px', borderRadius: 16, fontWeight: 900, cursor: 'pointer', fontSize: 18, boxShadow: '0 10px 30px rgba(16,185,129,0.3)' }}
              >
                Proceed to Scheduling
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: DISCOVERY CALL SCHEDULING */}
        {inquiryStep === 5 && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12, color: 'white' }}>Schedule Discovery Call</h2>
            <p style={{ color: '#94a3b8', fontSize: 17, marginBottom: 32 }}>Select a convenient time for our research team to connect with you.</p>

            <div style={{ background: '#0f172a', padding: '32px', borderRadius: 20, border: '1px solid #334155', marginBottom: 32 }}>
              <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 640 ? '1fr 1fr' : '1fr', gap: 24, marginBottom: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Select Date*</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={inquiryForm.discoveryCallDate}
                    onChange={e => setInquiryForm({ ...inquiryForm, discoveryCallDate: e.target.value })}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '14px', borderRadius: 10, outline: 'none', fontSize: 18 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Select Time*</label>
                  <input
                    type="time"
                    value={inquiryForm.discoveryCallTime}
                    onChange={e => setInquiryForm({ ...inquiryForm, discoveryCallTime: e.target.value })}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '14px', borderRadius: 10, outline: 'none', fontSize: 18 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Your Timezone*</label>
                <select
                  value={inquiryForm.discoveryCallTimezone}
                  onChange={e => setInquiryForm({ ...inquiryForm, discoveryCallTimezone: e.target.value })}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '14px', borderRadius: 10, outline: 'none', fontSize: 18 }}
                >
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  {!TIMEZONES.includes(inquiryForm.discoveryCallTimezone) && <option value={inquiryForm.discoveryCallTimezone}>{inquiryForm.discoveryCallTimezone}</option>}
                </select>
                <p style={{ marginTop: 12, fontSize: 13, color: '#64748b' }}>Our team is based in EST. We will automatically convert this to our local time.</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setInquiryStep(inquiryForm.ndaPreference === 'YES' ? 3 : 4)}
                style={{ background: 'transparent', color: '#94a3b8', border: 'none', fontWeight: 800, fontSize: 18, cursor: 'pointer' }}
              >
                ← Back
              </button>
              <button
                onClick={async () => {
                  if (!inquiryForm.discoveryCallDate || !inquiryForm.discoveryCallTime) {
                    return addToast({ type: 'error', message: 'Please select a date and time for the call.' });
                  }

                  try {
                    const submissionData = {
                      product_name: inquiryForm.productName,
                      category: CATEGORY_MAP[inquiryForm.category] || 'OTHER',
                      development_stage: STAGE_MAP[inquiryForm.developmentStage] || 'CONCEPT',
                      needs: inquiryForm.needs,
                      primary_focus: inquiryForm.primaryFocus,
                      timeline: inquiryForm.timeline.includes('Immediate') ? 'IMMEDIATE' : inquiryForm.timeline.includes('3–6') ? '3_6_MONTHS' : inquiryForm.timeline.includes('6–12') ? '6_12_MONTHS' : 'EXPLORING',
                      nda_preference: inquiryForm.ndaPreference,
                      legal_name: inquiryForm.legalName,
                      signatory_name: inquiryForm.signatoryName,
                      signatory_title: inquiryForm.signatoryTitle,
                      street_address: inquiryForm.streetAddress,
                      city: inquiryForm.city,
                      state: inquiryForm.state,
                      zip_code: inquiryForm.zipCode,
                      country: inquiryForm.country,
                      contact_email: inquiryForm.contactEmail,
                      contact_person_name: inquiryForm.contactPersonName,
                      contact_person_designation: inquiryForm.contactPersonDesignation,
                      contact_mobile: inquiryForm.contactPersonMobile,
                      has_operational_address: inquiryForm.hasOperationalAddress,
                      op_street_address: inquiryForm.opStreetAddress,
                      op_city: inquiryForm.opCity,
                      op_state: inquiryForm.opState,
                      op_zip_code: inquiryForm.opZipCode,
                      op_country: inquiryForm.opCountry,
                      project_description: inquiryForm.projectDescription,
                      study_type_needed: inquiryForm.studyTypeNeeded,
                      target_population: inquiryForm.targetPopulation,
                      budget_range: BUDGET_MAP[inquiryForm.budgetRange] || 'DISCUSS',
                      services_needed: inquiryForm.servicesNeeded,
                      // Scheduling
                      discovery_call_date: inquiryForm.discoveryCallDate,
                      discovery_call_time: inquiryForm.discoveryCallTime,
                      discovery_call_timezone: inquiryForm.discoveryCallTimezone,
                      status: inquiryForm.ndaPreference === 'YES' ? 'NDA_REQUESTED' : 'QUALIFIED'
                    };

                    const res = await authFetch(`${API}/api/study-inquiries/`, {
                      method: 'POST',
                      body: JSON.stringify(submissionData)
                    });

                    if (res.ok) {
                      setInquiryStep(6);
                    } else {
                      const errorData = await res.json().catch(() => ({}));
                      console.error('Submission Error:', errorData);
                      let msg = errorData.detail || errorData.error || '';
                      if (!msg && typeof errorData === 'object') {
                        msg = Object.entries(errorData)
                          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                          .join(' | ');
                      }
                      addToast({
                        type: 'error',
                        message: msg || 'Validation failed. Please check all fields.'
                      });
                    }
                  } catch (e) {
                    addToast({ type: 'error', message: 'Connection error during final submission.' });
                  }
                }}
                style={{ background: '#2563eb', color: 'white', border: 'none', padding: '20px 48px', borderRadius: 16, fontWeight: 900, cursor: 'pointer', fontSize: 20, boxShadow: '0 10px 30px rgba(37,99,235,0.4)' }}
              >
                Finish & Book Call
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: SUCCESS / CONFIRMATION */}
        {inquiryStep === 6 && (
          <div style={{ animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)', textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 80, marginBottom: 32 }}>SUCCESS</div>
            <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 16, color: 'white' }}>Inquiry & Call Booked!</h2>
            <p style={{ color: '#94a3b8', fontSize: 19, lineHeight: 1.6, marginBottom: 40 }}>
              we got your inquarie and our team members contact you shortly
              <br /><br />
              <strong>Scheduled for:</strong> {inquiryForm.discoveryCallDate} at {inquiryForm.discoveryCallTime} ({inquiryForm.discoveryCallTimezone})
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button
                onClick={() => { setInquiryModalOpen(false); setInquiryStep(1); }}
                style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', padding: '20px', borderRadius: 16, fontWeight: 800, fontSize: 18, cursor: 'pointer' }}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Compose Modal */}
      <Modal open={composeModalOpen} onClose={() => setComposeModalOpen(false)} title="Compose Message" width="580px">
        {composeStudyContext && (
          <div style={{ background: 'rgba(37,99,235,0.1)', borderLeft: '4px solid #2563eb', padding: '12px 16px', borderRadius: '0 8px 8px 0', marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600 }}>Study Context: {composeStudyContext.title} ({composeStudyContext.id})</div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>To</label>
            <input value={composeForm.to} onChange={e => setComposeForm({ ...composeForm, to: e.target.value })} placeholder="Email address" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '12px', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Subject</label>
            <input value={composeForm.subject} onChange={e => setComposeForm({ ...composeForm, subject: e.target.value })} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '12px', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Message</label>
            <textarea value={composeForm.message} onChange={e => setComposeForm({ ...composeForm, message: e.target.value })} rows={6} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '12px', borderRadius: 8, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => {
              addToast({ type: 'success', message: 'Message sent successfully.' });
              setComposeModalOpen(false);
            }} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Send Message</button>
          </div>
        </div>
      </Modal>

      {/* Study Detail Modal */}
      <Modal open={studyDetailModalOpen} onClose={() => setStudyDetailModalOpen(false)} title="Study Details" width="860px">
        {selectedStudyDetail && (
          <div>
            <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #334155', marginBottom: 24 }}>
              {['Overview', 'Timeline', 'Enrollment', 'Documents', 'Team'].map(tab => (
                <button key={tab} onClick={() => setStudyDetailTab(tab)} style={{ background: 'none', border: 'none', padding: '0 0 16px 0', borderBottom: studyDetailTab === tab ? '3px solid #2563eb' : '3px solid transparent', color: studyDetailTab === tab ? '#2563eb' : '#64748b', fontWeight: 800, fontSize: 20, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {tab}
                </button>
              ))}
            </div>

            {studyDetailTab === 'Overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px 56px' }}>
                <div><div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: 12, letterSpacing: '0.08em' }}>Principal Investigator</div><div style={{ fontSize: 26, color: '#f1f5f9', fontWeight: 700 }}>{selectedStudyDetail.pi}</div></div>
                <div><div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: 12, letterSpacing: '0.08em' }}>Assigned Site(s)</div><div style={{ fontSize: 26, color: '#f1f5f9', fontWeight: 700 }}>{selectedStudyDetail.site}</div></div>
                <div><div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: 12, letterSpacing: '0.08em' }}>Study Type & Area</div><div style={{ fontSize: 26, color: '#f1f5f9', fontWeight: 700 }}>{selectedStudyDetail.studyType} • {selectedStudyDetail.researchArea}</div></div>
                <div><div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: 12, letterSpacing: '0.08em' }}>IRB Status</div><div style={{ marginTop: 4 }}><StatusBadge status={selectedStudyDetail.irbStatus} /></div></div>
                <div><div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: 12, letterSpacing: '0.08em' }}>Start Date</div><div style={{ fontSize: 26, color: '#f1f5f9', fontWeight: 700 }}>{selectedStudyDetail.startDate}</div></div>
                <div><div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: 12, letterSpacing: '0.08em' }}>Estimated End Date</div><div style={{ fontSize: 26, color: '#f1f5f9', fontWeight: 700 }}>{selectedStudyDetail.endDate}</div></div>
              </div>
            )}

            {studyDetailTab === 'Timeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '8px 0' }}>
                {(selectedStudyDetail.milestones || []).map((m: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                    <div style={{ width: 14, height: 14, flexShrink: 0, borderRadius: '50%', background: m.status === 'completed' ? '#10b981' : '#334155', border: `4px solid ${m.status === 'completed' ? 'rgba(16,185,129,0.25)' : 'rgba(51,65,85,0.4)'}`, marginTop: 4 }} />
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: m.status === 'completed' ? '#f1f5f9' : '#94a3b8' }}>{m.label}</div>
                      <div style={{ fontSize: 15, color: '#64748b', marginTop: 4, fontWeight: 500 }}>{m.date}{m.notes ? ` • ${m.notes}` : ''}</div>
                    </div>
                  </div>
                ))}
                {!(selectedStudyDetail.milestones?.length) && <div style={{ color: '#64748b', fontSize: 15 }}>No timeline data available.</div>}
              </div>
            )}

            {studyDetailTab === 'Enrollment' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                  <div style={{ background: '#0f172a', padding: 24, borderRadius: 16, border: '1px solid #334155', textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Current Enrolled</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#2563eb' }}>{selectedStudyDetail.enrollment.current}</div>
                  </div>
                  <div style={{ background: '#0f172a', padding: 24, borderRadius: 16, border: '1px solid #334155', textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Target Goal</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#f1f5f9' }}>{selectedStudyDetail.enrollment.target}</div>
                  </div>
                  <div style={{ background: '#0f172a', padding: 24, borderRadius: 16, border: '1px solid #334155', textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Completion</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#10b981' }}>{Math.round((selectedStudyDetail.enrollment.current / selectedStudyDetail.enrollment.target) * 100)}%</div>
                  </div>
                </div>

                <div style={{ background: '#0f172a', padding: 32, borderRadius: 20, border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h4 style={{ margin: 0, fontSize: 16, color: '#f1f5f9' }}>Enrollment Progress Bar</h4>
                    <span style={{ fontSize: 14, color: '#94a3b8' }}>{selectedStudyDetail.enrollment.current} / {selectedStudyDetail.enrollment.target} subjects</span>
                  </div>
                  <div style={{ width: '100%', height: 20, background: '#1e293b', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${(selectedStudyDetail.enrollment.current / selectedStudyDetail.enrollment.target) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #2563eb, #60a5fa)', borderRadius: 999 }} />
                  </div>
                  <div style={{ marginTop: 24, fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
                    Subject recruitment is currently <strong>{selectedStudyDetail.status === 'Active' ? 'on track' : 'paused'}</strong>. {selectedStudyDetail.enrollment.target - selectedStudyDetail.enrollment.current} subjects remaining to reach enrollment target.
                  </div>
                </div>
              </div>
            )}

            {studyDetailTab === 'Documents' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {!(selectedStudyDetail.documents?.length)
                  ? <div style={{ color: '#64748b', fontSize: 16, fontWeight: 500 }}>No documents uploaded.</div>
                  : selectedStudyDetail.documents.map((d: any) => (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '20px 24px', borderRadius: 12, border: '1px solid #334155', gap: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 18, color: '#f1f5f9' }}>{d.type} <span style={{ color: '#64748b', fontWeight: 400 }}>v{d.version}</span></div>
                        <div style={{ fontSize: 15, color: '#64748b', marginTop: 4 }}>{d.title} • {d.date}</div>
                      </div>
                      <button onClick={() => { downloadFile(`Content of ${d.title}`, `${d.title}.txt`); addToast({ type: 'success', message: 'Download started' }); }} style={{ background: 'transparent', border: '2px solid #334155', color: '#f1f5f9', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>Download</button>
                    </div>
                  ))
                }
              </div>
            )}

            {studyDetailTab === 'Team' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {!(selectedStudyDetail.team?.length)
                  ? <div style={{ color: '#64748b', fontSize: 15 }}>No team members listed.</div>
                  : selectedStudyDetail.team.map((t: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid #334155', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
                        {t.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 18, color: '#f1f5f9' }}>{t.name}</div>
                        <div style={{ fontSize: 15, color: '#94a3b8', marginTop: 2 }}>{t.role}</div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}


          </div>
        )}
      </Modal>

      <ConfirmModal confirmModal={confirmModal} setConfirmModal={setConfirmModal} />
      </div>
    </>
  );
}