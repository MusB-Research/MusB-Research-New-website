import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getUser, getRole, authFetch, API, performLogout, getDisplayName } from '../../utils/auth';
import { User, LogOut, Bell, Sparkles, LayoutDashboard, Database, FileText, Users, BarChart3, Presentation } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

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
  const navigate = useNavigate();
  const location = useLocation();

  const [activeModule, setActiveModule] = useState(() => {
    const route = location.pathname.split('/').pop();
    if (route === 'studies') return 'STUDIES';
    if (route === 'participants') return 'PARTICIPANTS';
    if (route === 'documents') return 'DOCUMENTS';
    if (route === 'team') return 'TEAM';
    if (route === 'reports') return 'REPORTS';
    return 'DASHBOARD';
  });

  // Sync state with URL for back button support
  useEffect(() => {
    const route = location.pathname.split('/').pop();
    if (route === 'studies') setActiveModule('STUDIES');
    else if (route === 'participants') setActiveModule('PARTICIPANTS');
    else if (route === 'documents') setActiveModule('DOCUMENTS');
    else if (route === 'team') setActiveModule('TEAM');
    else if (route === 'reports') setActiveModule('REPORTS');
    else if (location.pathname.endsWith('/sponsor') || !route || route === 'sponsor') setActiveModule('DASHBOARD');
  }, [location.pathname]);

  const handleModuleChange = (mod: string) => {
    const slugs: Record<string, string> = {
      'DASHBOARD': '',
      'STUDIES': 'studies',
      'PARTICIPANTS': 'participants',
      'DOCUMENTS': 'documents',
      'TEAM': 'team',
      'REPORTS': 'reports'
    };
    const slug = slugs[mod];
    setActiveModule(mod);
    navigate(`/dashboard/sponsor${slug ? '/' + slug : ''}`);
  };

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
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Close dropdowns when clicking outside
  useEffect(() => {
    const closeDropdowns = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setNotifDropdownOpen(false);
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', closeDropdowns);
    return () => document.removeEventListener('mousedown', closeDropdowns);
  }, []);

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

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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

  const triggerTestNotification = () => {
    const newNotif = {
      id: 'test-' + Date.now(),
      message: `🔔 NEW ENROLLMENT DETECTED: Protocol MUSB-${Math.floor(Math.random() * 1000)}`,
      time: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    addToast({ type: 'success', message: 'New system alert triggered!' });
  };

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
        @keyframes pulse { 0% { scale: 1; opacity: 1; } 50% { scale: 1.25; opacity: 0.7; } 100% { scale: 1; opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .logo-pill { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .logo-pill:hover { 
          transform: scale(1.03) translateY(-2px); 
          box-shadow: 0 10px 40px rgba(255,255,255,0.2), 0 0 20px rgba(59, 130, 246, 0.3) !important;
          filter: brightness(1.05);
        }
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

        {/* LOGO AREA - Integrated Header Style */}
        <div style={{
          height: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${THEME.border}`,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: THEME.glass,
          padding: '0 24px'
        }}>
          <Link to="/" target="_blank" style={{ width: '100%', textDecoration: 'none' }}>
            <div className="logo-pill" style={{
              background: 'white',
              borderRadius: '40px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '0',
              boxShadow: '0 4px 30px rgba(0,0,0,0.2)',
              cursor: 'pointer'
            }}>
              <img src="/logo.jpg" alt="MusB" style={{ height: '120%', width: 'auto', objectFit: 'contain', padding: '0', margin: '0' }} />
            </div>
          </Link>
        </div>

        {/* MENU */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '32px' }}>

          {/* GROUP 1: OVERVIEW */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 900, color: 'white', textShadow: '0 0 10px rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: '8px', paddingLeft: '16px' }}>OVERVIEW</div>

            <button onClick={() => window.location.href = '/'} style={{ ...menuBtnBase, color: THEME.body }}>
              <span style={{ fontSize: '14px', opacity: 0.6 }}>🌐</span>
              <span style={{ flex: 1, textAlign: 'left' }}>MAIN WEBSITE</span>
              <span style={{ opacity: 0.5 }}>↗</span>
            </button>
            <button onClick={() => handleModuleChange('DASHBOARD')} style={getMenuBtnStyle('DASHBOARD', true)}>
              <span style={{ fontSize: '14px', color: activeModule === 'DASHBOARD' ? '#a5b4fc' : THEME.body }}>⚏</span>
              <span style={{ flex: 1, textAlign: 'left', lineHeight: '1.4', fontSize: '12px' }}>DASHBOARD<br /><span style={{ fontSize: '10px', opacity: 0.7 }}>(PORTFOLIO OVERVIEW)</span></span>
            </button>
          </div>

          {/* GROUP 2: CORE MANAGEMENT */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 900, color: 'white', textShadow: '0 0 10px rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: '8px', paddingLeft: '16px' }}>CORE MANAGEMENT</div>

            <button onClick={() => handleModuleChange('STUDIES')} style={getMenuBtnStyle('STUDIES')}>
              <span style={{ fontSize: '14px', opacity: activeModule === 'STUDIES' ? 1 : 0.6 }}>📁</span>
              <span style={{ flex: 1, textAlign: 'left' }}>OUR STUDIES</span>
            </button>
            <button onClick={() => handleModuleChange('PARTICIPANTS')} style={getMenuBtnStyle('PARTICIPANTS')}>
              <span style={{ fontSize: '14px', opacity: activeModule === 'PARTICIPANTS' ? 1 : 0.6 }}>👥</span>
              <span style={{ flex: 1, textAlign: 'left', lineHeight: '1.4' }}>PARTICIPANT DATA</span>
            </button>
            <button onClick={() => handleModuleChange('TEAM')} style={getMenuBtnStyle('TEAM')}>
              <span style={{ fontSize: '14px', opacity: activeModule === 'TEAM' ? 1 : 0.6 }}>🤝</span>
              <span style={{ flex: 1, textAlign: 'left' }}>TEAM MANAGEMENT</span>
            </button>
          </div>

          {/* GROUP 3: REPORTS & DATA */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 900, color: 'white', textShadow: '0 0 10px rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: '8px', paddingLeft: '16px' }}>REPORTS & DATA</div>

            <button onClick={() => handleModuleChange('REPORTS')} style={getMenuBtnStyle('REPORTS')}>
              <span style={{ fontSize: '14px', opacity: activeModule === 'REPORTS' ? 1 : 0.6 }}>📈</span>
              <span style={{ flex: 1, textAlign: 'left', lineHeight: '1.4' }}>PARTICIPANT PROGRESS REPORTS</span>
            </button>
          </div>

        </nav>

        {/* SIDEBAR FOOTER: IDENTITY & TELEMETRY */}
        <div style={{ marginTop: 'auto', padding: '16px' }}>
          {/* USER IDENTITY CARD */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${THEME.border}`, borderRadius: '24px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(15, 23, 42, 1)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontWeight: 900, fontSize: '16px' }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: 'white', letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName.toUpperCase()}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.email}</div>
              </div>
            </div>

            {/* REAL-TIME NODE TELEMETRY */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {/* PRODUCTION WAKE-LINK SYNC STATUS (UPTIME ROBOT STYLE) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '8px', height: '8px', background: '#00ff9d', borderRadius: '50%', boxShadow: '0 0 12px #00ff9d', animation: 'pulse 1.5s infinite' }} />
                <span style={{ color: '#00ff9d', fontSize: '10px', fontWeight: 900, letterSpacing: '0.15em' }}>GLOBAL NODE SYNC</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, marginBottom: '16px', display: 'flex', gap: '6px' }}>
                <span>UPTIME: <span style={{ color: 'white' }}>99.99%</span></span>
                <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
                <span>STATUS: <span style={{ color: '#00ff9d' }}>STABLE</span></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ color: 'white', fontSize: '16px', fontWeight: 900, fontFamily: 'monospace' }}>
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </span>
                <span style={{ color: '#60a5fa', fontSize: '10px', fontWeight: 900 }}>
                  {Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop()?.replace('_', ' ')}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, marginTop: '4px', letterSpacing: '0.05em' }}>
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
              </div>

              <button
                onClick={triggerTestNotification}
                style={{
                  marginTop: '12px',
                  width: '100%',
                  padding: '6px',
                  background: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.1)',
                  borderRadius: '6px',
                  color: '#60a5fa',
                  fontSize: '9px',
                  fontWeight: 900,
                  letterSpacing: '0.05em',
                  cursor: 'pointer'
                }}
              >
                TEST SYSTEM ALERT
              </button>
            </div>
          </div>

          <button onClick={performLogout} style={{ ...menuBtnBase, color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '16px' }}>
            <LogOut size={16} />
            <span>SIGN OUT</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, overflowY: 'auto', backgroundColor: 'transparent', position: 'relative', display: 'flex', flexDirection: 'column' }}>

        {/* TOP HEADER CONTROLS */}
        <header style={{
          height: '100px',
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
            <div style={{ position: 'relative' }} data-dropdown="true">
              <button onClick={() => { setNotifDropdownOpen(!notifDropdownOpen); setProfileDropdownOpen(false); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', position: 'relative', padding: '8px' }}>
                <span style={{ fontSize: '24px' }}>🔔</span>
                {notifications.some(n => !n.read) && <div style={{ position: 'absolute', top: 4, right: 4, width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 10px #ef4444' }} />}
              </button>
              {notifDropdownOpen && (
                <div style={{ position: 'absolute', top: 40, right: 0, width: 280, background: '#1e293b', border: '1px solid #334155', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', fontWeight: 900, fontSize: 16, display: 'flex', justifyContent: 'space-between', color: 'white' }}>
                    <span>Notifications</span>
                    <button onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>Mark all read</button>
                  </div>
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setSelectedNotification(n);
                        setNotifications(notifications.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
                        setNotifDropdownOpen(false);
                      }}
                      style={{ padding: '16px 20px', borderBottom: '1px solid #334155', background: n.read ? 'transparent' : 'rgba(37,99,235,0.05)', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseOver={(e: any) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseOut={(e: any) => e.target.style.background = n.read ? 'transparent' : 'rgba(37,99,235,0.05)'}
                    >
                      <div style={{ fontSize: 15, fontWeight: 700, color: n.read ? '#94a3b8' : '#f1f5f9', lineHeight: '1.4' }}>{n.message}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontWeight: 800 }}>{n.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isMobile && (
              <div style={{ textAlign: 'right', marginRight: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', letterSpacing: '0.05em' }}>{displayName.toUpperCase()}</div>
                <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 800, letterSpacing: '0.05em', marginTop: '2px' }}>SPONSOR ADMIN NODE</div>
              </div>
            )}

            <div style={{ position: 'relative' }} data-dropdown="true">
              <button onClick={() => { setProfileDropdownOpen(!profileDropdownOpen); setNotifDropdownOpen(false); }} style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#1e293b', border: `1px solid ${THEME.border}`, color: 'white', fontSize: '16px', fontWeight: 900, cursor: 'pointer' }}>{initials}</button>
              {profileDropdownOpen && (
                <div style={{ position: 'absolute', top: 48, right: 0, width: 200, background: '#1e293b', border: '1px solid #334155', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                  <button onClick={() => addToast({ type: 'info', message: 'Profile settings' })} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid #334155', color: '#f1f5f9', textAlign: 'left', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Profile Settings</button>
                  <button onClick={() => performLogout()} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: '#ef4444', textAlign: 'left', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MODULE DEPLOYMENT */}
        <div style={{ flex: 1, padding: isMobile ? '20px' : '40px', overflowY: 'auto' }}>
          {activeModule === 'DASHBOARD' && (
            <DashboardPanel
              protocols={protocols}
              team={team}
              inquiries={inquiries}
              setProtocols={setProtocols}
              addToast={addToast}
              windowWidth={windowWidth}
              currentUser={currentUser}
              setActiveModule={handleModuleChange}
            />
          )}
          {activeModule === 'STUDIES' && <OurStudiesPanel protocols={protocols} setProtocols={setProtocols} addToast={addToast} windowWidth={windowWidth} />}
          {activeModule === 'PARTICIPANTS' && <ParticipantDataPanel protocols={protocols} addToast={addToast} windowWidth={windowWidth} currentUser={currentUser} />}
          {activeModule === 'DOCUMENTS' && <DocumentCenterPanel protocols={protocols} addToast={addToast} />}
          {activeModule === 'REPORTS' && <ReportsPanel protocols={protocols} addToast={addToast} />}
          {activeModule === 'TEAM' && <TeamManagementPanel addToast={addToast} />}
        </div>
      </main>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* DETAILED NOTIFICATION MODAL */}
      {selectedNotification && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '500px', background: '#1e293b', border: `1px solid ${THEME.border}`, borderRadius: '24px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#60a5fa', fontSize: '10px', fontWeight: 900, letterSpacing: '0.1em' }}>SYSTEM ALERT</div>
              <button onClick={() => setSelectedNotification(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'white', marginBottom: '16px', lineHeight: '1.2' }}>{selectedNotification.message}</h2>
            <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>Log Timestamp: <span style={{ color: 'white', fontWeight: 800 }}>{selectedNotification.time}</span></div>

            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 800, marginBottom: '8px' }}>TELEMETRY STATUS:</div>
              <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
                Event captured at the {Intl.DateTimeFormat().resolvedOptions().timeZone} Sponsor Node.
                Full encryption protocols were active during the data synchronization event.
                No further action required at this moment.
              </div>
            </div>

            <button onClick={() => setSelectedNotification(null)} style={{ width: '100%', padding: '16px', background: '#3b82f6', border: 'none', borderRadius: '16px', color: 'white', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>ACKNOWLEDGMENT CONFIRMED</button>
          </div>
        </div>
      )}
    </div>
  );
}