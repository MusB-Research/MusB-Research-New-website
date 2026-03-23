import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SPONSOR, StatusBadge, PillButton, downloadCSV, downloadFile, generateParticipants, Modal, ConfirmModal } from './SponsorDashboardShared';

const FunnelChart = ({ study }: any) => {
  if(!study) return null;
  const stages = [
    { label: 'Screened', count: 120 }, { label: 'Eligible', count: 95 },
    { label: 'Consented', count: 85 }, { label: 'Randomized', count: study.enrollment.current },
    { label: 'Active', count: study.enrollment.current - 5 }, { label: 'Completed', count: study.kpis.completed }
  ];
  const max = 120;
  return (
    <svg width="100%" height="100%" viewBox="0 0 460 200">
      <rect x="0" y="0" width="460" height="200" fill="#0f172a" rx="8" />
      {stages.map((s, i) => {
        const x = 30 + i * (400/stages.length) + 10;
        const h = (s.count / max) * 140;
        return (
          <g key={i}>
            <text x={x + 10} y="180" fill="#64748b" fontSize="10" textAnchor="middle">{s.label}</text>
            <text x={x + 10} y={170 - h - 5} fill="#f1f5f9" fontSize="12" fontWeight="700" textAnchor="middle">{s.count}</text>
            <rect x={x - 10} y={170 - h} width="40" height={h} fill="#2563eb" rx="4" opacity={1 - i*0.1} />
          </g>
        )
      })}
    </svg>
  );
};

