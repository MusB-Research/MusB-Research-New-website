import React, { useState, useMemo } from 'react';
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
  const [inquiryForm, setInquiryForm] = useState({ title:'', researchArea:'Aging', studyType:'Clinical Trial', description:'', participants:'', startDate:'', duration:'6 months', budget:'$50K–$200K', sites:[] as string[], contactName:SPONSOR.contact, contactEmail:SPONSOR.email, phone:'', notes:'', files:[] });
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
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto', color: '#f1f5f9' }}>
      
      {/* Primary Action Banner */}
      <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)', borderRadius: 12, padding: '28px 32px', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontWeight: 700, fontSize: 20, color: 'white' }}>Start a New Research Collaboration</h1>
          <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.82)', fontSize: 14 }}>Collaborate with our research network for rapid deployment and expert clinical monitoring.</p>
        </div>
        <button onClick={() => setInquiryModalOpen(true)} style={{ background: 'white', color: '#2563eb', fontWeight: 700, border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}>
          + Inquire a New Study
        </button>
      </div>

      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>CONTROL PANEL</div>
      <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 1024 ? 'repeat(4,1fr)' : windowWidth > 640 ? 'repeat(2,1fr)' : '1fr', gap: 16, marginBottom: 32 }}>
        
        {/* Box 1 */}
        <div onClick={() => setOverviewModalOpen(true)} style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', transition: 'all 0.2s' }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>📊</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Overview</h3>
          <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5, marginBottom: 16 }}>
            Total Studies: {stats.total}<br/>Active: {stats.active}<br/>Completed: {stats.completed}
          </div>
          <div style={{ color: '#2563eb', fontSize: 13, fontWeight: 600 }}>→ View Dashboard Insights</div>
        </div>

        {/* Box 2 */}
        <div onClick={() => setPortfolioModalOpen(true)} style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', transition: 'all 0.2s' }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>📁</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Protocol Portfolio</h3>
          <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5, marginBottom: 16 }}>
            Submitted: {protocols.filter((p:any)=>p.status==='Under Review').length}<br/>Active: {stats.active}<br/>Completed: {stats.completed}
          </div>
          <div style={{ color: '#6366f1', fontSize: 13, fontWeight: 600 }}>→ View All Protocols</div>
        </div>

        {/* Box 3 */}
        <div onClick={() => { setReportsStudyFilter(null); setReportsModalOpen(true); }} style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', transition: 'all 0.2s' }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>📋</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Study Reports</h3>
          <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5, marginBottom: 16 }}>
            Progress Reports: 2<br/>Final Reports: 1<br/>Downloadable: 3
          </div>
          <div style={{ color: '#10b981', fontSize: 13, fontWeight: 600 }}>→ Access Reports</div>
        </div>

        {/* Box 4 */}
        <div onClick={() => setTeamModalOpen(true)} style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', transition: 'all 0.2s' }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>👥</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Team Access</h3>
          <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5, marginBottom: 16 }}>
            Team Members: {teamLocal.length}<br/>Roles Assigned: {new Set(teamLocal.map(t=>t.role)).size}<br/>Pending Invitations: {teamLocal.filter(t=>t.status==='Pending Invitation').length}
          </div>
          <div style={{ color: '#f59e0b', fontSize: 13, fontWeight: 600 }}>→ Manage Access</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div style={{ fontSize: 20, color: '#f1f5f9', fontWeight: 700 }}>Active Protocols</div>
        <button onClick={() => setPortfolioModalOpen(true)} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>View All →</button>
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
        <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 900 ? 'repeat(3,1fr)' : windowWidth > 600 ? 'repeat(2,1fr)' : '1fr', gap: 16, marginBottom: 40 }}>
          {filteredProtocols.map((p:any) => (
            <div key={p.id} style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{p.title}</h3>
                <StatusBadge status={p.status} />
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b', marginBottom: 16 }}>{p.id}</div>
              
              <div style={{ marginBottom: 16, flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                  <span>Enrollment</span>
                  <span>{p.enrollment.current} / {p.enrollment.target} ({(p.enrollment.current/p.enrollment.target*100).toFixed(0)}%)</span>
                </div>
                <div style={{ background: '#334155', height: 6, borderRadius: 999 }}>
                  <div style={{ background: '#2563eb', height: 6, borderRadius: 999, width: `${Math.min(100, (p.enrollment.current/p.enrollment.target*100))}%` }} />
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>Last updated: {p.lastUpdated}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 16, borderTop: '1px solid #334155' }}>
                <button onClick={() => { setStudyDetailId(p.id); setStudyDetailTab('Overview'); setStudyDetailModalOpen(true); }} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0 }}>View Study →</button>
                <button onClick={() => { setReportsStudyFilter(p.id); setReportsModalOpen(true); }} style={{ background: 'none', border: 'none', color: '#94a3b8', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0 }}>View Reports</button>
                <button onClick={() => { setComposeStudyContext(p); setComposeForm({ to:`Study Team — ${p.title}`, subject:`Re: ${p.title}`, message:'' }); setComposeModalOpen(true); }} style={{ background: 'none', border: 'none', color: '#94a3b8', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>Message Team</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Protocol Banner Bottom */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #1e3a5f 100%)', borderLeft: '4px solid #2563eb', borderRadius: 12, padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: 18, color: '#f1f5f9' }}>Start a New Research Protocol</h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 14 }}>Submit your study design for rapid feasibility review.</p>
        </div>
        <button onClick={() => setInquiryModalOpen(true)} style={{ background: '#2563eb', color: 'white', fontWeight: 700, border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}>
          Submit New Protocol Inquiry
        </button>
      </div>

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
                <div style={{ fontSize: 36, fontWeight: 800, color: cols[s] }}>{getVal()}</div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginTop: 4 }}>{s} Studies</div>
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
                <th style={{ padding: '12px 16px', fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Study ID</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Title</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Enrollment</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {protocols.map((p:any) => (
                <tr key={p.id} onClick={() => { setStudyDetailId(p.id); setStudyDetailModalOpen(true); setPortfolioModalOpen(false); }} style={{ borderBottom: '1px solid #334155', cursor: 'pointer' }}>
                  <td style={{ padding: '16px', fontSize: 13, fontFamily: 'monospace', color: '#94a3b8' }}>{p.id}</td>
                  <td style={{ padding: '16px', fontSize: 14, color: '#f1f5f9', fontWeight: 600 }}>{p.title}</td>
                  <td style={{ padding: '16px' }}><StatusBadge status={p.status} /></td>
                  <td style={{ padding: '16px', fontSize: 13, color: '#f1f5f9' }}>{p.enrollment.current} / {p.enrollment.target}</td>
                  <td style={{ padding: '16px', fontSize: 13, color: '#64748b' }}>{p.lastUpdated}</td>
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
            <div key={r.id} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{r.name}</h4>
                  <StatusBadge status={r.type} />
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{r.study} • Generated on {r.date}</div>
              </div>
              <button onClick={() => {
                downloadFile(`Report: ${r.name}\nDate: ${r.date}\nStudy: ${r.study}`, `${r.name}.txt`);
                addToast({ type: 'success', message: `Downloading "${r.name}"...` });
              }} style={{ background: 'transparent', border: '1px solid #334155', color: '#f1f5f9', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
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

      {/* Inquiry Modal */}
      <Modal open={inquiryModalOpen} onClose={() => setInquiryModalOpen(false)} title="New Study Inquiry" width="680px">
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, alignItems: 'center' }}>
          {[1, 2, 3].map(step => (
            <React.Fragment key={step}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: inquiryStep >= step ? '#2563eb' : '#334155', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                {step}
              </div>
              {step < 3 && <div style={{ flex: 1, height: 2, background: inquiryStep > step ? '#2563eb' : '#334155' }} />}
            </React.Fragment>
          ))}
        </div>

        {inquiryStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Study Title *</label>
              <input value={inquiryForm.title} onChange={e => setInquiryForm({...inquiryForm, title: e.target.value})} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '12px', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Description *</label>
              <textarea value={inquiryForm.description} onChange={e => setInquiryForm({...inquiryForm, description: e.target.value})} rows={4} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '12px', borderRadius: 8, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Research Area</label>
                <select value={inquiryForm.researchArea} onChange={e => setInquiryForm({...inquiryForm, researchArea: e.target.value})} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '12px', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}>
                  <option>Aging</option><option>Gut Health</option><option>Neurology</option><option>Oncology</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Participants</label>
                <input type="number" value={inquiryForm.participants} onChange={e => setInquiryForm({...inquiryForm, participants: e.target.value})} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '12px', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
               <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Study Type</label>
               <div style={{ display: 'flex', gap: 8 }}>
                 {['Clinical Trial', 'Observational', 'Preclinical', 'Survey'].map(t => (
                   <PillButton key={t} active={inquiryForm.studyType === t} onClick={() => setInquiryForm({...inquiryForm, studyType: t})}>{t}</PillButton>
                 ))}
               </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => {
                if(!inquiryForm.title || !inquiryForm.description) return addToast({ type: 'error', message: 'Title and Description are required' });
                setInquiryStep(2);
              }} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Next →</button>
            </div>
          </div>
        )}

        {inquiryStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Proposed Start Date</label>
                <input type="date" value={inquiryForm.startDate} onChange={e => setInquiryForm({...inquiryForm, startDate: e.target.value})} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '12px', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Duration</label>
                <select value={inquiryForm.duration} onChange={e => setInquiryForm({...inquiryForm, duration: e.target.value})} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '12px', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}>
                  <option>3 months</option><option>6 months</option><option>12 months</option><option>18+ months</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Budget Range</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['<$50K', '$50K–$200K', '$200K–$500K', '$500K+'].map(t => (
                  <PillButton key={t} active={inquiryForm.budget === t} onClick={() => setInquiryForm({...inquiryForm, budget: t})}>{t}</PillButton>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Preferred Sites (Remote is automatically selected for Virtual trials)</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Tampa', 'Miami', 'Orlando', 'Remote'].map(t => (
                  <PillButton key={t} active={inquiryForm.sites.includes(t)} onClick={() => toggleSite(t)}>{t}</PillButton>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
              <button onClick={() => setInquiryStep(1)} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '12px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
              <button onClick={() => setInquiryStep(3)} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Next →</button>
            </div>
          </div>
        )}

        {inquiryStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Sponsor Contact Name</label>
                <input value={inquiryForm.contactName} onChange={e => setInquiryForm({...inquiryForm, contactName: e.target.value})} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '12px', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Contact Email</label>
                <input type="email" value={inquiryForm.contactEmail} onChange={e => setInquiryForm({...inquiryForm, contactEmail: e.target.value})} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '12px', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Additional Notes</label>
              <textarea value={inquiryForm.notes} onChange={e => setInquiryForm({...inquiryForm, notes: e.target.value})} rows={3} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '12px', borderRadius: 8, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
              <button onClick={() => setInquiryStep(2)} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '12px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
              <button onClick={() => {
                setConfirmModal({
                  title: 'Submit Study Inquiry?', message: 'A MusB coordinator will contact you within 2 business days to discuss next steps.',
                  confirmLabel: 'Submit', confirmColor: '#10b981',
                  onConfirm: () => {
                    const newId = `INQ-${inquiryCounter}`;
                    setInquiryCounter(c => c+1);
                    const newProtocol = {
                      id: newId, title: inquiryForm.title, status: 'Under Review',
                      enrollment: { current:0, target:parseInt(inquiryForm.participants)||0 },
                      lastUpdated: 'Just now', pi: 'TBD', site: inquiryForm.sites.join(', ')||'TBD',
                      startDate: inquiryForm.startDate||'TBD', endDate: 'TBD', studyType: inquiryForm.studyType,
                      researchArea: inquiryForm.researchArea, irbStatus: 'Pending', studyMode: 'TBD',
                      documents: [], team: [{name:SPONSOR.contact, role:'Sponsor Contact'}],
                      milestones: [{label:'Inquiry Submitted', date:new Date().toISOString().split('T')[0], status:'completed', notes:''}],
                      enrollmentHistory: [], completionData: [], questionnaires: [], samples: [], reports: [],
                      kpis: { enrolled:0, targetEnrolled:parseInt(inquiryForm.participants)||0, completed:0, targetCompleted:0, recruitmentCompleted:false, analysisStatus:'Not Started', latestReport:'Pending' },
                      reportStats: { progressReportsAvailable:0, latestReport:'Pending', participantDataAvailable:false }
                    };
                    setProtocols((prev:any) => [newProtocol, ...prev]);
                    setInquiryModalOpen(false);
                    setInquiryStep(1);
                    setInquiryForm({ title:'', researchArea:'Aging', studyType:'Clinical Trial', description:'', participants:'', startDate:'', duration:'6 months', budget:'$50K–$200K', sites:[], contactName:SPONSOR.contact, contactEmail:SPONSOR.email, phone:'', notes:'', files:[] });
                    addToast({ type: 'success', message: `Inquiry submitted! ID: ${newId}` });
                  }
                });
              }} style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Submit Inquiry</button>
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
