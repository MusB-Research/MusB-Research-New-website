import React, { useState, useEffect, useRef } from 'react';
import {
    Layout, Users, Activity, Shield,
    Settings, LogOut, ChevronRight,
    Plus, Search, Bell, Globe,
    ShieldAlert, UserPlus, Rocket, ClipboardList,
    ShieldCheck, FileText
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authFetch, clearToken, getRole, performLogout, API } from '../utils/auth';
import { getMediaUrl } from '../utils/media';
import { apiFetch } from '../api';
import DashboardModule from '../components/admin/DashboardModule';
import TeamModule from '../components/admin/TeamModule';
import AuditLogs from '../components/admin/AuditLogs';
import QuestionnaireBuilder from '../components/coordinator/QuestionnaireBuilder';
import LaunchStudyForm from '../components/coordinator/LaunchStudyForm';
import ApprovalModule from '../components/admin/ApprovalModule';
import SubmitContentForms from '../components/coordinator/SubmitContentForms';
import WorkflowModerationPanel from '../components/admin/WorkflowModerationPanel';
import PIMessagesModule from '../components/pi/PIMessagesModule';
import { MessageSquare, Mail } from 'lucide-react';
import StudyInquiriesModule from '../components/admin/StudyInquiriesModule';
import LogoutConfirmationModal from '../components/LogoutConfirmationModal';
import { usePolling } from '@/hooks/usePolling';




type AdminModule = 'DASHBOARD' | 'STUDIES' | 'TEAM' | 'SCREENER_BUILDER' | 'AUDIT_LOGS' | 'SETTINGS' | 'WEBSITE' | 'COMPLIANCE' | 'APPROVALS' | 'SUBMIT_CONTENT' | 'WORKFLOW' | 'MESSAGES' | 'INQUIRIES';




