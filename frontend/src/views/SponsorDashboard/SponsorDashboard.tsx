import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getUser, getRole, authFetch, API, performLogout, getDisplayName } from '../../utils/auth';

import { MOCK_PROTOCOLS, ToastContainer, SPONSOR } from './SponsorDashboardShared';
import DashboardPanel from './DashboardPanel';
import OurStudiesPanel from './OurStudiesPanel';
import ParticipantDataPanel from './ParticipantDataPanel';
import DocumentCenterPanel from './DocumentCenterPanel';
import TeamManagementPanel from './TeamManagementPanel';

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
  const [protocols, setProtocols] = useState<any[]>(MOCK_PROTOCOLS);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [currentUser, setCurrentUser] = useState(getUser());
  const [loading, setLoading] = useState(false);

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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
      const [studiesRes] = await Promise.all([
        authFetch(`${apiUrl}/api/studies/`)
      ]);
      if (studiesRes.ok) {
        const data = await studiesRes.json();
        // If there is actual data, use it; otherwise fallback to mocks
        if (data && data.length > 0) {
          // Map backend fields to frontend mock-compatible structure
          const mapped = data.map((d: any) => ({
            ...d,
            id: d.protocol_id || `ID-${d.pk}`,
            enrollment: { current: d.actual_randomized || 0, target: d.target_randomized || d.target_screened || 100 },
            lastUpdated: 'Recently updated',
            kpis: d.kpis || { enrolled: d.actual_randomized||0, targetEnrolled: d.target_randomized||100, completed: d.actual_completed||0, targetCompleted: d.target_completed||90 },
            status: d.status === 'PAUSED' ? 'Under Review' : d.status === 'RECRUITING' ? 'Recruiting' : d.status === 'ACTIVE' ? 'Active' : d.status
          }));
          setProtocols(mapped); 
        }
      }
    } catch (e) { console.error(e); }
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
    fontSize: '16px', fontWeight: 800, letterSpacing: '0.05em'
  };

  const getMenuBtnStyle = (id: string, isWhiteText = false) => ({
    ...menuBtnBase,
    color: activeModule === id || isWhiteText ? 'white' : '#64748b',
    background: activeModule === id ? 'rgba(30, 41, 59, 0.8)' : 'transparent',
    boxShadow: activeModule === id ? 'inset 0 0 0 1px rgba(255,255,255,0.05), 0 12px 24px rgba(0,0,0,0.4)' : 'none',
    border: activeModule === id ? '1px solid rgba(255,255,255,0.1)' : 'none'
  });

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: THEME.bg, color: 'white', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', position: 'relative' }}>
      
      {/* ANIMATED BACKGROUND */}
      <div style={{ 
        position: 'absolute', inset: 0, 
        background: 'radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.08) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.08) 0%, transparent 40%)',
        animation: 'bgMove 20s ease-infinite alternate',
        zIndex: 0, pointerEvents: 'none'
      }} />

      <style>{`
        @keyframes bgMove {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.1) translate(20px, 10px); }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: '300px', backgroundColor: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column', padding: '24px 16px', overflowY: 'auto', zIndex: 100 }}>

        {/* LOGO AREA */}
        <div style={{ background: 'white', borderRadius: '32px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '56px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <img src="/logo_new.png" alt="MusB Research" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} />
        </div>

        {/* MENU */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* GROUP 1: OVERVIEW */}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: 'white', letterSpacing: '0.15em', marginBottom: '24px', paddingLeft: '16px' }}>OVERVIEW</div>

            <button onClick={() => window.open('/', '_blank')} style={{ ...menuBtnBase, color: '#64748b', fontSize: '15px' }}>
              <span style={{ fontSize: '20px', opacity: 0.7 }}>🌐</span>
              <span style={{ flex: 1, textAlign: 'left', fontWeight: 900 }}>MAIN WEBSITE</span>
              <span style={{ opacity: 0.5 }}>↗</span>
            </button>
            <button onClick={() => setActiveModule('DASHBOARD')} style={{ ...getMenuBtnStyle('DASHBOARD', true), padding: '20px' }}>
              <span style={{ fontSize: '24px', color: activeModule === 'DASHBOARD' ? '#60a5fa' : '#64748b' }}>⚏</span>
              <span style={{ flex: 1, textAlign: 'left', fontWeight: 900, fontSize: '15px' }}>DASHBOARD (OVERVIEW)</span>
            </button>
          </div>

          {/* GROUP 2: CORE MANAGEMENT */}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: 'white', letterSpacing: '0.15em', marginBottom: '24px', paddingLeft: '16px' }}>CORE MANAGEMENT</div>

            <button onClick={() => setActiveModule('STUDIES')} style={{ ...getMenuBtnStyle('STUDIES'), padding: '20px' }}>
              <span style={{ fontSize: '24px', opacity: activeModule === 'STUDIES' ? 1 : 0.6 }}>📁</span>
              <span style={{ flex: 1, textAlign: 'left', fontWeight: 900, fontSize: '15px' }}>MY STUDIES</span>
            </button>
            <button onClick={() => addToast({ type:'info', message:'Recruitment analytics coming soon.' })} style={{ ...menuBtnBase, color: '#64748b', padding: '20px' }}>
              <span style={{ fontSize: '24px', opacity: 0.6 }}>📈</span>
              <span style={{ flex: 1, textAlign: 'left', fontWeight: 900, fontSize: '15px' }}>RECRUITMENT PROGRESS</span>
              <div style={{ width: 8, height: 8, background: '#ec4899', borderRadius: '50%', boxShadow: '0 0 10px #ec4899' }} />
            </button>
            <button onClick={() => addToast({ type:'info', message:'Participant raw data access is restricted.' })} style={{ ...menuBtnBase, color: '#64748b', padding: '20px' }}>
              <span style={{ fontSize: '24px', opacity: 0.6 }}>👥</span>
              <span style={{ flex: 1, textAlign: 'left', fontWeight: 900, fontSize: '15px' }}>PARTICIPANT DATA</span>
            </button>
          </div>

          {/* GROUP 3: REPORTS & DATA */}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: 'white', letterSpacing: '0.15em', marginBottom: '24px', paddingLeft: '16px' }}>REPORTS & DATA</div>

            <button onClick={() => setActiveModule('PARTICIPANTS')} style={{ ...getMenuBtnStyle('PARTICIPANTS'), padding: '20px' }}>
              <span style={{ fontSize: '24px', opacity: activeModule === 'PARTICIPANTS' ? 1 : 0.6 }}>📊</span>
              <span style={{ flex: 1, textAlign: 'left', fontWeight: 900, fontSize: '15px' }}>PARTICIPANT PROGRESS REPORT</span>
            </button>
            <button onClick={() => setActiveModule('DOCUMENTS')} style={{ ...getMenuBtnStyle('DOCUMENTS'), padding: '20px' }}>
              <span style={{ fontSize: '24px', opacity: activeModule === 'DOCUMENTS' ? 1 : 0.6 }}>📄</span>
              <span style={{ flex: 1, textAlign: 'left', fontWeight: 900, fontSize: '15px' }}>PARTICIPANT LEVEL DATA</span>
            </button>
          </div>

        </nav>

        {/* BOTTOM TEAM PANEL */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${THEME.border}`, borderRadius: '28px', padding: '24px', marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '56px', height: '56px', background: 'rgba(15, 23, 42, 1)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontWeight: 900, fontSize: '18px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>{SPONSOR.name.substring(0, 2).toUpperCase()}</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: 'white', letterSpacing: '0.05em' }}>{SPONSOR.id}</div>
              <div style={{ fontSize: '12px', color: '#f1f5f9', fontWeight: 800, marginTop: '4px' }}>{SPONSOR.name}</div>
              <div style={{ fontSize: '10px', color: THEME.body, fontWeight: 800, letterSpacing: '0.05em', marginTop: '4px' }}>TIER 1 SUPPORT ENABLED</div>
            </div>
          </div>
        </div>

      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, overflowY: 'auto', backgroundColor: THEME.bg, position: 'relative', display: 'flex', flexDirection: 'column' }}>

        {/* TOP HEADER CONTROLS */}
        <header style={{ height: '72px', padding: '0 40px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '24px', position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: THEME.glass, zIndex: 50, borderBottom: `1px solid ${THEME.border}` }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setNotifDropdownOpen(!notifDropdownOpen); setProfileDropdownOpen(false); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', position: 'relative' }}>
              🔔
              {notifications.some(n => !n.read) && <div style={{ position: 'absolute', top: -4, right: -4, width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }} />}
            </button>
            {notifDropdownOpen && (
              <div style={{ position: 'absolute', top: 40, right: 0, width: 320, background: '#1e293b', border: '1px solid #334155', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
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

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.05em' }}>{displayName.toUpperCase()}</div>
            <div style={{ fontSize: '11px', color: THEME.body, fontWeight: 800 }}>SPONSOR PLATFORM ADMIN</div>
          </div>

          <div style={{ position: 'relative' }}>
            <button onClick={() => { setProfileDropdownOpen(!profileDropdownOpen); setNotifDropdownOpen(false); }} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1e293b', border: `1px solid ${THEME.border}`, color: 'white', fontWeight: 700, cursor: 'pointer' }}>{initials}</button>
            {profileDropdownOpen && (
              <div style={{ position: 'absolute', top: 48, right: 0, width: 200, background: '#1e293b', border: '1px solid #334155', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                <button onClick={() => addToast({ type: 'info', message: 'Profile settings' })} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid #334155', color: '#f1f5f9', textAlign: 'left', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Profile Settings</button>
                <button onClick={() => performLogout()} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: '#ef4444', textAlign: 'left', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Sign Out</button>
              </div>
            )}
          </div>
        </header>

        {activeModule === 'DASHBOARD' && <DashboardPanel protocols={protocols} setProtocols={setProtocols} addToast={addToast} windowWidth={windowWidth} />}
        {activeModule === 'STUDIES' && <OurStudiesPanel protocols={protocols} setProtocols={setProtocols} addToast={addToast} windowWidth={windowWidth} />}
        {activeModule === 'PARTICIPANTS' && <ParticipantDataPanel protocols={protocols} addToast={addToast} windowWidth={windowWidth} />}
        {activeModule === 'DOCUMENTS' && <DocumentCenterPanel protocols={protocols} addToast={addToast} />}
        {activeModule === 'TEAM' && <TeamManagementPanel addToast={addToast} />}
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}