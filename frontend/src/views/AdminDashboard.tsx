import React, { useState, useEffect } from 'react';
import {
    Layout, Users, Activity, Shield,
    Settings, LogOut, ChevronRight,
    Plus, Search, Bell, Globe,
    ShieldAlert, UserPlus, Rocket, ClipboardList,
    ShieldCheck, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { authFetch, clearToken, getRole, performLogout , API } from '../utils/auth';
import DashboardModule from '../components/admin/DashboardModule';
import TeamModule from '../components/admin/TeamModule';
import AuditLogs from '../components/admin/AuditLogs';
import ScreenerBuilder from '../components/admin/ScreenerBuilder';
import LaunchStudyForm from '../components/admin/LaunchStudyForm';
import ApprovalModule from '../components/admin/ApprovalModule';
import SubmitContentForms from '../components/admin/SubmitContentForms';
import WorkflowModerationPanel from '../components/admin/WorkflowModerationPanel';
import PIMessagesModule from '../components/pi/PIMessagesModule';
import { MessageSquare } from 'lucide-react';




type AdminModule = 'DASHBOARD' | 'STUDIES' | 'TEAM' | 'SCREENER_BUILDER' | 'AUDIT_LOGS' | 'SETTINGS' | 'WEBSITE' | 'COMPLIANCE' | 'APPROVALS' | 'SUBMIT_CONTENT' | 'WORKFLOW' | 'MESSAGES';




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
            'MESSAGES': 'messages'
        };
        const slug = slugs[mod];
        setActiveModule(mod);
        navigate(`/dashboard/admin${slug ? '/' + slug : ''}`);
    };

    const [studies, setStudies] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedStudy, setSelectedStudy] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [user, setUser] = useState<any>(null);

    const apiUrl = API || 'http://localhost:8000';

    const fetchStudies = async () => {
        try {
            const res = await authFetch(`${apiUrl}/api/studies/`);
            if (res.ok) {
                const data = await res.json();
                setStudies(data);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
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
        fetchStudies();
    }, [navigate]);

    const handleCreateStudy = (newStudy: any) => {
        setStudies([...studies, newStudy]);
        setShowCreateModal(false);
    };

    const navItems = [
        { id: 'DASHBOARD', label: 'Overview', icon: Layout, roles: ['super_admin', 'admin', 'sponsor', 'coordinator', 'pi'] },
        { id: 'TEAM', label: 'Medical Team', icon: Users, roles: ['super_admin', 'admin', 'coordinator', 'pi'] },
        { id: 'MESSAGES', label: 'PI Messaging', icon: MessageSquare, roles: ['super_admin', 'admin', 'coordinator', 'pi'] },

        { id: 'APPROVALS', label: 'Review Queue', icon: ShieldCheck, roles: ['super_admin'] },
        { id: 'STUDIES', label: 'Protocols', icon: ClipboardList, roles: ['super_admin', 'admin', 'sponsor', 'coordinator', 'pi'] },
        { id: 'SCREENER_BUILDER', label: 'Screeners', icon: Rocket, roles: ['super_admin', 'admin'] },
        { id: 'AUDIT_LOGS', label: 'Audit Trail', icon: ShieldAlert, roles: ['super_admin', 'admin'] },
        { id: 'COMPLIANCE', label: 'Compliance Docs', icon: ShieldCheck, roles: ['coordinator', 'pi'] },
        { id: 'SUBMIT_CONTENT', label: 'Submit Content', icon: Plus, roles: ['super_admin', 'admin', 'coordinator', 'pi'] },
        { id: 'WORKFLOW', label: 'Moderation Queue', icon: ShieldCheck, roles: ['super_admin', 'admin'] },
        { id: 'WEBSITE', label: 'View Public Site', icon: Globe, roles: ['*'] },


    ].filter(item => {
        if (!user) return false;
        if (item.roles.includes('*')) return true;
        return item.roles.includes(user.role?.toLowerCase());
    });

    const confirmSignOut = async () => {
        await performLogout();
    };

    return (
        <div className="min-h-screen bg-[#060811] text-white flex font-sans selection:bg-pink-500/30">
            {/* Sidebar Navigation */}
            <aside className={`fixed left-0 top-28 bottom-0 bg-[#0B101B]/40 backdrop-blur-3xl border-r border-white/5 p-6 z-40 overflow-y-auto transition-all duration-500 custom-scrollbar ${isSidebarOpen ? 'w-80' : 'w-24'}`}>
                <nav className="space-y-1.5">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.id === 'WEBSITE') window.open('/', '_blank');
                                else handleModuleChange(item.id as AdminModule);
                            }}
                            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${activeModule === item.id
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                                : 'text-slate-500 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <div className="w-10 flex items-center justify-center flex-shrink-0">
                                <item.icon className={`w-4 h-4 ${activeModule === item.id ? 'text-cyan-400' : 'text-slate-600 group-hover:text-cyan-400'}`} />
                            </div>
                            {isSidebarOpen && <span className="text-[13px] font-black uppercase tracking-[0.1em]">{item.label}</span>}
                            {activeModule === item.id && isSidebarOpen && (
                                <motion.div layoutId="activeInd" className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,1)]" />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="absolute bottom-10 left-6 right-6 space-y-2">
                    <button onClick={confirmSignOut} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all group">
                        <div className="w-10 flex items-center justify-center flex-shrink-0">
                            <LogOut className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        </div>
                        {isSidebarOpen && <span className="text-[13px] font-black uppercase tracking-widest italic">Terminate Session</span>}
                    </button>
                </div>
            </aside>

            {/* Top Bar Header */}
            <header className="fixed top-0 left-0 right-0 h-28 z-50 bg-[#0B101B]/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-10">
                <div className="flex items-center gap-12">
                    <div className="flex items-center gap-5 cursor-pointer" onClick={() => window.open('/', '_blank')}>
                        <div className="h-12 px-6 rounded-full bg-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 group overflow-hidden">
                            <img src="/logo.jpg" alt="MusB Research" className="h-7 w-auto object-contain" />
                        </div>
                        <div className="h-8 w-px bg-white/10 hidden md:block" />
                        <span className="text-[13px] font-black uppercase tracking-[0.4em] text-cyan-400 hidden md:block">Research Terminal</span>
                    </div>


                    <div className="relative group hidden lg:block">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="SEARCH SYSTEM DATA..."
                            className="bg-white/5 border border-white/10 rounded-2xl pl-16 pr-8 py-4 w-96 text-[12px] font-bold text-white outline-none focus:border-cyan-500/30 transition-all uppercase tracking-widest placeholder:text-slate-800"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <button className="relative p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all group">
                        <Bell className="w-4 h-4 text-slate-500 group-hover:text-white" />
                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,1)]" />
                    </button>

                    <div className="flex items-center gap-6 pl-4 border-l border-white/5">
                        <div className="text-right hidden sm:block">
                            <p className="text-[12px] font-black text-white uppercase tracking-widest">{user?.role?.replace('_', ' ') || 'Admin Control'}</p>
                            <div className="flex items-center justify-end gap-2 mt-0.5 pointer-events-none">
                                <span className={`text-[8px] font-black uppercase tracking-widest italic px-2 py-0.5 rounded border ${user?.affiliation === 'onsite' ? 'text-indigo-400 border-indigo-400/30' : 'text-cyan-400 border-cyan-400/30'
                                    }`}>
                                    {user?.affiliation || 'MusB'}
                                </span>
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest italic">Active</p>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 p-0.5 shadow-xl hover:rotate-6 transition-transform cursor-pointer">
                            <div className="w-full h-full bg-[#0B101B] rounded-[0.9rem] flex items-center justify-center font-black text-white uppercase italic text-xs">
                                {user?.first_name?.[0] || 'A'}{user?.last_name?.[0] || 'D'}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Workspace Area */}
            <main className={`flex-1 pt-36 pb-24 px-10 transition-all duration-500 ${isSidebarOpen ? 'ml-80' : 'ml-24'}`}>
                {activeModule === 'DASHBOARD' && (
                    <DashboardModule key="DASHBOARD" studyCount={studies.length} />
                )}

                {activeModule === 'TEAM' && (
                    <TeamModule />
                )}

                {activeModule === 'SCREENER_BUILDER' && (
                    <ScreenerBuilder />
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




                {activeModule === 'STUDIES' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Study Directory</h1>
                                <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-xs italic">Managing {studies.length} live research protocols</p>
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
                                        <th className="px-8 py-5 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">Protocol ID</th>
                                        <th className="px-8 py-5 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">Study Title & Phase</th>
                                        <th className="px-8 py-5 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">Medical Sponsor</th>
                                        <th className="px-8 py-5 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-8 py-5 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] text-right italic">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {studies.map((study) => (
                                        <tr key={study.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => { setSelectedStudy(study); setShowCreateModal(true); }}>
                                            <td className="px-8 py-5 text-sm font-black text-cyan-500 italic uppercase">{study.protocol_id}</td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-black text-white uppercase tracking-widest group-hover:text-cyan-400 transition-colors">{study.title}</p>
                                                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">{study.study_type}</p>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-widest">{study.sponsor_name || 'MUSB Internal'}</td>
                                            <td className="px-8 py-5">
                                                <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${study.status === 'ACTIVE' || study.status === 'RECRUITING' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white/5 text-slate-500 border-white/5'
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
        </div>
    );
}

function ComplianceModule() {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <div>
                <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Compliance <span className="text-cyan-400">& Credentials</span></h1>
                <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-xs italic text-pretty">Secure documentation for clinical trial coordination</p>
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
                                        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Verified</span>
                                    </div>
                                ) : (
                                    <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Pending</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white italic uppercase tracking-widest">{doc.label}</h4>
                                <p className="text-[10px] text-slate-500 font-bold mt-2 leading-relaxed italic">{doc.desc}</p>
                            </div>
                            <div className="mt-4 pt-6 border-t border-white/5">
                                {doc.path ? (
                                    <a
                                        href={`${API}/media/${doc.path}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full py-4 bg-white/5 hover:bg-white text-white hover:text-slate-950 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group/link"
                                    >
                                        <Globe className="w-4 h-4 group-hover/link:rotate-12 transition-transform" /> VIEW DOCUMENT
                                    </a>
                                ) : (
                                    <button className="w-full py-4 bg-amber-500/5 text-amber-500 border border-amber-500/20 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] opacity-50 cursor-not-allowed">
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
                            <p className="text-xs font-black text-white uppercase italic tracking-widest">Node Synchronization</p>
                            <p className="text-[12px] text-cyan-300/60 font-black uppercase tracking-widest mt-1">Research Terminal Status: Encrypted & Verified</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
                        <span className="text-xs font-black text-emerald-400 uppercase tracking-widest line-clamp-1 italic">Identity Authenticated</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
