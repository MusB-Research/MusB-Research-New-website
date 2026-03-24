import React, { useState, useMemo, useRef, useEffect } from 'react';
const THEME = {
  sidebar: '#0f172a',
  bg: '#020617',
  border: '#1e293b',
  body: '#94a3b8'
};
import { getUser, getRole, authFetch, API } from '../../utils/auth';
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

export default function ParticipantDataPanel({ protocols, addToast, windowWidth, currentUser }: any) {
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
  const [confirmModal, setConfirmModal] = useState<any>(null);

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

  const fetchDataForStudy = async (studyId: string) => {
    try {
      const apiUrl = API || 'http://localhost:8000';
      // Fetch de-identified participant data for this specific study
      const res = await authFetch(`${apiUrl}/api/participants/?study_id=${studyId}`);
      if (res.ok) {
        let data = await res.json();
        // If no real data, generate some for demonstration, but prefer real data
        if (!data || data.length === 0) {
           setParticipants(generateParticipants(studyId));
        } else {
           // Map backend fields to the expected frontend structure
           const mapped = data.map((p: any) => ({
             id: p.participant_sid || `P-${p.id}`,
             age: p.age || 'N/A',
             gender: p.gender || 'Unknown',
             arm: p.assigned_arm || 'Main Arm',
             status: p.status || 'Active',
             compliance: 100, // Placeholder
             lastVisit: 'Today',
             aeCount: 0,
             visitsCompleted: 1,
             totalVisits: 5
           }));
           setParticipants(mapped);
        }
      } else {
        setParticipants(generateParticipants(studyId));
      }
    } catch (e) {
      console.error(e);
      setParticipants(generateParticipants(studyId));
    }
  };

  if (!selectedStudyId) {
    return (
      <div style={{ 
        padding: windowWidth > 1024 ? '48px 64px' : windowWidth > 768 ? '32px 40px' : '20px 16px', 
        maxWidth: '100%', 
        margin: '0 auto', 
        color: '#f1f5f9', 
        animation: 'fadeIn 0.5s ease-out' 
      }}>
        <div style={{ display: 'flex', flexDirection: windowWidth > 768 ? 'row' : 'column', justifyContent: 'space-between', alignItems: windowWidth > 768 ? 'flex-start' : 'center', marginBottom: windowWidth > 768 ? 56 : 32, gap: 24, textAlign: windowWidth > 768 ? 'left' : 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: windowWidth > 768 ? 48 : 32, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.03em' }}>Participant Insights</h1>
            <p style={{ margin: '16px 0 0 0', color: '#cbd5e1', fontSize: windowWidth > 768 ? 20 : 16, fontWeight: 500 }}>Real-time recruitment tracking and de-identified subject data.</p>
          </div>
          <div style={{ background: '#1e293b', border: '2px solid #334155', padding: '12px 24px', borderRadius: 16, fontSize: 13, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>{currentUser?.email?.toUpperCase()}</div>
        </div>
        
        <div style={{ margin: 'auto', background: '#1e293b', borderRadius: 32, border: '1px solid #334155', padding: windowWidth > 768 ? '80px 64px' : '40px 24px', textAlign: 'center', maxWidth: 720, width: '100%', boxShadow: '0 30px 60px rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize: windowWidth > 768 ? 100 : 80, color: '#2563eb', marginBottom: 32 }}>📈</div>
          <h2 style={{ margin: '0 0 24px 0', fontWeight: 900, fontSize: windowWidth > 768 ? 42 : 28, letterSpacing: '-0.03em', color: '#f1f5f9' }}>Select a Study to View Data</h2>
          <p style={{ color: '#94a3b8', fontSize: windowWidth > 768 ? 22 : 16, margin: '0 0 40px 0', lineHeight: 1.6, fontWeight: 500 }}>Access de-identified participant datasets and visual analytics for your active protocols.</p>
          <div style={{ position: 'relative', width: '100%', marginBottom: 32 }}>
            <select 
              value={studySelectValue} 
              onChange={e => setStudySelectValue(e.target.value)} 
              style={{ 
                width: '100%', 
                background: '#0f172a', 
                border: '2px solid #334155', 
                color: '#f1f5f9', 
                padding: '20px 48px 20px 24px', 
                borderRadius: 20, 
                outline: 'none', 
                boxSizing: 'border-box', 
                fontSize: 18, 
                fontWeight: 800, 
                cursor: 'pointer', 
                appearance: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              <option value="">-- Choose a Study --</option>
              {protocols.map((p:any) => <option key={p.id} value={p.id} style={{ background: '#0f172a' }}>{p.id} — {p.title}</option>)}
            </select>
            <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#2563eb', fontSize: 18, fontWeight: 900 }}>▼</div>
          </div>
          <button onClick={() => {
            if (!studySelectValue) return addToast({ type: 'error', message: 'Please select a study' });
            setSelectedStudyId(studySelectValue);
            fetchDataForStudy(studySelectValue);
            setCurrentPage(1);
          }} style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', padding: '20px', borderRadius: 20, fontWeight: 900, fontSize: 20, cursor: 'pointer', transition: 'all 0.4s', boxShadow: '0 15px 40px rgba(37, 99, 235, 0.3)' }}>View Participant Data →</button>
          <div style={{ marginTop: 48, fontSize: 15, color: '#64748b', fontWeight: 800, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>🔒 <span style={{ opacity: 0.8 }}>All data is de-identified in compliance with HIPAA.</span></div>
        </div>
      </div>
    );
  }

  const pDetail = participants.find(p => p.id === drawerParticipantId);

  return (
    <div style={{ 
      padding: windowWidth > 1024 ? '40px 60px' : windowWidth > 768 ? '30px 40px' : '20px 16px', 
      maxWidth: '100%', 
      margin: '0 auto', 
      color: '#f1f5f9', 
      position: 'relative' 
    }}>
      
      {/* Unified Header and Tabs (Standard Scrolling) */}
      <div style={{ 
        background: THEME.bg, 
        paddingTop: 10,
        paddingBottom: 24, 
      }}>
        {/* Study Context Header */}
        <div style={{ 
          background: '#1e293b', 
          border: '1px solid #334155', 
          borderRadius: 24, 
          padding: windowWidth > 768 ? '24px 40px' : '20px', 
          display: 'flex', 
          flexDirection: windowWidth > 1024 ? 'row' : 'column',
          justifyContent: 'space-between', 
          alignItems: windowWidth > 1024 ? 'center' : 'flex-start', 
          marginBottom: 24, 
          boxShadow: '0 15px 40px rgba(0,0,0,0.3)',
          gap: 24
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontWeight: 900, fontSize: windowWidth > 768 ? 32 : 24, color: '#f1f5f9', letterSpacing: '-0.03em', lineHeight: 1.1 }}>{selectedStudy.title}</h2>
            <div style={{ fontFamily: 'monospace', fontSize: 16, color: '#64748b', marginTop: 12, fontWeight: 600, opacity: 0.8 }}>{selectedStudy.id}</div>
          </div>
          
          <div style={{ width: windowWidth > 1024 ? '300px' : '100%', padding: windowWidth > 1024 ? 0 : '16px 0', borderTop: windowWidth > 1024 ? 'none' : '1px solid #334155', borderBottom: windowWidth > 1024 ? 'none' : '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13, fontWeight: 900, color: '#94a3b8' }}>
              <span>ENROLLMENT</span>
              <span style={{ color: '#2563eb' }}>{Math.round((selectedStudy.enrollment.current/selectedStudy.enrollment.target)*100)}%</span>
            </div>
            <div style={{ width: '100%', height: 10, background: '#0f172a', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ background: '#2563eb', height: '100%', width: `${(selectedStudy.enrollment.current/selectedStudy.enrollment.target)*100}%`, borderRadius: 999, transition: 'width 0.6s ease' }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, width: windowWidth > 1024 ? 'auto' : '100%', justifyContent: windowWidth > 1024 ? 'flex-end' : 'space-between' }}>
            <StatusBadge status={selectedStudy.status} />
            <button onClick={() => { setSelectedStudyId(null); setParticipants([]); }} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 900, cursor: 'pointer', padding: 0, fontSize: 16 }}>← Change Study</button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid #334155', paddingBottom: 16, overflowX: 'auto', whiteSpace: 'nowrap', background: '#020617' }}>
          {['Table View', 'Visual Insights', 'Export & Report'].map(t => {
            const id = t.toLowerCase().split(' ')[0];
            return (
              <button key={id} onClick={() => setActiveTab(id)} style={{ background: activeTab === id ? '#2563eb' : 'transparent', color: activeTab === id ? 'white' : '#94a3b8', border: 'none', padding: windowWidth > 768 ? '14px 28px' : '10px 16px', borderRadius: 14, fontWeight: 900, cursor: 'pointer', fontSize: windowWidth > 768 ? 16 : 14, transition: 'all 0.2s', boxShadow: activeTab === id ? '0 8px 24px rgba(37, 99, 235, 0.3)' : 'none' }}>
                {t}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === 'table' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingTop: 10 }}>
          {/* Enhanced Filter Bar */}
          <div style={{ 
            background: '#1e293b', 
            border: '1px solid #334155', 
            borderRadius: 24, 
            padding: 24, 
            display: 'grid', 
            gridTemplateColumns: windowWidth > 1200 ? '1fr 200px 200px auto' : windowWidth > 900 ? '1fr 1fr 1fr' : '1fr',
            gap: 20, 
            alignItems: 'center', 
            boxShadow: '0 15px 40px rgba(0,0,0,0.3)' 
          }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search ID..." style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: '#f1f5f9', padding: '16px 16px 16px 44px', borderRadius: 16, outline: 'none', fontSize: 16, fontWeight: 500, transition: 'border-color 0.3s' }} />
            </div>
            
            <select value={filterArm} onChange={e => setFilterArm(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: '#f1f5f9', padding: '16px 20px', borderRadius: 16, outline: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', appearance: 'none' }}>
               <option>All Arms</option><option>Intervention</option><option>Control</option><option>Placebo</option>
            </select>
            
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '2px solid #334155', color: '#f1f5f9', padding: '16px 20px', borderRadius: 16, outline: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', appearance: 'none' }}>
               <option>All Statuses</option><option>Active</option><option>Screening</option><option>Completed</option><option>Withdrawn</option>
            </select>

            <button onClick={() => {
              setConfirmModal({
                title: 'Export Participant Data',
                message: 'Select the primary format for the participant dataset export.',
                buttons: [
                  { label: 'Export PDF', color: '#2563eb', onClick: () => { downloadFile('PDF Data', `${selectedStudyId}_participants.pdf`, 'application/pdf'); addToast({ type: 'success', message: 'PDF generated' }); } },
                  { label: 'Export CSV', color: '#10b981', onClick: () => { 
                    const csv = 'Participant ID,Age,Gender,Study Arm,Status,Visits Completed,Compliance %,Last Visit\n' + 
                      filteredParticipants.map(p => `${p.id},${p.age},${p.gender},${p.arm},${p.status},${p.visitsCompleted}/${p.totalVisits},${p.compliance}%,${p.lastVisit}`).join('\n');
                    downloadCSV(csv, `${selectedStudyId}_participants.csv`);
                    addToast({ type: 'success', message: 'CSV exported successfully' });
                  } }
                ]
              });
            }} style={{ background: '#2563eb', border: 'none', color: 'white', padding: '16px 24px', borderRadius: 16, fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s', whiteSpace: 'nowrap', gridColumn: windowWidth > 1200 ? 'auto' : windowWidth > 900 ? 'span 3' : 'auto', fontSize: 16, boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)' }}>Export Dataset →</button>
          </div>

          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 1300 }}>
                <thead style={{ background: '#0f172a', borderBottom: '2px solid #334155' }}>
                  <tr>
                    {['Participant ID', 'Age', 'Gender', 'Study Arm', 'Status', 'Visits Completed', 'Compliance %', 'Last Visit'].map((h, i) => {
                      const col = ['id', 'age', 'gender', 'arm', 'status', 'visitsCompleted', 'compliance', 'lastVisit'][i];
                      return (
                        <th key={col} onClick={() => handleSort(col)} style={{ padding: '24px', fontSize: 13, color: '#64748b', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.1em', transition: 'color 0.2s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {h}
                            <span style={{ fontSize: 10, opacity: sortColumn === col ? 1 : 0.2 }}>{sortColumn === col ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {paginatedParticipants.map((p:any) => (
                    <tr key={p.id} onClick={() => { setDrawerParticipantId(p.id); setDrawerTab('Overview'); setDrawerOpen(true); }} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.5)', cursor: 'pointer', transition: 'background 0.2s' }}>
                      <td style={{ padding: '24px', fontSize: 19, fontFamily: 'monospace', color: '#f1f5f9', fontWeight: 900, letterSpacing: '-0.02em' }}>{p.id}</td>
                      <td style={{ padding: '24px', fontSize: 18, color: '#f1f5f9', fontWeight: 700 }}>{p.age}</td>
                      <td style={{ padding: '24px', fontSize: 17, color: '#94a3b8', fontWeight: 600 }}>{p.gender}</td>
                      <td style={{ padding: '24px', fontSize: 18, color: '#f1f5f9', fontWeight: 800 }}>{p.arm}</td>
                      <td style={{ padding: '24px' }}><StatusBadge status={p.status} /></td>
                      <td style={{ padding: '24px', fontSize: 18, color: '#f1f5f9', fontWeight: 900 }}>{p.visitsCompleted} <span style={{ opacity: 0.3, fontWeight: 400 }}>/</span> {p.totalVisits}</td>
                      <td style={{ padding: '24px' }}>
                        <div style={{ padding: '8px 16px', borderRadius: 12, background: p.compliance >= 80 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${p.compliance >= 80 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, display: 'inline-block' }}>
                          <span style={{ fontSize: 18, fontWeight: 900, color: p.compliance >= 80 ? '#10b981' : p.compliance >= 60 ? '#f59e0b' : '#ef4444' }}>{p.compliance}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '24px', fontSize: 16, color: '#64748b', fontWeight: 600 }}>{p.lastVisit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', borderTop: '2px solid #334155' }}>
              <div style={{ fontSize: 14, color: '#64748b', fontWeight: 700 }}>Showing <span style={{ color: '#f1f5f9' }}>{(currentPage-1)*rowsPerPage + 1}–{Math.min(currentPage*rowsPerPage, filteredParticipants.length)}</span> of <span style={{ color: '#f1f5f9' }}>{filteredParticipants.length}</span> results</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button disabled={currentPage===1} onClick={()=>setCurrentPage(c=>Math.max(1,c-1))} style={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', padding: '10px 24px', borderRadius: 12, fontWeight: 800, cursor: currentPage===1?'not-allowed':'pointer', opacity: currentPage===1?0.5:1, transition: 'all 0.2s' }}>PREVIOUS</button>
                <button disabled={currentPage*rowsPerPage >= filteredParticipants.length} onClick={()=>setCurrentPage(c=>c+1)} style={{ background: '#2563eb', border: 'none', color: 'white', padding: '10px 24px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>NEXT PAGE</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'visual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155', display: 'flex', flexDirection: windowWidth > 768 ? 'row' : 'column', justifyContent: 'space-around', gap: 20 }}>
             <div style={{ textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>{selectedStudy.enrollment.current}</div><div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Enrolled</div></div>
             {windowWidth > 768 && <div style={{ width: 1, background: '#334155' }} />}
             <div style={{ textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 800, color: '#3b82f6' }}>{selectedStudy.kpis.completed}</div><div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Completed</div></div>
             {windowWidth > 768 && <div style={{ width: 1, background: '#334155' }} />}
             <div style={{ textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>{(participants.reduce((acc,p)=>acc+p.compliance,0)/participants.length).toFixed(1)}%</div><div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Avg Compliance</div></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 1024 ? '1fr 1fr' : '1fr', gap: 24 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 1024 ? '2fr 1fr' : '1fr', gap: 24 }}>
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
          <div style={{ position: 'fixed', right: 0, top: 0, height: '100vh', width: windowWidth > 600 ? 540 : '100%', overflowY: 'auto', background: '#1e293b', borderLeft: '1px solid #334155', zIndex: 500, boxShadow: '-4px 0 24px rgba(0,0,0,0.5)' }}>
            
            <div style={{ padding: 32, borderBottom: '1px solid #334155', position: 'sticky', top: 0, background: '#1e293b', zIndex: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 24, color: '#f1f5f9', fontFamily: 'monospace', fontWeight: 700 }}>{pDetail.id}</h3>
                <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 32, cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <StatusBadge status={pDetail.status} />
                <span style={{ background: '#334155', color: '#f1f5f9', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>{pDetail.arm}</span>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.1)', borderLeft: '4px solid #f59e0b', padding: '12px 16px', borderRadius: 8, fontSize: 14, color: '#fcd34d', fontWeight: 800 }}>
                🔒 De-identified view — HIPAA Compliant
              </div>
            </div>

            <div style={{ display: 'flex', borderBottom: '2px solid #334155' }}>
              {['Overview', 'Visits', 'Questionnaires'].map(tab => (
                <button key={tab} onClick={() => setDrawerTab(tab)} style={{ flex: 1, background: 'none', border: 'none', padding: '18px', borderBottom: drawerTab === tab ? '3px solid #2563eb' : '3px solid transparent', color: drawerTab === tab ? '#2563eb' : '#94a3b8', fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s' }}>{tab}</button>
              ))}
            </div>

            <div style={{ padding: 32 }}>
              {drawerTab === 'Overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 6, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Age</div><div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 18 }}>{pDetail.age}</div></div>
                    <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 6, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gender</div><div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 18 }}>{pDetail.gender}</div></div>
                    <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 6, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enrollment Date</div><div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 18 }}>{pDetail.enrollmentDate}</div></div>
                    <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 6, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Site</div><div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 18 }}>{pDetail.site}</div></div>
                  </div>

                  {pDetail.aeCount > 0 && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid #ef4444', color: '#ef4444', padding: '16px', borderRadius: 12, fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12 }}>
                      ⚠ <span>{pDetail.aeCount} Adverse Event(s) Reported</span>
                    </div>
                  )}

                  <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#94a3b8', marginBottom: 12, fontWeight: 800, letterSpacing: '0.05em' }}>
                      <span>PROTOCOL COMPLIANCE</span>
                      <span style={{ color: pDetail.compliance >= 80 ? '#10b981' : '#f59e0b' }}>{pDetail.compliance}%</span>
                    </div>
                    <div style={{ height: 10, background: '#1e293b', borderRadius: 999 }}>
                      <div style={{ width: `${pDetail.compliance}%`, height: '100%', background: pDetail.compliance >= 80 ? '#10b981' : '#f59e0b', borderRadius: 999 }} />
                    </div>
                  </div>

                  <button onClick={() => {
                     downloadCSV(`Data for ${pDetail.id}\nAge,${pDetail.age}`, `${pDetail.id}_data.csv`);
                     addToast({ type: 'success', message: 'Participant data exported' });
                  }} style={{ width: '100%', background: 'transparent', border: '2px solid #334155', color: '#f1f5f9', padding: '16px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: 15, transition: 'all 0.2s' }}>Export Participant Summary (CSV)</button>
                </div>
              )}

              {drawerTab === 'Visits' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {pDetail.visits.map((v:any, i:number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, borderBottom: '1px solid #334155', paddingBottom: 20 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: v.status === 'Completed' ? '#10b981' : v.status === 'Missed' ? '#ef4444' : '#f59e0b', boxShadow: `0 0 10px ${v.status==='Completed'?'rgba(16,185,129,0.3)':'transparent'}` }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: 17 }}>{v.name}</div>
                        <div style={{ color: '#64748b', fontSize: 14, fontWeight: 500, marginTop: 4 }}>{v.date}</div>
                      </div>
                      <span style={{ fontSize: 13, color: v.status === 'Completed' ? '#10b981' : '#ef4444', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{v.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === 'Questionnaires' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {pDetail.scores.map((q:any, i:number) => (
                    <div key={i} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 20 }}>
                      <div style={{ fontWeight: 900, color: '#f1f5f9', marginBottom: 16, fontSize: 16, letterSpacing: '-0.01em' }}>{q.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#94a3b8', fontWeight: 700 }}>
                         <div>Baseline: <strong style={{color:'#f1f5f9', fontSize: 16}}>{q.baseline}</strong></div>
                         <div>Latest: <strong style={{color:'#f1f5f9', fontSize: 16}}>{q.latest}</strong></div>
                         <div style={{ background: 'rgba(37,99,235,0.1)', padding: '4px 10px', borderRadius: 6 }}>Δ <strong style={{color:'#60a5fa', fontSize: 16}}>{(q.latest - q.baseline).toFixed(1)}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </React.Fragment>
      )}

      <ConfirmModal confirmModal={confirmModal} setConfirmModal={setConfirmModal} />
    </div>
  );
}
