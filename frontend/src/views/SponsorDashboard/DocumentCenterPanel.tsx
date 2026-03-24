import React, { useState, useMemo, useEffect } from 'react';
import { PillButton, StatusBadge, Modal, ConfirmModal, downloadFile } from './SponsorDashboardShared';

export default function DocumentCenterPanel({ protocols, addToast }: any) {
  const [selectedStudyId, setSelectedStudyId] = useState<any>(protocols[0]?.id || null);
  const [studySelectValue, setStudySelectValue] = useState(protocols[0]?.id || '');
  const [filterCategory, setFilterCategory] = useState('All');
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfMeta, setPdfMeta] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<any>(null);
  
  // Auto-select first study if data arrives late
  useEffect(() => {
    if (!selectedStudyId && protocols && protocols.length > 0) {
      setSelectedStudyId(protocols[0].id);
      setStudySelectValue(protocols[0].id);
    }
  }, [protocols, selectedStudyId]);

  const selectedStudy = useMemo(() => protocols.find((p:any) => p.id === selectedStudyId), [protocols, selectedStudyId]);

  const filteredDocs = useMemo(() => {
    if (!selectedStudy) return [];
    let docs = [...selectedStudy.documents];
    if (filterCategory !== 'All') docs = docs.filter(d => d.category === filterCategory);
    docs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return docs;
  }, [selectedStudy, filterCategory]);

  if (!selectedStudyId) {
    return (
      <div style={{ padding: '48px 64px', maxWidth: '100%', margin: '0 auto', color: '#f1f5f9', minHeight: '90vh', animation: 'fadeIn 0.5s ease-out' }}>
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 24, marginBottom: 56, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: 52, color: '#f1f5f9', letterSpacing: '-0.04em', lineHeight: 1.1 }}>Document Vault</h1>
            <div style={{ fontSize: 20, color: '#94a3b8', marginTop: 12, fontWeight: 600 }}>Sponsor Dashboard → <span style={{ color: '#2563eb' }}>Participant Level Data</span></div>
          </div>
        </div>
        <div style={{ margin: 'auto', background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(10px)', borderRadius: 36, border: '1px solid rgba(255,255,255,0.1)', padding: '100px 80px', textAlign: 'center', maxWidth: 850, width: '100%', boxShadow: '0 40px 80px rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize: 120, color: '#2563eb', marginBottom: 48 }}>📖</div>
          <h2 style={{ margin: '0 0 24px 0', fontWeight: 900, fontSize: 48, letterSpacing: '-0.03em', color: '#f1f5f9' }}>Select a Protocol</h2>
          <p style={{ color: '#94a3b8', fontSize: 24, margin: '0 0 64px 0', lineHeight: 1.6, fontWeight: 500 }}>Access your study's secure document repository for de-identified datasets and regulatory files.</p>
          <select value={studySelectValue} onChange={e => setStudySelectValue(e.target.value)} style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '2px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: '24px 32px', borderRadius: 24, outline: 'none', marginBottom: 48, boxSizing: 'border-box', fontSize: 22, fontWeight: 700, appearance: 'none', cursor: 'pointer' }}>
            <option value="">-- Choose a Study --</option>
            {protocols.map((p:any) => <option key={p.id} value={p.id}>{p.id} — {p.title}</option>)}
          </select>
          <button onClick={() => setSelectedStudyId(studySelectValue)} style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', padding: '28px', borderRadius: 24, fontWeight: 900, fontSize: 24, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 15px 40px rgba(37, 99, 235, 0.3)' }}>Open Document Vault →</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '48px 64px', maxWidth: '100%', margin: '0 auto', color: '#f1f5f9' }}>
      
      {/* Sticky Top Bar - Read Only Indicator */}
      <div style={{ position: 'sticky', top: 57, background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(16px)', borderRadius: 28, border: '1px solid rgba(255,255,255,0.05)', padding: '32px 48px', zIndex: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '10px 20px', borderRadius: 14, fontSize: 15, fontWeight: 900, border: '2px solid rgba(245,158,11,0.2)', letterSpacing: '0.05em' }}>
            🔒 READ-ONLY ACCESS
          </div>
          <div>
            <h2 style={{ margin: 0, fontWeight: 900, fontSize: 32, color: '#f1f5f9', letterSpacing: '-0.02em' }}>{selectedStudy.title}</h2>
            <div style={{ fontFamily: 'monospace', fontSize: 17, color: '#64748b', marginTop: 8, fontWeight: 600 }}>Protocol ID: <span style={{ color: '#6366f1' }}>{selectedStudy.id}</span></div>
          </div>
        </div>
        <select value={selectedStudyId} onChange={e => setSelectedStudyId(e.target.value)} style={{ background: '#0f172a', border: '2px solid #334155', color: '#f1f5f9', padding: '18px 24px', borderRadius: 16, outline: 'none', fontWeight: 800, fontSize: 18, cursor: 'pointer' }}>
          {protocols.map((p:any) => <option key={p.id} value={p.id}>{p.id}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 32, overflowX: 'auto', paddingBottom: 16 }}>
        {['All', 'Protocol', 'Consent', 'Regulatory', 'Reports'].map(c => (
          <PillButton key={c} active={filterCategory === c} onClick={() => setFilterCategory(c)} style={{ padding: '12px 24px', fontSize: 15, fontWeight: 800 }}>{c}</PillButton>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {filteredDocs.map((d:any) => (
          <div key={d.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '32px', flex: 1 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                 <div style={{ background: '#0f172a', color: '#94a3b8', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{d.category}</div>
                 <div style={{ color: '#64748b', fontSize: 14, fontWeight: 700 }}>v{d.version}</div>
               </div>
               <h3 style={{ margin: '0 0 12px 0', fontSize: 20, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.4, letterSpacing: '-0.02em' }}>{d.title}</h3>
               <p style={{ margin: 0, fontSize: 15, color: '#94a3b8', lineHeight: 1.6 }}>{d.description}</p>
               
               <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Date Added</span>
                    <span style={{ color: '#f1f5f9', fontWeight: 800 }}>{d.date}</span>
                  </div>
                  {d.expiryDate && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>Expiry Date</span>
                      <span style={{ color: d.expiryDate < new Date().toISOString() ? '#ef4444' : '#f1f5f9', fontWeight: 600 }}>{d.expiryDate}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#64748b' }}>Length</span>
                    <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{d.pageCount} pages</span>
                  </div>
               </div>
            </div>
            <div style={{ background: '#0f172a', padding: '24px 32px', borderTop: '1px solid #334155', display: 'flex', gap: 16 }}>
              <button onClick={() => { setPdfMeta(d); setPdfModalOpen(true); }} style={{ flex: 1, background: '#2563eb', color: 'white', border: 'none', padding: '16px', borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: 'pointer', transition: 'all 0.3s' }}>View Preview</button>
              <button onClick={() => {
                setConfirmModal({
                  title: 'Secure Download Request',
                  message: `How would you like to export "${d.title}"?`,
                  buttons: [
                    { label: 'Download PDF', color: '#6366f1', onClick: () => { downloadFile(`PDF Data for ${d.title}`, `${d.title}.pdf`, 'application/pdf'); addToast({ type: 'success', message: 'PDF generated' }); } },
                    { label: 'Download CSV', color: '#10b981', onClick: () => { downloadFile(`CSV Data for ${d.title}`, `${d.title}.csv`, 'text/csv'); addToast({ type: 'success', message: 'CSV generated' }); } }
                  ]
                });
              }} style={{ flex: 1, background: 'transparent', border: '2px solid #334155', color: '#f1f5f9', padding: '16px', borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: 'pointer', transition: 'all 0.3s' }}>Download ↓</button>
            </div>
          </div>
        ))}

        {filteredDocs.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, background: '#1e293b', border: '1px solid #334155', borderRadius: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📁</div>
            <h3 style={{ margin: 0, fontSize: 18, color: '#f1f5f9' }}>No "{filterCategory}" documents available</h3>
          </div>
        )}
      </div>

      <Modal open={pdfModalOpen} onClose={() => setPdfModalOpen(false)} title={`${pdfMeta?.title} (v${pdfMeta?.version})`} width="1000px">
        <div style={{ display: 'flex', gap: 24, height: '70vh' }}>
          
          {/* Main Viewer */}
          <div style={{ flex: 1, background: '#cbd5e1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ background: 'white', width: '85%', height: '90%', boxShadow: '0 4px 24px rgba(0,0,0,0.2)', padding: 40, color: '#334155', overflowY: 'auto' }}>
               <h1 style={{ borderBottom: '2px solid #334155', paddingBottom: 16, marginBottom: 24 }}>{pdfMeta?.title}</h1>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, fontSize: 12, color: '#64748b' }}>
                 <div><strong>Study:</strong> {selectedStudy.id}</div>
                 <div><strong>Version:</strong> {pdfMeta?.version}</div>
                 <div><strong>Date:</strong> {pdfMeta?.date}</div>
               </div>
               <p style={{ lineHeight: 1.8, marginBottom: 24 }}>This document is a placeholder for the actual PDF content of <strong>{pdfMeta?.title}</strong>.</p>
               <p style={{ lineHeight: 1.8, marginBottom: 24 }}>{pdfMeta?.description}</p>
               <div style={{ border: '1px dashed #cbd5e1', padding: 24, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', marginTop: 40 }}>
                 [ End of {pdfMeta?.pageCount}-page document ]
               </div>
            </div>
            <div style={{ position: 'absolute', bottom: 16, background: '#1e293b', padding: '8px 16px', borderRadius: 999, display: 'flex', gap: 16, alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
               <button style={{ background:'none', border:'none', color:'white', cursor:'pointer' }}>-</button>
               <span style={{ color:'white', fontSize: 13, fontWeight: 600 }}>100%</span>
               <button style={{ background:'none', border:'none', color:'white', cursor:'pointer' }}>+</button>
               <div style={{ width:1, height:16, background:'#334155' }} />
               <button onClick={() => { downloadFile(`Content of ${pdfMeta?.title}`, `${pdfMeta?.title}.pdf`); addToast({type:'success', message:'PDF Downloaded'}); }} style={{ background:'none', border:'none', color:'#60a5fa', cursor:'pointer', fontWeight: 600, fontSize: 13 }}>Download</button>
            </div>
          </div>

          {/* Version History Sidebar */}
          {pdfMeta?.versions && (
            <div style={{ width: 280, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 16, overflowY: 'auto' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Version History</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {pdfMeta.versions.map((v:any, i:number) => (
                  <div key={i} style={{ position: 'relative', paddingLeft: 16, borderLeft: v.status==='Current'?'2px solid #2563eb':'2px solid #334155' }}>
                     <div style={{ position: 'absolute', left: -5, top: 4, width: 8, height: 8, borderRadius: '50%', background: v.status==='Current'?'#2563eb':'#334155' }} />
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                       <div style={{ fontWeight: 600, color: v.status==='Current'?'#f1f5f9':'#94a3b8', fontSize: 13 }}>v{v.version}</div>
                       <StatusBadge status={v.status} />
                     </div>
                     <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{v.date}</div>
                     {v.notes && <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4, background: '#1e293b', padding: 8, borderRadius: 6, marginTop: 8 }}>{v.notes}</div>}
                     {v.status !== 'Current' && (
                       <button onClick={() => addToast({type:'info', message:`Downloading version ${v.version}`})} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0, marginTop: 8 }}>Download Old Version</button>
                     )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmModal confirmModal={confirmModal} setConfirmModal={setConfirmModal} />
      
      <style>{`
        @keyframes bgMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animated-bg {
          background: linear-gradient(-45deg, #0f172a, #1e293b, #0f172a, #161e2e);
          background-size: 400% 400%;
          animation: bgMove 15s ease infinite;
          min-height: 100vh;
        }
      `}</style>
    </div>
  );
}
