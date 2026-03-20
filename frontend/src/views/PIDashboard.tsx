import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clearToken, authFetch, getRole } from '../utils/auth';
import LogoutConfirmationModal from '../components/LogoutConfirmationModal';
import SubmitContentForms from '../components/admin/SubmitContentForms';
import LaunchStudyForm from '../components/admin/LaunchStudyForm';
import SponsorsManagement from '../components/admin/SponsorsManagement';
import PIMessagesModule from '../components/pi/PIMessagesModule';
import PITeamModule from '../components/pi/PITeamModule';
import SubjectReviewModule from '../components/pi/SubjectReviewModule';
import SupportModule from '../components/pi/SupportModule';
import VisitsModule from '../components/pi/VisitsModule';
import QuestionnaireBuilder from '../components/pi/QuestionnaireBuilder';
import {
    LayoutDashboard,
    Beaker,
    Calendar,
    DraftingCompass,
    Users,
    ClipboardList,
    ShieldCheck,
    Activity,
    MessageSquare,
    FileText,
    Settings,
    TrendingUp,
    Search,
    Bell,
    ChevronDown,
    Plus,
    X,
    Filter,
    HelpCircle,
    Stethoscope,
    UsersRound,
    Clock,
    ArrowUpRight,
    LogOut,
    Globe,
    Rocket,
    Menu
} from 'lucide-react';

type PIModule = 'OVERSIGHT' | 'STUDIES' | 'TEAM' | 'PARTICIPANTS' | 'VISITS' | 'MESSAGES' | 'REPORTS' | 'SUBMIT' | 'SCREENER_BUILDER' | 'LAUNCH_STUDY' | 'SPONSORS' | 'COMPLIANCE' | 'SUPPORT';