export default function AdminDashboard() {
    const navigate = useNavigate();
    const location = useLocation();

    const [activeModule, setActiveModule] = useState<AdminModule>(() => {
        const route = location.pathname.split('/').pop();
        if (route === 'studies') return 'STUDIES';
        if (route === 'team') return 'TEAM';
        if (route === 'screeners') return 'SCREENER_BUILDER';
        if (route === 'audit') return 'AUDIT_LOGS';
        if (route === 'settings') return 'SETTINGS';
        if (route === 'compliance') return 'COMPLIANCE';
        if (route === 'approvals') return 'APPROVALS';
        if (route === 'content') return 'SUBMIT_CONTENT';
        if (route === 'workflow') return 'WORKFLOW';
        if (route === 'messages') return 'MESSAGES';
        if (route === 'inquiries') return 'INQUIRIES';
        return 'DASHBOARD';
    });

    // Sync state with URL for back button support
    useEffect(() => {
        const route = location.pathname.split('/').pop();
        if (route === 'studies') setActiveModule('STUDIES');
        else if (route === 'team') setActiveModule('TEAM');
        else if (route === 'screeners') setActiveModule('SCREENER_BUILDER');
        else if (route === 'audit') setActiveModule('AUDIT_LOGS');
        else if (route === 'settings') setActiveModule('SETTINGS');
        else if (route === 'compliance') setActiveModule('COMPLIANCE');
        else if (route === 'approvals') setActiveModule('APPROVALS');
        else if (route === 'content') setActiveModule('SUBMIT_CONTENT');
        else if (route === 'workflow') setActiveModule('WORKFLOW');
        else if (route === 'messages') setActiveModule('MESSAGES');
        else if (route === 'inquiries') setActiveModule('INQUIRIES');
        else if (location.pathname.endsWith('/admin') || !route || route === 'admin') setActiveModule('DASHBOARD');
    }, [location.pathname]);

    const handleModuleChange = (mod: AdminModule) => {
        const slugs: Record<string, string> = {
            'DASHBOARD': '',
            'STUDIES': 'studies',
            'TEAM': 'team',
            'SCREENER_BUILDER': 'screeners',
            'AUDIT_LOGS': 'audit',
            'SETTINGS': 'settings',
            'COMPLIANCE': 'compliance',
            'APPROVALS': 'approvals',
            'SUBMIT_CONTENT': 'content',
            'WORKFLOW': 'workflow',
            'MESSAGES': 'messages',
            'INQUIRIES': 'inquiries'
        };
        const slug = slugs[mod];
        setActiveModule(mod);
        navigate(`/dashboard/admin${slug ? '/' + slug : ''}`);
    };

    const [studies, setStudies] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [studyInquiries, setStudyInquiries] = useState<any[]>([]);
    const [participantLeads, setParticipantLeads] = useState<any[]>([]);
    const [facilityInquiries, setFacilityInquiries] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedStudy, setSelectedStudy] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const apiUrl = API || 'http://localhost:8003';

    const fetchStudies = async (skipCache = false) => {
        try {
            const data = await apiFetch<any[]>('/api/studies/', { skipCache });
            setStudies(data || []);
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    const fetchInquiries = async (skipCache = false) => {
        try {
            const [studyData, leadData, facilityData] = await Promise.all([
                apiFetch<any[]>('/api/study-inquiries/', { skipCache }),
                apiFetch<any[]>('/api/leads/', { skipCache }),
                apiFetch<any[]>('/api/facilities-inquiry/', { skipCache })
            ]);
            setStudyInquiries(studyData || []);
            setParticipantLeads(leadData || []);
            setFacilityInquiries(facilityData || []);
        } catch (error) {
            console.error('Inquiries fetch error:', error);
        }
    };

    const fetchDashboardMetrics = async (skipCache = false) => {
        try {
            const [participantsData, staffData, auditData] = await Promise.all([
                apiFetch<any[]>('/api/participants/?limit=50', { skipCache }),
                apiFetch<any[]>('/api/staff/?limit=50', { skipCache }),
                apiFetch<any[]>('/api/audit-logs/?limit=50', { skipCache })
            ]);

            setParticipants(participantsData || []);
            setStaff(staffData || []);
            setAuditLogs(auditData || []);
        } catch (error) {
            console.error('Metrics fetch error:', error);
        }
    };

    const profileRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };

        const handleScroll = () => {
            if (isProfileOpen) setIsProfileOpen(false);
            if (isNotifOpen) setIsNotifOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isProfileOpen, isNotifOpen]);



    const fetchAllData = async (skipCache = false) => {
        await Promise.all([
            fetchStudies(skipCache),
            fetchInquiries(skipCache),
            fetchDashboardMetrics(skipCache)
        ]);
    };

    useEffect(() => {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        const role = getRole();

        const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'COORDINATOR', 'PI'];
        if (!userStr || !allowedRoles.includes(role)) {
            console.warn("Unauthorized access to Staff Dashboard. Redirecting...");
            navigate('/signin');
            return;
        }

        if (userStr) setUser(JSON.parse(userStr));
        fetchAllData(false);
    }, [navigate]);

    // Removed background polling per user request to reduce redundant network requests.
    // Data is refreshed on mount and upon specific mutations.
    // usePolling(() => fetchAllData(true), 10000);

    const handleCreateStudy = async (formData: any) => {
        try {
            const method = selectedStudy ? 'PATCH' : 'POST';
            const url = selectedStudy
                ? `${apiUrl}/api/studies/${selectedStudy.protocol_id || selectedStudy.id}/`
                : `${apiUrl}/api/studies/`;

            const res = await authFetch(url, {
                method: method,
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setShowCreateModal(false);
                setSelectedStudy(null);
                fetchStudies();
            } else {
                const err = await res.json();
                console.error("Study Save Failed:", err);
                alert(`Operation failed: ${JSON.stringify(err)}`);
            }
        } catch (e) {
            alert("Operation failed due to network error");
        }
    };

    const navItems = [
        { id: 'DASHBOARD', label: 'Overview', icon: Layout, roles: ['super_admin', 'admin', 'sponsor', 'coordinator', 'pi'] },
        { id: 'TEAM', label: 'Medical Team', icon: Users, roles: ['super_admin', 'admin', 'coordinator', 'pi'] },
        { id: 'MESSAGES', label: 'Messages', icon: MessageSquare, roles: ['super_admin', 'admin', 'coordinator', 'pi'] },

        { id: 'APPROVALS', label: 'Approvals', icon: ShieldCheck, roles: ['super_admin'] },
        { id: 'STUDIES', label: 'Study List', icon: ClipboardList, roles: ['super_admin', 'admin', 'sponsor', 'coordinator', 'pi'] },
        { id: 'SCREENER_BUILDER', label: 'Screeners', icon: Rocket, roles: ['super_admin', 'admin'] },
        { id: 'AUDIT_LOGS', label: 'Audit Logs', icon: ShieldAlert, roles: ['super_admin', 'admin'] },
        { id: 'COMPLIANCE', label: 'Compliance Docs', icon: ShieldCheck, roles: ['coordinator', 'pi'] },
        { id: 'SUBMIT_CONTENT', label: 'Submit Content', icon: Plus, roles: ['super_admin', 'admin', 'coordinator', 'pi'] },
        { id: 'WORKFLOW', label: 'Moderation Queue', icon: ShieldCheck, roles: ['super_admin', 'admin'] },
        { id: 'INQUIRIES', label: 'Study Inquiries', icon: Mail, roles: ['super_admin', 'admin', 'coordinator', 'pi'] },
        { id: 'WEBSITE', label: 'View Public Site', icon: Globe, roles: ['*'] },


    ].filter(item => {
        if (!user) return false;
        if (item.roles.includes('*')) return true;
        return item.roles.includes(user.role?.toLowerCase());
    });

    const handleSignOut = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmSignOut = async () => {
        await performLogout();
    };

    return (
        <div className="min-h-screen bg-[#060811] text-white flex font-sans selection:bg-pink-500/30">
            {/* Sidebar Navigation */}
            <aside className={`fixed left-0 top-0 bottom-0 bg-[#0B101B]/40 backdrop-blur-3xl border-r border-white/5 p-4 lg:p-5 z-[70] overflow-y-auto transition-all duration-500 custom-scrollbar ${isSidebarOpen ? 'w-60' : 'w-24'}`}>
                <div className="h-20 lg:h-24 flex items-center justify-center mb-6">
                    <Link to="/" target="_blank" rel="noopener noreferrer" className="group transition-all">
                        <div className="bg-white p-2 rounded-2xl group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            <img src="/logo.jpg" alt="Logo" className="h-10 lg:h-12 w-auto object-contain rounded-xl" width="474" height="164" />
                        </div>
                    </Link>
                </div>
                <nav className="space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.id === 'WEBSITE') window.open('/', '_blank');
                                else handleModuleChange(item.id as AdminModule);
                            }}
                            className={`w-full flex items-center gap-4 px-3 py-3 rounded-2xl transition-all group ${activeModule === item.id
                                ? 'bg-[#0a1525] text-cyan-400 border border-cyan-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${activeModule === item.id ? 'text-cyan-400' : 'text-slate-500'}`} />
                            {isSidebarOpen && <span className="text-sm font-bold">{item.label}</span>}
                            {activeModule === item.id && isSidebarOpen && (
                                <motion.div layoutId="activeInd" className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,1)]" />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="absolute bottom-10 left-6 right-6 space-y-2">
                    <button onClick={handleSignOut} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all group">
                        <LogOut className="w-5 h-5" />
                        {isSidebarOpen && <span className="text-sm font-bold">Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Top Bar Header */}
            <header className={`fixed top-0 right-0 h-[64px] lg:h-[80px] z-[60] bg-[#0B101B]/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-4 lg:px-6 transition-all duration-500 ${isSidebarOpen ? 'left-60' : 'left-24'}`}>
                <div className="flex flex-col shrink-0">
                    <h1 className="text-lg lg:text-xl font-black text-white tracking-tighter uppercase italic leading-none">Admin Panel</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-400 font-mono italic">Main Control</span>
                    </div>
                </div>

                <div className="relative group hidden xl:block mx-4">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="SEARCH DATA..."
                        className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-2.5 w-[250px] xl:w-[380px] text-[11px] font-bold text-white outline-none focus:border-cyan-500/30 transition-all uppercase tracking-widest placeholder:text-slate-800 shadow-2xl shadow-black/20"
                    />
                </div>

                <div className="flex items-center gap-3 lg:gap-6">
                    <div className="flex flex-col items-end text-right border-r border-white/5 pr-2 md:pr-4">
                        <span className="text-[14px] md:text-lg font-black text-cyan-400 font-mono tracking-tighter tabular-nums leading-none">
                            {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                            {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
                        </span>
                    </div>

                    <div className="relative" ref={notifRef}>
                        <NotificationBell 
                            unreadCount={0} 
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                        />
                    </div>

                        <div 
                            className="flex items-center gap-2 lg:gap-4 pl-3 border-l border-white/5 relative" 
                            ref={profileRef}
                        >
                            <div className="text-right hidden sm:flex flex-col max-w-[80px] md:max-w-[120px]">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest truncate w-full">{user?.role?.replace('_', ' ') || 'Admin Control'}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 truncate w-full">{user?.email}</p>
                            </div>
                            <button 
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 p-0.5 shadow-xl hover:rotate-6 transition-transform cursor-pointer shrink-0"
                            >
                                <div className="w-full h-full bg-[#0B101B] rounded-[0.6rem] flex items-center justify-center font-black text-white uppercase italic text-[10px] lg:text-[11px]">
                                    {user?.first_name?.[0] || 'A'}{user?.last_name?.[0] || 'D'}
                                </div>
                            </button>

                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-4 w-56 bg-[#0f1133] border border-white/10 rounded-3xl shadow-2xl p-2 z-[100] overflow-hidden"
                                    >
                                        <div className="p-5 border-b border-white/5 mb-2">
                                            <p className="text-sm font-black text-white uppercase italic truncate tracking-tight">
                                                {user?.full_name || 'Admin'}
                                            </p>
                                            <p className="text-[11px] text-cyan-400 font-black uppercase tracking-widest mt-2 px-2 py-0.5 bg-cyan-400/10 border border-cyan-400/20 rounded-lg inline-block">
                                                {user?.role?.replace('_', ' ') || 'Admin'}
                                            </p>
                                            <p className="text-[11px] text-slate-500 font-bold lowercase tracking-normal mt-2.5 truncate">
                                                {user?.email}
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-100 hover:text-white hover:bg-red-500 transition-all text-sm font-black uppercase tracking-widest"
                                        >
                                            <LogOut className="w-5 h-5 text-red-400 group-hover:text-white" /> 
                                            <span className="text-red-400 group-hover:text-white">Sign Out Interface</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                </div>
            </header>

            {/* Main Workspace Area */}
            <main className={`flex-1 pt-32 pb-24 px-10 transition-all duration-500 ${isSidebarOpen ? 'ml-60' : 'ml-24'}`}>
                {activeModule === 'DASHBOARD' && (
                    <DashboardModule
                        key="DASHBOARD"
                        studyCount={studies.length}
                        participantCount={participants.length}
                        staffCount={staff.length}
                        auditLogs={auditLogs}
                        onNavigate={(mod) => handleModuleChange(mod as AdminModule)}
                        onActivitiesClick={() => handleModuleChange('AUDIT_LOGS')}
                    />
                )}

                {activeModule === 'TEAM' && (
                    <TeamModule />
                )}

                {activeModule === 'SCREENER_BUILDER' && (
                    <QuestionnaireBuilder />
                )}



                {activeModule === 'AUDIT_LOGS' && (
                    <AuditLogs />
                )}

                {activeModule === 'COMPLIANCE' && (
                    <ComplianceModule />
                )}

                {activeModule === 'APPROVALS' && (
                    <ApprovalModule />
                )}

                {activeModule === 'SUBMIT_CONTENT' && (
                    <SubmitContentForms userRole={user?.role} />
                )}

                {activeModule === 'WORKFLOW' && (
                    <WorkflowModerationPanel />
                )}

                {activeModule === 'MESSAGES' && (
                    <PIMessagesModule />
                )}

                {activeModule === 'INQUIRIES' && (
                    <StudyInquiriesModule 
                        studyInquiries={studyInquiries}
                        participantLeads={participantLeads}
                        facilityInquiries={facilityInquiries}
                        studies={studies}
                        authFetch={authFetch}
                        API={apiUrl}
                        fetchData={() => {
                            fetchInquiries();
                            fetchStudies();
                        }}
                        handlePageChange={(page) => handleModuleChange(page as any)}
                        userRole={user?.role?.toUpperCase()}
                    />
                )}




                {activeModule === 'STUDIES' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tighter uppercase italic">Study Directory</h1>
                                <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-[12px] italic">Managing {studies.length} live research protocols</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-10 py-5 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 hover:scale-105 transition-all shadow-xl"
                            >
                                <Plus className="w-5 h-5" /> Initialize New Protocol
                            </button>
                        </div>

                        {/* Summary of listed studies table here (already present in earlier versions) */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-3xl shadow-2xl">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/[0.03] border-b border-white/5">
                                        <th className="px-8 py-5 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">Study ID</th>
                                        <th className="px-8 py-5 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">Study Title & Phase</th>
                                        <th className="px-8 py-5 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">Medical Sponsor</th>
                                        <th className="px-8 py-5 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-8 py-5 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] text-right italic">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {studies.map((study) => (
                                        <tr 
                                            key={study.id} 
                                            className="hover:bg-white/[0.02] transition-colors group cursor-pointer" 
                                            onClick={async () => {
                                                try {
                                                    const res = await authFetch(`${API}/api/studies/${study.protocol_id}/`);
                                                    if (res.ok) {
                                                        const fullStudy = await res.json();
                                                        setSelectedStudy(fullStudy);
                                                    } else {
                                                        setSelectedStudy(study);
                                                    }
                                                } catch (e) {
                                                    setSelectedStudy(study);
                                                }
                                                setShowCreateModal(true);
                                            }}
                                        >
                                            <td className="px-8 py-5 text-sm font-black text-cyan-500 italic uppercase">{study.protocol_id}</td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-black text-white uppercase tracking-widest group-hover:text-cyan-400 transition-colors">{study.title}</p>
                                                <p className="text-[12px] text-slate-500 font-bold mt-1 uppercase tracking-widest">{study.study_type}</p>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-widest">{study.sponsor_name || 'MUSB Internal'}</td>
                                            <td className="px-8 py-5">
                                                <span className={`px-4 py-2 rounded-xl text-[12px] font-black uppercase tracking-widest border ${study.status === 'ACTIVE' || study.status === 'RECRUITING' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white/5 text-slate-500 border-white/5'
                                                    }`}>
                                                    {study.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button className="p-3 bg-white/5 border border-white/10 rounded-xl hover:text-white hover:bg-white/10 transition-all">
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Launch Study Modal Component */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setShowCreateModal(false); setSelectedStudy(null); }}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                            className="relative w-full max-w-[90vw] h-[90vh] bg-[#0B101B] border border-white/10 rounded-[3rem] p-12 overflow-y-auto shadow-2xl custom-scrollbar"
                        >
                            <LaunchStudyForm
                                onClose={() => {
                                    setShowCreateModal(false);
                                    setSelectedStudy(null);
                                    fetchStudies();
                                }}
                                initialData={selectedStudy}
                                onSave={handleCreateStudy}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <LogoutConfirmationModal 
                isOpen={isLogoutModalOpen} 
                onClose={() => setIsLogoutModalOpen(false)} 
                onConfirm={confirmSignOut} 
            />
        </div>
    );
}

function ComplianceModule() {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <div>
                <h1 className="text-2xl lg:text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Compliance <span className="text-cyan-400">& Credentials</span></h1>
                                <p className="text-slate-500 font-bold mt-3 uppercase tracking-widest text-[12px] md:text-sm italic text-pretty">Secure documentation for clinical trial coordination</p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/5 blur-[100px] rounded-full group-hover:bg-cyan-500/10 transition-colors duration-1000" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    {[
                        { id: 'medical_licence', label: 'Medical Licence', path: user.medical_licence, desc: 'Official authorization for medical trial support' },
                        { id: 'insurance_certificate', label: 'Liability Insurance', path: user.insurance_certificate, desc: 'Professional coverage for clinical trial oversight' },
                        { id: 'cv_document', label: 'Coordinator CV', path: user.cv_document, desc: 'Professional experience and certification history' }
                    ].map((doc, i) => (
                        <div key={i} className="bg-black/20 border border-white/5 rounded-[2.5rem] p-8 space-y-6 hover:border-cyan-500/30 transition-all flex flex-col">
                            <div className="flex justify-between items-center">
                                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                    <FileText className="w-6 h-6" />
                                </div>
                                {doc.path ? (
                                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,1)]" />
                                        <span className="text-[12px] font-black text-emerald-400 uppercase tracking-widest">Verified</span>
                                    </div>
                                ) : (
                                    <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                        <span className="text-[12px] font-black text-amber-500 uppercase tracking-widest">Pending</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white italic uppercase tracking-widest">{doc.label}</h4>
                                <p className="text-[12px] text-slate-500 font-bold mt-2 leading-relaxed italic">{doc.desc}</p>
                            </div>
                            <div className="mt-4 pt-6 border-t border-white/5">
                                {doc.path ? (
                                    <a
                                        href={getMediaUrl(doc.path)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full py-4 bg-white/5 hover:bg-white text-white hover:text-slate-950 border border-white/10 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group/link"
                                    >
                                        <Globe className="w-4 h-4 group-hover/link:rotate-12 transition-transform" /> VIEW DOCUMENT
                                    </a>
                                ) : (
                                    <button className="w-full py-4 bg-amber-500/5 text-amber-500 border border-amber-500/20 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] opacity-50 cursor-not-allowed">
                                        UPLOAD REQUIRED
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 p-8 bg-cyan-500/10 border border-cyan-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-[12px] font-black text-white uppercase italic tracking-widest">System Synchronization</p>
                            <p className="text-[12px] text-cyan-300/60 font-black uppercase tracking-widest mt-1">Research Terminal Status: Encrypted & Verified</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
                        <span className="text-[12px] font-black text-emerald-400 uppercase tracking-widest line-clamp-1 italic">Identity Authenticated</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}


