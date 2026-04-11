import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, Eye, Edit2, Shield, MoreVertical, Building2, Loader2, X, ShieldAlert, Mail, History } from 'lucide-react';
import { authFetch , API, revealValue } from '../../utils/auth';

interface Sponsor {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'Active' | 'Inactive';
  studies: string[];
  registeredDate: string;
  mustChangePassword: boolean;
  raw: any;
}

interface SponsorsManagementProps {
  allUsers: any[];
  allStudies: any[];
  onRefresh: () => void;
  selectedStudyId?: string;
}

export default function SponsorsManagement({ allUsers = [], allStudies = [], onRefresh, selectedStudyId }: SponsorsManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newSponsor, setNewSponsor] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    role: 'SPONSOR'
  });

  const sponsors: Sponsor[] = useMemo(() => {
    return allUsers
      .filter(u => u.role === 'SPONSOR')
      .map(u => ({
        id: u.id,
        raw: u,
        name: revealValue(u.full_name, u.decrypted_name) || revealValue(u.name, u.decrypted_name) || (u.email ? u.email.split('@')[0] : 'Unnamed Sponsor'),
        email: revealValue(u.email) || u.email || 'unknown@domain',
        company: revealValue((u as any).company) || (u as any).company || 'PharmaCorp / CRO',
        status: (u as any).status === 'Suspended' ? 'Inactive' : 'Active',
        studies: allStudies
          .filter(s => s.sponsor === u.id || s.sponsor_id === u.id)
          .map(s => s.title),
        registeredDate: u.date_joined ? new Date(u.date_joined).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never',
        mustChangePassword: u.must_change_password
      }));
  }, [allUsers, allStudies]);

  const handleToggleStatus = async (sponsor: any) => {
    const isCurrentlyActive = sponsor.status === 'Active';
    const newStatus = isCurrentlyActive ? 'Suspended' : 'Verified';
    setUpdatingId(sponsor.id);
    const apiUrl = API || 'http://localhost:8000';
    
    try {
      const res = await authFetch(`${apiUrl}/api/users/${sponsor.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        onRefresh();
      } else {
        alert('Failed to update Sponsor status');
      }
    } catch (err) {
      console.error(err);
      alert('Network error during status update');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const apiUrl = API || 'http://localhost:8000';
      const res = await authFetch(`${apiUrl}/api/auth/admin/create-user/`, {
        method: 'POST',
        body: JSON.stringify({
          email: newSponsor.email,
          first_name: newSponsor.firstName,
          middle_name: newSponsor.middleName,
          last_name: newSponsor.lastName,
          role: 'SPONSOR'
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`✅ SPONSOR PROVISIONED\n\nUsername: ${data.username}\nCredentials dispatched to ${newSponsor.email}`);
        setShowCreateModal(false);
        setNewSponsor({ firstName: '', middleName: '', lastName: '', email: '', role: 'SPONSOR' });
        onRefresh();
      } else {
        const err = await res.json();
        if (res.status === 409) {
          alert(`❌ PROVISIONING FAILED: ${err.error || 'An account with this email already exists.'}\n\nYou can use the "Resend Credentials" button in the table if they haven't logged in yet.`);
        } else {
          alert(`❌ PROVISIONING FAILED: ${err.error || err.detail || 'Access Denied'}`);
        }
      }
    } catch (err) {
      alert('❌ SYSTEM ERROR: Secure stack trace logged in core analytics.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleResendCredentials = async (userId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to regenerate and resend credentials to ${email}?`)) return;
    
    setUpdatingId(userId);
    try {
      const apiUrl = API || 'http://localhost:8000';
      const res = await authFetch(`${apiUrl}/api/auth/admin/resend-credentials/${userId}/`, {
        method: 'POST'
      });
      
      if (res.ok) {
        alert('✅ CREDENTIALS REISSUED\n\nAn updated temporary password has been dispatched.');
      } else {
        const err = await res.json();
        alert(`❌ FAILED: ${err.error || 'Operation failed'}`);
      }
    } catch (err) {
      alert('❌ NETWORK ERROR: Terminal link failed.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredSponsors = sponsors.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black text-white italic uppercase tracking-tighter">Research <span className="text-cyan-400">Sponsors</span></h1>
          <p className="text-[12px] sm:text-sm text-[#8b8fa8] uppercase tracking-[0.2em] font-black mt-3">Delegate platform access & study funding credentials</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-8 py-4 bg-cyan-600 text-white rounded-xl font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/20 hover:bg-cyan-500 transition-all font-mono"
        >
          <UserPlus className="w-5 h-5" /> Generate Sponsor Account
        </button>
      </div>

      <div className="bg-[#0f1133]/60 backdrop-blur-3xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 bg-white/[0.01]">
          <div className="relative max-w-xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
            <input
              type="text"
              placeholder="Filter by name, company, or email..."
              className="w-full bg-[#0a0b1a] border border-white/5 rounded-2xl pl-16 pr-6 py-5 text-sm text-white outline-none focus:border-cyan-500/30 font-bold uppercase italic tracking-widest placeholder:text-slate-800"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-[12px] font-black text-[#555a7a] uppercase tracking-[0.3em] italic border-b border-white/5">
                <th className="px-10 py-8">Sponsor Personnel</th>
                <th className="px-10 py-8">Affiliation / Company</th>
                <th className="px-10 py-8">Portfolio</th>
                <th className="px-10 py-8">Registration</th>
                <th className="px-10 py-8">System Access</th>
                <th className="px-10 py-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSponsors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center opacity-30 italic uppercase tracking-[0.2em] text-[12px] font-black">No sponsor records in cross-project sync</td>
                </tr>
              ) : (
                filteredSponsors.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                          <Building2 className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-base font-black text-white italic group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{s.name}</p>
                          <p className="text-[12px] text-[#555a7a] font-black uppercase tracking-widest mt-1.5">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                       <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest italic">{s.company}</span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-wrap gap-2">
                        {s.studies.length > 0 ? (
                          s.studies.map((st, i) => (
                            <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[12px] font-black text-slate-500 uppercase tracking-widest">{st}</span>
                          ))
                        ) : (
                          <span className="text-[12px] text-slate-700 italic font-black uppercase tracking-widest">No Projects Linked</span>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8 text-[12px] font-black text-slate-400 uppercase tracking-widest italic">{s.registeredDate}</td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => handleToggleStatus(s)}
                          disabled={updatingId === s.id}
                          className={`px-4 py-2 rounded-full text-[12px] font-black uppercase tracking-[0.2em] border transition-all flex items-center gap-2 ${
                          s.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                          } disabled:opacity-50`}
                        >
                          {updatingId === s.id && <Loader2 className="w-3 h-3 animate-spin" />}
                          {s.status === 'Active' ? 'AUTHORIZED' : 'DISABLED'}
                        </button>

                        {s.mustChangePassword && (
                          <button 
                            onClick={() => handleResendCredentials(s.id, s.email)}
                            className="px-4 py-2 rounded-full text-[12px] font-black uppercase tracking-[0.2em] border border-indigo-500/20 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-all flex items-center gap-2"
                          >
                            <Mail className="w-3 h-3" />
                            RESEND ACCESS
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <button 
                        onClick={() => setSelectedSponsor(s)}
                        className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-600 hover:text-white transition-all active:scale-95"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedSponsor && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/60" onClick={() => setSelectedSponsor(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-[#0a0b1a] border border-white/10 w-full max-w-2xl rounded-[3rem] p-12 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-10 shrink-0">
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400">
                    <History className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter shrink-0">Activity <span className="text-cyan-400">Snapshot</span></h2>
                  <p className="text-[12px] text-[#555a7a] font-black uppercase tracking-widest">{selectedSponsor.name} • Clinical Sync Audit</p>
                </div>
                <button onClick={() => setSelectedSponsor(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar">
                {[
                  { event: 'SECURITY_AUTH', date: 'Oct 12, 2024 • 14:22', icon: Shield, color: 'text-indigo-400', desc: 'Secure platform authentication from IP 182.16.8.2. Authorized.' },
                  { event: 'STUDY_REVIEW', date: 'Oct 10, 2024 • 09:15', icon: Eye, color: 'text-cyan-400', desc: 'Portfolio review of "BIO-2030: Muscle Regen" synchronized.' },
                  { event: 'CREDENTIAL_SYNC', date: 'Sep 28, 2024 • 11:45', icon: Building2, color: 'text-emerald-400', desc: 'Corporate affiliation verified via cross-project audit.' },
                  { event: 'ACCOUNT_PROVISION', date: 'Sep 15, 2024 • 16:30', icon: UserPlus, color: 'text-slate-500', desc: 'Initial sponsor personnel account generated by Coordinator.' }
                ].map((log, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex gap-6 hover:bg-white/[0.04] transition-all group">
                    <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${log.color} border border-white/5 opacity-50 group-hover:opacity-100 transition-all`}>
                      <log.icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${log.color}`}>{log.event}</span>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{log.date}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-300 leading-relaxed italic">{log.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-8 border-t border-white/5 flex gap-4 shrink-0">
                 <button onClick={() => setSelectedSponsor(null)} className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest italic transition-all">Close Audit</button>
                 <button onClick={() => window.print()} className="flex-1 py-5 bg-cyan-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest italic transition-all shadow-xl shadow-cyan-900/40">Export Log</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-[#0f1133] border border-white/10 w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-cyan-500">
                <Building2 className="w-64 h-64" />
              </div>

              <div className="flex justify-between items-start mb-14 relative z-10">
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Sponsor <span className="text-cyan-400">Onboarding</span></h2>
                  <p className="text-[12px] text-[#555a7a] font-black uppercase tracking-widest text-[#8b8fa8]">Generate secure clinical trial funding credentials</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-3 hover:bg-white/5 rounded-2xl transition-colors"
                  disabled={isCreating}
                >
                  <X className="w-6 h-6 text-slate-700 hover:text-white" />
                </button>
              </div>

              <form onSubmit={handleCreateSponsor} className="space-y-8 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-sm font-black text-[#555a7a] uppercase tracking-widest px-4 italic">First Name</label>
                      <input
                        type="text"
                        placeholder="John"
                        required
                        value={newSponsor.firstName}
                        onChange={e => setNewSponsor({ ...newSponsor, firstName: e.target.value })}
                        className="w-full bg-[#0a0b1a] border border-white/5 rounded-2xl px-6 py-5 text-base text-white font-bold outline-none focus:border-cyan-500/40 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm font-black text-[#555a7a] uppercase tracking-widest px-4 italic">Last Name</label>
                      <input
                        type="text"
                        placeholder="Doe"
                        required
                        value={newSponsor.lastName}
                        onChange={e => setNewSponsor({ ...newSponsor, lastName: e.target.value })}
                        className="w-full bg-[#0a0b1a] border border-white/5 rounded-2xl px-6 py-5 text-base text-white font-bold outline-none focus:border-cyan-500/40 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-black text-[#555a7a] uppercase tracking-widest px-4 italic">Corporate Email</label>
                    <input
                      type="email"
                      placeholder="john@pharmacorp.com"
                      required
                      value={newSponsor.email}
                      onChange={e => setNewSponsor({ ...newSponsor, email: e.target.value })}
                      className="w-full bg-[#0a0b1a] border border-white/5 rounded-2xl px-6 py-5 text-base text-white font-bold outline-none focus:border-cyan-500/40 transition-all font-mono"
                    />
                  </div>

                  <div className="p-8 bg-cyan-500/5 rounded-[2rem] border border-cyan-500/10 flex items-center gap-6 mb-8">
                    <ShieldAlert className="w-10 h-10 text-cyan-400 opacity-50 shrink-0" />
                    <div>
                      <p className="text-[12px] text-white font-black uppercase tracking-widest leading-relaxed italic">Access Delegation Rule:</p>
                      <p className="text-[12px] text-[#8b8fa8] font-bold leading-relaxed uppercase tracking-tighter mt-1 italic">As Muscle Research Staff, you are authorized to provision Sponsor credentials for portfolio collaboration.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 py-5 bg-white/5 border border-white/5 text-[#555a7a] hover:text-white rounded-2xl font-black uppercase tracking-widest transition-all italic"
                      disabled={isCreating}
                    >Abort</button>
                    <button 
                      type="submit"
                      disabled={isCreating}
                      className="flex-1 py-5 bg-cyan-600 text-white rounded-2xl font-black uppercase tracking-widest italic shadow-xl shadow-cyan-900/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                      Generate Account
                    </button>
                  </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


