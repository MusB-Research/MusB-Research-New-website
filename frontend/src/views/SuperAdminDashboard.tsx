import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authFetch, clearToken, getRole, performLogout, getDisplayName, revealValue, API } from '../utils/auth';
import { getMediaUrl } from '../utils/media';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Briefcase, Activity, Crown, Shield, Bell, Settings, LogOut, Search,
  Plus, Eye, Edit2, Trash2, ChevronRight, Building, Building2, BarChart2, Globe,
  Megaphone, FileText, UserCheck, AlertTriangle, Zap, X, ExternalLink,
  ChevronDown, Filter, Mail, Phone, Calendar, ArrowRight, ShieldCheck,
  LayoutDashboard, Server, Network, Terminal, CheckCircle2, MoreVertical,
  MapPin, Clock, MousePointer2, User as UserIcon, Menu, RefreshCw,
  UserPlus, ShieldAlert, Rocket, ClipboardList, Archive, BookOpen,
  Power, PowerOff, Upload
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import LogoutConfirmationModal from '../components/LogoutConfirmationModal';

import QuestionnaireBuilder from '../components/coordinator/QuestionnaireBuilder';
import LaunchStudyForm from '../components/coordinator/LaunchStudyForm';
import PIsManagement from '../components/admin/PIsManagement';
import CoordinatorsManagement from '../components/admin/CoordinatorsManagement';
import ParticipantsManagement from '../components/admin/ParticipantsManagement';
import LiveActiveUsers from '../components/admin/LiveActiveUsers';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import AuditLogs from '../components/admin/AuditLogs';
import WorkflowModerationPanel from '../components/admin/WorkflowModerationPanel';
import SubmitContentForms from '../components/coordinator/SubmitContentForms';
import ApprovalModule from '../components/admin/ApprovalModule';
import CareerManagement from '../components/admin/CareerManagement';
import SupportModule from '../components/coordinator/support/SupportEntry';
import StudyInquiriesModule from '../components/admin/StudyInquiriesModule';
import { usePolling } from '../hooks/usePolling';

// ═══════════════════════════════════════════
// TYPES & MOCK DATA
// ═══════════════════════════════════════════

type Page =
  | 'DASHBOARD' | 'ACTIVITY_LOG' | 'ALL_USERS' | 'STUDIES' | 'SPONSORS'
  | 'SPONSOR_LEADS' | 'METRICS' | 'TEAM' | 'INQUIRIES'
  | 'ANNOUNCEMENTS' | 'AUDIT_LOGS' | 'SETTINGS'
  | 'LAUNCH_STUDY' | 'SCREENER_BUILDER'
  | 'COORDINATORS' | 'PARTICIPANTS' | 'LIVE_USERS' | 'WORKFLOW' | 'SUBMIT_CONTENT' | 'TEAM_APPROVALS' | 'CAREERS' | 'SUPPORT'
  | 'MELLOW_TRIAL' | 'MELLOW_INVESTIGATORS';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
  created: string;
  must_reset?: boolean;
  profile_incomplete?: boolean;
  full_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  is_mellow_member?: boolean;
  country?: string;
  mobile_number?: string;
  place_of_origin?: string;
  medical_licence?: string;
  insurance_certificate?: string;
  cv_document?: string;
}

interface Sponsor {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  studies: number;
  status: 'Active' | 'Inactive';
}

interface Activity {
  id: string;
  timestamp: string;
  type: string;
  category: string;
  user: string;
  details: string;
  ip: string;
  severity: 'info' | 'warning' | 'danger';
}

const ROLES = [
  { id: 'SUPER_ADMIN', label: 'SUPER_ADMIN', color: '#7c3aed', desc: 'Full platform access, user management, system settings, all data', isYou: true },
  { id: 'ADMIN', label: 'ADMIN', color: '#3b82f6', desc: 'Study management, team management, participant data, reports' },
  { id: 'COORDINATOR', label: 'COORDINATOR', color: '#14b8a6', desc: 'Participant management, scheduling, communications, safety' },
  { id: 'PI', label: 'PI', color: '#6366f1', desc: 'Study oversight, protocol review, adverse event management' },
  { id: 'DATA_MANAGER', label: 'DATA_MANAGER', color: '#64748b', desc: 'Read-only data access, exports, reporting' },
  { id: 'SPONSOR', label: 'SPONSOR', color: '#ec4899', desc: 'Study inquiry, progress dashboards, blinded reporting' },
  { id: 'PARTICIPANT', label: 'PARTICIPANT', color: '#22c55e', desc: 'Own study data, tasks, communications' },
];

const getStudyIdentifier = (study: any): string | null => {
  if (!study) return null;
  return study.protocol_id || study.id || study._id || null;
};