export default function ParticipantDataPanel({ protocols, addToast, windowWidth }: any) {
  const [selectedStudyId, setSelectedStudyId] = useState<any>(null);
  const [studySelectValue, setStudySelectValue] = useState('');
  const [activeTab, setActiveTab] = useState('table');
  const [participants, setParticipants] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArm, setFilterArm] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterGender, setFilterGender] = useState('All');
  const [sortColumn, setSortColumn] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [rowsPerPage, setRowsPerPage] = useState<any>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerParticipantId, setDrawerParticipantId] = useState<any>(null);
  const [drawerTab, setDrawerTab] = useState('Overview');
  const [reportFormat, setReportFormat] = useState('PDF');

  const selectedStudy = useMemo(() => protocols.find((p:any) => p.id === selectedStudyId), [protocols, selectedStudyId]);

  const filteredParticipants = useMemo(() => {
    let p = [...participants];
    if (searchQuery) p = p.filter((x:any) => x.id.includes(searchQuery) || x.gender.toLowerCase().includes(searchQuery.toLowerCase()) || x.arm.toLowerCase().includes(searchQuery.toLowerCase()) || x.status.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterArm !== 'All') p = p.filter((x:any) => x.arm === filterArm);
    if (filterStatus !== 'All') p = p.filter((x:any) => x.status === filterStatus);
    if (filterGender !== 'All') p = p.filter((x:any) => x.gender === filterGender);
    
    p.sort((a,b) => {
      const av = a[sortColumn], bv = b[sortColumn];
      if (av === bv) return 0;
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return p;
  }, [participants, searchQuery, filterArm, filterStatus, filterGender, sortColumn, sortDir]);

  const paginatedParticipants = useMemo(() => {
    if (rowsPerPage === 'All') return filteredParticipants;
    const start = (currentPage - 1) * rowsPerPage;
    return filteredParticipants.slice(start, start + rowsPerPage);
  }, [filteredParticipants, currentPage, rowsPerPage]);

  const handleSort = (col: string) => {
    if (sortColumn === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(col); setSortDir('asc'); }
  };

  if (!selectedStudyId) {
    return (
      <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto', color: '#f1f5f9', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ borderBottom: '1px solid #334155', paddingBottom: 16, marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: 24, color: '#f1f5f9' }}>Participant Progress Report</h1>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Sponsor Portal → Participant Progress Report</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700 }}>{SPONSOR.id}</div>
        </div>
        
        <div style={{ margin: 'auto', background: '#1e293b', borderRadius: 16, border: '1px solid #334155', padding: 40, textAlign: 'center', maxWidth: 480, width: '100%' }}>
          <div style={{ fontSize: 64, color: '#2563eb', marginBottom: 24 }}>📈</div>
          <h2 style={{ margin: '0 0 8px 0', fontWeight: 700, fontSize: 20 }}>Select a Study to View Data</h2>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 32px 0' }}>Access de-identified participant datasets and visual analytics for your active protocols.</p>
          <select value={studySelectValue} onChange={e => setStudySelectValue(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '14px', borderRadius: 8, outline: 'none', marginBottom: 24, boxSizing: 'border-box' }}>
            <option value="">-- Choose a Study --</option>
            {protocols.map((p:any) => <option key={p.id} value={p.id}>{p.id} — {p.title}</option>)}
          </select>
          <button onClick={() => {
            if (!studySelectValue) return addToast({ type: 'error', message: 'Please select a study' });
            setSelectedStudyId(studySelectValue);
            setParticipants(generateParticipants(studySelectValue));
            setCurrentPage(1);
          }} style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', padding: '14px', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>View Participant Data</button>
          <div style={{ marginTop: 24, fontSize: 11, color: '#64748b' }}>🔒 All data is de-identified in compliance with HIPAA.</div>
        </div>
      </div>
    );
  }

  const pDetail = participants.find(p => p.id === drawerParticipantId);

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto', color: '#f1f5f9', position: 'relative' }}>
      
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 57, background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '16px 24px', zIndex: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 20 }}>{selectedStudy.title}</h2>
          <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#64748b', marginTop: 4 }}>{selectedStudy.id}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Enrolled: {selectedStudy.enrollment.current} / {selectedStudy.enrollment.target}</div>
          <div style={{ width: 140, height: 6, background: '#334155', borderRadius: 999 }}>
            <div style={{ background: '#2563eb', height: 6, width: `${(selectedStudy.enrollment.current/selectedStudy.enrollment.target)*100}%`, borderRadius: 999 }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <StatusBadge status={selectedStudy.status} />
          <button onClick={() => { setSelectedStudyId(null); setParticipants([]); }} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', padding: 0 }}>← Change Study</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #334155', paddingBottom: 12 }}>
        {['Table View', 'Visual Insights', 'Export & Report'].map(t => {
          const id = t.toLowerCase().split(' ')[0];
          return (
            <button key={id} onClick={() => setActiveTab(id)} style={{ background: activeTab === id ? '#2563eb' : 'transparent', color: activeTab === id ? 'white' : '#64748b', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              {t}
            </button>
          )
        })}
      </div>

      {activeTab === 'table' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search ID..." style={{ flex: 1, minWidth: 150, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '10px 14px', borderRadius: 8, outline: 'none' }} />
            <select value={filterArm} onChange={e => setFilterArm(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '10px 14px', borderRadius: 8, outline: 'none' }}>
               <option>All</option><option>Intervention</option><option>Control</option><option>Placebo</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '10px 14px', borderRadius: 8, outline: 'none' }}>
               <option>All</option><option>Active</option><option>Screening</option><option>Completed</option><option>Withdrawn</option>
            </select>
            <div style={{ background: '#334155', width: 1, height: 24, margin: '0 4px' }} />
            <button onClick={() => {
              const csv = 'Participant ID,Age,Gender,Study Arm,Status,Visits Completed,Compliance %,Last Visit\n' + 
                filteredParticipants.map(p => `${p.id},${p.age},${p.gender},${p.arm},${p.status},${p.visitsCompleted}/${p.totalVisits},${p.compliance}%,${p.lastVisit}`).join('\n');
              downloadCSV(csv, `${selectedStudyId}_participants.csv`);
              addToast({ type: 'success', message: 'CSV exported successfully' });
            }} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '10px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Export CSV</button>
            <button onClick={() => {
              downloadFile('HTML PDF PLACEHOLDER CONTENT', `${selectedStudyId}_report.txt`);
              addToast({ type: 'success', message: 'PDF report triggered' });
            }} style={{ background: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)', padding: '10px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Export PDF</button>
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                <tr>
                  {['Participant ID', 'Age', 'Gender', 'Study Arm', 'Status', 'Visits Completed', 'Compliance %', 'Last Visit'].map((h, i) => {
                    const col = ['id', 'age', 'gender', 'arm', 'status', 'visitsCompleted', 'compliance', 'lastVisit'][i];
                    return (
                      <th key={col} onClick={() => handleSort(col)} style={{ padding: '14px 16px', fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {h} {sortColumn === col ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {paginatedParticipants.map((p:any) => (
                  <tr key={p.id} onClick={() => { setDrawerParticipantId(p.id); setDrawerTab('Overview'); setDrawerOpen(true); }} style={{ borderBottom: '1px solid #334155', cursor: 'pointer' }}>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', color: '#f1f5f9' }}>{p.id}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14 }}>{p.age}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#94a3b8' }}>{p.gender}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#f1f5f9' }}>{p.arm}</td>
                    <td style={{ padding: '14px 16px' }}><StatusBadge status={p.status} /></td>
                    <td style={{ padding: '14px 16px', fontSize: 13 }}>{p.visitsCompleted} / {p.totalVisits}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: p.compliance >= 80 ? '#10b981' : p.compliance >= 60 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>{p.compliance}%</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>{p.lastVisit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{ padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', borderTop: '1px solid #334155' }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>Showing {(currentPage-1)*rowsPerPage + 1}–{Math.min(currentPage*rowsPerPage, filteredParticipants.length)} of {filteredParticipants.length} participants</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button disabled={currentPage===1} onClick={()=>setCurrentPage(c=>Math.max(1,c-1))} style={{ background: 'transparent', border: '1px solid #334155', color: '#f1f5f9', padding: '6px 12px', borderRadius: 6, cursor: currentPage===1?'not-allowed':'pointer', opacity: currentPage===1?0.5:1 }}>Prev</button>
                <button disabled={currentPage*rowsPerPage >= filteredParticipants.length} onClick={()=>setCurrentPage(c=>c+1)} style={{ background: 'transparent', border: '1px solid #334155', color: '#f1f5f9', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>Next</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'visual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155', display: 'flex', justifyContent: 'space-around' }}>
             <div style={{ textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>{selectedStudy.enrollment.current}</div><div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Enrolled</div></div>
             <div style={{ width: 1, background: '#334155' }} />
             <div style={{ textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 800, color: '#3b82f6' }}>{selectedStudy.kpis.completed}</div><div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Completed</div></div>
             <div style={{ width: 1, background: '#334155' }} />
             <div style={{ textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>{(participants.reduce((acc,p)=>acc+p.compliance,0)/participants.length).toFixed(1)}%</div><div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Avg Compliance</div></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>Enrollment Funnel</div>
              <div style={{ height: 260 }}><FunnelChart study={selectedStudy} /></div>
            </div>
            <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                 <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Study Arm Distribution</div>
                 <button onClick={() => addToast({type:'success', message:'Exporting chart as SVG'})} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>Export SVG</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 260 }}>
                 <div style={{ width: 200, height: 200, borderRadius: '50%', border: '40px solid #2563eb', borderLeftColor: '#6366f1', borderBottomColor: '#10b981', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{participants.length}</div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'export' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 32, border: '1px solid #334155' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: 18, color: '#f1f5f9', fontWeight: 800 }}>Generate Study Report</h2>
            
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Report Title</label>
            <input defaultValue={`Sponsor Report - ${selectedStudy.title}`} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', padding: '12px', borderRadius: 8, outline: 'none', marginBottom: 24, boxSizing: 'border-box' }} />
            
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>Include Sections</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {['Study Overview', 'Enrollment Summary', 'Enrollment Funnel', 'Participant List', 'Questionnaires', 'Adverse Events'].map(s => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#f1f5f9', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: '#2563eb' }} /> {s}
                </label>
              ))}
            </div>

            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Format</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
               {['PDF', 'CSV', 'Both'].map(f => (
                 <PillButton key={f} active={reportFormat === f} onClick={() => setReportFormat(f)}>{f}</PillButton>
               ))}
            </div>

            <button onClick={() => {
              addToast({ type: 'success', message: `${reportFormat} Report generated: ${selectedStudy.title}` });
            }} style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', padding: '14px', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              Generate Final Report
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Quick Downloads</div>
            {[
              { label:'Download Raw Dataset (CSV)', icon:'📄' },
              { label:'Download Full Report (PDF)', icon:'📕' },
              { label:'Export All Charts (SVG)', icon:'📊' },
              { label:'Enrollment Funnel (CSV)', icon:'📈' }
            ].map(b => (
              <button key={b.label} onClick={() => addToast({type:'success', message:`Downloaded ${b.label}`})} style={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', padding: '16px', borderRadius: 8, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', fontSize: 14, fontWeight: 600, transition: 'all 0.2s', textAlign: 'left' }}>
                <span style={{ fontSize: 18 }}>{b.icon}</span> {b.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && pDetail && (
        <React.Fragment>
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 490 }} />
          <div style={{ position: 'fixed', right: 0, top: 0, height: '100vh', width: 420, overflowY: 'auto', background: '#1e293b', borderLeft: '1px solid #334155', zIndex: 500, boxShadow: '-4px 0 24px rgba(0,0,0,0.5)' }}>
            
            <div style={{ padding: 24, borderBottom: '1px solid #334155', position: 'sticky', top: 0, background: '#1e293b', zIndex: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 20, color: '#f1f5f9', fontFamily: 'monospace' }}>{pDetail.id}</h3>
                <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 24, cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <StatusBadge status={pDetail.status} />
                <span style={{ background: '#334155', color: '#f1f5f9', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{pDetail.arm}</span>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.1)', borderLeft: '3px solid #f59e0b', padding: '8px 12px', borderRadius: 4, fontSize: 12, color: '#fcd34d', fontWeight: 600 }}>
                🔒 De-identified view — no personal identifiers displayed
              </div>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid #334155' }}>
              {['Overview', 'Visits', 'Questionnaires'].map(tab => (
                <button key={tab} onClick={() => setDrawerTab(tab)} style={{ flex: 1, background: 'none', border: 'none', padding: '14px', borderBottom: drawerTab === tab ? '2px solid #2563eb' : '2px solid transparent', color: drawerTab === tab ? '#2563eb' : '#94a3b8', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{tab}</button>
              ))}
            </div>

            <div style={{ padding: 24 }}>
              {drawerTab === 'Overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div><div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Age</div><div style={{ color: '#f1f5f9', fontWeight: 600 }}>{pDetail.age}</div></div>
                    <div><div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Gender</div><div style={{ color: '#f1f5f9', fontWeight: 600 }}>{pDetail.gender}</div></div>
                    <div><div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Enrollment Date</div><div style={{ color: '#f1f5f9', fontWeight: 600 }}>{pDetail.enrollmentDate}</div></div>
                    <div><div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Assigned Site</div><div style={{ color: '#f1f5f9', fontWeight: 600 }}>{pDetail.site}</div></div>
                  </div>

                  {pDetail.aeCount > 0 && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                      ⚠ {pDetail.aeCount} Adverse Event(s) Reported
                    </div>
                  )}

                  <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>
                      <span>Protocol Compliance</span>
                      <span style={{ color: pDetail.compliance >= 80 ? '#10b981' : '#f59e0b' }}>{pDetail.compliance}%</span>
                    </div>
                    <div style={{ height: 6, background: '#1e293b', borderRadius: 999 }}>
                      <div style={{ width: `${pDetail.compliance}%`, height: '100%', background: pDetail.compliance >= 80 ? '#10b981' : '#f59e0b', borderRadius: 999 }} />
                    </div>
                  </div>

                  <button onClick={() => {
                     downloadCSV(`Data for ${pDetail.id}\nAge,${pDetail.age}`, `${pDetail.id}_data.csv`);
                     addToast({ type: 'success', message: 'Participant data exported' });
                  }} style={{ width: '100%', background: 'transparent', border: '1px solid #334155', color: '#f1f5f9', padding: '12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Export Participant Summary (CSV)</button>
                </div>
              )}

              {drawerTab === 'Visits' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {pDetail.visits.map((v:any, i:number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid #334155', paddingBottom: 16 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: v.status === 'Completed' ? '#10b981' : v.status === 'Missed' ? '#ef4444' : '#f59e0b' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 14 }}>{v.name}</div>
                        <div style={{ color: '#94a3b8', fontSize: 13 }}>{v.date}</div>
                      </div>
                      <span style={{ fontSize: 12, color: v.status === 'Completed' ? '#10b981' : '#ef4444', fontWeight: 600 }}>{v.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === 'Questionnaires' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {pDetail.scores.map((q:any, i:number) => (
                    <div key={i} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 16 }}>
                      <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 12 }}>{q.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8' }}>
                         <div>Baseline: <strong style={{color:'#f1f5f9'}}>{q.baseline}</strong></div>
                         <div>Latest: <strong style={{color:'#f1f5f9'}}>{q.latest}</strong></div>
                         <div>Δ <strong style={{color:'#2563eb'}}>{(q.latest - q.baseline).toFixed(1)}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </React.Fragment>
      )}

    </div>
  );
}
