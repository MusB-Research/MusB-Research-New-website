import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getUser, getRole, authFetch, API, performLogout, getDisplayName } from '../../utils/auth';

import { MOCK_PROTOCOLS, ToastContainer, SPONSOR } from './SponsorDashboardShared';
import DashboardPanel from './DashboardPanel';
import OurStudiesPanel from './OurStudiesPanel';
import ParticipantDataPanel from './ParticipantDataPanel';
import DocumentCenterPanel from './DocumentCenterPanel';

// === CONSTANTS ===
const THEME = {
  bg: '#0f172a',
  sidebar: '#020617',
  border: 'rgba(37, 99, 235, 0.15)',
  primary: '#2563eb',
  body: '#94a3b8',
  glass: 'blur(12px)'
};

const MOCK_NOTIFICATIONS = [
  { id:'n1', message:'New progress report available for MUSB-2024-012', time:'2h ago', read:false },
  { id:'n2', message:'Enrollment milestone reached: 65 participants', time:'2 days ago', read:false }
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
    return (currentUser.full_name || displayName).split(' ').map((s:any)=>s[0]).join('').substring(0,2).toUpperCase() || 'U';
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
            // Mapping could be done here; assuming mock for now to keep rich UI working if DB empty
            // setProtocols(data); 
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
    background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s', borderRadius: '16px',
    fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em'
  };

  const getMenuBtnStyle = (id: string, isWhiteText = false) => ({
    ...menuBtnBase,
    color: activeModule === id || isWhiteText ? 'white' : THEME.body,
    background: activeModule === id ? '#0f172a' : 'transparent',
    boxShadow: activeModule === id ? 'inset 0 0 0 1px rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.2)' : 'none'
  });

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: THEME.bg, color: 'white', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '300px', backgroundColor: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column', padding: '24px 16px', overflowY: 'auto', zIndex: 100 }}>
        
        {/* LOGO AREA */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', boxShadow: '0 0 24px rgba(6, 182, 212, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'white' }} />
             </div>
             <div>
                <div style={{ color: '#0f172a', fontWeight: 900, fontSize: '18px', lineHeight: 1, letterSpacing: '-0.02em' }}>MUSB</div>
                <div style={{ color: '#0ea5e9', fontWeight: 800, fontSize: '9px', letterSpacing: '0.1em' }}>RESEARCH</div>
             </div>
          </div>
        </div>
        
        {/* MENU */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* GROUP 1: OVERVIEW */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 900, color: 'white', textShadow: '0 0 10px rgba(255,255,255,0.3)', letterSpacing: '0.05em', marginBottom: '16px', paddingLeft: '16px' }}>OVERVIEW</div>
            
            <button onClick={() => window.location.href='/'} style={{ ...menuBtnBase, color: THEME.body }}>
               <span style={{ fontSize: '18px', opacity: 0.6 }}>🌐</span>
               <span style={{ flex: 1, textAlign: 'left' }}>MAIN WEBSITE</span>
               <span style={{ opacity: 0.5 }}>↗</span>
            </button>
            <button onClick={() => setActiveModule('DASHBOARD')} style={getMenuBtnStyle('DASHBOARD', true)}>
               <span style={{ fontSize: '18px', color: activeModule === 'DASHBOARD' ? '#a5b4fc' : THEME.body }}>⚏</span>
               <span style={{ flex: 1, textAlign: 'left', lineHeight: '1.4' }}>DASHBOARD<br/>(OVERVIEW)</span>
            </button>
          </div>

          {/* GROUP 2: CORE MANAGEMENT */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 900, color: 'white', textShadow: '0 0 10px rgba(255,255,255,0.3)', letterSpacing: '0.05em', marginBottom: '16px', paddingLeft: '16px' }}>CORE MANAGEMENT</div>
            
            <button onClick={() => setActiveModule('STUDIES')} style={getMenuBtnStyle('STUDIES')}>
               <span style={{ fontSize: '18px', opacity: activeModule === 'STUDIES' ? 1 : 0.6 }}>📁</span>
               <span style={{ flex: 1, textAlign: 'left' }}>OUR STUDIES</span>
            </button>
            <button onClick={() => setActiveModule('PARTICIPANTS')} style={getMenuBtnStyle('PARTICIPANTS')}>
               <span style={{ fontSize: '18px', opacity: activeModule === 'PARTICIPANTS' ? 1 : 0.6 }}>👥</span>
               <span style={{ flex: 1, textAlign: 'left', lineHeight: '1.4' }}>PARTICIPANT PROGRESS REPORT</span>
            </button>
          </div>

          {/* GROUP 3: REPORTS & DATA */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 900, color: 'white', textShadow: '0 0 10px rgba(255,255,255,0.3)', letterSpacing: '0.05em', marginBottom: '16px', paddingLeft: '16px' }}>REPORTS & DATA</div>
            
            <button onClick={() => setActiveModule('DOCUMENTS')} style={getMenuBtnStyle('DOCUMENTS')}>
               <span style={{ fontSize: '18px', opacity: activeModule === 'DOCUMENTS' ? 1 : 0.6 }}>📄</span>
               <span style={{ flex: 1, textAlign: 'left', lineHeight: '1.4' }}>PARTICIPANT LEVEL DATA</span>
            </button>
          </div>

        </nav>

        {/* BOTTOM TEAM PANEL */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${THEME.border}`, borderRadius: '24px', padding: '20px', marginTop: '32px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(15, 23, 42, 1)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontWeight: 900, fontSize: '14px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>{SPONSOR.name.substring(0,2).toUpperCase()}</div>
              <div>
                 <div style={{ fontSize: '12px', fontWeight: 900, color: 'white', letterSpacing: '0.05em' }}>{SPONSOR.id}</div>
                 <div style={{ fontSize: '10px', color: '#f1f5f9', fontWeight: 800, marginTop: '4px' }}>{SPONSOR.name}</div>
                 <div style={{ fontSize: '9px', color: THEME.body, fontWeight: 800, letterSpacing: '0.05em', marginTop: '4px' }}>TIER 1 SUPPORT ENABLED</div>
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
                  <button onClick={() => setNotifications(notifications.map(n => ({...n, read:true})))} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, cursor: 'pointer' }}>Mark all read</button>
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
              <div style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '0.05em' }}>{displayName.toUpperCase()}</div>
              <div style={{ fontSize: '9px', color: THEME.body, fontWeight: 800 }}>SPONSOR PORTAL</div>
           </div>
          
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setProfileDropdownOpen(!profileDropdownOpen); setNotifDropdownOpen(false); }} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1e293b', border: `1px solid ${THEME.border}`, color: 'white', fontWeight: 700, cursor: 'pointer' }}>{initials}</button>
            {profileDropdownOpen && (
              <div style={{ position: 'absolute', top: 48, right: 0, width: 200, background: '#1e293b', border: '1px solid #334155', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                <button onClick={() => addToast({type:'info', message:'Profile settings'})} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid #334155', color: '#f1f5f9', textAlign: 'left', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Profile Settings</button>
                <button onClick={() => performLogout()} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: '#ef4444', textAlign: 'left', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Sign Out</button>
              </div>
            )}
          </div>
        </header>

        {activeModule === 'DASHBOARD' && <DashboardPanel protocols={protocols} setProtocols={setProtocols} addToast={addToast} windowWidth={windowWidth} />}
        {activeModule === 'STUDIES' && <OurStudiesPanel protocols={protocols} setProtocols={setProtocols} addToast={addToast} windowWidth={windowWidth} />}
        {activeModule === 'PARTICIPANTS' && <ParticipantDataPanel protocols={protocols} addToast={addToast} windowWidth={windowWidth} />}
        {activeModule === 'DOCUMENTS' && <DocumentCenterPanel protocols={protocols} addToast={addToast} />}
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}