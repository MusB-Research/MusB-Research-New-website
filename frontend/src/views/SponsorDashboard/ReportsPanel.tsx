import React, { useState, useMemo } from 'react';
import { StatusBadge, Modal, ConfirmModal, downloadFile, PillButton } from './SponsorDashboardShared';

export default function ReportsPanel({ protocols, addToast }: any) {
  const [selectedStudyId, setSelectedStudyId] = useState<any>(protocols[0]?.id || 'All');
  const [confirmModal, setConfirmModal] = useState<any>(null);

  const allReports = useMemo(() => {
    let reports: any[] = [];
    protocols.forEach((p: any) => {
      if (p.reports) {
        p.reports.forEach((r: any) => {
          reports.push({ ...r, studyId: p.id, studyTitle: p.title });
        });
      }
    });
    return reports;
  }, [protocols]);

  const filteredReports = useMemo(() => {
    if (selectedStudyId === 'All') return allReports;
    return allReports.filter(r => r.studyId === selectedStudyId);
  }, [allReports, selectedStudyId]);

  return (
    <div style={{ padding: '48px 64px', maxWidth: '100%', margin: '0 auto', color: '#f1f5f9' }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 24, marginBottom: 56 }}>
        <h1 style={{ margin: 0, fontWeight: 900, fontSize: 52, color: '#f1f5f9', letterSpacing: '-0.04em', lineHeight: 1.1 }}>Participant Progress Reports</h1>
        <div style={{ fontSize: 20, color: '#94a3b8', marginTop: 12, fontWeight: 600 }}>Sponsor Dashboard → <span style={{ color: '#2563eb' }}>Reports</span></div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 40, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Filter by Study:</div>
        <PillButton active={selectedStudyId === 'All'} onClick={() => setSelectedStudyId('All')}>All Studies</PillButton>
        {protocols.map((p: any) => (
          <PillButton key={p.id} active={selectedStudyId === p.id} onClick={() => setSelectedStudyId(p.id)}>{p.id}</PillButton>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredReports.map((r, i) => (
          <div key={i} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 20, padding: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{r.studyId} — {r.studyTitle}</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 22, fontWeight: 900, color: '#f1f5f9' }}>{r.name}</h3>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>{r.date}</div>
                <StatusBadge status={r.status} />
              </div>
            </div>
            <button 
              onClick={() => {
                setConfirmModal({
                  title: 'Secure Report Download',
                  message: `Download "${r.name}" for protocol ${r.studyId}?`,
                  buttons: [
                    { label: 'Download PDF', color: '#2563eb', onClick: () => { downloadFile(`PDF Data for ${r.name}`, `${r.name}.pdf`, 'application/pdf'); addToast({ type: 'success', message: 'PDF generated' }); } },
                    { label: 'Download CSV', color: '#10b981', onClick: () => { downloadFile(`CSV Data for ${r.name}`, `${r.name}.csv`, 'text/csv'); addToast({ type: 'success', message: 'CSV generated' }); } }
                  ]
                });
              }}
              style={{ background: 'transparent', border: '2px solid #334155', color: '#f1f5f9', padding: '16px 32px', borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Download Report ↓
            </button>
          </div>
        ))}

        {filteredReports.length === 0 && (
          <div style={{ textAlign: 'center', padding: 80, background: '#1e293b', border: '1px solid #334155', borderRadius: 24 }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>📑</div>
            <h3 style={{ fontSize: 24, fontWeight: 900, color: '#f1f5f9', margin: 0 }}>No reports available</h3>
            <p style={{ color: '#94a3b8', fontSize: 18, marginTop: 12 }}>Check back later as study teams upload their progress reports.</p>
          </div>
        )}
      </div>

      <ConfirmModal confirmModal={confirmModal} setConfirmModal={setConfirmModal} />
    </div>
  );
}
