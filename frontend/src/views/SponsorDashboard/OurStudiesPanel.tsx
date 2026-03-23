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

export default function OurStudiesPanel({ protocols, setProtocols, addToast }: any) {
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
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto', color: '#f1f5f9' }}>
      <div style={{ position: 'sticky', top: 57, background: '#0f172a', zIndex: 40, paddingBottom: 16, paddingTop: 16, borderBottom: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: 24, color: '#f1f5f9' }}>Our Studies</h1>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Sponsor Portal → Our Studies</div>
          </div>
          <button onClick={() => addToast({type:'info', message:'New Inquiry form mapped to Dashboard panel.'})} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            + New Study Inquiry
          </button>
        </div>
        
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 14, marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', border: '1px solid #334155' }}>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by study name or ID..." style={{ flex: 1, minWidth: 200, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '10px 14px', borderRadius: 8, outline: 'none' }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '10px 14px', borderRadius: 8, outline: 'none' }}>
            {['All', 'Active', 'Recruiting', 'Completed', 'On Hold', 'Cancelled', 'Under Review'].map(s => <option key={s} value={s}>{s} Status</option>)}
          </select>
          <select value={sortMode} onChange={e => setSortMode(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '10px 14px', borderRadius: 8, outline: 'none' }}>
            <option>Latest First</option><option>Oldest First</option><option>A–Z</option><option>By Enrollment %</option>
          </select>
          <div style={{ background: '#334155', width: 1, height: 24, margin: '0 8px' }} />
          <button onClick={() => setExpandedCards(new Set(filteredStudies.map((p:any)=>p.id)))} style={{ background: 'transparent', border: '1px solid #334155', color: '#f1f5f9', padding: '10px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Expand All</button>
          <button onClick={() => setExpandedCards(new Set())} style={{ background: 'transparent', border: 'none', color: '#94a3b8', padding: '10px', fontWeight: 600, cursor: 'pointer' }}>Collapse All</button>
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
              }} style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>{study.title}</h3>
                    {study.indication && <span style={{ background: '#334155', color: '#cbd5e1', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{study.indication}</span>}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b', marginTop: 4 }}>{study.id}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: study.studyMode === 'Virtual' ? '#60a5fa' : study.studyMode === 'Hybrid' ? '#10b981' : '#a5b4fc', padding: '4px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)' }}>{study.studyMode}</span>
                  <StatusBadge status={study.status} />
                  <div style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#64748b' }}>▼</div>
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
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid #334155' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', marginBottom: 12 }}>STUDY DETAILS</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                      <div><div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Principal Investigator</div><div style={{ fontSize: 13, color: '#f1f5f9' }}>{study.pi}</div></div>
                      <div><div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Assigned Site</div><div style={{ fontSize: 13, color: '#f1f5f9' }}>{study.site}</div></div>
                      <div><div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Study Timeline</div><div style={{ fontSize: 13, color: '#f1f5f9' }}>{study.startDate} — {study.endDate}</div></div>
                      <div><div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>IRB Status</div><div><StatusBadge status={study.irbStatus} /></div></div>
                    </div>
                  </div>

                  {/* Row 2 - KPIs */}
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid #334155', overflowX: 'auto' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', marginBottom: 12 }}>KEY PERFORMANCE INDICATORS</div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ minWidth: 140, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>Status</div>
                        <StatusBadge status={study.status} />
                      </div>
                      <div style={{ minWidth: 140, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Enrolled</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6' }}>{study.enrollment.current}</div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>/ {study.enrollment.target} TARGET</div>
                        </div>
                        <ProgressRing pct={study.enrollment.current/study.enrollment.target*100} width={36} stroke={4} />
                      </div>
                      <div style={{ minWidth: 140, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Completed</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>{study.kpis.completed}</div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>/ {study.kpis.targetCompleted} TARGET</div>
                        </div>
                        <ProgressRing pct={study.kpis.completed/study.kpis.targetCompleted*100} width={36} stroke={4} />
                      </div>
                      <div style={{ minWidth: 140, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>Recruitment Complete</div>
                        <div style={{ color: study.kpis.recruitmentCompleted ? '#10b981' : '#f59e0b', fontWeight: 600, fontSize: 14 }}>{study.kpis.recruitmentCompleted ? 'Yes' : 'No'}</div>
                      </div>
                      <div style={{ minWidth: 140, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>Latest Report</div>
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
                  <div style={{ padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => { setStudyDetailId(study.id); setStudyDetailOpen(true); }} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>View Detailed Study →</button>
                      <button onClick={() => { setReportsStudyId(study.id); setReportsModalOpen(true); }} style={{ background: 'transparent', color: '#6366f1', border: '1px solid #334155', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>View Reports →</button>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => {
                        const csv = 'ParticipantID,Arm,Status\n' + generateParticipants(study.id).map(p => `${p.id},${p.arm},${p.status}`).join('\n');
                        downloadCSV(csv, `${study.id}_Export.csv`);
                        addToast({type:'success', message:'Downloaded de-identified CSV'});
                      }} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>⬇ Download CSV Menu</button>
                      <button onClick={() => { setComposeStudyContext(study); setComposeMsg({to:`${study.title} Team`, subject:'', message:''}); setComposeModalOpen(true); }} style={{ background: 'transparent', color: '#94a3b8', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Message Study Team</button>
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
            <div key={i} style={{ background: '#0f172a', padding: 16, borderRadius: 8, border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontWeight: 600, color: '#f1f5f9' }}>{r.name}</div><div style={{ fontSize: 12, color: '#64748b' }}>{r.date} • {r.status}</div></div>
              <button onClick={() => { downloadFile(r.name, `${r.name}.txt`); addToast({type:'success', message:`Downloaded ${r.name}`}) }} style={{ background: 'transparent', border: '1px solid #334155', color: '#f1f5f9', padding: '6px 12px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>Download</button>
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

      <ConfirmModal confirmModal={confirmModal} setConfirmModal={setConfirmModal} />
    </div>
  );
}
