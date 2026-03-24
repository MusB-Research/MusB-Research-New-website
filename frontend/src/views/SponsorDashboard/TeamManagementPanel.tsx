import React, { useState, useEffect } from 'react';
import { authFetch, API } from '../../utils/auth';
import { StatusBadge, Modal } from './SponsorDashboardShared';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'PENDING';
}

const THEME = {
  primary: '#2563eb',
  success: '#10b981',
  bg: '#0f172a',
  card: '#1e293b',
  border: 'rgba(37, 99, 235, 0.15)',
  text: '#f1f5f9',
  muted: '#94a3b8'
};

export default function TeamManagementPanel({ addToast }: any) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'sponsor',
    organization: ''
  });
  const [inviting, setInviting] = useState(false);

  const roles = [
    { id: 'sponsor', label: 'Sponsor Admin' },
    { id: 'coordinator', label: 'Coordinator' },
    { id: 'pi', label: 'Principal Investigator' },
    { id: 'team_member', label: 'Team Member' }
  ];

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const apiUrl = API || 'http://localhost:8000';
      const res = await authFetch(`${apiUrl}/api/auth/list-team-members/`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      } else {
        addToast({ type: 'error', message: 'Failed to fetch team members' });
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      addToast({ type: 'error', message: 'Connection error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData.email) return;

    setInviting(true);
    try {
      const apiUrl = API || 'http://localhost:8000';
      const res = await authFetch(`${apiUrl}/api/auth/invite-team-member/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteData)
      });

      if (res.ok) {
        addToast({ type: 'success', message: `Invitation sent to ${inviteData.email}` });
        setShowInviteModal(false);
        setInviteData({ email: '', role: 'sponsor', organization: '' });
        fetchMembers();
      } else {
        const err = await res.json();
        addToast({ type: 'error', message: err.error || 'Failed to send invitation' });
      }
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to send invitation' });
    } finally {
      setInviting(false);
    }
  };

  const handleResend = async (invitationId: string) => {
    setInviting(true);
    try {
      const apiUrl = API || 'http://localhost:8000';
      const res = await authFetch(`${apiUrl}/api/auth/resend-invitation/${invitationId}/`, {
        method: 'POST'
      });

      if (res.ok) {
        addToast({ type: 'success', message: 'Invitation resent successfully' });
      } else {
        const err = await res.json();
        addToast({ type: 'error', message: err.error || 'Failed to resend invitation' });
      }
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to resend invitation' });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div style={{ padding: '48px 64px', maxWidth: '100%', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '56px' }}>
        <div>
          <h1 style={{ fontSize: '52px', fontWeight: 900, margin: 0, letterSpacing: '-0.04em', color: THEME.text, lineHeight: 1.1 }}>Our Elite Team</h1>
          <p style={{ color: THEME.muted, marginTop: '16px', fontSize: '20px', fontWeight: 500 }}>Securely manage your high-performance clinical research team.</p>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          style={{ 
            background: THEME.primary, 
            color: 'white', 
            border: 'none', 
            padding: '20px 40px', 
            borderRadius: '20px', 
            fontWeight: 800, 
            cursor: 'pointer',
            boxShadow: '0 12px 30px rgba(37, 99, 235, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '18px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <span style={{ fontSize: '24px' }}>+</span> Invite Member
        </button>
      </header>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', marginBottom: '64px' }}>
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(8px)', padding: '40px', borderRadius: '32px', border: `1px solid ${THEME.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
          <div style={{ color: THEME.muted, fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Total Members</div>
          <div style={{ fontSize: '52px', fontWeight: 900, marginTop: '20px', color: THEME.text, letterSpacing: '-0.02em' }}>{members.length}</div>
        </div>
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(8px)', padding: '40px', borderRadius: '32px', border: `1px solid ${THEME.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
          <div style={{ color: THEME.muted, fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Active</div>
          <div style={{ fontSize: '52px', fontWeight: 900, marginTop: '20px', color: THEME.success, letterSpacing: '-0.02em' }}>{members.filter(m => m.status === 'ACTIVE').length}</div>
        </div>
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(8px)', padding: '40px', borderRadius: '32px', border: `1px solid ${THEME.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
          <div style={{ color: THEME.muted, fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Pending</div>
          <div style={{ fontSize: '52px', fontWeight: 900, marginTop: '20px', color: '#f59e0b', letterSpacing: '-0.02em' }}>{members.filter(m => m.status === 'PENDING').length}</div>
        </div>
      </div>

      {/* MEMBERS TABLE */}
      <div style={{ background: THEME.card, borderRadius: '24px', border: `1px solid ${THEME.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '32px', borderBottom: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em' }}>Team List</h3>
          <div style={{ position: 'relative' }}>
             <input 
               type="text" 
               placeholder="Search members..." 
               style={{ background: THEME.bg, border: `2px solid ${THEME.border}`, borderRadius: '12px', padding: '12px 20px', color: 'white', fontSize: '16px', width: '320px', outline: 'none' }}
             />
          </div>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${THEME.border}`, color: THEME.muted, fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <th style={{ padding: '24px 32px' }}>Member</th>
              <th style={{ padding: '24px 32px' }}>Role</th>
              <th style={{ padding: '24px 32px' }}>Status</th>
              <th style={{ padding: '24px 32px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3].map(i => (
                <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
                   <td colSpan={4} style={{ padding: '24px', textAlign: 'center' }}>
                      <div style={{ height: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '100%', animation: 'pulse 1.5s infinite' }} />
                   </td>
                </tr>
              ))
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: THEME.muted }}>
                   No team members found. Start by inviting someone!
                </td>
              </tr>
            ) : (
              members.map(member => (
                <tr key={member.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.05)`, transition: 'background 0.2s' }}>
                  <td style={{ padding: '24px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(37, 99, 235, 0.1)', color: THEME.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px' }}>
                        {member.name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '17px', color: THEME.text }}>{member.name}</div>
                        <div style={{ color: THEME.muted, fontSize: '14px', fontWeight: 500 }}>{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '24px 32px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.02em' }}>{member.role.replace('_', ' ').toUpperCase()}</span>
                  </td>
                  <td style={{ padding: '24px 32px' }}>
                    <StatusBadge status={member.status} />
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    {member.status === 'PENDING' ? (
                      <button 
                        onClick={() => handleResend(member.id)}
                        disabled={inviting}
                        style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', color: '#f59e0b', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Resend
                      </button>
                    ) : (
                      <button style={{ background: 'none', border: 'none', color: THEME.muted, cursor: 'pointer', fontSize: '18px' }}>⋮</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* INVITE MODAL */}
      <Modal 
        open={showInviteModal} 
        onClose={() => setShowInviteModal(false)} 
        title="Invite Team Member"
        subtitle="Send an email invitation with specific role access."
        width="600px"
      >
        <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ padding: '0 16px' }}>
            <label style={{ display: 'block', color: THEME.muted, fontSize: '14px', fontWeight: 800, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email Address</label>
            <input 
              required
              type="email" 
              placeholder="colleague@example.com"
              value={inviteData.email}
              onChange={e => setInviteData({...inviteData, email: e.target.value})}
              style={{ width: '100%', background: THEME.bg, border: `2px solid ${THEME.border}`, borderRadius: '16px', padding: '16px 20px', color: 'white', outline: 'none', fontSize: '18px', fontWeight: 500 }}
            />
          </div>
          
          <div style={{ padding: '0 16px' }}>
            <label style={{ display: 'block', color: THEME.muted, fontSize: '14px', fontWeight: 800, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Select Role</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {roles.map(role => (
                <div 
                  key={role.id}
                  onClick={() => setInviteData({...inviteData, role: role.id})}
                  style={{ 
                    padding: '16px 20px', 
                    borderRadius: '16px', 
                    border: `2px solid ${inviteData.role === role.id ? THEME.primary : THEME.border}`,
                    background: inviteData.role === role.id ? 'rgba(37, 99, 235, 0.1)' : THEME.bg,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '16px', color: inviteData.role === role.id ? 'white' : THEME.muted }}>{role.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '16px', padding: '0 16px 16px 16px' }}>
            <button 
              type="button"
              onClick={() => setShowInviteModal(false)}
              style={{ flex: 1, background: 'transparent', border: `2px solid ${THEME.border}`, color: 'white', padding: '18px', borderRadius: '16px', fontWeight: 800, cursor: 'pointer', fontSize: '18px' }}
            >
              Cancel
            </button>
            <button 
              disabled={inviting}
              type="submit"
              style={{ flex: 1, background: THEME.primary, border: 'none', color: 'white', padding: '18px', borderRadius: '16px', fontWeight: 800, cursor: 'pointer', opacity: inviting ? 0.7 : 1, fontSize: '18px', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.2)' }}
            >
              {inviting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
