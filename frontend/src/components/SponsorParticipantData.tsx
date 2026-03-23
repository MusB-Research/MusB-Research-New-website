import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

// === CONSTANTS ===
const SPONSOR = { id: 'SP-VITANOVA', name: 'VitaNova Therapeutics', contact: 'Dr. Patricia Lane', email: 'p.lane@vitanova.com' };

const MOCK_STUDIES = [
    {
        id: 'MUSB-2024-012',
        title: 'VITAL-Age Study',
        status: 'Recruiting',
        type: 'In-Person',
        enrollment: { screened: 120, eligible: 95, consented: 80, randomized: 75, active: 65, completed: 8, withdrawn: 2, target: 100 },
        enrollmentHistory: [{ month: 'Oct', count: 8 }, { month: 'Nov', count: 22 }, { month: 'Dec', count: 35 }, { month: 'Jan', count: 48 }, { month: 'Feb', count: 59 }, { month: 'Mar', count: 65 }],
        questionnaires: [
            { name: 'VITAL Symptom Score', avgBaseline: 7.2, avgLatest: 4.8, timePoints: [{ label: 'Baseline', score: 7.2 }, { label: 'Week 4', score: 6.1 }, { label: 'Week 8', score: 5.3 }, { label: 'Week 12', score: 4.8 }] },
            { name: 'Quality of Life Index', avgBaseline: 52, avgLatest: 68, timePoints: [{ label: 'Baseline', score: 52 }, { label: 'Week 4', score: 57 }, { label: 'Week 8', score: 63 }, { label: 'Week 12', score: 68 }] }
        ],
        visits: [
            { name: 'Screening', scheduled: 75, completed: 73, missed: 2 },
            { name: 'Baseline', scheduled: 73, completed: 70, missed: 3 },
            { name: 'Week 4', scheduled: 70, completed: 65, missed: 5 },
            { name: 'Week 8', scheduled: 65, completed: 58, missed: 7 },
            { name: 'Week 12', scheduled: 58, completed: 42, missed: 16 }
        ]
    },
    {
        id: 'MUSB-2024-013',
        title: 'Anti-Aging Microbiome Study',
        status: 'Active',
        type: 'Virtual',
        enrollment: { screened: 80, eligible: 60, consented: 50, randomized: 45, active: 40, completed: 3, withdrawn: 2, target: 80 },
        enrollmentHistory: [{ month: 'Nov', count: 5 }, { month: 'Dec', count: 14 }, { month: 'Jan', count: 25 }, { month: 'Feb', count: 33 }, { month: 'Mar', count: 40 }],
        questionnaires: [
            { name: 'Microbiome Wellness Score', avgBaseline: 5.5, avgLatest: 7.1, timePoints: [{ label: 'Baseline', score: 5.5 }, { label: 'Week 6', score: 6.2 }, { label: 'Week 12', score: 7.1 }] }
        ],
        visits: [
            { name: 'Screening', scheduled: 45, completed: 44, missed: 1 },
            { name: 'Baseline', scheduled: 44, completed: 42, missed: 2 },
            { name: 'Week 6', scheduled: 42, completed: 38, missed: 4 },
            { name: 'Week 12', scheduled: 38, completed: 28, missed: 10 }
        ]
    }
];

