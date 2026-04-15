import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, UserPlus, Eye, Building2, Loader2, X,
  ShieldAlert, Mail, RefreshCw, CheckCircle2, Copy
} from 'lucide-react';
import { authFetch, API } from '../../utils/auth';

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
  allUsers?: any[];
  allStudies?: any[];
  onRefresh?: () => void;
  selectedStudyId?: string;
}

export default function SponsorsManagement({ onRefresh, selectedStudyId }: SponsorsManagementProps) {
  const [rawSponsors, setRawSponsors] = useState<any[]>([]);
  const [allStudies, setAllStudies] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const fetchSponsorData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [spRes, stRes] = await Promise.all([
        authFetch(`${API}/api/sponsors/`).then(r => r.json()).catch(() => []),
        authFetch(`${API}/api/studies/`).then(r => r.json()).catch(() => [])
      ]);
      setRawSponsors(Array.isArray(spRes) ? spRes : (spRes.results || []));
      setAllStudies(Array.isArray(stRes) ? stRes : (stRes.results || []));
    } catch (e) {
      console.error('Sponsor data fetch failed:', e);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => { fetchSponsorData(); }, [fetchSponsorData]);

  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCredentialCard, setShowCredentialCard] = useState<{ username: string; email: string } | null>(null);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [newSponsor, setNewSponsor] = useState({ firstName: '', lastName: '', email: '', company: '' });

  const sponsors: Sponsor[] = useMemo(() => rawSponsors.map(u => ({
    id: u.id,
    raw: u,
    name: u.decrypted_name || u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email?.split('@')[0] || 'Unnamed',
    email: u.email || '',
    company: u.company || u.organization || 'Independent / CRO',
    status: (u.status === 'suspended' || u.status === 'Suspended') ? 'Inactive' : 'Active',
    studies: allStudies
      .filter(s => String(s.sponsor) === String(u.id) || String(s.sponsor_id) === String(u.id))
      .map(s => s.title || s.name || 'Untitled Study'),
    registeredDate: u.date_joined ? new Date(u.date_joined).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A',
    mustChangePassword: !!u.must_change_password,
  })), [rawSponsors, allStudies]);

  const filteredSponsors = sponsors.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleStatus = async (sponsor: Sponsor) => {
    const newStatus = sponsor.status === 'Active' ? 'Suspended' : 'Verified';
    setUpdatingId(sponsor.id);
    try {
      const res = await authFetch(`${API}/api/users/${sponsor.id}/`, {
        method: 'PATCH', body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) { fetchSponsorData(); onRefresh?.(); }
      else alert('Failed to update status');
    } catch { alert('Network error'); }
    finally { setUpdatingId(null); }
  };

  const handleCreateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await authFetch(`${API}/api/auth/admin/create-user/`, {
        method: 'POST',
        body: JSON.stringify({
          email: newSponsor.email,
          first_name: newSponsor.firstName,
          last_name: newSponsor.lastName,
          role: 'SPONSOR',
          company: newSponsor.company || undefined
        })
      });
      const data = await res.json();
      if (res.ok || res.status === 201 || res.status === 200) {
        setShowCreateModal(false);
        setNewSponsor({ firstName: '', lastName: '', email: '', company: '' });
        fetchSponsorData(); onRefresh?.();
        if (data.username) setShowCredentialCard({ username: data.username, email: newSponsor.email });
      } else {
        alert(`Failed: ${data.error || data.detail || JSON.stringify(data)}`);
      }
    } catch { alert('Network error.'); }
    finally { setIsCreating(false); }
  };

  const handleResendCredentials = async (userId: string, email: string) => {
    if (!window.confirm(`Resend credentials to ${email}?`)) return;
    setUpdatingId(userId);
    try {
      const res = await authFetch(`${API}/api/auth/admin/resend-credentials/${userId}/`, { method: 'POST' });
      if (res.ok) alert('✅ Credentials resent successfully.');
      else { const err = await res.json(); alert(`Failed: ${err.error}`); }
    } catch { alert('Network error.'); }
    finally { setUpdatingId(null); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const totalActive = sponsors.filter(s => s.status === 'Active').length;

  return (
    <div className="space-y-4">
      {/* ── Header Row ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white italic uppercase tracking-tighter">
            Research <span className="text-cyan-400">Sponsors</span>
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-bold mt-0.5">
            Delegate platform access & study funding credentials
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchSponsorData}
            className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-500 hover:text-white transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg font-black text-[11px] uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:bg-cyan-500 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" /> Generate Sponsor Account
          </button>
        </div>
      </div>

      {/* ── Stats Strip ────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Sponsors', val: sponsors.length },
          { label: 'Active', val: totalActive },
          { label: 'Pending Reset', val: sponsors.filter(s => s.mustChangePassword).length },
        ].map((stat, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{stat.label}</span>
            <span className="text-base font-black text-white italic">{stat.val}</span>
          </div>
        ))}
      </div>

      {/* ── Search ─────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
        <input
          type="text"
          placeholder="Filter by name, company, or email..."
          className="w-full bg-[#0a0b1a] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-[12px] text-white outline-none focus:border-cyan-500/30 font-bold uppercase tracking-wider placeholder:text-slate-700"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      <div className="bg-[#0f1133]/60 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {['Sponsor Personnel', 'Company', 'Portfolio', 'Registered', 'Access', 'Actions'].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {dataLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span className="text-[11px] font-black uppercase tracking-wider">Syncing sponsors...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSponsors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Building2 className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-[11px] text-slate-600 font-black uppercase tracking-wider">
                      {searchTerm ? 'No sponsors match your search' : 'No sponsor records found'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSponsors.map(s => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Sponsor Info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-black text-white italic truncate uppercase tracking-tight leading-none">{s.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold tracking-wider mt-0.5 truncate">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Company */}
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{s.company}</span>
                    </td>
                    {/* Portfolio */}
                    <td className="px-4 py-3">
                      {s.studies.length === 0 ? (
                        <span className="text-[10px] text-slate-700 italic font-bold uppercase">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {s.studies.slice(0, 2).map((st, i) => (
                            <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-black text-slate-500 uppercase tracking-wider truncate max-w-[140px]">{st}</span>
                          ))}
                          {s.studies.length > 2 && (
                            <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-[9px] font-black text-cyan-500 uppercase tracking-wider">+{s.studies.length - 2}</span>
                          )}
                        </div>
                      )}
                    </td>
                    {/* Registered */}
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">{s.registeredDate}</span>
                    </td>
                    {/* Access status */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleToggleStatus(s)}
                          disabled={updatingId === s.id}
                          className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 transition-all disabled:opacity-50 w-fit ${
                            s.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                          }`}
                        >
                          {updatingId === s.id && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                          {s.status === 'Active' ? 'AUTHORIZED' : 'DISABLED'}
                        </button>
                        {s.mustChangePassword && (
                          <button
                            onClick={() => handleResendCredentials(s.id, s.email)}
                            className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all flex items-center gap-1.5 w-fit"
                          >
                            <Mail className="w-2.5 h-2.5" /> RESEND
                          </button>
                        )}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedSponsor(s)}
                        className="p-1.5 bg-white/5 border border-white/5 rounded-lg text-slate-600 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREDENTIAL CARD ─────────────────────────────────── */}
      <AnimatePresence>
        {showCredentialCard && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/70">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0a0b1a] border border-emerald-500/20 w-full max-w-md rounded-2xl p-8 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white italic uppercase">Account Provisioned</h2>
                  <p className="text-[10px] text-emerald-400 font-black uppercase tracking-wider mt-0.5">Credentials dispatched via email</p>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Email</p>
                  <p className="text-sm font-black text-white font-mono">{showCredentialCard.email}</p>
                </div>
                <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Username</p>
                    <p className="text-sm font-black text-cyan-400 font-mono">{showCredentialCard.username}</p>
                  </div>
                  <button onClick={() => copyToClipboard(showCredentialCard.username)} className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400 hover:bg-cyan-500/20">
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                  <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">🔒 Temporary password sent to their email. Must reset on first login.</p>
                </div>
              </div>
              <button onClick={() => setShowCredentialCard(null)} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-wider text-[11px] hover:bg-emerald-500">Done</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DETAIL DRAWER ───────────────────────────────────── */}
      <AnimatePresence>
        {selectedSponsor && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60" onClick={() => setSelectedSponsor(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0b1a] border border-white/10 w-full max-w-lg rounded-2xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-base font-black text-white italic uppercase tracking-tighter">
                    Sponsor <span className="text-cyan-400">Profile</span>
                  </h2>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mt-0.5">{selectedSponsor.name}</p>
                </div>
                <button onClick={() => setSelectedSponsor(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {[
                  { label: 'Email', val: selectedSponsor.email },
                  { label: 'Company', val: selectedSponsor.company },
                  { label: 'Status', val: selectedSponsor.status },
                  { label: 'Registered', val: selectedSponsor.registeredDate },
                  { label: 'Studies', val: selectedSponsor.studies.length > 0 ? selectedSponsor.studies.join(', ') : 'None linked' },
                  { label: 'Pending Reset', val: selectedSponsor.mustChangePassword ? 'Yes' : 'No' },
                ].map((row, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest shrink-0">{row.label}</p>
                    <p className="text-[11px] font-black text-white italic text-right">{row.val}</p>
                  </div>
                ))}
                {selectedSponsor.mustChangePassword && (
                  <button onClick={() => { handleResendCredentials(selectedSponsor.id, selectedSponsor.email); setSelectedSponsor(null); }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all mt-2">
                    <Mail className="w-3.5 h-3.5" /> Resend Access Credentials
                  </button>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex gap-3">
                <button onClick={() => setSelectedSponsor(null)} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all">Close</button>
                <button
                  onClick={() => handleToggleStatus(selectedSponsor)}
                  disabled={updatingId === selectedSponsor.id}
                  className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    selectedSponsor.status === 'Active' ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {updatingId === selectedSponsor.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {selectedSponsor.status === 'Active' ? 'Suspend' : 'Restore Access'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CREATE MODAL ────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f1133] border border-white/10 w-full max-w-lg rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-base font-black text-white italic uppercase tracking-tighter">Sponsor <span className="text-cyan-400">Onboarding</span></h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Generate secure clinical trial credentials</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} disabled={isCreating} className="p-2 hover:bg-white/5 rounded-xl">
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <form onSubmit={handleCreateSponsor} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'First Name', key: 'firstName', placeholder: 'John', required: true },
                    { label: 'Last Name', key: 'lastName', placeholder: 'Doe', required: true },
                  ].map(f => (
                    <div key={f.key} className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block ml-0.5">{f.label}</label>
                      <input
                        type="text"
                        placeholder={f.placeholder}
                        required={f.required}
                        value={(newSponsor as any)[f.key]}
                        onChange={e => setNewSponsor({ ...newSponsor, [f.key]: e.target.value })}
                        className="w-full bg-[#0a0b1a] border border-white/5 rounded-xl px-3 py-2.5 text-[12px] text-white font-bold outline-none focus:border-cyan-500/40 transition-all"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block ml-0.5">Corporate Email</label>
                  <input
                    type="email"
                    placeholder="john@pharmacorp.com"
                    required
                    value={newSponsor.email}
                    onChange={e => setNewSponsor({ ...newSponsor, email: e.target.value })}
                    className="w-full bg-[#0a0b1a] border border-white/5 rounded-xl px-3 py-2.5 text-[12px] text-white font-bold outline-none focus:border-cyan-500/40 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block ml-0.5">Company <span className="text-slate-600">(optional)</span></label>
                  <input
                    type="text"
                    placeholder="PharmaCorp Inc."
                    value={newSponsor.company}
                    onChange={e => setNewSponsor({ ...newSponsor, company: e.target.value })}
                    className="w-full bg-[#0a0b1a] border border-white/5 rounded-xl px-3 py-2.5 text-[12px] text-white font-bold outline-none focus:border-cyan-500/40 transition-all"
                  />
                </div>

                <div className="p-3 bg-cyan-500/5 rounded-xl border border-cyan-500/10 flex items-center gap-3">
                  <ShieldAlert className="w-7 h-7 text-cyan-400 opacity-40 shrink-0" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide leading-relaxed">
                    A temporary password will be emailed to the sponsor. They must reset it on first login.
                  </p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowCreateModal(false)} disabled={isCreating}
                    className="flex-1 py-2.5 bg-white/5 border border-white/5 text-slate-400 hover:text-white rounded-xl font-black uppercase tracking-wider text-[11px] transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={isCreating}
                    className="flex-1 py-2.5 bg-cyan-600 text-white rounded-xl font-black uppercase tracking-wider text-[11px] shadow-lg shadow-cyan-900/40 hover:bg-cyan-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
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
