import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authFetch, clearToken, getRole, performLogout, getDisplayName, revealValue, API } from '../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Briefcase, Activity, Crown, Shield, Bell, Settings, LogOut, Search,
  Plus, Eye, Edit2, Trash2, ChevronRight, Building, BarChart2, Globe,
  Megaphone, FileText, UserCheck, AlertTriangle, Zap, X, ExternalLink,
  ChevronDown, Filter, Mail, Phone, Calendar, ArrowRight, ShieldCheck,
  LayoutDashboard, Server, Network, Terminal, CheckCircle2, MoreVertical,
  MapPin, Clock, MousePointer2, User as UserIcon, Menu, RefreshCw,
  UserPlus, ShieldAlert, Rocket, ClipboardList, Archive
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

// ═══════════════════════════════════════════
// TYPES & MOCK DATA
// ═══════════════════════════════════════════

type Page =
  | 'DASHBOARD' | 'ACTIVITY_LOG' | 'ALL_USERS' | 'STUDIES' | 'SPONSORS'
  | 'SPONSOR_LEADS' | 'METRICS' | 'TEAM' | 'INQUIRIES'
  | 'ANNOUNCEMENTS' | 'AUDIT_LOGS' | 'SETTINGS'
  | 'LAUNCH_STUDY' | 'SCREENER_BUILDER' | 'PIS'
  | 'COORDINATORS' | 'PARTICIPANTS' | 'LIVE_USERS' | 'WORKFLOW' | 'SUBMIT_CONTENT' | 'TEAM_APPROVALS' | 'CAREERS' | 'SUPPORT';

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
    const apiUrl = API || 'http://localhost:8000';
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
    const apiUrl = API || 'http://localhost:8000';
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
                          const apiUrl = API || 'http://localhost:8000';
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
                                const apiUrl = API || 'http://localhost:8000';
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
                          const apiUrl = API || 'http://localhost:8000';
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
                            const apiUrl = API || 'http://localhost:8000';
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
  const navigate = useNavigate();
  const location = useLocation();

  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const route = location.pathname.split('/').pop();
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
    if (route === 'pis') return 'PIS';
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
    const route = location.pathname.split('/').pop();
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
    else if (route === 'pis') setCurrentPage('PIS');
    else if (route === 'coordinators') setCurrentPage('COORDINATORS');
    else if (route === 'participants') setCurrentPage('PARTICIPANTS');
    else if (route === 'live-users') setCurrentPage('LIVE_USERS');
    else if (route === 'workflow') setCurrentPage('WORKFLOW');
    else if (route === 'content') setCurrentPage('SUBMIT_CONTENT');
    else if (route === 'approvals') setCurrentPage('TEAM_APPROVALS');
    else if (route === 'careers') setCurrentPage('CAREERS');
    else if (route === 'support') setCurrentPage('SUPPORT');
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
      'PIS': 'pis',
      'COORDINATORS': 'coordinators',
      'PARTICIPANTS': 'participants',
      'LIVE_USERS': 'live-users',
      'WORKFLOW': 'workflow',
      'SUBMIT_CONTENT': 'content',
      'TEAM_APPROVALS': 'approvals',
      'CAREERS': 'careers',
      'SUPPORT': 'support'
    };
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
  const [announcements, setAnnouncements] = useState<any[]>([]);
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

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const apiUrl = API || 'http://localhost:8000';
      const [uRes, sRes, pRes, iRes, nRes] = await Promise.all([
        authFetch(`${apiUrl}/api/users/?limit=100`),
        authFetch(`${apiUrl}/api/studies/?limit=50`),
        authFetch(`${apiUrl}/api/participants/?limit=100`),
        authFetch(`${apiUrl}/api/study-inquiries/?limit=50`),
        authFetch(`${apiUrl}/api/news/?limit=50`),
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
      if (nRes.ok) {
        const raw = await nRes.json();
        setAnnouncements(Array.isArray(raw) ? raw : (raw.results || []));
      }
      try {
        const aRes = await authFetch(`${apiUrl}/api/auth/admin/audit-logs/`);
        if (aRes.ok) {
          const raw = await aRes.json();
          setActivities(Array.isArray(raw) ? raw : (raw.results || []));
        }
      } catch (e) {
        console.warn("Audit logs fetch skipped or failed");
      }
      setLastRefresh(new Date().toLocaleTimeString());
      addToast("Platform Data Synchronized With Core", "success");
    } catch (err) {
      console.error("Failed to fetch platform data:", err);
      addToast("Terminal Connection Unstable", "error");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [API, navigate, addToast]);

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

  // (getStudyIdentifier moved outside)

  const handleCreateStudy = async (formData: any, uploadedDocs: any[] = []) => {
    try {
      const apiUrl = API || 'http://localhost:8000';
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
        description: formData.brief_description,
        primary_indication: formData.indication,
        condition: formData.indication || formData.condition,
        study_type: formData.execution_type,
        target_screened: formData.target_subjects,
        pi_ids: formData.assigned_pis,
        coordinator_ids: formData.assigned_coordinators,
        sponsor_org_id: formData.sponsor_org_id,
        stage: formData.stage
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
    const apiUrl = API || 'http://localhost:8000';
    try {
      const res = await authFetch(`${apiUrl}/api/users/${userId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) fetchData();
    } catch (err) {
      alert("Update failed");
    }
  };

  const handleStatusToggle = async (user: any) => {
    const apiUrl = API || 'http://localhost:8000';
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
      }
    } catch (err) {
      alert("Status update failed");
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
          { label: 'Sponsor Teams', value: (studyInquiries || []).length, icon: Users, color: '#ec4899', onClick: () => handlePageChange('INQUIRIES') },
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
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Sponsor <span className="text-cyan-500">Leads & Inquiries</span></h1>
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
                <p className="text-[12px] text-slate-500 font-black uppercase tracking-widest mt-2">{iq.legal_name || 'Anonymous'}</p>
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
                  <h4 className="text-xl font-black text-white uppercase italic group-hover:text-emerald-400 transition-all">{a.title}</h4>
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
                      const apiUrl = API || 'http://localhost:8000';
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

  const TeamPage = ({ users, viewDetails }: any) => {
    const internalTeam = (users || []).filter((u: any) => ['SUPER_ADMIN', 'ADMIN', 'PI', 'COORDINATOR'].includes(u.role));
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">MUSB <span className="text-[#818cf8]">Internal Team</span></h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {internalTeam.length === 0 ? (
            <div className="col-span-4 py-20 text-center opacity-30 italic uppercase tracking-[0.2em] text-[12px]">No internal team members detected</div>
          ) : (
            internalTeam.map((u: any, i: number) => (
              <div key={i} className="bg-[#0f1133] border border-white/5 rounded-[2.5rem] p-8 text-center hover:border-cyan-500/30 transition-all group">
                <div className="w-20 h-20 bg-cyan-500/10 rounded-[2rem] flex items-center justify-center text-cyan-400 mx-auto mb-6 font-black text-2xl group-hover:scale-110 transition-transform">
                  {u.name ? u.name[0] : '?'}
                </div>
                <h4 className="text-xl font-black text-white uppercase italic tracking-tighter truncate px-2">{u.name}</h4>
                <p className="text-[12px] text-[#555a7a] mt-3 font-black uppercase tracking-widest leading-relaxed">
                  {u.role === 'SUPER_ADMIN' ? 'Master Admin / Root' : 'Team Controller'}
                </p>
                <button
                  onClick={() => viewDetails(u)}
                  className="mt-8 w-full py-3 bg-white/5 text-[12px] font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-slate-900 transition-all"
                >
                  Direct Link
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════
  // PAGE: INQUIRIES
  // ═══════════════════════════════════════════

  const InquiriesPage = ({ studyInquiries, studies, authFetch, API, fetchData, handlePageChange }: any) => (
    <StudyInquiriesModule 
      studyInquiries={studyInquiries}
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
      group: 'OVERVIEW', items: [
        { id: 'WEBSITE', label: 'Main Website', icon: Globe, isExternal: true },
        { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'LIVE_USERS', label: 'Live Active Users', icon: Activity, hasNotify: true },
        { id: 'ACTIVITY_LOG', label: 'Platform Activity', icon: Clock },
      ]
    },
    {
      group: 'CORE MANAGEMENT', items: [
        { id: 'ALL_USERS', label: 'All Users', icon: Users },
        { id: 'STUDIES', label: 'All Studies', icon: Briefcase },
        { id: 'LAUNCH_STUDY', label: 'Launch A Study', icon: Rocket },
        { id: 'SCREENER_BUILDER', label: 'Screener Builder', icon: ClipboardList },
        { id: 'CAREERS', label: 'Careers', icon: Briefcase },
      ]
    },
    {
      group: 'STAKEHOLDERS & ACCESS', items: [
        { id: 'TEAM_APPROVALS', label: 'Team Approvals', icon: ShieldCheck, hasNotify: true },
        { id: 'SPONSORS', label: 'Sponsors', icon: Building },
        { id: 'COORDINATORS', label: 'Coordinators', icon: UserCheck },
        { id: 'PARTICIPANTS', label: 'Participants', icon: UserIcon },
      ]
    },
    {
      group: 'ANALYTICS & INTEL', items: [
        { id: 'METRICS', label: 'Visitor Analytics', icon: Globe },
        { id: 'SPONSOR_LEADS', label: 'Sponsor Leads', icon: BarChart2 },
        { id: 'TEAM', label: 'Invited Team Members', icon: Users },
        { id: 'INQUIRIES', label: 'Platform Inquiries', icon: Bell, hasNotify: studyInquiries.length > 0 },
      ]
    },
    {
      group: 'SYSTEM CONTROL', items: [
        { id: 'ANNOUNCEMENTS', label: 'Announcements', icon: Megaphone },
        { id: 'AUDIT_LOGS', label: 'Login Audit Logs', icon: FileText },
        { id: 'SUPPORT', label: 'Help Desk', icon: Bell },
        { id: 'SETTINGS', label: 'System Settings', icon: Settings },
      ]
    },
    {
      group: 'CONTENT WORKFLOW', items: [
        { id: 'WORKFLOW', label: 'Moderation Queue', icon: ShieldCheck },
        { id: 'SUBMIT_CONTENT', label: 'Create Content', icon: Plus },
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
        const apiUrl = API || 'http://localhost:8000';
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
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0f1133] border border-white/10 w-full max-w-xl rounded-[3rem] p-12 shadow-2xl relative overflow-hidden text-left">
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
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Message content..." className="w-full h-40 bg-[#0a0b1a] border border-white/5 rounded-2xl px-6 py-5 text-white font-bold resize-none outline-none focus:border-emerald-500/40 transition-all placeholder:text-slate-800" />
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
      role: creationRole ? creationRole.toUpperCase() : 'PI'
    });

    useEffect(() => {
      if (creationRole) setNewUser(prev => ({ ...prev, role: creationRole.toUpperCase() }));
    }, [creationRole]);

    const [isCreating, setIsCreating] = useState(false);
    const filteredRoles = ROLES.filter(r => ['SUPER_ADMIN', 'ADMIN', 'PI', 'SPONSOR', 'COORDINATOR'].includes(r.id));

    const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsCreating(true);
      try {
        const apiUrl = API || 'http://localhost:8000';
        const res = await authFetch(`${apiUrl}/api/auth/admin/create-user/`, {
          method: 'POST',
          body: JSON.stringify({
            email: newUser.email,
            first_name: newUser.firstName,
            middle_name: newUser.middleName,
            last_name: newUser.lastName,
            role: newUser.role
          })
        });
        if (res.ok) {
          const data = await res.json();
          alert(`✅ INITIALIZATION COMPLETE\n\nGenerated Username: ${data.username}\nCredentials sent to ${newUser.email}`);
          setModals({ ...modals, createUser: false });
          setNewUser({ firstName: '', middleName: '', lastName: '', email: '', role: creationRole ? creationRole.toUpperCase() : 'PI' });
          fetchData();
        } else {
          const err = await res.json();
          alert(`❌ PROTOCOL ERROR: ${err.error || err.detail || 'Unknown failure'}`);
        }
      } catch (err) {
        alert('❌ CRITICAL SYSTEM FAILURE: Authorization stack trace in console.');
        console.error(err);
      } finally {
        setIsCreating(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/60">
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="bg-[#0f1133] border border-white/10 w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Users className="w-64 h-64 text-white" />
          </div>
          <div className="flex justify-between items-start mb-14 relative z-10 text-left">
            <div className="space-y-3 flex flex-col items-start">
              <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-[#7c3aed] shrink-0">
                <UserPlus className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter text-left">Initialize <span className="text-[#7c3aed]">Personnel</span></h2>
              <p className="text-[12px] text-[#555a7a] font-black uppercase tracking-widest text-left">Secure credential provisioning and onboarding module</p>
            </div>
            <button onClick={() => setModals({ ...modals, createUser: false })} className="p-3 hover:bg-white/5 rounded-2xl transition-colors" disabled={isCreating}>
              <X className="w-6 h-6 text-slate-700 hover:text-white" />
            </button>
          </div>
          <form onSubmit={handleCreateUser} className="space-y-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4 text-left w-full">
                <label className="block text-sm font-black text-[#555a7a] uppercase tracking-widest italic text-left">First Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="John" required value={newUser.firstName} onChange={e => setNewUser({ ...newUser, firstName: e.target.value })} className="w-full bg-[#0a0b1a] border border-white/5 rounded-2xl px-6 py-5 text-base text-white font-bold outline-none focus:border-purple-500/40 transition-all font-mono text-left" />
              </div>
              <div className="space-y-4 text-left w-full">
                <label className="block text-sm font-black text-[#555a7a] uppercase tracking-widest italic text-left">Middle Name (Optional)</label>
                <input type="text" placeholder="Quincy" value={newUser.middleName} onChange={e => setNewUser({ ...newUser, middleName: e.target.value })} className="w-full bg-[#0a0b1a] border border-white/5 rounded-2xl px-6 py-5 text-base text-white font-bold outline-none focus:border-purple-500/40 transition-all font-mono text-left" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4 text-left w-full">
                <label className="block text-sm font-black text-[#555a7a] uppercase tracking-widest italic text-left">Last Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Doe" required value={newUser.lastName} onChange={e => setNewUser({ ...newUser, lastName: e.target.value })} className="w-full bg-[#0a0b1a] border border-white/5 rounded-2xl px-6 py-5 text-base text-white font-bold outline-none focus:border-purple-500/40 transition-all font-mono text-left" />
              </div>
              <div className="space-y-4 text-left w-full">
                <label className="block text-sm font-black text-[#555a7a] uppercase tracking-widest italic text-left">Personal Gmail <span className="text-red-500">*</span></label>
                <input type="email" placeholder="john.doe@gmail.com" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full bg-[#0a0b1a] border border-white/5 rounded-2xl px-6 py-5 text-base text-white font-bold outline-none focus:border-purple-500/40 transition-all font-mono text-left" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4 text-left w-full">
                <label className="block text-sm font-black text-[#555a7a] uppercase tracking-widest italic text-left">Access Tier (Role)</label>
                <select className="w-full bg-[#0a0b1a] border border-white/5 rounded-2xl px-6 py-5 text-base text-white font-bold outline-none focus:border-purple-500/40 transition-all font-mono text-left" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                  {filteredRoles.map(r => <option key={r.id} value={r.id} className="bg-[#0a0b1a]">{r.label}</option>)}
                </select>
              </div>
              <div className="flex items-center pt-8">
                <div className="p-6 bg-purple-500/5 rounded-[2rem] border border-purple-500/10 flex items-center gap-4 w-full">
                  <ShieldAlert className="w-8 h-8 text-purple-500 opacity-50" />
                  <div>
                    <p className="text-[12px] text-white font-black uppercase tracking-widest leading-relaxed">System Rule:</p>
                    <p className="text-[12px] text-[#555a7a] font-medium leading-relaxed">Username & Temp Password will be auto-generated and encrypted.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-10 flex gap-4">
              <button type="button" onClick={() => setModals({ ...modals, createUser: false })} className="flex-1 py-5 bg-white/5 border border-white/5 text-[#555a7a] rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all" disabled={isCreating}>
                Abort
              </button>
              <button type="submit" disabled={isCreating} className="flex-[2] py-5 bg-[#7c3aed] text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] italic shadow-xl shadow-purple-900/40 hover:scale-[1.02] transition-all disabled:opacity-50">
                {isCreating ? 'Synchronizing...' : 'Authorize & Dispatch Credentials'}
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
    <div className="h-screen bg-[#07091e] font-sans text-slate-300 flex overflow-hidden lg:static">
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
              <img src="/logo.jpg" alt="Logo" className="h-15 w-auto object-contain" />
            </div>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden absolute top-6 right-6 p-2 text-slate-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-10 py-4 custom-scrollbar">
          {sidebarItems.map((group, i) => (
            <div key={i} className="space-y-6">
              <p className="px-4 text-[10px] xl:text-[11px] font-black text-[#555a7a] uppercase tracking-[0.4em] font-mono opacity-50">{group.group}</p>
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
              className="w-full group flex items-center justify-start gap-3 px-6 py-4 bg-red-500/5 hover:bg-red-500 border border-red-500/10 hover:border-red-500 rounded-2xl transition-all duration-500 shadow-lg hover:shadow-red-500/20"
            >
              <LogOut className="w-5 h-5 text-red-500 group-hover:text-white transition-colors shrink-0" />
              <span className="text-[12px] sm:text-sm font-black uppercase tracking-[0.1em] text-red-500 group-hover:text-white transition-colors text-left leading-tight">Sign Out Interface</span>
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
                <span className="text-[11px] font-black text-[#7c3aed] uppercase tracking-[0.2em] italic">Master Access</span>
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
                      <p className="text-[12px] font-black text-white uppercase italic tracking-widest">Global Pings</p>
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
              availablePIs={users.filter(u => u.role === 'PI')}
              availableCoordinators={users.filter(u => u.role === 'COORDINATOR')}
              availableSponsors={users.filter(u => u.role === 'SPONSOR')}
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
          {currentPage === 'PIS' && (
            <PIsManagement
              allUsers={users}
              allStudies={studies}
              onRefresh={fetchData}
              onViewUser={viewDetails}
              onRegister={() => {
                setCreationRole('PI');
                setModals({ ...modals, createUser: true });
              }}
            />
          )}
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
          {currentPage === 'TEAM' && <TeamPage users={users} viewDetails={viewDetails} />}
          {currentPage === 'INQUIRIES' && (
            <InquiriesPage
              studyInquiries={studyInquiries}
              studies={studies}
              authFetch={authFetch}
              API={API}
              fetchData={fetchData}
              setSelectedStudy={setSelectedStudy}
              handlePageChange={handlePageChange}
            />
          )}

          {!['DASHBOARD', 'ALL_USERS', 'STUDIES', 'SPONSORS', 'LAUNCH_STUDY', 'SCREENER_BUILDER', 'PIS', 'COORDINATORS', 'PARTICIPANTS', 'LIVE_USERS', 'METRICS', 'AUDIT_LOGS', 'SETTINGS', 'ANNOUNCEMENTS', 'SPONSOR_LEADS', 'TEAM', 'INQUIRIES', 'TEAM_APPROVALS', 'CAREERS', 'WORKFLOW', 'SUBMIT_CONTENT', 'ACTIVITY_LOG'].includes(currentPage) && (
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
                  <div className="w-24 h-24 rounded-3xl bg-cyan-600 border-4 border-[#0d0e2b] flex items-center justify-center text-3xl font-black text-white italic shadow-2xl">
                    {(selectedUser.name?.[0] || 'U').toUpperCase()}
                  </div>
                  <div className="pb-2">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">{formatName(selectedUser.name)}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <RoleBadge role={selectedUser.role} />
                      <span className={`px-2 py-0.5 rounded-full text-[12px] font-black uppercase tracking-widest ${selectedUser.status === 'Active' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                        {selectedUser.status}
                      </span>
                      {selectedUser.must_reset && <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 rounded-full text-[12px] font-black uppercase tracking-widest">Reset Pending</span>}
                      {selectedUser.profile_incomplete && <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded-full text-[12px] font-black uppercase tracking-widest">Profile Draft</span>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-[12px] font-black text-[#555a7a] uppercase tracking-widest flex items-center gap-2 italic"><Mail className="w-3 h-3" /> Email Address</label>
                      <p className="text-base font-bold text-white">{selectedUser.email}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[12px] font-black text-[#555a7a] uppercase tracking-widest flex items-center gap-2 italic"><Phone className="w-3 h-3" /> Mobile Number</label>
                      <p className="text-base font-bold text-white">{selectedUser.mobile_number || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[12px] font-black text-[#555a7a] uppercase tracking-widest flex items-center gap-2 italic"><Globe className="w-3 h-3" /> Place of Origin</label>
                      <p className="text-base font-bold text-white">{selectedUser.place_of_origin || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-[12px] font-black text-[#555a7a] uppercase tracking-widest flex items-center gap-2 italic"><Calendar className="w-3 h-3" /> Account Created</label>
                      <p className="text-base font-bold text-white">{selectedUser.created || 'Jan 15, 2026'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[12px] font-black text-[#555a7a] uppercase tracking-widest flex items-center gap-2 italic"><MapPin className="w-3 h-3" /> Location / Address</label>
                      <p className="text-base font-bold text-white italic leading-relaxed">
                        {selectedUser.full_address ? `${selectedUser.full_address}, ${selectedUser.city}, ${selectedUser.state} ${selectedUser.zip_code || ''}, ${selectedUser.country || ''}` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {(selectedUser.role === 'PI' || selectedUser.role === 'COORDINATOR') && (
                  <div className="mt-10 p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <ShieldCheck className="w-24 h-24 text-emerald-500" />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                      <h4 className="text-sm font-black text-white italic uppercase tracking-widest">Compliance Documents</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                      {[
                        { id: 'medical_licence', label: 'Medical Licence', path: selectedUser.medical_licence },
                        { id: 'insurance_certificate', label: 'Insurance Cert', path: selectedUser.insurance_certificate },
                        { id: 'cv_document', label: 'Professional CV', path: selectedUser.cv_document }
                      ].map((doc) => (
                        <div key={doc.id} className="p-4 bg-black/20 border border-white/5 rounded-2xl flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <FileText className="w-5 h-5 text-emerald-400" />
                            {doc.path ? (
                              <a href={`${API}/media/${doc.path}`} target="_blank" rel="noreferrer" className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg hover:scale-110 transition-transform" title="View Document">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <div title="Documentation Missing"><AlertTriangle className="w-4 h-4 text-cyan-500" /></div>
                            )}
                          </div>
                          <p className="text-[12px] font-black text-white uppercase tracking-widest leading-none truncate">{doc.label}</p>
                          {!doc.path && <p className="text-[12px] font-bold text-cyan-500/60 uppercase tracking-tighter">Not Uploaded</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-12 pt-8 border-t border-white/5 flex gap-4">
                  <button onClick={() => setIsUserDetailOpen(false)} className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[12px] font-black text-white uppercase tracking-[0.2em] transition-all">Close Entry</button>
                  <button onClick={() => handleStatusToggle(selectedUser)} className="px-8 py-3 bg-cyan-500 text-white rounded-xl text-[12px] font-black uppercase tracking-[0.2em] shadow-xl shadow-cyan-500/20 hover:-translate-y-0.5 transition-all">
                    {selectedUser.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal ── */}
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
                  onClick={() => {
                    const apiUrl = API || 'http://localhost:8000';
                    authFetch(`${apiUrl}/api/users/${selectedUser.id}/`, { method: 'DELETE' }).then(() => {
                      fetchData();
                      setIsDeleteConfirmOpen(false);
                    });
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