export default function PIDashboard() {
    const [activeModule, setActiveModule] = useState<PIModule>('OVERSIGHT');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const user = localStorage.getItem('user') || sessionStorage.getItem('user');
        const role = getRole();
        
        const allowedRoles = ['PI', 'COORDINATOR', 'ONSITE'];
        if (!user || !allowedRoles.includes(role)) {
            console.warn("Unauthorized access to PI Dashboard. Redirecting...");
            navigate('/signin');
        }
    }, [navigate]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmSignOut = async () => {
        await clearToken();
        navigate('/');
        window.location.reload(); // Force full state purge
    };
    const [studies, setStudies] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudy, setSelectedStudy] = useState<any>(null);

    const fetchPIContent = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const [studiesRes, usersRes] = await Promise.all([
                authFetch(`${apiUrl}/api/studies/`),
                authFetch(`${apiUrl}/api/users/`)
            ]);
            
            if (studiesRes.ok) setStudies(await studiesRes.json());
            if (usersRes.ok) setUsers(await usersRes.json());
        } catch (e) {
            console.error("PI Data Fetch Failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPIContent();
    }, []);

    const handleCreateStudy = async (data: any) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const method = selectedStudy ? 'PATCH' : 'POST';
            const url = selectedStudy ? `${apiUrl}/api/studies/${selectedStudy.protocol_id || selectedStudy.id}/` : `${apiUrl}/api/studies/`;
            
            const res = await authFetch(url, {
                method: method,
                body: JSON.stringify(data)
            });
            if (res.ok) {
                setActiveModule('STUDIES');
                setSelectedStudy(null);
                fetchPIContent();
            } else {
                const err = await res.json();
                alert(`Operation failed: ${JSON.stringify(err)}`);
            }
        } catch (e) {
            alert("Operation failed due to network error");
        }
    };



    const navItems = [
        { id: 'WEBSITE', label: 'Main Website', icon: Globe },
        { id: 'OVERSIGHT', label: 'Scientific Oversight', icon: Activity },
        { id: 'STUDIES', label: 'My Studies', icon: Beaker },
        { id: 'LAUNCH_STUDY', label: 'LAUNCH A STUDY', icon: Rocket },
        { id: 'TEAM', label: 'Team Management', icon: Users },
        { id: 'PARTICIPANTS', label: 'Subject Review', icon: UsersRound },
        { id: 'VISITS', label: 'Visits & Assessments', icon: Calendar },
        { id: 'MESSAGES', label: 'Messages', icon: MessageSquare },
        { id: 'REPORTS', label: 'Analytics', icon: TrendingUp },
        { id: 'SUBMIT', label: 'Submit Content', icon: Plus },
        { id: 'SCREENER_BUILDER', label: 'Questionnaire Architect', icon: DraftingCompass },
        { id: 'SPONSORS', label: 'Manage Sponsors', icon: Globe },
        { id: 'COMPLIANCE', label: 'COMPLIANCE & DOCUMENTS', icon: ShieldCheck },
        { id: 'SUPPORT', label: 'Help & Support', icon: HelpCircle },
    ];

    const renderHeader = () => {
        const userStr = localStorage.getItem('user');
        let userName = 'PI';
        let userPicture = '';
        try {
            if (userStr) {
                const u = JSON.parse(userStr);
                const rawName = u.full_name || (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : (u.name || ''));
                const rawEmail = u.email || '';
                
                // Identify encrypted hashes (Fernet)
                const isEncrypted = (str: string) => str && str.startsWith('gAAAA') && str.length > 40;
                
                if (isEncrypted(rawName)) {
                    userName = rawEmail ? rawEmail.split('@')[0].toUpperCase() : 'PI';
                } else {
                    userName = rawName || (rawEmail ? rawEmail.split('@')[0] : 'PI');
                }
                
                userPicture = u.picture || u.avatar || u.avatar_url || '';
            }
        } catch (e) { }

        return (
            <header className="fixed top-0 left-0 right-0 h-20 md:h-28 z-[60] bg-[#0B101B]/80 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-4 md:px-8 lg:px-10">

                <div className="flex items-center gap-4 lg:gap-7">
                    <Link to="/" className="flex items-center group transition-all hover:scale-105 active:scale-95">
                        <div className="h-12 px-6 rounded-full bg-white flex items-center justify-center shadow-2xl group/logo overflow-hidden border border-white/10">
                            <img src="/logo.jpg" alt="MusB Research" className="h-7 w-auto object-contain" />
                        </div>
                    </Link>

                    <div className="h-8 w-px bg-white/10 hidden sm:block mx-1" />

                    <div className="flex items-center gap-2 md:gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all flex items-center justify-center h-10 w-10 hover:bg-white/10 shrink-0"
                        >
                            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>

                    </div>



                    <div className="hidden lg:flex flex-col ml-4 pl-4 border-l border-white/10">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 group-hover:text-white transition-colors">Scientific</span>
                        <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-500">Terminal Node</span>
                    </div>
                </div>



                <div className="flex items-center gap-3 md:gap-6 lg:gap-8 h-10 md:h-12">
                    <button className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl border border-white/10 transition-all text-slate-300 hover:text-white shrink-0">
                        <Bell className="w-4 h-4 md:w-5 h-5" />
                    </button>
                    
                    <div className="h-6 md:h-8 w-px bg-white/10 hidden md:block" />


                    <div className="flex items-center gap-3 md:gap-4 relative" ref={profileRef}>
                        <div className="text-right hidden lg:block">
                            <p className="text-[11px] md:text-xs font-black text-white uppercase italic leading-none tracking-tight">{userName}</p>
                            <p className="text-[8px] md:text-[9px] text-indigo-400 font-bold uppercase tracking-[0.2em] mt-1.5 opacity-80">Principal Investigator</p>
                        </div>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-indigo-500/50 transition-all active:scale-95 shadow-lg group shrink-0"
                        >
                            <img
                                src={userPicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4f46e5&color=fff`}

                                alt="PI"
                                className="w-full h-full object-cover grayscale transition-all group-hover:grayscale-0"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4f46e5&color=fff`;
                                }}
                            />
                        </button>


                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-4 w-56 bg-[#0B101B] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 overflow-hidden"
                                >
                                    <div className="p-3 border-b border-white/5 mb-2">
                                        <p className="text-xs font-bold text-white truncate">{userName}</p>
                                        <p className="text-[9px] text-slate-500 truncate">{JSON.parse(localStorage.getItem('user') || '{}').email}</p>
                                    </div>
                                    <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-100 hover:text-white hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest">
                                        <LogOut className="w-4 h-4" /> Sign Out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>
        );
    };

    return (
        <div className="min-h-screen bg-transparent">
            {renderHeader()}

            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[55] lg:hidden"
                    />
                )}
            </AnimatePresence>

            <aside className={`fixed left-0 top-28 bottom-0 w-80 bg-[#0B101B]/95 lg:bg-[#0B101B]/40 backdrop-blur-3xl border-r border-white/5 p-6 z-[56] transition-transform duration-300 lg:translate-x-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <nav className="space-y-1.5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.id === 'WEBSITE') navigate('/');
                                else {
                                    setActiveModule(item.id as PIModule);
                                    setIsSidebarOpen(false);
                                }
                            }}
                            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${activeModule === item.id
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                    : 'text-slate-500 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <div className="w-10 flex items-center justify-center flex-shrink-0">
                                <item.icon className={`w-4 h-4 ${activeModule === item.id ? 'text-white' : 'text-slate-600 group-hover:text-indigo-400'}`} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-left leading-tight break-words">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
                    <button onClick={handleSignOut} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all group">
                        <div className="w-10 flex items-center justify-center flex-shrink-0">
                            <LogOut className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest italic">Terminate Session</span>
                    </button>
                </div>
            </aside>


            <main className="lg:ml-80 pt-36 pb-24 px-4 lg:px-10 overflow-x-hidden">
                <AnimatePresence mode="wait">
                    {activeModule === 'OVERSIGHT' && <OversightModule studyCount={studies.length} onLaunch={() => setActiveModule('LAUNCH_STUDY')} />}
                    {activeModule === 'COMPLIANCE' && <ComplianceModule />}
                    {activeModule === 'STUDIES' && (
                        <StudyOverviewModule 
                            studies={studies} 
                            onAdd={() => setActiveModule('LAUNCH_STUDY')} 
                            onEdit={(s) => {
                                setSelectedStudy(s);
                                setActiveModule('LAUNCH_STUDY');
                            }}
                        />
                    )}
                    {activeModule === 'LAUNCH_STUDY' && (
                        <LaunchStudyForm 
                            onClose={() => {
                                setActiveModule('STUDIES');
                                setSelectedStudy(null);
                            }}
                            initialData={selectedStudy}
                            onSave={handleCreateStudy}
                            availablePIs={users.filter(u => u.role === 'PI')}
                            availableCoordinators={users.filter(u => u.role === 'COORDINATOR')}
                            availableSponsors={users.filter(u => u.role === 'SPONSOR')}
                        />
                    )}
                    {activeModule === 'SUBMIT' && <SubmitContentForms userRole="PI" />}
                    {activeModule === 'SCREENER_BUILDER' && <QuestionnaireBuilder />}
                    { activeModule === 'MESSAGES' && <PIMessagesModule /> }
                    { activeModule === 'TEAM' && <PITeamModule /> }
                    { activeModule === 'PARTICIPANTS' && <SubjectReviewModule /> }
                    { activeModule === 'VISITS' && <VisitsModule /> }
                    { activeModule === 'SUPPORT' && <SupportModule /> }
                    { activeModule === 'SPONSORS' && (
                        <SponsorsManagement 
                            allUsers={users} 
                            allStudies={studies} 
                            onRefresh={fetchPIContent} 
                        />
                    )}
                </AnimatePresence>
            </main>



            <LogoutConfirmationModal 
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmSignOut}
            />
        </div>
    );
}

function OversightModule({ studyCount, onLaunch }: { studyCount: number, onLaunch: () => void }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter line-clamp-2 leading-none">
                        Scientific <span className="text-indigo-400">Oversight</span>
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-3 italic">
                        Portfolio Performance & clinical research velocity
                    </p>
                </div>
                <button 
                    onClick={onLaunch}
                    className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3 shadow-2xl shadow-indigo-900/40 hover:scale-[1.05] active:scale-95 transition-all font-mono"
                >
                    <Rocket className="w-5 h-5" /> LAUNCH A STUDY
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                { [
                    { label: 'Active Protocols', val: studyCount.toString().padStart(2, '0'), icon: Beaker, color: 'indigo' },
                    { label: 'Total Subjects', val: '1,240', icon: UsersRound, color: 'emerald' },
                    { label: 'Critical Alerts', val: '02', icon: Activity, color: 'red' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between min-h-[280px] group hover:border-white/10 transition-all">
                        <div className={`w-16 h-16 rounded-[1.5rem] bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                            <stat.icon className={`w-8 h-8 text-${stat.color}-400`} />
                        </div>
                        <div className="mt-8">
                            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic mb-3">{stat.label}</h4>
                            <p className="text-6xl font-black text-white italic tracking-tighter leading-none">{stat.val}</p>
                        </div>
                    </div>
                ))}

            </div>
        </motion.div>
    );
}