// === HELPERS ===
const generateParticipants = (studyId: string) => {
    const arms = studyId === 'MUSB-2024-012' ? ['Intervention', 'Control'] : ['Intervention', 'Control', 'Placebo'];
    const statuses = ['Active', 'Active', 'Active', 'Active', 'Screening', 'Completed', 'Withdrawn'];
    const genders = ['Male', 'Female', 'Female', 'Male', 'Female', 'Male', 'Other'];
    return Array.from({ length: 65 }, (_, i) => ({
        id: `${studyId.split('-')[1].substring(0, 3)}-${String(i + 1).padStart(3, '0')}`,
        age: 35 + Math.floor(Math.random() * 30),
        gender: genders[i % genders.length],
        arm: arms[i % arms.length],
        status: statuses[i % statuses.length],
        visitsCompleted: Math.floor(Math.random() * 5),
        totalVisits: 5,
        compliance: 50 + Math.floor(Math.random() * 50),
        lastVisit: `2026-0${(i % 3) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
        aeCount: i % 7 === 0 ? 1 : 0,
        enrollmentDate: `2025-${String((i % 6) + 10).padStart(2, '0')}-01`,
        site: `SITE-${String((i % 3) + 1).padStart(2, '0')}`,
        scores: [
            { name: 'VITAL Symptom Score', baseline: 6 + Math.random() * 3, latest: 3 + Math.random() * 4, date: '2026-01-15' },
            { name: 'Quality of Life Index', baseline: 45 + Math.random() * 20, latest: 55 + Math.random() * 20, date: '2026-01-15' }
        ]
    }));
};

// === SUB-COMPONENTS ===
const MusBLogo = ({ className = "h-8", light = true }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }} className={className}>
        <svg viewBox="0 0 100 60" style={{ height: '100%', aspectRatio: '1.6/1' }}>
            {/* Orbital Rings */}
            <ellipse cx="50" cy="30" rx="45" ry="25" fill="none" stroke="#0097d8" strokeWidth="2" opacity="0.3" />
            <ellipse cx="50" cy="30" rx="40" ry="22" fill="none" stroke="#0097d8" strokeWidth="3" opacity="0.6" />
            <ellipse cx="50" cy="30" rx="35" ry="19" fill="none" stroke="#0097d8" strokeWidth="4" />
            {/* Central Eye */}
            <ellipse cx="50" cy="30" rx="22" ry="14" fill="#0097d8" />
            <ellipse cx="45" cy="25" rx="8" ry="5" fill="white" opacity="0.4" />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 0.9 }}>
            <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: light ? 'white' : '#1e293b' }}>MUSB</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0097d8', letterSpacing: '0.45em', textTransform: 'uppercase', marginTop: '4px' }}>RESEARCH</span>
        </div>
    </div>
);

const Toast = ({ message, type, onDismiss }: { message: string, type: string, onDismiss: () => void }) => {
    const colors: Record<string, string> = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#6366f1'
    };
    return (
        <div style={{
            padding: '16px 24px',
            background: 'rgba(15, 23, 42, 0.9)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(16px)',
            borderLeft: `6px solid ${colors[type] || colors.info}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideIn 0.3s ease-out forwards',
            marginBottom: '10px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ fontWeight: 900, fontSize: '15px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{message}</div>
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                background: colors[type] || colors.info,
                animation: 'progress 3s linear forwards'
            }} />
            <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes progress { from { width: 100%; } to { width: 0%; } }
      `}</style>
        </div>
    );
};

// === MAIN COMPONENT ===
const SponsorParticipantData = () => {
    // === STATE ===
    const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);
    const [studySelectValue, setStudySelectValue] = useState('');
    const [activeTab, setActiveTab] = useState<'table' | 'visual' | 'export'>('table');
    const [participants, setParticipants] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterArm, setFilterArm] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterGender, setFilterGender] = useState('All');
    const [sortColumn, setSortColumn] = useState('id');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerParticipantId, setDrawerParticipantId] = useState<string | null>(null);
    const [drawerTab, setDrawerTab] = useState('Overview');
    const [reportSections, setReportSections] = useState({ overview: true, enrollmentSummary: true, enrollmentFunnel: true, participantTable: true, questionnaireSummary: true, visitCompletion: true, compliance: true, adverseEvents: true });
    const [reportDateFrom, setReportDateFrom] = useState('');
    const [reportDateTo, setReportDateTo] = useState('');
    const [reportFormat, setReportFormat] = useState('PDF');
    const [recruitmentModalOpen, setRecruitmentModalOpen] = useState(false);
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [contactMessage, setContactMessage] = useState('');
    const [toasts, setToasts] = useState<any[]>([]);
    const drawerRef = useRef<HTMLDivElement>(null);

    // === HELPERS ===
    const showToast = useCallback((message: string, type: string = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev.slice(-2), { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    // Load participants when study changes
    useEffect(() => {
        if (selectedStudyId) {
            setParticipants(generateParticipants(selectedStudyId));
            setCurrentPage(1);
            showToast(`Loaded data for ${selectedStudyId}`);
        }
    }, [selectedStudyId, showToast]);

    const activeStudy = useMemo(() => MOCK_STUDIES.find(s => s.id === selectedStudyId), [selectedStudyId]);

    // Filtering & Sorting
    const filteredParticipants = useMemo(() => {
        return participants
            .filter(p => {
                const matchesSearch = p.id.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesArm = filterArm === 'All' || p.arm === filterArm;
                const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
                const matchesGender = filterGender === 'All' || p.gender === filterGender;
                return matchesSearch && matchesArm && matchesStatus && matchesGender;
            })
            .sort((a, b) => {
                const valA = a[sortColumn];
                const valB = b[sortColumn];
                if (valA < valB) return sortDir === 'asc' ? -1 : 1;
                if (valA > valB) return sortDir === 'asc' ? 1 : -1;
                return 0;
            });
    }, [participants, searchQuery, filterArm, filterStatus, filterGender, sortColumn, sortDir]);

    const paginatedParticipants = useMemo(() => {
        if (rowsPerPage === -1) return filteredParticipants;
        const start = (currentPage - 1) * rowsPerPage;
        return filteredParticipants.slice(start, start + rowsPerPage);
    }, [filteredParticipants, currentPage, rowsPerPage]);

    const totalPages = useMemo(() => rowsPerPage === -1 ? 1 : Math.ceil(filteredParticipants.length / rowsPerPage), [filteredParticipants, rowsPerPage]);

    const exportCSV = useCallback((data: any[], filename: string) => {
        const headers = ["Participant ID", "Age", "Gender", "Study Arm", "Status", "Visits Completed", "Compliance %", "Last Visit"];
        const rows = data.map(p => [p.id, p.age, p.gender, p.arm, p.status, p.visitsCompleted, `${p.compliance}%`, p.lastVisit]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(`Exported ${filename}`);
    }, [showToast]);

    const handleGenerateReport = useCallback(() => {
        if (!activeStudy) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <html>
            <head>
                <title>${activeStudy.title} - Clinical Report</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; color: #0f172a; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; align-items: center; }
                    .logo-container { display: flex; align-items: center; gap: 10px; }
                    .logo-icon { width: 40px; height: 40px; }
                    .logo-text { display: flex; flex-direction: column; line-height: 1; }
                    .musb { font-size: 24px; font-weight: 900; color: #000; font-style: italic; letter-spacing: -1px; }
                    .research { font-size: 11px; font-weight: 900; color: #0097d8; letter-spacing: 0.3em; }
                    .meta { font-size: 14px; color: #64748b; text-align: right; }
                    h1 { font-size: 26px; margin-bottom: 10px; }
                    .section { margin-bottom: 40px; }
                    .section-title { font-size: 16px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; text-transform: uppercase; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th { text-align: left; background: #f8fafc; padding: 10px; font-size: 14px; border: 1px solid #e2e8f0; }
                    td { padding: 10px; font-size: 14px; border: 1px solid #e2e8f0; }
                    .footer { position: fixed; bottom: 20px; width: 100%; font-size: 12px; color: #94a3b8; text-align: center; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo-container">
                        <svg class="logo-icon" viewBox="0 0 100 60" style="width: 60px;">
                            <ellipse cx="50" cy="30" rx="45" ry="25" fill="none" stroke="#0097d8" stroke-width="2" opacity="0.3" />
                            <ellipse cx="50" cy="30" rx="40" ry="22" fill="none" stroke="#0097d8" stroke-width="3" opacity="0.6" />
                            <ellipse cx="50" cy="30" rx="35" ry="19" fill="none" stroke="#0097d8" stroke-width="4" />
                            <ellipse cx="50" cy="30" rx="22" ry="14" fill="#0097d8" />
                        </svg>
                        <div class="logo-text">
                            <span class="musb" style="font-style: normal; color: #1e293b; font-size: 24px;">MUSB</span>
                            <span class="research" style="font-size: 11px;">RESEARCH</span>
                        </div>
                    </div>
                    <div class="meta" style="font-size: 14px;">
                        Generated on: ${new Date().toLocaleDateString()}<br>
                        By: ${SPONSOR.name}<br>
                        Sponsor ID: ${SPONSOR.id}
                    </div>
                </div>
                <div class="section">
                    <h1>${activeStudy.title}</h1>
                    <p style="font-size: 14px; color: #475569;">Study ID: ${activeStudy.id} | Type: ${activeStudy.type} | Status: ${activeStudy.status}</p>
                </div>
                ${reportSections.enrollmentSummary ? `
                <div class="section">
                    <div class="section-title">Enrollment Summary</div>
                    <table>
                        <tr><th>Stage</th><th>Count</th><th>Percentage</th></tr>
                        <tr><td>Screened</td><td>${activeStudy.enrollment.screened}</td><td>100%</td></tr>
                        <tr><td>Eligible</td><td>${activeStudy.enrollment.eligible}</td><td>${Math.round(activeStudy.enrollment.eligible / activeStudy.enrollment.screened * 100)}%</td></tr>
                        <tr><td>Consented</td><td>${activeStudy.enrollment.consented}</td><td>${Math.round(activeStudy.enrollment.consented / activeStudy.enrollment.screened * 100)}%</td></tr>
                        <tr><td>Randomized</td><td>${activeStudy.enrollment.randomized}</td><td>${Math.round(activeStudy.enrollment.randomized / activeStudy.enrollment.screened * 100)}%</td></tr>
                    </table>
                </div>
                ` : ''}
                ${reportSections.questionnaireSummary ? `
                <div class="section">
                    <div class="section-title">Questionnaire Metrics</div>
                    <table>
                        <tr><th>Questionnaire</th><th>Avg Baseline</th><th>Avg Latest</th><th>Change</th></tr>
                        ${activeStudy.questionnaires.map(q => `
                            <tr>
                                <td>${q.name}</td>
                                <td>${q.avgBaseline}</td>
                                <td>${q.avgLatest}</td>
                                <td style="color: ${q.avgLatest < q.avgBaseline ? '#ef4444' : '#10b981'}">
                                    ${q.avgLatest > q.avgBaseline ? '+' : ''}${Math.round((q.avgLatest - q.avgBaseline) / q.avgBaseline * 100)}%
                                </td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
                ` : ''}
                <div class="footer">CONFIDENTIAL — De-identified data only. Not for distribution outside of sponsor organization.</div>
            </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
            showToast(`Report generated for ${activeStudy.id}`);
        }, 500);
    }, [activeStudy, reportSections, showToast]);

    // Outside click for drawer
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (drawerOpen && drawerRef.current && !drawerRef.current.contains(e.target as Node)) setDrawerOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [drawerOpen]);

    const drawerParticipant = useMemo(() => participants.find(p => p.id === drawerParticipantId), [participants, drawerParticipantId]);

    // === STYLES ===
    const styles: Record<string, React.CSSProperties> = {
        container: { maxWidth: '1400px', margin: '0 auto', position: 'relative', color: '#cbd5e1' },
        studyHeader: { background: 'rgba(11, 17, 33, 0.6)', padding: '24px 32px', position: 'sticky', top: '-34px', zIndex: 90, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(32px)', borderRadius: '24px', marginBottom: '32px' },
        card: { background: 'rgba(255, 255, 255, 0.03)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', marginBottom: '32px', backdropFilter: 'blur(16px)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' },
        badge: { padding: '6px 16px', borderRadius: '99px', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' },
        button: { padding: '14px 32px', borderRadius: '16px', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: '15px', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' },
        input: { padding: '14px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '16px', outline: 'none', background: 'rgba(255,255,255,0.02)', color: 'white' },
        tab: { padding: '14px 36px', borderRadius: '99px', cursor: 'pointer', fontWeight: 900, fontSize: '14px', transition: 'all 0.3s', textTransform: 'uppercase', letterSpacing: '0.1em' },
        tableHeader: { background: 'rgba(255,255,255,0.02)', padding: '24px', fontWeight: 900, fontSize: '14px', color: '#64748b', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)', letterSpacing: '0.2em' },
        tableCell: { padding: '24px', fontSize: '16px', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.03)' },
        drawer: { position: 'fixed', right: 0, top: 0, height: '100%', width: '480px', background: 'rgba(5, 9, 18, 0.95)', backdropFilter: 'blur(40px)', boxShadow: '-20px 0 60px rgba(0,0,0,0.5)', zIndex: 200, transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)', display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.1)' },
        overlay: { position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.6)', zIndex: 190, display: drawerOpen ? 'block' : 'none', backdropFilter: 'blur(8px)' },
        quickActions: { position: 'sticky', bottom: '24px', background: 'rgba(11, 17, 33, 0.8)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 32px', display: 'flex', justifyContent: 'flex-end', gap: '20px', zIndex: 80, backdropFilter: 'blur(24px)', borderRadius: '24px', maxWidth: 'fit-content', marginLeft: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }
    };

    // === RENDER HELPERS ===
    const renderTable = () => (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                    <input style={{ ...styles.input, flex: 1 }} placeholder="Search Participant ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    <select style={styles.input} value={filterArm} onChange={e => setFilterArm(e.target.value)}>
                        <option value="All" style={{ background: '#0f172a' }}>All Arms</option>
                        <option value="Intervention" style={{ background: '#0f172a' }}>Intervention</option>
                        <option value="Control" style={{ background: '#0f172a' }}>Control</option>
                        {selectedStudyId === 'MUSB-2024-013' && <option value="Placebo" style={{ background: '#0f172a' }}>Placebo</option>}
                    </select>
                    <select style={styles.input} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="All" style={{ background: '#0f172a' }}>All Status</option>
                        <option value="Active" style={{ background: '#0f172a' }}>Active</option>
                        <option value="Screening" style={{ background: '#0f172a' }}>Screening</option>
                        <option value="Completed" style={{ background: '#0f172a' }}>Completed</option>
                        <option value="Withdrawn" style={{ background: '#0f172a' }}>Withdrawn</option>
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={{ ...styles.button, background: '#10b981', color: 'white' }} onClick={() => exportCSV(filteredParticipants, `${selectedStudyId}_participants.csv`)}>Export CSV</button>
                    <button style={{ ...styles.button, background: '#2563eb', color: 'white' }} onClick={handleGenerateReport}>Export PDF</button>
                </div>
            </div>
            <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            {['id', 'age', 'gender', 'arm', 'status', 'compliance', 'lastVisit'].map(col => (
                                <th key={col} style={{ ...styles.tableHeader, cursor: 'pointer' }} onClick={() => {
                                    if (sortColumn === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                                    else { setSortColumn(col); setSortDir('asc'); }
                                }}>
                                    {col.replace('id', 'Participant ID').toUpperCase()} {sortColumn === col && (sortDir === 'asc' ? '↑' : '↓')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedParticipants.map(p => (
                            <tr key={p.id} style={{ cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => { setDrawerParticipantId(p.id); setDrawerOpen(true); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <td style={styles.tableCell}>{p.id}</td>
                                <td style={styles.tableCell}>{p.age}</td>
                                <td style={styles.tableCell}>{p.gender}</td>
                                <td style={styles.tableCell}>{p.arm}</td>
                                <td style={styles.tableCell}>
                                    <span style={{ ...styles.badge, background: p.status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: p.status === 'Active' ? '#10b981' : '#f59e0b', border: `1px solid ${p.status === 'Active' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}` }}>{p.status}</span>
                                </td>
                                <td style={styles.tableCell}>
                                    <span style={{ color: p.compliance >= 80 ? '#10b981' : p.compliance >= 60 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>{p.compliance}%</span>
                                </td>
                                <td style={styles.tableCell}>{p.lastVisit}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Registry_Load: {paginatedParticipants.length} of {filteredParticipants.length} units</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ ...styles.button, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', padding: '10px 20px' }} disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Prev</button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                        <button key={i} style={{ ...styles.button, background: currentPage === i + 1 ? '#2563eb' : 'rgba(255,255,255,0.05)', color: currentPage === i + 1 ? 'white' : '#64748b', padding: '10px 18px', border: currentPage === i + 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                    ))}
                    <button style={{ ...styles.button, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', padding: '10px 20px' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev - 1)}>Next</button>
                </div>
            </div>
        </div>
    );

    const renderInsights = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            {/* Enrollment Funnel */}
            <div style={styles.card}>
                <h4 style={{ fontWeight: 700, marginBottom: '20px' }}>Enrollment Funnel</h4>
                <div style={{ height: '240px' }}>
                    <svg width="100%" height="100%" viewBox="0 0 400 200">
                        {activeStudy && Object.entries(activeStudy.enrollment).filter(([k]) => !['target'].includes(k)).map(([key, val], i) => (
                            <g key={key}>
                                <rect x={70} y={i * 35} width={(val as number) * 2.5} height="20" rx="6" fill={`rgba(79, 70, 229, ${1 - i * 0.15})`} />
                                <text x="0" y={i * 35 + 15} fontSize="13" fontWeight="900" fill="#475569" style={{ textTransform: 'uppercase' }}>{key.toUpperCase()}</text>
                                <text x={70 + (val as number) * 2.5 + 8} y={i * 35 + 15} fontSize="13" fontWeight="900" fill="white">{val as number}</text>
                            </g>
                        ))}
                    </svg>
                </div>
            </div>
            {/* Compliance Distribution */}
            <div style={styles.card}>
                <h4 style={{ fontWeight: 700, marginBottom: '20px' }}>Compliance Breakdown</h4>
                <svg width="100%" height="200" viewBox="0 0 400 200">
                    <circle cx="200" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="30" />
                    <circle cx="200" cy="100" r="80" fill="none" stroke="#10b981" strokeWidth="30" strokeDasharray="300 200" transform="rotate(-90 200 100)" style={{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.4))' }} />
                    <text x="200" y="105" textAnchor="middle" fontSize="20" fontWeight="900" fill="white" style={{ fontStyle: 'italic' }}>84%</text>
                </svg>
            </div>
        </div>
    );

    const renderExportTab = () => (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <div style={styles.card}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Generate Study Report</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '8px' }}>Report Title</label>
                        <input style={{ ...styles.input, width: '100%' }} value={activeStudy?.title} readOnly />
                    </div>
                    <div>
                        <label style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '8px' }}>Report Sections</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {Object.keys(reportSections).map(key => (
                                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={(reportSections as any)[key]} onChange={() => setReportSections(prev => ({ ...prev, [key]: !(prev as any)[key] }))} />
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <button style={{ ...styles.button, background: '#2563eb', color: 'white', marginTop: '30px', width: '100%', justifyContent: 'center', padding: '16px' }} onClick={handleGenerateReport}>Generate Final Report (PDF)</button>
            </div>
            <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Download Options</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                        { label: 'Raw Dataset', format: 'CSV', color: '#10b981', action: () => exportCSV(participants, `${selectedStudyId}_raw.csv`) },
                        { label: 'Compliance Index', format: 'CSV', color: '#f59e0b', action: () => showToast('Compliance data exported') },
                        { label: 'SVG Data Assets', format: 'SVG', color: '#6366f1', action: () => showToast('Visual assets exported') }
                    ].map(btn => (
                        <button key={btn.label} style={{ ...styles.button, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', justifyContent: 'space-between', color: 'white' }} onClick={btn.action}>
                            <span style={{ fontSize: '15px', fontWeight: 800 }}>{btn.label}</span>
                            <span style={{ fontSize: '13px', fontWeight: 900, color: btn.color, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' }}>{btn.format}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    // === MAIN RENDER ===
    return (
        <div style={styles.container}>
            {/* Toast System */}
            <div style={{ position: 'fixed', bottom: '40px', right: '40px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px' }}>
                {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => { }} />)}
            </div>

            {!selectedStudyId ? (
                <div style={{ maxWidth: '640px', margin: '40px auto', textAlign: 'center' }}>
                    <div style={styles.card}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
                            <MusBLogo className="h-14" />
                        </div>
                        <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '16px', color: 'white', letterSpacing: '-0.02em', textTransform: 'uppercase', fontStyle: 'italic' }}>Select Clinical Protocol</h2>
                        <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '40px', fontWeight: 500, lineHeight: 1.6 }}>Choose a study from your portfolio to access de-identified participant data and clinical insights.</p>

                        <div style={{ textAlign: 'left', marginBottom: '32px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px', display: 'block' }}>Search Active Portfolios</label>
                            <select style={{ ...styles.input, width: '100%', background: 'rgba(0,0,0,0.3)' }} value={studySelectValue} onChange={e => setStudySelectValue(e.target.value)}>
                                <option value="" style={{ background: '#0f172a' }}>Browse Protocol Registry...</option>
                                {MOCK_STUDIES.map(s => <option key={s.id} value={s.id} style={{ background: '#0f172a' }}>{s.title} — {s.id}</option>)}
                            </select>
                        </div>

                        <button style={{ ...styles.button, background: '#2563eb', color: 'white', width: '100%', justifyContent: 'center', opacity: studySelectValue ? 1 : 0.4, boxShadow: '0 20px 40px rgba(37,99,235,0.2)', height: '60px' }} disabled={!studySelectValue} onClick={() => setSelectedStudyId(studySelectValue)}>
                            Initiate Intelligence stream
                        </button>
                        <p style={{ fontSize: '14px', color: '#475569', marginTop: '24px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>🔒 Compliance Seal: HIPAA & GDPR De-identification Active</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Sticky Study Header */}
                    <div style={styles.studyHeader}>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 900, color: 'white', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '-0.5px' }}>{activeStudy?.title}</div>
                            <div style={{ fontSize: '15px', color: '#4f46e5', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '1px' }}>PROJECT_REF: {activeStudy?.id}</div>
                        </div>
                        <div style={{ flex: 1, margin: '0 60px', maxWidth: '300px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 900, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                <span style={{ fontStyle: 'italic' }}>Clinical Adherence</span>
                                <span style={{ color: 'white' }}>{activeStudy?.enrollment.randomized} / {activeStudy?.enrollment.target}</span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ height: '100%', background: 'linear-gradient(90deg, #4f46e5, #2563eb)', width: `${(activeStudy?.enrollment.randomized || 0) / (activeStudy?.enrollment.target || 1) * 100}%`, boxShadow: '0 0 10px rgba(79,70,229,0.5)' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <span style={{ ...styles.badge, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>{activeStudy?.status}</span>
                            <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '13px', fontWeight: 900, cursor: 'pointer', padding: '10px 24px', borderRadius: '12px', textTransform: 'uppercase' }} onClick={() => setSelectedStudyId(null)}>Switch Protocol</button>
                        </div>
                    </div>

                    <div style={{ padding: '8px 0' }}>
                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '40px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '20px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.05)' }}>
                            {[
                                { id: 'table', label: 'Participant Registry' },
                                { id: 'visual', label: 'Analytical HUD' },
                                { id: 'export', label: 'Data Dispatch' }
                            ].map(tab => (
                                <div key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{ ...styles.tab, background: activeTab === tab.id ? '#2563eb' : 'transparent', color: activeTab === tab.id ? 'white' : '#64748b', boxShadow: activeTab === tab.id ? '0 10px 20px rgba(37,99,235,0.3)' : 'none' }}>{tab.label}</div>
                            ))}
                        </div>

                        {/* Content */}
                        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                            {activeTab === 'table' && renderTable()}
                            {activeTab === 'visual' && renderInsights()}
                            {activeTab === 'export' && renderExportTab()}
                        </div>
                        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                    </div>

                    {/* Quick Actions Bar */}
                    <div style={styles.quickActions}>
                        <button style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 900, cursor: 'pointer', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.1em' }} onClick={() => showToast(`Full study view: ${selectedStudyId}`)}>View Full Registry</button>
                        <button style={{ ...styles.button, background: '#4f46e5', color: 'white', boxShadow: '0 10px 30px rgba(79,70,229,0.3)' }} onClick={() => setContactModalOpen(true)}>Contact Investigation Team</button>
                    </div>
                </>
            )}

            {/* Backdrop Overlay */}
            <div style={styles.overlay} onClick={() => setDrawerOpen(false)} />

            {/* Participant Detail Drawer */}
            <div style={styles.drawer} ref={drawerRef}>
                {drawerParticipant && (
                    <>
                        <div style={{ padding: '32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 900, color: 'white', fontStyle: 'italic' }}>{drawerParticipant.id}</div>
                            <button style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '40px', height: '40px', borderRadius: '12px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDrawerOpen(false)}>×</button>
                        </div>
                        <div style={{ background: 'rgba(79,70,229,0.05)', padding: '12px 32px', fontSize: '13px', fontWeight: 900, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.2em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>🔒 HIPAA_SECURE_NODE: DE_IDENTIFIED_VIEW</span>
                        </div>
                        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {['Overview', 'Visits', 'Scores'].map(t => (
                                <div key={t} onClick={() => setDrawerTab(t)} style={{ flex: 1, textAlign: 'center', padding: '20px', cursor: 'pointer', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: drawerTab === t ? 'white' : '#475569', borderBottom: drawerTab === t ? '2px solid #2563eb' : 'none' }}>{t}</div>
                            ))}
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                            {drawerTab === 'Overview' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    {[
                                        { label: 'Age', val: drawerParticipant.age },
                                        { label: 'Gender', val: drawerParticipant.gender },
                                        { label: 'Study Arm', val: drawerParticipant.arm },
                                        { label: 'Compliance', val: `${drawerParticipant.compliance}%`, color: drawerParticipant.compliance > 80 ? '#10b981' : '#f59e0b' },
                                        { label: 'Enrollment', val: drawerParticipant.enrollmentDate },
                                        { label: 'Site Code', val: drawerParticipant.site }
                                    ].map(item => (
                                        <div key={item.label}>
                                            <div style={{ fontSize: '13px', color: '#475569', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{item.label}</div>
                                            <div style={{ fontSize: '18px', fontWeight: 700, color: (item as any).color || 'white' }}>{item.val}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {drawerTab === 'Visits' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '24px' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: i < drawerParticipant.visitsCompleted ? '#10b981' : 'rgba(255,255,255,0.05)', marginTop: '4px', boxShadow: i < drawerParticipant.visitsCompleted ? '0 0 10px #10b981' : 'none' }} />
                                            <div>
                                                <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', textTransform: 'uppercase' }}>Clinical Stage 0{i + 1}</div>
                                                <div style={{ fontSize: '13px', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>{i < drawerParticipant.visitsCompleted ? 'SUCCESSFULLY_VALIDATED' : 'PENDING_ENTRY'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '32px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <button style={{ ...styles.button, background: '#2563eb', color: 'white', width: '100%', justifyContent: 'center', boxShadow: '0 20px 40px rgba(37,99,235,0.2)' }} onClick={() => exportCSV([drawerParticipant], `${drawerParticipant.id}_data.csv`)}>
                                Export Participant Frame
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Email Modal */}
            {contactModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
                    <div style={{ ...styles.card, width: '600px', margin: 'auto', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '24px', color: 'white', textTransform: 'uppercase', fontStyle: 'italic' }}>Establish Team Uplink</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#4f46e5', background: 'rgba(79,70,229,0.1)', padding: '12px 20px', borderRadius: '12px' }}>
                                TO: MusB Research Coordination Unit — {activeStudy?.title}
                            </div>
                            <input style={{ ...styles.input, background: 'rgba(255,255,255,0.03)' }} readOnly value={`RE: SOURCE_META_${activeStudy?.id} — SPONSOR_INQUIRY`} />
                            <textarea style={{ ...styles.input, height: '200px', resize: 'none', background: 'rgba(0,0,0,0.2)' }} placeholder="Enter research inquiry or data clarification request..." value={contactMessage} onChange={e => setContactMessage(e.target.value)} />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                                <button style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 800, cursor: 'pointer', fontSize: '14px', textTransform: 'uppercase' }} onClick={() => setContactModalOpen(false)}>Abort</button>
                                <button style={{ ...styles.button, background: '#2563eb', color: 'white', boxShadow: '0 10px 30px rgba(37,99,235,0.3)' }} onClick={() => { showToast('Uplink complete: Message transmitted to investigation team'); setContactModalOpen(false); setContactMessage(''); }}>Transmit Message</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SponsorParticipantData;
