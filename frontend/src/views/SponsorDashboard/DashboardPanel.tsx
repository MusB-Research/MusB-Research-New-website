import React, { useState, useMemo } from 'react';
import { authFetch, API } from '../../utils/auth';
import { SPONSOR, MOCK_TEAM, MOCK_REPORTS, StatusBadge, Modal, ConfirmModal, PillButton, ProgressRing, downloadCSV, downloadFile } from './SponsorDashboardShared';

// Pure SVG Bar Chart
const SVGBarChart = ({ data }: any) => {
  if(!data || !data.length) return null;
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

export default function DashboardPanel({ protocols, setProtocols, addToast, windowWidth }: any) {
  const [protocolFilter, setProtocolFilter] = useState('All');
  const [overviewModalOpen, setOverviewModalOpen] = useState(false);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [reportsStudyFilter, setReportsStudyFilter] = useState<any>(null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamLocal, setTeamLocal] = useState(MOCK_TEAM);
  const [inviteFormVisible, setInviteFormVisible] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email:'', role:'Regulatory Affairs' });
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
    corporateAddress: '',
    // Step 2
    studyTypeNeeded: [] as string[],
    targetPopulation: '',
    budgetRange: 'Prefer to Discuss',
    servicesNeeded: [] as string[],
    projectDescription: '',
    contactName: SPONSOR.contact,
    contactEmail: SPONSOR.email,
  });
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [composeStudyContext, setComposeStudyContext] = useState<any>(null);
  const [composeForm, setComposeForm] = useState({ to:'', subject:'', message:'' });
  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [inquiryCounter, setInquiryCounter] = useState(1001);

  const stats = useMemo(() => ({
    total: protocols.length,
    active: protocols.filter((p:any) => p.status==='Active'||p.status==='Recruiting').length,
    completed: protocols.filter((p:any) => p.status==='Completed').length
  }), [protocols]);

  const filteredProtocols = useMemo(() =>
    protocolFilter === 'All' ? protocols : protocols.filter((p:any) => p.status === protocolFilter)
  , [protocols, protocolFilter]);

  const toggleSite = (site: string) => {
    setInquiryForm((prev:any) => ({
      ...prev,
      sites: prev.sites.includes(site) ? prev.sites.filter((s:any) => s !== site) : [...prev.sites, site]
    }));
  };

  const selectedStudyDetail = useMemo(() => protocols.find((p:any) => p.id === studyDetailId), [protocols, studyDetailId]);
  const activeReports = useMemo(() => {
    let reps = MOCK_REPORTS;
    if (reportsStudyFilter) reps = reps.filter(r => r.study === reportsStudyFilter);
    return reps;
  }, [reportsStudyFilter]);

  const barChartData = [
    { label: 'Recruiting', count: protocols.filter((p:any)=>p.status==='Recruiting').length, color: '#10b981' },
    { label: 'Active', count: protocols.filter((p:any)=>p.status==='Active').length, color: '#3b82f6' },
    { label: 'Completed', count: protocols.filter((p:any)=>p.status==='Completed').length, color: '#94a3b8' },
    { label: 'Under Review', count: protocols.filter((p:any)=>p.status==='Under Review').length, color: '#6366f1' },
  ];

  return (
    <div style={{ padding: '40px 60px', maxWidth: '100%', margin: '0 auto', color: '#f1f5f9' }}>
      
      {/* Primary Action Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)', borderRadius: 32, padding: '80px 100px', marginBottom: 64, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 48, boxShadow: '0 40px 80px rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ animation: 'fadeIn 0.8s ease-out' }}>
          <h1 style={{ margin: 0, fontWeight: 900, fontSize: 64, color: 'white', letterSpacing: '-0.04em', lineHeight: 1.1 }}>Elevate Your <span style={{ color: '#60a5fa' }}>Research</span><br/>Network.</h1>
          <p style={{ margin: '32px 0 0 0', color: 'rgba(255,255,255,0.9)', fontSize: 28, lineHeight: 1.6, maxWidth: '950px', fontWeight: 500 }}>Partner with MusB's elite clinical network to accelerate your protocol deployment with state-of-the-art monitoring.</p>
        </div>
        <button onClick={() => setInquiryModalOpen(true)} style={{ background: 'white', color: '#1e3a8a', fontWeight: 900, border: 'none', padding: '28px 56px', borderRadius: 24, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', fontSize: 22, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', transform: 'translateY(0)' }}>
          + Launch New Inquiry
        </button>
      </div>

      <div style={{ fontSize: 14, color: '#64748b', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>CONTROL PANEL</div>
      <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 1200 ? 'repeat(4,1fr)' : windowWidth > 800 ? 'repeat(2,1fr)' : '1fr', gap: 32, marginBottom: 56 }}>
        
        {/* Box 1 */}
        <div onClick={() => setOverviewModalOpen(true)} style={{ background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)', borderRadius: 28, padding: 40, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', transition: 'all 0.3s' }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>📊</div>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 32, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.02em' }}>Overview</h3>
          <div style={{ fontSize: 22, color: '#94a3b8', lineHeight: 1.6, marginBottom: 32, fontWeight: 500 }}>
            Total Studies: <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{stats.total}</span><br/>Active: <span style={{ color: '#60a5fa', fontWeight: 700 }}>{stats.active}</span><br/>Completed: <span style={{ color: '#10b981', fontWeight: 700 }}>{stats.completed}</span>
          </div>
          <div style={{ color: '#2563eb', fontSize: 20, fontWeight: 800 }}>→ View Insights</div>
        </div>

        {/* Box 2 */}
        <div onClick={() => setPortfolioModalOpen(true)} style={{ background: '#1e293b', borderRadius: 24, padding: 32, border: '1px solid #334155', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', transition: 'all 0.3s' }}>
          <div style={{ fontSize: 44, marginBottom: 20 }}>📁</div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 26, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.02em' }}>Protocol Portfolio</h3>
          <div style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.6, marginBottom: 24, fontWeight: 500 }}>
            Submitted: <span style={{ color: '#6366f1', fontWeight: 700 }}>{protocols.filter((p:any)=>p.status==='Under Review').length}</span><br/>Active: <span style={{ color: '#60a5fa', fontWeight: 700 }}>{stats.active}</span><br/>Completed: <span style={{ color: '#10b981', fontWeight: 700 }}>{stats.completed}</span>
          </div>
          <div style={{ color: '#6366f1', fontSize: 17, fontWeight: 800 }}>→ View All Protocols</div>
        </div>

        {/* Box 3 */}
        <div onClick={() => { setReportsStudyFilter(null); setReportsModalOpen(true); }} style={{ background: '#1e293b', borderRadius: 24, padding: 32, border: '1px solid #334155', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', transition: 'all 0.3s' }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>📋</div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 24, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>Study Reports</h3>
          <div style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.6, marginBottom: 24 }}>
            Progress Reports: 2<br/>Final Reports: 1<br/>Downloadable: 3
          </div>
          <div style={{ color: '#10b981', fontSize: 16, fontWeight: 700 }}>→ Access Reports</div>
        </div>

        {/* Box 4 */}
        <div onClick={() => setTeamModalOpen(true)} style={{ background: '#1e293b', borderRadius: 24, padding: 32, border: '1px solid #334155', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', transition: 'all 0.3s' }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>👥</div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 24, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>Team Access</h3>
          <div style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.6, marginBottom: 24 }}>
            Team Members: {teamLocal.length}<br/>Roles Assigned: {new Set(teamLocal.map(t=>t.role)).size}<br/>Pending Invitations: {teamLocal.filter(t=>t.status==='Pending Invitation').length}
          </div>
          <div style={{ color: '#f59e0b', fontSize: 16, fontWeight: 700 }}>→ Manage Access</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
        <div style={{ fontSize: 56, color: '#f1f5f9', fontWeight: 900, letterSpacing: '-0.03em' }}>Strategic Protocol Portfolio</div>
        <button onClick={() => setPortfolioModalOpen(true)} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 24, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>Explore Full Portfolio <span>→</span></button>
      </div>
      
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16 }}>
        {['All', 'Recruiting', 'Active', 'Completed', 'Under Review', 'Attention Needed'].map(f => (
          <PillButton key={f} active={protocolFilter === f} onClick={() => setProtocolFilter(f)}>{f}</PillButton>
        ))}
      </div>

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
            <div key={p.id} style={{ background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(8px)', borderRadius: 32, padding: 40, border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{p.title}</h3>
                <StatusBadge status={p.status} />
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 16, color: '#64748b', marginBottom: 32, fontWeight: 600 }}>{p.id}</div>
              
              <div style={{ marginBottom: 32, flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, color: '#94a3b8', marginBottom: 12 }}>
                  <span>Enrollment</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 800 }}>{p.enrollment.current} / {p.enrollment.target} ({(p.enrollment.current/p.enrollment.target*100).toFixed(0)}%)</span>
                </div>
                <div style={{ background: '#334155', height: 12, borderRadius: 999 }}>
                  <div style={{ background: '#2563eb', height: 12, borderRadius: 999, width: `${Math.min(100, (p.enrollment.current/p.enrollment.target*100))}%`, boxShadow: '0 0 10px rgba(37, 99, 235, 0.5)' }} />
                </div>
                <div style={{ fontSize: 14, color: '#64748b', marginTop: 16 }}>Last updated: {p.lastUpdated}</div>
              </div>
 
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button onClick={() => { setStudyDetailId(p.id); setStudyDetailTab('Overview'); setStudyDetailModalOpen(true); }} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 800, fontSize: 17, cursor: 'pointer', padding: 0 }}>View Study →</button>
                <button onClick={() => { setReportsStudyFilter(p.id); setReportsModalOpen(true); }} style={{ background: 'none', border: 'none', color: '#94a3b8', fontWeight: 800, fontSize: 17, cursor: 'pointer', padding: 0 }}>Reports</button>
                <button onClick={() => { setComposeStudyContext(p); setComposeForm({ to:`Study Team — ${p.title}`, subject:`Re: ${p.title}`, message:'' }); setComposeModalOpen(true); }} style={{ background: 'none', border: 'none', color: '#94a3b8', fontWeight: 800, fontSize: 17, cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>Message</button>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Overview Modal */}
      <Modal open={overviewModalOpen} onClose={() => setOverviewModalOpen(false)} title="Dashboard Insights" width="680px">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 24 }}>
          {['Total', 'Active', 'Recruiting', 'Completed'].map(s => {
            const getVal = () => {
              if(s==='Total') return protocols.length;
              if(s==='Active') return protocols.filter((p:any)=>p.status==='Active').length;
              if(s==='Recruiting') return protocols.filter((p:any)=>p.status==='Recruiting').length;
              if(s==='Completed') return protocols.filter((p:any)=>p.status==='Completed').length;
              return 0;
            };
            const cols:any = { Total:'#38bdf8', Active:'#60a5fa', Recruiting:'#10b981', Completed:'#94a3b8' };
            return (
              <div key={s} style={{ background: '#0f172a', borderRadius: 10, padding: 18, textAlign: 'center', border: '1px solid #334155' }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: cols[s] }}>{getVal()}</div>
                <div style={{ fontSize: 14, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginTop: 4 }}>{s} Studies</div>
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
                <th style={{ padding: '16px 20px', fontSize: 16, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Study ID</th>
                <th style={{ padding: '16px 20px', fontSize: 16, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</th>
                <th style={{ padding: '16px 20px', fontSize: 16, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '16px 20px', fontSize: 16, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enrollment</th>
                <th style={{ padding: '16px 20px', fontSize: 16, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {protocols.map((p:any) => (
                <tr key={p.id} onClick={() => { setStudyDetailId(p.id); setStudyDetailModalOpen(true); setPortfolioModalOpen(false); }} style={{ borderBottom: '1px solid #334155', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <td style={{ padding: '20px', fontSize: 17, fontFamily: 'monospace', color: '#94a3b8', fontWeight: 600 }}>{p.id}</td>
                  <td style={{ padding: '20px', fontSize: 20, color: '#f1f5f9', fontWeight: 900, letterSpacing: '-0.01em' }}>{p.title}</td>
                  <td style={{ padding: '20px' }}><StatusBadge status={p.status} /></td>
                  <td style={{ padding: '20px', fontSize: 18, color: '#f1f5f9', fontWeight: 800 }}>{p.enrollment.current} <span style={{ color: '#64748b', fontSize: 16 }}>/ {p.enrollment.target}</span></td>
                  <td style={{ padding: '20px', fontSize: 17, color: '#64748b', fontWeight: 500 }}>{p.lastUpdated}</td>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeReports.map(r => (
            <div key={r.id} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>{r.name}</h4>
                  <StatusBadge status={r.type} />
                </div>
                <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>{r.study} • Generated on <span style={{ color: '#94a3b8', fontWeight: 800 }}>{r.date}</span></div>
              </div>
              <button onClick={() => {
                setConfirmModal({
                  title: 'Select Download Format',
                  message: `How would you like to download "${r.name}"?`,
                  buttons: [
                    { label: 'Download PDF', color: '#2563eb', onClick: () => { downloadFile(`PDF Content: ${r.name}`, `${r.name}.pdf`, 'application/pdf'); addToast({ type: 'success', message: 'PDF generated successfully.' }); } },
                    { label: 'Download CSV', color: '#10b981', onClick: () => { downloadFile(`CSV Content: ${r.name}`, `${r.name}.csv`, 'text/csv'); addToast({ type: 'success', message: 'CSV generated successfully.' }); } }
                  ]
                });
              }} style={{ background: 'transparent', border: '2px solid #334155', color: '#f1f5f9', padding: '12px 24px', borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s' }}>
                ⬇ Download
              </button>
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
              <input type="email" placeholder="Email address" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', padding: '10px 14px', borderRadius: 8, outline: 'none' }} />
              <select value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})} style={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', padding: '10px 14px', borderRadius: 8, outline: 'none' }}>
                <option>Regulatory Affairs</option>
                <option>Data Monitor</option>
                <option>Study Coordinator</option>
                <option>Sponsor Lead</option>
              </select>
              <button onClick={() => {
                if(!inviteForm.email) return addToast({ type: 'error', message: 'Email required' });
                setTeamLocal([...teamLocal, { id: `t${Date.now()}`, name: inviteForm.email.split('@')[0], role: inviteForm.role, status: 'Pending Invitation', lastActive: '—' }]);
                addToast({ type: 'success', message: 'Invitation sent' });
                setInviteForm({ email: '', role: 'Regulatory Affairs' });
                setInviteFormVisible(false);
              }} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Send Invitation
              </button>
            </div>
          </div>
        )}

        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
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
              {teamLocal.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '16px', fontSize: 14, color: '#f1f5f9', fontWeight: 600 }}>{m.name}</td>
                  <td style={{ padding: '16px', fontSize: 13, color: '#94a3b8' }}>{m.role}</td>
                  <td style={{ padding: '16px' }}><StatusBadge status={m.status==='Active' ? 'Active' : 'Pending'} /></td>
                  <td style={{ padding: '16px', fontSize: 13, color: '#64748b' }}>{m.lastActive}</td>
                  <td style={{ padding: '16px' }}>
                    <button onClick={() => {
                      setConfirmModal({
                        title: 'Remove Team Member', message: `Are you sure you want to remove ${m.name}?`,
                        confirmLabel: 'Remove', confirmColor: '#ef4444',
                        onConfirm: () => { setTeamLocal(prev => prev.filter(x => x.id !== m.id)); addToast({ type: 'success', message: 'Member removed' }); }
                      });
                    }} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}>Remove</button>
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
          "🚀 Inquiry Submitted"
        } 
        width={inquiryStep === 5 ? "500px" : "800px"}
      >
        <div style={{ display: 'flex', gap: 12, marginBottom: 40, alignItems: 'center' }}>
          {[1, 2, 4].map(step => (
            <React.Fragment key={step}>
              <div style={{ 
                width: 40, height: 40, borderRadius: '50%', 
                background: inquiryStep >= step ? '#2563eb' : '#334155', 
                color: 'white', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', fontWeight: 900, fontSize: 16,
                boxShadow: inquiryStep >= step ? '0 0 15px rgba(37,99,235,0.4)' : 'none'
              }}>
                {step === 4 ? 3 : step}
              </div>
              {step < 4 && <div style={{ flex: 1, height: 4, background: inquiryStep > step ? '#2563eb' : '#334155', borderRadius: 2 }} />}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 1: QUICK PROJECT CHECK */}
        {inquiryStep === 1 && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12, color: 'white' }}>Let’s Explore Your Study Concept</h2>
            <p style={{ color: '#94a3b8', fontSize: 18, marginBottom: 40 }}>Tell us a little about your project. Our team will guide the rest.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 14, color: '#f1f5f9', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>1. Product / Ingredient Name*</label>
                <input 
                  value={inquiryForm.productName} 
                  onChange={e => setInquiryForm({...inquiryForm, productName: e.target.value})} 
                  placeholder="e.g. MusB-99 Probiotic Blend"
                  style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '20px', borderRadius: 16, fontSize: 18, outline: 'none' }} 
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 14, color: '#f1f5f9', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>2. Product Category*</label>
                <select 
                  value={inquiryForm.category} 
                  onChange={e => setInquiryForm({...inquiryForm, category: e.target.value})}
                  style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '20px', borderRadius: 16, fontSize: 18, outline: 'none' }}
                >
                  {['Probiotic / Postbiotic', 'Nutraceutical', 'Botanical', 'Functional Food', 'Pharmaceutical', 'Device', 'Other'].map(cat => <option key={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, color: '#f1f5f9', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>3. Stage of Development*</label>
                <select 
                  value={inquiryForm.developmentStage} 
                  onChange={e => setInquiryForm({...inquiryForm, developmentStage: e.target.value})}
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
                      onChange={() => setInquiryForm({ ...inquiryForm, needs: inquiryForm.needs.includes(need) ? inquiryForm.needs.filter(n => n!==need) : [...inquiryForm.needs, need] })} 
                      style={{ width: 20, height: 20 }}
                    />
                    <span style={{ fontSize: 16, fontWeight: 600, color: inquiryForm.needs.includes(need) ? 'white' : '#94a3b8' }}>{need}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 40 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, color: '#f1f5f9', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>5. Primary Health Focus*</label>
                <select 
                  value={inquiryForm.primaryFocus} 
                  onChange={e => setInquiryForm({...inquiryForm, primaryFocus: e.target.value})}
                  style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '20px', borderRadius: 16, fontSize: 18, outline: 'none' }}
                >
                  {['Gut', 'Metabolic', 'Brain', 'Aging', 'Women’s Health', 'Environmental', 'Liver / Behavioral', 'Other'].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, color: '#f1f5f9', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>6. Estimated Timeline</label>
                <select 
                  value={inquiryForm.timeline} 
                  onChange={e => setInquiryForm({...inquiryForm, timeline: e.target.value})}
                  style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '20px', borderRadius: 16, fontSize: 18, outline: 'none' }}
                >
                  {['Immediate (0–3 months)', '3–6 months', '6–12 months', 'Exploring Options'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  if(!inquiryForm.productName || inquiryForm.needs.length === 0) return addToast({ type: 'error', message: 'Please complete required fields' });
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
                  if(!inquiryForm.ndaPreference) return addToast({ type: 'error', message: 'Please select an option' });
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Legal Name of Company*</label>
                <input value={inquiryForm.legalName} onChange={e => setInquiryForm({...inquiryForm, legalName: e.target.value})} style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Authorized Signatory Name*</label>
                <input value={inquiryForm.signatoryName} onChange={e => setInquiryForm({...inquiryForm, signatoryName: e.target.value})} style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Title*</label>
                <input value={inquiryForm.signatoryTitle} onChange={e => setInquiryForm({...inquiryForm, signatoryTitle: e.target.value})} style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Corporate Address*</label>
                <textarea value={inquiryForm.corporateAddress} onChange={e => setInquiryForm({...inquiryForm, corporateAddress: e.target.value})} rows={3} style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none', resize: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setInquiryStep(2)} style={{ background: 'transparent', color: '#94a3b8', border: 'none', fontWeight: 800, fontSize: 18, cursor: 'pointer' }}>← Back</button>
              <button 
                onClick={async () => {
                  if(!inquiryForm.legalName || !inquiryForm.signatoryName) return addToast({ type: 'error', message: 'Please complete required fields' });
                  
                  // Submit initial inquiry with NDA request and stop
                  try {
                    const res = await authFetch(`${API}/api/study-inquiries/`, {
                      method: 'POST',
                      body: JSON.stringify({
                        product_name: inquiryForm.productName,
                        category: inquiryForm.category.toUpperCase().replace(/ /g, '_'),
                        development_stage: inquiryForm.developmentStage.toUpperCase().replace(/ /g, '_'),
                        needs: inquiryForm.needs,
                        primary_focus: inquiryForm.primaryFocus,
                        timeline: inquiryForm.timeline.includes('Immediate') ? 'IMMEDIATE' : inquiryForm.timeline.includes('3–6') ? '3_6_MONTHS' : inquiryForm.timeline.includes('6–12') ? '6_12_MONTHS' : 'EXPLORING',
                        nda_preference: 'YES',
                        legal_name: inquiryForm.legalName,
                        signatory_name: inquiryForm.signatoryName,
                        signatory_title: inquiryForm.signatoryTitle,
                        corporate_address: inquiryForm.corporateAddress,
                        status: 'NDA_REQUESTED'
                      })
                    });
                    if(res.ok) setInquiryStep(5);
                    else addToast({ type: 'error', message: 'Failed to submit' });
                  } catch (e) {
                    addToast({ type: 'error', message: 'Connection error' });
                  }
                }} 
                style={{ background: '#2563eb', color: 'white', border: 'none', padding: '18px 48px', borderRadius: 16, fontWeight: 900, cursor: 'pointer', fontSize: 18 }}
              >
                Request NDA
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
                <label style={{ display: 'block', fontSize: 14, color: '#f1f5f9', fontWeight: 800, marginBottom: 16, textTransform: 'uppercase' }}>Study Type Needed</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                  {['Pilot Study', 'Randomized Controlled Trial', 'Mechanistic Study', 'Observational', 'Not Sure'].map(t => (
                    <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#0f172a', padding: '12px 16px', borderRadius: 12, border: '1px solid #334155', cursor: 'pointer' }}>
                      <input type="checkbox" checked={inquiryForm.studyTypeNeeded.includes(t)} onChange={() => setInquiryForm({...inquiryForm, studyTypeNeeded: inquiryForm.studyTypeNeeded.includes(t) ? inquiryForm.studyTypeNeeded.filter(x => x!==t) : [...inquiryForm.studyTypeNeeded, t]})} />
                      <span style={{ fontSize: 15, color: '#f1f5f9' }}>{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Target Population</label>
                  <input value={inquiryForm.targetPopulation} onChange={e => setInquiryForm({...inquiryForm, targetPopulation: e.target.value})} placeholder="e.g. Healthy Adults, Type 2 Diabetics" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '14px', borderRadius: 10, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Estimated Budget Range</label>
                  <select value={inquiryForm.budgetRange} onChange={e => setInquiryForm({...inquiryForm, budgetRange: e.target.value})} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '14px', borderRadius: 10, outline: 'none' }}>
                    {['<$100K', '$100K–$250K', '$250K–$500K', '$500K+', 'Prefer to Discuss'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <label style={{ display: 'block', fontSize: 14, color: '#f1f5f9', fontWeight: 800, marginBottom: 16, textTransform: 'uppercase' }}>Services Needed</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                  {[
                    'Study Design & Protocol Development', 'IRB & Regulatory Support', 
                    'Participant Recruitment', 'Clinical Site Execution', 
                    'Central Laboratory Services', 'Microbiome / Omics Analysis', 
                    'Biostatistics', 'End-to-End Study Management'
                  ].map(s => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#0f172a', padding: '12px 16px', borderRadius: 12, border: '1px solid #334155', cursor: 'pointer' }}>
                      <input type="checkbox" checked={inquiryForm.servicesNeeded.includes(s)} onChange={() => setInquiryForm({...inquiryForm, servicesNeeded: inquiryForm.servicesNeeded.includes(s) ? inquiryForm.servicesNeeded.filter(x => x!==s) : [...inquiryForm.servicesNeeded, s]})} />
                      <span style={{ fontSize: 14, color: '#f1f5f9' }}>{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Project Description (Short Paragraph)*</label>
                <textarea value={inquiryForm.projectDescription} onChange={e => setInquiryForm({...inquiryForm, projectDescription: e.target.value})} rows={4} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '16px', borderRadius: 12, outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setInquiryStep(2)} style={{ background: 'transparent', color: '#94a3b8', border: 'none', fontWeight: 800, fontSize: 18, cursor: 'pointer' }}>← Back</button>
              <button 
                onClick={async () => {
                  if(!inquiryForm.projectDescription) return addToast({ type: 'error', message: 'Project description is required' });
                  try {
                    const res = await authFetch(`${API}/api/study-inquiries/`, {
                      method: 'POST',
                      body: JSON.stringify({
                        product_name: inquiryForm.productName,
                        category: inquiryForm.category.toUpperCase().replace(/ /g, '_'),
                        development_stage: inquiryForm.developmentStage.toUpperCase().replace(/ /g, '_'),
                        needs: inquiryForm.needs,
                        primary_focus: inquiryForm.primaryFocus,
                        timeline: inquiryForm.timeline.includes('Immediate') ? 'IMMEDIATE' : inquiryForm.timeline.includes('3–6') ? '3_6_MONTHS' : inquiryForm.timeline.includes('6–12') ? '6_12_MONTHS' : 'EXPLORING',
                        nda_preference: 'NO',
                        study_type_needed: inquiryForm.studyTypeNeeded,
                        target_population: inquiryForm.targetPopulation,
                        budget_range: inquiryForm.budgetRange.replace(/<\$|K|\$|–|>|\+/g, '').replace(/ /g, '_').toUpperCase(),
                        services_needed: inquiryForm.servicesNeeded,
                        project_description: inquiryForm.projectDescription,
                        status: 'QUALIFIED'
                      })
                    });
                    if(res.ok) setInquiryStep(5);
                    else addToast({ type: 'error', message: 'Submission failed' });
                  } catch (e) { addToast({ type: 'error', message: 'Connection error' }); }
                }} 
                style={{ background: '#10b981', color: 'white', border: 'none', padding: '20px 48px', borderRadius: 16, fontWeight: 900, cursor: 'pointer', fontSize: 18, boxShadow: '0 10px 30px rgba(16,185,129,0.3)' }}
              >
                🚀 Request Consultation
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: SUCCESS / CONFIRMATION */}
        {inquiryStep === 5 && (
          <div style={{ animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)', textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 80, marginBottom: 32 }}>🎊</div>
            <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 16, color: 'white' }}>Submission Received!</h2>
            <p style={{ color: '#94a3b8', fontSize: 19, lineHeight: 1.6, marginBottom: 40 }}>
              {inquiryForm.ndaPreference === 'YES' 
                ? "Our legal team will send the Mutual NDA within 1–2 business days. Once executed, we will proceed with the detailed project review."
                : "Our clinical development team will review your project and contact you within 2–3 business days."}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button 
                onClick={() => { window.open('https://calendly.com/musbresearch', '_blank'); }}
                style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', padding: '20px', borderRadius: 16, fontWeight: 800, fontSize: 18, cursor: 'pointer' }}
              >
                👉 Schedule a Discovery Call Now
              </button>
              <button 
                onClick={() => { setInquiryModalOpen(false); setInquiryStep(1); }} 
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: 16, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
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
            <input value={composeForm.to} onChange={e => setComposeForm({...composeForm, to: e.target.value})} placeholder="Email address" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '12px', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Subject</label>
            <input value={composeForm.subject} onChange={e => setComposeForm({...composeForm, subject: e.target.value})} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '12px', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Message</label>
            <textarea value={composeForm.message} onChange={e => setComposeForm({...composeForm, message: e.target.value})} rows={6} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '12px', borderRadius: 8, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
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
                <button key={tab} onClick={() => setStudyDetailTab(tab)} style={{ background: 'none', border: 'none', padding: '0 0 12px 0', borderBottom: studyDetailTab === tab ? '2px solid #2563eb' : '2px solid transparent', color: studyDetailTab === tab ? '#2563eb' : '#94a3b8', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  {tab}
                </button>
              ))}
            </div>
            
            {studyDetailTab === 'Overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 40px' }}>
                <div><div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Principal Investigator</div><div style={{ fontSize: 14, color: '#f1f5f9' }}>{selectedStudyDetail.pi}</div></div>
                <div><div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Assigned Site(s)</div><div style={{ fontSize: 14, color: '#f1f5f9' }}>{selectedStudyDetail.site}</div></div>
                <div><div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Study Type & Area</div><div style={{ fontSize: 14, color: '#f1f5f9' }}>{selectedStudyDetail.studyType} • {selectedStudyDetail.researchArea}</div></div>
                <div><div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>IRB Status</div><div><StatusBadge status={selectedStudyDetail.irbStatus} /></div></div>
                <div><div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Start Date</div><div style={{ fontSize: 14, color: '#f1f5f9' }}>{selectedStudyDetail.startDate}</div></div>
                <div><div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Estimated End Date</div><div style={{ fontSize: 14, color: '#f1f5f9' }}>{selectedStudyDetail.endDate}</div></div>
              </div>
            )}

            {studyDetailTab === 'Timeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {selectedStudyDetail.milestones.map((m:any, i:number) => (
                  <div key={i} style={{ display: 'flex', gap: 16 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: m.status === 'completed' ? '#10b981' : '#334155', border: `4px solid ${m.status==='completed'?'rgba(16,185,129,0.2)':'transparent'}`, marginTop: 2, flexShrink:0 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: m.status === 'completed' ? '#f1f5f9' : '#94a3b8' }}>{m.label}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{m.date} {m.notes && `• ${m.notes}`}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {studyDetailTab === 'Documents' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedStudyDetail.documents.length === 0 ? <div style={{ color: '#64748b' }}>No documents uploaded.</div> : 
                  selectedStudyDetail.documents.map((d:any) => (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: 16, borderRadius: 8, border: '1px solid #334155' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>{d.type} <span style={{ color: '#64748b', fontWeight: 400 }}>v{d.version}</span></div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{d.title} • {d.date}</div>
                      </div>
                      <button onClick={() => { downloadFile(`Content of ${d.title}`, `${d.title}.txt`); addToast({ type: 'success', message: 'Download started' }); }} style={{ background: 'transparent', border: '1px solid #334155', color: '#f1f5f9', padding: '6px 12px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>Download</button>
                    </div>
                  ))
                }
              </div>
            )}

            {studyDetailTab === 'Team' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {selectedStudyDetail.team.map((t:any, i:number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#334155', color: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      {t.name.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{t.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {studyDetailTab === 'Enrollment' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#38bdf8' }}>{selectedStudyDetail.enrollment.current}</div>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Enrolled</div>
                  </div>
                  <div style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#94a3b8' }}>{selectedStudyDetail.enrollment.target}</div>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Target</div>
                  </div>
                  <div style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 16, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <ProgressRing pct={selectedStudyDetail.enrollment.current/selectedStudyDetail.enrollment.target*100} width={36} stroke={3} />
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginTop: 4 }}>Progress</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal confirmModal={confirmModal} setConfirmModal={setConfirmModal} />
    </div>
  );
}