function StudyOverviewModule({ studies, onAdd, onEdit }: { studies: any[], onAdd: () => void, onEdit: (s: any) => void }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Research <span className="text-indigo-400">Portfolio</span></h2>
                <button onClick={onAdd} className="px-8 py-4 bg-indigo-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3 shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-all">
                    <Rocket className="w-4 h-4" /> LAUNCH A STUDY
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {studies.length === 0 ? (
                    <div className="col-span-2 py-20 bg-white/5 border border-dashed border-white/10 rounded-[3rem] text-center">
                        <p className="text-slate-500 font-bold uppercase tracking-widest">No assigned protocols found</p>
                    </div>
                ) : studies.map((study, i) => (
                    <div key={i} className="bg-[#0B101B]/40 border border-white/10 rounded-[3rem] p-10 space-y-8 relative group hover:border-indigo-500/30 transition-all">
                        <div className="flex justify-between items-start">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <Beaker className="w-7 h-7" />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="px-5 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">{study.status}</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter truncate">{study.title}</h3>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2 italic">Protocol #{study.protocol_id}</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 p-5 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-[8px] font-black text-slate-500 uppercase">Screened</p>
                                <p className="text-lg font-black text-white italic mt-1">{study.actual_screened}</p>
                            </div>
                            <div className="flex-1 p-5 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-[8px] font-black text-slate-500 uppercase">Target</p>
                                <p className="text-lg font-black text-indigo-400 italic mt-1">{study.target_screened}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => onEdit(study)}
                            className="w-full py-4 bg-white/5 border border-white/5 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-950 transition-all"
                        >
                            Configure Protocol
                        </button>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

function ComplianceModule() {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <div>
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
                    Compliance <span className="text-indigo-400">& Credentials</span>
                </h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-3 italic">
                    Verified professional documentation and node synchronization
                </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/5 blur-[100px] rounded-full group-hover:bg-indigo-500/10 transition-colors duration-1000" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    {[
                        { id: 'medical_licence', label: 'Medical Licence', path: user.medical_licence, desc: 'Official state-issued medical practice authorization' },
                        { id: 'insurance_certificate', label: 'Professional Insurance', path: user.insurance_certificate, desc: 'Coverage for clinical trial liability and oversight' },
                        { id: 'cv_document', label: 'Curriculum Vitae', path: user.cv_document, desc: 'Up-to-date professional history and research experience' }
                    ].map((doc, i) => (
                        <div key={i} className="bg-[#0B101B]/60 border border-white/5 rounded-[2.5rem] p-8 space-y-6 hover:border-indigo-500/30 transition-all flex flex-col">
                            <div className="flex justify-between items-center">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
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
                                        href={`${import.meta.env.VITE_API_URL}/media/${doc.path}`}
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

                <div className="mt-12 p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-white uppercase italic tracking-widest">Authorization Status</p>
                            <p className="text-[10px] text-indigo-300/60 font-black uppercase tracking-widest mt-1">Global Scientific Network Verification</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
                        <span className="text-xs font-black text-emerald-400 uppercase tracking-widest line-clamp-1 italic">Synchronization Complete</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
