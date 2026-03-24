import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getUser, getRole, authFetch, API, performLogout, getDisplayName } from '../../utils/auth';

import { MOCK_PROTOCOLS, ToastContainer, SPONSOR } from './SponsorDashboardShared';
import DashboardPanel from './DashboardPanel';
import OurStudiesPanel from './OurStudiesPanel';
import ParticipantDataPanel from './ParticipantDataPanel';
import DocumentCenterPanel from './DocumentCenterPanel';
import TeamManagementPanel from './TeamManagementPanel';
import ReportsPanel from './ReportsPanel';

// === CONSTANTS ===
const THEME = {
  bg: '#020617', // Deeper navy for luxury
  sidebar: '#000814',
  border: 'rgba(37, 99, 235, 0.2)',
  primary: '#2563eb',
  body: '#cbd5e1',
  glass: 'blur(16px)',
  radius: '24px'
};

const MOCK_NOTIFICATIONS = [
  { id: 'n1', message: 'New progress report available for MUSB-2024-012', time: '2h ago', read: false },
  { id: 'n2', message: 'Enrollment milestone reached: 65 participants', time: '2 days ago', read: false }
];

export default function SponsorDashboard() {
  const [activeModule, setActiveModule] = useState('DASHBOARD');
  const [protocols, setProtocols] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [currentUser, setCurrentUser] = useState(getUser());
  const [loading, setLoading] = useState(false);

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isMobile = windowWidth < 1024;

  // Auth Reactivity
  useEffect(() => {
    const handleAuthChange = () => setCurrentUser(getUser());
    window.addEventListener('storage', handleAuthChange);
    return () => window.removeEventListener('storage', handleAuthChange);
  }, []);

  const displayName = useMemo(() => {
    return getDisplayName(currentUser);
  }, [currentUser]);

  const initials = useMemo(() => {
    if (!currentUser) return 'U';
    if (currentUser.first_name && currentUser.last_name) return (currentUser.first_name[0] + currentUser.last_name[0]).toUpperCase();
    return (currentUser.full_name || displayName).split(' ').map((s: any) => s[0]).join('').substring(0, 2).toUpperCase() || 'U';
  }, [currentUser, displayName]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = API || 'http://localhost:8000';
      const [studiesRes, teamRes, inquiriesRes] = await Promise.all([
        authFetch(`${apiUrl}/api/studies/`),
        authFetch(`${apiUrl}/api/auth/list-team-members/`),
        authFetch(`${apiUrl}/api/study-inquiries/`)
      ]);

      if (studiesRes.ok) {
        const data = await studiesRes.json();
        const mapped = data.map((d: any) => ({
          ...d,
          id: d.protocol_id || `ID-${d.pk}`,
          enrollment: { current: d.actual_randomized || 0, target: d.target_randomized || d.target_screened || 100 },
          lastUpdated: 'Recently updated',
          kpis: d.kpis || { enrolled: d.actual_randomized || 0, targetEnrolled: d.target_randomized || 100, completed: d.actual_completed || 0, targetCompleted: d.target_completed || 90 },
          status: d.status === 'PAUSED' ? 'Under Review' : d.status === 'RECRUITING' ? 'Recruiting' : d.status === 'ACTIVE' ? 'Active' : d.status
        }));
        setProtocols(mapped);
      }

      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeam(teamData);
      }

      if (inquiriesRes.ok) {
        const inquiryData = await inquiriesRes.json();
        setInquiries(inquiryData);
      }
    } catch (e) {
      console.error('FETCH_ERROR:', e);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const addToast = useCallback((toast: { type: string, message: string }) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => {
      const newToasts = [...prev, { id, ...toast }];
      if (newToasts.length > 3) return newToasts.slice(newToasts.length - 3);
      return newToasts;
    });
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const menuBtnBase = {
    width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px',
    background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: '20px',
    fontSize: '12px', fontWeight: 800, letterSpacing: '0.05em'
  };

  const getMenuBtnStyle = (id: string, isWhiteText = false) => ({
    ...menuBtnBase,
    color: activeModule === id || isWhiteText ? 'white' : THEME.body,
    background: activeModule === id ? '#0f172a' : 'transparent',
    boxShadow: activeModule === id ? 'inset 0 0 0 1px rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.2)' : 'none'
  });

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'transparent', color: 'white', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', position: 'relative' }}>

      {/* ANIMATED BACKGROUND IS HANDLED BY APP.TSX, JUST ENSURE NO SOLID OVERLAY */}

      <style>{`
        @keyframes bgMove {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.1) translate(20px, 10px); }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* MOBILE OVERLAY */}
      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 90, animation: 'fadeIn 0.3s' }}
        />
      )}

      {/* SIDEBAR */}
      <aside style={{
        width: '300px',
        backgroundColor: 'rgba(2, 6, 23, 0.4)',
        backdropFilter: 'blur(16px)',
        borderRight: `1px solid ${THEME.border}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        overflowY: 'auto',
        zIndex: 100,
        position: isMobile ? 'absolute' : 'relative',
        height: '100%',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isMobile ? (isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none'
      }}>

        {/* LOGO AREA */}
        <div style={{ background: 'white', margin: '10px', padding: '0', borderRadius: '10px', overflow: 'hidden', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/logo_new.png" alt="MusB Research" style={{ width: '90%', height: 'auto', display: 'block' }} />
        </div>

        {/* MENU */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* GROUP 1: OVERVIEW */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 900, color: 'white', textShadow: '0 0 10px rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: '8px', paddingLeft: '16px' }}>OVERVIEW</div>

            <button onClick={() => window.location.href = '/'} style={{ ...menuBtnBase, color: THEME.body }}>
              <span style={{ fontSize: '14px', opacity: 0.6 }}>🌐</span>
              <span style={{ flex: 1, textAlign: 'left' }}>MAIN WEBSITE</span>
              <span style={{ opacity: 0.5 }}>↗</span>
            </button>
            <button onClick={() => setActiveModule('DASHBOARD')} style={getMenuBtnStyle('DASHBOARD', true)}>
              <span style={{ fontSize: '14px', color: activeModule === 'DASHBOARD' ? '#a5b4fc' : THEME.body }}>⚏</span>
              <span style={{ flex: 1, textAlign: 'left', lineHeight: '1.4', fontSize: '12px' }}>DASHBOARD<br /><span style={{ fontSize: '10px', opacity: 0.7 }}>(PORTFOLIO OVERVIEW)</span></span>
            </button>
          </div>

          {/* GROUP 2: CORE MANAGEMENT */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 900, color: 'white', textShadow: '0 0 10px rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: '8px', paddingLeft: '16px' }}>CORE MANAGEMENT</div>

            <button onClick={() => setActiveModule('STUDIES')} style={getMenuBtnStyle('STUDIES')}>
              <span style={{ fontSize: '14px', opacity: activeModule === 'STUDIES' ? 1 : 0.6 }}>📁</span>
              <span style={{ flex: 1, textAlign: 'left' }}>OUR STUDIES</span>
            </button>
            <button onClick={() => setActiveModule('PARTICIPANTS')} style={getMenuBtnStyle('PARTICIPANTS')}>
              <span style={{ fontSize: '14px', opacity: activeModule === 'PARTICIPANTS' ? 1 : 0.6 }}>👥</span>
              <span style={{ flex: 1, textAlign: 'left', lineHeight: '1.4' }}>PARTICIPANT DATA</span>
            </button>
            <button onClick={() => setActiveModule('TEAM')} style={getMenuBtnStyle('TEAM')}>
              <span style={{ fontSize: '14px', opacity: activeModule === 'TEAM' ? 1 : 0.6 }}>🤝</span>
              <span style={{ flex: 1, textAlign: 'left' }}>TEAM MANAGEMENT</span>
            </button>
          </div>

          {/* GROUP 3: REPORTS & DATA */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 900, color: 'white', textShadow: '0 0 10px rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: '8px', paddingLeft: '16px' }}>REPORTS & DATA</div>

            <button onClick={() => setActiveModule('REPORTS')} style={getMenuBtnStyle('REPORTS')}>
              <span style={{ fontSize: '14px', opacity: activeModule === 'REPORTS' ? 1 : 0.6 }}>📈</span>
              <span style={{ flex: 1, textAlign: 'left', lineHeight: '1.4' }}>PARTICIPANT PROGRESS REPORTS</span>
            </button>
          </div>

        </nav>

        {/* BOTTOM TEAM PANEL */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${THEME.border}`, borderRadius: '28px', padding: '16px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '56px', height: '56px', background: 'rgba(15, 23, 42, 1)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontWeight: 900, fontSize: '18px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>{initials}</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: 'white', letterSpacing: '0.05em' }}>{displayName.toUpperCase()}</div>
              <div style={{ fontSize: '12px', color: '#f1f5f9', fontWeight: 800, marginTop: '4px' }}>{currentUser?.email}</div>
              <div style={{ fontSize: '10px', color: THEME.body, fontWeight: 800, letterSpacing: '0.05em', marginTop: '4px' }}>SECURE SPONSOR NODE</div>
            </div>
          </div>
        </div>

      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, overflowY: 'auto', backgroundColor: 'transparent', position: 'relative', display: 'flex', flexDirection: 'column' }}>

        {/* TOP HEADER CONTROLS */}
        <header style={{
          height: '72px',
          padding: isMobile ? '0 20px' : '0 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: THEME.glass,
          zIndex: 50,
          borderBottom: `1px solid ${THEME.border}`
        }}>
          {isMobile ? (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}
            >
              ☰
            </button>
          ) : <div />}

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '24px' }}>
            <div style={{ position: 'relative' }}>
              <button onClick={() => { setNotifDropdownOpen(!notifDropdownOpen); setProfileDropdownOpen(false); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', position: 'relative' }}>
                🔔
                {notifications.some(n => !n.read) && <div style={{ position: 'absolute', top: -4, right: -4, width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }} />}
              </button>
              {notifDropdownOpen && (
                <div style={{ position: 'absolute', top: 40, right: 0, width: 280, background: '#1e293b', border: '1px solid #334155', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #334155', fontWeight: 700, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Notifications</span>
                    <button onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, cursor: 'pointer' }}>Mark all read</button>
                  </div>
                  {notifications.map(n => (
                    <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #334155', background: n.read ? 'transparent' : 'rgba(37,99,235,0.05)', cursor: 'pointer' }}>
                      <div style={{ fontSize: 13, color: n.read ? '#94a3b8' : '#f1f5f9' }}>{n.message}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{n.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isMobile && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.05em' }}>{displayName.toUpperCase()}</div>
                <div style={{ fontSize: '11px', color: THEME.body, fontWeight: 800 }}>SPONSOR PLATFORM ADMIN</div>
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <button onClick={() => { setProfileDropdownOpen(!profileDropdownOpen); setNotifDropdownOpen(false); }} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1e293b', border: `1px solid ${THEME.border}`, color: 'white', fontWeight: 700, cursor: 'pointer' }}>{initials}</button>
              {profileDropdownOpen && (
                <div style={{ position: 'absolute', top: 48, right: 0, width: 200, background: '#1e293b', border: '1px solid #334155', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                  <button onClick={() => addToast({ type: 'info', message: 'Profile settings' })} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid #334155', color: '#f1f5f9', textAlign: 'left', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Profile Settings</button>
                  <button onClick={() => performLogout()} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: '#ef4444', textAlign: 'left', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {activeModule === 'DASHBOARD' && (
          <DashboardPanel
            protocols={protocols}
            team={team}
            inquiries={inquiries}
            setProtocols={setProtocols}
            addToast={addToast}
            windowWidth={windowWidth}
            currentUser={currentUser}
            setActiveModule={setActiveModule}
          />
        )}
        {activeModule === 'STUDIES' && <OurStudiesPanel protocols={protocols} setProtocols={setProtocols} addToast={addToast} windowWidth={windowWidth} />}
        {activeModule === 'PARTICIPANTS' && <ParticipantDataPanel protocols={protocols} addToast={addToast} windowWidth={windowWidth} currentUser={currentUser} />}
        {activeModule === 'DOCUMENTS' && <DocumentCenterPanel protocols={protocols} addToast={addToast} />}
        {activeModule === 'REPORTS' && <ReportsPanel protocols={protocols} addToast={addToast} />}
        {activeModule === 'TEAM' && <TeamManagementPanel addToast={addToast} />}
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}