const MultiAssignCell = ({
  studyId, piIds, coordinatorIds, availablePIs, availableCoords, onRefresh
}: {
  studyId: string;
  piIds: string[];
  coordinatorIds: string[];
  availablePIs: User[];
  availableCoords: User[];
  onRefresh: () => void;
}) => {
  const [showPIDropdown, setShowPIDropdown] = useState(false);
  const [showCoordDropdown, setShowCoordDropdown] = useState(false);
  const piRef = React.useRef<HTMLDivElement>(null);
  const coordRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (piRef.current && !piRef.current.contains(e.target as Node)) setShowPIDropdown(false);
      if (coordRef.current && !coordRef.current.contains(e.target as Node)) setShowCoordDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleAssign = async (role: 'pi' | 'coordinator', userId: string, currentIds: string[]) => {
    const apiUrl = API || 'http://localhost:8003';
    const newIds = currentIds.includes(userId)
      ? currentIds.filter(id => id !== userId)
      : [...currentIds, userId];
    const field = role === 'pi' ? 'pi_ids' : 'coordinator_ids';
    try {
      const res = await authFetch(`${apiUrl}/api/studies/${studyId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: newIds })
      });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error(`${role === 'pi' ? 'PI' : 'Coordinator'} update failed:`, err);
    }
  };

  return (
    <div className="flex flex-col gap-3 min-w-[160px]">
      <div className="relative" ref={piRef}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowPIDropdown(v => !v); setShowCoordDropdown(false); }}
          className="flex items-center gap-1.5 text-[12px] font-black uppercase tracking-widest text-blue-400 hover:text-white transition-colors"
        >
          <span>{piIds.length > 0 ? `${piIds.length} PI${piIds.length > 1 ? 's' : ''}` : '-- Select PI --'}</span>
          <ChevronDown className="w-3 h-3 shrink-0" />
        </button>
        {piIds.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {piIds.map(id => {
              const pi = availablePIs.find(u => u.id === id);
              if (!pi) return null;
              return (
                <span key={id} className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[11px] font-black uppercase tracking-wide">
                  {pi.name.split(' ')[0]}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleAssign('pi', id, piIds); }}
                    className="hover:text-red-400 transition-colors ml-0.5 leading-none"
                  >×</button>
                </span>
              );
            })}
          </div>
        )}
        {showPIDropdown && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-[#1a1c3d] border border-blue-500/30 rounded-xl shadow-2xl z-[1001] overflow-hidden py-1 backdrop-blur-md">
            <div className="px-4 py-2 border-b border-white/5 bg-white/5 text-[10px] font-bold text-blue-400 uppercase tracking-widest">Select Clinical PI</div>
            {availablePIs.length === 0 ? (
              <p className="px-4 py-4 text-[11px] text-slate-500 uppercase tracking-widest italic">No PIs found in database</p>
            ) : availablePIs.map(pi => (
              <button
                key={pi.id}
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleAssign('pi', pi.id, piIds); }}
                className={`w-full flex items-center justify-between px-4 py-3 text-[12px] font-black uppercase tracking-widest transition-all hover:bg-blue-500/10 ${piIds.includes(pi.id) ? 'text-blue-400 bg-blue-500/5' : 'text-slate-300 hover:text-white'}`}
              >
                <span className="truncate">{pi.name}</span>
                {piIds.includes(pi.id) && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-2" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative" ref={coordRef}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowCoordDropdown(v => !v); setShowPIDropdown(false); }}
          className="flex items-center gap-1.5 text-[12px] font-black uppercase tracking-widest text-cyan-400 hover:text-white transition-colors"
        >
          <span>{coordinatorIds.length > 0 ? `${coordinatorIds.length} Coord${coordinatorIds.length > 1 ? 's' : ''}` : '-- Select Coord --'}</span>
          <ChevronDown className="w-3 h-3 shrink-0" />
        </button>
        {coordinatorIds.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {coordinatorIds.map(id => {
              const coord = availableCoords.find(u => u.id === id);
              if (!coord) return null;
              return (
                <span key={id} className="flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full text-[11px] font-black uppercase tracking-wide">
                  {coord.name.split(' ')[0]}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleAssign('coordinator', id, coordinatorIds); }}
                    className="hover:text-red-400 transition-colors ml-0.5 leading-none"
                  >×</button>
                </span>
              );
            })}
          </div>
        )}
        {showCoordDropdown && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-[#1a1c3d] border border-cyan-500/30 rounded-xl shadow-2xl z-[1001] overflow-hidden py-1 backdrop-blur-md">
            <div className="px-4 py-2 border-b border-white/5 bg-white/5 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Select Coordinator</div>
            {availableCoords.length === 0 ? (
              <p className="px-4 py-4 text-[11px] text-slate-500 uppercase tracking-widest italic">No coordinators found</p>
            ) : availableCoords.map(coord => (
              <button
                key={coord.id}
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleAssign('coordinator', coord.id, coordinatorIds); }}
                className={`w-full flex items-center justify-between px-4 py-3 text-[12px] font-black uppercase tracking-widest transition-all hover:bg-cyan-500/10 ${coordinatorIds.includes(coord.id) ? 'text-cyan-400 bg-cyan-500/5' : 'text-slate-300 hover:text-white'}`}
              >
                <span className="truncate">{coord.name}</span>
                {coordinatorIds.includes(coord.id) && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-2" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SponsorAssignCell = ({
  studyId, sponsorIds, availableSponsors, onRefresh
}: {
  studyId: string;
  sponsorIds: string[];
  availableSponsors: User[];
  onRefresh: () => void;
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleSponsor = async (userId: string) => {
    const apiUrl = API || 'http://localhost:8003';
    const newIds = sponsorIds.includes(userId)
      ? sponsorIds.filter(id => id !== userId)
      : [...sponsorIds, userId];
    try {
      const res = await authFetch(`${apiUrl}/api/studies/${studyId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ sponsor_ids: newIds })
      });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error('Sponsor update failed:', err);
    }
  };

  return (
    <div className="relative min-w-[140px]" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setShowDropdown(v => !v); }}
        className="flex items-center gap-1.5 text-[12px] font-black uppercase tracking-widest text-[#f472b6] hover:text-white transition-colors"
      >
        <span>{sponsorIds.length > 0 ? `${sponsorIds.length} Sponsor${sponsorIds.length > 1 ? 's' : ''}` : '-- Add Sponsor --'}</span>
        <ChevronDown className="w-3 h-3 shrink-0" />
      </button>
      {sponsorIds.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {sponsorIds.map(id => {
            const sp = availableSponsors.find(u => u.id === id);
            if (!sp) return null;
            return (
              <span key={id} className="flex items-center gap-1 px-2 py-0.5 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full text-[11px] font-black uppercase tracking-wide">
                {sp.name.split(' ')[0]}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleSponsor(id); }}
                  className="hover:text-red-400 transition-colors ml-0.5 leading-none"
                >×</button>
              </span>
            );
          })}
        </div>
      )}
      {showDropdown && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-[#1a1c3d] border border-pink-500/30 rounded-xl shadow-2xl z-[1001] overflow-hidden py-1 backdrop-blur-md">
          <div className="px-4 py-2 border-b border-white/5 bg-white/5 text-[10px] font-bold text-pink-400 uppercase tracking-widest">Select Sponsor</div>
          {availableSponsors.length === 0 ? (
            <p className="px-4 py-4 text-[11px] text-slate-500 uppercase tracking-widest italic">No sponsors found</p>
          ) : availableSponsors.map(sp => (
            <button
              key={sp.id}
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleSponsor(sp.id); }}
              className={`w-full flex items-center justify-between px-4 py-3 text-[12px] font-black uppercase tracking-widest transition-all hover:bg-pink-500/10 ${sponsorIds.includes(sp.id) ? 'text-pink-400 bg-pink-500/5' : 'text-slate-300 hover:text-white'}`}
            >
              <span className="truncate">{sp.name}</span>
              {sponsorIds.includes(sp.id) && <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const StudiesPage = ({
  studies, users, fetchData, handleStudiesLink, setSelectedStudy, handlePageChange
}: any) => {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-4xl font-black text-white italic truncate tracking-tighter uppercase">Platform <span className="text-[#3b82f6]">Studies</span></h2>
          <p className="text-[12px] text-[#8b8fa8] uppercase tracking-widest mt-2">Global clinical trial inventory and lifecycle management</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <button onClick={handleStudiesLink} className="flex-1 sm:flex-none justify-center px-4 sm:px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg font-bold text-[12px] uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-all">
            <ExternalLink className="w-4 h-4" /> Public Portal
          </button>
        </div>
      </div>

      <div className="bg-[#0f1133] border border-white/5 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] text-sm font-black text-[#555a7a] uppercase tracking-widest italic border-b border-white/5">
                <th className="px-6 py-4">Study Details</th>
                <th className="px-6 py-4">Sponsor</th>
                <th className="px-6 py-4">Medical Team</th>
                <th className="px-6 py-4">Clinical Matrix Stage</th>
                <th className="px-6 py-4">Participants</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Master Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...(studies || [])]
                .map((study, i) => (
                  <tr key={study.id || i} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 bg-blue-500/10 text-blue-400 shrink-0">
                          <Briefcase className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-base md:text-lg font-black text-white italic hover:text-blue-400 transition-colors uppercase tracking-tight">{study.title}</p>
                          <p className="text-[12px] text-[#555a7a] font-black uppercase tracking-widest mt-1">STUDY ID: {study.protocol_id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <SponsorAssignCell
                        studyId={getStudyIdentifier(study) || study.id}
                        sponsorIds={study.sponsor_ids || (study.sponsor_id ? [study.sponsor_id] : [])}
                        availableSponsors={users.filter((u: any) => u.role === 'SPONSOR')}
                        onRefresh={fetchData}
                      />
                    </td>

                    <td className="px-6 py-4">
                      <MultiAssignCell
                        studyId={getStudyIdentifier(study) || study.id}
                        piIds={study.pi_ids || (study.pi_id ? [study.pi_id] : [])}
                        coordinatorIds={study.coordinator_ids || (study.coordinator_id ? [study.coordinator_id] : [])}
                        availablePIs={users.filter((u: any) => u.role === 'PI')}
                        availableCoords={users.filter((u: any) => u.role === 'COORDINATOR')}
                        onRefresh={fetchData}
                      />
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={study.study_type}
                        onChange={async (e) => {
                          const newType = e.target.value;
                          const apiUrl = API || 'http://localhost:8003';
                          try {
                            const res = await authFetch(`${apiUrl}/api/studies/${getStudyIdentifier(study) || study.id}/`, {
                              method: 'PATCH',
                              body: JSON.stringify({ study_type: newType })
                            });
                            if (res.ok) fetchData();
                          } catch (err) { }
                        }}
                        className="bg-transparent text-[12px] font-black uppercase tracking-widest text-slate-400 outline-none cursor-pointer hover:text-white transition-all border-none"
                      >
                        <option value="IN_PERSON" className="bg-[#0a0b1a]">In-Person</option>
                        <option value="VIRTUAL" className="bg-[#0a0b1a]">Virtual</option>
                        <option value="DECENTRALIZED" className="bg-[#0a0b1a]">Hybrid</option>
                      </select>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 min-w-[120px]">
                        <div className="flex justify-between items-center text-[12px] font-black uppercase text-slate-500">
                          <div className="flex items-center gap-1">
                            <span>Target:</span>
                            <input
                              type="number"
                              value={study.target_screened}
                              onChange={async (e) => {
                                const newTarget = parseInt(e.target.value) || 0;
                                const apiUrl = API || 'http://localhost:8003';
                                try {
                                  await authFetch(`${apiUrl}/api/studies/${getStudyIdentifier(study) || study.id}/`, {
                                    method: 'PATCH',
                                    body: JSON.stringify({ target_screened: newTarget })
                                  });
                                  fetchData();
                                } catch (err) { }
                              }}
                              className="w-12 bg-white/5 border-none outline-none text-blue-400 font-black italic focus:text-white"
                            />
                          </div>
                          <span className="text-white">{Math.round((study.actual_screened || 0) / (study.target_screened || 1) * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(100, (study.actual_screened || 0) / (study.target_screened || 1) * 100)}%` }}></div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={study.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          const apiUrl = API || 'http://localhost:8003';
                          const sid = getStudyIdentifier(study);
                          if (!sid) return;
                          try {
                            const res = await authFetch(`${apiUrl}/api/studies/${sid}/`, {
                              method: 'PATCH',
                              body: JSON.stringify({ status: newStatus, stage: newStatus })
                            });
                            if (res.ok) fetchData();
                          } catch (err) { }
                        }}
                        className={`text-[12px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border outline-none cursor-pointer transition-all ${['ACTIVE', 'RECRUITING'].includes(study.status) ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                          ['DRAFT', 'PROPOSAL_SUBMITTED', 'PROPOSAL_UNDER_NEGOTIATION'].includes(study.status) ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                            ['IRB_PROTOCOL_INITIATED', 'UNDER_IRB_SUBMISSION', 'IRB_APPROVED'].includes(study.status) ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                              study.status === 'PREPARING_TO_LAUNCH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                ['RECRUITMENT_COMPLETED', 'ANALYSIS_UNDERWAY'].includes(study.status) ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                  ['PROGRESS_REPORT_DRAFT', 'FINAL_REPORT_SENT', 'COMPLETED'].includes(study.status) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    study.status === 'PAUSED' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                                      study.status === 'CLOSED_ARCHIVED' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                                        'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          }`}
                      >
                        <option value="DRAFT" className="bg-[#0a0b1a]">Draft</option>
                        <option value="PROPOSAL_SUBMITTED" className="bg-[#0a0b1a]">Proposal Submitted</option>
                        <option value="PROPOSAL_UNDER_NEGOTIATION" className="bg-[#0a0b1a]">Proposal Under Negotiation</option>
                        <option value="AGREEMENT_SIGNED" className="bg-[#0a0b1a]">Agreement Signed</option>
                        <option value="IRB_PROTOCOL_INITIATED" className="bg-[#0a0b1a]">IRB Protocol Initiated</option>
                        <option value="UNDER_IRB_SUBMISSION" className="bg-[#0a0b1a]">Under IRB Submission / Dev</option>
                        <option value="IRB_APPROVED" className="bg-[#0a0b1a]">IRB Approved</option>
                        <option value="PREPARING_TO_LAUNCH" className="bg-[#0a0b1a]">Preparing to Launch</option>
                        <option value="ACTIVE" className="bg-[#0a0b1a]">Active</option>
                        <option value="RECRUITING" className="bg-[#0a0b1a]">Recruiting</option>
                        <option value="RECRUITMENT_COMPLETED" className="bg-[#0a0b1a]">Recruitment Completed</option>
                        <option value="ANALYSIS_UNDERWAY" className="bg-[#0a0b1a]">Analysis Underway</option>
                        <option value="PROGRESS_REPORT_DRAFT" className="bg-[#0a0b1a]">Progress Report Draft</option>
                        <option value="FINAL_REPORT_SENT" className="bg-[#0a0b1a]">Final Report Sent</option>
                        <option value="COMPLETED" className="bg-[#0a0b1a]">Completed</option>
                        <option value="PAUSED" className="bg-[#0a0b1a]">Paused</option>
                        <option value="CLOSED_ARCHIVED" className="bg-[#0a0b1a]">Closed / Archived</option>
                      </select>
                    </td>

                    <td className="px-6 py-4 text-right min-w-[160px]">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedStudy(study);
                            handlePageChange('LAUNCH_STUDY');
                          }}
                          className="p-2.5 text-slate-400 hover:text-white transition-colors hover:bg-white/10 rounded-xl border border-white/5 hover:border-white/20"
                          title="Configure Protocol"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            const newStatus = study.status === 'CLOSED_ARCHIVED' ? 'RECRUITING' : 'CLOSED_ARCHIVED';
                            const apiUrl = API || 'http://localhost:8003';
                            const sid = getStudyIdentifier(study);
                            if (!sid) return;
                            try {
                              const res = await authFetch(`${apiUrl}/api/studies/${sid}/`, {
                                method: 'PATCH',
                                body: JSON.stringify({ status: newStatus })
                              });
                              if (res.ok) fetchData();
                            } catch (err) { }
                          }}
                          className={`p-2.5 transition-colors hover:bg-white/10 rounded-xl border border-white/5 ${study.status === 'CLOSED_ARCHIVED' ? 'text-emerald-400 hover:border-emerald-500/30' : 'text-cyan-500/70 hover:text-cyan-500 hover:border-cyan-500/30'}`}
                          title={study.status === 'CLOSED_ARCHIVED' ? 'Unarchive Study' : 'Archive Study'}
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            const confirmMsg = `⚠️ IRREVERSIBLE ACTION\n\nStudy: ${study.title.toUpperCase()}\n\nDelete permanently?`;
                            if (window.confirm(confirmMsg)) {
                              const sid = getStudyIdentifier(study);
                              if (!sid) return;
                              try {
                                const res = await authFetch(`${API}/api/studies/${sid}/`, { method: 'DELETE' });
                                if (res.ok) fetchData();
                              } catch (e) { }
                            }
                          }}
                          className="p-2.5 text-rose-500/50 hover:text-rose-500 transition-colors hover:bg-rose-500/10 rounded-xl border border-white/5 hover:border-rose-500/20"
                          title="Purge Study"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default function SuperAdminDashboard() {
  const emptyStaffRecords = {
    leadership: [] as any[],
    advisors: [] as any[],
    staff: [] as any[],
    collaborators: [] as any[]
  };
  const groupTeamMembers = useCallback((members: any[] = []) => ({
    leadership: members.filter((member: any) => member.category === 'leadership'),
    advisors: members.filter((member: any) => member.category === 'advisors'),
    staff: members.filter((member: any) => member.category === 'staff'),
    collaborators: members.filter((member: any) => member.category === 'collaborators')
  }), []);
  const navigate = useNavigate();
  const location = useLocation();

  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const route = location.pathname.split('/').filter(Boolean).pop();
    if (route === 'activity') return 'ACTIVITY_LOG';
    if (route === 'users') return 'ALL_USERS';
    if (route === 'studies') return 'STUDIES';
    if (route === 'sponsors') return 'SPONSORS';
    if (route === 'sponsor-leads') return 'SPONSOR_LEADS';
    if (route === 'metrics') return 'METRICS';
    if (route === 'team') return 'TEAM';
    if (route === 'inquiries') return 'INQUIRIES';
    if (route === 'announcements') return 'ANNOUNCEMENTS';
    if (route === 'audit') return 'AUDIT_LOGS';
    if (route === 'settings') return 'SETTINGS';
    if (route === 'launch-study') return 'LAUNCH_STUDY';
    if (route === 'screener-builder') return 'SCREENER_BUILDER';
    if (route === 'coordinators') return 'COORDINATORS';
    if (route === 'participants') return 'PARTICIPANTS';
    if (route === 'live-users') return 'LIVE_USERS';
    if (route === 'workflow') return 'WORKFLOW';
    if (route === 'content') return 'SUBMIT_CONTENT';
    if (route === 'approvals') return 'TEAM_APPROVALS';
    if (route === 'careers') return 'CAREERS';
    if (route === 'support') return 'SUPPORT';
    return 'DASHBOARD';
  });

  useEffect(() => {
    const route = location.pathname.split('/').filter(Boolean).pop();
    if (route === 'activity') setCurrentPage('ACTIVITY_LOG');
    else if (route === 'users') setCurrentPage('ALL_USERS');
    else if (route === 'studies') setCurrentPage('STUDIES');
    else if (route === 'sponsors') setCurrentPage('SPONSORS');
    else if (route === 'sponsor-leads') setCurrentPage('SPONSOR_LEADS');
    else if (route === 'metrics') setCurrentPage('METRICS');
    else if (route === 'team') setCurrentPage('TEAM');
    else if (route === 'inquiries') setCurrentPage('INQUIRIES');
    else if (route === 'announcements') setCurrentPage('ANNOUNCEMENTS');
    else if (route === 'audit') setCurrentPage('AUDIT_LOGS');
    else if (route === 'settings') setCurrentPage('SETTINGS');
    else if (route === 'launch-study') setCurrentPage('LAUNCH_STUDY');
    else if (route === 'screener-builder') setCurrentPage('SCREENER_BUILDER');
    else if (route === 'coordinators') setCurrentPage('COORDINATORS');
    else if (route === 'participants') setCurrentPage('PARTICIPANTS');
    else if (route === 'live-users') setCurrentPage('LIVE_USERS');
    else if (route === 'workflow') setCurrentPage('WORKFLOW');
    else if (route === 'content') setCurrentPage('SUBMIT_CONTENT');
    else if (route === 'approvals') setCurrentPage('TEAM_APPROVALS');
    else if (route === 'careers') setCurrentPage('CAREERS');
    else if (route === 'support') setCurrentPage('SUPPORT');
    else if (route === 'mellow-trial') setCurrentPage('MELLOW_TRIAL');
    else if (route === 'mellow-investigators') setCurrentPage('MELLOW_INVESTIGATORS');
    else if (location.pathname.endsWith('/super-admin') || !route || route === 'super-admin') setCurrentPage('DASHBOARD');
  }, [location.pathname]);

  const handlePageChange = (page: Page) => {
    const slugs: Record<string, string> = {
      'DASHBOARD': '',
      'ACTIVITY_LOG': 'activity',
      'ALL_USERS': 'users',
      'STUDIES': 'studies',
      'SPONSORS': 'sponsors',
      'SPONSOR_LEADS': 'sponsor-leads',
      'METRICS': 'metrics',
      'TEAM': 'team',
      'INQUIRIES': 'inquiries',
      'ANNOUNCEMENTS': 'announcements',
      'AUDIT_LOGS': 'audit',
      'SETTINGS': 'settings',
      'LAUNCH_STUDY': 'launch-study',
      'SCREENER_BUILDER': 'screener-builder',
      'COORDINATORS': 'coordinators',
      'PARTICIPANTS': 'participants',
      'LIVE_USERS': 'live-users',
      'WORKFLOW': 'workflow',
      'SUBMIT_CONTENT': 'content',
      'TEAM_APPROVALS': 'approvals',
      'CAREERS': 'careers',
      'SUPPORT': 'support',
      'MELLOW_TRIAL': 'mellow-trial',
      'MELLOW_INVESTIGATORS': 'mellow-investigators'
    };
    
    // Clear selected items when navigating via menu to prevent state carry-over
    // unless navigating to the same page or explicit edit context.
    if (page === 'LAUNCH_STUDY' && currentPage !== 'LAUNCH_STUDY') {
      setSelectedStudy(null);
    }
    if (page === 'TEAM' && currentPage !== 'TEAM') {
      setEditingStaff(null);
    }
    
    const slug = slugs[page];
    setCurrentPage(page);
    navigate(`/dashboard/super-admin${slug ? '/' + slug : ''}`);
  };

  const ClockDisplay = React.memo(() => {
    const [clock, setClock] = useState(new Date());
    useEffect(() => {
      const timer = setInterval(() => setClock(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);
    return (
      <div className="flex flex-col items-end text-right border-r border-white/5 pr-2 md:pr-4">
        <span className="text-[14px] md:text-lg font-black text-[#7c3aed] font-mono tracking-tighter tabular-nums leading-none">
          {clock.toLocaleTimeString('en-US', { hour12: false })}
        </span>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          {clock.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
        </span>
      </div>
    );
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date().toLocaleTimeString());

  const [showNotifications, setShowNotifications] = useState(false);
  const [modals, setModals] = useState({ createUser: false, createAnnouncement: false });
  const [selectedStudy, setSelectedStudy] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [creationRole, setCreationRole] = useState('PI');
  const profileRef = React.useRef<HTMLDivElement>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [studies, setStudies] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [studyInquiries, setStudyInquiries] = useState<any[]>([]);
  const [participantLeads, setParticipantLeads] = useState<any[]>([]);
  const [facilityInquiries, setFacilityInquiries] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [staffRecords, setStaffRecords] = useState<any>(emptyStaffRecords);
  const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [addingStaffCategory, setAddingStaffCategory] = useState<'leadership' | 'advisors' | 'staff' | 'collaborators'>('staff');
  const [isRemoveStaffConfirmOpen, setIsRemoveStaffConfirmOpen] = useState(false);
  const [staffToRemove, setStaffToRemove] = useState<any>(null);
  const [newStaffData, setNewStaffData] = useState<any>({ 
    name: '', 
    role: '', 
    dept: '', 
    bio: '',
    expanded_bio: '',
    expertise_tags: '',
    affiliations: '',
    publications: ''
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<any[]>([]);

  const addToast = useCallback((msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const notifications = useMemo(() => {
    const list = [
      { id: 's1', text: 'New login from unknown IP: 182.16.0.4', time: '2m ago', unread: true },
      { id: 's3', text: 'System backup completed successfully', time: '4h ago', unread: false },
    ];
    (studyInquiries || []).slice(0, 5).forEach((iq, i) => {
      if (iq.status === 'NDA_REQUESTED' || iq.status === 'PRELIMINARY') {
        list.unshift({
          id: `iq-${iq.id || i}`,
          text: `Sponsor Lead "${iq.product_name}" requested proposal`,
          time: 'New',
          unread: true
        });
      }
    });
    return list;
  }, [studyInquiries]);

  const formatName = useCallback((name: string) => {
    if (!name) return 'Unknown User';
    if (name.toUpperCase().startsWith('GAAAA')) return 'Identity Locked';
    return name;
  }, []);

  const currentUserName = useMemo(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return 'Super Admin';
    try {
      const u = JSON.parse(userStr);
      return formatName(getDisplayName(u));
    } catch (e) {
      return 'Super Admin';
    }
  }, [formatName]);

  const currentUserEmail = useMemo(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return '';
    try {
      const u = JSON.parse(userStr);
      return u.email || '';
    } catch (e) {
      return '';
    }
  }, []);

  // ═══════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════
  // UTILS: MEDIA & EXTENSION MITIGATION
  // ═══════════════════════════════════════════

  // Removed local resolveImageUrl in favor of getMediaUrl utility

  const extensionProps = {
    spellCheck: false,
    "data-gramm": "false",
    "data-quillbot-disable": "true",
    autoComplete: "off"
  };


  const fetchData = useCallback(async (isInitial = false, isSilent = false) => {
    if (isInitial) setLoading(true);
    try {
      const apiUrl = API || 'http://localhost:8003';
      const fetchOpts = { skipCache: isSilent };
      const [uRes, sRes, pRes, iRes, lRes, fRes, nRes, tmRes] = await Promise.all([
        authFetch(`${apiUrl}/api/users/?limit=100`, fetchOpts),
        authFetch(`${apiUrl}/api/studies/?limit=50`, fetchOpts),
        authFetch(`${apiUrl}/api/participants/?limit=100`, fetchOpts),
        authFetch(`${apiUrl}/api/study-inquiries/?limit=50`, fetchOpts),
        authFetch(`${apiUrl}/api/leads/?limit=50`, fetchOpts),
        authFetch(`${apiUrl}/api/facilities-inquiry/?limit=50`, fetchOpts),
        authFetch(`${apiUrl}/api/news/?limit=50`, fetchOpts),
        authFetch(`${apiUrl}/api/team-members/`, fetchOpts),
      ]);
      if (uRes.ok) {
        const rawData = await uRes.json();
        const data = Array.isArray(rawData) ? rawData : (rawData.results || []);
        setUsers(data.map((u: any) => {
          // Use the robust utility to extract the name
          let name = revealValue(u.full_name, u.decrypted_name);
          if (!name) {
            // Fallback to email prefix if decryption is failing for some reason
            name = u.email ? u.email.split('@')[0] : 'User';
          }

          return {
            ...u,
            name: name,
            status: u.is_active === false ? 'Inactive' : 'Active',
            lastLogin: u.last_login_formatted || 'Never',
            must_reset: u.must_change_password,
            profile_incomplete: !u.profile_completed,
            role: u.role ? u.role.toString().toUpperCase() : 'ADMIN'
          };
        }));
      }
      if (sRes.ok) {
        const raw = await sRes.json();
        setStudies(Array.isArray(raw) ? raw : (raw.results || []));
      }
      if (pRes.ok) {
        const raw = await pRes.json();
        setParticipants(Array.isArray(raw) ? raw : (raw.results || []));
      }
      if (iRes.ok) {
        const raw = await iRes.json();
        setStudyInquiries(Array.isArray(raw) ? raw : (raw.results || []));
      }
      if (lRes.ok) {
        const raw = await lRes.json();
        setParticipantLeads(Array.isArray(raw) ? raw : (raw.results || []));
      }
      if (fRes.ok) {
        const raw = await fRes.json();
        setFacilityInquiries(Array.isArray(raw) ? raw : (raw.results || []));
      }
      if (nRes.ok) {
        const raw = await nRes.json();
        setAnnouncements(Array.isArray(raw) ? raw : (raw.results || []));
      }
      if (tmRes.ok) {
        const raw = await tmRes.json();
        const members = Array.isArray(raw) ? raw : (raw.results || []);
        console.log("Team members synchronized:", { total: members.length, categories: { 
          leadership: members.filter((m: any) => m.category === 'leadership').length,
          advisors: members.filter((m: any) => m.category === 'advisors').length,
          staff: members.filter((m: any) => m.category === 'staff').length,
          collaborators: members.filter((m: any) => m.category === 'collaborators').length
        }});
        setStaffRecords(groupTeamMembers(members));
      }

      try {
        const aRes = await authFetch(`${apiUrl}/api/auth/admin/audit-logs/`, fetchOpts);
        if (aRes.ok) {
          const raw = await aRes.json();
          setActivities(Array.isArray(raw) ? raw : (raw.results || []));
        }
      } catch (e) {
        console.warn("Audit logs fetch skipped or failed");
      }
      setLastRefresh(new Date().toLocaleTimeString());
      if (!isSilent) addToast("Platform Data Synchronized With Core", "success");
    } catch (err) {
      console.error("Failed to fetch platform data:", err);
      if (!isSilent) addToast("Terminal Connection Unstable", "error");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [API, navigate, addToast]);

  // Removed background polling per user request to reduce redundant network requests.
  // usePolling(fetchData, 10000);

  useEffect(() => {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    const role = getRole();
    if (!user || role !== 'SUPER_ADMIN') {
      console.warn("Unauthorized access to Super Admin Dashboard. Redirecting...");
      navigate('/mainframe/restricted-auth');
    }
  }, [navigate]);

  const notificationRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial load handled by fetchData(true)
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    const handleScroll = () => {
      if (isProfileOpen) setIsProfileOpen(false);
      if (showNotifications) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isProfileOpen, showNotifications]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Removed background polling per user request to reduce redundant network requests.
  // usePolling(() => fetchData(false, true), 10000);

  useEffect(() => {
    if (studyInquiries.length > 0) {
      const pendingInquiries = studyInquiries.filter(iq => iq.status === 'NDA_REQUESTED' || iq.status === 'PRELIMINARY');
      if (pendingInquiries.length > 0) {
        addToast(`${pendingInquiries.length} New Sponsor Leads Awaiting Authorization`, "warn");
      }
    }
  }, [studyInquiries.length, addToast]);

  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════

  const handleStudiesLink = useCallback(() => {
    window.open('http://localhost:5173/trials#current-studies', '_blank');
  }, []);

  const handleWebsiteLink = useCallback(() => {
    window.open('/', '_blank');
  }, []);

  const handleSignOut = async () => {
    setIsLogoutModalOpen(true);
  };

  const confirmSignOut = async () => {
    await performLogout();
  };

  const refreshDashboard = () => fetchData();

  const handleRemoveStaff = async () => {
    if (!staffToRemove || !staffToRemove.id) {
      addToast('Invalid removal target: Missing ID', 'error');
      return;
    }
    try {
      const apiUrl = API || 'http://localhost:8003';
      const res = await authFetch(`${apiUrl}/api/team-members/${staffToRemove.id}/`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || 'Deletion request refused by core');
      }
      setStaffRecords((prev: any) => ({
        ...prev,
        [staffToRemove.category]: prev[staffToRemove.category as keyof typeof prev].filter((item: any) => item.id !== staffToRemove.id)
      }));
      addToast('Team member removed from directory', 'success');
    } catch (err) {
      addToast('Failed to remove team member', 'error');
    } finally {
      setIsRemoveStaffConfirmOpen(false);
      setStaffToRemove(null);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaffData.name || !newStaffData.role) {
      addToast('Name and Role are required', 'warn');
      return;
    }
    const category = addingStaffCategory;
    
    // Calculate display_order to ensure new member is added at the end
    const currentMembers = staffRecords[category as keyof typeof staffRecords] || [];
    const maxOrder = currentMembers.reduce((max: number, m: any) => Math.max(max, m.display_order || 0), 0);
    const nextOrder = maxOrder + 1;

    const formData = new FormData();
    formData.append('name', newStaffData.name);
    formData.append('category', category);
    formData.append('status', 'Active');
    formData.append('display_order', nextOrder.toString());
    
    const roleKey = (category === 'advisors' || category === 'collaborators') ? 'advisory_role' : 'role';
    const deptKey = (category === 'advisors' || category === 'collaborators') ? 'expertise_area' : 'dept';
    
    formData.append(roleKey, newStaffData.role);
    formData.append(deptKey, newStaffData.dept);
    formData.append('bio', newStaffData.bio);
    formData.append('expanded_bio', newStaffData.expanded_bio);
    
    const tags = newStaffData.expertise_tags ? newStaffData.expertise_tags.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    const affs = newStaffData.affiliations ? newStaffData.affiliations.split('\n').map((s: string) => s.trim()).filter(Boolean) : [];
    const pubs = newStaffData.publications ? newStaffData.publications.split('\n').map((s: string) => s.trim()).filter(Boolean) : [];
    
    formData.append('expertise_tags', JSON.stringify(tags));
    formData.append('affiliations', JSON.stringify(affs));
    formData.append('publications', JSON.stringify(pubs));
    

    try {
      const apiUrl = API || 'http://localhost:8003';
      const res = await authFetch(`${apiUrl}/api/team-members/`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || 'Creation protocol rejected by core');
      }
      const created = await res.json();
      setStaffRecords((prev: any) => ({
        ...prev,
        [category]: [...prev[category as keyof typeof prev], created]
      }));
      setIsAddStaffModalOpen(false);
      setNewStaffData({
        name: '',
        role: '',
        dept: '',
        bio: '',
        expanded_bio: '',
        expertise_tags: '',
        affiliations: '',
        publications: ''
      });
      addToast(`${category.charAt(0).toUpperCase() + category.slice(1)} record added successfully`, 'success');
    } catch (err: any) {
      console.error("Team creation failed:", err);
      addToast(err.message || 'Failed to save team member to database', 'error');
    }
  };

  // (getStudyIdentifier moved outside)

  const handleCreateStudy = async (formData: any, uploadedDocs: any[] = []) => {
    try {
      const apiUrl = API || 'http://localhost:8003';
      const method = selectedStudy ? 'PATCH' : 'POST';
      const studyId = getStudyIdentifier(selectedStudy);
      if (selectedStudy && !studyId) {
        alert("❌ UNHANDLED PROTOCOL ERROR: Selected study has NO valid identifier. Metadata may be corrupted.");
        return;
      }
      const payload = {
        ...formData,
        start_date: formData.startDate,
        end_date: formData.endDate,
        description: formData.briefSummary || formData.brief_description,
        primary_indication: formData.category || formData.indication,
        condition: formData.category || formData.indication || formData.condition,
        study_type: formData.executionMode || formData.execution_type,
        target_screened: formData.targetEnrollment || formData.target_subjects,
        pi_ids: formData.selectedPIs || formData.assigned_pis || [],
        coordinator_ids: formData.selectedCoordinators || formData.assigned_coordinators || [],
        sponsor_ids: formData.selectedSponsorUsers?.length ? formData.selectedSponsorUsers : (formData.sponsor ? [formData.sponsor] : []),
        sponsor_name: formData.sponsor,
        stage: formData.stage || 'PREPARING_TO_LAUNCH',
        status: formData.status || 'PREPARING_TO_LAUNCH'
      };
      const url = selectedStudy
        ? `${apiUrl}/api/studies/${studyId}/`
        : `${apiUrl}/api/studies/`;
      const res = await authFetch(url, { method: method, body: JSON.stringify(payload) });
      if (res.ok) {
        const studyData = await res.json();
        const currentStudyId = studyData.protocol_id || studyData.id;
        if (uploadedDocs && uploadedDocs.length > 0) {
          const docsToUpload = uploadedDocs.filter(d => d.file);
          for (const doc of docsToUpload) {
            const docFormData = new FormData();
            docFormData.append('file', doc.file);
            docFormData.append('title', doc.name);
            docFormData.append('category', doc.category || 'OTHER');
            docFormData.append('version', doc.version || 'V1.0');
            docFormData.append('study', currentStudyId);
            docFormData.append('visibility', JSON.stringify(doc.visibility || ['PI', 'COORDINATOR']));
            try {
              await authFetch(`${apiUrl}/api/documents/`, { method: 'POST', body: docFormData });
            } catch (err) {
              console.error("Document upload failed for:", doc.name, err);
            }
          }
        }
        alert(selectedStudy ? "Protocol Metadata Successfully Synced to Core" : "New Strategy/Protocol Deployed to Active Matrix");
        handlePageChange('STUDIES');
        fetchData();
        setSelectedStudy(null);
      } else {
        const err = await res.json();
        alert(`${selectedStudy ? 'Metadata Sync' : 'Deployment'} failed: ${JSON.stringify(err)}`);
      }
    } catch (e) {
      alert("❌ CRITICAL INTERFACE FAILURE: Terminal connection refused or high-latency interference detected.");
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    const apiUrl = API || 'http://localhost:8003';
    try {
      // Optimistic Update
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole.toUpperCase() } : u));
      
      const res = await authFetch(`${apiUrl}/api/users/${userId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) fetchData();
    } catch (err) {
      addToast("System Sync Delayed - Local state preserved", "warn");
    }
  };

  const handleStatusToggle = async (user: any) => {
    if (user.created === 'Directory Record') {
      const category = user.category;
      const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
      try {
        const apiUrl = API || 'http://localhost:8003';
        const res = await authFetch(`${apiUrl}/api/team-members/${user.id}/`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus })
        });
        if (!res.ok) throw new Error('Update failed');
        setStaffRecords((prev: any) => ({
          ...prev,
          [category]: prev[category].map((member: any) => member.id === user.id ? { ...member, status: newStatus } : member)
        }));
        setSelectedUser({ ...user, status: newStatus });
        addToast(`Member status set to ${newStatus}`, 'success');
      } catch (err) {
        addToast("Failed to update member status", "error");
      }
      return;
    }

    const apiUrl = API || 'http://localhost:8003';
    const newStatus = user.status === 'Active' ? false : true;
    try {
      const res = await authFetch(`${apiUrl}/api/users/${user.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: newStatus })
      });
      if (res.ok) {
        fetchData();
        if (selectedUser && selectedUser.id === user.id) {
          setSelectedUser({ ...user, status: newStatus ? 'Active' : 'Inactive' });
        }
        addToast(`System user status updated successfully`, 'success');
      }
    } catch (err) {
      addToast("Status update failed", 'error');
    }
  };

  const confirmDelete = (user: any) => {
    setSelectedUser(user);
    setIsDeleteConfirmOpen(true);
  };

  const viewDetails = (user: any) => {
    setSelectedUser(user);
    setIsUserDetailOpen(true);
  };

  // ═══════════════════════════════════════════
  // COMMON ELEMENTS
  // ═══════════════════════════════════════════

  // ═══════════════════════════════════════════
  // HELPER COMPONENTS
  // ═══════════════════════════════════════════

  const StatusBadge = ({ status }: { status: string }) => (
    <span className={`px-2 py-0.5 rounded-full text-[12px] font-black uppercase tracking-widest ${status === 'Active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-slate-700/20 text-slate-500 border border-white/5'}`}>
      {status}
    </span>
  );

  const RoleBadge = ({ role }: { role: string }) => {
    const normalizedRole = (role || '').toUpperCase();
    const roleData = ROLES.find(r => r.id === normalizedRole) || ROLES[1];
    return (
      <span className="px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider" style={{ backgroundColor: `${roleData.color}20`, color: roleData.color, border: `1px solid ${roleData.color}40` }}>
        {roleData.label}
      </span>
    );
  };


  // ═══════════════════════════════════════════
  // MULTI-ASSIGN COMPONENTS (FIXED - NO FLICKER)
  // ═══════════════════════════════════════════

  // (MultiAssignCell moved outside)

  // (SponsorAssignCell moved outside)

  // ═══════════════════════════════════════════
  // PAGE: DASHBOARD
  // ═══════════════════════════════════════════

  const DashboardPage = ({
    currentUserName, users, studies, participants, studyInquiries, activities,
    handlePageChange, refreshDashboard, setModals, modals, currentPage, lastRefresh
  }: any) => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative overflow-hidden group">
        {[
          { top: '10%', left: '30%', color: '#7c3aed' },
          { top: '60%', left: '80%', color: '#14b8a6' },
          { top: '20%', left: '70%', color: '#ec4899' },
          { top: '80%', left: '40%', color: '#7c3aed' },
        ].map((dot, i) => (
          <div key={i} className="absolute w-2 h-2 rounded-full blur-[2px] opacity-40 animate-pulse"
            style={{ top: dot.top, left: dot.left, backgroundColor: dot.color, filter: 'blur(3px)' }}></div>
        ))}
        <div className="relative mb-8 lg:mb-10">
          <div className="absolute -top-24 -left-20 w-[400px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full"></div>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#7c3aed]" />
                <span className="text-[12px] font-black text-[#7c3aed] uppercase tracking-[0.3em]">Super Administrator</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white italic truncate tracking-tighter uppercase">
                {currentPage.replace('_', ' ')} <span className="text-[#3b82f6]">Overview</span>
              </h2>
              <p className="text-base sm:text-lg text-[#8b8fa8] font-medium tracking-tight max-w-2xl leading-none">
                Welcome, {currentUserName}. You have full system access and visibility.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <button
                onClick={refreshDashboard}
                className="flex-1 sm:flex-none justify-center px-4 sm:px-6 py-3 bg-[#0d0f2b] border border-white/10 text-white rounded-xl font-bold text-[12px] sm:text-sm uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="text-[12px]">Refresh</span>
              </button>
              <button
                onClick={() => setModals({ ...modals, createUser: true })}
                className="flex-1 sm:flex-none justify-center px-4 sm:px-6 py-3 bg-[#7c3aed] text-white rounded-xl font-bold text-[12px] sm:text-sm uppercase tracking-widest flex items-center gap-2 hover:bg-[#6d28d9] transition-all shadow-xl shadow-purple-900/40"
              >
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="text-[12px]">Create User</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Total Users', value: (users || []).length, icon: Users, color: '#14b8a6', badge: 'Live', onClick: () => handlePageChange('ALL_USERS') },
          { label: 'Total Studies', value: (studies || []).length, icon: Briefcase, color: '#3b82f6', onClick: () => handlePageChange('STUDIES') },
          { label: 'Active Participants', value: (participants || []).length, icon: UserCheck, color: '#14b8a6', onClick: () => handlePageChange('PARTICIPANTS') },
          { label: 'Admins & Staff', value: (users || []).filter((u: any) => ['ADMIN', 'SUPER_ADMIN', 'PI', 'COORDINATOR'].includes(u.role)).length, icon: Crown, color: '#f59e0b', onClick: () => handlePageChange('TEAM') },
          { label: 'Sponsors', value: (users || []).filter((u: any) => u.role === 'SPONSOR').length, icon: Building, color: '#ec4899', onClick: () => handlePageChange('SPONSORS') },
          { label: 'Incoming Inquiries', value: (studyInquiries || []).length, icon: Bell, color: '#ec4899', onClick: () => handlePageChange('INQUIRIES') },
          { label: 'Active Studies', value: (studies || []).filter((s: any) => s.status === 'UPCOMING' || s.status === 'RECRUITING' || s.status === 'ACTIVE').length, icon: Activity, color: '#14b8a6', onClick: () => handlePageChange('STUDIES') },
          { label: 'Open Adverse Events', value: 0, icon: ShieldAlert, color: '#ef4444', onClick: () => alert("Adverse Event Monitor: No active high-severity alerts detected in active matrix.") },
          { label: 'Audit Events Today', value: (activities || []).length, icon: FileText, color: '#7c3aed', onClick: () => handlePageChange('AUDIT_LOGS') },
        ].map((stat, i) => (
          <div
            key={i}
            onClick={stat.onClick}
            className="p-6 sm:p-8 bg-[#0f1133] border border-white/5 rounded-2xl relative cursor-pointer overflow-hidden transition-all hover:border-white/10 group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-2 sm:p-3 rounded-xl" style={{ backgroundColor: `${stat.color}10`, color: stat.color }}>
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              {stat.badge && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-green-500/10 rounded-full">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[12px] font-black text-green-500 uppercase tracking-widest">{stat.badge}</span>
                </div>
              )}
            </div>
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 group-hover:text-white transition-colors">{stat.label}</p>
            <h4 className="text-2xl sm:text-3xl xl:text-4xl font-black text-white italic tracking-tighter drop-shadow-2xl">{stat.value}</h4>
            <div className="absolute bottom-6 right-6 p-2 rounded-lg bg-white/5 border border-white/5 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-300" style={{ backgroundColor: stat.color }}></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-cyan-500" />
            <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Manage Users', icon: Users, color: '#7c3aed', act: () => handlePageChange('ALL_USERS') },
              { label: 'Manage Studies', icon: Briefcase, color: '#3b82f6', act: () => handlePageChange('STUDIES') },
              { label: 'View Sponsors', icon: Building, color: '#ec4899', act: () => handlePageChange('SPONSORS') },
              { label: 'Audit Logs', icon: FileText, color: '#64748b', act: () => handlePageChange('AUDIT_LOGS') },
              { label: 'Announcements', icon: Megaphone, color: '#f59e0b', act: () => handlePageChange('ANNOUNCEMENTS') },
              { label: 'System Settings', icon: Settings, color: '#14b8a6', act: () => handlePageChange('SETTINGS') },
            ].map((action, i) => (
              <button
                key={i}
                onClick={action.act}
                className="bg-[#0f1133] border border-white/5 rounded-2xl p-6 flex flex-col items-center gap-4 group transition-all hover:bg-[#7c3aed] shadow-lg hover:shadow-purple-900/40"
              >
                <div className="p-3 bg-white/5 rounded-xl text-white group-hover:bg-white/20 transition-all">
                  <action.icon style={{ color: action.color }} className="w-6 h-6 group-hover:text-white" />
                </div>
                <span className="text-[12px] font-black uppercase text-[#8b8fa8] group-hover:text-white tracking-widest text-center">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Activity className="w-6 h-6 text-[#7c3aed]" />
              <h3 className="text-2xl lg:text-3xl font-black text-white uppercase italic tracking-[0.2em] leading-none">Recent Platform Activity</h3>
            </div>
            <button onClick={() => handlePageChange('ACTIVITY_LOG')} className="text-[12px] font-black text-[#7c3aed] uppercase tracking-widest hover:text-white transition-all">View all &rarr;</button>
          </div>
          <div className="bg-[#0f1133] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="divide-y divide-white/5">
              {activities.slice(0, 10).map((log: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-10 py-6 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    <div>
                      <div className="flex items-center gap-4">
                        <p className="text-base font-black text-white uppercase tracking-tight italic">{log.type}</p>
                        <span className="px-3 py-1 bg-[#7c3aed]/10 border border-[#7c3aed]/20 rounded-md text-[12px] font-black text-[#7c3aed] uppercase tracking-widest">{log.category}</span>
                      </div>
                      <p className="text-sm text-[#555a7a] font-bold mt-2 uppercase tracking-tighter italic">{log.details}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-black text-[#8b8fa8] uppercase tracking-widest">{log.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 space-y-8">
          <div className="flex items-center gap-4">
            <Crown className="w-6 h-6 text-cyan-500" />
            <h3 className="text-2xl lg:text-3xl font-black text-white uppercase italic tracking-[0.2em] leading-none">Role Hierarchy & Permissions</h3>
          </div>
          <div className="space-y-3">
            {ROLES.map((role, i) => (
              <div key={i} className="flex items-center justify-between px-8 py-5 bg-[#0f1133] border border-white/5 rounded-2xl hover:border-white/10 transition-all group">
                <div className="flex items-center gap-10">
                  <div className="w-40">
                    <RoleBadge role={role.id} />
                  </div>
                  <p className="text-sm text-[#8b8fa8] italic font-black uppercase tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[400px]">
                    {role.desc}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {role.isYou && (
                    <span className="px-4 py-1.5 bg-[#7c3aed]/20 border border-[#7c3aed]/30 rounded-full text-[12px] font-black text-[#7c3aed] uppercase tracking-widest">Master Admin</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-[#333] group-hover:text-[#7c3aed] transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-cyan-500" />
            <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Important Notice</h3>
          </div>
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-[2rem] p-10 h-full relative group overflow-hidden">
            <AlertTriangle className="absolute -bottom-6 -right-6 w-32 h-32 text-cyan-500/10 group-hover:scale-110 transition-transform duration-1000" />
            <div className="relative z-10 space-y-6">
              <div className="space-y-4">
                <p className="text-[12px] text-white font-bold leading-relaxed tracking-tight">
                  You are logged in as <span className="text-cyan-500 uppercase italic">Super Administrator</span>. All actions you take are irreversible and logged.
                </p>
                <p className="text-[12px] text-[#8b8fa8] leading-relaxed">
                  Before deleting users or studies, ensure you have proper authorization and have reviewed compliance requirements.
                </p>
                <p className="text-[12px] font-black text-cyan-500 uppercase tracking-widest pt-4">Never share your Super Admin credentials with anyone.</p>
              </div>
              <div className="pt-10 border-t border-cyan-500/10">
                <p className="text-[12px] font-black text-cyan-500/50 uppercase tracking-widest italic">Last refresh: {lastRefresh}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  // ═══════════════════════════════════════════
  // PAGE: ALL USERS
  // ═══════════════════════════════════════════

  const UsersPage = ({
    users, searchTerm, setSearchTerm, setModals, modals, viewDetails, handleRoleUpdate, handleStatusToggle, formatName, onDelete
  }: any) => {
    const filteredUsers = useMemo(() => {
      return (users || []).filter((u: any) =>
        (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }, [users, searchTerm]);

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-white italic uppercase tracking-tighter leading-none">All <span className="text-[#7c3aed]">Users</span></h1>
            <p className="text-[12px] text-[#8b8fa8] uppercase tracking-widest mt-3">Manage clinical research staff and participant accounts</p>
          </div>
          <button onClick={() => setModals({ ...modals, createUser: true })} className="w-full sm:w-auto px-10 py-5 bg-[#7c3aed] text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-xl shadow-purple-900/40 hover:bg-purple-600 transition-all">
            <Plus className="w-6 h-6" /> Create New Account
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: 'Total Users', value: (users || []).length, color: 'text-white' },
            { label: 'Active', value: (users || []).filter((u: any) => u.status !== 'Inactive').length, color: 'text-green-500' },
            { label: 'Inactive', value: (users || []).filter((u: any) => u.status === 'Inactive').length, color: 'text-[#ef4444]' },
            { label: 'Admins', value: (users || []).filter((u: any) => ['ADMIN', 'SUPER_ADMIN'].includes(u.role)).length, color: 'text-[#7c3aed]' },
          ].map((s, i) => (
            <div key={i} className="bg-[#0f1133] border border-white/5 rounded-3xl p-6 sm:p-8 text-center bg-gradient-to-br from-[#0f1133] to-[#0a0b1a] hover:border-purple-500/30 transition-colors">
              <p className="text-[12px] font-black text-[#555a7a] uppercase tracking-[0.2em] mb-3">{s.label}</p>
              <h4 className={`text-2xl sm:text-3xl font-black italic tracking-tighter ${s.color}`}>{s.value}</h4>
            </div>
          ))}
        </div>

        <div className="bg-[#0f1133] border border-white/5 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                placeholder="Search Personnel Database..."
                className="w-full bg-[#0a0b1a] border border-white/5 rounded-2xl pl-16 pr-6 py-5 text-sm text-white outline-none focus:border-cyan-500/30 font-black uppercase italic tracking-widest"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.02] text-[12px] font-black text-[#555a7a] uppercase tracking-[0.3em] italic border-b border-white/5">
                  <th className="px-6 py-4">Name & Access</th>
                  <th className="px-6 py-4">Privilege Level</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Interface Login</th>
                  <th className="px-6 py-4 text-right">System Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user: any, i: number) => (
                  <tr key={user.id || i} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => viewDetails(user)}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-black text-white italic border border-white/5 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 hover:scale-110 transition-transform">
                          {user.name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white italic hover:text-cyan-400 transition-colors uppercase tracking-tight">{formatName(user.name)}</p>
                          <p className="text-[12px] text-[#555a7a] font-medium tracking-tight mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                        className="bg-[#0a0b1a] text-[12px] font-black uppercase tracking-widest text-[#7c3aed] border border-white/5 rounded-lg px-2 py-1 outline-none cursor-pointer"
                      >
                        {ROLES.map(r => <option key={r.id} value={r.id} className="bg-slate-900">{r.label}</option>)}
                      </select>
                    </td>
                    <td className="px-10 py-6">
                      <select
                        value={user.status}
                        onChange={() => handleStatusToggle(user)}
                        className={`text-[12px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border outline-none cursor-pointer transition-all ${user.status === 'Active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
                      >
                        <option value="Active" className="bg-[#0a0b1a]">Active</option>
                        <option value="Inactive" className="bg-[#0a0b1a]">Inactive</option>
                      </select>
                      <div className="mt-2 flex flex-col gap-1">
                        {user.must_reset && (
                          <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 rounded-full text-[12px] font-black uppercase tracking-tighter w-fit flex items-center gap-1">
                            <ShieldAlert className="w-2 h-2" /> Reset Required
                          </span>
                        )}
                        {user.profile_incomplete && (
                          <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded-full text-[12px] font-black uppercase tracking-tighter w-fit flex items-center gap-1">
                            <UserIcon className="w-2 h-2" /> Profile Draft
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[12px] font-black text-[#8b8fa8] uppercase tracking-widest">{user.lastLogin || 'Never'}</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button onClick={() => onDelete(user)} className="p-2 text-[#555a7a] hover:text-red-400 transition-all bg-white/5 rounded-lg border border-white/5 hover:border-red-500/20" title="Delete Account"><Trash2 className="w-4 h-4" /></button>
                      <button onClick={() => viewDetails(user)} className="p-2 text-[#555a7a] hover:text-white transition-all bg-white/5 rounded-lg border border-white/5 hover:border-white/10" title="View Details"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };


  // ═══════════════════════════════════════════
  // PAGE: SETTINGS
  // ═══════════════════════════════════════════

  const SettingsPage = () => {
    const tabs = ['General', 'Security', 'Notifications', 'Integrations', 'Backup'];
    const [activeTab, setActiveTab] = useState('General');
    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tighter">System <span className="text-[#7c3aed]">Settings</span></h1>
        <div className="flex gap-1 border-b border-white/5">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-4 text-[12px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab ? 'text-white' : 'text-[#555a7a] hover:text-white'}`}>
              {tab}
              {activeTab === tab && <motion.div layoutId="settingTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#7c3aed]" />}
            </button>
          ))}
        </div>
        <div className="bg-[#0f1133] border border-white/5 rounded-3xl p-10 space-y-10">
          {activeTab === 'General' && (
            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[12px] font-black text-[#555a7a] uppercase tracking-widest px-1">Platform Name</label>
                <input type="text" value="MUSB Research Platform" className="w-full bg-white/5 border border-white/5 rounded-xl px-6 py-4 text-sm text-white font-bold" readOnly />
              </div>
              <div className="space-y-4">
                <label className="text-[12px] font-black text-[#555a7a] uppercase tracking-widest px-1">Timezone</label>
                <select className="w-full bg-white/5 border border-white/5 rounded-xl px-6 py-4 text-sm text-white font-bold outline-none">
                  <option>UTC (Coordinated Universal Time)</option>
                  <option>EST (Eastern Standard Time)</option>
                </select>
              </div>
            </div>
          )}
          {activeTab === 'Security' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                <div>
                  <p className="text-sm font-bold text-white uppercase italic tracking-tight">Two-Factor Authentication (2FA)</p>
                  <p className="text-[12px] text-[#555a7a] font-medium uppercase tracking-widest mt-1">Require 2FA for all administrative accounts</p>
                </div>
                <div className="w-12 h-6 bg-[#7c3aed] rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[12px] font-black text-[#555a7a] uppercase tracking-widest px-1">Session Timeout (minutes)</label>
                  <input type="number" defaultValue={30} className="w-full bg-white/5 border border-white/5 rounded-xl px-6 py-4 text-sm text-white font-bold" />
                </div>
                <div className="space-y-4">
                  <label className="text-[12px] font-black text-[#555a7a] uppercase tracking-widest px-1">Auto-Lock Period</label>
                  <input type="text" defaultValue="No Activity" className="w-full bg-white/5 border border-white/5 rounded-xl px-6 py-4 text-sm text-white font-bold" />
                </div>
              </div>
            </div>
          )}
          <div className="pt-10 border-t border-white/5 flex justify-end">
            <button className="px-10 py-4 bg-[#7c3aed] text-white rounded-xl font-bold text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-purple-900/40 hover:scale-105 transition-all">Save Changes</button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════
  // PAGE: SPONSORS
  // ═══════════════════════════════════════════

  const SponsorsPage = ({ users, studies, setCreationRole, setModals, modals, setSearchTerm, handlePageChange }: any) => {
    const sponsors = (users || []).filter((u: any) => u.role === 'SPONSOR');
    const getStudyCount = (sponsorName: string) => {
      if (!sponsorName) return 0;
      return (studies || []).filter((s: any) => s.sponsor_name?.toLowerCase() === sponsorName.toLowerCase()).length;
    };
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Active <span className="text-pink-500">Sponsors</span></h1>
          <button
            onClick={() => { setCreationRole('SPONSOR'); setModals({ ...modals, createUser: true }); }}
            className="px-8 py-4 bg-pink-500 text-white rounded-xl font-black text-[12px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl shadow-pink-500/20 hover:bg-pink-600 transition-all"
          >
            <UserPlus className="w-5 h-5" /> Register New Sponsor
          </button>
        </div>
        <div className="bg-[#0f1133] border border-white/5 rounded-3xl overflow-hidden p-8 text-center bg-gradient-to-br from-[#0f1133] to-[#0a0b1a]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {sponsors.length === 0 ? (
              <div className="col-span-3 py-20 opacity-30 italic uppercase tracking-[0.2em] text-[12px]">No active sponsor accounts in persistence layers</div>
            ) : (
              sponsors.map((s: any, i: number) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 hover:border-pink-500/30 transition-all group">
                  <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center mx-auto mb-6 text-pink-500">
                    <Building className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-black text-white uppercase italic group-hover:text-pink-400 transition-colors">{s.name}</h4>
                  <p className="text-[12px] text-slate-500 font-black mt-3 uppercase tracking-widest">{s.email}</p>
                  <div className="mt-10 pt-10 border-t border-white/5 flex justify-between items-center px-6">
                    <div className="text-left">
                      <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest pb-1">Studies</p>
                      <p className="text-2xl font-black text-white italic">{getStudyCount(s.name).toString().padStart(2, '0')}</p>
                    </div>
                    <button
                      onClick={() => { setSearchTerm(s.name); handlePageChange('STUDIES'); }}
                      className="px-6 py-3 bg-white/5 text-[12px] font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-slate-900 transition-all"
                    >
                      Configure
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════
  // PAGE: SPONSOR LEADS
  // ═══════════════════════════════════════════

  const SponsorLeadsPage = ({ studyInquiries, handlePageChange }: any) => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Clinical <span className="text-cyan-500">Leads</span></h1>
          <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.2em] mt-3">Prospecting data filtered from global inquiry endpoints</p>
        </div>
        <button className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-cyan-500/10 hover:text-cyan-500 transition-all">Export CRM Data</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {studyInquiries.length === 0 ? (
          <div className="col-span-full py-12 text-center opacity-30 text-[12px] font-black uppercase tracking-[0.3em]">No Prospecting Data Available</div>
        ) : (
          studyInquiries.map((iq: any, i: number) => (
            <div key={i} className="bg-[#0f1133] border border-white/5 rounded-[2.5rem] p-8 space-y-6 hover:border-cyan-500/30 transition-all group">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-500">
                  <Building className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 bg-cyan-500/10 text-cyan-500 rounded-lg text-[12px] font-black uppercase tracking-widest border border-cyan-500/10 italic">{(iq.needs || [])[0] || 'Inquiry'}</span>
              </div>
              <div>
                <h4 className="text-lg font-black text-white uppercase italic group-hover:text-cyan-400 transition-colors truncate">{iq.product_name}</h4>
                <div className="flex flex-col gap-1 mt-2">
                  <p className="text-[12px] text-slate-500 font-black uppercase tracking-widest">{iq.legal_name || 'Anonymous Sponsor'}</p>
                  {iq.contact_person_name && (
                    <p className="text-[11px] text-cyan-500/70 font-black uppercase tracking-[0.1em] italic">Contact: {iq.contact_person_name}</p>
                  )}
                </div>
              </div>
              <div className="pt-6 border-t border-white/5 flex flex-col gap-3">
                <div className="flex justify-between text-[12px] font-black uppercase tracking-widest text-[#555a7a]">
                  <span>Inquiry Focus</span>
                  <span className="text-white italic">{iq.primary_focus}</span>
                </div>
                <div className="flex justify-between text-[12px] font-black uppercase tracking-widest text-[#555a7a]">
                  <span>Status</span>
                  <span className="text-cyan-500/50 italic">{iq.status}</span>
                </div>
              </div>
              <button onClick={() => handlePageChange('INQUIRIES')} className="w-full py-4 bg-white/5 border border-white/5 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] hover:bg-cyan-500 hover:text-slate-950 transition-all">View Details</button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════
  // PAGE: ANNOUNCEMENTS
  // ═══════════════════════════════════════════

  const AnnouncementsPage = ({ announcements, setModals, modals, authFetch, fetchData, API }: any) => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Global <span className="text-emerald-500">Announcements</span></h1>
          <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.3em] mt-3">Broadcast emergency protocols and platform updates</p>
        </div>
        <button
          onClick={() => setModals({ ...modals, createAnnouncement: true })}
          className="px-8 py-4 bg-emerald-500 text-white rounded-xl font-black text-[12px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
        >
          <Plus className="w-5 h-5" /> Cascade Broadcast
        </button>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {announcements.length === 0 ? (
          <div className="py-20 text-center bg-[#0f1133] rounded-3xl border border-dashed border-white/10 opacity-30">
            <Megaphone className="w-12 h-12 mx-auto mb-4" />
            <p className="text-[12px] font-black uppercase tracking-widest">No active transmissions in cluster logs</p>
          </div>
        ) : (
          announcements.map((a: any, i: number) => (
            <div key={i} className="bg-[#0f1133] border border-white/5 rounded-3xl p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Megaphone className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-white uppercase italic group-hover:text-emerald-400 transition-all"
                      dangerouslySetInnerHTML={{ __html: a.title }} />
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[12px] text-slate-500 font-black uppercase tracking-widest">{new Date(a.published_at).toLocaleDateString()}</span>
                    <span className="text-[12px] text-slate-500">•</span>
                    <span className="text-[12px] text-slate-500 font-black uppercase tracking-widest">TYPE: {a.type || 'SYSTEM'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="px-4 py-1.5 rounded-full text-[12px] font-black uppercase tracking-widest italic bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Live</span>
                <button
                  onClick={async () => {
                    if (!window.confirm("Purge announcement from global history?")) return;
                    try {
                      const apiUrl = API || 'http://localhost:8003';
                      const res = await authFetch(`${apiUrl}/api/news/${a.id}/`, { method: 'DELETE' });
                      if (res.ok) fetchData();
                    } catch (err) { }
                  }}
                  className="p-3 bg-white/5 border border-white/5 text-rose-500/40 hover:text-rose-500 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════
  // PAGE: TEAM
  // ═══════════════════════════════════════════

  const TeamPage = ({ users, viewDetails, staffRecords, API }: any) => {
    const internalUsers = (users || []).filter((u: any) => ['SUPER_ADMIN', 'ADMIN', 'PI', 'COORDINATOR'].includes(u.role));

    const renderCard = (displayData: any, index: number, category: 'leadership' | 'advisors' | 'staff' | 'collaborators', systemUser: any = null) => {
      const isUser = !!systemUser;
      const member = displayData;
      const imageUrl = getMediaUrl(member.image);
      
      return (
        <motion.div 
          key={member.id || `${category}-${index}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: (index % 5) * 0.05 }}
          whileHover={{ y: -10, scale: 1.02 }}
          className="group relative h-full"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed]/20 to-cyan-500/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative h-full bg-[#0f1133]/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 md:p-8 flex flex-col gap-4 overflow-hidden shadow-2xl transition-all duration-500">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#7c3aed]/10 rounded-full blur-3xl group-hover:bg-[#7c3aed]/20 transition-all duration-700" />
            
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 flex-1">
              <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20">
                {category !== 'staff' && (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setEditingStaff(isUser ? { ...systemUser, ...member, designation: member.role || member.advisory_role, isSystemUser: true, directoryId: member.id } : { ...member, isSystemUser: false, originalIndex: index, category }); 
                      setIsEditStaffModalOpen(true); 
                    }}
                    className="p-3 bg-white/5 hover:bg-cyan-500/20 border border-white/10 rounded-2xl text-white/40 hover:text-cyan-400 transition-all"
                    title="Edit Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setStaffToRemove({ category, index, name: member.name, id: member.id });
                    setIsRemoveStaffConfirmOpen(true);
                  }}
                  className="p-3 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-2xl text-white/40 hover:text-red-400 transition-all"
                  title="Remove Member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="relative shrink-0">
                <div className="w-24 h-24 p-1 bg-gradient-to-br from-[#7c3aed] via-cyan-500 to-purple-500 rounded-[2rem] shadow-[0_0_20px_rgba(124,58,237,0.3)] group-hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] transition-all duration-500">
                  <div className="w-full h-full bg-[#0a0b1a] rounded-[1.8rem] flex items-center justify-center overflow-hidden border border-white/10 relative">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={member.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        onError={(e: any) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=0d8abc&color=fff`;
                        }}
                      />
                    ) : (
                      <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/30 italic">
                        {member.name ? member.name[0] : '?'}
                      </span>
                    )}
                  </div>
                </div>
                {isUser && (
                  <div className="absolute -bottom-1 -right-1 p-1 bg-[#0a0b1a] rounded-full border border-white/10 shadow-2xl">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_#10b981]" />
                  </div>
                )}
              </div>

              <div className="space-y-6 flex-1 w-full">
                <div>
                  <h4 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none group-hover:text-cyan-400 transition-colors">
                    {member.name}
                  </h4>
                  <p className="text-[11px] text-cyan-400 font-black uppercase tracking-[0.2em] mt-3 italic opacity-70 group-hover:opacity-100 transition-opacity">
                    {member.role || member.advisory_role || 'Staff'}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                  <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:bg-white/10 group-hover:text-white transition-all">
                    {member.dept || member.expertise_area || (systemUser?.is_super_admin ? 'Master Admin' : 'Global Operations')}
                  </span>
                </div>
              </div>
            </div>

            {category !== 'collaborators' && (
              <div className="w-full mt-2 pt-4 border-t border-white/5 flex flex-col justify-center">
                {isUser ? (
                  <button
                    onClick={() => viewDetails({
                      ...systemUser,
                      ...member,
                      category,
                      index,
                      designation: member.role || member.advisory_role || 'Staff Member',
                      image: member.image
                    })}
                    className="w-full group/btn relative overflow-hidden py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] italic transition-all hover:bg-white/10 hover:border-cyan-400/50"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      View Profile <Eye className="w-3 h-3 group-hover/btn:scale-110 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                  </button>
                ) : (
                  <button
                    onClick={() => viewDetails({
                      ...member,
                      category,
                      index,
                      id: member.id || `static-${index}-${member.name.replace(/\s+/g, '-')}`,
                      status: member.status || 'Active',
                      created: 'Directory Record',
                      role: member.system_role || (member.role || member.advisory_role || 'Staff').toUpperCase(),
                      email: 'No System Account',
                      mobile_number: 'N/A',
                      full_address: 'N/A'
                    })}
                    className="w-full group/btn relative overflow-hidden py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] italic transition-all hover:bg-white/10 hover:border-cyan-400/50"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      View Profile <Eye className="w-3 h-3 group-hover/btn:scale-110 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      );
    };

    const SectionHeader = ({ title, subtitle, icon: Icon, color, onAdd }: any) => (
      <div className="flex items-center justify-between mb-8 group">
        <div className="flex items-center gap-6">
          <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${color} border border-white/5 shadow-2xl transition-transform group-hover:scale-110`}>
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{title}</h2>
            <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button 
             onClick={onAdd}
             className="px-4 py-2 bg-white/5 hover:bg-cyan-500/20 border border-white/10 rounded-xl text-white/60 hover:text-cyan-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all group/add"
           >
             <Plus className="w-3 h-3 group-hover/add:rotate-90 transition-transform" /> Add Member
           </button>
           <div className="hidden md:block h-px w-20 bg-gradient-to-r from-white/5 to-transparent" />
        </div>
      </div>
    );

    return (
      <div className="space-y-20 animate-in fade-in duration-700 pb-20">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-gradient-to-b from-[#7c3aed] to-cyan-500 rounded-full" />
            <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
              Internal <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7c3aed] to-cyan-500">Staff</span>
            </h1>
          </div>
          <p className="text-[13px] text-slate-500 font-black uppercase tracking-[0.4em] ml-5">
            Unified organizational directory & hierarchical management
          </p>
        </div>

        {/* LEADERSHIP SECTION */}
        <section className="space-y-10">
          <SectionHeader 
            title="Leadership & Scientific Team" 
            subtitle="Executive direction and core scientific leadership"
            icon={Crown}
            color="text-amber-500"
            onAdd={() => { setAddingStaffCategory('leadership'); setIsAddStaffModalOpen(true); }}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl">
            {staffRecords.leadership.map((member: any, i: number) => {
              const memberName = member?.name || '';
              const lastName = memberName.split(' ').pop() || '____';
              const matchedUser = internalUsers.find((u: any) => 
                (u.name || '').toLowerCase().includes(lastName.toLowerCase())
              );
              return renderCard(member, i, 'leadership', matchedUser);
            })}
          </div>
        </section>

        {/* ADVISORS SECTION */}
        <section className="space-y-10">
          <SectionHeader 
            title="Advisory Board" 
            subtitle="Global strategic advisors and subject matter experts"
            icon={ShieldCheck}
            color="text-cyan-500"
            onAdd={() => { setAddingStaffCategory('advisors'); setIsAddStaffModalOpen(true); }}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {staffRecords.advisors.map((member: any, i: number) => renderCard(member, i, 'advisors', null))}
          </div>
        </section>

        {/* CLINICAL COLLABORATORS SECTION */}
        <section className="space-y-10">
          <SectionHeader 
            title="Clinical Collaborators" 
            subtitle="Medical professionals and research partners"
            icon={Network}
            color="text-emerald-500"
            onAdd={() => { setAddingStaffCategory('collaborators'); setIsAddStaffModalOpen(true); }}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {staffRecords.collaborators.map((member: any, i: number) => renderCard(member, i, 'collaborators', null))}
          </div>
        </section>

        {/* STAFF SECTION */}
        <section className="space-y-10">
          <SectionHeader 
            title="Operational Staff" 
            subtitle="Clinical coordinators, IT, and laboratory management"
            icon={Users}
            color="text-[#7c3aed]"
            onAdd={() => { setAddingStaffCategory('staff'); setIsAddStaffModalOpen(true); }}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {staffRecords.staff.map((member: any, i: number) => {
              const memberName = member?.name || '';
              const lastName = memberName.split(' ').pop() || '____';
              const matchedUser = internalUsers.find((u: any) => 
                (u.name || '').toLowerCase().includes(lastName.toLowerCase())
              );
              return renderCard(member, i, 'staff', matchedUser);
            })}
          </div>
        </section>

        {/* Dynamic Intel Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-white/5">
          {[
            { label: 'Network Reach', val: staffRecords.leadership.length + staffRecords.advisors.length + staffRecords.staff.length + staffRecords.collaborators.length, sub: 'Global Personnel Units', icon: Globe, color: 'text-cyan-500' },
            { label: 'System Access', val: internalUsers.length, sub: 'Authenticated Operators', icon: ShieldCheck, color: 'text-[#7c3aed]' },
            { label: 'Operational Nodes', val: 12, sub: 'Clinical Departments', icon: Activity, color: 'text-emerald-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex items-center gap-6 hover:bg-white/[0.04] transition-all group">
              <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color} border border-white/5 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-white italic leading-none">{stat.val}</span>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{stat.sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════
  // PAGE: INQUIRIES
  // ═══════════════════════════════════════════

  const InquiriesPage = ({ studyInquiries, participantLeads, facilityInquiries, studies, authFetch, API, fetchData, handlePageChange }: any) => (
    <StudyInquiriesModule 
      studyInquiries={studyInquiries}
      participantLeads={participantLeads}
      facilityInquiries={facilityInquiries}
      studies={studies}
      authFetch={authFetch}
      API={API}
      fetchData={fetchData}
      handlePageChange={handlePageChange}
      userRole="SUPER_ADMIN"
    />
  );

  // ═══════════════════════════════════════════
  // SIDEBAR CONFIG
  // ═══════════════════════════════════════════

  const sidebarItems = [
    {
      group: 'Overview', items: [
        { id: 'WEBSITE', label: 'Website', icon: Globe, isExternal: true },
        { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'LIVE_USERS', label: 'Active Users', icon: Activity, hasNotify: true },
        { id: 'ACTIVITY_LOG', label: 'Activity Log', icon: Clock },
      ]
    },
    {
      group: 'Management', items: [
        { id: 'ALL_USERS', label: 'All Users', icon: Users },
        { id: 'STUDIES', label: 'All Studies', icon: Briefcase },
        { id: 'LAUNCH_STUDY', label: 'New Study', icon: Rocket },
        { id: 'SCREENER_BUILDER', label: 'Screener', icon: ClipboardList },
        { id: 'CAREERS', label: 'Careers', icon: Briefcase },
      ]
    },
    {
      group: 'Leads', items: [
        { id: 'SPONSOR_LEADS', label: 'Prospecting', icon: BarChart2 },
        { id: 'INQUIRIES', label: 'Inquiries', icon: Bell, hasNotify: studyInquiries.length > 0 },
        { id: 'SPONSORS', label: 'Sponsors', icon: Building },
      ]
    },
    {
      group: 'Mellow Consortium', items: [
        { id: 'MELLOW_TRIAL', label: 'Trials', icon: Activity },
        { id: 'MELLOW_INVESTIGATORS', label: 'Add Investigators', icon: UserPlus },
      ]
    },
    {
      group: 'Access', items: [
        { id: 'TEAM_APPROVALS', label: 'Approvals', icon: ShieldCheck, hasNotify: true },
        { id: 'TEAM', label: 'Staff', icon: Users },
        { id: 'COORDINATORS', label: 'Coordinators', icon: UserCheck },
        { id: 'PARTICIPANTS', label: 'Participants', icon: UserIcon },
      ]
    },
    {
      group: 'Analytics', items: [
        { id: 'METRICS', label: 'Visitors', icon: Globe },
      ]
    },
    {
      group: 'System', items: [
        { id: 'ANNOUNCEMENTS', label: 'Announcements', icon: Megaphone },
        { id: 'AUDIT_LOGS', label: 'Login Logs', icon: FileText },
        { id: 'SUPPORT', label: 'Help Desk', icon: Bell },
        { id: 'SETTINGS', label: 'Settings', icon: Settings },
      ]
    },
    {
      group: 'Content', items: [
        { id: 'WORKFLOW', label: 'Moderation', icon: ShieldCheck },
        { id: 'SUBMIT_CONTENT', label: 'Create', icon: Plus },
      ]
    }
  ];

  // ═══════════════════════════════════════════
  // MODALS
  // ═══════════════════════════════════════════

  const CreateAnnouncementModal = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState('PLATFORM');
    const [isTransmitting, setIsTransmitting] = useState(false);

    const handleBroadcast = async () => {
      if (!title || !content) return alert("Header and Content payload required for transmission.");
      setIsTransmitting(true);
      try {
        const apiUrl = API || 'http://localhost:8003';
        const res = await authFetch(`${apiUrl}/api/news/`, {
          method: 'POST',
          body: JSON.stringify({ title, content, type })
        });
        if (res.ok) {
          alert("📡 TRANSMISSION CASCADE INITIATED\nBroadcast has been propagated to all systems.");
          setModals({ ...modals, createAnnouncement: false });
          fetchData();
        } else {
          alert("❌ TRANSMISSION FAILED: Cluster handshake refused.");
        }
      } catch (err) {
        alert("❌ CRITICAL FAILURE: Signal interference in core loop.");
      } finally {
        setIsTransmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/60">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0f1133] border border-white/10 w-full max-w-xl rounded-[3rem] p-12 shadow-2xl relative overflow-y-auto max-h-[95vh] custom-scrollbar text-left">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full"></div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-8 relative z-10 text-left">Broadcast <span className="text-emerald-500">Signal</span></h2>
          <div className="space-y-6 relative z-10 flex flex-col items-start w-full">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Subject / Transmission Header" className="w-full bg-[#0a0b1a] border border-white/5 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:border-emerald-500/40 transition-all placeholder:text-slate-800" />
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-[#0a0b1a] border border-white/5 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:border-emerald-500/40 transition-all uppercase tracking-widest text-[12px]">
              <option value="PLATFORM">Platform Update</option>
              <option value="EMERGENCY">Emergency Protocol</option>
              <option value="MAINTENANCE">Maintenance Alert</option>
              <option value="CLINICAL">Clinical Milestone</option>
            </select>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Message content..." className="w-full h-40 bg-[#0a0b1a] border border-white/5 rounded-2xl px-6 py-5 text-white font-bold resize-none outline-none focus:border-emerald-500/40 transition-all placeholder:text-slate-800"></textarea>
            <div className="flex gap-4">
              <button onClick={() => setModals({ ...modals, createAnnouncement: false })} className="flex-1 py-4 bg-white/5 border border-white/5 text-[#555a7a] hover:text-white rounded-2xl font-black uppercase tracking-widest transition-all">Abort</button>
              <button onClick={handleBroadcast} disabled={isTransmitting} className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest italic shadow-xl shadow-emerald-900/40 hover:scale-[1.02] transition-all disabled:opacity-50">
                {isTransmitting ? 'Transmitting...' : 'Transmit Global'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const CreateUserModal = () => {
    const [newUser, setNewUser] = useState({
      firstName: '', middleName: '', lastName: '', email: '',
      role: creationRole ? creationRole.toUpperCase() : 'PI',
      lat: '',
      lng: '',
      organization: '',
      bio: '',
      zipCode: '',
      country: '',
      state: '',
      isMellowMember: currentPage === 'MELLOW_INVESTIGATORS',
      pronouns: '',
      linkedinUrl: '',
      websiteUrl: '',
      qualifications: '',
    });
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [cvFile, setCvFile] = useState<File | null>(null);

    const [locationOptions, setLocationOptions] = useState<any[]>([]);
    const [isLookingUp, setIsLookingUp] = useState(false);

    // ── ZIP CODE AUTO-FILL & SELECTION LOGIC ──
    useEffect(() => {
      const lookupZip = async () => {
        const zip = newUser.zipCode.trim();
        
        // Reset dependent fields when zip changes
        if (zip.length < 5) {
          setLocationOptions([]);
          // Only reset if fields actually have values to avoid re-render cascades
          setNewUser(prev => {
            if (prev.state || prev.country || prev.lat || prev.lng) {
              return { ...prev, state: '', country: '', lat: '', lng: '' };
            }
            return prev;
          });
          setIsLookingUp(false);
          return;
        }

        setIsLookingUp(true);
        const results: any[] = [];
        
        // Only try regions whose zip length matches
        const regions: { code: string; name: string }[] = [];
        if (zip.length === 5 && /^\d{5}$/.test(zip)) {
          regions.push({ code: 'us', name: 'United States' });
        }
        if (zip.length === 6 && /^\d{6}$/.test(zip)) {
          regions.push({ code: 'in', name: 'India' });
        }
        
        if (regions.length === 0) return;

        try {
          await Promise.all(regions.map(async (region) => {
            try {
              const response = await fetch(`https://api.zippopotam.us/${region.code}/${zip}`);
              if (response.ok) {
                const data = await response.json();
                if (data.places) {
                  data.places.forEach((p: any) => {
                    results.push({
                      state: p.state,
                      country: region.name,
                      lat: p.latitude,
                      lng: p.longitude,
                      placeName: p['place name']
                    });
                  });
                }
              }
            } catch (e) {}
          }));

          setLocationOptions(results);
          
          // Auto-fill if exactly one unique location found
          if (results.length === 1) {
            const loc = results[0];
            setNewUser(prev => ({
              ...prev,
              state: loc.state,
              country: loc.country,
              lat: loc.lat,
              lng: loc.lng
            }));
          } else if (results.length === 0) {
            setNewUser(prev => ({ ...prev, state: '', country: '', lat: '', lng: '' }));
          }
        } finally {
          setIsLookingUp(false);
        }
      };

      const timer = setTimeout(lookupZip, 500); // Debounce
      return () => clearTimeout(timer);
    }, [newUser.zipCode]);

    useEffect(() => {
      if (creationRole) setNewUser(prev => ({ ...prev, role: creationRole.toUpperCase() }));
    }, [creationRole]);

    const [isCreating, setIsCreating] = useState(false);
    const filteredRoles = ROLES.filter(r => ['SUPER_ADMIN', 'ADMIN', 'PI', 'SPONSOR', 'COORDINATOR'].includes(r.id));

    const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();

      // Mellow Consortium Validation
      if (newUser.isMellowMember) {
        if (!newUser.zipCode) {
          addToast("Zip Code is required for Consortium membership.", "error");
          return;
        }
        if (!newUser.organization) {
          addToast("Institution/Organization name is required for Consortium membership.", "error");
          return;
        }
      }

      setIsCreating(true);
      try {
        const apiUrl = API || 'http://localhost:8003';
        const formData = new FormData();
        formData.append('email', newUser.email);
        formData.append('first_name', newUser.firstName);
        formData.append('middle_name', newUser.middleName || '');
        formData.append('last_name', newUser.lastName);
        formData.append('role', newUser.role);
        formData.append('is_mellow_member', String(newUser.isMellowMember));
        
        if (newUser.lat) formData.append('lat', String(newUser.lat));
        if (newUser.lng) formData.append('lng', String(newUser.lng));
        if (newUser.organization && newUser.organization.trim()) formData.append('organization', newUser.organization);
        if (newUser.bio && newUser.bio.trim()) formData.append('bio', newUser.bio);
        if (newUser.zipCode && newUser.zipCode.trim()) formData.append('zip_code', newUser.zipCode);
        if (newUser.country && newUser.country.trim()) formData.append('country', newUser.country);
        if (newUser.state && newUser.state.trim()) formData.append('state', newUser.state);
        if (newUser.pronouns && newUser.pronouns.trim()) formData.append('pronouns', newUser.pronouns);
        if (newUser.linkedinUrl && newUser.linkedinUrl.trim()) formData.append('linkedin_url', newUser.linkedinUrl);
        if (newUser.websiteUrl && newUser.websiteUrl.trim()) formData.append('institute_url', newUser.websiteUrl);
        if (newUser.qualifications && newUser.qualifications.trim()) formData.append('qualifications', newUser.qualifications);
        if (profileImageFile) formData.append('profile_image', profileImageFile);
        if (cvFile) formData.append('cv_file', cvFile);

        const res = await authFetch(`${apiUrl}/api/auth/admin/create-user/`, {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          addToast(`Initialization complete. Credentials dispatched to ${newUser.email}`, "success");
          setModals({ ...modals, createUser: false });
          setNewUser({ firstName: '', middleName: '', lastName: '', email: '', role: creationRole ? creationRole.toUpperCase() : 'PI', lat: '', lng: '', organization: '', bio: '', zipCode: '', country: '', state: '', isMellowMember: false, pronouns: '', linkedinUrl: '', websiteUrl: '', qualifications: '' });
          setProfileImageFile(null);
          setCvFile(null);
          // Pass true as second argument to fetchData to skip cache and get the new user immediately
          fetchData(false, true);
        } else {
          const err = await res.json();
          addToast(`Protocol Error: ${err.error || err.detail || 'Unknown failure'}`, "error");
        }
      } catch (err) {
        addToast('Critical system failure during authorization dispatch.', 'error');
        console.error(err);
      } finally {
        setIsCreating(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/60">
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#0f1133] border border-white/10 w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl relative overflow-y-auto max-h-[95vh] custom-scrollbar">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Users className="w-32 h-32 text-white" />
          </div>
          <div className="flex justify-between items-start mb-6 relative z-10 text-left">
            <div className="flex flex-col items-start">
              <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-[#7c3aed] mb-3">
                <UserPlus className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-white italic uppercase tracking-tighter text-left leading-none">Initialize <span className="text-[#7c3aed]">Personnel</span></h2>
              <p className="text-[10px] text-[#555a7a] font-black uppercase tracking-widest mt-1 text-left">Secure credential provisioning module</p>
            </div>
            <button onClick={() => setModals({ ...modals, createUser: false })} className="p-2 hover:bg-white/5 rounded-xl transition-colors" disabled={isCreating}>
              <X className="w-5 h-5 text-slate-700 hover:text-white" />
            </button>
          </div>
          <form onSubmit={handleCreateUser} className="space-y-4 relative z-10">
            {/* Pronouns + First Name + Middle Name */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 text-left w-full">
                <label className="block text-[10px] font-black text-[#555a7a] uppercase tracking-widest italic text-left">Pronouns</label>
                <select value={newUser.pronouns} onChange={e => setNewUser({ ...newUser, pronouns: e.target.value })} className="w-full bg-[#0a0b1a] border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-purple-500/40 transition-all font-mono text-left">
                  <option value="" className="bg-[#0a0b1a]">Select</option>
                  <option value="Mr." className="bg-[#0a0b1a]">Mr.</option>
                  <option value="Mrs." className="bg-[#0a0b1a]">Mrs.</option>
                  <option value="Ms." className="bg-[#0a0b1a]">Ms.</option>
                  <option value="Dr." className="bg-[#0a0b1a]">Dr.</option>
                  <option value="Prof." className="bg-[#0a0b1a]">Prof.</option>
                </select>
              </div>
              <div className="space-y-1.5 text-left w-full">
                <label className="block text-[10px] font-black text-[#555a7a] uppercase tracking-widest italic text-left">First Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="John" required value={newUser.firstName} onChange={e => setNewUser({ ...newUser, firstName: e.target.value })} className="w-full bg-[#0a0b1a] border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-purple-500/40 transition-all font-mono text-left" />
              </div>
              <div className="space-y-1.5 text-left w-full">
                <label className="block text-[10px] font-black text-[#555a7a] uppercase tracking-widest italic text-left">Middle Name</label>
                <input type="text" placeholder="Quincy" value={newUser.middleName} onChange={e => setNewUser({ ...newUser, middleName: e.target.value })} className="w-full bg-[#0a0b1a] border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-purple-500/40 transition-all font-mono text-left" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left w-full">
                <label className="block text-[10px] font-black text-[#555a7a] uppercase tracking-widest italic text-left">Last Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Doe" required value={newUser.lastName} onChange={e => setNewUser({ ...newUser, lastName: e.target.value })} className="w-full bg-[#0a0b1a] border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-purple-500/40 transition-all font-mono text-left" />
              </div>
              <div className="space-y-1.5 text-left w-full">
                <label className="block text-[10px] font-black text-[#555a7a] uppercase tracking-widest italic text-left">Personal Gmail <span className="text-red-500">*</span></label>
                <input type="email" placeholder="john.doe@gmail.com" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full bg-[#0a0b1a] border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-purple-500/40 transition-all font-mono text-left" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left w-full">
                <label className="block text-[10px] font-black text-[#555a7a] uppercase tracking-widest italic text-left">Access Tier (Role)</label>
                <select className="w-full bg-[#0a0b1a] border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-purple-500/40 transition-all font-mono text-left" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                  {filteredRoles.map(r => <option key={r.id} value={r.id} className="bg-[#0a0b1a]">{r.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 text-left w-full">
                <label className="block text-[10px] font-black text-[#555a7a] uppercase tracking-widest italic text-left">Institution</label>
                <input type="text" placeholder="MusB Research Institute" value={newUser.organization} onChange={e => setNewUser({ ...newUser, organization: e.target.value })} className="w-full bg-[#0a0b1a] border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-purple-500/40 transition-all font-mono text-left" />
              </div>
            </div>

            {/* MELLOW CONSORTIUM EXTENSIONS */}
            <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-white uppercase tracking-wider italic">Consortium Membership</h4>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Global investigator map visibility</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setNewUser({ ...newUser, isMellowMember: !newUser.isMellowMember })}
                  className={`w-12 h-7 rounded-full p-1 transition-all ${newUser.isMellowMember ? 'bg-cyan-500' : 'bg-slate-800'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-all ${newUser.isMellowMember ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {newUser.isMellowMember && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-1 text-left relative">
                    <label className="block text-[9px] font-black text-cyan-400 uppercase tracking-widest italic">Zip Code</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="90210" 
                        value={newUser.zipCode} 
                        onChange={e => setNewUser({ ...newUser, zipCode: e.target.value })} 
                        className={`w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-cyan-500/50 ${isLookingUp ? 'pr-10' : ''}`} 
                      />
                      {isLookingUp && (
                        <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-500/50 animate-spin" />
                      )}
                    </div>
                    
                    {/* Location Selection Dropdown */}
                    <AnimatePresence>
                      {locationOptions.length > 1 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 left-0 right-0 top-full mt-2 bg-[#0a0b1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
                        >
                          <div className="p-2 border-b border-white/5 bg-white/[0.02]">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-2">Multiple Locations Detected</p>
                          </div>
                          <div className="max-h-[160px] overflow-y-auto custom-scrollbar">
                            {locationOptions.map((loc, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setNewUser(prev => ({ ...prev, state: loc.state, country: loc.country, lat: loc.lat, lng: loc.lng }));
                                  setLocationOptions([]);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/[0.02] last:border-0"
                              >
                                <p className="text-[10px] font-black text-white uppercase italic">{loc.placeName}, {loc.state}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{loc.country}</p>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="block text-[9px] font-black text-[#555a7a] uppercase tracking-widest italic">State</label>
                    <input type="text" placeholder="California" value={newUser.state} onChange={e => setNewUser({ ...newUser, state: e.target.value })} className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-400 font-mono outline-none" readOnly />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="block text-[9px] font-black text-[#555a7a] uppercase tracking-widest italic">Country</label>
                    <input type="text" placeholder="United States" value={newUser.country} onChange={e => setNewUser({ ...newUser, country: e.target.value })} className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-400 font-mono outline-none" readOnly />
                  </div>
                  <div className="col-span-full space-y-1 text-left">
                    <label className="block text-[9px] font-black text-cyan-400 uppercase tracking-widest italic">Professional Biography</label>
                    <textarea 
                      placeholder="Professor of Geriatrics with a focus on cellular senescence..." 
                      value={newUser.bio} 
                      onChange={e => setNewUser({ ...newUser, bio: e.target.value })} 
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white font-medium outline-none focus:border-cyan-500/50 min-h-[80px] resize-none"
                      spellCheck={false}
                      data-gramm="false"
                      data-gramm_editor="false"
                      data-enable-grammarly="false"
                      data-quillbot-disable="true"
                      autoComplete="off"
                    />
                  </div>

                  {/* Qualifications */}
                  <div className="col-span-full space-y-1 text-left">
                    <label className="block text-[9px] font-black text-cyan-400 uppercase tracking-widest italic">Qualifications / Credentials</label>
                    <input 
                      type="text" 
                      placeholder="MD, PhD, FACP" 
                      value={newUser.qualifications} 
                      onChange={e => setNewUser({ ...newUser, qualifications: e.target.value })} 
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-cyan-500/50" 
                    />
                  </div>

                  {/* Profile Image Upload */}
                  <div className="col-span-full space-y-1 text-left">
                    <label className="block text-[9px] font-black text-cyan-400 uppercase tracking-widest italic">Profile Image</label>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer flex items-center gap-3 px-5 py-3 bg-black/40 border border-white/5 rounded-xl hover:border-cyan-500/30 transition-all">
                        <Upload className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs text-slate-400 font-bold">{profileImageFile ? profileImageFile.name : 'Choose Image...'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) setProfileImageFile(e.target.files[0]); }} />
                      </label>
                      {profileImageFile && (
                        <button type="button" onClick={() => setProfileImageFile(null)} className="text-red-400 hover:text-red-300 text-xs font-bold">Remove</button>
                      )}
                    </div>
                  </div>

                  {/* LinkedIn URL */}
                  <div className="col-span-full space-y-1 text-left">
                    <label className="block text-[9px] font-black text-cyan-400 uppercase tracking-widest italic">LinkedIn Profile URL</label>
                    <input 
                      type="url" 
                      placeholder="https://linkedin.com/in/username" 
                      value={newUser.linkedinUrl} 
                      onChange={e => setNewUser({ ...newUser, linkedinUrl: e.target.value })} 
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-cyan-500/50" 
                    />
                  </div>

                  {/* Website URL */}
                  <div className="col-span-full space-y-1 text-left">
                    <label className="block text-[9px] font-black text-cyan-400 uppercase tracking-widest italic">Website / Institute Page URL</label>
                    <input 
                      type="url" 
                      placeholder="https://university.edu/profile/username" 
                      value={newUser.websiteUrl} 
                      onChange={e => setNewUser({ ...newUser, websiteUrl: e.target.value })} 
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-cyan-500/50" 
                    />
                  </div>

                  {/* CV Upload */}
                  <div className="col-span-full space-y-1 text-left">
                    <label className="block text-[9px] font-black text-cyan-400 uppercase tracking-widest italic">Upload CV (PDF)</label>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer flex items-center gap-3 px-5 py-3 bg-black/40 border border-white/5 rounded-xl hover:border-cyan-500/30 transition-all">
                        <Upload className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-slate-400 font-bold">{cvFile ? cvFile.name : 'Choose CV File...'}</span>
                        <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => { if (e.target.files?.[0]) setCvFile(e.target.files[0]); }} />
                      </label>
                      {cvFile && (
                        <button type="button" onClick={() => setCvFile(null)} className="text-red-400 hover:text-red-300 text-xs font-bold">Remove</button>
                      )}
                    </div>
                  </div>
                  
                </div>
              )}
            </div>

            <div className="pt-4 flex gap-3">
              <button type="button" onClick={() => setModals({ ...modals, createUser: false })} className="flex-1 py-3.5 bg-white/5 border border-white/5 text-[#555a7a] rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all" disabled={isCreating}>
                Abort
              </button>
              <button type="submit" disabled={isCreating} className="flex-[2] py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.15em] italic shadow-xl shadow-purple-900/40 hover:scale-[1.01] transition-all disabled:opacity-50">
                {isCreating ? 'Synchronizing Terminal...' : 'Authorized and Dispatch Credential'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  };

  // ═══════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════

  return (
    <div className="h-screen bg-[#07091e] font-sans text-slate-300 flex overflow-hidden">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 w-60 h-screen bg-[#0a0b1b] border-r border-white/5 z-[70] flex flex-col transition-transform duration-500 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-24 flex items-center justify-center border-b border-white/5 bg-[#0a0b1a]/40 shrink-0">
          <Link to="/" target="_blank" rel="noopener noreferrer" className="group">
            <div className="bg-white p-1 rounded-xl group-hover:scale-105 transition-transform overflow-hidden shadow-xl shadow-white/5">
              <img src="/logo.jpg" alt="Logo" className="h-15 w-auto object-contain" width="474" height="164" />
            </div>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden absolute top-6 right-6 p-2 text-slate-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-10 py-4 custom-scrollbar">
          {sidebarItems.map((group, i) => (
            <div key={i} className="space-y-6">
              <p className="px-4 text-[10px] xl:text-[11px] font-black text-[#BF953F] uppercase tracking-[0.4em] font-mono opacity-80 bg-clip-text text-transparent bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] via-[#B38728] via-[#FBF5B7] to-[#AA771C]">{group.group}</p>
              <div className="space-y-1.5">
                {group.items.map((item, j) => (
                  <button
                    key={j}
                    onClick={() => {
                      if (item.id === 'WEBSITE') handleWebsiteLink();
                      else if ((item as any).isExternal) handleStudiesLink();
                      else { handlePageChange(item.id as Page); setIsSidebarOpen(false); }
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group relative ${currentPage === item.id && !(item as any).isExternal
                      ? 'bg-[#7c3aed]/20 text-white border-l-[3px] border-[#7c3aed] shadow-lg shadow-purple-900/10'
                      : 'text-[#8b8fa8] hover:bg-white/[0.02] hover:text-white'}`}
                  >
                    <div className="flex items-start gap-3 text-left">
                      <item.icon className={`w-5 h-5 mt-0.5 shrink-0 ${currentPage === item.id && !(item as any).isExternal ? 'text-[#7c3aed]' : 'text-slate-700 group-hover:text-purple-400'}`} />
                      <span className="text-[12px] xl:text-sm font-black uppercase tracking-[0.1em] leading-tight flex-1">{item.label}</span>
                    </div>
                    {(item as any).isExternal && <ExternalLink className="w-3 h-3 opacity-40 group-hover:opacity-100" />}
                    {(item as any).hasNotify && <div className="w-2 h-2 bg-pink-500 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.5)]" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 mt-auto bg-[#0a0b1a]/40 backdrop-blur-md">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 bg-white/[0.02] p-4 rounded-3xl border border-white/5 hover:border-purple-500/30 transition-all duration-500">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-600 flex items-center justify-center font-black text-white shadow-lg shadow-purple-900/40 italic text-sm">
                {currentUserName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden text-left">
                <p className="text-[12px] font-black text-white uppercase italic truncate tracking-tight leading-none">{currentUserName}</p>
                <p className="text-[10px] text-purple-400 font-black uppercase tracking-[0.1em] mt-1.5 opacity-70 leading-tight">Super Admin Portal</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full group flex items-center justify-start gap-3 px-6 py-3 bg-red-500/5 hover:bg-red-500 border border-red-500/10 hover:border-red-500 rounded-2xl transition-all duration-500"
            >
              <LogOut className="w-5 h-5 text-red-500 group-hover:text-white transition-colors shrink-0" />
              <span className="text-sm font-bold uppercase tracking-wider text-red-500 group-hover:text-white transition-colors">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Body ── */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <header className="sticky top-0 h-[64px] lg:h-[80px] bg-[#0a0b1a]/80 backdrop-blur-2xl border-b border-white/5 z-40 px-3 flex items-center justify-between gap-2 lg:gap-4 transition-all">
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white shrink-0">
              <Terminal className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex justify-end">
            <ClockDisplay />
          </div>

          <div className="flex items-center gap-2 sm:gap-6 lg:gap-8">
            <div className="relative hidden lg:block">
              <div className="px-4 py-2 bg-[#7c3aed]/10 border border-[#7c3aed]/30 rounded-full flex items-center gap-2 relative">
                <div className="w-2 h-2 bg-[#7c3aed] rounded-full animate-pulse shadow-[0_0_10px_#7c3aed]" />
                <span className="text-xs font-bold text-[#7c3aed] uppercase tracking-wider">Admin Access</span>
              </div>
            </div>

            <div className="relative" ref={notificationRef}>
              <NotificationBell
                unreadCount={notifications.filter(n => n.unread).length}
                onClick={() => setShowNotifications(!showNotifications)}
              />
              <AnimatePresence>
                {showNotifications && (
                  <div className="absolute top-full mt-4 right-0 w-80 bg-[#0f1133] border border-white/5 rounded-3xl shadow-2xl p-6 space-y-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center px-2">
                      <p className="text-xs font-bold text-white uppercase tracking-wider">Notifications</p>
                      <span className="text-[12px] font-black text-[#7c3aed] uppercase tracking-widest cursor-pointer hover:text-white">Mark all read</span>
                    </div>
                    <div className="space-y-4">
                      {notifications.map(n => (
                        <div key={n.id} className={`p-5 rounded-2xl border ${n.unread ? 'bg-[#7c3aed]/10 border-[#7c3aed]/20' : 'bg-white/[0.02] border-white/5 opacity-50'}`}>
                          <p className="text-[12px] font-bold text-white tracking-tight leading-relaxed">{n.text}</p>
                          <p className="text-[12px] text-[#555a7a] mt-3 font-black uppercase tracking-widest italic">{n.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 lg:gap-4 border-l border-white/5 pl-2 md:pl-6 relative" ref={profileRef}>
              <div className="text-right hidden sm:flex flex-col max-w-[70px] md:max-w-[110px]">
                <p className="text-[10px] md:text-[11px] font-black text-white uppercase italic tracking-tighter truncate w-full">{currentUserName}</p>
                <p className="text-[9px] text-[#555a7a] font-bold uppercase tracking-widest mt-0.5 truncate w-full">{currentUserEmail}</p>
              </div>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] border border-white/10 flex items-center justify-center text-white font-black shadow-lg shadow-purple-900/30 italic hover:scale-105 transition-all active:scale-95 shrink-0"
              >
                {currentUserName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </button>
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-full mt-4 w-56 bg-[#0f1133] border border-white/10 rounded-3xl shadow-2xl p-2 z-[100] overflow-hidden">
                    <div className="p-5 border-b border-white/5 mb-2">
                      <p className="text-sm font-black text-white uppercase italic truncate tracking-tight">{currentUserName}</p>
                      <p className="text-[11px] text-purple-400 font-black uppercase tracking-widest mt-2 px-2 py-0.5 bg-purple-400/10 border border-purple-400/20 rounded-lg inline-block">Super Admin</p>
                      <p className="text-[11px] text-[#555a7a] font-bold lowercase tracking-normal mt-2.5 truncate">{currentUserEmail}</p>
                    </div>
                    <button onClick={handleSignOut} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-400 hover:text-white hover:bg-red-500 transition-all text-sm font-black uppercase tracking-widest">
                      <LogOut className="w-5 h-5" /> Sign Out Interface
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <div className="flex-1 overflow-y-auto pt-4 pb-12 px-4 custom-scrollbar">
          {currentPage === 'DASHBOARD' && (
            <DashboardPage
              users={users}
              studies={studies}
              participants={participants}
              activities={activities}
              studyInquiries={studyInquiries}
              handlePageChange={handlePageChange}
              refreshDashboard={refreshDashboard}
              lastRefresh={lastRefresh}
              currentUserName={currentUserName}
              currentPage={currentPage}
              setModals={setModals}
              modals={modals}
              ROLES={ROLES}
            />
          )}
          {currentPage === 'ALL_USERS' && (
            <UsersPage
              users={users}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              setModals={setModals}
              modals={modals}
              viewDetails={viewDetails}
              handleRoleUpdate={handleRoleUpdate}
              handleStatusToggle={handleStatusToggle}
              formatName={formatName}
              ROLES={ROLES}
              onDelete={(u: any) => { setSelectedUser(u); setIsDeleteConfirmOpen(true); }}
            />
          )}
          {currentPage === 'STUDIES' && (
            <StudiesPage
              studies={studies}
              users={users}
              fetchData={fetchData}
              handleStudiesLink={handleStudiesLink}
              setSelectedStudy={setSelectedStudy}
              handlePageChange={handlePageChange}
            />
          )}
          {currentPage === 'SPONSORS' && (
            <SponsorsPage
              users={users}
              studies={studies}
              setCreationRole={setCreationRole}
              setModals={setModals}
              modals={modals}
              setSearchTerm={setSearchTerm}
              handlePageChange={handlePageChange}
            />
          )}
          {currentPage === 'LAUNCH_STUDY' && (
            <LaunchStudyForm
              initialData={selectedStudy}
              availablePIs={users.filter(u => (u.role || '').toString().toUpperCase() === 'PI')}
              availableCoordinators={users.filter(u => (u.role || '').toString().toUpperCase() === 'COORDINATOR')}
              availableSponsorUsers={users.filter(u => (u.role || '').toString().toUpperCase() === 'SPONSOR')}
              availableSponsors={users.filter(u => (u.role || '').toString().toUpperCase() === 'SPONSOR')}
              onSave={async (data: any, docs: any[] = []) => {
                await handleCreateStudy(data, docs);
                setSelectedStudy(null);
              }}
              onClose={() => {
                setSelectedStudy(null);
                handlePageChange('STUDIES');
              }}
            />
          )}
          {currentPage === 'SCREENER_BUILDER' && <QuestionnaireBuilder />}

          {currentPage === 'COORDINATORS' && (
            <CoordinatorsManagement
              allUsers={users}
              allStudies={studies}
              onRefresh={fetchData}
              onViewUser={viewDetails}
              onRegister={() => {
                setCreationRole('COORDINATOR');
                setModals({ ...modals, createUser: true });
              }}
            />
          )}
          {currentPage === 'PARTICIPANTS' && (
            <ParticipantsManagement
              allParticipants={participants}
              allStudies={studies}
              onRefresh={fetchData}
              onViewUser={(p) => viewDetails({ ...p.user_details, id: p.id, role: 'PARTICIPANT' })}
              onRegister={() => {
                setCreationRole('PARTICIPANT');
                setModals({ ...modals, createUser: true });
              }}
            />
          )}
          {currentPage === 'LIVE_USERS' && <LiveActiveUsers allUsers={users} />}
          {currentPage === 'METRICS' && <AnalyticsDashboard />}
          {currentPage === 'AUDIT_LOGS' && <AuditLogs activities={activities} />}
          {currentPage === 'ACTIVITY_LOG' && <AuditLogs activities={activities} />}
          {currentPage === 'WORKFLOW' && <WorkflowModerationPanel />}
          {currentPage === 'TEAM_APPROVALS' && <ApprovalModule />}
          {currentPage === 'SUBMIT_CONTENT' && <SubmitContentForms userRole="SUPER_ADMIN" />}
          {currentPage === 'CAREERS' && <CareerManagement />}
          {currentPage === 'SUPPORT' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Global <span className="text-indigo-400">Help Desk</span></h1>
              </div>
              <SupportModule />
            </div>
          )}
          {currentPage === 'SETTINGS' && <SettingsPage />}
          {currentPage === 'ANNOUNCEMENTS' && (
            <AnnouncementsPage
              announcements={announcements}
              setModals={setModals}
              modals={modals}
              authFetch={authFetch}
              fetchData={fetchData}
              API={API}
            />
          )}
          {currentPage === 'SPONSOR_LEADS' && <SponsorLeadsPage studyInquiries={studyInquiries} handlePageChange={handlePageChange} />}
          {currentPage === 'TEAM' && <TeamPage users={users} viewDetails={viewDetails} staffRecords={staffRecords} API={API} />}
          {currentPage === 'MELLOW_TRIAL' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Mellow <span className="text-cyan-400">Trial Management</span></h1>
                  <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">Consortium protocol synchronization and site monitoring</p>
                </div>
              </div>
              <StudiesPage
                studies={studies.filter(s => s.is_mellow_trial)}
                users={users}
                fetchData={fetchData}
                handleStudiesLink={handleStudiesLink}
                setSelectedStudy={setSelectedStudy}
                handlePageChange={handlePageChange}
              />
            </div>
          )}
          {currentPage === 'MELLOW_INVESTIGATORS' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Mellow <span className="text-cyan-400">Consortium Investigators</span></h1>
                  <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">Global investigator network and mapping synchronization</p>
                </div>
                <button 
                  onClick={() => {
                    setCreationRole('PI');
                    setModals({ ...modals, createUser: true });
                  }}
                  className="px-8 py-4 bg-cyan-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] italic shadow-xl shadow-cyan-900/40 hover:scale-105 transition-all flex items-center gap-3"
                >
                  <Plus className="w-4 h-4" /> Add Consortium Investigator
                </button>
              </div>
              <PIsManagement
                allUsers={users.filter(u => u.is_mellow_member)}
                allStudies={studies}
                onRefresh={fetchData}
                onViewUser={viewDetails}
              />
            </div>
          )}

          {currentPage === 'INQUIRIES' && (
            <InquiriesPage
              studyInquiries={studyInquiries}
              participantLeads={participantLeads}
              facilityInquiries={facilityInquiries}
              studies={studies}
              authFetch={authFetch}
              API={API}
              fetchData={fetchData}
              setSelectedStudy={setSelectedStudy}
              handlePageChange={handlePageChange}
            />
          )}

          {!['DASHBOARD', 'ALL_USERS', 'STUDIES', 'SPONSORS', 'LAUNCH_STUDY', 'SCREENER_BUILDER', 'PIS', 'COORDINATORS', 'PARTICIPANTS', 'LIVE_USERS', 'METRICS', 'AUDIT_LOGS', 'SETTINGS', 'ANNOUNCEMENTS', 'SPONSOR_LEADS', 'TEAM', 'INQUIRIES', 'TEAM_APPROVALS', 'CAREERS', 'WORKFLOW', 'SUBMIT_CONTENT', 'ACTIVITY_LOG', 'SUPPORT', 'MELLOW_TRIAL', 'MELLOW_INVESTIGATORS'].includes(currentPage) && (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center">
                <LayoutDashboard className="w-12 h-12 text-[#555a7a] animate-pulse" />
              </div>
              <div>
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">{currentPage.replace('_', ' ')} <span className="text-[#7c3aed]">Portal</span></h2>
                <p className="text-[#555a7a] font-black uppercase tracking-[0.4em] text-[12px] mt-4">Module synchronization in progress for secure terminal access</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {modals.createUser && <CreateUserModal />}
        {modals.createAnnouncement && <CreateAnnouncementModal />}
      </AnimatePresence>

      {/* ── Toast System ── */}
      <div className="fixed bottom-10 right-10 z-[200] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              layout
              className={`pointer-events-auto min-w-[320px] p-6 rounded-3xl border shadow-2xl backdrop-blur-3xl flex items-center gap-5 ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                  toast.type === 'warn' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                    'bg-cyan-500/10 border-white/10 text-cyan-400'
                }`}
            >
              <div className={`w-2 h-2 rounded-full animate-pulse ${toast.type === 'error' ? 'bg-red-500' : toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'warn' ? 'bg-cyan-500' : 'bg-cyan-500'}`} />
              <div className="flex-1">
                <p className="text-[12px] font-black uppercase tracking-widest opacity-50 mb-1">{toast.type} ALERT</p>
                <p className="text-sm font-black italic tracking-tight">{toast.msg}</p>
              </div>
              <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-white/20 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── User Detail Modal ── */}
      <AnimatePresence>
        {isUserDetailOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0a0b1e]/90 backdrop-blur-xl" onClick={() => setIsUserDetailOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }} className="relative w-full max-w-2xl bg-[#0d0e2b] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-b border-white/5 relative">
                <button onClick={() => setIsUserDetailOpen(false)} className="absolute top-6 right-6 p-3 bg-black/20 hover:bg-black/40 rounded-full text-white/50 hover:text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-12 pb-12">
                <div className="relative -mt-12 mb-8 flex items-end gap-6">
                  <div className="w-24 h-24 rounded-3xl bg-[#0a0b1a] border-4 border-[#0d0e2b] flex items-center justify-center text-3xl font-black text-white italic shadow-2xl overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed]/20 to-cyan-500/20" />
                    {getMediaUrl(selectedUser.image) ? (
                      <img 
                        src={getMediaUrl(selectedUser.image)!} 
                        alt={selectedUser.name} 
                        className="w-full h-full object-cover relative z-10" 
                        onError={(e: any) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=0d8abc&color=fff`;
                        }}
                      />
                    ) : (
                      <span className="relative z-10">{(selectedUser.name?.[0] || 'U').toUpperCase()}</span>
                    )}
                  </div>
                  <div className="pb-2">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">{formatName(selectedUser.name)}</h3>
                    <p className="text-[11px] text-cyan-400 font-black uppercase tracking-[0.2em] mt-2 italic opacity-90">
                      {selectedUser.designation || 'Staff Member'}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      {selectedUser.category !== 'staff' && <RoleBadge role={selectedUser.role} />}
                      <span className={`px-2 py-0.5 rounded-full text-[12px] font-black uppercase tracking-widest ${selectedUser.status === 'Active' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                        {selectedUser.status}
                      </span>
                      {selectedUser.must_reset && <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 rounded-full text-[12px] font-black uppercase tracking-widest">Reset Pending</span>}
                      {selectedUser.profile_incomplete && <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded-full text-[12px] font-black uppercase tracking-widest">Profile Draft</span>}
                    </div>
                  </div>
                </div>
                <div className="space-y-10 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                  {/* PROFESSIONAL BIO */}
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-cyan-400 uppercase tracking-widest flex items-center justify-between gap-2 italic">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3" /> Professional Summary
                      </div>
                      {selectedUser.category === 'staff' && (
                        <button 
                          onClick={() => {
                            setIsUserDetailOpen(false);
                            setEditingStaff({ 
                              ...selectedUser,
                              bio: selectedUser.bio || `Serving as ${selectedUser.designation || selectedUser.role} at MusB Research, contributing to high-impact scientific operations and translational excellence.`,
                              isSystemUser: selectedUser.created !== 'Directory Record',
                              designation: selectedUser.designation || selectedUser.role 
                            });
                            setIsEditStaffModalOpen(true);
                          }}
                          className="text-[10px] text-cyan-400 hover:text-white transition-colors flex items-center gap-1 bg-cyan-500/10 px-2 py-1 rounded-lg border border-cyan-500/20"
                        >
                          <Edit2 className="w-2.5 h-2.5" /> Edit Section
                        </button>
                      )}
                    </label>
                    <p className="text-base font-medium text-slate-300 leading-relaxed italic">
                      {selectedUser.bio || `Serving as ${selectedUser.designation} at MusB Research, contributing to high-impact scientific operations and translational excellence.`}
                    </p>
                  </div>

                  {/* EXPERTISE TAGS */}
                  {selectedUser.expertise_tags && selectedUser.expertise_tags.length > 0 && (
                    <div className="space-y-4">
                      <label className="text-[12px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2 italic">
                        <Activity className="w-3 h-3" /> Core Competencies
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.expertise_tags.map((tag: string, i: number) => (
                          <span key={i} className="px-4 py-2 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-[10px] font-black text-cyan-300 uppercase tracking-widest shadow-lg">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* EXTENDED BACKGROUND */}
                  {selectedUser.expanded_bio && (
                    <div className="space-y-4">
                      <label className="text-[12px] font-black text-[#555a7a] uppercase tracking-widest flex items-center gap-2 italic">
                        <Briefcase className="w-3 h-3" /> Professional Background
                      </label>
                      <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                        <p className="text-sm font-medium text-slate-400 leading-relaxed whitespace-pre-line">
                          {selectedUser.expanded_bio}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* AFFILIATIONS & RESEARCH */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {selectedUser.affiliations && selectedUser.affiliations.length > 0 && (
                      <div className="space-y-4">
                        <label className="text-[12px] font-black text-[#555a7a] uppercase tracking-widest flex items-center gap-2 italic">
                          <Building2 className="w-3 h-3" /> Affiliations
                        </label>
                        <ul className="space-y-2">
                          {selectedUser.affiliations.map((aff: string, i: number) => (
                            <li key={i} className="flex items-center gap-3 text-xs font-black text-white italic uppercase tracking-tight">
                              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                              {aff}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedUser.areas_of_expertise && selectedUser.areas_of_expertise.length > 0 && (
                      <div className="space-y-4">
                        <label className="text-[12px] font-black text-[#555a7a] uppercase tracking-widest flex items-center gap-2 italic">
                          <ShieldCheck className="w-3 h-3" /> Specialized Areas
                        </label>
                        <ul className="space-y-2">
                          {selectedUser.areas_of_expertise.map((area: string, i: number) => (
                            <li key={i} className="flex items-center gap-3 text-xs font-black text-slate-400 italic uppercase tracking-tight">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                              {area}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* PUBLICATIONS SECTION (IF ANY) */}
                  {selectedUser.publications && selectedUser.publications.length > 0 && (
                    <div className="space-y-4">
                      <label className="text-[12px] font-black text-[#555a7a] uppercase tracking-widest flex items-center gap-2 italic">
                        <BookOpen className="w-3 h-3" /> Selected Publications
                      </label>
                      <div className="space-y-3">
                        {selectedUser.publications.map((pub: string, i: number) => (
                          <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-4 items-start">
                            <div className="p-2 bg-cyan-500/10 rounded-lg">
                              <FileText className="w-4 h-4 text-cyan-500" />
                            </div>
                            <p className="text-xs font-medium text-slate-400 leading-normal">{pub}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row gap-4">
                  <button onClick={() => setIsUserDetailOpen(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[11px] font-black text-white uppercase tracking-[0.2em] italic transition-all">
                    Close Entry
                  </button>
                  {selectedUser.category !== 'staff' && (
                    <button 
                      onClick={() => {
                        setIsUserDetailOpen(false);
                        setEditingStaff({ 
                          ...selectedUser,
                          isSystemUser: selectedUser.created !== 'Directory Record',
                          designation: selectedUser.designation || selectedUser.role 
                        });
                        setIsEditStaffModalOpen(true);
                      }}
                      className="flex-1 py-4 bg-[#7c3aed]/10 hover:bg-[#7c3aed] text-[#7c3aed] hover:text-white border border-[#7c3aed]/20 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] italic transition-all flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-3 h-3" /> Edit Details
                    </button>
                  )}
                  <button 
                    onClick={() => handleStatusToggle(selectedUser)} 
                    className={`flex-1 py-4 border rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.15em] italic transition-all flex items-center justify-center gap-2 group/status shadow-xl ${
                      selectedUser.status === 'Active' 
                        ? 'bg-amber-500/5 hover:bg-amber-500 text-amber-500 hover:text-white border-amber-500/20 hover:border-amber-500 hover:shadow-amber-500/20' 
                        : 'bg-emerald-500/5 hover:bg-emerald-500 text-emerald-500 hover:text-white border-emerald-500/20 hover:border-emerald-500 hover:shadow-emerald-500/20'
                    }`}
                  >
                    {selectedUser.status === 'Active' ? (
                      <>
                        <PowerOff className="w-3.5 h-3.5 group-hover/status:scale-110 transition-transform" />
                        Deactivate Access
                      </>
                    ) : (
                      <>
                        <Power className="w-3.5 h-3.5 group-hover/status:scale-110 transition-transform" />
                        Activate Access
                      </>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => {
                      setIsUserDetailOpen(false);
                      setStaffToRemove({ 
                        category: selectedUser.category, 
                        index: selectedUser.index,
                        id: selectedUser.id,
                        name: selectedUser.name
                      });
                      setIsRemoveStaffConfirmOpen(true);
                    }} 
                    className="flex-1 py-4 bg-red-500/5 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/10 hover:border-red-600 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.15em] italic transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-red-600/30 group/remove"
                  >
                    <Trash2 className="w-3.5 h-3.5 group-hover/remove:-rotate-12 transition-transform" />
                    Remove Member
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ── Edit Staff Modal ── */}
      <AnimatePresence>
        {isEditStaffModalOpen && editingStaff && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0a0b1e]/95 backdrop-blur-2xl" onClick={() => setIsEditStaffModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }} className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0d0e2b] border border-white/10 rounded-[2.5rem] shadow-2xl p-10 custom-scrollbar">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Edit2 className="w-32 h-32" />
              </div>
              
              <div className="relative z-10 space-y-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <UserIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Edit Profile Details</h3>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">Managing professional identity for {editingStaff.name}</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* CORE INFO SECTION */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {editingStaff.category === 'collaborators' && (
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-[#555a7a] uppercase tracking-widest px-1 italic">Name</label>
                        <input 
                          type="text" 
                          defaultValue={editingStaff.name}
                          onChange={(e) => setEditingStaff({ ...editingStaff, newName: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold italic focus:border-cyan-500/50 outline-none transition-all"
                          placeholder="e.g. Synbiotic Health"
                          {...extensionProps}
                        />
                      </div>
                    )}
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-[#555a7a] uppercase tracking-widest px-1 italic">
                        {editingStaff.category === 'collaborators' ? 'Staff' : 'Professional Designation'}
                      </label>
                      <input 
                        type="text" 
                        defaultValue={editingStaff.designation || editingStaff.role}
                        onChange={(e) => setEditingStaff({ ...editingStaff, newDesignation: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold italic focus:border-cyan-500/50 outline-none transition-all"
                        placeholder={editingStaff.category === 'collaborators' ? "e.g. Staff" : "e.g. Chief Operations Officer"}
                        {...extensionProps}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-[#555a7a] uppercase tracking-widest px-1 italic">
                        {editingStaff.category === 'collaborators' ? 'Global Operation' : 'Department / Focus Area'}
                      </label>
                      <input 
                        type="text" 
                        defaultValue={editingStaff.dept || editingStaff.expertise_area || (editingStaff.category === 'collaborators' ? 'Global Operations' : '')}
                        onChange={(e) => setEditingStaff({ ...editingStaff, newDept: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold italic focus:border-cyan-500/50 outline-none transition-all"
                        placeholder={editingStaff.category === 'collaborators' ? "e.g. Global Operations" : "e.g. Product Engineering"}
                        {...extensionProps}
                      />
                    </div>
                  </div>


                  {/* SCIENTIFIC PROFILE EXTENSIONS */}
                    <div className="space-y-8 pt-10 border-t border-white/5">
                      {editingStaff.category !== 'collaborators' && (
                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-purple-400 uppercase tracking-widest px-1 italic flex items-center gap-2">
                            <FileText className="w-3 h-3" /> {editingStaff.category === 'staff' ? 'Professional Summary' : 'Short Biography (Summary Card)'}
                          </label>
                          <textarea 
                            defaultValue={editingStaff.bio}
                            onChange={(e) => setEditingStaff({ ...editingStaff, newBio: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-medium text-sm focus:border-purple-500/50 outline-none transition-all h-32 custom-scrollbar leading-relaxed"
                            placeholder={editingStaff.category === 'staff' ? "Enter professional summary..." : "Brief summary for the team card..."}
                            {...extensionProps}
                          ></textarea>
                        </div>
                      )}

                      {editingStaff.category !== 'staff' && editingStaff.category !== 'collaborators' && (
                        <>
                          <div className="space-y-3">
                            <label className="text-[11px] font-black text-cyan-400 uppercase tracking-widest px-1 italic flex items-center gap-2">
                              <Briefcase className="w-3 h-3" /> Full Professional Background (Expanded Bio)
                            </label>
                            <textarea 
                              defaultValue={editingStaff.expanded_bio}
                              onChange={(e) => setEditingStaff({ ...editingStaff, newExpandedBio: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-medium text-sm focus:border-cyan-500/50 outline-none transition-all h-48 custom-scrollbar leading-relaxed"
                              placeholder="Full professional history and vision..."
                              {...extensionProps}
                            ></textarea>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                              <label className="text-[11px] font-black text-[#555a7a] uppercase tracking-widest px-1 italic">Core Competencies (Expertise Tags)</label>
                              <textarea 
                                defaultValue={editingStaff.expertise_tags?.join(', ')}
                                onChange={(e) => setEditingStaff({ ...editingStaff, newTags: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold italic focus:border-cyan-500/50 outline-none transition-all h-24 text-xs"
                                placeholder="Microbiome, Immunology, Brain Health..."
                                {...extensionProps}
                              ></textarea>
                            </div>
                            <div className="space-y-3">
                              <label className="text-[11px] font-black text-[#555a7a] uppercase tracking-widest px-1 italic">Affiliations (One per line)</label>
                              <textarea 
                                defaultValue={editingStaff.affiliations?.join('\n')}
                                onChange={(e) => setEditingStaff({ ...editingStaff, newAffiliations: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold italic focus:border-cyan-500/50 outline-none transition-all h-24 text-xs"
                                placeholder="University of Illinois, NIH..."
                                {...extensionProps}
                              ></textarea>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#555a7a] uppercase tracking-widest px-1 italic flex items-center gap-2">
                              <BookOpen className="w-3 h-3" /> Selected Publications (One per line)
                            </label>
                            <textarea 
                              defaultValue={editingStaff.publications?.join('\n')}
                              onChange={(e) => setEditingStaff({ ...editingStaff, newPublications: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold italic focus:border-cyan-500/50 outline-none transition-all h-32 text-xs leading-relaxed"
                              placeholder="Title, Journal, Year..."
                              {...extensionProps}
                            ></textarea>
                          </div>
                        </>
                      )}
                    </div>

                  {editingStaff.isSystemUser && editingStaff.category !== 'staff' && (
                    <div className="p-8 bg-cyan-500/5 border border-cyan-500/20 rounded-[2rem] space-y-4">
                      <label className="text-[11px] font-black text-cyan-500 uppercase tracking-widest px-1 italic flex items-center gap-2">
                        <Shield className="w-3 h-3" /> System Access Permissions
                      </label>
                      <select 
                        defaultValue={editingStaff.role}
                        onChange={(e) => setEditingStaff({ ...editingStaff, newRole: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-xs font-black text-white uppercase tracking-[0.1em] outline-none focus:border-cyan-500/50"
                      >
                        {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsEditStaffModalOpen(false)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      const updatedRole = editingStaff.newRole || editingStaff.role;
                      const updatedDesignation = editingStaff.newDesignation || editingStaff.designation;
                      const updatedDept = editingStaff.newDept || editingStaff.dept || editingStaff.expertise_area;

                      // 1. Handle System Role Update (Backend)
                      if (editingStaff.isSystemUser && updatedRole !== editingStaff.role) {
                        await handleRoleUpdate(editingStaff.id, updatedRole);
                      }

                      const updatedBio = editingStaff.newBio ?? editingStaff.bio;
                      const updatedExpandedBio = editingStaff.newExpandedBio ?? editingStaff.expanded_bio;
                      const updatedTags = editingStaff.newTags ? editingStaff.newTags.split(',').map((t: string) => t.trim()) : editingStaff.expertise_tags;
                      const updatedAffiliations = editingStaff.newAffiliations ? editingStaff.newAffiliations.split('\n').map((t: string) => t.trim()).filter(Boolean) : editingStaff.affiliations;
                      const updatedPublications = editingStaff.newPublications ? editingStaff.newPublications.split('\n').map((t: string) => t.trim()).filter(Boolean) : editingStaff.publications;
                      const updatedName = editingStaff.newName || editingStaff.name;

                      // 2. Persist to Backend Directory
                      try {
                        const directoryId = editingStaff.directoryId || editingStaff.id;
                        const formData = new FormData();
                        formData.append('name', updatedName);
                        formData.append('role', updatedDesignation);
                        formData.append('advisory_role', updatedDesignation);
                        formData.append('dept', updatedDept);
                        formData.append('expertise_area', updatedDept);
                        formData.append('bio', updatedBio);
                        formData.append('expanded_bio', updatedExpandedBio);
                        formData.append('expertise_tags', JSON.stringify(updatedTags));
                        formData.append('affiliations', JSON.stringify(updatedAffiliations));
                        formData.append('publications', JSON.stringify(updatedPublications));
                        formData.append('system_role', updatedRole);
                        

                        const response = await authFetch(`${API}/api/team-members/${directoryId}/`, {
                          method: 'PATCH',
                          body: formData
                        });

                        if (!response.ok) {
                          const errorData = await response.json().catch(() => ({}));
                          addToast(errorData.detail || "Database synchronization failed", "error");
                          return;
                        }
                      } catch (error) {
                        console.error("Profile synchronization error:", error);
                        addToast("Network failure during profile synchronization", "error");
                        return;
                      }

                      // 3. Update Directory Records State (Frontend)
                      setStaffRecords((prev: any) => {
                        const updateList = (list: any[]) => list.map(m => 
                          (m.name === editingStaff.name) ? { 
                            ...m, 
                            name: updatedName,
                            role: updatedDesignation, 
                            advisory_role: updatedDesignation,
                            system_role: updatedRole,
                            dept: updatedDept,
                            expertise_area: updatedDept,
                            bio: updatedBio,
                            expanded_bio: updatedExpandedBio,
                            expertise_tags: updatedTags,
                            affiliations: updatedAffiliations,
                            publications: updatedPublications
                          } : m
                        );
                        return {
                          leadership: updateList(prev.leadership),
                          advisors: updateList(prev.advisors),
                          staff: updateList(prev.staff),
                          collaborators: updateList(prev.collaborators)
                        };
                      });

                      addToast(`Profile Synchronized: ${editingStaff.name}`, "success");
                      
                      // Refresh selected user if it was the one being edited
                      if (selectedUser && (selectedUser.id === editingStaff.id || selectedUser.name === editingStaff.name)) {
                        setSelectedUser({
                          ...selectedUser,
                          role: updatedRole,
                          designation: updatedDesignation,
                          dept: updatedDept,
                          bio: updatedBio,
                          expanded_bio: updatedExpandedBio,
                          expertise_tags: updatedTags,
                          affiliations: updatedAffiliations,
                          publications: updatedPublications
                        });
                      }

                      setIsEditStaffModalOpen(false);
                    }}
                    className="flex-1 py-4 bg-cyan-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] italic shadow-2xl shadow-cyan-500/20 hover:-translate-y-1 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete User? Modal (System) ── */}
      <AnimatePresence>
        {isDeleteConfirmOpen && selectedUser && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsDeleteConfirmOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-sm bg-[#121432] border border-red-500/20 rounded-[2rem] p-10 text-center shadow-2xl">
              <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center text-red-500 mx-auto mb-8 border border-red-500/20">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-4">Delete User?</h3>
              <p className="text-[12px] text-[#8b8fa8] leading-relaxed mb-10">
                Are you sure you want to delete <span className="text-white font-bold">{selectedUser.name}</span>? This action is <span className="text-red-500 font-black italic">permanent</span> and cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={async () => {
                    try {
                      const apiUrl = API || 'http://localhost:8003';
                      const res = await authFetch(`${apiUrl}/api/users/${selectedUser.id}/`, { method: 'DELETE' });
                      if (res.ok) {
                        addToast(`User ${selectedUser.name} removed from system`, 'success');
                        fetchData();
                        setIsDeleteConfirmOpen(false);
                        setSelectedUser(null);
                      } else {
                        const err = await res.json().catch(() => ({}));
                        addToast(err.error || err.detail || "Deletion request refused by core", 'error');
                      }
                    } catch (err) {
                      addToast("Network failure during deletion protocol", 'error');
                    }
                  }}
                  className="w-full py-4 bg-red-500 text-white rounded-xl font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-red-500/20 hover:bg-red-600 transition-all"
                >
                  Confirm Deletion
                </button>
                <button onClick={() => setIsDeleteConfirmOpen(false)} className="w-full py-4 text-[#555a7a] hover:text-white font-black text-[12px] uppercase tracking-[0.2em] transition-all">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add Staff Modal ── */}
      <AnimatePresence>
        {isAddStaffModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddStaffModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="relative bg-[#0f1133] border border-white/10 rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center">
                    <Plus className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Add {addingStaffCategory} Member</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Initialize professional directory record</p>
                  </div>
                </div>
                <button onClick={() => setIsAddStaffModalOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 transition-all"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">
                      {addingStaffCategory === 'collaborators' ? 'Name' : 'Full Name'}
                    </label>
                    <input 
                      type="text" 
                      placeholder={addingStaffCategory === 'collaborators' ? "e.g. Synbiotic Health" : "e.g. Dr. Jane Smith"}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-cyan-500/50 transition-all outline-none italic"
                      value={newStaffData.name}
                      onChange={(e) => setNewStaffData({...newStaffData, name: e.target.value})}
                      {...extensionProps}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">
                      {addingStaffCategory === 'collaborators' ? 'Staff' : (addingStaffCategory === 'advisors' ? 'Advisory Role' : 'Professional Role')}
                    </label>
                    <input 
                      type="text" 
                      placeholder={addingStaffCategory === 'collaborators' ? "e.g. Staff" : "e.g. Chief Scientist"}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-cyan-500/50 transition-all outline-none italic"
                      value={newStaffData.role}
                      onChange={(e) => setNewStaffData({...newStaffData, role: e.target.value})}
                      {...extensionProps}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">
                    {addingStaffCategory === 'collaborators' ? 'Global Operation' : (addingStaffCategory === 'advisors' ? 'Expertise Area' : 'Department')}
                  </label>
                  <input 
                    type="text" 
                    placeholder={addingStaffCategory === 'collaborators' ? "e.g. Global Operations" : (addingStaffCategory === 'advisors' ? "e.g. Regulatory Affairs" : "e.g. Clinical Operations")}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-cyan-500/50 transition-all outline-none italic"
                    value={newStaffData.dept}
                    onChange={(e) => setNewStaffData({...newStaffData, dept: e.target.value})}
                    {...extensionProps}
                  />
                </div>


                <div className="space-y-6">
                  {addingStaffCategory !== 'collaborators' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">
                        {addingStaffCategory === 'staff' ? 'Professional Summary' : 'SHORT BIOGRAPHY (SUMMARY CARD)'}
                      </label>
                      <textarea 
                        placeholder={addingStaffCategory === 'staff' ? "Brief professional summary..." : "Professional summary for the card view..."}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:border-cyan-500/50 transition-all outline-none h-28 resize-none italic"
                        value={newStaffData.bio}
                        onChange={(e) => setNewStaffData({...newStaffData, bio: e.target.value})}
                        {...extensionProps}
                      ></textarea>
                    </div>
                  )}

                  {addingStaffCategory !== 'staff' && addingStaffCategory !== 'collaborators' && (
                    <>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">FULL PROFESSIONAL BACKGROUND (EXPANDED BIO)</label>
                        <textarea 
                          placeholder="Enter full professional history..."
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:border-cyan-500/50 transition-all outline-none h-32 resize-none italic"
                          value={newStaffData.expanded_bio}
                          onChange={(e) => setNewStaffData({...newStaffData, expanded_bio: e.target.value})}
                          {...extensionProps}
                        ></textarea>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">CORE COMPETENCIES (EXPERTISE TAGS)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Microbiome, Genetics, Neuroscience (Comma separated)"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-cyan-500/50 transition-all outline-none italic"
                          value={newStaffData.expertise_tags}
                          onChange={(e) => setNewStaffData({...newStaffData, expertise_tags: e.target.value})}
                          {...extensionProps}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">AFFILIATIONS (ONE PER LINE)</label>
                          <textarea 
                            placeholder="e.g. Harvard University&#10;Stanford Research"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:border-cyan-500/50 transition-all outline-none h-32 resize-none italic"
                            value={newStaffData.affiliations}
                            onChange={(e) => setNewStaffData({...newStaffData, affiliations: e.target.value})}
                            {...extensionProps}
                          ></textarea>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">SELECTED PUBLICATIONS (ONE PER LINE)</label>
                          <textarea 
                            placeholder="e.g. Nature (2023)&#10;Science (2024)"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:border-cyan-500/50 transition-all outline-none h-32 resize-none italic"
                            value={newStaffData.publications}
                            onChange={(e) => setNewStaffData({...newStaffData, publications: e.target.value})}
                            {...extensionProps}
                          ></textarea>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button 
                  onClick={handleAddStaff}
                  className="w-full py-5 bg-gradient-to-r from-cyan-600 to-[#7c3aed] text-white rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.3em] italic shadow-2xl shadow-[#7c3aed]/20 hover:scale-[1.01] active:scale-95 transition-all mt-4"
                >
                  Add To Directory
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Remove Staff Confirm Modal ── */}
      <AnimatePresence>
        {isRemoveStaffConfirmOpen && staffToRemove && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRemoveStaffConfirmOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-[#0f1133] border border-red-500/30 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Remove Member?</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-10">
                Are you sure you want to remove <span className="text-white font-bold">{staffToRemove.name}</span> from the <span className="text-cyan-400 font-bold uppercase">{staffToRemove.category}</span> directory? This action is permanent.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setIsRemoveStaffConfirmOpen(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all">Cancel</button>
                <button onClick={handleRemoveStaff} className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all">Confirm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => { clearToken(); window.location.href = "/mainframe/restricted-auth"; }}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(124,58,237,0.3); }
      `}</style>
    </div>
  );
}
