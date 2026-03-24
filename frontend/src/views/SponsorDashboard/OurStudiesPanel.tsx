import React, { useState, useMemo } from 'react';
import { SPONSOR, StatusBadge, Modal, ConfirmModal, PillButton, ProgressRing, LineChart, GroupedBarChart, downloadCSV, downloadFile, generateParticipants } from './SponsorDashboardShared';

const getChartData = (study: any, tab: string) => {
  if (tab === 'Enrollment') return <LineChart data={study.enrollmentHistory} target={study.enrollment.target} />;
  if (tab === 'Completion') return <GroupedBarChart data={study.completionData} />;
  if (tab === 'Questionnaires') {
    const lines = study.questionnaires.map((q: any, i: number) => {
      const pts = q.points.map((p: any, j: number) => `${40 + j*(400/(q.points.length-1||1))},${125 - (p.score/10)*105}`).join(' ');
      const clr = i===0?'#2563eb':'#10b981';
      return <polyline key={i} points={pts} fill="none" stroke={clr} strokeWidth="3" />;
    });
    return (
      <svg width="100%" height="100%" viewBox="0 0 460 160">
        <rect x="0" y="0" width="460" height="160" fill="#0f172a" rx="8" />
        <line x1="40" y1="125" x2="440" y2="125" stroke="#334155" strokeWidth="1" />
        {lines}
        {study.questionnaires[0]?.points?.map((p:any,i:number)=>(
          <text key={i} x={40 + i*(400/(study.questionnaires[0].points.length-1||1))} y="145" fill="#64748b" fontSize="10" textAnchor="middle">{p.label}</text>
        ))}
        {study.questionnaires.map((q:any, i:number) => (
          <text key={i} x={50} y={20 + i*15} fill={i===0?'#2563eb':'#10b981'} fontSize="10">{q.name}</text>
        ))}
      </svg>
    );
  }
  if (tab === 'Samples') {
    return (
      <svg width="100%" height="100%" viewBox="0 0 460 160">
        <rect x="0" y="0" width="460" height="160" fill="#0f172a" rx="8" />
        <line x1="40" y1="125" x2="440" y2="125" stroke="#334155" strokeWidth="1" />
        {study.samples.map((s:any, i:number) => (
          <text key={i} x={40 + i*(400/(study.samples.length-1||1))} y="145" fill="#64748b" fontSize="10" textAnchor="middle">{s.month}</text>
        ))}
        <polyline points={study.samples.map((s:any,i:number) => `${40 + i*(400/(study.samples.length-1||1))},${125 - (s.sent/100)*105}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth="2" />
        <polyline points={study.samples.map((s:any,i:number) => `${40 + i*(400/(study.samples.length-1||1))},${125 - (s.received/100)*105}`).join(' ')} fill="none" stroke="#10b981" strokeWidth="2" />
        <text x="50" y="20" fill="#2563eb" fontSize="10">Samples Sent</text>
        <text x="50" y="35" fill="#10b981" fontSize="10">Samples Received</text>
      </svg>
    );
  }
  return <div style={{ color: '#64748b' }}>No visual insights data available</div>;
};

export default function OurStudiesPanel({ protocols, setProtocols, addToast, windowWidth }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortMode, setSortMode] = useState('Latest First');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set(['MUSB-2024-012']));
  const [cardChartTabs, setCardChartTabs] = useState<any>({});
  
  const [studyDetailOpen, setStudyDetailOpen] = useState(false);
  const [studyDetailId, setStudyDetailId] = useState<any>(null);
  
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [reportsStudyId, setReportsStudyId] = useState<any>(null);
  
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [composeStudyContext, setComposeStudyContext] = useState<any>(null);
  const [composeMsg, setComposeMsg] = useState({ to:'', subject:'', message:'' });
  
  const [confirmModal, setConfirmModal] = useState<any>(null);

  const filteredStudies = useMemo(() => {
    let p = [...protocols];
    if (searchQuery) p = p.filter((x:any) => x.title.toLowerCase().includes(searchQuery.toLowerCase()) || x.id.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterStatus !== 'All') p = p.filter((x:any) => x.status === filterStatus);
    if (sortMode === 'Latest First') p.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    else if (sortMode === 'Oldest First') p.sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    else if (sortMode === 'A–Z') p.sort((a,b) => a.title.localeCompare(b.title));
    else if (sortMode === 'By Enrollment %') p.sort((a,b) => (b.enrollment.current/b.enrollment.target) - (a.enrollment.current/a.enrollment.target));
    return p;
  }, [protocols, searchQuery, filterStatus, sortMode]);

  const activeStudyForDetail = useMemo(() => protocols.find((p:any) => p.id === studyDetailId), [protocols, studyDetailId]);
  const activeReportsStudy = useMemo(() => protocols.find((p:any) => p.id === reportsStudyId), [protocols, reportsStudyId]);

  return (
    <div style={{ 
      padding: windowWidth > 1024 ? '48px 64px' : windowWidth > 768 ? '32px 40px' : '20px 16px', 
      maxWidth: '100%', 
      margin: '0 auto', 
      color: '#f1f5f9', 
      animation: 'fadeIn 0.5s ease-out' 
    }}>
      <div style={{ position: 'sticky', top: 57, background: '#020617', zIndex: 40, paddingBottom: 24, paddingTop: 16, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', flexDirection: windowWidth > 768 ? 'row' : 'column', justifyContent: 'space-between', alignItems: windowWidth > 768 ? 'center' : 'flex-start', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: windowWidth > 768 ? 52 : 32, color: '#f1f5f9', letterSpacing: '-0.04em', lineHeight: 1.1 }}>Strategic Portfolio</h1>
            <div style={{ fontSize: windowWidth > 768 ? 20 : 16, color: '#94a3b8', marginTop: 12, fontWeight: 600 }}>Sponsor Dashboard → <span style={{ color: '#2563eb' }}>Our Studies</span></div>
          </div>
        </div>
              <div style={{ background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(10px)', borderRadius: 28, padding: windowWidth > 768 ? 32 : 20, marginTop: windowWidth > 768 ? 40 : 20, display: 'flex', gap: windowWidth > 768 ? 20 : 12, flexWrap: 'wrap', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search protocols..." style={{ flex: 1, minWidth: windowWidth > 768 ? 350 : '100%', background: 'rgba(15, 23, 42, 0.6)', border: '2px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: windowWidth > 768 ? '20px 28px' : '16px 20px', borderRadius: 20, outline: 'none', fontSize: windowWidth > 768 ? 20 : 16, fontWeight: 500 }} />
          <div style={{ position: 'relative', flex: windowWidth > 768 ? 'none' : 1 }}>
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)} 
              style={{ 
                width: '100%',
                background: 'rgba(15, 23, 42, 0.6)', 
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255,255,255,0.1)', 
                color: '#f1f5f9', 
                padding: windowWidth > 768 ? '20px 48px 20px 28px' : '16px 40px 16px 20px', 
                borderRadius: 20, 
                outline: 'none', 
                fontSize: windowWidth > 768 ? 18 : 14, 
                fontWeight: 700, 
                cursor: 'pointer',
                appearance: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {['All', 'Active', 'Recruiting', 'Completed', 'On Hold', 'Cancelled', 'Under Review'].map(s => <option key={s} value={s} style={{ background: '#0f172a' }}>{s} Status</option>)}
            </select>
            <div style={{ position: 'absolute', right: windowWidth > 768 ? 20 : 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#2563eb', fontSize: 14, fontWeight: 900 }}>▼</div>
          </div>
          <div style={{ position: 'relative', flex: windowWidth > 768 ? 'none' : 1 }}>
            <select 
              value={sortMode} 
              onChange={e => setSortMode(e.target.value)} 
              style={{ 
                width: '100%',
                background: 'rgba(15, 23, 42, 0.6)', 
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255,255,255,0.1)', 
                color: '#f1f5f9', 
                padding: windowWidth > 768 ? '20px 48px 20px 28px' : '16px 40px 16px 20px', 
                borderRadius: 20, 
                outline: 'none', 
                fontSize: windowWidth > 768 ? 18 : 14, 
                fontWeight: 700, 
                cursor: 'pointer',
                appearance: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              <option value="Latest First" style={{ background: '#0f172a' }}>Latest First</option>
              <option value="Oldest First" style={{ background: '#0f172a' }}>Oldest First</option>
              <option value="A–Z" style={{ background: '#0f172a' }}>A–Z</option>
              <option value="By Enrollment %" style={{ background: '#0f172a' }}>By Enrollment %</option>
            </select>
            <div style={{ position: 'absolute', right: windowWidth > 768 ? 20 : 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#2563eb', fontSize: 14, fontWeight: 900 }}>▼</div>
          </div>
          {windowWidth > 768 && <div style={{ background: 'rgba(255,255,255,0.1)', width: 2, height: 40, margin: '0 12px' }} />}
          <div style={{ display: 'flex', gap: 12, width: windowWidth > 768 ? 'auto' : '100%', justifyContent: 'center' }}>
            <button onClick={() => setExpandedCards(new Set(filteredStudies.map((p:any)=>p.id)))} style={{ background: 'transparent', border: '2px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: windowWidth > 768 ? '20px 40px' : '12px 20px', borderRadius: 20, fontWeight: 800, cursor: 'pointer', fontSize: windowWidth > 768 ? 18 : 14 }}>Expand All</button>
            <button onClick={() => setExpandedCards(new Set())} style={{ background: 'transparent', border: 'none', color: '#94a3b8', padding: '18px', fontWeight: 700, cursor: 'pointer', fontSize: 17 }}>Collapse All</button>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Showing {filteredStudies.length} of {protocols.length} studies</div>
          {filterStatus !== 'All' && (
            <div style={{ background: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid #2563eb', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, display:'flex', alignItems:'center', gap:6 }}>
              Status: {filterStatus}
              <button onClick={() => setFilterStatus('All')} style={{ background:'none', border:'none', color:'inherit', cursor:'pointer' }}>×</button>
            </div>
          )}
          {searchQuery && (
            <div style={{ background: 'rgba(245,158,11,0.1)', color: '#fcd34d', border: '1px solid #f59e0b', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, display:'flex', alignItems:'center', gap:6 }}>
              Query: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} style={{ background:'none', border:'none', color:'inherit', cursor:'pointer' }}>×</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {filteredStudies.map((study:any) => {
          const isExpanded = expandedCards.has(study.id);
          const activeTab = cardChartTabs[study.id] || 'Enrollment';
          return (
            <div key={study.id} style={{ background: '#1e293b', borderRadius: 16, border: '1px solid #334155', overflow: 'hidden', boxShadow: isExpanded ? '0 8px 32px rgba(0,0,0,0.5)' : 'none', transition: 'all 0.3s' }}>
              
                <div onClick={() => {
                const newSet = new Set(expandedCards);
                if(isExpanded) newSet.delete(study.id); else newSet.add(study.id);
                setExpandedCards(newSet);
              }} style={{ padding: '48px 56px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <h3 style={{ margin: 0, fontSize: 36, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.03em' }}>{study.title}</h3>
                    {study.indication && <span style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#60a5fa', padding: '8px 18px', borderRadius: 12, fontSize: 16, fontWeight: 800, border: '1px solid rgba(37, 99, 235, 0.2)' }}>{study.indication}</span>}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 18, color: '#64748b', marginTop: 12, fontWeight: 600 }}>{study.id}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: study.studyMode === 'Virtual' ? '#60a5fa' : study.studyMode === 'Hybrid' ? '#10b981' : '#a5b4fc', padding: '10px 24px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{study.studyMode}</span>
                  <StatusBadge status={study.status} />
                  <div style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#64748b', fontSize: 24 }}>▼</div>
                </div>
              </div>

              {!isExpanded && (
                <div style={{ padding: '0 24px 16px', display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>Enrolled: <strong style={{ color: '#f1f5f9' }}>{study.enrollment.current} / {study.enrollment.target}</strong></div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>Completed: <strong style={{ color: '#f1f5f9' }}>{study.kpis.completed} / {study.kpis.targetCompleted}</strong></div>
                  <div style={{ flex: 1, height: 4, background: '#334155', borderRadius: 999 }}>
                    <div style={{ height: 4, background: '#2563eb', borderRadius: 999, width: `${(study.enrollment.current/study.enrollment.target)*100}%` }} />
                  </div>
                </div>
              )}

              {isExpanded && (
                <div style={{ borderTop: '1px solid #334155' }}>
                  
                  {/* Row 1 - Basics */}
                  <div style={{ padding: '32px 48px', borderBottom: '1px solid #334155' }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#64748b', letterSpacing: '0.15em', marginBottom: 24, textTransform: 'uppercase' }}>STUDY DETAILS</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 40 }}>
                      <div><div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 10, fontWeight: 600 }}>Principal Investigator</div><div style={{ fontSize: 20, color: '#f1f5f9', fontWeight: 700, letterSpacing: '-0.01em' }}>{study.pi}</div></div>
                      <div><div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 10, fontWeight: 600 }}>Assigned Site</div><div style={{ fontSize: 20, color: '#f1f5f9', fontWeight: 700, letterSpacing: '-0.01em' }}>{study.site}</div></div>
                      <div><div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 10, fontWeight: 600 }}>Study Timeline</div><div style={{ fontSize: 20, color: '#f1f5f9', fontWeight: 700, letterSpacing: '-0.01em' }}>{study.startDate} — {study.endDate}</div></div>
                      <div><div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 10, fontWeight: 600 }}>IRB Status</div><div><StatusBadge status={study.irbStatus} /></div></div>
                    </div>
                  </div>

                  {/* Row 2 - KPIs */}
                  <div style={{ padding: '32px 48px', borderBottom: '1px solid #334155', overflowX: 'auto' }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#64748b', letterSpacing: '0.15em', marginBottom: 24, textTransform: 'uppercase' }}>KEY PERFORMANCE INDICATORS</div>
                    <div style={{ display: 'flex', gap: 24 }}>
                      <div style={{ minWidth: 200, background: '#0f172a', border: '1px solid #334155', borderRadius: 20, padding: 24 }}>
                        <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16, fontWeight: 600 }}>Status</div>
                        <StatusBadge status={study.status} />
                      </div>
                      <div style={{ minWidth: 240, background: '#0f172a', border: '1px solid #334155', borderRadius: 20, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 10, fontWeight: 600 }}>Enrolled</div>
                          <div style={{ fontSize: 36, fontWeight: 900, color: '#3b82f6', letterSpacing: '-0.02em' }}>{study.enrollment.current}</div>
                          <div style={{ fontSize: 14, color: '#64748b', fontWeight: 800, letterSpacing: '0.02em' }}>/ {study.enrollment.target} TARGET</div>
                        </div>
                        <ProgressRing pct={study.enrollment.current/study.enrollment.target*100} width={56} stroke={6} />
                      </div>
                      <div style={{ minWidth: 240, background: '#0f172a', border: '1px solid #334155', borderRadius: 20, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 10, fontWeight: 600 }}>Completed</div>
                          <div style={{ fontSize: 36, fontWeight: 900, color: '#10b981', letterSpacing: '-0.02em' }}>{study.kpis.completed}</div>
                          <div style={{ fontSize: 14, color: '#64748b', fontWeight: 800, letterSpacing: '0.02em' }}>/ {study.kpis.targetCompleted} TARGET</div>
                        </div>
                        <ProgressRing pct={study.kpis.completed/study.kpis.targetCompleted*100} width={56} stroke={6} />
                      </div>
                      <div style={{ minWidth: 200, background: '#0f172a', border: '1px solid #334155', borderRadius: 20, padding: 24 }}>
                        <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16, fontWeight: 600 }}>Recruitment Complete</div>
                        <div style={{ color: study.kpis.recruitmentCompleted ? '#10b981' : '#f59e0b', fontWeight: 900, fontSize: 22, letterSpacing: '0.02em' }}>{study.kpis.recruitmentCompleted ? 'YES' : 'NO'}</div>
                      </div>
                      <div style={{ minWidth: 200, background: '#0f172a', border: '1px solid #334155', borderRadius: 20, padding: 24 }}>
                        <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16, fontWeight: 600 }}>Latest Report</div>
                        <StatusBadge status={study.kpis.latestReport} />
                      </div>
                    </div>
                  </div>

                  {/* Row 3 - Charts */}
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>VISUAL INSIGHTS</div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {['Enrollment', 'Completion', 'Questionnaires', 'Samples'].map(tab => (
                          <button key={tab} onClick={() => setCardChartTabs({...cardChartTabs, [study.id]: tab})} style={{ background: activeTab === tab ? '#334155' : 'transparent', color: activeTab === tab ? '#f1f5f9' : '#94a3b8', border: 'none', padding: '4px 12px', fontSize: 12, borderRadius: 999, fontWeight: 600, cursor: 'pointer' }}>{tab}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ height: 220, background: '#0f172a', borderRadius: 10, border: '1px solid #334155', padding: 16 }}>
                      {getChartData(study, activeTab)}
                    </div>
                  </div>

                  {/* Row 4 - Actions */}
                  <div style={{ padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', gap: 20 }}>
                      <button onClick={() => { setStudyDetailId(study.id); setStudyDetailOpen(true); }} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '16px 32px', borderRadius: 14, fontWeight: 900, fontSize: 17, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.2)' }}>View Detailed Study →</button>
                      <button onClick={() => { setReportsStudyId(study.id); setReportsModalOpen(true); }} style={{ background: 'transparent', color: '#6366f1', border: '2px solid #334155', padding: '16px 32px', borderRadius: 14, fontWeight: 900, fontSize: 17, cursor: 'pointer', transition: 'all 0.3s' }}>View Reports →</button>
                    </div>
                    <div style={{ display: 'flex', gap: 20 }}>
                      <button onClick={() => {
                        const csv = 'ParticipantID,Arm,Status\n' + generateParticipants(study.id).map(p => `${p.id},${p.arm},${p.status}`).join('\n');
                        downloadCSV(csv, `${study.id}_Export.csv`);
                        addToast({type:'success', message:'Downloaded de-identified CSV'});
                      }} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '2px solid rgba(16,185,129,0.2)', padding: '16px 32px', borderRadius: 14, fontWeight: 900, fontSize: 17, cursor: 'pointer', transition: 'all 0.3s' }}>⬇ Download CSV Menu</button>
                      <button onClick={() => { setComposeStudyContext(study); setComposeMsg({to:`${study.title} Team`, subject:'', message:''}); setComposeModalOpen(true); }} style={{ background: 'transparent', color: '#94a3b8', border: 'none', padding: '16px', borderRadius: 14, fontWeight: 800, fontSize: 17, cursor: 'pointer' }}>Message Study Team</button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })}

        {filteredStudies.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, background: '#1e293b', border: '1px solid #334155', borderRadius: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📂</div>
            <h3 style={{ margin: 0, fontSize: 18, color: '#f1f5f9' }}>No studies found</h3>
            <p style={{ color: '#94a3b8', margin: '8px 0 24px 0' }}>Try adjusting your search or filters.</p>
            <button onClick={() => { setSearchQuery(''); setFilterStatus('All'); }} style={{ background: 'transparent', border: '1px solid #334155', color: '#f1f5f9', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Clear All Filters</button>
          </div>
        )}
      </div>

      <Modal open={reportsModalOpen} onClose={() => setReportsModalOpen(false)} title={`Study Reports — ${activeReportsStudy?.title || ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeReportsStudy?.reports?.map((r:any, i:number) => (
            <div key={i} style={{ background: '#0f172a', padding: 24, borderRadius: 12, border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: 18, letterSpacing: '-0.01em' }}>{r.name}</div>
                <div style={{ fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: 500 }}>{r.date} • <span style={{ color: '#10b981', fontWeight: 800 }}>{r.status.toUpperCase()}</span></div>
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
              }} style={{ background: 'transparent', border: '2px solid #334155', color: '#f1f5f9', padding: '12px 24px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: 15, transition: 'all 0.2s' }}>⬇ Download</button>
            </div>
          ))}
          {!activeReportsStudy?.reports?.length && <div style={{ color: '#64748b' }}>No reports generated yet.</div>}
        </div>
      </Modal>

      <Modal open={composeModalOpen} onClose={() => setComposeModalOpen(false)} title="Message Study Team">
         <div style={{ background: 'rgba(37,99,235,0.1)', borderLeft: '4px solid #2563eb', padding: '12px 16px', borderRadius: '0 8px 8px 0', marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600 }}>Context: {composeStudyContext?.title} ({composeStudyContext?.id})</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input value={composeMsg.subject} onChange={e => setComposeMsg({...composeMsg, subject:e.target.value})} placeholder="Subject" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '12px', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
            <textarea value={composeMsg.message} onChange={e => setComposeMsg({...composeMsg, message:e.target.value})} placeholder="Message" rows={6} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '12px', borderRadius: 8, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => { addToast({type:'success', message:'Message sent successfully.'}); setComposeModalOpen(false); }} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Send Message</button>
            </div>
          </div>
      </Modal>

      <Modal open={studyDetailOpen} onClose={() => setStudyDetailOpen(false)} title="Study Details" width="860px">
        {activeStudyForDetail && (
          <div>
            <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid #334155', marginBottom: 32 }}>
              {['Overview', 'Timeline', 'Enrollment', 'Documents', 'Team'].map(tab => (
                <button key={tab} onClick={() => setCardChartTabs({...cardChartTabs, [`detail_${activeStudyForDetail.id}`]: tab})} style={{ background: 'none', border: 'none', padding: '0 0 16px 0', borderBottom: (cardChartTabs[`detail_${activeStudyForDetail.id}`] || 'Overview') === tab ? '3px solid #2563eb' : '3px solid transparent', color: (cardChartTabs[`detail_${activeStudyForDetail.id}`] || 'Overview') === tab ? '#2563eb' : '#64748b', fontWeight: 800, fontSize: 16, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {tab}
                </button>
              ))}
            </div>
            
            {(cardChartTabs[`detail_${activeStudyForDetail.id}`] || 'Overview') === 'Overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 56px' }}>
                <div><div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8, letterSpacing: '0.05em' }}>Principal Investigator</div><div style={{ fontSize: 18, color: '#f1f5f9', fontWeight: 700 }}>{activeStudyForDetail.pi}</div></div>
                <div><div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8, letterSpacing: '0.05em' }}>Assigned Site</div><div style={{ fontSize: 18, color: '#f1f5f9', fontWeight: 700 }}>{activeStudyForDetail.site}</div></div>
                <div><div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8, letterSpacing: '0.05em' }}>Study Type & Area</div><div style={{ fontSize: 18, color: '#f1f5f9', fontWeight: 700 }}>{activeStudyForDetail.studyType} • {activeStudyForDetail.researchArea}</div></div>
                <div><div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8, letterSpacing: '0.05em' }}>IRB Status</div><div><StatusBadge status={activeStudyForDetail.irbStatus} /></div></div>
                <div><div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8, letterSpacing: '0.05em' }}>Start Date</div><div style={{ fontSize: 18, color: '#f1f5f9', fontWeight: 700 }}>{activeStudyForDetail.startDate}</div></div>
                <div><div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8, letterSpacing: '0.05em' }}>Estimated End Date</div><div style={{ fontSize: 18, color: '#f1f5f9', fontWeight: 700 }}>{activeStudyForDetail.endDate}</div></div>
              </div>
            )}

            {(cardChartTabs[`detail_${activeStudyForDetail.id}`] || 'Overview') === 'Timeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '8px 0' }}>
                {activeStudyForDetail.milestones.map((m:any, i:number) => (
                  <div key={i} style={{ display: 'flex', gap: 24 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: m.status === 'completed' ? '#10b981' : '#334155', border: `4px solid ${m.status==='completed'?'rgba(16,185,129,0.2)':'transparent'}`, marginTop: 4, flexShrink:0 }} />
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: m.status === 'completed' ? '#f1f5f9' : '#94a3b8' }}>{m.label}</div>
                      <div style={{ fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: 500 }}>{m.date} {m.notes && `• ${m.notes}`}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(cardChartTabs[`detail_${activeStudyForDetail.id}`] || 'Overview') === 'Documents' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {!activeStudyForDetail.documents?.length ? <div style={{ color: '#64748b', fontSize: 16, fontWeight: 500 }}>No documents uploaded.</div> : 
                  activeStudyForDetail.documents.map((d:any) => (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: 20, borderRadius: 12, border: '1px solid #334155' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#f1f5f9' }}>{d.type} <span style={{ color: '#64748b', fontWeight: 500, fontSize: 14 }}>v{d.version}</span></div>
                        <div style={{ fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: 500 }}>{d.title} • {d.date}</div>
                      </div>
                      <button onClick={() => {
                setConfirmModal({
                  title: 'Select Download Format',
                  message: `How would you like to download "${d.title}"?`,
                  buttons: [
                    { label: 'Download PDF', color: '#2563eb', onClick: () => { downloadFile(`PDF Content: ${d.title}`, `${d.title}.pdf`, 'application/pdf'); addToast({ type: 'success', message: 'PDF generated successfully.' }); } },
                    { label: 'Download CSV', color: '#10b981', onClick: () => { downloadFile(`CSV Content: ${d.title}`, `${d.title}.csv`, 'text/csv'); addToast({ type: 'success', message: 'CSV generated successfully.' }); } }
                  ]
                });
              }} style={{ background: 'transparent', border: '2px solid #334155', color: '#f1f5f9', padding: '12px 24px', borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s' }}>
                ⬇ Download
              </button>
            </div>
                  ))
                }
              </div>
            )}

            {(cardChartTabs[`detail_${activeStudyForDetail.id}`] || 'Overview') === 'Team' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                {activeStudyForDetail.team.map((t:any, i:number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                      {t.name.split(' ').map((n:string)=>n[0]).join('').substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 17, color: '#f1f5f9', letterSpacing: '-0.01em' }}>{t.name}</div>
                      <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600, marginTop: 2, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{t.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(cardChartTabs[`detail_${activeStudyForDetail.id}`] || 'Overview') === 'Enrollment' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: 16, padding: 24, textAlign: 'center' }}>
                    <div style={{ fontSize: 42, fontWeight: 900, color: '#3b82f6', letterSpacing: '-0.02em' }}>{activeStudyForDetail.enrollment.current}</div>
                    <div style={{ fontSize: 14, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginTop: 4 }}>Enrolled</div>
                  </div>
                  <div style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: 16, padding: 24, textAlign: 'center' }}>
                    <div style={{ fontSize: 42, fontWeight: 900, color: '#94a3b8', letterSpacing: '-0.02em' }}>{activeStudyForDetail.enrollment.target}</div>
                    <div style={{ fontSize: 14, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginTop: 4 }}>Target</div>
                  </div>
                  <div style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: 16, padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <ProgressRing pct={activeStudyForDetail.enrollment.current/activeStudyForDetail.enrollment.target*100} width={64} stroke={6} />
                    <div style={{ fontSize: 14, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginTop: 12 }}>Overall Progress</div>
                  </div>
                </div>
                <div style={{ height: 260, background: '#0f172a', borderRadius: 16, border: '1px solid #334155', padding: 24 }}>
                   <div style={{ fontSize: 13, fontWeight: 800, color: '#64748b', letterSpacing: '0.1em', marginBottom: 20, textTransform: 'uppercase' }}>ENROLLMENT HISTORY</div>
                   <LineChart data={activeStudyForDetail.enrollmentHistory} target={activeStudyForDetail.enrollment.target} />
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
