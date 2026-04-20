import React, { useState, useEffect, useMemo, useCallback } from 'react';
import NotificationBell from '../../components/NotificationBell';
import { getUser, getRole, authFetch, API, performLogout, getDisplayName } from '../../utils/auth';
import { apiFetch } from '../../api';
import { User, LogOut, Bell, Sparkles, LayoutDashboard, Database, FileText, Users, BarChart3, Presentation, Globe, X, Menu, Zap } from 'lucide-react';
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
  bg: '#020617',
  sidebar: '#000814',
  border: 'rgba(37, 99, 235, 0.2)',
  primary: '#2563eb',
  body: '#cbd5e1',
  glass: 'blur(16px)',
  radius: '24px'
};

const MOCK_NOTIFICATIONS = [
  { id: 'n1', title: 'New Progress Report', message: 'New progress report available for MUSB-2024-012', time: '2h ago', read: false },
  { id: 'n2', title: 'Milestone Reached', message: 'Enrollment milestone reached: 65 participants', time: '2 days ago', read: false }
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
  const [notifications, setNotifications] = useState<any[]>(MOCK_NOTIFICATIONS);
  const [currentUser, setCurrentUser] = useState(getUser());
  const [loading, setLoading] = useState(false);

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const closeDropdowns = (e?: any) => {
      if (e?.type === 'mousedown') {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-dropdown]')) {
          setNotifDropdownOpen(false);
          setProfileDropdownOpen(false);
        }
      } else {
        setNotifDropdownOpen(false);
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', closeDropdowns);
    window.addEventListener('scroll', closeDropdowns, true);
    return () => {
      document.removeEventListener('mousedown', closeDropdowns);
      window.removeEventListener('scroll', closeDropdowns, true);
    };
  }, []);

  const isMobile = windowWidth < 1024;

  useEffect(() => {
    const handleAuthChange = () => setCurrentUser(getUser());
    window.addEventListener('storage', handleAuthChange);
    return () => window.removeEventListener('storage', handleAuthChange);
  }, []);

  const displayName = useMemo(() => getDisplayName(currentUser), [currentUser]);

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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);



  const fetchData = async () => {
    setLoading(true);
    try {
      const studiesData = await apiFetch<any[]>('/api/studies/?limit=50');
      const teamData = await apiFetch<any[]>('/api/auth/list-team-members/?limit=50');
      const inquiriesData = await apiFetch<any[]>('/api/study-inquiries/?limit=50');
      const notifData = await apiFetch<any[]>('/api/notifications/?limit=50');
      const reportsData = await apiFetch<any[]>('/api/progress-reports/?limit=50');
      const allReports = reportsData || [];

      const mapped = (studiesData || []).map((d: any) => ({
        ...d,
        id: d.protocol_id || `ID-${d.pk}`,
        enrollment: { current: d.actual_randomized || 0, target: d.target_randomized || d.target_screened || 100 },
        lastUpdated: 'Recently updated',
        kpis: d.kpis || { enrolled: d.actual_randomized || 0, targetEnrolled: d.target_randomized || 100, completed: d.actual_completed || 0, targetCompleted: d.target_completed || 90 },
        status: d.status === 'PAUSED' ? 'Under Review' : d.status === 'RECRUITING' ? 'Recruiting' : d.status === 'ACTIVE' ? 'Active' : d.status,
        reports: allReports.filter((r: any) => r.study_protocol === d.protocol_id).map((r: any) => ({
          id: r.id,
          name: r.name,
          date: r.report_date,
          status: r.status,
          type: r.report_type_display
        }))
      }));
      setProtocols(mapped);
      setTeam(teamData || []);
      setInquiries(inquiriesData || []);

      if (notifData) {
        const mappedNotifs = notifData.map((n: any) => ({
          id: n.id,
          message: n.message,
          time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: n.is_read,
          type: n.type,
          title: n.title
        }));
        setNotifications(mappedNotifs.slice(0, 5));
      }
    } catch (e) {
      console.error('FETCH_ERROR:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      const apiUrl = API || 'http://localhost:8000';
      authFetch(`${apiUrl}/api/notifications/?limit=5`).then(res => res.json()).then(data => {
        const mapped = data.map((n: any) => ({
          id: n.id,
          message: n.message,
          time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: n.is_read,
          type: n.type,
          title: n.title
        }));
        setNotifications(mapped.slice(0, 5));
      }).catch(err => console.warn('Refresh failed:', err));
    }, 60000); // Changed from 30s to 60s
    return () => clearInterval(interval);
  }, []);

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

  const markAsRead = async (id: string) => {
    const apiUrl = API || 'http://localhost:8000';
    try {
      const res = await authFetch(`${apiUrl}/api/notifications/${id}/read/`, { method: 'POST' });
      if (res.ok) setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) { console.error('Mark read failed', e); }
  };

  const markAllRead = async () => {
    const apiUrl = API || 'http://localhost:8000';
    try {
      const res = await authFetch(`${apiUrl}/api/notifications/read_all/`, { method: 'POST' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        addToast({ type: 'success', message: 'All alerts acknowledged.' });
      }
    } catch (e) { console.error('Mark all read failed', e); }
  };

  const SIDEBAR_W = 256;

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'transparent', color: 'white', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', position: 'relative' }}>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .logo-pill { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .logo-pill:hover { transform: scale(1.03) translateY(-2px); box-shadow: 0 10px 40px rgba(255,255,255,0.2), 0 0 20px rgba(59, 130, 246, 0.3) !important; filter: brightness(1.05); }
      `}</style>

      {/* MOBILE OVERLAY — covers full screen behind the sidebar */}
      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 99,       // below sidebar (100) but above everything else
            animation: 'fadeIn 0.2s'
          }}
        />
      )}

      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: `${SIDEBAR_W}px`,
          display: isMobile ? (isSidebarOpen ? 'flex' : 'none') : 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.05)',
          zIndex: 100,   // above overlay (99) on mobile, and above header (50) on desktop
          background: isMobile ? '#0b101b' : 'rgba(11, 16, 27, 0.95)',  // matching header background
          backdropFilter: isMobile ? 'none' : 'blur(20px)',
          WebkitBackdropFilter: isMobile ? 'none' : 'blur(20px)',
          boxShadow: isMobile ? '4px 0 40px rgba(0,0,0,0.8)' : 'none',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* SIDEBAR HEADER — Logo */}
        <div className="h-20 px-6 flex justify-between items-center border-b border-white/[0.05]">
          <Link to="/" className="group transition-all">
            <div className="bg-white p-2 rounded-2xl group-hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.05)]">
              <img src="/logo.jpg" alt="MusB Research" className="h-12 w-auto object-contain rounded-xl" />
            </div>
          </Link>
          {isMobile && (
            <button className="text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
              <X size={24} />
            </button>
          )}
        </div>


        {/* NAVIGATION */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px', overflowY: 'auto' }}>
          <div className="space-y-1.5">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all group"
            >
              <Globe size={18} className="text-slate-500 group-hover:text-white" />
              <span className="text-[13px] font-black uppercase tracking-wider">Back to Website</span>
            </button>

            {[
              { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'STUDIES', label: 'Studies', icon: Database },
              { id: 'PARTICIPANTS', label: 'Participants', icon: User },
              { id: 'TEAM', label: 'Team Members', icon: Users },
              { id: 'REPORTS', label: 'Reports', icon: BarChart3 },
            ].map((item) => {
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleModuleChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group ${isActive ? 'bg-[#0a1525] text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}
                >
                  <item.icon size={18} className={isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-white'} />
                  <span className="text-[13px] font-black uppercase tracking-wider">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* SIDEBAR FOOTER */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={performLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 16px', borderRadius: '16px', color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 'bold' }}
            className="hover:text-red-400 hover:bg-red-500/5"
          >
            <LogOut size={20} />
            <span style={{ fontSize: '14px' }}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA — marginLeft offsets the fixed sidebar on desktop */}
      <main style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: isMobile ? '100vw' : `calc(100vw - ${SIDEBAR_W}px)`,
        marginLeft: isMobile ? 0 : SIDEBAR_W,
        height: '100vh',
        overflowY: 'auto',
        backgroundColor: 'transparent',
      }}>

        {/* Fixed top header — use inline style for left offset so Tailwind doesn't need to compile an arbitrary value */}
        <header
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            left: isMobile ? 0 : SIDEBAR_W,
            height: isMobile ? '64px' : '80px',
            background: 'rgba(11, 16, 27, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0 16px' : '0 32px',
            zIndex: 50,
            transition: 'all 0.3s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px' }}>
            {isMobile ? (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="text-slate-300 hover:text-cyan-400 transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <Menu size={24} />
              </button>
            ) : null}

            {/* Real-time Clock */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', marginLeft: isMobile ? '8px' : '10px' }}>
              <span style={{ fontSize: isMobile ? '13px' : '16px', fontWeight: 900, color: '#22d3ee', fontFamily: 'monospace', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </span>
              <span style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Right side: Notifications + Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '20px' }}>
            <div style={{ position: 'relative' }} data-dropdown="true">
              <NotificationBell
                unreadCount={notifications.filter(n => !n.read).length}
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  setProfileDropdownOpen(false);
                }}
              />
              {notifDropdownOpen && (
                <div style={{ position: 'absolute', top: 40, right: 0, width: 280, background: '#1e293b', border: '1px solid #334155', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', fontWeight: 900, fontSize: 16, display: 'flex', justifyContent: 'space-between', color: 'white' }}>
                    <span>Notifications</span>
                    <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>Mark all read</button>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: 700 }}>No active alerts</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setSelectedNotification(n);
                          if (!n.read) markAsRead(n.id);
                          setNotifDropdownOpen(false);
                        }}
                        style={{ padding: '16px 20px', borderBottom: '1px solid #334155', background: n.read ? 'transparent' : 'rgba(37,99,235,0.05)', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        <div style={{ fontSize: 13, color: '#60a5fa', fontWeight: 900, letterSpacing: '0.05em', marginBottom: '4px' }}>{n.title?.toUpperCase() || 'SYSTEM ALERT'}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: n.read ? '#94a3b8' : '#f1f5f9', lineHeight: '1.4' }}>{n.message}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontWeight: 800 }}>{n.time}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="relative" data-dropdown="true">
              <div
                className="flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-white/[0.03] p-1 rounded-2xl transition-all"
                onClick={() => { setProfileDropdownOpen(!profileDropdownOpen); setNotifDropdownOpen(false); }}
              >
                <div className="hidden sm:flex flex-col items-end max-w-[80px] md:max-w-[120px]">
                  <span className="text-[10px] md:text-[12px] font-black text-white italic uppercase tracking-tight leading-none mb-1 truncate w-full text-right">{displayName.toUpperCase()}</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded border border-white/5 truncate w-full text-right">
                    {currentUser?.email || 'SPONSOR'}
                  </span>
                </div>
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-white/10 overflow-hidden shadow-2xl hover:border-cyan-500/40 transition-all ring-1 ring-white/5 shrink-0">
                  <span className="text-[11px] font-black italic">{initials}</span>
                </div>
              </div>

              {profileDropdownOpen && (
                <div style={{ position: 'absolute', top: 48, right: 0, width: 200, background: '#1e293b', border: '1px solid #334155', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                  <button onClick={() => addToast({ type: 'info', message: 'Profile settings coming soon.' })} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid #334155', color: '#f1f5f9', textAlign: 'left', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Profile Settings</button>
                  <button onClick={() => performLogout()} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: '#ef4444', textAlign: 'left', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MODULE PANELS */}
        <div style={{ flex: 1, padding: isMobile ? '96px 20px 60px 20px' : '100px 40px 80px 40px', overflowY: 'auto' }}>
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

      {/* NOTIFICATION DETAIL MODAL */}
      {selectedNotification && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '500px', background: '#1e293b', border: `1px solid ${THEME.border}`, borderRadius: '24px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#60a5fa', fontSize: '12px', fontWeight: 900, letterSpacing: '0.1em' }}>{selectedNotification.title?.toUpperCase() || 'SYSTEM ALERT'}</div>
              <button onClick={() => setSelectedNotification(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'white', marginBottom: '16px', lineHeight: '1.2' }}>{selectedNotification.message}</h2>
            <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>Log Timestamp: <span style={{ color: 'white', fontWeight: 800 }}>{selectedNotification.time}</span></div>
            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 800, marginBottom: '8px' }}>TELEMETRY STATUS:</div>
              <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
                Event captured at the {Intl.DateTimeFormat().resolvedOptions().timeZone} Sponsor Site.
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
